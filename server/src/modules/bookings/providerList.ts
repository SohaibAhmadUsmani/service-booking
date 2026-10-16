import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

/**
 * GET /api/bookings/providers
 * Public, read-only. Lists active providers who have saved a schedule,
 * with only safe fields: id, name, business name, rating.
 */
export async function listBookableProviders(_req: Request, res: Response, next: NextFunction) {
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not ready");

    const schedules = await db.collection("availabilities").find({}, { projection: { providerId: 1 } }).toArray();
    const ids = schedules.map((s) => s.providerId);
    if (ids.length === 0) return res.json([]);

    const users = await db
      .collection("users")
      .find({ _id: { $in: ids }, role: "provider", isActive: { $ne: false } }, { projection: { firstName: 1, lastName: 1 } })
      .toArray();
    const profiles = await db
      .collection("providerprofiles")
      .find({ userId: { $in: ids } }, { projection: { userId: 1, businessName: 1, rating: 1, reviewCount: 1 } })
      .toArray();

    const list = users.map((u) => {
      const p = profiles.find((x) => String(x.userId) === String(u._id));
      return {
        id: String(u._id),
        name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
        businessName: p?.businessName ?? null,
        rating: p?.rating ?? 0,
        reviewCount: p?.reviewCount ?? 0,
      };
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
}