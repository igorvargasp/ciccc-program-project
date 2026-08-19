// ─────────────────────────── Users ───────────────────────────

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  preferences?: UserPreferences | null;
}

export interface UserPreferences {
  id: string;
  theme: 'light' | 'dark' | 'system';
  languageId?: string;
  notifyMatches: boolean;
  notifyTeamNews: boolean;
  dashboardLayout?: unknown;
}

// ─────────────────────────── Core football ───────────────────────────

export interface Team {
  id: string;
  externalApiId?: string;
  name: string;
  shortName?: string;
  country?: string;
  crestUrl?: string;
  stadium?: string;
  foundedYear?: number;
}

/** Team summary embedded in other payloads (standings rows, match lists). */
export interface TeamRef {
  id: string;
  name: string;
  shortName?: string | null;
  crestUrl?: string | null;
}

export interface TeamStats {
  winRate: string;
  goalsScored: number;
  cleanSheets: number;
}

/** GET /teams/:id — the team row plus its stats block. */
export interface TeamDetail extends Team {
  stats?: TeamStats;
}

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  externalApiId?: string;
  teamId?: string;
  fullName: string;
  position?: Position;
  shirtNumber?: number;
  nationality?: string;
  dateOfBirth?: string;
  marketValue?: string;
  photoUrl?: string;
}

export interface Competition {
  id: string;
  externalApiId?: string;
  name: string;
  country?: string;
  type: 'league' | 'cup';
  logoUrl?: string;
}

export interface Season {
  id: string;
  externalApiId?: string;
  competitionId: string;
  label: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface StandingRow {
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  team: Pick<Team, 'id' | 'name' | 'shortName' | 'crestUrl'>;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface Match {
  id: string;
  externalApiId?: string;
  seasonId?: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt?: string;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  venue?: string;
  matchday?: number;
}

/**
 * A match as it arrives from a listing endpoint. `GET /matches` returns team
 * ids only; `GET /teams/:id/matches` returns nested team objects instead — so
 * consumers must handle either side being present.
 */
export interface MatchListItem extends Omit<Match, 'homeTeamId' | 'awayTeamId'> {
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeam?: TeamRef;
  awayTeam?: TeamRef;
}

export type MatchEventType = 'goal' | 'assist' | 'yellow' | 'red' | 'sub';

export interface MatchEvent {
  id: string;
  matchId?: string;
  playerId?: string | null;
  type: MatchEventType;
  minute?: number | null;
  detail?: string | null;
  /**
   * Names come straight from the event provider, which shares no identifiers
   * with our squads — playerId is only set when one could be matched, so the
   * name is what the report can always rely on.
   */
  playerName?: string | null;
  /** Assist provider for a goal; for a substitution, the player coming ON. */
  assistName?: string | null;
  assistPlayerId?: string | null;
  /** Which side the event belongs to. */
  isHome?: boolean | null;
  playerPhotoUrl?: string | null;
}

/** One team-vs-team statistic for a match (shots, fouls, possession…). */
export interface MatchStat {
  stat: string;
  home: number | null;
  away: number | null;
}

/** GET /matches/:id — the match row plus its competition and event timeline. */
export interface MatchDetail extends Match {
  competition?: Pick<Competition, 'id' | 'name' | 'logoUrl'> | null;
  season?: { id: string; label: string } | null;
  homeTeam?: Pick<Team, 'id' | 'name' | 'shortName' | 'crestUrl'> | null;
  awayTeam?: Pick<Team, 'id' | 'name' | 'shortName' | 'crestUrl'> | null;
  events: MatchEvent[];
  stats?: MatchStat[];
}

// ─────────────────────────── Statistics ───────────────────────────

export interface TeamStatistics {
  id: string;
  teamId: string;
  seasonId?: string;
  avgPossession?: string;
  goalsPerGame?: string;
  cleanSheets: number;
  winRate?: string;
  form?: ('W' | 'D' | 'L')[];
}

export interface PlayerStatistics {
  id: string;
  playerId: string;
  seasonId?: string;
  appearances: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  rating?: string;
}

// ─────────────────────────── News ───────────────────────────

export interface NewsArticle {
  id: string;
  source?: string;
  externalUrl: string;
  teamId?: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  publishedAt?: string;
  fetchedAt: string;
}

// ─────────────────────────── Favorites ───────────────────────────

export interface FavoriteTeam {
  id: string;
  isPrimary: boolean;
  createdAt: string;
  team: Team;
}

// ─────────────────────────── Simulator ───────────────────────────

export interface Simulation {
  id: string;
  userId: string;
  matchId?: string;
  simulatedHomeScore?: number;
  simulatedAwayScore?: number;
  resultingStandings?: StandingRow[];
  createdAt: string;
}

// ─────────────────────────── Notifications ───────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: 'match' | 'news' | 'result';
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
}

// ─────────────────────────── i18n ───────────────────────────

export interface Language {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

// ─────────────────────────── Lineups ───────────────────────────

export interface Lineup {
  id: string;
  userId: string;
  teamId?: string;
  formationId?: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  players?: LineupPlayer[];
}

export interface LineupPlayer {
  id: string;
  lineupId: string;
  playerId: string;
  formationSlotId?: string;
  isCaptain: boolean;
}

/**
 * Player shape the lineup builder passes around (search modal → pitch slot).
 * Mirrors the fields `GET /players` returns, not the full `Player` record.
 */
export interface LineupSlotPlayer {
  id: string | number;
  fullName: string;
  photoUrl?: string | null;
  position: string;
  nationality?: string | null;
  teamName?: string | null;
  photoSource?: string | null;
}

// ─────────────────────────── API response wrappers ───────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface StandingsResponse {
  seasonId: string;
  simulated: boolean;
  table: StandingRow[];
}

export interface TeamStandingsItem {
  competition: Pick<Competition, 'id' | 'name' | 'logoUrl'>;
  seasonId: string;
  label: string;
  isCurrent: boolean;
  table: StandingRow[];
}
