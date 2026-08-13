/**
 * Backfill player photos from TheSportsDB on demand.
 * Run with:  npx tsx scripts/sync-player-photos.ts [limit]
 *
 * The scheduler runs this nightly in small batches; this script exists for the
 * first fill, where you want to work through the table faster than one batch a
 * day. It's resumable — re-run it until `scanned` comes back 0.
 */
import "dotenv/config";
import { syncPlayerPhotos } from "../src/services/player-photos.js";

const limit = Number(process.argv[2]) || 200;

console.log(`Looking up photos for up to ${limit} players…`);
const r = await syncPlayerPhotos(limit);

console.log(
  `\nscanned ${r.scanned}\n  matched ${r.matched}\n  missed  ${r.missed}\n  failed  ${r.failed}`,
);
if (r.scanned === limit) {
  console.log("\nHit the batch limit — run again to continue.");
} else if (r.scanned === 0) {
  console.log("\nNothing left to check.");
}
process.exit(0);
