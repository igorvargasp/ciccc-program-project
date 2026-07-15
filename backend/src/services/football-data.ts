import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

/**
 * Thin typed client for the football-data.org v4 API.
 *
 * The free tier allows 10 requests/minute, so every call goes through a shared
 * throttle that keeps a minimum gap between requests across the whole process
 * (sync jobs + the live poller share the same budget).
 */

const BASE_URL = "https://api.football-data.org/v4";
const MIN_INTERVAL_MS = 6_500; // ~9 requests/minute, safely under the cap

let nextAvailableAt = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, nextAvailableAt - now);
  // Reserve our slot synchronously so concurrent callers queue in order.
  nextAvailableAt = Math.max(now, nextAvailableAt) + MIN_INTERVAL_MS;
  if (wait) await sleep(wait);
}

export function footballDataEnabled(): boolean {
  return Boolean(env.FOOTBALL_DATA_API_KEY);
}

export function trackedCompetitions(): string[] {
  return env.FOOTBALL_DATA_COMPETITIONS.split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

async function request<T>(path: string): Promise<T> {
  if (!env.FOOTBALL_DATA_API_KEY) {
    throw new HttpError(503, "football-data.org is not configured (missing FOOTBALL_DATA_API_KEY)");
  }
  await throttle();

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": env.FOOTBALL_DATA_API_KEY },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new HttpError(res.status === 429 ? 429 : 502, `football-data.org ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// ─────────────────────────── Response types (subset) ───────────────────────────

export interface FdTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  venue?: string;
  founded?: number;
}

export interface FdSquadPlayer {
  id: number;
  name: string;
  position?: string;
  dateOfBirth?: string;
  nationality?: string;
  shirtNumber?: number;
}

export interface FdTeamWithSquad extends FdTeam {
  squad?: FdSquadPlayer[];
}

export interface FdCompetitionTeamsResponse {
  competition: { id: number; code: string; name: string; emblem?: string };
  season: { id: number; startDate: string; endDate: string; currentMatchday?: number };
  teams: FdTeamWithSquad[];
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string; // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | ...
  matchday?: number;
  venue?: string;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
  competition: { id: number; code: string; name: string; emblem?: string };
  season: { id: number; startDate: string; endDate: string; currentMatchday?: number };
}

export interface FdStandingRow {
  position: number;
  team: FdTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface FdStandingsResponse {
  competition: { id: number; code: string; name: string; emblem?: string };
  season: { id: number; startDate: string; endDate: string; currentMatchday?: number };
  standings: { type: string; table: FdStandingRow[] }[];
}

export interface FdMatchesResponse {
  competition?: { id: number; code: string; name: string; emblem?: string };
  matches: FdMatch[];
}

// ─────────────────────────── Endpoints ───────────────────────────

/** All matches for a competition's current season. */
export function getCompetitionMatches(code: string) {
  return request<FdMatchesResponse>(`/competitions/${code}/matches`);
}

/** Current standings table for a competition. */
export function getCompetitionStandings(code: string) {
  return request<FdStandingsResponse>(`/competitions/${code}/standings`);
}

/** Every currently in-play match across the plan's competitions (one call). */
export function getLiveMatches() {
  return request<FdMatchesResponse>(`/matches?status=IN_PLAY,PAUSED`);
}

/** All teams in a competition, each with its squad (one call). */
export function getCompetitionTeams(code: string) {
  return request<FdCompetitionTeamsResponse>(`/competitions/${code}/teams`);
}
