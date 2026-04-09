import corsLib from "cors";
import { env } from "../config/env.js";

/**
 * Returns true when `origin` is permitted by `allowedPattern`.
 *
 * Rules:
 * - `origin` undefined/empty → native mobile client → always allowed
 * - `allowedPattern === "*"` → allow all
 * - Comma-separated list → each entry is tested in order (exact or wildcard)
 * - Wildcard entry: `https://*.example.com` matches any single subdomain
 *   of `example.com` over HTTPS only (no deep nesting, protocol must match)
 *
 * Exported for unit-testing without spinning up an HTTP server.
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowedPattern: string,
): boolean {
  // No Origin → mobile native client → always allow
  if (!origin) return true;

  if (allowedPattern === "*") return true;

  const patterns = allowedPattern.split(",").map((p) => p.trim());

  return patterns.some((pattern) => matchesPattern(origin, pattern));
}

function matchesPattern(origin: string, pattern: string): boolean {
  // Exact match
  if (!pattern.includes("*")) return origin === pattern;

  // Wildcard pattern: convert "https://*.example.com" → regex.
  // Only a single "*" is supported (one subdomain level, e.g. "https://*.example.com").
  // Multiple wildcards are not supported — they collapse into one and may match unexpectedly.
  const [prefix, ...rest] = pattern.split("*");
  const suffix = rest.join("*"); // rejoin in case of multiple * (treated as one)
  const escapedPrefix = prefix!.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const escapedSuffix = suffix.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedPrefix}[^.]+${escapedSuffix}$`);
  return regex.test(origin);
}

/**
 * CORS strategy:
 * - Native clients (iOS/Android) send no Origin header → allow
 * - Web clients → validated against CORS_ORIGIN env var (supports wildcards)
 * - In development (CORS_ORIGIN=*) → allow all origins
 */
export const corsMiddleware = corsLib({
  origin(origin, callback) {
    if (isOriginAllowed(origin, env.CORS_ORIGIN)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ["GET", "HEAD", "OPTIONS", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
});
