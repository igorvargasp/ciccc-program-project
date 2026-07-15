import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { newsArticles } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { ingestArticles } from "../services/news.js";

export const newsRouter = Router();

const listQuery = z.object({
  teamId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

// GET /api/news — latest articles, optionally filtered by team
newsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { teamId, limit } = listQuery.parse(req.query);

    const rows = await db
      .select()
      .from(newsArticles)
      .where(teamId ? eq(newsArticles.teamId, teamId) : undefined)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit);

    res.json({ data: rows });
  }),
);

const ingestSchema = z.object({
  articles: z
    .array(
      z.object({
        source: z.string().optional(),
        externalUrl: z.string().url(),
        teamId: z.string().uuid().optional(),
        title: z.string().min(1),
        summary: z.string().optional(),
        imageUrl: z.string().url().optional(),
        publishedAt: z.coerce.date().optional(),
      }),
    )
    .min(1)
    .max(100),
});

// POST /api/news/ingest — push articles (used by the sync job; broadcasts live)
newsRouter.post(
  "/ingest",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { articles } = ingestSchema.parse(req.body);
    const inserted = await ingestArticles(articles);
    res.status(201).json({ data: inserted });
  }),
);
