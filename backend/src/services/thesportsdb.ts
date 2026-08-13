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
