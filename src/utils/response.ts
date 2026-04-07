import type { Response } from "express";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  message: string,
  status = 500,
  code?: string
): void {
  const body: ApiError = { success: false, error: message, ...(code ? { code } : {}) };
  res.status(status).json(body);
}
