import { Router } from "express";

/** Owner: Namra */
export const paymentsRouter = Router();

paymentsRouter.get("/", (_req, res) => {
  res.json({ module: "payments", status: "not_implemented" });
});
