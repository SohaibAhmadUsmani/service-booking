import { Router } from "express";

/** Owner: Shanza */
export const availabilityRouter = Router();

availabilityRouter.get("/", (_req, res) => {
  res.json({ module: "availability", status: "not_implemented" });
});
