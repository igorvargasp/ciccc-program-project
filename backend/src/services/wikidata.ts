/**
 * Wikidata + Wikimedia Commons client for player photos.
 *
 * Preferred over TheSportsDB as the first source: there is no request quota to
 * exhaust (Wikimedia asks only for a descriptive User-Agent and sane pacing),
 * and Commons images carry explicit free licences, whereas TheSportsDB's are
 * informally sourced.
 *
 * Coverage is lower, so this is tier one of a chain rather than a replacement.
 */

const API = "https://www.wikidata.org/w/api.php";
const COMMONS_FILEPATH = "https://commons.wikimedia.org/wiki/Special:FilePath";

// Wikimedia asks bots to identify themselves and not run hot. Anonymous
// callers are rate-limited: 300ms between calls reliably drew 429s, so stay
// under one request per second and back off when asked to.
const USER_AGENT = "SmartFootballHub/0.1 (football stats coursework project)";
const MIN_INTERVAL_MS = 1_100;
const MAX_RETRIES = 4;

/** occupation → association football player */
const Q_FOOTBALL_PLAYER = "Q937857";
/** property ids */
const P_OCCUPATION = "P106";
const P_IMAGE = "P18";
const P_MEMBER_OF_TEAM = "P54";

/** wbgetentities accepts up to 50 ids per call. */
const ENTITY_BATCH = 50;

let nextAvailableAt = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, nextAvailableAt - now);
  nextAvailableAt = Math.max(now, nextAvailableAt) + MIN_INTERVAL_MS;
  if (wait) await sleep(wait);
}

/**
 * Wikimedia answers a burst with 429 rather than queuing it, so retry with
 * exponential backoff. Unlike TheSportsDB's cumulative quota, this clears on
 * its own — waiting genuinely helps here, which is why we retry instead of
 * abandoning the source.
 */
async function api<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ format: "json", ...params });

  for (let attempt = 0; ; attempt++) {
    await throttle();
    const res = await fetch(`${API}?${qs}`, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) return (await res.json()) as T;

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1_000
        : MIN_INTERVAL_MS * 2 ** (attempt + 1);
      await sleep(backoff);
      continue;
    }
    throw new Error(`wikidata ${res.status}`);
  }
}

interface SearchResponse {
  search?: { id: string; label?: string; description?: string }[];
}

type Claim = { mainsnak?: { datavalue?: { value?: unknown } } };
type Claims = Record<string, Claim[]>;

interface EntitiesResponse {
  entities?: Record<string, { claims?: Claims }>;
}

/** Best-guess entity id for a player name, or null. */
export async function findEntityId(name: string): Promise<string | null> {
  const data = await api<SearchResponse>({
    action: "wbsearchentities",
    search: name,
    language: "en",
    type: "item",
    limit: "3",
  });
  return data.search?.[0]?.id ?? null;
}

export interface WikidataPhoto {
  entityId: string;
  /** Commons file name, e.g. "Kepa Arrizabalaga 2021 (cropped).jpg" */
  file: string;
  url: string;
}

function claimIds(claims: Claims | undefined, prop: string): string[] {
  return (claims?.[prop] ?? [])
    .map((c) => (c.mainsnak?.datavalue?.value as { id?: string } | undefined)?.id)
    .filter((v): v is string => Boolean(v));
}

/**
 * Resolve claims for up to 50 entities at a time and keep only those that are
 * plausibly footballers with an image.
 *
 * The occupation check is not optional: a bare name search for "Gabriel
 * Magalhães" returns a confidently-labelled entity that is not a footballer at
 * all, and without this guard we would attach a stranger's face to a player.
 */
export async function fetchPhotos(
  entityIds: string[],
): Promise<Map<string, WikidataPhoto>> {
  const out = new Map<string, WikidataPhoto>();

  for (let i = 0; i < entityIds.length; i += ENTITY_BATCH) {
    const chunk = entityIds.slice(i, i + ENTITY_BATCH);
    const data = await api<EntitiesResponse>({
      action: "wbgetentities",
      ids: chunk.join("|"),
      props: "claims",
    });

    for (const [id, entity] of Object.entries(data.entities ?? {})) {
      const claims = entity.claims;
      const file = claims?.[P_IMAGE]?.[0]?.mainsnak?.datavalue?.value;
      if (typeof file !== "string") continue;

      // Either an explicit footballer occupation, or membership of a sports
      // team — both are strong enough signals; requiring only P106 would drop
      // players whose item hasn't had an occupation filled in.
      const isFootballer =
        claimIds(claims, P_OCCUPATION).includes(Q_FOOTBALL_PLAYER) ||
        (claims?.[P_MEMBER_OF_TEAM]?.length ?? 0) > 0;
      if (!isFootballer) continue;

      out.set(id, {
        entityId: id,
        file,
        url: `${COMMONS_FILEPATH}/${encodeURIComponent(file)}?width=300`,
      });
    }
  }

  return out;
}
