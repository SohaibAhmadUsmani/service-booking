import { Router } from "express";

/** Owner: Namra */
export const notificationsRouter = Router();

notificationsRouter.get("/", (_req, res) => {
  res.json({ module: "notifications", status: "not_implemented" });
});
