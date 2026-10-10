import { isValidObjectId, Types } from "mongoose";
import type { NextFunction, Request, Response } from "express";
import { availabilityRepository } from "../availability/repository";
import { HttpError } from "../availability/service";
import { Booking } from "./model";

const MAX_DAYS = 62;
const DAY_MS = 86400000;

function isValidDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

/** GET /api/bookings/calendar?providerId=...&from=YYYY-MM-DD&to=YYYY-MM-DD[&includeCancelled=true] */
export async function getCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const providerId = String(req.query.providerId ?? "");
    const from = String(req.query.from ?? "");
    const to = String(req.query.to ?? "");
    const includeCancelled = req.query.includeCancelled === "true";

    if (!isValidObjectId(providerId)) throw new HttpError(400, "providerId must be a valid id");
    if (!isValidDate(from) || !isValidDate(to)) {
      throw new HttpError(400, "from and to must be real dates in YYYY-MM-DD format");
    }
    if (from > to) throw new HttpError(400, "from must be on or before to");

    const start = new Date(`${from}T00:00:00Z`).getTime();
    const end = new Date(`${to}T00:00:00Z`).getTime();
    const dayCount = (end - start) / DAY_MS + 1;
    if (dayCount > MAX_DAYS) throw new HttpError(400, `Range cannot be longer than ${MAX_DAYS} days`);

    const query: Record<string, any> = {
      providerId: new Types.ObjectId(providerId),
      date: { $gte: from, $lte: to },
    };
    if (!includeCancelled) query.status = { $ne: "cancelled" };

    const [availability, bookings] = await Promise.all([
      availabilityRepository.findByProvider(providerId),
      Booking.find(query).sort({ date: 1, startTime: 1 }).lean(),
    ]);

    const byDate = new Map<string, any[]>();
    for (const b of bookings) {
      const list = byDate.get(b.date) ?? [];
      list.push(b);
      byDate.set(b.date, list);
    }

    const days = [];
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
      const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
      const wd = availability?.workingDays.find((d) => d.day === dow);
      days.push({
        date,
        working: wd ? { start: wd.start, end: wd.end, breaks: wd.breaks } : null,
        bookings: byDate.get(date) ?? [],
      });
    }

    res.json({ providerId, from, to, days });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}