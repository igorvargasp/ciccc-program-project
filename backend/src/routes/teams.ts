import { Router } from "express";
import { and, or, eq, asc, gte, ilike } from "drizzle-orm";
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
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/teams — list/search teams
teamsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, country, limit } = listQuery.parse(req.query);

    const filters = [];
    if (search) filters.push(ilike(teams.name, `%${search}%`));
    if (country) filters.push(eq(teams.country, country));

    const rows = await db
      .select({
        id: teams.id,
        name: teams.name,
        country: teams.country,
        crestUrl: teams.crestUrl, // Certifique-se de incluir explicitamente
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
        ...team, // Pega todas as propriedades válidas do banco (id, name, crestUrl, etc.)
        stats, // Adiciona as estatísticas junto
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

// GET /api/teams/:id/matches — upcoming matches
teamsRouter.get(
  "/:id/matches",
  asyncHandler(async (req, res) => {
    const teamId = req.params.id;

    const today = new Date().toISOString();

    // 1. Verifica se o time existe
    const [team] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) throw notFound("Team");

    // 2. Cria os aliases para diferenciar o time mandante do visitante
    const homeTeamAlias = alias(teams, "home_team");
    const awayTeamAlias = alias(teams, "away_team");

    // 3. Busca as partidas fazendo os joins corretos
    const upcomingMatches = await db
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
      .where(
        and(
          or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId)),
          gte(matches.kickoffAt, new Date()),
        ),
      )
      .orderBy(asc(matches.kickoffAt))
      .limit(10);

    res.json({ data: upcomingMatches });
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
