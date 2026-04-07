import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";
import { sendError } from "../utils/response.js";
import { logger } from "./request-logger.js";
import { env } from "../config/env.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, err.message);
    }
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // Unknown error — never leak stack trace in production
  logger.error({ err }, "Unhandled error");
  const message =
    env.NODE_ENV === "production" ? "Internal server error" : String(err);
  sendError(res, message, 500);
}
