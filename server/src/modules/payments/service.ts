import { NotificationType, PaymentMethod, PaymentStatus, UserRole } from "@service-booking/shared";
import { AppError } from "../../middleware/errorHandler";
import { HttpError } from "../availability/service";
import { bookingsRepository } from "../bookings/repository";
import { bookingsService } from "../bookings/service";
import { notificationsService } from "../notifications/service";
import { paymentsRepository, PaymentListFilters } from "./repository";

export interface CreatePaymentInput {
  bookingId: string;
  currency?: string;
  method?: PaymentMethod;
}

export interface ProcessPaymentInput {
  outcome?: "paid" | "failed";
}

function makeTransactionReference() {
  return (
    "MOCK-" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  );
}

function isAdmin(role?: string) {
  return role === UserRole.Admin;
}

function isParticipant(
  payment: { customerId: { toString(): string }; providerId: { toString(): string } },
  userId: string
) {
  return payment.customerId.toString() === userId || payment.providerId.toString() === userId;
}

async function findOrFail(id: string) {
  const payment = await paymentsRepository.findById(id);
  if (!payment) throw new AppError("Payment not found.", 404);
  return payment;
}

async function findAuthorized(id: string, userId: string, role?: string) {
  const payment = await findOrFail(id);
  if (!isAdmin(role) && !isParticipant(payment, userId)) {
    throw new AppError("Payment not found.", 404);
  }
  return payment;
}

interface PaymentNotifyContext {
  id?: string;
  _id?: unknown;
  customerId: { toString(): string };
  providerId: { toString(): string };
  bookingId: { toString(): string };
  amount: number;
  currency: string;
  transactionReference?: string;
}

async function notifyPaymentStatus(payment: PaymentNotifyContext, status: PaymentStatus) {
  const isPaid = status === PaymentStatus.Paid;
  const title = isPaid ? "Payment received" : "Payment refunded";
  const ref = payment.transactionReference ? ` (ref ${payment.transactionReference})` : "";
  const amount = `${payment.amount} ${payment.currency}`;
  const data = {
    paymentId: payment.id ?? String(payment._id),
    bookingDbId: String(payment.bookingId),
    amount: payment.amount,
    currency: payment.currency,
    transactionReference: payment.transactionReference,
  };

  const customerMessage = isPaid
    ? `Payment of ${amount} was received${ref}.`
    : `Your payment of ${amount} was refunded${ref}.`;
  const providerMessage = isPaid
    ? `You received a payment of ${amount}${ref}.`
    : `Payment of ${amount} was refunded${ref}.`;

  for (const userId of [payment.customerId.toString(), payment.providerId.toString()]) {
    await notificationsService.notify({
      userId,
      type: isPaid ? NotificationType.PaymentReceived : NotificationType.PaymentRefunded,
      title,
      message: userId === payment.customerId.toString() ? customerMessage : providerMessage,
      data,
    });
  }
}

export const paymentsService = {
  async create(userId: string, role: string, input: CreatePaymentInput) {
    const booking = await bookingsRepository.findById(input.bookingId);
    if (!booking) throw new AppError("Booking not found.", 404);

    if (!isAdmin(role) && booking.customerId.toString() !== userId) {
      throw new AppError("Only the booking customer can create a payment for this booking.", 403);
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new AppError(`A payment cannot be created for a ${booking.status} booking.`, 409);
    }

    const existing = await paymentsRepository.findByBookingId(input.bookingId);
    if (existing) throw new AppError("A payment already exists for this booking.", 409);

    try {
      return await paymentsRepository.create({
        bookingId: booking._id.toString(),
        customerId: booking.customerId.toString(),
        providerId: booking.providerId.toString(),
        amount: booking.price,
        currency: (input.currency ?? "USD").toUpperCase(),
        method: input.method,
        transactionReference: makeTransactionReference(),
      });
    } catch (err) {
      if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
        throw new AppError("A payment already exists for this booking.", 409);
      }
      throw err;
    }
  },

  async get(id: string, userId: string, role?: string) {
    return findAuthorized(id, userId, role);
  },

  async getByBooking(bookingId: string, userId: string, role?: string) {
    const payment = await paymentsRepository.findByBookingId(bookingId);
    if (!payment) throw new AppError("Payment not found.", 404);
    if (!isAdmin(role) && !isParticipant(payment, userId)) {
      throw new AppError("Payment not found.", 404);
    }
    return payment;
  },

  async list(filters: PaymentListFilters, userId: string, role?: string) {
    if (isAdmin(role)) return paymentsRepository.list(filters);
    return paymentsRepository.list(filters, { customerId: userId, providerId: userId });
  },

  async listMine(userId: string, filters: PaymentListFilters) {
    return paymentsRepository.list(filters, { customerId: userId, providerId: userId });
  },

  async process(id: string, userId: string, role: string | undefined, input: ProcessPaymentInput) {
    const payment = await findAuthorized(id, userId, role);

    if (payment.status !== PaymentStatus.Pending) {
      throw new AppError(`Cannot process a payment that is already ${payment.status}.`, 409);
    }

    const target = input.outcome ?? PaymentStatus.Paid;
    const set: Record<string, unknown> = { status: target };
    if (target === PaymentStatus.Paid) {
      set.paidAt = new Date();
    } else {
      set.failureReason = "Mock payment gateway declined the transaction.";
    }

    const updated = await paymentsRepository.transition(id, [PaymentStatus.Pending], set);
    if (!updated) {
      throw new AppError("Payment has already been processed.", 409);
    }

    if (target === PaymentStatus.Paid) {
      const booking = await bookingsRepository.findById(updated.bookingId.toString());
      if (booking && booking.status === "pending") {
        try {
          await bookingsService.changeStatus(booking._id.toString(), "confirmed");
        } catch (err) {
          if (!(err instanceof HttpError)) throw err;
        }
      }
      await notifyPaymentStatus(updated, PaymentStatus.Paid);
    }

    return updated;
  },

  async refund(id: string, userId: string, role?: string) {
    const payment = await findAuthorized(id, userId, role);

    if (payment.status === PaymentStatus.Refunded) {
      throw new AppError("Payment has already been refunded.", 409);
    }
    if (payment.status !== PaymentStatus.Paid) {
      throw new AppError("Only a paid payment can be refunded.", 409);
    }

    const updated = await paymentsRepository.transition(id, [PaymentStatus.Paid], {
      status: PaymentStatus.Refunded,
      refundedAt: new Date(),
    });
    if (!updated) {
      throw new AppError("Payment has already been refunded.", 409);
    }
    await notifyPaymentStatus(updated, PaymentStatus.Refunded);
    return updated;
  },
};
