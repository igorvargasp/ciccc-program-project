import { Router } from "express";
import { desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { alias } from "drizzle-orm/pg-core";
import { matches, simulations, teams } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { simulateMatch } from "../services/simulator.js";

export const simulationsRouter = Router();
// NENHUM MIDDLEWARE requireAuth() AQUI! O ACESSO ESTÁ LIBERADO.

const createSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(50),
  awayScore: z.number().int().min(0).max(50),
});

// POST /api/simulations — run a match-result simulation and get the new table
simulationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    // Se não houver req.auth, userId fica como null
    const userId = req.auth?.id || null;
    const { matchId, homeScore, awayScore } = createSchema.parse(req.body);

    const result = await simulateMatch({
      userId,
      matchId,
      homeScore,
      awayScore,
    });

    res.status(201).json({ data: result });
  }),
);

// GET /api/simulations — the user's past simulations (ou globais se não estiver logado)
simulationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.auth?.id;

    const homeTeamAlias = alias(teams, "home_team");
    const awayTeamAlias = alias(teams, "away_team");

    // Both clubs travel with the simulation. Resolving them client-side meant
    // searching a capped match list, so anything outside it rendered "? vs ?"
    // with no crest.
    const rows = await db
      .select({
        simulation: simulations,
        kickoffAt: matches.kickoffAt,
        homeTeam: {
          id: homeTeamAlias.id,
          name: homeTeamAlias.name,
          shortName: homeTeamAlias.shortName,
          crestUrl: homeTeamAlias.crestUrl,
        },
        awayTeam: {
          id: awayTeamAlias.id,
          name: awayTeamAlias.name,
          shortName: awayTeamAlias.shortName,
          crestUrl: awayTeamAlias.crestUrl,
        },
      })
      .from(simulations)
      .leftJoin(matches, eq(simulations.matchId, matches.id))
      .leftJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
      .leftJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
      .where(
        userId ? eq(simulations.userId, userId) : isNull(simulations.userId),
      )
      .orderBy(desc(simulations.createdAt))
      .limit(50);

    res.json({
      data: rows.map((r) => ({
        ...r.simulation,
        kickoffAt: r.kickoffAt,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
      })),
    });
  }),
);
