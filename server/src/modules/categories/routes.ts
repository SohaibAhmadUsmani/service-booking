import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { getCategoryHandler, listCategoriesHandler } from "./controller";

/**
 * Owner: Khadija
 * Public, read-only category browsing.
 *   GET /api/categories         -> active categories with service/provider counts
 *   GET /api/categories/:slug   -> one category
 * Creating/editing categories is part of the admin module.
 */
export const categoriesRouter = Router();

categoriesRouter.get("/", asyncHandler(listCategoriesHandler));
categoriesRouter.get("/:slug", asyncHandler(getCategoryHandler));
