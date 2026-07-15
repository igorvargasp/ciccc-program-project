import { db } from "../db/index.js";
import { competitions, matches, players, seasons, standings, teams } from "../db/schema.js";
import { emitTo, room, RT } from "../realtime/io.js";
import {
  getCompetitionMatches,
  getCompetitionStandings,
  getCompetitionTeams,
  getLiveMatches,
  trackedCompetitions,
  type FdMatch,
  type FdSquadPlayer,
  type FdTeam,
} from "./football-data.js";

/**
 * Maps football-data.org payloads into our tables. All writes are upserts keyed
 * by `external_api_id`, so every sync is idempotent and safe to re-run.
 */

function mapStatus(s: string): "scheduled" | "live" | "finished" {
  if (s === "FINISHED") return "finished";
  if (s === "IN_PLAY" || s === "PAUSED") return "live";
  return "scheduled";
}

function seasonLabel(season: { startDate: string; endDate: string }): string {
  return `${season.startDate.slice(0, 4)}/${season.endDate.slice(2, 4)}`;
}

// ─────────────────────────── Upsert helpers ───────────────────────────

async function upsertCompetition(comp: {
  id: number;
  name: string;
  emblem?: string;
}): Promise<string> {
  const [row] = await db
    .insert(competitions)
    .values({
      externalApiId: String(comp.id),
      name: comp.name,
      type: "league",
      logoUrl: comp.emblem,
    })
    .onConflictDoUpdate({
      target: competitions.externalApiId,
      set: { name: comp.name, logoUrl: comp.emblem },
    })
    .returning({ id: competitions.id });
  return row.id;
}

async function upsertSeason(
  competitionId: string,
  season: { id: number; startDate: string; endDate: string },
): Promise<string> {
  const [row] = await db
    .insert(seasons)
    .values({
      externalApiId: String(season.id),
      competitionId,
      label: seasonLabel(season),
      startDate: season.startDate,
      endDate: season.endDate,
      isCurrent: true,
    })
    .onConflictDoUpdate({
      target: seasons.externalApiId,
      set: { label: seasonLabel(season), startDate: season.startDate, endDate: season.endDate },
    })
    .returning({ id: seasons.id });
  return row.id;
}

async function upsertTeam(team: FdTeam): Promise<string> {
  const [row] = await db
    .insert(teams)
    .values({
      externalApiId: String(team.id),
      name: team.name,
      shortName: team.shortName ?? team.tla,
      crestUrl: team.crest,
      stadium: team.venue,
      foundedYear: team.founded,
    })
    .onConflictDoUpdate({
      target: teams.externalApiId,
      set: {
        name: team.name,
        shortName: team.shortName ?? team.tla,
        crestUrl: team.crest,
        // Only overwrite optional details when the payload actually has them.
        ...(team.venue ? { stadium: team.venue } : {}),
        ...(team.founded ? { foundedYear: team.founded } : {}),
      },
    })
    .returning({ id: teams.id });
  return row.id;
}

/** Map football-data's free-text position to our GK/DEF/MID/FWD bucket. */
function mapPosition(p?: string): "GK" | "DEF" | "MID" | "FWD" | undefined {
  if (!p) return undefined;
  const s = p.toLowerCase();
  if (s.includes("keeper")) return "GK";
  if (s.includes("back") || s.includes("defence") || s.includes("defender")) return "DEF";
  if (s.includes("midfield")) return "MID";
  if (
    s.includes("forward") ||
    s.includes("offence") ||
    s.includes("winger") ||
    s.includes("striker") ||
    s.includes("attack")
  )
    return "FWD";
  return undefined;
}

async function upsertPlayer(teamId: string, p: FdSquadPlayer) {
  await db
    .insert(players)
    .values({
      externalApiId: String(p.id),
      teamId,
      fullName: p.name,
      position: mapPosition(p.position),
      shirtNumber: p.shirtNumber,
      nationality: p.nationality,
      dateOfBirth: p.dateOfBirth,
    })
    .onConflictDoUpdate({
      target: players.externalApiId,
      set: {
        teamId,
        fullName: p.name,
        position: mapPosition(p.position),
        shirtNumber: p.shirtNumber,
        nationality: p.nationality,
        dateOfBirth: p.dateOfBirth,
      },
    });
}

