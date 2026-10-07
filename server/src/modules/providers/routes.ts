import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import {
  getProviderHandler,
  listProviderServicesHandler,
  listProvidersHandler,
} from "./controller";

/**
 * Owner: Khadija (public catalog); Maira (provider-scoped updates via services module)
 *
 * Public, read-only:
 *   GET /api/providers                  -> provider listing (same filters as /api/search/providers)
 *   GET /api/providers/:id              -> public profile; :id is the UUID or the slug
 *   GET /api/providers/:id/services     -> active services and prices
 */
export const providersRouter = Router();

providersRouter.get("/", asyncHandler(listProvidersHandler));
providersRouter.get("/:id", asyncHandler(getProviderHandler));
providersRouter.get("/:id/services", asyncHandler(listProviderServicesHandler));
