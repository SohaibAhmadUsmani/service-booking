import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../../middleware/errorHandler";

/** Replaces the price sent by the client with the real price of the service. */
export async function useServicePrice(req: Request, _res: Response, next: NextFunction) {
  try {
    const id = req.body?.serviceId;
    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      throw new AppError("serviceId must be a valid id", 400);
    }
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not ready");
    const svc = await db
      .collection("services")
      .findOne({ _id: new mongoose.Types.ObjectId(id) }, { projection: { price: 1, isActive: 1 } });
    if (!svc || svc.isActive === false) throw new AppError("That service is not available", 404);
    req.body = { ...req.body, price: svc.price };
    next();
  } catch (err) {
    next(err);
  }
}