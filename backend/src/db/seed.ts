/**
 * Minimal seed: reference data the app relies on (languages + formations with
 * slot layouts). Run with:  npm run build && node dist/db/seed.js
 * or during development:     npx tsx src/db/seed.ts
 */
import { db } from "./index.js";
import { formations, formationSlots, languages } from "./schema.js";

// Normalised pitch coordinates (0-100). x = width, y = depth (0 = own goal).
const FORMATIONS: Record<string, { role: string; x: number; y: number }[]> = {
  "4-3-3": [
    { role: "GK", x: 50, y: 5 },
    { role: "LB", x: 15, y: 25 },
    { role: "CB", x: 38, y: 20 },
    { role: "CB", x: 62, y: 20 },
    { role: "RB", x: 85, y: 25 },
    { role: "CM", x: 30, y: 50 },
    { role: "CM", x: 50, y: 45 },
    { role: "CM", x: 70, y: 50 },
    { role: "LW", x: 18, y: 78 },
    { role: "ST", x: 50, y: 85 },
    { role: "RW", x: 82, y: 78 },
  ],
  "4-4-2": [
    { role: "GK", x: 50, y: 5 },
    { role: "LB", x: 15, y: 25 },
    { role: "CB", x: 38, y: 20 },
    { role: "CB", x: 62, y: 20 },
    { role: "RB", x: 85, y: 25 },
    { role: "LM", x: 15, y: 55 },
    { role: "CM", x: 40, y: 50 },
    { role: "CM", x: 60, y: 50 },
    { role: "RM", x: 85, y: 55 },
    { role: "ST", x: 40, y: 82 },
    { role: "ST", x: 60, y: 82 },
  ],
  "3-5-2": [
    { role: "GK", x: 50, y: 5 },
    { role: "CB", x: 30, y: 20 },
    { role: "CB", x: 50, y: 18 },
    { role: "CB", x: 70, y: 20 },
    { role: "LWB", x: 12, y: 50 },
    { role: "CM", x: 35, y: 50 },
    { role: "CM", x: 50, y: 45 },
    { role: "CM", x: 65, y: 50 },
    { role: "RWB", x: 88, y: 50 },
    { role: "ST", x: 40, y: 82 },
    { role: "ST", x: 60, y: 82 },
  ],
};

async function main() {
  console.log("Seeding languages…");
  await db
    .insert(languages)
    .values([
      { code: "en", name: "English" },
      { code: "pt", name: "Português" },
      { code: "es", name: "Español" },
    ])
    .onConflictDoNothing();

  console.log("Seeding formations…");
  for (const [name, slots] of Object.entries(FORMATIONS)) {
    const [formation] = await db
      .insert(formations)
      .values({ name, layout: { slots } })
      .onConflictDoNothing()
      .returning();

    if (formation) {
      await db
        .insert(formationSlots)
        .values(slots.map((s) => ({ formationId: formation.id, role: s.role, posX: String(s.x), posY: String(s.y) })));
    }
  }

  console.log("✅ Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
