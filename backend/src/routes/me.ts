import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { userPreferences, users } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { currentUserId, requireAuth } from "../middleware/auth.js";

export const meRouter = Router();
meRouter.use(requireAuth());

// GET /api/me — current profile + preferences
meRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    res.json({ data: { ...user, preferences: prefs ?? null } });
  }),
);

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  languageId: z.string().uuid().nullable().optional(),
  notifyMatches: z.boolean().optional(),
  notifyTeamNews: z.boolean().optional(),
  dashboardLayout: z.unknown().optional(),
});

// PUT /api/me/preferences — upsert preferences
meRouter.put(
  "/preferences",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const patch = preferencesSchema.parse(req.body);

    const [prefs] = await db
      .insert(userPreferences)
      .values({ userId, ...patch, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { ...patch, updatedAt: new Date() },
      })
      .returning();

    res.json({ data: prefs });
  }),
);
