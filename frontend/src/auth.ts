import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    "https://ep-jolly-recipe-ajbg031r.neonauth.c-3.us-east-2.aws.neon.tech/neondb/auth",
});
