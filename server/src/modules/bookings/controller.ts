import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../availability/service";
import { bookingsService } from "./service";

function handle(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  next(err);
}

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await bookingsService.create(req.body));
  } catch (err) {
    handle(err, res, next);
  }
}

export async function listBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, providerId, status } = req.query;
    res.json(
      await bookingsService.list({
        customerId: customerId ? String(customerId) : undefined,
        providerId: providerId ? String(providerId) : undefined,
        status: status ? String(status) : undefined,
      })
    );
  } catch (err) {
    handle(err, res, next);
  }
}

export async function getBooking(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await bookingsService.get(req.params.id));
  } catch (err) {
    handle(err, res, next);
  }
}

export async function changeBookingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await bookingsService.changeStatus(req.params.id, String(req.body?.status ?? "")));
  } catch (err) {
    handle(err, res, next);
  }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await bookingsService.cancel(req.params.id));
  } catch (err) {
    handle(err, res, next);
  }
}

export async function rescheduleBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, startTime } = req.body ?? {};
    res.json(await bookingsService.reschedule(req.params.id, date, startTime));
  } catch (err) {
    handle(err, res, next);
  }
}
