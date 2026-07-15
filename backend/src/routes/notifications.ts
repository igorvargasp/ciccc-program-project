import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";
import { currentUserId, requireAuth } from "../middleware/auth.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth());

const listQuery = z.object({
  unreadOnly: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("false"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/notifications — the user's notifications
notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { unreadOnly, limit } = listQuery.parse(req.query);

    const filters = [eq(notifications.userId, userId)];
    if (unreadOnly) filters.push(eq(notifications.isRead, false));

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...filters))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    res.json({ data: rows });
  }),
);

// POST /api/notifications/:id/read — mark one as read
notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const [row] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, req.params.id), eq(notifications.userId, userId)))
      .returning();

    if (!row) throw notFound("Notification");
    res.json({ data: row });
  }),
);

// POST /api/notifications/read-all — mark all as read
notificationsRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    res.status(204).end();
  }),
);
