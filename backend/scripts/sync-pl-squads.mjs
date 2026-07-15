// One-off: pull Premier League squads so /api/players has data to test against.
import { syncCompetitionSquads } from "../dist/services/sync.js";

const n = await syncCompetitionSquads("PL");
console.log(`synced ${n} Premier League players`);
process.exit(0);
