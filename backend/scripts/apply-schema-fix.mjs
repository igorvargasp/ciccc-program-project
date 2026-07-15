// One-off: apply ONLY the additive schema changes (new column + unique
// constraints), skipping drizzle-kit's spurious PG17 NOT-NULL drop churn.
// Uses the compiled Drizzle client (run `npm run build` first).
import { sql } from "drizzle-orm";
import { db } from "../dist/db/index.js";

const statements = [
  `ALTER TABLE "seasons" ADD COLUMN IF NOT EXISTS "external_api_id" varchar(64)`,
  `ALTER TABLE "seasons" ADD CONSTRAINT "seasons_external_api_id_unique" UNIQUE("external_api_id")`,
  `ALTER TABLE "translations" ADD CONSTRAINT "translations_language_id_namespace_key_unique" UNIQUE("language_id","namespace","key")`,
  `ALTER TABLE "standings" ADD CONSTRAINT "standings_season_id_team_id_is_simulated_unique" UNIQUE("season_id","team_id","is_simulated")`,
  `ALTER TABLE "competition_teams" ADD CONSTRAINT "competition_teams_season_id_team_id_unique" UNIQUE("season_id","team_id")`,
];

for (const stmt of statements) {
  try {
    await db.execute(sql.raw(stmt));
    console.log("✓", stmt);
  } catch (err) {
    // 42701 duplicate column, 42710 duplicate object (constraint already there)
    if (err.code === "42701" || err.code === "42710" || /already exists/i.test(err.message)) {
      console.log("• skip (already applied):", stmt);
    } else {
      console.error("✗", stmt, "\n  ", err.message);
      process.exitCode = 1;
    }
  }
}
console.log("done");
