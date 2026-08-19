import { Router } from "express";
import { and, asc, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { alias } from "drizzle-orm/pg-core";
import {
  matches,
  matchEvents,
  matchStats,
  players,
  seasons,
  standings,
  competitions,
  teams,
} from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";

export const matchesRouter = Router();

const listQuery = z.object({
  teamId: z.string().uuid().optional(),
  seasonId: z.string().uuid().optional(),
  competitionId: z.string().uuid().optional(),
  status: z.enum(["scheduled", "live", "finished"]).optional(),
  matchday: z.coerce.number().int().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/matches — calendar / history with filters
matchesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = listQuery.parse(req.query);

    const filters = [];
    if (q.teamId)
      filters.push(
        or(eq(matches.homeTeamId, q.teamId), eq(matches.awayTeamId, q.teamId)),
      );
    if (q.seasonId) filters.push(eq(matches.seasonId, q.seasonId));
    if (q.competitionId) {
      const seasonIds = (await db
        .select({ id: seasons.id })
        .from(seasons)
        .where(eq(seasons.competitionId, q.competitionId)))
        .map((s) => s.id);
      if (seasonIds.length) filters.push(inArray(matches.seasonId, seasonIds));
      else { res.json({ data: [] }); return; }
    }
    if (q.status) filters.push(eq(matches.status, q.status));
    if (q.matchday) filters.push(eq(matches.matchday, q.matchday));
    if (q.from) filters.push(gte(matches.kickoffAt, q.from));
    if (q.to) filters.push(lte(matches.kickoffAt, q.to));

    // Upcoming matches ascending; everything else most-recent first.
    const orderBy =
      q.status === "scheduled"
        ? asc(matches.kickoffAt)
        : desc(matches.kickoffAt);

    // Competition and both clubs come back with every match: the calendar
    // groups by competition and renders crests, and without them the UI can
    // only fall back to placeholder names.
    const homeTeamAlias = alias(teams, "home_team");
    const awayTeamAlias = alias(teams, "away_team");

    const rows = await db
      .select({
        match: matches,
        competition: {
          id: competitions.id,
          name: competitions.name,
          logoUrl: competitions.logoUrl,
        },
        season: { id: seasons.id, label: seasons.label },
        homeTeam: {
          id: homeTeamAlias.id,
          name: homeTeamAlias.name,
          shortName: homeTeamAlias.shortName,
          crestUrl: homeTeamAlias.crestUrl,
        },
        awayTeam: {
          id: awayTeamAlias.id,
          name: awayTeamAlias.name,
          shortName: awayTeamAlias.shortName,
          crestUrl: awayTeamAlias.crestUrl,
        },
      })
      .from(matches)
      .leftJoin(seasons, eq(matches.seasonId, seasons.id))
      .leftJoin(competitions, eq(seasons.competitionId, competitions.id))
      .leftJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
      .leftJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(orderBy)
      .limit(q.limit);

    res.json({
      data: rows.map((r) => ({
        ...r.match,
        competition: r.competition,
        season: r.season,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
      })),
    });
  }),
);

/**
 * GET /api/matches/:id/context — everything worth knowing about a fixture that
 * isn't the fixture itself: recent form, the sides' head-to-head record, and
 * where they sit in the table.
 *
 * All of it is derived from matches we already hold, so it costs no external
 * requests and works for upcoming fixtures, where there is nothing to report
 * on yet.
 */
