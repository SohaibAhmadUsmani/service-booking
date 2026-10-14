import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { ServiceModel } from "./model";

type AuthedRequest = Request & {
  user?: { userId?: string; id?: string; _id?: string; role?: string };
};

function getUser(req: Request): { id: string; role: string } | null {
  const u = (req as AuthedRequest).user;
  const id = u?.userId ?? u?.id ?? u?._id;
  if (!u || !id) return null;
  return { id: String(id), role: String(u.role ?? "").toLowerCase() };
}

const isProviderOrAdmin = (role: string) => role === "provider" || role === "admin";

/** Public: active services, optionally for one provider or category */
export async function listServicesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { providerId, category } = req.query;
    const filter: Record<string, unknown> = { isActive: true };

    if (providerId !== undefined) {
      if (typeof providerId !== "string" || !Types.ObjectId.isValid(providerId)) {
        res.status(400).json({ error: "Invalid providerId" });
        return;
      }
      filter.providerId = providerId;
    }
    if (typeof category === "string" && category.trim()) filter.category = category.trim();

    const services = await ServiceModel.find(filter).sort({ createdAt: -1 });
    res.json({ data: services });
  } catch (err) {
    next(err);
  }
}

/** Provider: all of my services, including inactive ones */
export async function listMyServicesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      res.status(401).json({ error: "Login required" });
      return;
    }
    if (!isProviderOrAdmin(user.role)) {
      res.status(403).json({ error: "Only providers can manage services" });
      return;
    }
    const services = await ServiceModel.find({ providerId: user.id }).sort({ createdAt: -1 });
    res.json({ data: services });
  } catch (err) {
    next(err);
  }
}

export async function createServiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      res.status(401).json({ error: "Login required" });
      return;
    }
    if (user.role !== "provider") {
      res.status(403).json({ error: "Only providers can create services" });
      return;
    }
    // providerId always comes from the token, never from the request body
    const service = await ServiceModel.create({ ...req.body, providerId: user.id });
    res.status(201).json({ data: service });
  } catch (err) {
    next(err);
  }
}

export async function updateServiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      res.status(401).json({ error: "Login required" });
      return;
    }
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid service id" });
      return;
    }
    const service = await ServiceModel.findById(id);
    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    if (!isProviderOrAdmin(user.role) || (user.role !== "admin" && String(service.providerId) !== user.id)) {
      res.status(403).json({ error: "You can only change your own services" });
      return;
    }
    Object.assign(service, req.body);
    await service.save();
    res.json({ data: service });
  } catch (err) {
    next(err);
  }
}

/** DELETE does not remove the record: it sets isActive to false */
export async function deactivateServiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      res.status(401).json({ error: "Login required" });
      return;
    }
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid service id" });
      return;
    }
    const service = await ServiceModel.findById(id);
    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    if (!isProviderOrAdmin(user.role) || (user.role !== "admin" && String(service.providerId) !== user.id)) {
      res.status(403).json({ error: "You can only change your own services" });
      return;
    }
    service.isActive = false;
    await service.save();
    res.json({ data: service });
  } catch (err) {
    next(err);
  }
}