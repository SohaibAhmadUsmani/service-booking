import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import {
  filterOptionsHandler,
  searchProvidersHandler,
  searchServicesHandler,
} from "./controller";

/** Owner: Khadija */
export const searchRouter = Router();

/**
 * Public, read-only search.
 *
 *   GET /api/search                 -> same as /services
 *   GET /api/search/services        -> services matching the filters (with provider summary)
 *   GET /api/search/providers       -> providers that have matching services
 *   GET /api/search/filters         -> options for the filter UI (categories, cities, price range)
 *
 * Filters (all optional): q, category, location, lat, lng, radiusKm, minPrice, maxPrice,
 * minRating, serviceType, date (YYYY-MM-DD), available, sort, page, limit.
 */
searchRouter.get("/", asyncHandler(searchServicesHandler));
searchRouter.get("/services", asyncHandler(searchServicesHandler));
searchRouter.get("/providers", asyncHandler(searchProvidersHandler));
searchRouter.get("/filters", asyncHandler(filterOptionsHandler));