matchesRouter.get(
  "/:id/context",
  asyncHandler(async (req, res) => {
    const [match] = await db
      .select({
        id: matches.id,
        seasonId: matches.seasonId,
        homeTeamId: matches.homeTeamId,
        awayTeamId: matches.awayTeamId,
        kickoffAt: matches.kickoffAt,
      })
      .from(matches)
      .where(eq(matches.id, req.params.id))
      .limit(1);

    if (!match) throw notFound("Match");

    const { homeTeamId, awayTeamId } = match;
    const before = match.kickoffAt ?? new Date();

    /** Last finished matches for a team, most recent first. */
    const recentFor = (teamId: string) =>
      db
        .select({
          id: matches.id,
          kickoffAt: matches.kickoffAt,
          homeTeamId: matches.homeTeamId,
          awayTeamId: matches.awayTeamId,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
        })
        .from(matches)
        .where(
          and(
            eq(matches.status, "finished"),
            or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId)),
            lte(matches.kickoffAt, before),
          ),
        )
        .orderBy(desc(matches.kickoffAt))
        .limit(5);

    const [homeRecent, awayRecent, headToHead, table] = await Promise.all([
      recentFor(homeTeamId),
      recentFor(awayTeamId),
      // Meetings between these two, whichever way round they were played.
      db
        .select({
          id: matches.id,
          kickoffAt: matches.kickoffAt,
          homeTeamId: matches.homeTeamId,
          awayTeamId: matches.awayTeamId,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
        })
        .from(matches)
        .where(
          and(
            eq(matches.status, "finished"),
            or(
              and(
                eq(matches.homeTeamId, homeTeamId),
                eq(matches.awayTeamId, awayTeamId),
              ),
              and(
                eq(matches.homeTeamId, awayTeamId),
                eq(matches.awayTeamId, homeTeamId),
              ),
            ),
          ),
        )
        .orderBy(desc(matches.kickoffAt))
        .limit(10),
      match.seasonId
        ? db
            .select({
              teamId: standings.teamId,
              position: standings.position,
              points: standings.points,
              played: standings.played,
            })
            .from(standings)
            .where(
              and(
                eq(standings.seasonId, match.seasonId),
                eq(standings.isSimulated, false),
                inArray(standings.teamId, [homeTeamId, awayTeamId]),
              ),
            )
        : Promise.resolve([]),
    ]);

    /** W/D/L from the perspective of `teamId`. */
    const resultFor = (m: (typeof homeRecent)[number], teamId: string) => {
      if (m.homeScore == null || m.awayScore == null) return null;
      const isHome = m.homeTeamId === teamId;
      const own = isHome ? m.homeScore : m.awayScore;
      const other = isHome ? m.awayScore : m.homeScore;
      return own > other ? "W" : own < other ? "L" : "D";
    };

    const formOf = (rows: typeof homeRecent, teamId: string) =>
      rows.map((m) => ({
        matchId: m.id,
        kickoffAt: m.kickoffAt,
        result: resultFor(m, teamId),
        scored: m.homeTeamId === teamId ? m.homeScore : m.awayScore,
        conceded: m.homeTeamId === teamId ? m.awayScore : m.homeScore,
      }));

    const h2hSummary = headToHead.reduce(
      (acc, m) => {
        const r = resultFor(m, homeTeamId);
        if (r === "W") acc.homeWins += 1;
        else if (r === "L") acc.awayWins += 1;
        else if (r === "D") acc.draws += 1;
        return acc;
      },
      { homeWins: 0, awayWins: 0, draws: 0 },
    );

    res.json({
      data: {
        form: {
          home: formOf(homeRecent, homeTeamId),
          away: formOf(awayRecent, awayTeamId),
        },
        headToHead: {
          ...h2hSummary,
          matches: headToHead,
        },
        standings: {
          home: table.find((r) => r.teamId === homeTeamId) ?? null,
          away: table.find((r) => r.teamId === awayTeamId) ?? null,
        },
      },
    });
  }),
);

// GET /api/matches/:id — match detail with events and competition info
matchesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    // The detail view renders both clubs with their crests, so join them here
    // as the list endpoint does — otherwise the match report has no teams.
    const homeTeamAlias = alias(teams, "home_team");
    const awayTeamAlias = alias(teams, "away_team");

    const [match] = await db
      .select({
        match: matches,
        competition: {
          id: competitions.id,
          name: competitions.name,
          logoUrl: competitions.logoUrl,
        },
        season: { id: seasons.id, label: seasons.label },
        homeTeam: {
          id: homeTeamAlias.id,
          name: homeTeamAlias.name,
          shortName: homeTeamAlias.shortName,
          crestUrl: homeTeamAlias.crestUrl,
        },
        awayTeam: {
          id: awayTeamAlias.id,
          name: awayTeamAlias.name,
          shortName: awayTeamAlias.shortName,
          crestUrl: awayTeamAlias.crestUrl,
        },
      })
      .from(matches)
      .leftJoin(seasons, eq(matches.seasonId, seasons.id))
      .leftJoin(competitions, eq(seasons.competitionId, competitions.id))
      .leftJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
      .leftJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
      .where(eq(matches.id, req.params.id))
      .limit(1);

    if (!match) throw notFound("Match");

    // Join the player through so the report can show a face without a second
    // round trip per event.
    const eventPlayer = alias(players, "event_player");

    const [events, stats] = await Promise.all([
      db
        .select({
          id: matchEvents.id,
          type: matchEvents.type,
          minute: matchEvents.minute,
          detail: matchEvents.detail,
          playerName: matchEvents.playerName,
          assistName: matchEvents.assistName,
          isHome: matchEvents.isHome,
          playerId: matchEvents.playerId,
          assistPlayerId: matchEvents.assistPlayerId,
          playerPhotoUrl: eventPlayer.photoUrl,
        })
        .from(matchEvents)
        .leftJoin(eventPlayer, eq(matchEvents.playerId, eventPlayer.id))
        .where(eq(matchEvents.matchId, match.match.id))
        .orderBy(asc(matchEvents.minute)),
      db
        .select({ stat: matchStats.stat, home: matchStats.home, away: matchStats.away })
        .from(matchStats)
        .where(eq(matchStats.matchId, match.match.id))
        .orderBy(asc(matchStats.stat)),
    ]);

    res.json({
      data: {
        ...match.match,
        competition: match.competition,
        season: match.season,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        events,
        stats,
      },
    });
  }),
);
