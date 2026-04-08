import { describe, it, expect } from "vitest";
import { isOriginAllowed } from "../cors.js";

describe("isOriginAllowed", () => {
  // ── No origin (mobile native client) ───────────────────────────────────────

  it("allows requests with no Origin header (mobile native)", () => {
    expect(isOriginAllowed(undefined, "https://app.kodekonnect.com")).toBe(true);
  });

  it("allows requests with empty string Origin (native edge case)", () => {
    expect(isOriginAllowed("", "https://app.kodekonnect.com")).toBe(true);
  });

  // ── Wildcard env value ──────────────────────────────────────────────────────

  it("allows any origin when CORS_ORIGIN is *", () => {
    expect(isOriginAllowed("https://evil.com", "*")).toBe(true);
  });

  // ── Exact match ─────────────────────────────────────────────────────────────

  it("allows exact origin match", () => {
    expect(
      isOriginAllowed(
        "https://radiovoxecclesiae.kodekonnect.com",
        "https://radiovoxecclesiae.kodekonnect.com",
      ),
    ).toBe(true);
  });

  it("rejects origin not in exact list", () => {
    expect(
      isOriginAllowed(
        "https://evil.com",
        "https://radiovoxecclesiae.kodekonnect.com",
      ),
    ).toBe(false);
  });

  // ── Wildcard pattern matching ───────────────────────────────────────────────

  it("allows *.kodekonnect.com subdomain", () => {
    expect(
      isOriginAllowed(
        "https://radiovoxecclesiae.kodekonnect.com",
        "https://*.kodekonnect.com",
      ),
    ).toBe(true);
  });

  it("allows *.vercel.app subdomain", () => {
    expect(
      isOriginAllowed(
        "https://rve-radio-git-main.vercel.app",
        "https://*.vercel.app",
      ),
    ).toBe(true);
  });

  it("allows *.vercel.com subdomain", () => {
    expect(
      isOriginAllowed("https://rve-radio.vercel.com", "https://*.vercel.com"),
    ).toBe(true);
  });

  it("rejects a different domain that looks similar to a wildcard", () => {
    expect(
      isOriginAllowed(
        "https://evil-kodekonnect.com",
        "https://*.kodekonnect.com",
      ),
    ).toBe(false);
  });

  it("rejects subdomain of wrong TLD even if base looks matching", () => {
    expect(
      isOriginAllowed(
        "https://app.kodekonnect.com.evil.io",
        "https://*.kodekonnect.com",
      ),
    ).toBe(false);
  });

  // ── Multiple allowed origins (comma-separated) ──────────────────────────────

  it("allows origin matching one pattern in a comma-separated list", () => {
    const allowed =
      "https://*.kodekonnect.com, https://*.vercel.app, https://*.vercel.com";
    expect(
      isOriginAllowed("https://rve.kodekonnect.com", allowed),
    ).toBe(true);
    expect(
      isOriginAllowed("https://rve.vercel.app", allowed),
    ).toBe(true);
    expect(
      isOriginAllowed("https://rve.vercel.com", allowed),
    ).toBe(true);
  });

  it("rejects origin not matching any pattern in the list", () => {
    const allowed =
      "https://*.kodekonnect.com, https://*.vercel.app, https://*.vercel.com";
    expect(isOriginAllowed("https://evil.com", allowed)).toBe(false);
  });

  // ── HTTP vs HTTPS ───────────────────────────────────────────────────────────

  it("does not allow http origin when pattern specifies https", () => {
    expect(
      isOriginAllowed(
        "http://rve.kodekonnect.com",
        "https://*.kodekonnect.com",
      ),
    ).toBe(false);
  });
});
