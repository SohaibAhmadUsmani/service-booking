import { Router } from "express";
import { UserRole } from "@service-booking/shared";
import { requireAuth, requireRole } from "../../middleware/auth";
import { authorizeBooking, scopeBookingQuery, useTokenAsCustomer } from "./access";
import { getCalendar } from "./calendar";
import {
  cancelBooking,
  changeBookingStatus,
  createBooking,
  getBooking,
  listBookings,
  rescheduleBooking,
} from "./controller";

/** Owner: Shanza */
export const bookingsRouter = Router();

bookingsRouter.post("/", requireAuth, requireRole(UserRole.Customer, UserRole.Admin), useTokenAsCustomer, createBooking);
bookingsRouter.get("/", requireAuth, scopeBookingQuery, listBookings);
// Must stay above "/:id", otherwise "calendar" is read as a booking id.
bookingsRouter.get("/calendar", requireAuth, requireRole(UserRole.Provider, UserRole.Admin), scopeBookingQuery, getCalendar);
bookingsRouter.get("/:id", requireAuth, authorizeBooking("customer", "provider"), getBooking);
bookingsRouter.patch("/:id/status", requireAuth, authorizeBooking("provider"), changeBookingStatus);
bookingsRouter.patch("/:id/cancel", requireAuth, authorizeBooking("customer", "provider"), cancelBooking);
bookingsRouter.patch("/:id/reschedule", requireAuth, authorizeBooking("customer"), rescheduleBooking);