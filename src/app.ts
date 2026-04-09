import express from "express";
import helmet from "helmet";
import { join } from "node:path";
import { corsMiddleware } from "./middleware/cors.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { sendError } from "./utils/response.js";
import v1Router from "./routes/v1/index.js";

export function createApp(): express.Application {
  const app = express();

  // Trust Render's reverse proxy so req.ip reflects the real client IP
  // (required for rate limiting to work per-client rather than per-proxy)
  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet());

  // CORS — must come before routes
  app.use(corsMiddleware);

  // Request logging
  app.use(requestLogger);

  // Body parsing
  app.use(express.json());

  // Static files — serve public/ folder at /images
  app.use("/images", express.static(join(__dirname, "../public")));

  // API routes
  app.use("/api/v1", v1Router);

  // 404 handler
  app.use((_req, res) => {
    sendError(res, "Not found", 404);
  });

  // Global error handler (must be last, 4-param signature)
  app.use(errorHandler);

  return app;
}
