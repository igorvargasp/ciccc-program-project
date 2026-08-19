import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import { matchEvents, matchStats, matches, teams } from "../db/schema.js";
import { normalizeTeamName } from "./player-photos.js";
import {
  eventsOnDay,
  lookupEventStats,
  lookupTimeline,
  type TsdbEvent,
} from "./thesportsdb.js";

/**
 * Fills `match_events` and `match_stats` from TheSportsDB.
 *
 * football-data.org's free plan returns the score but no events at all — no
 * `goals`, `bookings` or `statistics` — so a match report can't be built from
 * it. TheSportsDB publishes both for the major competitions.
 *
 * The two providers share no identifiers, so fixtures are matched on kickoff
 * date plus both clubs. That's a far tighter key than the name matching used
 * for player photos: a date pins it to roughly a hundred fixtures worldwide,
 * and both club names then have to agree.
 *
 * Work is organised per day rather than per match, because one `eventsday`
 * call covers every fixture that day.
 */

/** Days to look back when no explicit range is given. */
const DEFAULT_LOOKBACK_DAYS = 7;

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** "Goal" / "Card" / "subst" → our event vocabulary. */
function mapEventType(
  timeline: string,
  detail: string | null | undefined,
): "goal" | "yellow" | "red" | "sub" | null {
  const kind = timeline.toLowerCase();
  const info = (detail ?? "").toLowerCase();

  if (kind === "goal") return "goal";
  if (kind === "card") {
    if (info.includes("red")) return "red";
    if (info.includes("yellow")) return "yellow";
    return null;
  }
  if (kind.startsWith("subst")) return "sub";
  return null;
}

/** Both clubs must agree before we accept a fixture as the same match. */
function sameFixture(
  event: TsdbEvent,
  home: string,
  away: string,
): boolean {
  const eHome = normalizeTeamName(event.strHomeTeam ?? "");
  const eAway = normalizeTeamName(event.strAwayTeam ?? "");
  if (!eHome || !eAway) return false;

  const ourHome = normalizeTeamName(home);
  const ourAway = normalizeTeamName(away);

  // Providers disagree on how much of a club's name they carry ("Internacional"
  // vs "SC Internacional"), so accept containment either way — but require it
  // on both sides, which is what keeps this from mismatching.
  const agrees = (a: string, b: string) =>
    a === b || a.includes(b) || b.includes(a);

  return agrees(eHome, ourHome) && agrees(eAway, ourAway);
}

export interface EventSyncResult {
  days: number;
  matchesConsidered: number;
  matched: number;
  eventsStored: number;
  statsStored: number;
  withoutData: number;
}

/**
 * Backfill events for finished matches. Only touches matches that have none,
 * so it is resumable and cheap to re-run.
 */
export async function syncMatchEvents(opts?: {
  lookbackDays?: number;
  maxMatches?: number;
}): Promise<EventSyncResult> {
  const lookback = opts?.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const maxMatches = opts?.maxMatches ?? 60;

  const homeAlias = alias(teams, "home_team");
  const awayAlias = alias(teams, "away_team");

  const since = new Date(Date.now() - lookback * 86_400_000);

  // Finished matches that have no events yet. The NOT EXISTS keeps re-runs
  // from re-fetching a match we've already reported on.
  const pending = await db
    .select({
      id: matches.id,
      kickoffAt: matches.kickoffAt,
      home: homeAlias.name,
      away: awayAlias.name,
    })
    .from(matches)
    .innerJoin(homeAlias, eq(matches.homeTeamId, homeAlias.id))
    .innerJoin(awayAlias, eq(matches.awayTeamId, awayAlias.id))
    .where(
      and(
        eq(matches.status, "finished"),
        isNotNull(matches.kickoffAt),
        sql`${matches.kickoffAt} >= ${since.toISOString()}`,
        sql`NOT EXISTS (SELECT 1 FROM match_events e WHERE e.match_id = ${matches.id})`,
      ),
    )
    .orderBy(asc(matches.kickoffAt))
    .limit(maxMatches);

  const result: EventSyncResult = {
    days: 0,
    matchesConsidered: pending.length,
    matched: 0,
    eventsStored: 0,
    statsStored: 0,
    withoutData: 0,
  };
  if (!pending.length) return result;

  // Group by kickoff day so each day costs a single eventsday call.
  const byDay = new Map<string, typeof pending>();
  for (const m of pending) {
    const day = isoDay(new Date(m.kickoffAt!));
    byDay.set(day, [...(byDay.get(day) ?? []), m]);
  }
  result.days = byDay.size;

  for (const [day, dayMatches] of byDay) {
    let dayEvents: TsdbEvent[];
    try {
      dayEvents = await eventsOnDay(day);
    } catch (err) {
      console.error(`[events] ${day} failed:`, err instanceof Error ? err.message : err);
      continue;
    }

    for (const m of dayMatches) {
      const hit = dayEvents.find((e) => sameFixture(e, m.home, m.away));
      if (!hit) continue;
      result.matched += 1;

      try {
        const timeline = await lookupTimeline(hit.idEvent);
        if (!timeline.length) {
          // Coverage thins out below the major leagues; that's not an error.
          result.withoutData += 1;
        }

        for (const entry of timeline) {
          const type = mapEventType(entry.strTimeline, entry.strTimelineDetail);
          if (!type) continue;

          await db
            .insert(matchEvents)
            .values({
              matchId: m.id,
              type,
              minute: entry.intTime ? Number(entry.intTime) : null,
              detail: entry.strTimelineDetail ?? null,
              playerName: entry.strPlayer ?? null,
              assistName: entry.strAssist ?? null,
              isHome: entry.strHome === "Yes",
              externalApiId: entry.idTimeline,
            })
            .onConflictDoNothing({ target: matchEvents.externalApiId });
          result.eventsStored += 1;
        }

        const stats = await lookupEventStats(hit.idEvent);
        for (const s of stats) {
          if (!s.strStat) continue;
          await db
            .insert(matchStats)
            .values({
              matchId: m.id,
              stat: s.strStat,
              home: s.intHome != null ? Number(s.intHome) : null,
              away: s.intAway != null ? Number(s.intAway) : null,
            })
            .onConflictDoUpdate({
              target: [matchStats.matchId, matchStats.stat],
              set: {
                home: s.intHome != null ? Number(s.intHome) : null,
                away: s.intAway != null ? Number(s.intAway) : null,
              },
            });
          result.statsStored += 1;
        }
      } catch (err) {
        console.error(
          `[events] ${m.home} vs ${m.away}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  return result;
}
