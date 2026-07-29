import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin:
        env.CORS_ORIGIN === "*"
          ? true
          : env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.isProd ? "combined" : "dev"));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "smart-football-hub-backend" });
  });

  // API routes
  app.use("/api", apiRouter);

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
