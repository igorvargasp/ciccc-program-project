import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Schema for the Smart Football Hub, mirroring requirements/erd/ERD.md.
 *
 * NOTE ON USERS: authentication is handled by Neon Auth (Stack Auth). The
 * canonical identity (email, password, verification) lives in Neon Auth and is
 * synced to the `neon_auth.users_sync` table. Our `users` table stores
 * app-specific profile data keyed by the Stack Auth user id (a text `sub`),
 * provisioned just-in-time on the first authenticated request.
 */

// ─────────────────────────────── Users & preferences ───────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Stack Auth user id (JWT `sub`)
  email: varchar("email", { length: 320 }),
  displayName: varchar("display_name", { length: 120 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const languages = pgTable("languages", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(), // en | pt | es
  name: varchar("name", { length: 64 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: varchar("theme", { length: 16 }).default("system").notNull(), // light | dark | system
  languageId: uuid("language_id").references(() => languages.id),
  notifyMatches: boolean("notify_matches").default(true).notNull(),
  notifyTeamNews: boolean("notify_team_news").default(true).notNull(),
  dashboardLayout: jsonb("dashboard_layout"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const translations = pgTable(
  "translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    languageId: uuid("language_id")
      .notNull()
      .references(() => languages.id, { onDelete: "cascade" }),
    namespace: varchar("namespace", { length: 64 }).notNull(),
    key: varchar("key", { length: 128 }).notNull(),
    value: text("value").notNull(),
  },
  (t) => ({
    uniqPerKey: uniqueIndex("translations_lang_ns_key_uq").on(t.languageId, t.namespace, t.key),
  }),
);

// ─────────────────────────────── Core football data ───────────────────────────────

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalApiId: varchar("external_api_id", { length: 64 }).unique(),
  name: varchar("name", { length: 120 }).notNull(),
  shortName: varchar("short_name", { length: 32 }),
  country: varchar("country", { length: 64 }),
  crestUrl: text("crest_url"),
  stadium: varchar("stadium", { length: 120 }),
  foundedYear: integer("founded_year"),
});

export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalApiId: varchar("external_api_id", { length: 64 }).unique(),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  position: varchar("position", { length: 8 }), // GK | DEF | MID | FWD
  shirtNumber: integer("shirt_number"),
  nationality: varchar("nationality", { length: 64 }),
  dateOfBirth: date("date_of_birth"),
  marketValue: numeric("market_value", { precision: 14, scale: 2 }),
  photoUrl: text("photo_url"),
  // Which source supplied photo_url — "wikidata" (Commons, freely licensed) or
  // "thesportsdb". Worth recording: the two differ in licensing, so you need to
  // know which images are safe to reuse.
  photoSource: varchar("photo_source", { length: 16 }),
  // When we last looked for this player's photo, across all sources. Set even
  // when nothing is found, so the backfill doesn't retry permanent misses on
  // every run and starve players it hasn't tried yet.
  photoCheckedAt: timestamp("photo_checked_at", { withTimezone: true }),
});

export const competitions = pgTable("competitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalApiId: varchar("external_api_id", { length: 64 }).unique(),
  name: varchar("name", { length: 120 }).notNull(),
  country: varchar("country", { length: 64 }),
  type: varchar("type", { length: 16 }).default("league").notNull(), // league | cup
  logoUrl: text("logo_url"),
});

export const seasons = pgTable("seasons", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalApiId: varchar("external_api_id", { length: 64 }).unique(),
  competitionId: uuid("competition_id")
    .notNull()
    .references(() => competitions.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 16 }).notNull(), // 2025/26
  startDate: date("start_date"),
  endDate: date("end_date"),
  isCurrent: boolean("is_current").default(false).notNull(),
});

export const competitionTeams = pgTable(
  "competition_teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
  },
  (t) => ({
    uniqSeasonTeam: uniqueIndex("competition_teams_season_team_uq").on(t.seasonId, t.teamId),
  }),
);

export const matches = pgTable("matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalApiId: varchar("external_api_id", { length: 64 }).unique(),
  seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "cascade" }),
  homeTeamId: uuid("home_team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  awayTeamId: uuid("away_team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  kickoffAt: timestamp("kickoff_at", { withTimezone: true }),
  status: varchar("status", { length: 16 }).default("scheduled").notNull(), // scheduled | live | finished
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  venue: varchar("venue", { length: 120 }),
  matchday: integer("matchday"),
});

export const matchEvents = pgTable("match_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  playerId: uuid("player_id").references(() => players.id, { onDelete: "set null" }),
  type: varchar("type", { length: 16 }).notNull(), // goal | assist | yellow | red | sub
  minute: integer("minute"),
  detail: varchar("detail", { length: 160 }),
});

export const standings = pgTable(
  "standings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    position: integer("position"),
    played: integer("played").default(0).notNull(),
    won: integer("won").default(0).notNull(),
    drawn: integer("drawn").default(0).notNull(),
    lost: integer("lost").default(0).notNull(),
    goalsFor: integer("goals_for").default(0).notNull(),
    goalsAgainst: integer("goals_against").default(0).notNull(),
    points: integer("points").default(0).notNull(),
    isSimulated: boolean("is_simulated").default(false).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqSeasonTeamSim: uniqueIndex("standings_season_team_sim_uq").on(
      t.seasonId,
      t.teamId,
      t.isSimulated,
    ),
  }),
);

// ─────────────────────────────── Statistics ───────────────────────────────

