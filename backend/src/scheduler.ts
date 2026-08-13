import cron from "node-cron";
import { env } from "./config/env.js";
import { buildDailyDigest } from "./services/digest.js";
import { footballDataEnabled, trackedCompetitions } from "./services/football-data.js";
import { syncPlayerPhotos } from "./services/player-photos.js";
import { pollLiveMatches, syncAll, syncFixtures } from "./services/sync.js";

/**
 * Background jobs:
 *   - every minute  → poll in-play matches, broadcast live score updates
 *   - every hour    → refresh fixtures/results for tracked competitions
 *   - once a day    → full refresh (fixtures + standings) + cross-league digest
 *
 * Only runs when SCHEDULER_ENABLED is true and a football-data.org key is set.
 */
export function startScheduler(): void {
  if (!env.SCHEDULER_ENABLED) {
    console.log("⏱️  Scheduler disabled (SCHEDULER_ENABLED=false)");
    return;
  }
  if (!footballDataEnabled()) {
    console.log("⏱️  Scheduler idle — set FOOTBALL_DATA_API_KEY to enable data sync");
    return;
  }

  const run = (label: string, fn: () => Promise<unknown>) => () => {
    fn().catch((err) => console.error(`[${label}] failed:`, err instanceof Error ? err.message : err));
  };

  // Live scores: every minute (a single API call for all in-play matches).
  cron.schedule("* * * * *", run("live", async () => {
    const n = await pollLiveMatches();
    if (n) console.log(`[live] broadcast ${n} in-play match update(s)`);
  }));

  // Fixtures/results: top of every hour.
  cron.schedule("0 * * * *", run("hourly", syncFixtures));

  // Daily full refresh + digest.
  cron.schedule(env.DAILY_DIGEST_CRON, run("daily", async () => {
    await syncAll();
    await buildDailyDigest();
  }));

  // Player photos from TheSportsDB, in bounded batches. Runs after the daily
  // sync so newly added squad members get picked up on the next tick.
  cron.schedule(env.PLAYER_PHOTO_CRON, run("photos", async () => {
    const r = await syncPlayerPhotos();
    if (r.scanned) {
      console.log(
        `[photos] scanned ${r.scanned} — matched ${r.matched}, missed ${r.missed}, failed ${r.failed}`,
      );
    }
  }));

  console.log(
    `⏱️  Scheduler started — competitions: ${trackedCompetitions().join(", ")}; ` +
      `daily digest at cron "${env.DAILY_DIGEST_CRON}"`,
  );

  // Warm the data on boot so the app isn't empty until the first cron tick.
  run("startup", syncAll)();
}
