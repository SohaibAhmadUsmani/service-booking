import type { Request, Response } from "express";
import { findProviders, findServices, listFilterOptions } from "./service";

export async function searchServicesHandler(req: Request, res: Response) {
  res.json(await findServices(req));
}

export async function searchProvidersHandler(req: Request, res: Response) {
  res.json(await findProviders(req));
}

export async function filterOptionsHandler(_req: Request, res: Response) {
  res.json({ data: await listFilterOptions() });
}
