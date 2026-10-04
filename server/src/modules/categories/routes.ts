import { Router } from "express";

/** Owner: Khadija */
export const categoriesRouter = Router();

categoriesRouter.get("/", (_req, res) => {
  res.json({ module: "categories", status: "not_implemented" });
});
