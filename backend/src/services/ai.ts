import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

/**
 * AI features backed by Claude (Anthropic API): match prediction, the football
 * assistant chatbot, and the transfer-market advisor.
 *
 * The Anthropic client is created lazily. If `ANTHROPIC_API_KEY` is not set the
 * feature endpoints return 503 while the rest of the API keeps working.
 */

let client: Anthropic | null = null;

export function aiEnabled(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, "AI features are not configured (missing ANTHROPIC_API_KEY)");
  }
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

/** Pull the first text block out of a Claude response (skips thinking blocks). */
function firstText(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

/** Run a Claude call, translating upstream SDK errors into clean HTTP statuses. */
async function runClaude<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      const status = err.status ?? 502;
      if (status === 401 || status === 403) {
        throw new HttpError(502, "AI provider rejected the request — check ANTHROPIC_API_KEY");
      }
      if (status === 429) {
        throw new HttpError(429, "AI provider rate limit reached — try again shortly");
      }
      throw new HttpError(502, `AI provider error (${status})`);
    }
    throw err;
  }
}

/** Parse a model's JSON output, failing with a clean error if it's malformed. */
function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(502, "AI returned malformed output");
  }
}

// ─────────────────────────── Match prediction ───────────────────────────

const PREDICTION_SCHEMA = {
  type: "object",
  properties: {
    home_win_prob: { type: "number", description: "Home win probability, 0-100" },
    draw_prob: { type: "number", description: "Draw probability, 0-100" },
    away_win_prob: { type: "number", description: "Away win probability, 0-100" },
    reasoning: { type: "string", description: "One or two sentences explaining the call" },
  },
  required: ["home_win_prob", "draw_prob", "away_win_prob", "reasoning"],
  additionalProperties: false,
} as const;

export interface MatchPrediction {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  reasoning: string;
}

export async function predictMatch(input: {
  home: string;
  away: string;
  contextText: string;
}): Promise<MatchPrediction> {
  const message = await runClaude(() =>
    getClient().messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: PREDICTION_SCHEMA } },
      system:
        "You are a football analyst. Given recent form and standings, estimate win/draw/loss " +
        "probabilities for the home team. The three probabilities must sum to ~100. Base your " +
        "answer only on the supplied data; do not invent statistics.",
      messages: [
        {
          role: "user",
          content: `Predict the result of ${input.home} (home) vs ${input.away} (away).\n\nData:\n${input.contextText}`,
        },
      ],
    }),
  );

  const parsed = parseJson<{
    home_win_prob: number;
    draw_prob: number;
    away_win_prob: number;
    reasoning: string;
  }>(firstText(message));

  return {
    homeWinProb: parsed.home_win_prob,
    drawProb: parsed.draw_prob,
    awayWinProb: parsed.away_win_prob,
    reasoning: parsed.reasoning,
  };
}

// ─────────────────────────── Chatbot assistant ───────────────────────────

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function chat(history: ChatTurn[], contextText: string): Promise<string> {
  const message = await runClaude(() =>
    getClient().messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system:
        "You are the Smart Football Hub assistant. Answer the user's questions about their team, " +
        "players, fixtures, and results. Use the context below when relevant, and be honest when " +
        "the data doesn't contain the answer. Keep replies concise and friendly.\n\n" +
        `Context:\n${contextText}`,
      messages: history.map((t) => ({ role: t.role, content: t.content })),
    }),
  );

  return firstText(message);
}

// ─────────────────────────── Daily digest narration ───────────────────────────

/** Turn a list of results into a short, lively editorial roundup. */
export async function narrateDigest(resultsText: string): Promise<string> {
  const message = await runClaude(() =>
    getClient().messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 700,
      system:
        "You are a football editor writing a daily roundup. In 2-4 lively but factual " +
        "sentences, summarize the standout results below. Only use the results provided — " +
        "do not invent scores, scorers, or context.",
      messages: [{ role: "user", content: resultsText }],
    }),
  );
  return firstText(message);
}

// ─────────────────────────── Transfer advisor ───────────────────────────

const TRANSFER_SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          position: { type: "string", description: "Weak position to strengthen, e.g. 'CB', 'ST'" },
          player_name: { type: "string" },
          rationale: { type: "string" },
          fit_score: { type: "number", description: "Estimated fit, 0-100" },
        },
        required: ["position", "player_name", "rationale", "fit_score"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
} as const;

export interface TransferSuggestion {
  position: string;
  playerName: string;
  rationale: string;
  fitScore: number;
}

export async function suggestTransfers(input: {
  team: string;
  contextText: string;
}): Promise<TransferSuggestion[]> {
  const message = await runClaude(() =>
    getClient().messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: TRANSFER_SCHEMA } },
      system:
        "You are a football transfer-market advisor. Analyze the squad's weaknesses and suggest " +
        "realistic signings (real players) who would strengthen specific positions. Return 3-5 " +
        "suggestions ranked by fit.",
      messages: [
        {
          role: "user",
          content: `Suggest signings to strengthen ${input.team}.\n\nSquad & context:\n${input.contextText}`,
        },
      ],
    }),
  );

  const parsed = parseJson<{
    suggestions: {
      position: string;
      player_name: string;
      rationale: string;
      fit_score: number;
    }[];
  }>(firstText(message));

  return parsed.suggestions.map((s) => ({
    position: s.position,
    playerName: s.player_name,
    rationale: s.rationale,
    fitScore: s.fit_score,
  }));
}
