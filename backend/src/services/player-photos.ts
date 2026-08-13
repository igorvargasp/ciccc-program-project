import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { players, teams } from "../db/schema.js";
import { env } from "../config/env.js";
import {
  lookupAllPlayers,
  searchPlayers,
  searchTeam,
  type TsdbPlayer,
} from "./thesportsdb.js";
import { fetchPhotos, findEntityId } from "./wikidata.js";

/**
 * Backfills `players.photo_url`.
 *
 * football-data.org is our system of record for squads but exposes no player
 * imagery at all, so photos come from elsewhere. There is no shared identifier
 * between the sources, which leaves name matching — hence the normalisation and
 * the deliberately conservative candidate rules below.
 *
 * Sources run in order of cost, cheapest first, and each only sees the players
 * the previous one couldn't place:
 *
 *   1. Wikidata/Commons — no request quota, freely licensed, lower coverage.
 *   2. TheSportsDB squad listings — one request per team, sparse rosters.
 *   3. TheSportsDB player search — one request per player, best coverage, and
 *      the only source with a hard quota, so it goes last and sees the least.
 *
 * The job is budgeted (PLAYER_PHOTO_BATCH_SIZE) and resumable: it only
 * considers players that still have no photo and haven't been checked recently.
 */

/** Retry a player that produced no photo only after this long. */
const RECHECK_AFTER_DAYS = 30;

const SPECIALS: Record<string, string> = {
  Ø: "O", ø: "o", Ð: "D", ð: "d", Þ: "T", þ: "t",
  Ł: "L", ł: "l", Đ: "D", đ: "d", ß: "ss", Æ: "AE", æ: "ae", Œ: "OE", œ: "oe",
};

