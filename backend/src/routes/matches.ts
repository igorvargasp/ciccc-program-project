import { Router } from "express";
import { and, asc, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { matches, matchEvents, seasons, competitions } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";

export const matchesRouter = Router();

const listQuery = z.object({
  teamId: z.string().uuid().optional(),
  seasonId: z.string().uuid().optional(),
  competitionId: z.string().uuid().optional(),
  status: z.enum(["scheduled", "live", "finished"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/matches — calendar / history with filters
matchesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = listQuery.parse(req.query);

    const filters = [];
    if (q.teamId)
      filters.push(
        or(eq(matches.homeTeamId, q.teamId), eq(matches.awayTeamId, q.teamId)),
      );
    if (q.seasonId) filters.push(eq(matches.seasonId, q.seasonId));
    if (q.competitionId) {
      const seasonIds = (await db
        .select({ id: seasons.id })
        .from(seasons)
        .where(eq(seasons.competitionId, q.competitionId)))
        .map((s) => s.id);
      if (seasonIds.length) filters.push(inArray(matches.seasonId, seasonIds));
      else { res.json({ data: [] }); return; }
    }
    if (q.status) filters.push(eq(matches.status, q.status));
    if (q.from) filters.push(gte(matches.kickoffAt, q.from));
    if (q.to) filters.push(lte(matches.kickoffAt, q.to));

    // Upcoming matches ascending; everything else most-recent first.
    const orderBy =
      q.status === "scheduled"
        ? asc(matches.kickoffAt)
        : desc(matches.kickoffAt);

    const rows = await db
      .select()
      .from(matches)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(orderBy)
      .limit(q.limit);

    res.json({ data: rows });
  }),
);

// GET /api/matches/:id — match detail with events and competition info
matchesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [match] = await db
      .select({
        match: matches,
        competition: {
          id: competitions.id,
          name: competitions.name,
          logoUrl: competitions.logoUrl,
        },
      })
      .from(matches)
      .leftJoin(seasons, eq(matches.seasonId, seasons.id))
      .leftJoin(competitions, eq(seasons.competitionId, competitions.id))
      .where(eq(matches.id, req.params.id))
      .limit(1);

    if (!match) throw notFound("Match");

    const events = await db
      .select()
      .from(matchEvents)
      .where(eq(matchEvents.matchId, match.match.id))
      .orderBy(asc(matchEvents.minute));

    res.json({
      data: {
        ...match.match,
        competition: match.competition,
        events,
      },
    });
  }),
);
