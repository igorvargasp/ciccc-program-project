import { Router } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { newsArticles, seasons, standings } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { ingestArticles } from "../services/news.js";

export const newsRouter = Router();

const listQuery = z.object({
  teamId: z.string().uuid().optional(),
  competitionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

// GET /api/news — latest articles, optionally filtered by team or competition
newsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { teamId, competitionId, limit } = listQuery.parse(req.query);

    let teamFilter: ReturnType<typeof eq> | ReturnType<typeof inArray> | undefined;

    if (teamId) {
      teamFilter = eq(newsArticles.teamId, teamId);
    } else if (competitionId) {
      const seasonIds = (
        await db
          .select({ id: seasons.id })
          .from(seasons)
          .where(eq(seasons.competitionId, competitionId))
      ).map((s) => s.id);

      if (seasonIds.length) {
        const teamIds = (
          await db
            .selectDistinct({ teamId: standings.teamId })
            .from(standings)
            .where(inArray(standings.seasonId, seasonIds))
        ).map((s) => s.teamId);

        if (teamIds.length) {
          teamFilter = inArray(newsArticles.teamId, teamIds);
        }
      }
    }

    const rows = await db
      .select()
      .from(newsArticles)
      .where(teamFilter)
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
