import { isValidObjectId } from "mongoose";
import { NotificationType } from "@service-booking/shared";
import { HttpError, availabilityService } from "../availability/service";
import { notificationsService } from "../notifications/service";
import { BOOKING_STATUSES, BookingStatus } from "./model";
import { bookingsRepository } from "./repository";

export interface CreateBookingInput {
  customerId: string;
  providerId: string;
  serviceId: string;
  date: string;
  startTime: string;
  price: number;
  details?: { name?: string; phone?: string; notes?: string };
}

/** Allowed status changes. Completed, cancelled and no_show are final. */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

function makeBookingId() {
  return "BK-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function assertId(value: unknown, name: string) {
  if (typeof value !== "string" || !isValidObjectId(value)) {
    throw new HttpError(400, `${name} must be a valid id`);
  }
}

function assertNotPast(date: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) throw new HttpError(400, "Cannot book a date in the past");
}

async function findOrFail(id: string) {
  assertId(id, "booking id");
  const booking = await bookingsRepository.findById(id);
  if (!booking) throw new HttpError(404, "Booking not found");
  return booking;
}

/** Returns the slot end time if `startTime` is open for this provider and date. */
async function requireOpenSlot(providerId: string, date: string, startTime: string, excludeId?: string) {
  const booked = await bookingsRepository.activeStartTimes(providerId, date, excludeId);
  const slots = await availabilityService.getSlots(providerId, date, booked);
  const slot = slots.find((s) => s.start === startTime);
  if (!slot) throw new HttpError(409, "That time is not available");
  return slot.end;
}

interface BookingNotifyContext {
  _id: unknown;
  bookingId: string;
  customerId: { toString(): string };
  providerId: { toString(): string };
  date: string;
  startTime: string;
  status: string;
}

function bookingNotifyData(booking: BookingNotifyContext, extra?: Record<string, unknown>) {
  return {
    bookingDbId: String(booking._id),
    bookingId: booking.bookingId,
    date: booking.date,
    startTime: booking.startTime,
    status: booking.status,
    ...extra,
  };
}

async function notifyBookingEvent(
  events: { userId: string; type: NotificationType; title: string; message: string }[],
  data: Record<string, unknown>
) {
  for (const event of events) {
    await notificationsService.notify({ ...event, data });
  }
}

async function notifyStatusChange(booking: BookingNotifyContext, status: BookingStatus) {
  const slot = `${booking.date} at ${booking.startTime}`;
  const customer = booking.customerId.toString();
  const provider = booking.providerId.toString();
  const data = bookingNotifyData(booking);
  const events: { userId: string; type: NotificationType; title: string; message: string }[] = [];

  if (status === "confirmed") {
    events.push(
      {
        userId: customer,
        type: NotificationType.BookingConfirmed,
        title: "Booking confirmed",
        message: `Your booking ${booking.bookingId} on ${slot} is confirmed.`,
      },
      {
        userId: provider,
        type: NotificationType.BookingConfirmed,
        title: "Booking confirmed",
        message: `Booking ${booking.bookingId} on ${slot} is confirmed.`,
      }
    );
  } else if (status === "cancelled") {
    events.push(
      {
        userId: customer,
        type: NotificationType.BookingCancelled,
        title: "Booking cancelled",
        message: `Your booking ${booking.bookingId} on ${slot} has been cancelled.`,
      },
      {
        userId: provider,
        type: NotificationType.BookingCancelled,
        title: "Booking cancelled",
        message: `Booking ${booking.bookingId} on ${slot} has been cancelled.`,
      }
    );
  } else if (status === "completed") {
    events.push(
      {
        userId: customer,
        type: NotificationType.BookingCompleted,
        title: "Booking completed",
        message: `Your booking ${booking.bookingId} is complete. You can now leave a review.`,
      },
      {
        userId: provider,
        type: NotificationType.BookingCompleted,
        title: "Booking completed",
        message: `Booking ${booking.bookingId} is complete.`,
      }
    );
  }

  await notifyBookingEvent(events, data);
}

