import { isValidObjectId } from "mongoose";
import { availabilityRepository } from "./repository";

export interface TimeRange {
  start: string; // "HH:mm"
  end: string;
}
export interface WorkingDay extends TimeRange {
  day: number; // 0 = Sunday ... 6 = Saturday
  breaks: TimeRange[];
}
export interface AvailabilityInput {
  slotDurationMinutes?: number;
  workingDays: WorkingDay[];
}
export interface Slot {
  start: string;
  end: string;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(t: string): number {
  if (typeof t !== "string" || !TIME_RE.test(t)) {
    throw new HttpError(400, `Invalid time "${t}", use HH:mm (e.g. 09:30)`);
  }
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function assertProviderId(providerId: string) {
  if (!isValidObjectId(providerId)) {
    throw new HttpError(400, "Invalid providerId");
  }
}

function validateInput(input: AvailabilityInput) {
  if (!input || !Array.isArray(input.workingDays)) {
    throw new HttpError(400, "workingDays must be an array");
  }

  const duration = input.slotDurationMinutes ?? 30;
  if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
    throw new HttpError(400, "slotDurationMinutes must be a whole number from 5 to 240");
  }

  const seenDays = new Set<number>();
  for (const wd of input.workingDays) {
    if (!Number.isInteger(wd.day) || wd.day < 0 || wd.day > 6) {
      throw new HttpError(400, "day must be 0 (Sunday) to 6 (Saturday)");
    }
    if (seenDays.has(wd.day)) {
      throw new HttpError(400, `Day ${wd.day} is listed more than once`);
    }
    seenDays.add(wd.day);

    const start = toMinutes(wd.start);
    const end = toMinutes(wd.end);
    if (start >= end) {
      throw new HttpError(400, `Day ${wd.day}: start must be before end`);
    }

    const breaks = (wd.breaks ?? [])
      .map((b) => ({ s: toMinutes(b.start), e: toMinutes(b.end) }))
      .sort((a, b) => a.s - b.s);

    breaks.forEach((b, i) => {
      if (b.s >= b.e) throw new HttpError(400, `Day ${wd.day}: a break must start before it ends`);
      if (b.s < start || b.e > end) {
        throw new HttpError(400, `Day ${wd.day}: breaks must be inside working hours`);
      }
      if (i > 0 && b.s < breaks[i - 1].e) {
        throw new HttpError(400, `Day ${wd.day}: breaks must not overlap`);
      }
    });
  }
  return duration;
}

export const availabilityService = {
  async get(providerId: string) {
    assertProviderId(providerId);
    const found = await availabilityRepository.findByProvider(providerId);
    if (!found) throw new HttpError(404, "No availability set for this provider");
    return found;
  },

  async set(providerId: string, input: AvailabilityInput) {
    assertProviderId(providerId);
    const slotDurationMinutes = validateInput(input);
    const workingDays = input.workingDays.map((wd) => ({ ...wd, breaks: wd.breaks ?? [] }));
    return availabilityRepository.upsert(providerId, { slotDurationMinutes, workingDays });
  },

  /**
   * Open slots for one date. `bookedStarts` is a list of "HH:mm" start times that
   * are already taken; the bookings module will supply it later.
   */
  async getSlots(providerId: string, date: string, bookedStarts: string[] = []): Promise<Slot[]> {
    assertProviderId(providerId);

    const parsed = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date) {
      throw new HttpError(400, "date must be a real date in YYYY-MM-DD format");
    }

    const availability = await this.get(providerId);
    const workingDay = availability.workingDays.find((d) => d.day === parsed.getUTCDay());
    if (!workingDay) return []; // provider does not work that day

    const duration = availability.slotDurationMinutes;
    const dayStart = toMinutes(workingDay.start);
    const dayEnd = toMinutes(workingDay.end);
    const breaks = workingDay.breaks.map((b) => ({ s: toMinutes(b.start), e: toMinutes(b.end) }));
    const booked = new Set(bookedStarts);

    const slots: Slot[] = [];
    for (let t = dayStart; t + duration <= dayEnd; t += duration) {
      const hitsBreak = breaks.some((b) => t < b.e && t + duration > b.s);
      if (hitsBreak || booked.has(toTime(t))) continue;
      slots.push({ start: toTime(t), end: toTime(t + duration) });
    }
    return slots;
  },
};
