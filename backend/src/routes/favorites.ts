import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { teams, userFavoriteTeams } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { badRequest, notFound } from "../lib/http-error.js";
import { currentUserId, requireAuth } from "../middleware/auth.js";

export const favoritesRouter = Router();
favoritesRouter.use(requireAuth());

// GET /api/favorites — the user's favorite teams
favoritesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const rows = await db
      .select({
        id: userFavoriteTeams.id,
        isPrimary: userFavoriteTeams.isPrimary,
        createdAt: userFavoriteTeams.createdAt,
        team: teams,
      })
      .from(userFavoriteTeams)
      .innerJoin(teams, eq(userFavoriteTeams.teamId, teams.id))
      .where(eq(userFavoriteTeams.userId, userId));

    res.json({ data: rows });
  }),
);

const addSchema = z.object({
  teamId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
});

// POST /api/favorites — add a favorite team
favoritesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { teamId, isPrimary } = addSchema.parse(req.body);

    const [team] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId)).limit(1);
    if (!team) throw notFound("Team");

    // A user has at most one primary team — demote others first.
    if (isPrimary) {
      await db
        .update(userFavoriteTeams)
        .set({ isPrimary: false })
        .where(eq(userFavoriteTeams.userId, userId));
    }

    const [row] = await db
      .insert(userFavoriteTeams)
      .values({ userId, teamId, isPrimary })
      .onConflictDoUpdate({
        target: [userFavoriteTeams.userId, userFavoriteTeams.teamId],
        set: { isPrimary },
      })
      .returning();

    res.status(201).json({ data: row });
  }),
);

// DELETE /api/favorites/:teamId — remove a favorite
favoritesRouter.delete(
  "/:teamId",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const teamId = z.string().uuid().safeParse(req.params.teamId);
    if (!teamId.success) throw badRequest("Invalid team id");

    const deleted = await db
      .delete(userFavoriteTeams)
      .where(and(eq(userFavoriteTeams.userId, userId), eq(userFavoriteTeams.teamId, teamId.data)))
      .returning({ id: userFavoriteTeams.id });

    if (!deleted.length) throw notFound("Favorite");
    res.status(204).end();
  }),
);
