import type { NextFunction, Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { ServiceModel } from "./model";

function getUser(req: Request): { id: string; role: string } | null {
  const id = req.user?.userId;
  if (!id) return null;
  return { id: String(id), role: String(req.user?.role ?? "").toLowerCase() };
}

/** Public: categories a provider can choose from (reads the shared "categories" collection) */
export async function listCategoriesHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      res.status(503).json({ error: "Database connection not ready" });
      return;
    }
    const docs = await db
      .collection("categories")
      .find({ isActive: { $ne: false } })
      .sort({ name: 1 })
      .toArray();
    res.json({ data: docs.map((c) => ({ id: String(c._id), name: c.name, icon: c.icon })) });
  } catch (err) {
    next(err);
  }
}

/** Public: active services, optionally for one provider */
export async function listServicesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { providerId } = req.query;
    const filter: Record<string, unknown> = { isActive: true };

    if (providerId !== undefined) {
      if (typeof providerId !== "string" || !Types.ObjectId.isValid(providerId)) {
        res.status(400).json({ error: "Invalid providerId" });
        return;
      }
      filter.providerId = providerId;
    }

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
    if (user.role !== "provider" && user.role !== "admin") {
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

/** Loads a service and checks the caller may change it. Returns null after sending an error. */
async function loadOwned(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    res.status(401).json({ error: "Login required" });
    return null;
  }
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid service id" });
    return null;
  }
  const service = await ServiceModel.findById(id).lean();
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return null;
  }
  // Admin-seeded services have no providerId, so only an admin can change them
  const owner = service.providerId ? String(service.providerId) : "";
  const allowed = user.role === "admin" || (user.role === "provider" && owner === user.id);
  if (!allowed) {
    res.status(403).json({ error: "You can only change your own services" });
    return null;
  }
  return id;
}

export async function updateServiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = await loadOwned(req, res);
    if (!id) return;
    const updated = await ServiceModel.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/** DELETE does not remove the record: it sets isActive to false */
export async function deactivateServiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = await loadOwned(req, res);
    if (!id) return;
    const updated = await ServiceModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}