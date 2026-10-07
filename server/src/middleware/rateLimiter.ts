import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface RateRecord {
  count: number;
  resetTime: number;
}

/**
 * High-performance, self-contained in-memory sliding window rate limiter.
 * Protects against brute-force attacks and credential stuffing without external dependencies.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const tracker = new Map<string, RateRecord>();

  // Periodic cleanup of stale rate-limiting keys
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now > record.resetTime) {
        tracker.delete(key);
      }
    }
  }, 60000);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const key = `${req.path}_${ip}`;
    const now = Date.now();

    let record = tracker.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + options.windowMs };
      tracker.set(key, record);
      next();
      return;
    }

    record.count++;
    if (record.count > options.max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      throw new AppError(
        options.message ||
          `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        429,
        { retryAfter: retryAfterSeconds }
      );
    }

    next();
  };
}

export const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
});

export const authRegisterLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many registration attempts from this IP. Please try again later.",
});

export const authRefreshLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: "Too many token refresh requests. Please slow down.",
});

export const passwordChangeLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many password update attempts. Please try again in 1 hour.",
});
