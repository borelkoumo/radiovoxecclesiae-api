import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

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
    error: "Trop de prières soumises. Vous pouvez envoyer 2 prières par minute.",
    code: "PRAYER_RATE_LIMIT_EXCEEDED",
  });
}

/**
 * General limiter — applied to all GET endpoints.
 * 60 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  legacyHeaders: true,
  handler: generalLimitHandler,
});

/**
 * Strict limiter for prayer writes — 2 requests per minute per IP.
 * Prevents prayer spam.
 */
export const prayerWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  legacyHeaders: true,
  handler: prayerWriteLimitHandler,
});
