import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

/**
 * Thin client for TheSportsDB v1, used only to source player photos —
 * football-data.org has no image field for people (its CDN serves club crests,
 * competition emblems and country flags, nothing else).
 *
 * The free tier is generous but undocumented, so every call goes through the
 * same style of shared throttle as the football-data client.
 */

const BASE_URL = "https://www.thesportsdb.com/api/v1/json";
const MIN_INTERVAL_MS = 1_600; // ~37 requests/minute

let nextAvailableAt = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, nextAvailableAt - now);
  // Reserve the slot synchronously so concurrent callers queue in order.
  nextAvailableAt = Math.max(now, nextAvailableAt) + MIN_INTERVAL_MS;
  if (wait) await sleep(wait);
}

async function request<T>(path: string): Promise<T> {
  await throttle();

  const res = await fetch(`${BASE_URL}/${env.THESPORTSDB_API_KEY}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new HttpError(
      res.status === 429 ? 429 : 502,
      `thesportsdb ${res.status}: ${body.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

// ─────────────────────────── Response types (subset) ───────────────────────────

export interface TsdbPlayer {
  idPlayer: string;
  strPlayer: string;
  strTeam?: string | null;
  strPosition?: string | null;
  strNationality?: string | null;
  /** Square headshot. */
  strThumb?: string | null;
  /** Transparent-background PNG — the better choice for lineup pitch markers. */
  strCutout?: string | null;
}

interface TsdbPlayerSearchResponse {
  player: TsdbPlayer[] | null;
}

/**
 * Search players by name. Handles accents and transliterations well —
 * "Jurrien Timber" resolves to "Jurriën Timber", "Martin Odegaard" to
 * "Martin Ødegaard" — which is why this beats the per-team squad endpoint,
 * whose rosters are sparse (10 of Arsenal's 30 players at time of writing).
 */
export async function searchPlayers(name: string): Promise<TsdbPlayer[]> {
  const data = await request<TsdbPlayerSearchResponse>(
    `/searchplayers.php?p=${encodeURIComponent(name)}`,
  );
  return data.player ?? [];
}

interface TsdbTeam {
  idTeam: string;
  strTeam: string;
  strLeague?: string | null;
}

interface TsdbTeamSearchResponse {
  teams: TsdbTeam[] | null;
}

/**
 * Resolve a club name to a TheSportsDB team id.
 *
 * Pass a name with its decorations already stripped: searching "Arsenal FC"
 * verbatim returns a Romanian third-division club, while "Arsenal" returns the
 * Premier League side.
 */
export async function searchTeam(name: string): Promise<TsdbTeam | null> {
  const data = await request<TsdbTeamSearchResponse>(
    `/searchteams.php?t=${encodeURIComponent(name)}`,
  );
  return data.teams?.[0] ?? null;
}

/**
 * Every player TheSportsDB lists for a team — one request for the whole squad.
 *
 * Rosters are incomplete (10 of Arsenal's 30 at time of writing), so this
 * won't finish the job on its own. It is still worth running first: against a
 * cumulative request quota, ten photos for one request beats ten photos for
 * ten requests via searchPlayers.
 */
export async function lookupAllPlayers(teamId: string): Promise<TsdbPlayer[]> {
  const data = await request<TsdbPlayerSearchResponse>(
    `/lookup_all_players.php?id=${encodeURIComponent(teamId)}`,
  );
  return data.player ?? [];
}

// ─────────────────────────── Match events ───────────────────────────

export interface TsdbEvent {
  idEvent: string;
  strEvent: string;
  strLeague?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  dateEvent?: string | null;
}

interface TsdbEventsDayResponse {
  events: TsdbEvent[] | null;
}

export interface TsdbTimelineEntry {
  idTimeline: string;
  idEvent: string;
  /** "Goal" | "Card" | "subst" … */
  strTimeline: string;
  /** e.g. "Normal Goal", "Yellow Card", "Red Card" */
  strTimelineDetail?: string | null;
  /** "Yes" when the event belongs to the home side. */
  strHome?: string | null;
  strPlayer?: string | null;
  strAssist?: string | null;
  intTime?: string | null;
  strTeam?: string | null;
}

interface TsdbTimelineResponse {
  timeline: TsdbTimelineEntry[] | null;
}

export interface TsdbEventStat {
  strStat: string;
  intHome?: string | null;
  intAway?: string | null;
}

interface TsdbEventStatsResponse {
  eventstats: TsdbEventStat[] | null;
}

/**
 * Every football fixture on a given day (YYYY-MM-DD) in one request.
 *
 * This is what makes event syncing affordable: a single call covers ~100
 * fixtures, so matching our own finished matches costs one request per day
 * rather than one per match.
 */
export async function eventsOnDay(date: string): Promise<TsdbEvent[]> {
  const data = await request<TsdbEventsDayResponse>(
    `/eventsday.php?d=${encodeURIComponent(date)}&s=Soccer`,
  );
  return data.events ?? [];
}

/** Goals, cards and substitutions for one fixture. Empty for minor leagues. */
export async function lookupTimeline(
  eventId: string,
): Promise<TsdbTimelineEntry[]> {
  const data = await request<TsdbTimelineResponse>(
    `/lookuptimeline.php?id=${encodeURIComponent(eventId)}`,
  );
  return data.timeline ?? [];
}

/** Team statistics (shots, fouls, corners…) for one fixture. */
export async function lookupEventStats(
  eventId: string,
): Promise<TsdbEventStat[]> {
  const data = await request<TsdbEventStatsResponse>(
    `/lookupeventstats.php?id=${encodeURIComponent(eventId)}`,
  );
  return data.eventstats ?? [];
}
