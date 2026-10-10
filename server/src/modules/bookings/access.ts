import type { NextFunction, Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { UserRole } from "@service-booking/shared";
import { AppError } from "../../middleware/errorHandler";
import { bookingsRepository } from "./repository";

type Party = "customer" | "provider";

function me(req: Request) {
  if (!req.user) throw new AppError("Authentication required.", 401);
  return req.user;
}

/** Customers book for themselves: the customer id always comes from the token. */
export function useTokenAsCustomer(req: Request, _res: Response, next: NextFunction): void {
  const user = me(req);
  if (user.role === UserRole.Customer) {
    req.body = { ...(req.body ?? {}), customerId: user.userId };
  }
  next();
}

/**
 * Limits list and calendar queries to the logged-in person.
 * Customers only see their own bookings, providers only their own. Admins see any.
 * If the id is left out, the person's own id is used.
 */
export function scopeBookingQuery(req: Request, _res: Response, next: NextFunction): void {
  const user = me(req);
  if (user.role === UserRole.Admin) return next();
  const q = req.query as Record<string, any>;

  if (user.role === UserRole.Customer) {
    if (q.providerId) throw new AppError("Customers can only view their own bookings.", 403);
    if (q.customerId && q.customerId !== user.userId) {
      throw new AppError("You can only view your own bookings.", 403);
    }
    q.customerId = user.userId;
    return next();
  }

  if (user.role === UserRole.Provider) {
    if (q.customerId) throw new AppError("Providers can only view their own bookings.", 403);
    if (q.providerId && q.providerId !== user.userId) {
      throw new AppError("You can only view your own bookings.", 403);
    }
    q.providerId = user.userId;
    return next();
  }

  throw new AppError("Access denied.", 403);
}

/** Allows the request only for the customer and/or provider on :id, or an admin. */
export function authorizeBooking(...parties: Party[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = me(req);
      const id = req.params.id;
      if (!isValidObjectId(id)) throw new AppError("booking id must be a valid id", 400);
      const booking = await bookingsRepository.findById(id);
      if (!booking) throw new AppError("Booking not found", 404);
      if (user.role === UserRole.Admin) return next();

      const isCustomer =
        parties.includes("customer") && user.role === UserRole.Customer && String(booking.customerId) === user.userId;
      const isProvider =
        parties.includes("provider") && user.role === UserRole.Provider && String(booking.providerId) === user.userId;
      if (!isCustomer && !isProvider) throw new AppError("You do not have access to this booking.", 403);
      next();
    } catch (err) {
      next(err);
    }
  };
}