import { Router } from "express";
import { and, asc, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { competitions, players, seasons, standings, teams } from "../db/schema.js";
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
//
// TODO(favorite-team picker): this flat list is capped at 100 with no
// pagination, so once all tracked leagues are synced (~120+ teams) a
// "browse all" screen would silently miss some. For the onboarding picker,
// add a grouped endpoint — e.g. GET /api/teams/by-competition returning each
// league with its teams (join via competition_teams / standings) — and/or an
// optional ?competitionId= filter plus offset-based pagination here.
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
      .select()
      .from(teams)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(teams.name))
      .limit(limit);

    res.json({ data: rows });
  }),
);

// GET /api/teams/:id — team detail
teamsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [team] = await db.select().from(teams).where(eq(teams.id, req.params.id)).limit(1);
    if (!team) throw notFound("Team");
    res.json({ data: team });
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

// GET /api/teams/:id/standings — the league table(s) the team competes in.
// Perfect for a favorite-team dashboard: pass the team id, get its full
// standings back (a team can appear in more than one competition).
teamsRouter.get(
  "/:id/standings",
  asyncHandler(async (req, res) => {
    const teamId = req.params.id;

    const [team] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId)).limit(1);
    if (!team) throw notFound("Team");

    // Which seasons/competitions does this team have a (real) standings row in?
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
      .where(and(eq(standings.teamId, teamId), eq(standings.isSimulated, false)));

    // For each, return the full ordered table.
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
          .where(and(eq(standings.seasonId, m.seasonId), eq(standings.isSimulated, false)))
          .orderBy(asc(standings.position));

        return { competition: m.competition, seasonId: m.seasonId, label: m.label, isCurrent: m.isCurrent, table };
      }),
    );

    res.json({ data: result });
  }),
);
