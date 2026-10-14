import { Router } from "express";
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

bookingsRouter.post("/", createBooking);
bookingsRouter.get("/", listBookings);
// Must stay above "/:id", otherwise "calendar" is read as a booking id.
bookingsRouter.get("/calendar", getCalendar);
bookingsRouter.get("/:id", getBooking);
bookingsRouter.patch("/:id/status", changeBookingStatus);
bookingsRouter.patch("/:id/cancel", cancelBooking);
bookingsRouter.patch("/:id/reschedule", rescheduleBooking);
