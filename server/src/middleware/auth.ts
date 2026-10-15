import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole, JwtPayload } from "@service-booking/shared";
import { AppError } from "./errorHandler";
import { UserModel } from "../modules/users/models/user.model";
import { ProviderProfileModel } from "../modules/users/models/providerProfile.model";

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
 * Validates algorithmic whitelist, clock skew tolerance, active account state,
 * and tokenVersion to guarantee immediate session revocation on password changes.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authentication required. Please provide a Bearer token.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      clockTolerance: 5,
      issuer: process.env.JWT_ISSUER || "service-booking-api",
      audience: process.env.JWT_AUDIENCE || "service-booking-client",
    }) as JwtPayload;

    if (decoded.userId) {
      const user = await UserModel.findById(decoded.userId)
        .select("tokenVersion isActive")
        .lean();

      if (!user || !user.isActive) {
        return next(new AppError("User account is inactive or not found.", 401));
      }

      const tokenVersion = typeof decoded.tokenVersion === "number" ? decoded.tokenVersion : -1;
      if (tokenVersion !== (user.tokenVersion || 0)) {
        return next(
          new AppError(
            "Session has expired due to password update or revocation. Please sign in again.",
            401
          )
        );
      }
    }

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

export function requireVerifiedProvider() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }
    if (req.user.role !== UserRole.Provider) {
      return next();
    }
    const profile = await ProviderProfileModel.findOne({ userId: req.user.userId })
      .select("isVerified")
      .lean();
    if (!profile?.isVerified) {
      return next(
        new AppError("Provider account must be verified before accepting public bookings.", 403)
      );
    }
    next();
  };
}
