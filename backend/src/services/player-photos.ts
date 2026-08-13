import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { players, teams } from "../db/schema.js";
import { env } from "../config/env.js";
import { searchPlayers, type TsdbPlayer } from "./thesportsdb.js";

/**
 * Backfills `players.photo_url` from TheSportsDB.
 *
 * football-data.org is our system of record for squads but exposes no player
 * imagery at all, so photos have to come from a second source. There is no
 * shared identifier between the two, which leaves name matching — hence the
 * normalisation and the deliberately conservative candidate rules below.
 *
 * The job is budgeted (PLAYER_PHOTO_BATCH_SIZE) and resumable: it only looks at
 * players that still have no photo and haven't been checked recently, so a
 * large squad table fills in over several runs instead of one huge burst.
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
 * Choose which search result to trust.
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

export interface PhotoSyncResult {
  scanned: number;
  matched: number;
  missed: number;
  failed: number;
}

/**
 * Fetch photos for up to `limit` players that still lack one.
 * Returns counts rather than throwing, so a partial run is still useful.
 */
export async function syncPlayerPhotos(
  limit = env.PLAYER_PHOTO_BATCH_SIZE,
): Promise<PhotoSyncResult> {
  const cutoff = new Date(Date.now() - RECHECK_AFTER_DAYS * 86_400_000);

  const rows = await db
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

  const result: PhotoSyncResult = { scanned: 0, matched: 0, missed: 0, failed: 0 };

  for (const row of rows) {
    result.scanned += 1;
    try {
      const candidates = await searchPlayers(row.fullName);
      const hit = pickCandidate(candidates, row.teamName, row.fullName);
      const photoUrl = hit ? imageOf(hit) : null;

      // Stamp the check either way — an unstamped miss would be re-queried on
      // every run and permanently crowd out players we haven't tried yet.
      await db
        .update(players)
        .set({ photoUrl: photoUrl ?? undefined, photoCheckedAt: new Date() })
        .where(eq(players.id, row.id));

      if (photoUrl) result.matched += 1;
      else result.missed += 1;
    } catch (err) {
      result.failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[photos] ${row.fullName} failed:`, msg);
      // Being rate-limited won't fix itself mid-run; stop and resume next tick.
      if (msg.includes("429")) {
        console.warn("[photos] rate limited — stopping this run early");
        break;
      }
    }
  }

  return result;
}
