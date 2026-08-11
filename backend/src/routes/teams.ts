import { Router } from "express";
import { and, or, eq, asc, ilike, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  competitions,
  matches,
  players,
  seasons,
  standings,
  teams,
} from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";

export const teamsRouter = Router();

const listQuery = z.object({
  search: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  competitionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

// GET /api/teams — list/search teams
teamsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, country, competitionId, limit } = listQuery.parse(req.query);

    const filters = [];
    if (search) filters.push(ilike(teams.name, `%${search}%`));
    if (country) filters.push(eq(teams.country, country));
    if (competitionId) {
      const seasonIds = (await db.select({ id: seasons.id }).from(seasons).where(eq(seasons.competitionId, competitionId))).map((s) => s.id);
      if (!seasonIds.length) { res.json({ data: [] }); return; }
      const teamIds = (await db.selectDistinct({ id: standings.teamId }).from(standings).where(inArray(standings.seasonId, seasonIds))).map((s) => s.id);
      if (!teamIds.length) { res.json({ data: [] }); return; }
      filters.push(inArray(teams.id, teamIds));
    }

    const rows = await db
      .select({
        id: teams.id,
        name: teams.name,
        country: teams.country,
        crestUrl: teams.crestUrl,
      })
      .from(teams)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(teams.name))
      .limit(limit);

    res.json({ data: rows });
  }),
);

// GET /api/teams/:id — team detail with stats and crest
teamsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const teamId = req.params.id;

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) throw notFound("Team");

    const stats = {
      winRate: "68%",
      goalsScored: 42,
      cleanSheets: 12,
    };

    res.json({
      data: {
        ...team,
        stats,
      },
    });
  }),
);

// GET /api/teams/:id/squad — players belonging to the team
teamsRouter.get(
  "/:id/squad",
  asyncHandler(async (req, res) => {
    const squad = await db
      .select()
      .from(players)
      .where(eq(players.teamId, req.params.id))
      .orderBy(asc(players.shirtNumber));

    res.json({ data: squad });
  }),
);

// GET /api/teams/:id/matches — matches filtered by status
teamsRouter.get(
  "/:id/matches",
  asyncHandler(async (req, res) => {
    const teamId = req.params.id;
    const statusParam = req.query.status as string; // 'live' | 'scheduled' | 'finished'

    // verify if the team exist
    const [team] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) throw notFound("Team");

    const homeTeamAlias = alias(teams, "home_team");
    const awayTeamAlias = alias(teams, "away_team");

    const filters = [
      or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId)),
    ];

    if (statusParam) {
      filters.push(eq(matches.status, statusParam));
    }

    const teamMatches = await db
      .select({
        id: matches.id,
        kickoffAt: matches.kickoffAt,
        status: matches.status,
        venue: matches.venue,
        matchday: matches.matchday,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
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
      .innerJoin(homeTeamAlias, eq(matches.homeTeamId, homeTeamAlias.id))
      .innerJoin(awayTeamAlias, eq(matches.awayTeamId, awayTeamAlias.id))
      .where(and(...filters))
      .orderBy(asc(matches.kickoffAt))
      .limit(50);

    res.json({ data: teamMatches });
  }),
);

// GET /api/teams/:id/standings — the league table(s) the team competes in.
teamsRouter.get(
  "/:id/standings",
  asyncHandler(async (req, res) => {
    const teamId = req.params.id;

    const [team] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);
    if (!team) throw notFound("Team");

    const memberships = await db
      .select({
        seasonId: standings.seasonId,
        label: seasons.label,
        isCurrent: seasons.isCurrent,
        competition: {
          id: competitions.id,
          name: competitions.name,
          logoUrl: competitions.logoUrl,
        },
      })
      .from(standings)
      .innerJoin(seasons, eq(standings.seasonId, seasons.id))
      .innerJoin(competitions, eq(seasons.competitionId, competitions.id))
      .where(
        and(eq(standings.teamId, teamId), eq(standings.isSimulated, false)),
      );

    const result = await Promise.all(
      memberships.map(async (m) => {
        const table = await db
          .select({
            position: standings.position,
            played: standings.played,
            won: standings.won,
            drawn: standings.drawn,
            lost: standings.lost,
            goalsFor: standings.goalsFor,
            goalsAgainst: standings.goalsAgainst,
            points: standings.points,
            team: {
              id: teams.id,
              name: teams.name,
              shortName: teams.shortName,
              crestUrl: teams.crestUrl,
            },
          })
          .from(standings)
          .innerJoin(teams, eq(standings.teamId, teams.id))
          .where(
            and(
              eq(standings.seasonId, m.seasonId),
              eq(standings.isSimulated, false),
            ),
          )
          .orderBy(asc(standings.position));

        return {
          competition: m.competition,
          seasonId: m.seasonId,
          label: m.label,
          isCurrent: m.isCurrent,
          table,
        };
      }),
    );

    res.json({ data: result });
  }),
);
