import { isValidObjectId } from "mongoose";
import type { NextFunction, Request, Response } from "express";
import { bookingsRepository } from "../bookings/repository";
import { HttpError, availabilityService } from "./service";

function handle(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  next(err);
}

export async function getAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await availabilityService.get(req.params.providerId));
  } catch (err) {
    handle(err, res, next);
  }
}

export async function setAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await availabilityService.set(req.params.providerId, req.body));
  } catch (err) {
    handle(err, res, next);
  }
}

export async function getSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const { providerId } = req.params;
    if (!isValidObjectId(providerId)) throw new HttpError(400, "Invalid providerId");
    const date = String(req.query.date ?? "");
    const booked = await bookingsRepository.activeStartTimes(providerId, date);
    res.json({ date, slots: await availabilityService.getSlots(providerId, date, booked) });
  } catch (err) {
    handle(err, res, next);
  }
}
