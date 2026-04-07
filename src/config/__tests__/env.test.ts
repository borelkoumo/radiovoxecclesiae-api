import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("env config", () => {
  const originalEnv = process.env;

  const validEnv = {
    NODE_ENV: "test",
    PORT: "3001",
    CORS_ORIGIN: "http://localhost:8081",
    FIREBASE_PROJECT_ID: "rve-test",
    FIREBASE_CLIENT_EMAIL: "test@rve-test.iam.gserviceaccount.com",
    FIREBASE_PRIVATE_KEY: "-----BEGIN RSA PRIVATE KEY-----\\ntest\\n-----END RSA PRIVATE KEY-----",
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, ...validEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("parses valid environment variables", async () => {
    const { env } = await import("../env.js");
    expect(env.NODE_ENV).toBe("test");
    expect(env.PORT).toBe(3001);
    expect(env.CORS_ORIGIN).toBe("http://localhost:8081");
    expect(env.FIREBASE_PROJECT_ID).toBe("rve-test");
  });

  it("defaults PORT to 3000 when not set", async () => {
    delete process.env["PORT"];
    const { env } = await import("../env.js");
    expect(env.PORT).toBe(3000);
  });

  it("defaults CORS_ORIGIN to * when not set", async () => {
    delete process.env["CORS_ORIGIN"];
    const { env } = await import("../env.js");
    expect(env.CORS_ORIGIN).toBe("*");
  });

  it("defaults NODE_ENV to development when not set", async () => {
    delete process.env["NODE_ENV"];
    const { env } = await import("../env.js");
    expect(env.NODE_ENV).toBe("development");
  });

  it("throws when FIREBASE_PROJECT_ID is missing", async () => {
    delete process.env["FIREBASE_PROJECT_ID"];
    await expect(import("../env.js")).rejects.toThrow(
      "Missing or invalid environment variables"
    );
  });

  it("throws when FIREBASE_CLIENT_EMAIL is invalid", async () => {
    process.env["FIREBASE_CLIENT_EMAIL"] = "not-an-email";
    await expect(import("../env.js")).rejects.toThrow(
      "Missing or invalid environment variables"
    );
  });

  it("throws when FIREBASE_PRIVATE_KEY is missing", async () => {
    delete process.env["FIREBASE_PRIVATE_KEY"];
    await expect(import("../env.js")).rejects.toThrow(
      "Missing or invalid environment variables"
    );
  });

  it("coerces PORT string to number", async () => {
    process.env["PORT"] = "4000";
    const { env } = await import("../env.js");
    expect(env.PORT).toBe(4000);
    expect(typeof env.PORT).toBe("number");
  });
});
