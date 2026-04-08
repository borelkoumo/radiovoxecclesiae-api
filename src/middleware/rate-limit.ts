import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { env } from "../config/env.js";

export function generalLimitHandler(_req: Request, res: Response): void {
  res.status(429).json({
    success: false,
    error: "Trop de requêtes. Veuillez réessayer dans quelques instants.",
    code: "RATE_LIMIT_EXCEEDED",
  });
}

export function prayerWriteLimitHandler(_req: Request, res: Response): void {
  res.status(429).json({
    success: false,
    error: `Trop de prières soumises. Vous pouvez envoyer ${env.RATE_LIMIT_PRAYER_WRITE} prières par minute.`,
    code: "PRAYER_RATE_LIMIT_EXCEEDED",
  });
}

/**
 * General limiter — applied to all GET endpoints.
 * Default: 60 req/min/IP. Configurable via RATE_LIMIT_GENERAL env var.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_GENERAL,
  legacyHeaders: true,
  handler: generalLimitHandler,
});

/**
 * Strict limiter for prayer writes.
 * Default: 20 req/min/IP (accounts for shared IPs on mobile networks).
 * Configurable via RATE_LIMIT_PRAYER_WRITE env var.
 */
export const prayerWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_PRAYER_WRITE,
  legacyHeaders: true,
  handler: prayerWriteLimitHandler,
});
