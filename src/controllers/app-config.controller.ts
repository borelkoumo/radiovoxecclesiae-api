import type { Request, Response, NextFunction } from "express";
import { getAppConfig } from "../services/app-config.service.js";
import { sendSuccess } from "../utils/response.js";

export async function handleGetAppConfig(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const config = await getAppConfig();
    sendSuccess(res, config);
  } catch (err) {
    next(err);
  }
}
