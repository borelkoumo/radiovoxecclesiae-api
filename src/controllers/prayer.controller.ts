import type { Request, Response, NextFunction } from "express";
import { listPrayers, createPrayer } from "../repositories/prayer.repository.js";
import { listPrayersQuerySchema, createPrayerSchema } from "../schemas/prayer.schema.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";

export async function handleListPrayers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listPrayersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid query", "INVALID_QUERY");
    }
    const result = await listPrayers(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function handleCreatePrayer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createPrayerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? "Invalid body", "INVALID_BODY");
    }
    const prayer = await createPrayer(parsed.data);
    sendSuccess(res, prayer, 201);
  } catch (err) {
    next(err);
  }
}
