import { Router } from "express";

/** Owner: Maira */
export const servicesRouter = Router();

servicesRouter.get("/", (_req, res) => {
  res.json({ module: "services", status: "not_implemented" });
});
