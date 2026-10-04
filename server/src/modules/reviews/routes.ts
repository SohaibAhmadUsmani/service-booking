import { Router } from "express";

/** Owner: Namra */
export const reviewsRouter = Router();

reviewsRouter.get("/", (_req, res) => {
  res.json({ module: "reviews", status: "not_implemented" });
});
