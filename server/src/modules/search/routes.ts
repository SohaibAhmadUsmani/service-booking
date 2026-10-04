import { Router } from "express";

/** Owner: Khadija */
export const searchRouter = Router();

searchRouter.get("/", (_req, res) => {
  res.json({ module: "search", status: "not_implemented" });
});
