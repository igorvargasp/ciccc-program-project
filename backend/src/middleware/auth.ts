import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { HttpError } from "../lib/http-error.js";

/**
 * Authentication against Neon Auth (Better Auth).
 *
 * The frontend signs the user in with the Neon Auth client SDK and obtains an
 * access token (`session.access_token`, a JWT whose `sub` is the user id). It
 * sends that token as `Authorization: Bearer <token>`. We verify the signature
 * against Neon Auth's remote JWKS (`${NEON_AUTH_BASE_URL}/.well-known/jwks.json`),
 * provision/refresh a row in our `users` table, and attach `req.auth`.
 *
 * Note: no client/secret keys are needed here — verification is done purely
 * with the public JWKS. Login, sessions and cookies are handled on the frontend.
 */

export interface AuthUser {
  id: string; // Neon Auth user id (JWT `sub`)
  email?: string;
  displayName?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

// Cache the JWKS across requests (jose handles key rotation + caching internally).
const jwks = createRemoteJWKSet(new URL(env.NEON_AUTH_JWKS_URL));

function extractBearer(req: Request): string | null {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export async function verifyToken(token: string): Promise<AuthUser> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      // Optionally pin the issuer for stricter verification (set NEON_AUTH_ISSUER).
      ...(env.NEON_AUTH_ISSUER ? { issuer: env.NEON_AUTH_ISSUER } : {}),
    });

    if (!payload.sub) throw new HttpError(401, "Token is missing a subject");

    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      displayName:
        typeof payload.name === "string"
          ? payload.name
          : typeof payload.display_name === "string"
            ? (payload.display_name as string)
            : undefined,
    };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, "Invalid or expired authentication token");
  }
}

/** Just-in-time provisioning: upsert the authenticated user into our table. */
export async function syncUser(auth: AuthUser): Promise<void> {
  await db
    .insert(users)
    .values({
      id: auth.id,
      email: auth.email,
      displayName: auth.displayName,
      lastLoginAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: auth.email,
        displayName: auth.displayName,
        lastLoginAt: new Date(),
      },
    });
}

/** Hard requirement: reject the request if there is no valid token. */
export function requireAuth() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = extractBearer(req);
      if (!token) throw new HttpError(401, "Missing bearer token");

      const auth = await verifyToken(token);
      await syncUser(auth);
      req.auth = auth;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Soft variant: attaches `req.auth` when a valid token is present, else continues. */
export function optionalAuth() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = extractBearer(req);
      if (!token) return next();
      const auth = await verifyToken(token);
      req.auth = auth;
      next();
    } catch {
      // Ignore auth errors on optional routes.
      next();
    }
  };
}

/** Helper for handlers that need the id and want a narrowed type. */
export function currentUserId(req: Request): string {
  if (!req.auth) throw new HttpError(401, "Not authenticated");
  return req.auth.id;
}
