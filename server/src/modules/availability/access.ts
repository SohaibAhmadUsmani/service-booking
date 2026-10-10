import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@service-booking/shared";
import { AppError } from "../../middleware/errorHandler";

/**
 * Allows the request only if the logged-in user is the provider named in
 * :providerId, or an admin. Use after requireAuth.
 * Assumes a provider's providerId is the same as their login user id.
 */
export function requireOwnProvider(req: Request, _res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user) throw new AppError("Authentication required.", 401);
  if (user.role === UserRole.Admin) return next();
  if (user.role === UserRole.Provider && user.userId === req.params.providerId) return next();
  throw new AppError("You can only manage your own availability.", 403);
}