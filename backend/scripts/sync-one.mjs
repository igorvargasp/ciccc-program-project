// One-off: fully sync a single competition by code (matches + standings + squads).
// Usage: node scripts/sync-one.mjs BSA
import {
  syncCompetitionMatches,
  syncCompetitionSquads,
  syncCompetitionStandings,
} from "../dist/services/sync.js";

const code = process.argv[2] || "BSA";
console.log(`syncing ${code}…`);
const matches = await syncCompetitionMatches(code);
const standings = await syncCompetitionStandings(code);
const players = await syncCompetitionSquads(code);
console.log(`${code}: ${matches} matches, ${standings} standings rows, ${players} players`);
process.exit(0);
