import type { Request, Response, NextFunction } from "express";

/**
 * Stub auth middleware — currently passes through all requests.
 *
 * TODO: When Firebase Auth is enabled, replace the body with:
 *
 *   const authHeader = req.headers.authorization;
 *   if (!authHeader?.startsWith('Bearer ')) {
 *     return next(new AppError(401, 'Missing authorization token', 'UNAUTHORIZED'));
 *   }
 *   const token = authHeader.slice(7);
 *   try {
 *     const decoded = await getAuth().verifyIdToken(token);
 *     (req as AuthenticatedRequest).user = decoded;
 *     next();
 *   } catch {
 *     next(new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
 *   }
 */
export function requireAuth(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Pass-through: no auth required yet
  next();
}

/** Always passes through — used on public routes to reserve the middleware slot */
export function optionalAuth(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next();
}
