import { randomBytes } from "node:crypto";
import { Router } from "express";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { lineupPlayers, lineups, lineupShares } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { currentUserId, requireAuth } from "../middleware/auth.js";

export const sharesRouter = Router();

const createSchema = z.object({
  lineupId: z.string().uuid(),
  expiresInHours: z.number().int().min(1).max(24 * 90).optional(),
});

// POST /api/shares — create a share link for a lineup you own (auth)
sharesRouter.post(
  "/",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { lineupId, expiresInHours } = createSchema.parse(req.body);

    const [lineup] = await db
      .select({ id: lineups.id })
      .from(lineups)
      .where(and(eq(lineups.id, lineupId), eq(lineups.userId, userId)))
      .limit(1);
    if (!lineup) throw notFound("Lineup");

    const shareToken = randomBytes(24).toString("hex");
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 3_600_000)
      : null;

    const [share] = await db
      .insert(lineupShares)
      .values({ lineupId, userId, shareToken, expiresAt })
      .returning();

    res.status(201).json({ data: { ...share, path: `/api/shares/${shareToken}` } });
  }),
);

// GET /api/shares/:token — resolve a shared lineup (public, no auth)
sharesRouter.get(
  "/:token",
  asyncHandler(async (req, res) => {
    const [share] = await db
      .select()
      .from(lineupShares)
      .where(
        and(
          eq(lineupShares.shareToken, req.params.token),
          // not expired: expiresAt is null or in the future
          or(isNull(lineupShares.expiresAt), gt(lineupShares.expiresAt, new Date())),
        ),
      )
      .limit(1);
    if (!share) throw notFound("Share");

    const [lineup] = await db.select().from(lineups).where(eq(lineups.id, share.lineupId)).limit(1);
    if (!lineup) throw notFound("Lineup");

    const players = await db
      .select()
      .from(lineupPlayers)
      .where(eq(lineupPlayers.lineupId, lineup.id));

    res.json({ data: { ...lineup, players } });
  }),
);

// DELETE /api/shares/:token — revoke a share you created (auth)
sharesRouter.delete(
  "/:token",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const deleted = await db
      .delete(lineupShares)
      .where(and(eq(lineupShares.shareToken, req.params.token), eq(lineupShares.userId, userId)))
      .returning({ id: lineupShares.id });

    if (!deleted.length) throw new HttpError(404, "Share not found or not yours");
    res.status(204).end();
  }),
);