async function notifyRescheduled(
  booking: BookingNotifyContext,
  date: string,
  startTime: string
) {
  const customer = booking.customerId.toString();
  const provider = booking.providerId.toString();
  const data = bookingNotifyData(booking, {
    date,
    startTime,
    previousDate: booking.date,
    previousStartTime: booking.startTime,
  });

  await notifyBookingEvent(
    [
      {
        userId: customer,
        type: NotificationType.BookingRescheduled,
        title: "Booking rescheduled",
        message: `Your booking ${booking.bookingId} was rescheduled to ${date} at ${startTime}.`,
      },
      {
        userId: provider,
        type: NotificationType.BookingRescheduled,
        title: "Booking rescheduled",
        message: `Booking ${booking.bookingId} was rescheduled to ${date} at ${startTime}.`,
      },
    ],
    data
  );
}

export const bookingsService = {
  async create(input: CreateBookingInput) {
    if (!input) throw new HttpError(400, "Request body is required");
    assertId(input.customerId, "customerId");
    assertId(input.providerId, "providerId");
    assertId(input.serviceId, "serviceId");
    if (typeof input.price !== "number" || !(input.price >= 0)) {
      throw new HttpError(400, "price must be a number, 0 or more");
    }
    if (typeof input.date !== "string") throw new HttpError(400, "date is required (YYYY-MM-DD)");
    assertNotPast(input.date);

    const endTime = await requireOpenSlot(input.providerId, input.date, input.startTime);

    return bookingsRepository.create({
      bookingId: makeBookingId(),
      customerId: input.customerId,
      providerId: input.providerId,
      serviceId: input.serviceId,
      date: input.date,
      startTime: input.startTime,
      endTime,
      price: input.price,
      details: input.details,
    });
  },

  async get(id: string) {
    return findOrFail(id);
  },

  async list(filters: { customerId?: string; providerId?: string; status?: string }) {
    if (!filters.customerId && !filters.providerId) {
      throw new HttpError(400, "Provide customerId or providerId");
    }
    if (filters.customerId) assertId(filters.customerId, "customerId");
    if (filters.providerId) assertId(filters.providerId, "providerId");
    if (filters.status && !BOOKING_STATUSES.includes(filters.status as BookingStatus)) {
      throw new HttpError(400, `status must be one of: ${BOOKING_STATUSES.join(", ")}`);
    }
    return bookingsRepository.list({
      customerId: filters.customerId,
      providerId: filters.providerId,
      status: filters.status as BookingStatus | undefined,
    });
  },

  async changeStatus(id: string, status: string) {
    const booking = await findOrFail(id);
    if (!BOOKING_STATUSES.includes(status as BookingStatus)) {
      throw new HttpError(400, `status must be one of: ${BOOKING_STATUSES.join(", ")}`);
    }
    const allowed = TRANSITIONS[booking.status as BookingStatus];
    if (!allowed.includes(status as BookingStatus)) {
      throw new HttpError(409, `Cannot change a ${booking.status} booking to ${status}`);
    }
    const updated = await bookingsRepository.update(id, { status });
    await notifyStatusChange(booking, status as BookingStatus);
    return updated;
  },

  async cancel(id: string) {
    return this.changeStatus(id, "cancelled");
  },

  async reschedule(id: string, date: string, startTime: string) {
    const booking = await findOrFail(id);
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new HttpError(409, `Cannot reschedule a ${booking.status} booking`);
    }
    if (typeof date !== "string") throw new HttpError(400, "date is required (YYYY-MM-DD)");
    assertNotPast(date);

    const endTime = await requireOpenSlot(String(booking.providerId), date, startTime, id);
    const updated = await bookingsRepository.update(id, { date, startTime, endTime });
    await notifyRescheduled(booking, date, startTime);
    return updated;
  },
};
