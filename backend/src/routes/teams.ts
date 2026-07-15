import { Router } from "express";
import { and, asc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { players, teams } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";

export const teamsRouter = Router();

const listQuery = z.object({
  search: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/teams — list/search teams
teamsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, country, limit } = listQuery.parse(req.query);

    const filters = [];
    if (search) filters.push(ilike(teams.name, `%${search}%`));
    if (country) filters.push(eq(teams.country, country));

    const rows = await db
      .select()
      .from(teams)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(teams.name))
      .limit(limit);

    res.json({ data: rows });
  }),
);

// GET /api/teams/:id — team detail
teamsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [team] = await db.select().from(teams).where(eq(teams.id, req.params.id)).limit(1);
    if (!team) throw notFound("Team");
    res.json({ data: team });
  }),
);

// GET /api/teams/:id/squad — players belonging to the team
teamsRouter.get(
  "/:id/squad",
  asyncHandler(async (req, res) => {
    const squad = await db
      .select()
      .from(players)
      .where(eq(players.teamId, req.params.id))
      .orderBy(asc(players.shirtNumber));

    res.json({ data: squad });
  }),
);
