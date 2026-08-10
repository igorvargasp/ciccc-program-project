import { Router } from "express";
import { and, asc, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { players, playerStatistics, seasons, standings } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";

export const playersRouter = Router();

const listQuery = z.object({
  search: z.string().trim().min(1).optional(),
  position: z.enum(["GK", "DEF", "MID", "FWD"]).optional(),
  teamId: z.string().uuid().optional(),
  competitionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

// GET /api/players — list/search players
playersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, position, teamId, competitionId, limit } = listQuery.parse(req.query);

    const filters = [];
    if (search) filters.push(ilike(players.fullName, `%${search}%`));
    if (position) filters.push(eq(players.position, position));
    if (teamId) filters.push(eq(players.teamId, teamId));
    if (competitionId) {
      const seasonIds = (await db.select({ id: seasons.id }).from(seasons).where(eq(seasons.competitionId, competitionId))).map((s) => s.id);
      if (!seasonIds.length) { res.json({ data: [] }); return; }
      const teamIds = (await db.selectDistinct({ id: standings.teamId }).from(standings).where(inArray(standings.seasonId, seasonIds))).map((s) => s.id);
      if (!teamIds.length) { res.json({ data: [] }); return; }
      filters.push(inArray(players.teamId, teamIds));
    }

    const rows = await db
      .select()
      .from(players)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(players.fullName))
      .limit(limit);

    res.json({ data: rows });
  }),
);

// GET /api/players/:id — player detail with statistics
playersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [player] = await db.select().from(players).where(eq(players.id, req.params.id)).limit(1);
    if (!player) throw notFound("Player");

    const stats = await db
      .select()
      .from(playerStatistics)
      .where(eq(playerStatistics.playerId, player.id));

    res.json({ data: { ...player, statistics: stats } });
  }),
);
