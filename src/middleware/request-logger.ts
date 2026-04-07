import pinoHttp from "pino-http";
import pino from "pino";
import { env } from "../config/env.js";

const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  ...(env.NODE_ENV === "development"
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
});

export const requestLogger = pinoHttp({
  logger,
  // Don't log health check polls to reduce noise
  autoLogging: {
    ignore(req) {
      return req.url === "/api/v1/health";
    },
  },
});

export { logger };
