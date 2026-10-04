import { Router } from "express";

/** Owner: Shanza */
export const bookingsRouter = Router();

bookingsRouter.get("/", (_req, res) => {
  res.json({ module: "bookings", status: "not_implemented" });
});
