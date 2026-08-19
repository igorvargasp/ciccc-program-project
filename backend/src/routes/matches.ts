import { Router } from "express";
import { and, asc, desc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { alias } from "drizzle-orm/pg-core";
import {
  matches,
  matchEvents,
  matchStats,
  seasons,
  competitions,
  teams,
} from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";

export const matchesRouter = Router();

const listQuery = z.object({
  teamId: z.string().uuid().optional(),
  seasonId: z.string().uuid().optional(),
  competitionId: z.string().uuid().optional(),
  status: z.enum(["scheduled", "live", "finished"]).optional(),
  matchday: z.coerce.number().int().min(1).optional(),
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
    if (q.matchday) filters.push(eq(matches.matchday, q.matchday));
    if (q.from) filters.push(gte(matches.kickoffAt, q.from));
    if (q.to) filters.push(lte(matches.kickoffAt, q.to));

    // Upcoming matches ascending; everything else most-recent first.
    const orderBy =
      q.status === "scheduled"
        ? asc(matches.kickoffAt)
        : desc(matches.kickoffAt);

    // Competition and both clubs come back with every match: the calendar
    // groups by competition and renders crests, and without them the UI can
    // only fall back to placeholder names.
    const homeTeamAlias = alias(teams, "home_team");
    const awayTeamAlias = alias(teams, "away_team");

    const rows = await db
      .select({
        match: matches,
        competition: {
          id: competitions.id,
          name: competitions.name,
          logoUrl: competitions.logoUrl,
        },
        season: { id: seasons.id, label: seasons.label },
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
      .from(matches)
      .leftJoin(seasons, eq(matches.seasonId, seasons.id))
      .leftJoin(competitions, eq(seasons.competitionId, competitions.id))
      .leftJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
      .leftJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(orderBy)
      .limit(q.limit);

    res.json({
      data: rows.map((r) => ({
        ...r.match,
        competition: r.competition,
        season: r.season,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
      })),
    });
  }),
);

// GET /api/matches/:id — match detail with events and competition info
matchesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    // The detail view renders both clubs with their crests, so join them here
    // as the list endpoint does — otherwise the match report has no teams.
    const homeTeamAlias = alias(teams, "home_team");
    const awayTeamAlias = alias(teams, "away_team");

    const [match] = await db
      .select({
        match: matches,
        competition: {
          id: competitions.id,
          name: competitions.name,
          logoUrl: competitions.logoUrl,
        },
        season: { id: seasons.id, label: seasons.label },
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
      .from(matches)
      .leftJoin(seasons, eq(matches.seasonId, seasons.id))
      .leftJoin(competitions, eq(seasons.competitionId, competitions.id))
      .leftJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
      .leftJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
      .where(eq(matches.id, req.params.id))
      .limit(1);

    if (!match) throw notFound("Match");

    const [events, stats] = await Promise.all([
      db
        .select()
        .from(matchEvents)
        .where(eq(matchEvents.matchId, match.match.id))
        .orderBy(asc(matchEvents.minute)),
      db
        .select({ stat: matchStats.stat, home: matchStats.home, away: matchStats.away })
        .from(matchStats)
        .where(eq(matchStats.matchId, match.match.id))
        .orderBy(asc(matchStats.stat)),
    ]);

    res.json({
      data: {
        ...match.match,
        competition: match.competition,
        season: match.season,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        events,
        stats,
      },
    });
  }),
);
