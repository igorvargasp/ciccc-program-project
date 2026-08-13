// One-off: add the player photo-tracking column, additively.
// Same approach as apply-schema-fix.mjs — avoids drizzle-kit's spurious PG17
// NOT-NULL drop churn. Uses the compiled Drizzle client (run `npm run build`
// first). Safe to re-run.
import { sql } from "drizzle-orm";
import { db } from "../dist/db/index.js";

const statements = [
  `ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "photo_checked_at" timestamp with time zone`,
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
