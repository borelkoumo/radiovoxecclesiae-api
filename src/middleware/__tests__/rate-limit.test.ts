import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import rateLimit from "express-rate-limit";
import { errorHandler } from "../error-handler.js";
import {
  generalLimitHandler,
  prayerWriteLimitHandler,
} from "../rate-limit.js";

/**
 * Each test that verifies isolation or exhaustion creates its own app with a
 * fresh rateLimit instance (new in-memory store), so counters don't bleed
 * across tests.
 */
function buildApp(maxGeneral: number, maxPrayer: number) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());

  const general = rateLimit({
    windowMs: 60 * 1000,
    max: maxGeneral,
    legacyHeaders: true,
    handler(_req, res) {
      res.status(429).json({
        success: false,
        error: "Trop de requêtes. Veuillez réessayer dans quelques instants.",
        code: "RATE_LIMIT_EXCEEDED",
      });
    },
  });

  const prayerWrite = rateLimit({
    windowMs: 60 * 1000,
    max: maxPrayer,
    legacyHeaders: true,
    handler(_req, res) {
      res.status(429).json({
        success: false,
        error: "Trop de prières soumises. Vous pouvez envoyer 2 prières par minute.",
        code: "PRAYER_RATE_LIMIT_EXCEEDED",
      });
    },
  });

  app.get("/test-general", general, (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/test-prayers", prayerWrite, (_req, res) => {
    res.json({ ok: true });
  });

  app.use(errorHandler);
  return app;
}

describe("generalLimiter (60 req/min/IP)", () => {
  it("allows requests under the limit", async () => {
    const app = buildApp(60, 2);
    const res = await request(app).get("/test-general");
    expect(res.status).toBe(200);
  });

  it("sets X-RateLimit-* headers on successful response", async () => {
    const app = buildApp(60, 2);
    const res = await request(app).get("/test-general");
    expect(res.headers["x-ratelimit-limit"]).toBeDefined();
  });

  it("returns 429 after exceeding 60 requests from the same IP", async () => {
    const app = buildApp(60, 2);
    for (let i = 0; i < 60; i++) {
      await request(app).get("/test-general").set("X-Forwarded-For", "1.2.3.4");
    }
    const res = await request(app)
      .get("/test-general")
      .set("X-Forwarded-For", "1.2.3.4");
    expect(res.status).toBe(429);
  });

  it("returns a JSON error body on 429", async () => {
    const app = buildApp(60, 2);
    for (let i = 0; i < 60; i++) {
      await request(app).get("/test-general").set("X-Forwarded-For", "5.6.7.8");
    }
    const res = await request(app)
      .get("/test-general")
      .set("X-Forwarded-For", "5.6.7.8");
    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({ success: false });
    expect(typeof res.body.error).toBe("string");
  });

  it("does not block a different IP when one IP is rate-limited", async () => {
    const app = buildApp(60, 2);
    for (let i = 0; i < 60; i++) {
      await request(app).get("/test-general").set("X-Forwarded-For", "9.9.9.9");
    }
    // Different IP — should NOT be blocked
    const res = await request(app)
      .get("/test-general")
      .set("X-Forwarded-For", "10.10.10.10");
    expect(res.status).toBe(200);
  });
});

describe("prayerWriteLimiter (2 req/min/IP)", () => {
  it("allows the first request", async () => {
    const app = buildApp(60, 2);
    const res = await request(app)
      .post("/test-prayers")
      .set("X-Forwarded-For", "20.20.20.20");
    expect(res.status).toBe(200);
  });

  it("allows the second request", async () => {
    const app = buildApp(60, 2);
    await request(app).post("/test-prayers").set("X-Forwarded-For", "21.21.21.21");
    const res = await request(app)
      .post("/test-prayers")
      .set("X-Forwarded-For", "21.21.21.21");
    expect(res.status).toBe(200);
  });

  it("returns 429 on the 3rd request from the same IP", async () => {
    const app = buildApp(60, 2);
    const ip = "22.22.22.22";
    await request(app).post("/test-prayers").set("X-Forwarded-For", ip);
    await request(app).post("/test-prayers").set("X-Forwarded-For", ip);
    const res = await request(app)
      .post("/test-prayers")
      .set("X-Forwarded-For", ip);
    expect(res.status).toBe(429);
  });

  it("returns a specific error message for prayer rate limit", async () => {
    const app = buildApp(60, 2);
    const ip = "23.23.23.23";
    await request(app).post("/test-prayers").set("X-Forwarded-For", ip);
    await request(app).post("/test-prayers").set("X-Forwarded-For", ip);
    const res = await request(app)
      .post("/test-prayers")
      .set("X-Forwarded-For", ip);
    expect(res.body).toMatchObject({ success: false });
    expect(res.body.error).toMatch(/prière|prayer|trop/i);
  });

  it("does not block GET endpoint when prayer limit is exhausted for same IP", async () => {
    const app = buildApp(60, 2);
    const ip = "24.24.24.24";
    await request(app).post("/test-prayers").set("X-Forwarded-For", ip);
    await request(app).post("/test-prayers").set("X-Forwarded-For", ip);
    // GET uses a separate limiter — must still pass
    const res = await request(app)
      .get("/test-general")
      .set("X-Forwarded-For", ip);
    expect(res.status).toBe(200);
  });
});

// ── Handler unit tests (coverage) ────────────────────────────────────────────

function buildHandlerApp(
  handler: express.RequestHandler,
  method: "get" | "post",
  path: string,
) {
  const app = express();
  app[method](path, handler);
  return app;
}

describe("generalLimitHandler", () => {
  it("responds 429 with success:false and RATE_LIMIT_EXCEEDED code", async () => {
    const app = buildHandlerApp(generalLimitHandler, "get", "/");
    const res = await request(app).get("/");
    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({
      success: false,
      code: "RATE_LIMIT_EXCEEDED",
    });
    expect(typeof res.body.error).toBe("string");
  });
});

describe("prayerWriteLimitHandler", () => {
  it("responds 429 with success:false and PRAYER_RATE_LIMIT_EXCEEDED code", async () => {
    const app = buildHandlerApp(prayerWriteLimitHandler, "post", "/");
    const res = await request(app).post("/");
    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({
      success: false,
      code: "PRAYER_RATE_LIMIT_EXCEEDED",
    });
    expect(res.body.error).toMatch(/prière|prayer|trop/i);
  });
});
