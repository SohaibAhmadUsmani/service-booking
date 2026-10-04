import { Router } from "express";

/** Owner: Muzammil */
export const authRouter = Router();

authRouter.get("/", (_req, res) => {
  res.json({ module: "auth", status: "not_implemented" });
});
