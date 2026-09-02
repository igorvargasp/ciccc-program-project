// One-off: columns and table for match reports (goals, cards, team stats).
// Additive and safe to re-run, same approach as apply-schema-fix.mjs.
// Uses the compiled Drizzle client (run `npm run build` first).
import { sql } from "drizzle-orm";
import { db } from "../dist/db/index.js";

const statements = [
  `ALTER TABLE "match_events" ADD COLUMN IF NOT EXISTS "player_name" varchar(160)`,
  `ALTER TABLE "match_events" ADD COLUMN IF NOT EXISTS "assist_name" varchar(160)`,
  `ALTER TABLE "match_events" ADD COLUMN IF NOT EXISTS "is_home" boolean`,
  `ALTER TABLE "match_events" ADD COLUMN IF NOT EXISTS "external_api_id" varchar(64)`,
  `ALTER TABLE "match_events" ADD CONSTRAINT "match_events_external_api_id_unique" UNIQUE("external_api_id")`,
  `CREATE TABLE IF NOT EXISTS "match_stats" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
     "match_id" uuid NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
     "stat" varchar(64) NOT NULL,
     "home" integer,
     "away" integer
   )`,
  `ALTER TABLE "match_stats" ADD CONSTRAINT "match_stats_match_id_stat_unique" UNIQUE("match_id","stat")`,
  // Not every stat is a count: expected_goals arrives as 0.43, which an
  // integer column rejects outright.
  `ALTER TABLE "match_stats" ALTER COLUMN "home" TYPE real USING "home"::real`,
  `ALTER TABLE "match_stats" ALTER COLUMN "away" TYPE real USING "away"::real`,
  `ALTER TABLE "match_events" ADD COLUMN IF NOT EXISTS "assist_player_id" uuid REFERENCES "players"("id") ON DELETE SET NULL`,
];

for (const stmt of statements) {
  try {
    await db.execute(sql.raw(stmt));
    console.log("✓", stmt.split("\n")[0]);
  } catch (err) {
    // 42701 duplicate column, 42710 duplicate object, 42P07 duplicate table
    if (
      err.code === "42701" ||
      err.code === "42710" ||
      err.code === "42P07" ||
      /already exists/i.test(err.message)
    ) {
      console.log("• skip (already applied):", stmt.split("\n")[0]);
    } else {
      console.error("✗", stmt.split("\n")[0], "\n  ", err.message);
      process.exitCode = 1;
    }
  }
}
console.log("done");
