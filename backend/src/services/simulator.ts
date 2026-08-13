import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { matches, simulations, standings, teams } from "../db/schema.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { emitTo, room, RT } from "../realtime/io.js";

interface Row {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

function applyResult(row: Row, scored: number, conceded: number) {
  row.played += 1;
  row.goalsFor += scored;
  row.goalsAgainst += conceded;
  if (scored > conceded) {
    row.won += 1;
    row.points += 3;
  } else if (scored === conceded) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

function rank(rows: Row[]): (Row & { position: number })[] {
  return [...rows]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName),
    )
    .map((r, i) => ({ ...r, position: i + 1 }));
}

/**
 * Simulate a single match result and recompute the league table.
 *
 * Starts from the season's *real* standings, applies the hypothetical result to
 * the two teams, re-ranks, then:
 *   - snapshots the resulting table into the `simulations` row (per user),
 *   - refreshes the season's shared "latest simulation" standings (isSimulated),
 *   - broadcasts the new table to the season room and the requesting user.
 */
export async function simulateMatch(params: {
  userId: string | null;
  matchId: string;
  homeScore: number;
  awayScore: number;
}) {
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, params.matchId))
    .limit(1);
  if (!match) throw notFound("Match");
  if (!match.seasonId)
    throw new HttpError(400, "Match is not attached to a season");

  const seasonId = match.seasonId;

  // Base table = real standings for the season, keyed by team.
  const baseRows = await db
    .select({
      teamId: standings.teamId,
      teamName: teams.name,
      played: standings.played,
      won: standings.won,
      drawn: standings.drawn,
      lost: standings.lost,
      goalsFor: standings.goalsFor,
      goalsAgainst: standings.goalsAgainst,
      points: standings.points,
    })
    .from(standings)
    .innerJoin(teams, eq(standings.teamId, teams.id))
    .where(
      and(eq(standings.seasonId, seasonId), eq(standings.isSimulated, false)),
    );

  const table = new Map<string, Row>(baseRows.map((r) => [r.teamId, { ...r }]));

  // Ensure both teams exist in the table (a fixture may precede any results).
  for (const teamId of [match.homeTeamId, match.awayTeamId]) {
    if (!table.has(teamId)) {
      const [team] = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);
      table.set(teamId, {
        teamId,
        teamName: team?.name ?? "Unknown",
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    }
  }

  applyResult(table.get(match.homeTeamId)!, params.homeScore, params.awayScore);
  applyResult(table.get(match.awayTeamId)!, params.awayScore, params.homeScore);

  const ranked = rank([...table.values()]);

  // Refresh the season's shared simulated standings (replace previous snapshot).
  await db
    .delete(standings)
    .where(
      and(eq(standings.seasonId, seasonId), eq(standings.isSimulated, true)),
    );
  await db.insert(standings).values(
    ranked.map((r) => ({
      seasonId,
      teamId: r.teamId,
      position: r.position,
      played: r.played,
      won: r.won,
      drawn: r.drawn,
      lost: r.lost,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      points: r.points,
      isSimulated: true,
    })),
  );

  // Persist the per-user simulation record with the full resulting table.
  const [simulation] = await db
    .insert(simulations)
    .values({
      userId: params.userId,
      matchId: params.matchId,
      simulatedHomeScore: params.homeScore,
      simulatedAwayScore: params.awayScore,
      resultingStandings: ranked,
    })
    .returning();

  const payload = { seasonId, matchId: params.matchId, table: ranked };
  emitTo(room.season(seasonId), RT.STANDINGS_UPDATE, payload);
  if (params.userId) {
    emitTo(room.user(params.userId), RT.STANDINGS_UPDATE, payload);
  }

  return { simulation, table: ranked };
}