export const teamStatistics = pgTable("team_statistics", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "cascade" }),
  avgPossession: numeric("avg_possession", { precision: 5, scale: 2 }),
  goalsPerGame: numeric("goals_per_game", { precision: 5, scale: 2 }),
  cleanSheets: integer("clean_sheets").default(0).notNull(),
  winRate: numeric("win_rate", { precision: 5, scale: 2 }),
  form: jsonb("form"), // last 5 results
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const playerStatistics = pgTable("player_statistics", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "cascade" }),
  appearances: integer("appearances").default(0).notNull(),
  goals: integer("goals").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),
  minutesPlayed: integer("minutes_played").default(0).notNull(),
  rating: numeric("rating", { precision: 4, scale: 2 }),
});

// ─────────────────────────────── News ───────────────────────────────

export const newsArticles = pgTable("news_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: varchar("source", { length: 120 }),
  externalUrl: text("external_url").unique(),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  title: varchar("title", { length: 300 }).notNull(),
  summary: text("summary"),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────── Favorites ───────────────────────────────

export const userFavoriteTeams = pgTable(
  "user_favorite_teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqUserTeam: unique().on(t.userId, t.teamId),
  }),
);

// ─────────────────────────────── Lineup builder ───────────────────────────────

export const formations = pgTable("formations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 16 }).notNull().unique(), // 4-3-3 | 4-4-2 | 3-5-2
  layout: jsonb("layout"), // slot coordinates
});

export const formationSlots = pgTable("formation_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  formationId: uuid("formation_id")
    .notNull()
    .references(() => formations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 8 }).notNull(), // GK | LB | CM | ST ...
  posX: numeric("pos_x", { precision: 5, scale: 2 }),
  posY: numeric("pos_y", { precision: 5, scale: 2 }),
});

export const lineups = pgTable("lineups", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  formationId: uuid("formation_id").references(() => formations.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lineupPlayers = pgTable(
  "lineup_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lineupId: uuid("lineup_id")
      .notNull()
      .references(() => lineups.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    formationSlotId: uuid("formation_slot_id").references(() => formationSlots.id, {
      onDelete: "set null",
    }),
    isCaptain: boolean("is_captain").default(false).notNull(),
  },
  (t) => ({
    uniqLineupSlot: unique().on(t.lineupId, t.formationSlotId),
  }),
);

export const lineupShares = pgTable("lineup_shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  lineupId: uuid("lineup_id")
    .notNull()
    .references(() => lineups.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shareToken: varchar("share_token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────── Simulator ───────────────────────────────

export const simulations = pgTable("simulations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
  simulatedHomeScore: integer("simulated_home_score"),
  simulatedAwayScore: integer("simulated_away_score"),
  resultingStandings: jsonb("resulting_standings"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────── Notifications ───────────────────────────────

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 16 }).notNull(), // match | news | result
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────── AI features ───────────────────────────────

export const matchPredictions = pgTable("match_predictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  homeWinProb: numeric("home_win_prob", { precision: 5, scale: 2 }),
  drawProb: numeric("draw_prob", { precision: 5, scale: 2 }),
  awayWinProb: numeric("away_win_prob", { precision: 5, scale: 2 }),
  modelVersion: varchar("model_version", { length: 64 }),
  reasoning: jsonb("reasoning"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transferSuggestions = pgTable("transfer_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  playerId: uuid("player_id").references(() => players.id, { onDelete: "set null" }),
  weakPosition: varchar("weak_position", { length: 16 }),
  rationale: text("rationale"),
  fitScore: numeric("fit_score", { precision: 5, scale: 2 }),
  dataSource: varchar("data_source", { length: 120 }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatSessionId: uuid("chat_session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }).notNull(), // user | assistant
  content: text("content").notNull(),
  contextUsed: jsonb("context_used"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────── Relations ───────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  preference: one(userPreferences),
  favoriteTeams: many(userFavoriteTeams),
  lineups: many(lineups),
  simulations: many(simulations),
  notifications: many(notifications),
  chatSessions: many(chatSessions),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
  favoritedBy: many(userFavoriteTeams),
  standings: many(standings),
  statistics: many(teamStatistics),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
  statistics: many(playerStatistics),
  lineupPlacements: many(lineupPlayers),
}));

export const competitionsRelations = relations(competitions, ({ many }) => ({
  seasons: many(seasons),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  competition: one(competitions, {
    fields: [seasons.competitionId],
    references: [competitions.id],
  }),
  matches: many(matches),
  standings: many(standings),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  season: one(seasons, { fields: [matches.seasonId], references: [seasons.id] }),
  homeTeam: one(teams, { fields: [matches.homeTeamId], references: [teams.id] }),
  awayTeam: one(teams, { fields: [matches.awayTeamId], references: [teams.id] }),
  events: many(matchEvents),
  prediction: one(matchPredictions),
}));

export const lineupsRelations = relations(lineups, ({ one, many }) => ({
  user: one(users, { fields: [lineups.userId], references: [users.id] }),
  team: one(teams, { fields: [lineups.teamId], references: [teams.id] }),
  formation: one(formations, {
    fields: [lineups.formationId],
    references: [formations.id],
  }),
  players: many(lineupPlayers),
  shares: many(lineupShares),
}));

export const formationsRelations = relations(formations, ({ many }) => ({
  slots: many(formationSlots),
  lineups: many(lineups),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, { fields: [chatSessions.userId], references: [users.id] }),
  messages: many(chatMessages),
}));

// Convenience type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Lineup = typeof lineups.$inferSelect;
