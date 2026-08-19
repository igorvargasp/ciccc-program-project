/**
 * Backfill match reports (goals, cards, team stats) from TheSportsDB.
 * Run with:  npx tsx scripts/sync-match-events.ts [lookbackDays] [maxMatches]
 *
 * football-data.org's free plan carries no events at all, so the report data
 * comes from TheSportsDB and is matched on kickoff date plus both clubs.
 *
 * Only touches finished matches that have no events yet, so re-running is
 * cheap. The scheduler does the same nightly for recent fixtures; this script
 * is for filling in history.
 */
import "dotenv/config";
import {
  linkEventPlayers,
  syncMatchEvents,
} from "../src/services/match-events.js";

const lookbackDays = Number(process.argv[2]) || 14;
const maxMatches = Number(process.argv[3]) || 60;

console.log(
  `Looking for reports on up to ${maxMatches} finished matches from the last ${lookbackDays} days…\n`,
);

const r = await syncMatchEvents({ lookbackDays, maxMatches });
const linked = await linkEventPlayers();

console.log(
  `days scanned      ${r.days}\n` +
    `matches pending   ${r.matchesConsidered}\n` +
    `  matched         ${r.matched}\n` +
    `  no coverage     ${r.withoutData}\n` +
    `events stored     ${r.eventsStored}\n` +
    `stats stored      ${r.statsStored}\n` +
    `players linked    ${linked.linkedPlayers} (+${linked.linkedAssists} assists, ${linked.unmatched} unmatched)`,
);

if (r.matchesConsidered === maxMatches) {
  console.log("\nHit the batch limit — run again to continue.");
}
process.exit(0);
