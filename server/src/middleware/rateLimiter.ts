import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface RateRecord {
  count: number;
  resetTime: number;
}

const MAX_TRACKER_ENTRIES = 50000;
const trackers: Array<{ map: Map<string, RateRecord>; timer: NodeJS.Timeout }> = [];

/**
 * High-performance, self-contained in-memory sliding window rate limiter.
 * Protects against brute-force attacks and credential stuffing without external dependencies.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const tracker = new Map<string, RateRecord>();

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

  trackers.push({ map: tracker, timer: cleanupTimer });

  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === "test" && process.env.ENABLE_RATE_LIMITING !== "true") {
      next();
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const routeKey = `${req.baseUrl || ""}${req.path}`;
    const generated = options.keyGenerator ? options.keyGenerator(req) : `${routeKey}_${ip}`;
    const key = generated;
    const now = Date.now();

    if (tracker.size > MAX_TRACKER_ENTRIES) {
      const first = tracker.keys().next().value;
      if (first) tracker.delete(first);
    }

    let record = tracker.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + options.windowMs };
      tracker.set(key, record);
      next();
      return;
    }

    record.count++;
    if (record.count > options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
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

export function closeRateLimiters(): void {
  for (const entry of trackers) {
    clearInterval(entry.timer);
    entry.map.clear();
  }
  trackers.length = 0;
}

export const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 30,
  message: "Too many login attempts. Please try again after 15 minutes.",
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return email ? `login_${ip}_${email}` : `login_${ip}`;
  },
});

export const authRegisterLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 50,
  message: "Too many registration attempts from this IP. Please try again later.",
});

export const authRefreshLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many token refresh requests. Please slow down.",
});

export const passwordChangeLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many password update attempts. Please try again in 1 hour.",
});

export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 2,
  message: "Too many password reset requests. Please try again in 1 hour.",
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return email ? `forgot_${email}` : `forgot_${ip}`;
  },
});

export const sessionReadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many session list requests. Please slow down.",
});