/** Lowercase, strip diacritics and punctuation so "Jurriën" == "Jurrien". */
export function normalizeName(s: string): string {
  return s
    .replace(/[ØøÐðÞþŁłĐđßÆæŒœ]/g, (c) => SPECIALS[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Drop club-name decorations before comparing. football-data returns
 * "Arsenal FC" where TheSportsDB has plain "Arsenal", and the difference is not
 * cosmetic: searching the decorated form returns a Romanian third-division club.
 */
export function normalizeTeamName(s: string): string {
  return normalizeName(s)
    .replace(
      /\b(fc|cf|afc|sc|ac|as|ss|ssc|rc|cd|ud|bsc|vfl|vfb|tsg|fsv|sv|us|sk|club|de|futbol|football)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function imageOf(p: TsdbPlayer): string | null {
  // Cutouts are transparent PNGs, which sit better on the lineup pitch than a
  // square thumbnail; fall back to the thumb when there's no cutout.
  return p.strCutout || p.strThumb || null;
}

/**
 * Choose which TheSportsDB result to trust.
 *
 * A club mismatch does NOT imply the wrong person — TheSportsDB's club data
 * lags transfers (Christian Nørgaard still reads "Everton" while football-data
 * has him at Arsenal), and rejecting on that would throw away correct photos.
 * So the club is only used to break ties, and ambiguity loses: a wrong face is
 * worse than a missing one, since the UI already falls back to initials.
 */
export function pickCandidate(
  candidates: TsdbPlayer[],
  expectedTeam: string | null,
  fullName: string,
): TsdbPlayer | null {
  const withImages = candidates.filter(imageOf);
  if (withImages.length === 0) return null;
  if (withImages.length === 1) return withImages[0];

  if (expectedTeam) {
    const want = normalizeTeamName(expectedTeam);
    const sameClub = withImages.filter(
      (p) => p.strTeam && normalizeTeamName(p.strTeam) === want,
    );
    if (sameClub.length === 1) return sameClub[0];
    if (sameClub.length > 1) return null; // two same-named players at one club
  }

  // No club signal: accept only an unambiguous exact name match.
  const want = normalizeName(fullName);
  const exact = withImages.filter((p) => normalizeName(p.strPlayer) === want);
  return exact.length === 1 ? exact[0] : null;
}

// ─────────────────────────── Source chain ───────────────────────────

interface Candidate {
  id: string;
  fullName: string;
  teamName: string | null;
}

export type PhotoSource = "wikidata" | "thesportsdb";

interface Found {
  url: string;
  source: PhotoSource;
}

interface SourceResult {
  found: Map<string, Found>;
  /**
   * Players this source actually reached. A source that aborts on a rate limit
   * leaves the rest untouched, and those must not be recorded as checked — a
   * player skipped that way has not been looked for, only queued behind a
   * quota, and stamping it would hide it for RECHECK_AFTER_DAYS.
   */
  attempted: Set<string>;
}

type SourceFn = (players: Candidate[]) => Promise<SourceResult>;

const isRateLimited = (err: unknown) =>
  err instanceof Error && err.message.includes("429");

/** Tier 1 — Wikidata/Commons. No quota, so it gets first pass at everything. */
const fromWikidata: SourceFn = async (candidates) => {
  const found = new Map<string, Found>();
  const attempted = new Set<string>();

  // Resolve names to entity ids first, then batch the claim lookups (50 per
  // request) rather than paying a round trip per player.
  const byEntity = new Map<string, Candidate>();
  for (const c of candidates) {
    try {
      const id = await findEntityId(c.fullName);
      attempted.add(c.id);
      // First writer wins: if two players resolve to the same entity, neither
      // is trustworthy, so drop the later one rather than guess.
      if (id && !byEntity.has(id)) byEntity.set(id, c);
    } catch (err) {
      // The client already retries 429s with backoff, so reaching here means
      // the lookup genuinely failed — leave the player unattempted to retry.
      console.error(`[photos] wikidata search "${c.fullName}":`, err instanceof Error ? err.message : err);
    }
  }

  if (byEntity.size === 0) return { found, attempted };

  const photos = await fetchPhotos([...byEntity.keys()]);
  for (const [entityId, photo] of photos) {
    const c = byEntity.get(entityId);
    if (c) found.set(c.id, { url: photo.url, source: "wikidata" });
  }
  return { found, attempted };
};

/** Tier 2 — TheSportsDB squad listings: one request per club, not per player. */
const fromTsdbSquads: SourceFn = async (candidates) => {
  const found = new Map<string, Found>();
  const attempted = new Set<string>();

  const byTeam = new Map<string, Candidate[]>();
  for (const c of candidates) {
    if (!c.teamName) continue;
    const list = byTeam.get(c.teamName) ?? [];
    list.push(c);
    byTeam.set(c.teamName, list);
  }

  // Players with no club can't be looked up this way, so this source is done
  // with them — mark them attempted rather than blocking the run's stamping.
  for (const c of candidates) if (!c.teamName) attempted.add(c.id);

  for (const [teamName, members] of byTeam) {
    try {
      const team = await searchTeam(normalizeTeamName(teamName));
      for (const c of members) attempted.add(c.id);
      if (!team) continue;
      const squad = await lookupAllPlayers(team.idTeam);
      if (!squad.length) continue;

      const index = new Map(squad.map((p) => [normalizeName(p.strPlayer), p]));
      for (const c of members) {
        const hit = index.get(normalizeName(c.fullName));
        const url = hit ? imageOf(hit) : null;
        if (url) found.set(c.id, { url, source: "thesportsdb" });
      }
    } catch (err) {
      console.error(`[photos] tsdb squad "${teamName}":`, err instanceof Error ? err.message : err);
      if (isRateLimited(err)) {
        // Everything past here is unexamined, not unfound.
        console.warn("[photos] tsdb rate limited — skipping remaining squads");
        for (const c of members) attempted.delete(c.id);
        break;
      }
    }
  }
  return { found, attempted };
};

/** Tier 3 — TheSportsDB per-player search. Best coverage, hard quota, so last. */
const fromTsdbSearch: SourceFn = async (candidates) => {
  const found = new Map<string, Found>();
  const attempted = new Set<string>();

  for (const c of candidates) {
    try {
      const hit = pickCandidate(await searchPlayers(c.fullName), c.teamName, c.fullName);
      attempted.add(c.id);
      const url = hit ? imageOf(hit) : null;
      if (url) found.set(c.id, { url, source: "thesportsdb" });
    } catch (err) {
      console.error(`[photos] tsdb search "${c.fullName}":`, err instanceof Error ? err.message : err);
      // A cumulative quota won't refill mid-run; stop and resume next tick.
      // Everyone from here on is unexamined, so they stay unattempted.
      if (isRateLimited(err)) {
        console.warn("[photos] tsdb rate limited — stopping this source early");
        break;
      }
    }
  }
  return { found, attempted };
};

const SOURCES: { name: string; run: SourceFn }[] = [
  { name: "wikidata", run: fromWikidata },
  { name: "tsdb-squads", run: fromTsdbSquads },
  { name: "tsdb-search", run: fromTsdbSearch },
];

export interface PhotoSyncResult {
  scanned: number;
  matched: number;
  missed: number;
  /** Missed players a source never reached; left unstamped for the next run. */
  deferred: number;
  bySource: Record<string, number>;
}

/**
 * Fetch photos for up to `limit` players that still lack one.
 * Returns counts rather than throwing, so a partial run is still useful.
 */
export async function backfillPlayerPhotos(
  limit = env.PLAYER_PHOTO_BATCH_SIZE,
): Promise<PhotoSyncResult> {
  const cutoff = new Date(Date.now() - RECHECK_AFTER_DAYS * 86_400_000);

  const candidates: Candidate[] = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      teamName: teams.name,
    })
    .from(players)
    .leftJoin(teams, eq(players.teamId, teams.id))
    .where(
      and(
        isNull(players.photoUrl),
        or(isNull(players.photoCheckedAt), lt(players.photoCheckedAt, cutoff)),
      ),
    )
    .limit(limit);

  const found = new Map<string, Found>();
  const bySource: Record<string, number> = {};
  // A player counts as checked only once every source has had its turn.
  const exhausted = new Map<string, number>();

  for (const source of SOURCES) {
    const remaining = candidates.filter((c) => !found.has(c.id));
    if (remaining.length === 0) break;

    try {
      const { found: hits, attempted } = await source.run(remaining);
      for (const [id, hit] of hits) found.set(id, hit);
      for (const id of attempted) exhausted.set(id, (exhausted.get(id) ?? 0) + 1);
      bySource[source.name] = hits.size;
      console.log(
        `[photos] ${source.name}: ${hits.size}/${remaining.length}` +
          (attempted.size < remaining.length
            ? ` (${remaining.length - attempted.size} not reached)`
            : ""),
      );
    } catch (err) {
      // One source failing shouldn't cost us the others, and nothing it never
      // reached should be recorded as checked.
      bySource[source.name] = 0;
      console.error(`[photos] ${source.name} failed:`, err instanceof Error ? err.message : err);
    }
  }

  const checkedAt = new Date();
  let deferred = 0;

  for (const c of candidates) {
    const hit = found.get(c.id);
    // Stamp a hit, or a miss that every source genuinely looked for. A player
    // a source never reached stays unstamped so the next run picks it up
    // instead of hiding it for RECHECK_AFTER_DAYS.
    const fullyChecked = (exhausted.get(c.id) ?? 0) === SOURCES.length;
    if (!hit && !fullyChecked) {
      deferred += 1;
      continue;
    }

    await db
      .update(players)
      .set({
        photoUrl: hit?.url ?? undefined,
        photoSource: hit?.source ?? undefined,
        photoCheckedAt: checkedAt,
      })
      .where(eq(players.id, c.id));
  }

  if (deferred) console.log(`[photos] ${deferred} deferred to a later run`);

  return {
    scanned: candidates.length,
    matched: found.size,
    missed: candidates.length - found.size,
    deferred,
    bySource,
  };
}
