import type { Request } from "express";
import { parseSearchParams } from "./filters";
import { getFilterOptions, searchProviders, searchServices } from "./repository";

export function findServices(req: Request) {
  return searchServices(parseSearchParams(req));
}

/** Also used by GET /api/providers (the public provider listing). */
export function findProviders(req: Request) {
  return searchProviders(parseSearchParams(req));
}

export function listFilterOptions() {
  return getFilterOptions();
}
