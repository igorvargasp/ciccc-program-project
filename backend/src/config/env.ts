import "dotenv/config";
import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 * The process exits early with a readable error if anything required is missing.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("*"),

  DATABASE_URL: z.string().url("DATABASE_URL must be a valid Neon connection string"),

  // Neon Auth (Better Auth). The backend only needs the base URL to locate the
  // JWKS endpoint for verifying access tokens — no client/secret keys required.
  NEON_AUTH_BASE_URL: z.string().url("NEON_AUTH_BASE_URL is required (from Neon Console → Auth)"),
  // Optional override; defaults to `${NEON_AUTH_BASE_URL}/.well-known/jwks.json`.
  NEON_AUTH_JWKS_URL: z.string().url().optional(),
  // Optional: enforce the token issuer if you want stricter verification.
  NEON_AUTH_ISSUER: z.string().optional(),

  // AI features (predictions, chatbot, transfer advisor). Optional — the AI
  // endpoints return 503 when no key is configured, so the rest of the API
  // still runs without it.
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-opus-4-8"),

  // football-data.org integration (fixtures, standings, live). Optional — the
  // scheduler only starts when a key is present.
  FOOTBALL_DATA_API_KEY: z.string().optional(),
  // Comma-separated competition codes to track (football-data.org codes).
  FOOTBALL_DATA_COMPETITIONS: z.string().default("PL,PD,SA,BL1,FL1,CL"),
  // Turn the background scheduler on/off independently of the key.
  SCHEDULER_ENABLED: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("true"),
  // Cron for the once-a-day full refresh + cross-league digest.
  DAILY_DIGEST_CRON: z.string().default("0 6 * * *"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === "production",
  // Default JWKS endpoint for Neon Auth if not overridden.
  NEON_AUTH_JWKS_URL:
    raw.NEON_AUTH_JWKS_URL ?? `${raw.NEON_AUTH_BASE_URL.replace(/\/$/, "")}/.well-known/jwks.json`,
};
