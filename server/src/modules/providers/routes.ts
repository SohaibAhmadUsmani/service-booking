import { Router } from "express";

/** Owner: Khadija (public catalog); Maira (provider-scoped updates via services module) */
export const providersRouter = Router();

providersRouter.get("/", (_req, res) => {
  res.json({ module: "providers", status: "not_implemented" });
});
