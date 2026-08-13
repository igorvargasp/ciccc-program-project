import { Router } from "express";
import { desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { simulations } from "../db/schema.js";
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
    // Se não houver req.user, userId fica como null
    const userId = req.user?.id || null;
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
    const userId = req.user?.id;

    let query;

    if (userId) {
      // Retorna as simulações do usuário logado
      query = db
        .select()
        .from(simulations)
        .where(eq(simulations.userId, userId))
        .orderBy(desc(simulations.createdAt))
        .limit(50);
    } else {
      // Retorna apenas as simulações feitas por visitantes/anônimos
      query = db
        .select()
        .from(simulations)
        .where(isNull(simulations.userId))
        .orderBy(desc(simulations.createdAt))
        .limit(50);
    }

    const rows = await query;
    res.json({ data: rows });
  }),
);
