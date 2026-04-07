import corsLib from "cors";
import { env } from "../config/env.js";

/**
 * CORS strategy:
 * - Native clients (iOS/Android) send no Origin header → allow (corsLib passes through by default)
 * - Expo web sends Origin (e.g. http://localhost:8081) → validate against CORS_ORIGIN env var
 * - In development (CORS_ORIGIN=*) → allow all origins
 */
export const corsMiddleware = corsLib({
  origin(origin, callback) {
    // No Origin header → native client → allow
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowed = env.CORS_ORIGIN;

    if (allowed === "*") {
      callback(null, true);
      return;
    }

    const allowedOrigins = allowed.split(",").map((o) => o.trim());
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ["GET", "HEAD", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
});
