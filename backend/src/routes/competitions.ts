import { Router } from "express";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { competitions, seasons, standings, teams } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";

export const competitionsRouter = Router();

// GET /api/competitions — list competitions
competitionsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(competitions).orderBy(asc(competitions.name));
    res.json({ data: rows });
  }),
);

// GET /api/competitions/:id/seasons — seasons for a competition
competitionsRouter.get(
  "/:id/seasons",
  asyncHandler(async (req, res) => {
    const rows = await db
      .select()
      .from(seasons)
      .where(eq(seasons.competitionId, req.params.id))
      .orderBy(asc(seasons.label));
    res.json({ data: rows });
  }),
);

const standingsQuery = z.object({
  seasonId: z.string().uuid().optional(),
  simulated: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("false"),
});

// GET /api/competitions/:id/standings — league table (real or simulated)
competitionsRouter.get(
  "/:id/standings",
  asyncHandler(async (req, res) => {
    const { seasonId, simulated } = standingsQuery.parse(req.query);

    // Resolve target season: explicit query param, else the current season.
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const [current] = await db
        .select({ id: seasons.id })
        .from(seasons)
        .where(and(eq(seasons.competitionId, req.params.id), eq(seasons.isCurrent, true)))
        .limit(1);
      if (!current) throw notFound("Current season");
      targetSeasonId = current.id;
    }

    const table = await db
      .select({
        position: standings.position,
        played: standings.played,
        won: standings.won,
        drawn: standings.drawn,
        lost: standings.lost,
        goalsFor: standings.goalsFor,
        goalsAgainst: standings.goalsAgainst,
        points: standings.points,
        team: {
          id: teams.id,
          name: teams.name,
          shortName: teams.shortName,
          crestUrl: teams.crestUrl,
        },
      })
      .from(standings)
      .innerJoin(teams, eq(standings.teamId, teams.id))
      .where(and(eq(standings.seasonId, targetSeasonId), eq(standings.isSimulated, simulated)))
      .orderBy(asc(standings.position));

    res.json({ data: { seasonId: targetSeasonId, simulated, table } });
  }),
);
