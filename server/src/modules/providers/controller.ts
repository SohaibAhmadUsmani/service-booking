import type { Request, Response } from "express";
import { badRequest, notFound } from "../../lib/httpError";
import { findProviders } from "../search/service";
import { getProviderProfile, listProviderServices, providerExists } from "./repository";

/** GET /api/providers — public provider listing; accepts the same filters as /api/search/providers. */
export async function listProvidersHandler(req: Request, res: Response) {
  res.json(await findProviders(req));
}

/** GET /api/providers/:id — public profile (id or slug) with services, prices and rating summary. */
export async function getProviderHandler(req: Request, res: Response) {
  const profile = await getProviderProfile(req.params.id);
  if (!profile) throw notFound("Provider not found");
  res.json({ data: profile });
}

/** GET /api/providers/:id/services?category=slug — active services of one provider. */
export async function listProviderServicesHandler(req: Request, res: Response) {
  const category = req.query.category;
  if (category !== undefined && typeof category !== "string") {
    throw badRequest("category must be a single text value");
  }
  if (category && !/^[a-z0-9-]{1,80}$/i.test(category)) {
    throw badRequest("Invalid category");
  }

  const providerId = await providerExists(req.params.id);
  if (!providerId) throw notFound("Provider not found");

  res.json({ data: await listProviderServices(providerId, category || undefined) });
}
