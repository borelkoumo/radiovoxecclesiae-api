import { describe, it, expect } from "vitest";
import { AppError } from "../app-error.js";

describe("AppError", () => {
  it("creates error with statusCode and message", () => {
    const err = new AppError(422, "Validation failed");
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("Validation failed");
    expect(err.name).toBe("AppError");
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it("creates error with optional code", () => {
    const err = new AppError(400, "Bad input", "INVALID_PARAM");
    expect(err.code).toBe("INVALID_PARAM");
  });

  it("code is undefined when not provided", () => {
    const err = new AppError(500, "Oops");
    expect(err.code).toBeUndefined();
  });

  it("notFound factory returns 404 with default message", () => {
    const err = AppError.notFound();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
  });

  it("notFound factory accepts custom message and code", () => {
    const err = AppError.notFound("Day not found", "DAY_NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Day not found");
    expect(err.code).toBe("DAY_NOT_FOUND");
  });

  it("badRequest factory returns 400", () => {
    const err = AppError.badRequest("Invalid day");
    expect(err.statusCode).toBe(400);
  });

  it("internal factory returns 500 with default message", () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("Internal server error");
  });
});
