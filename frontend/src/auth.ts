import { createAuthClient } from "better-auth/react";

/**
 * Neon Auth (Better Auth) client.
 *
 * Sign-in, sign-up and session cookies all live on the hosted Neon Auth
 * instance — our own backend never sees a password, it only verifies the JWT
 * Neon hands out.
 */
const NEON_AUTH_URL: string =
  import.meta.env.VITE_NEON_AUTH_URL ||
  "https://ep-jolly-recipe-ajbg031r.neonauth.c-3.us-east-2.aws.neon.tech/neondb/auth";

export const authClient = createAuthClient({ baseURL: NEON_AUTH_URL });

/**
 * Exchange the current Better Auth session for a signed JWT.
 *
 * The backend verifies bearer tokens against Neon Auth's JWKS, so the opaque
 * session token returned by `signIn` is not enough — only `/token` (the jwt
 * plugin) returns something `jwtVerify` will accept.
 */
export async function fetchAuthJwt(): Promise<string | null> {
  const { data } = await authClient.$fetch<{ token?: string }>("/token");
  return data?.token ?? null;
}

/**
 * Fired when the session can no longer produce a token, so the non-React API
 * client can tell AuthContext to drop the user.
 */
export const AUTH_EXPIRED_EVENT = "auth:expired";