async function upsertMatch(m: FdMatch, seasonId: string, homeId: string, awayId: string) {
  const values = {
    externalApiId: String(m.id),
    seasonId,
    homeTeamId: homeId,
    awayTeamId: awayId,
    kickoffAt: new Date(m.utcDate),
    status: mapStatus(m.status),
    homeScore: m.score.fullTime.home,
    awayScore: m.score.fullTime.away,
    venue: m.venue,
    matchday: m.matchday,
  };
  const [row] = await db
    .insert(matches)
    .values(values)
    .onConflictDoUpdate({
      target: matches.externalApiId,
      set: {
        status: values.status,
        homeScore: values.homeScore,
        awayScore: values.awayScore,
        kickoffAt: values.kickoffAt,
        matchday: values.matchday,
      },
    })
    .returning();
  return row;
}

/** Upsert a whole match graph (teams + match) under a known season. */
async function persistMatch(m: FdMatch, seasonId: string) {
  const [homeId, awayId] = await Promise.all([upsertTeam(m.homeTeam), upsertTeam(m.awayTeam)]);
  return upsertMatch(m, seasonId, homeId, awayId);
}

// ─────────────────────────── Sync flows ───────────────────────────

/** Fixtures + results for one competition (its current season). */
export async function syncCompetitionMatches(code: string): Promise<number> {
  const data = await getCompetitionMatches(code);
  if (!data.matches.length) return 0;

  const first = data.matches[0];
  const competitionId = await upsertCompetition(first.competition);
  const seasonId = await upsertSeason(competitionId, first.season);

  for (const m of data.matches) await persistMatch(m, seasonId);
  return data.matches.length;
}

/** Standings table for one competition. */
export async function syncCompetitionStandings(code: string): Promise<number> {
  const data = await getCompetitionStandings(code);
  const competitionId = await upsertCompetition(data.competition);
  const seasonId = await upsertSeason(competitionId, data.season);

  const table = data.standings.find((s) => s.type === "TOTAL")?.table ?? [];
  for (const r of table) {
    const teamId = await upsertTeam(r.team);
    await db
      .insert(standings)
      .values({
        seasonId,
        teamId,
        position: r.position,
        played: r.playedGames,
        won: r.won,
        drawn: r.draw,
        lost: r.lost,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        points: r.points,
        isSimulated: false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [standings.seasonId, standings.teamId, standings.isSimulated],
        set: {
          position: r.position,
          played: r.playedGames,
          won: r.won,
          drawn: r.draw,
          lost: r.lost,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          points: r.points,
          updatedAt: new Date(),
        },
      });
  }
  return table.length;
}

/** Squad/roster for one competition (all teams + their players, one call). */
export async function syncCompetitionSquads(code: string): Promise<number> {
  const data = await getCompetitionTeams(code);
  let count = 0;
  for (const team of data.teams) {
    const teamId = await upsertTeam(team);
    for (const p of team.squad ?? []) {
      await upsertPlayer(teamId, p);
      count += 1;
    }
  }
  return count;
}

/** Refresh squads for every tracked competition. */
export async function syncSquads(): Promise<void> {
  for (const code of trackedCompetitions()) {
    try {
      const n = await syncCompetitionSquads(code);
      console.log(`[sync] ${code}: ${n} players`);
    } catch (err) {
      console.error(`[sync] ${code} squads failed:`, err instanceof Error ? err.message : err);
    }
  }
}

/** Hourly: refresh fixtures/results for every tracked competition. */
export async function syncFixtures(): Promise<void> {
  for (const code of trackedCompetitions()) {
    try {
      const n = await syncCompetitionMatches(code);
      console.log(`[sync] ${code}: ${n} matches`);
    } catch (err) {
      console.error(`[sync] ${code} matches failed:`, err instanceof Error ? err.message : err);
    }
  }
}

/** Daily: refresh fixtures, standings AND squads for every tracked competition. */
export async function syncAll(): Promise<void> {
  for (const code of trackedCompetitions()) {
    try {
      await syncCompetitionMatches(code);
      await syncCompetitionStandings(code);
      await syncCompetitionSquads(code);
      console.log(`[sync] ${code}: matches + standings + squads updated`);
    } catch (err) {
      console.error(`[sync] ${code} full sync failed:`, err instanceof Error ? err.message : err);
    }
  }
}

/**
 * Per-minute live poll: fetch every in-play match (one API call), upsert it,
 * and broadcast `match:update` to that match's room.
 */
export async function pollLiveMatches(): Promise<number> {
  const data = await getLiveMatches();
  for (const m of data.matches) {
    const competitionId = await upsertCompetition(m.competition);
    const seasonId = await upsertSeason(competitionId, m.season);
    const row = await persistMatch(m, seasonId);
    emitTo(room.match(row.id), RT.MATCH_UPDATE, row);
  }
  return data.matches.length;
}
