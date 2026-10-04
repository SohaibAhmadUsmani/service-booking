import { Router } from "express";

/** Owner: Aiman */
export const adminRouter = Router();

adminRouter.get("/", (_req, res) => {
  res.json({ module: "admin", status: "not_implemented" });
});
