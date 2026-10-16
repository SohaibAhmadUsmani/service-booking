import { NotificationType } from "@service-booking/shared";
import { ACTIVE_STATUSES, Booking } from "../bookings/model";
import { notificationsRepository } from "./repository";
import { notificationsService } from "./service";

/**
 * Upcoming appointment reminders.
 *
 * Scheduling: the API runs as a single long-lived Node process (`server/src/index.ts`),
 * and the project has no external worker/queue/cron dependency. The smallest safe
 * option is therefore an in-process interval that polls MongoDB. It is restart-safe
 * (bookings are re-evaluated from the database) and duplicate-safe (a partial unique
 * index plus an existence check guarantee one reminder per booking and recipient).
 */

const DEFAULT_LEAD_MINUTES = 60;
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function reminderLeadMs(): number {
  return positiveNumber(process.env.UPCOMING_REMINDER_LEAD_MINUTES, DEFAULT_LEAD_MINUTES) * 60 * 1000;
}

export function reminderIntervalMs(): number {
  return positiveNumber(process.env.UPCOMING_REMINDER_INTERVAL_MS, DEFAULT_INTERVAL_MS);
}

interface ReminderBooking {
  _id: unknown;
  bookingId: string;
  customerId: { toString(): string };
  providerId: { toString(): string };
  date: string;
  startTime: string;
  status: string;
}

/** Appointments are stored as UTC date + time, matching the availability module. */
function appointmentTimeMs(date: string, startTime: string): number | null {
  if (typeof date !== "string" || typeof startTime !== "string") return null;
  const ms = Date.parse(`${date}T${startTime}:00Z`);
  return Number.isNaN(ms) ? null : ms;
}

function dateKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * A booking is eligible for a reminder when it is still active and its start time
 * falls inside the (now, now + lead] window. Past, cancelled and final bookings are
 * ignored, as are bookings with malformed date/time.
 */
export function isReminderEligible(
  booking: Pick<ReminderBooking, "status" | "date" | "startTime">,
  nowMs: number,
  leadMs: number
): boolean {
  if (!ACTIVE_STATUSES.includes(booking.status as (typeof ACTIVE_STATUSES)[number])) return false;
  const apptMs = appointmentTimeMs(booking.date, booking.startTime);
  if (apptMs === null) return false;
  const delta = apptMs - nowMs;
  return delta > 0 && delta <= leadMs;
}

async function findCandidateBookings(nowMs: number, leadMs: number): Promise<ReminderBooking[]> {
  return Booking.find({
    status: { $in: ACTIVE_STATUSES },
    date: { $gte: dateKey(nowMs), $lte: dateKey(nowMs + leadMs) },
  }).lean();
}

async function sendReminderForBooking(booking: ReminderBooking): Promise<number> {
  const bookingDbId = String(booking._id);
  const customerId = booking.customerId.toString();
  const providerId = booking.providerId.toString();
  const slot = `${booking.date} at ${booking.startTime}`;
  const data = {
    bookingDbId,
    bookingId: booking.bookingId,
    date: booking.date,
    startTime: booking.startTime,
    status: booking.status,
  };

  const recipients = [
    {
      userId: customerId,
      message: `Reminder: your booking ${booking.bookingId} is on ${slot}.`,
    },
    {
      userId: providerId,
      message: `Reminder: booking ${booking.bookingId} is on ${slot}.`,
    },
  ];

  let sent = 0;
  for (const recipient of recipients) {
    try {
      const alreadySent = await notificationsRepository.existsForBooking(
        recipient.userId,
        NotificationType.UpcomingAppointment,
        bookingDbId
      );
      if (alreadySent) continue;

      await notificationsService.notify({
        userId: recipient.userId,
        type: NotificationType.UpcomingAppointment,
        title: "Upcoming appointment",
        message: recipient.message,
        data,
      });
      sent += 1;
    } catch (err) {
      console.error(
        `[reminders] failed to notify ${recipient.userId} for booking ${bookingDbId}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
  return sent;
}

export interface ReminderScanResult {
  scanned: number;
  sent: number;
}

/**
 * One reminder pass. Never throws: the scheduler and calling code rely on it to be
 * safe even when MongoDB is unavailable. Exposed for tests and manual triggering.
 */
export async function scanUpcomingAppointments(
  options: { now?: Date; leadMs?: number } = {}
): Promise<ReminderScanResult> {
  const nowMs = (options.now ?? new Date()).getTime();
  const leadMs = options.leadMs ?? reminderLeadMs();

  let candidates: ReminderBooking[];
  try {
    candidates = await findCandidateBookings(nowMs, leadMs);
  } catch (err) {
    console.error(
      "[reminders] scan query failed:",
      err instanceof Error ? err.message : err
    );
    return { scanned: 0, sent: 0 };
  }

  let sent = 0;
  for (const booking of candidates) {
    if (!isReminderEligible(booking, nowMs, leadMs)) continue;
    sent += await sendReminderForBooking(booking);
  }
  return { scanned: candidates.length, sent };
}

let timer: NodeJS.Timeout | undefined;

/** Starts the in-process reminder poller. Idempotent. */
export function startUpcomingAppointmentScheduler(): NodeJS.Timeout {
  if (timer) return timer;
  const intervalMs = reminderIntervalMs();
  const tick = () => {
    scanUpcomingAppointments().catch((err) => {
      console.error("[reminders] scheduled scan failed:", err instanceof Error ? err.message : err);
    });
  };
  timer = setInterval(tick, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  console.log(
    `[reminders] upcoming appointment scheduler started (every ${intervalMs}ms, lead ${reminderLeadMs()}ms)`
  );
  return timer;
}

export function stopUpcomingAppointmentScheduler(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = undefined;
}
