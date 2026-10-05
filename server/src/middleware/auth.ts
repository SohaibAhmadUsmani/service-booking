import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole, JwtPayload } from "@service-booking/shared";
import { AppError } from "./errorHandler";

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-identity-key-2026-production";

/**
 * Middleware to authenticate requests via Bearer JWT token.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required. Please provide a Bearer token.", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 * Returns 403 Forbidden if the authenticated user's role is not permitted.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
        403
      );
    }

    next();
  };
}
