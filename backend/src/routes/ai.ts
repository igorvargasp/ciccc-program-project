import { Router } from "express";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  chatMessages,
  chatSessions,
  matchPredictions,
  matches,
  players,
  playerStatistics,
  standings,
  teams,
  teamStatistics,
  transferSuggestions,
  userFavoriteTeams,
} from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { currentUserId, requireAuth } from "../middleware/auth.js";
import { emitTo, room, RT } from "../realtime/io.js";
import { aiEnabled, chat, predictMatch, suggestTransfers } from "../services/ai.js";

export const aiRouter = Router();

// GET /api/ai/status — lets the frontend hide AI features when unconfigured
aiRouter.get("/status", (_req, res) => {
  res.json({ data: { enabled: aiEnabled() } });
});

// ─────────────────────────── Context builders ───────────────────────────

async function teamFormLine(teamId: string): Promise<string> {
  const [stat] = await db
    .select({ form: teamStatistics.form, winRate: teamStatistics.winRate })
    .from(teamStatistics)
    .where(eq(teamStatistics.teamId, teamId))
    .limit(1);
  const [standing] = await db
    .select({ position: standings.position, points: standings.points })
    .from(standings)
    .where(and(eq(standings.teamId, teamId), eq(standings.isSimulated, false)))
    .limit(1);

  const parts: string[] = [];
  if (standing?.position) parts.push(`league position ${standing.position} (${standing.points} pts)`);
  if (stat?.form) parts.push(`recent form ${JSON.stringify(stat.form)}`);
  if (stat?.winRate) parts.push(`win rate ${stat.winRate}%`);
  return parts.length ? parts.join(", ") : "no recent data available";
}

async function buildTeamContext(teamId: string): Promise<{ name: string; text: string }> {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) throw notFound("Team");

  const recent = await db
    .select()
    .from(matches)
    .where(and(or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId)), eq(matches.status, "finished")))
    .orderBy(desc(matches.kickoffAt))
    .limit(5);

  const upcoming = await db
    .select()
    .from(matches)
    .where(and(or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId)), eq(matches.status, "scheduled")))
    .orderBy(asc(matches.kickoffAt))
    .limit(3);

  const scorers = await db
    .select({ name: players.fullName, goals: playerStatistics.goals, assists: playerStatistics.assists })
    .from(playerStatistics)
    .innerJoin(players, eq(playerStatistics.playerId, players.id))
    .where(eq(players.teamId, teamId))
    .orderBy(desc(playerStatistics.goals))
    .limit(5);

  const lines = [
    `Team: ${team.name}`,
    `Standing/form: ${await teamFormLine(teamId)}`,
    `Recent results: ${recent.map((m) => `${m.homeScore}-${m.awayScore}`).join(", ") || "n/a"}`,
    `Upcoming: ${upcoming.map((m) => m.kickoffAt?.toISOString().slice(0, 10)).join(", ") || "n/a"}`,
    `Top scorers: ${scorers.map((s) => `${s.name} (${s.goals}g/${s.assists}a)`).join(", ") || "n/a"}`,
  ];
  return { name: team.name, text: lines.join("\n") };
}

// ─────────────────────────── Match prediction ───────────────────────────

const predictSchema = z.object({ matchId: z.string().uuid() });

// POST /api/ai/predictions — AI win/draw/loss probabilities for a match
aiRouter.post(
  "/predictions",
  asyncHandler(async (req, res) => {
    const { matchId } = predictSchema.parse(req.body);

    const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!match) throw notFound("Match");

    const [home, away] = await Promise.all([
      buildTeamContext(match.homeTeamId),
      buildTeamContext(match.awayTeamId),
    ]);

    const prediction = await predictMatch({
      home: home.name,
      away: away.name,
      contextText: `HOME — ${home.text}\n\nAWAY — ${away.text}`,
    });

    const [row] = await db
      .insert(matchPredictions)
      .values({
        matchId,
        homeWinProb: String(prediction.homeWinProb),
        drawProb: String(prediction.drawProb),
        awayWinProb: String(prediction.awayWinProb),
        modelVersion: "claude",
        reasoning: { text: prediction.reasoning },
      })
      .returning();

    emitTo(room.match(matchId), RT.PREDICTION_NEW, row);
    res.status(201).json({ data: row });
  }),
);

// ─────────────────────────── Chatbot ───────────────────────────

aiRouter.use("/chat", requireAuth());

const chatSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
});

// POST /api/ai/chat — ask the football assistant (persists a chat session)
aiRouter.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { sessionId, message } = chatSchema.parse(req.body);

    // Resolve or create the chat session (must belong to the user).
    let session = sessionId
      ? (await db.select().from(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))).limit(1))[0]
      : undefined;
    if (sessionId && !session) throw notFound("Chat session");
    if (!session) {
      [session] = await db
        .insert(chatSessions)
        .values({ userId, title: message.slice(0, 60) })
        .returning();
    }
    if (!session) throw new HttpError(500, "Failed to create chat session");

    // Load prior turns for context continuity.
    const prior = await db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.chatSessionId, session.id))
      .orderBy(asc(chatMessages.createdAt));

    // Build context from the user's primary favorite team, if any.
    const [fav] = await db
      .select({ teamId: userFavoriteTeams.teamId })
      .from(userFavoriteTeams)
      .where(and(eq(userFavoriteTeams.userId, userId), eq(userFavoriteTeams.isPrimary, true)))
      .limit(1);
    const context = fav
      ? (await buildTeamContext(fav.teamId)).text
      : "The user has not selected a favorite team yet.";

    const history = [
      ...prior.map((p) => ({ role: p.role as "user" | "assistant", content: p.content })),
      { role: "user" as const, content: message },
    ];

    const reply = await chat(history, context);

    // Persist both turns.
    await db.insert(chatMessages).values([
      { chatSessionId: session.id, role: "user", content: message },
      { chatSessionId: session.id, role: "assistant", content: reply, contextUsed: { favoriteTeamId: fav?.teamId ?? null } },
    ]);

    res.json({ data: { sessionId: session.id, reply } });
  }),
);

// ─────────────────────────── Transfer advisor ───────────────────────────

const transferSchema = z.object({ teamId: z.string().uuid() });

// POST /api/ai/transfer — suggest signings to strengthen a team
aiRouter.post(
  "/transfer",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { teamId } = transferSchema.parse(req.body);

    const ctx = await buildTeamContext(teamId);
    const suggestions = await suggestTransfers({ team: ctx.name, contextText: ctx.text });

    const rows = await db
      .insert(transferSuggestions)
      .values(
        suggestions.map((s) => ({
          teamId,
          weakPosition: s.position,
          rationale: `${s.playerName} — ${s.rationale}`,
          fitScore: String(s.fitScore),
          dataSource: "claude",
        })),
      )
      .returning();

    res.status(201).json({ data: { suggestions, stored: rows } });
  }),
);
