import { Router } from "express";

/** Owner: Muzammil */
export const usersRouter = Router();

usersRouter.get("/", (_req, res) => {
  res.json({ module: "users", status: "not_implemented" });
});
