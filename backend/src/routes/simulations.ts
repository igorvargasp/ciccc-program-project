import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { simulations } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { currentUserId, requireAuth } from "../middleware/auth.js";
import { simulateMatch } from "../services/simulator.js";

export const simulationsRouter = Router();
simulationsRouter.use(requireAuth());

const createSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(50),
  awayScore: z.number().int().min(0).max(50),
});

// POST /api/simulations — run a match-result simulation and get the new table
simulationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { matchId, homeScore, awayScore } = createSchema.parse(req.body);

    const result = await simulateMatch({ userId, matchId, homeScore, awayScore });
    res.status(201).json({ data: result });
  }),
);

// GET /api/simulations — the user's past simulations
simulationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const rows = await db
      .select()
      .from(simulations)
      .where(eq(simulations.userId, userId))
      .orderBy(desc(simulations.createdAt))
      .limit(50);

    res.json({ data: rows });
  }),
);
