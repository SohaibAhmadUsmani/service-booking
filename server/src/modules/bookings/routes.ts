import { Router } from "express";
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
bookingsRouter.get("/:id", getBooking);
bookingsRouter.patch("/:id/status", changeBookingStatus);
bookingsRouter.patch("/:id/cancel", cancelBooking);
bookingsRouter.patch("/:id/reschedule", rescheduleBooking);
