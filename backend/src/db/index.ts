import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

/**
 * Neon serverless HTTP client + Drizzle ORM instance.
 * Uses the HTTP driver, which is ideal for stateless request/response APIs
 * and serverless deployments (no long-lived connections to manage).
 */
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
export { schema };
