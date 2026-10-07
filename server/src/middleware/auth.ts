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

/**
 * Returns and validates the JWT signing secret.
 * Enforces minimum entropy and crashes early in production if missing.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: JWT_SECRET environment variable must be defined and at least 32 characters in production."
      );
    }
    return secret || "dev-identity-jwt-secret-key-32-chars-long-minimum!";
  }
  return secret;
}

/**
 * Middleware to authenticate requests via Bearer JWT token.
 * Validates algorithmic whitelist and clock skew tolerance.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required. Please provide a Bearer token.", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      clockTolerance: 30, // 30-second skew tolerance
    }) as JwtPayload;

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
