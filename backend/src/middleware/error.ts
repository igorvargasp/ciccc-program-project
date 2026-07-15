import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "Not found", path: req.path });
}

/** Central error handler — normalises HttpError, ZodError, and unknown errors. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: "Internal server error",
    ...(env.isProd ? {} : { message: err instanceof Error ? err.message : String(err) }),
  });
}
