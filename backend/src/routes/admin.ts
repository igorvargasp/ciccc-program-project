import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { buildDailyDigest } from "../services/digest.js";
import { pollLiveMatches, syncAll, syncFixtures, syncSquads } from "../services/sync.js";

/**
 * Manual triggers for the background jobs — handy for testing/seeding without
 * waiting for the scheduler. Authenticated; in production you'd gate these to
 * an admin role.
 */
export const adminRouter = Router();
adminRouter.use(requireAuth());

// POST /api/admin/sync — fixtures/results for all tracked competitions
adminRouter.post(
  "/sync",
  asyncHandler(async (_req, res) => {
    await syncFixtures();
    res.json({ ok: true });
  }),
);

// POST /api/admin/sync-all — fixtures + standings for all tracked competitions
adminRouter.post(
  "/sync-all",
  asyncHandler(async (_req, res) => {
    await syncAll();
    res.json({ ok: true });
  }),
);

// POST /api/admin/squads — refresh squads/rosters for all tracked competitions
adminRouter.post(
  "/squads",
  asyncHandler(async (_req, res) => {
    await syncSquads();
    res.json({ ok: true });
  }),
);

// POST /api/admin/live — poll in-play matches once and broadcast updates
adminRouter.post(
  "/live",
  asyncHandler(async (_req, res) => {
    const count = await pollLiveMatches();
    res.json({ ok: true, liveMatches: count });
  }),
);

// POST /api/admin/digest — build the daily cross-league digest now
adminRouter.post(
  "/digest",
  asyncHandler(async (_req, res) => {
    const result = await buildDailyDigest();
    res.json({ ok: true, ...result });
  }),
);
