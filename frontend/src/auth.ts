import { createAuthClient } from "better-auth/react"; // ou a lib de cliente que você está usando

export const authClient = createAuthClient({
  // ⚠️ IMPORTANTE: Aponte para a URL do Neon Auth (NÃO para o Express 4000)
  baseURL:
    "https://ep-jolly-recipe-ajbg031r.neonauth.c-3.us-east-2.aws.neon.tech/neondb/auth",
});
