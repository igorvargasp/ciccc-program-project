import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { lineupPlayers, lineups } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";
import { currentUserId, optionalAuth, requireAuth } from "../middleware/auth.js";

export const lineupsRouter = Router();

const playerSlotSchema = z.object({
  playerId: z.string().uuid(),
  formationSlotId: z.string().uuid().optional(),
  isCaptain: z.boolean().default(false),
});

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  teamId: z.string().uuid().optional(),
  formationId: z.string().uuid().optional(),
  isPublic: z.boolean().default(false),
  players: z.array(playerSlotSchema).max(11).default([]),
});

async function loadLineupWithPlayers(lineupId: string) {
  const [lineup] = await db.select().from(lineups).where(eq(lineups.id, lineupId)).limit(1);
  if (!lineup) return null;
  const slots = await db
    .select()
    .from(lineupPlayers)
    .where(eq(lineupPlayers.lineupId, lineupId));
  return { ...lineup, players: slots };
}

/**
 * Replace all player rows for a lineup. The Neon HTTP driver is stateless and
 * does not support interactive transactions, so we delete-then-insert. For this
 * low-contention, owner-scoped operation the tiny window is acceptable; switch
 * to the Neon WebSocket Pool driver if you need true atomicity here.
 */
async function setLineupPlayers(
  lineupId: string,
  entries: z.infer<typeof playerSlotSchema>[],
) {
  await db.delete(lineupPlayers).where(eq(lineupPlayers.lineupId, lineupId));
  if (entries.length) {
    await db.insert(lineupPlayers).values(entries.map((e) => ({ lineupId, ...e })));
  }
}

// GET /api/lineups — the authenticated user's saved lineups
lineupsRouter.get(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const rows = await db
      .select()
      .from(lineups)
      .where(eq(lineups.userId, userId))
      .orderBy(desc(lineups.updatedAt));
    res.json({ data: rows });
  }),
);

// GET /api/lineups/:id — a lineup (owner, or anyone if public)
lineupsRouter.get(
  "/:id",
  optionalAuth(),
  asyncHandler(async (req, res) => {
    const lineup = await loadLineupWithPlayers(req.params.id);
    if (!lineup) throw notFound("Lineup");
    if (!lineup.isPublic && lineup.userId !== req.auth?.id) throw notFound("Lineup");
    res.json({ data: lineup });
  }),
);

// POST /api/lineups — create a lineup
lineupsRouter.post(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const body = upsertSchema.parse(req.body);

    const [created] = await db
      .insert(lineups)
      .values({
        userId,
        name: body.name,
        teamId: body.teamId,
        formationId: body.formationId,
        isPublic: body.isPublic,
      })
      .returning();

    await setLineupPlayers(created.id, body.players);
    res.status(201).json({ data: await loadLineupWithPlayers(created.id) });
  }),
);

// PUT /api/lineups/:id — update a lineup (owner only)
lineupsRouter.put(
  "/:id",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const body = upsertSchema.parse(req.body);

    const [updated] = await db
      .update(lineups)
      .set({
        name: body.name,
        teamId: body.teamId,
        formationId: body.formationId,
        isPublic: body.isPublic,
        updatedAt: new Date(),
      })
      .where(and(eq(lineups.id, req.params.id), eq(lineups.userId, userId)))
      .returning();

    if (!updated) throw notFound("Lineup");

    await setLineupPlayers(updated.id, body.players);
    res.json({ data: await loadLineupWithPlayers(updated.id) });
  }),
);

// DELETE /api/lineups/:id — delete a lineup (owner only)
lineupsRouter.delete(
  "/:id",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const deleted = await db
      .delete(lineups)
      .where(and(eq(lineups.id, req.params.id), eq(lineups.userId, userId)))
      .returning({ id: lineups.id });

    if (!deleted.length) throw notFound("Lineup");
    res.status(204).end();
  }),
);
