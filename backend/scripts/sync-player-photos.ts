/**
 * Backfill player photos on demand.
 * Run with:  npx tsx scripts/sync-player-photos.ts [limit]
 *
 * Sources run cheapest-first — Wikidata (no quota), then TheSportsDB squad
 * listings (one request per club), then TheSportsDB player search (one request
 * per player, and the only source with a hard quota).
 *
 * The scheduler runs this nightly in small batches; this script exists for the
 * first fill. It's resumable — re-run until `scanned` comes back 0.
 */
import "dotenv/config";
import { backfillPlayerPhotos } from "../src/services/player-photos.js";

const limit = Number(process.argv[2]) || 200;

console.log(`Looking up photos for up to ${limit} players…\n`);
const r = await backfillPlayerPhotos(limit);

console.log(`\nscanned ${r.scanned}\n  matched ${r.matched}\n  missed  ${r.missed}`);
for (const [source, n] of Object.entries(r.bySource)) {
  console.log(`    ${source.padEnd(12)} ${n}`);
}
if (r.scanned === limit) {
  console.log("\nHit the batch limit — run again to continue.");
} else if (r.scanned === 0) {
  console.log("\nNothing left to check.");
}
process.exit(0);
