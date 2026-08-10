/**
 * Seed MLS and Liga MX as competitions with a current season.
 * Run with:  npx tsx scripts/seed-competitions.ts
 *
 * Uses the same football-data.org codes (MLS / MX1) so a future paid-tier
 * sync won't duplicate these rows.
 */
import "dotenv/config";
import { db } from "../src/db/index.js";
import { competitions, seasons } from "../src/db/schema.js";

const COMPS = [
  {
    externalApiId: "MLS",
    name: "Major League Soccer",
    country: "United States",
    logoUrl: "https://crests.football-data.org/MLS.png",
    season: { label: "2026", startDate: "2026-02-22", endDate: "2026-11-30" },
  },
  {
    externalApiId: "MX1",
    name: "Liga MX",
    country: "Mexico",
    logoUrl: "https://crests.football-data.org/MX1.png",
    season: { label: "2025/26", startDate: "2025-07-18", endDate: "2026-05-31" },
  },
];

for (const c of COMPS) {
  const [comp] = await db
    .insert(competitions)
    .values({ externalApiId: c.externalApiId, name: c.name, country: c.country, type: "league", logoUrl: c.logoUrl })
    .onConflictDoUpdate({
      target: competitions.externalApiId,
      set: { name: c.name, country: c.country, logoUrl: c.logoUrl },
    })
    .returning({ id: competitions.id });

  await db
    .insert(seasons)
    .values({
      externalApiId: `${c.externalApiId}-${c.season.label}`,
      competitionId: comp.id,
      label: c.season.label,
      startDate: c.season.startDate,
      endDate: c.season.endDate,
      isCurrent: true,
    })
    .onConflictDoUpdate({
      target: seasons.externalApiId,
      set: { label: c.season.label, startDate: c.season.startDate, endDate: c.season.endDate, isCurrent: true },
    });

  console.log(`✅ ${c.name} (${c.externalApiId})`);
}

console.log("Done.");
process.exit(0);
