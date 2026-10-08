"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  Landmark,
  RotateCcw,
  Wallet,
  X,
} from "lucide-react";
import { Payment, PaymentMethod, PaymentStatus } from "@service-booking/shared";
import { ShimmerButton } from "../../../components/ui/ShimmerButton";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError, apiGet, apiPost } from "../../../lib/api/client";

interface BookingRecord {
  _id: string;
  bookingId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const METHODS: { value: PaymentMethod; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: PaymentMethod.Card, label: "Card", Icon: CreditCard },
  { value: PaymentMethod.BankTransfer, label: "Bank transfer", Icon: Landmark },
  { value: PaymentMethod.Cash, label: "Cash", Icon: Banknote },
  { value: PaymentMethod.Wallet, label: "Wallet", Icon: Wallet },
];

const STATUS_STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  [PaymentStatus.Pending]: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  [PaymentStatus.Paid]: { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  [PaymentStatus.Failed]: { label: "Failed", className: "bg-rose-50 text-rose-700 border-rose-200" },
  [PaymentStatus.Refunded]: { label: "Refunded", className: "bg-sky-50 text-sky-700 border-sky-200" },
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatTimestamp(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function displaySlot(date: string, startTime: string): string {
  const parsed = new Date(`${date}T${startTime}:00`);
  if (Number.isNaN(parsed.getTime())) return `${date} ${startTime}`;
  return `${parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ${startTime}`;
}

export default function PaymentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null);
  const [checkoutPaymentId, setCheckoutPaymentId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.Card);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadData() {
    if (!user?.id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        apiGet<BookingRecord[]>(`/api/bookings?customerId=${user.id}`),
        apiGet<Envelope<Paginated<Payment>>>("/api/payments/user/me"),
      ]);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setPayments(paymentsRes.data?.items ?? []);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadData();
    } else if (!authLoading && !user?.id) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  function paymentFor(bookingId: string): Payment | undefined {
    return payments.find((p) => p.bookingId === bookingId);
  }

  function upsertPayment(updated: Payment) {
    setPayments((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [...prev, updated];
    });
  }

  function openCheckout(booking: BookingRecord) {
    const existing = paymentFor(booking._id);
    setCheckoutBookingId(booking._id);
    setCheckoutPaymentId(existing?.id ?? null);
    setMethod(existing?.method ?? PaymentMethod.Card);
    setActionError(null);
    setSuccessMessage(null);
  }

  function closeCheckout() {
    setCheckoutBookingId(null);
    setCheckoutPaymentId(null);
    setActionError(null);
    setSuccessMessage(null);
  }

  async function createPayment(booking: BookingRecord) {
    if (isActing) return;
    setIsActing(true);
    setActionError(null);
    try {
      const res = await apiPost<Envelope<Payment>>("/api/payments", {
        bookingId: booking._id,
        method,
      });
      upsertPayment(res.data);
      setCheckoutPaymentId(res.data.id);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setIsActing(false);
    }
  }

  async function processPayment(outcome: "paid" | "failed") {
    if (!checkoutPaymentId || isActing) return;
    setIsActing(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const res = await apiPost<Envelope<Payment>>(`/api/payments/${checkoutPaymentId}/process`, {
        outcome,
      });
      upsertPayment(res.data);
      if (res.data.status === PaymentStatus.Paid) {
        setSuccessMessage("Payment completed successfully.");
        setBookings((prev) =>
          prev.map((b) =>
            res.data.bookingId === b._id && b.status === "pending" ? { ...b, status: "confirmed" } : b
          )
        );
      }
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setIsActing(false);
    }
  }

  async function refundPayment(payment: Payment) {
    if (isActing) return;
    setIsActing(true);
    setActionError(null);
    try {
      const res = await apiPost<Envelope<Payment>>(`/api/payments/${payment.id}/refund`);
      upsertPayment(res.data);
      setSuccessMessage("Payment refunded.");
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setIsActing(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl animate-pulse space-y-4" aria-busy="true">
          <div className="h-8 w-56 rounded-xl bg-slate-200" />
          <div className="h-4 w-80 rounded-lg bg-slate-200" />
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="h-40 rounded-2xl bg-slate-200" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Info className="mx-auto mb-4 h-10 w-10 text-indigo-500" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-slate-900">Sign in to manage payments</h1>
          <p className="mt-2 text-sm text-slate-500">
            You need an account to view checkout and payment status.
          </p>
          <Link
            href="/login?redirect=/payments"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mock checkout for your bookings — no real card details are ever collected.
          </p>
        </header>

        {loadError && (
          <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" aria-hidden="true" />
            <span>{loadError}</span>
            <button
              type="button"
              onClick={loadData}
              className="ml-auto rounded-lg px-2 py-1 font-semibold text-rose-700 underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {successMessage && !actionError && (
          <div role="status" className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {!loadError && bookings.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Clock className="mx-auto mb-3 h-9 w-9 text-slate-300" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900">No bookings yet</h2>
            <p className="mt-1 text-sm text-slate-500">Book a service to see checkout and payment status here.</p>
            <Link
              href="/search"
              className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Browse services <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map((booking) => {
            const payment = paymentFor(booking._id);
            const payable =
              !payment && (booking.status === "pending" || booking.status === "confirmed");
            const checkoutOpen = checkoutBookingId === booking._id;
            const checkoutPayment = checkoutPaymentId
              ? payments.find((p) => p.id === checkoutPaymentId)
              : undefined;

            return (
              <section
                key={booking._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{booking.bookingId}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {displaySlot(booking.date, booking.startTime)} — {booking.endTime}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      Booking status: <span className="capitalize">{booking.status.replace("_", " ")}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatMoney(booking.price)}
                    </span>
                    {payment && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[payment.status].className}`}
                      >
                        {STATUS_STYLES[payment.status].label}
                      </span>
                    )}
                  </div>
                </div>

                {payment && payment.status === PaymentStatus.Paid && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Payment received
                    </div>
                    <p className="mt-1 text-xs text-emerald-700">
                      {formatMoney(payment.amount, payment.currency)} · paid {formatTimestamp(payment.paidAt)}
                      {payment.transactionReference ? ` · ref ${payment.transactionReference}` : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => refundPayment(payment)}
                      disabled={isActing}
                      className="mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      {isActing ? "Processing..." : "Request refund"}
                    </button>
                  </div>
                )}

                {payment && payment.status === PaymentStatus.Failed && (
                  <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      Payment failed
                    </div>
                    <p className="mt-1 text-xs text-rose-700">
                      {payment.failureReason || "The mock gateway declined this payment."}
                    </p>
                  </div>
                )}

                {payment && payment.status === PaymentStatus.Refunded && (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Payment refunded
                    </div>
                    <p className="mt-1 text-xs text-sky-700">
                      Refunded {formatTimestamp(payment.refundedAt)}
                    </p>
                  </div>
                )}

                {payment && payment.status === PaymentStatus.Pending && !checkoutOpen && (
                  <button
                    type="button"
                    onClick={() => openCheckout(booking)}
                    className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Continue checkout
                  </button>
                )}

                {payable && !checkoutOpen && (
                  <button
                    type="button"
                    onClick={() => openCheckout(booking)}
                    className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                    Pay now
                  </button>
                )}

                {!payment && !payable && booking.status !== "pending" && booking.status !== "confirmed" && (
                  <p className="mt-3 text-xs text-slate-400">Payment not available for this booking.</p>
                )}

                {checkoutOpen && (
                  <div className="mt-4 rounded-xl border border-indigo-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">Mock checkout</p>
                      <button
                        type="button"
                        onClick={closeCheckout}
                        aria-label="Close checkout"
                        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    {actionError && (
                      <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" aria-hidden="true" />
                        <span>{actionError}</span>
                      </div>
                    )}

                    {checkoutPayment && checkoutPayment.status === PaymentStatus.Pending && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500">
                          Payment {checkoutPayment.transactionReference ? `· ref ${checkoutPayment.transactionReference} · ` : ""}awaiting gateway response.
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          Choose how the mock gateway should respond:
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => processPayment("paid")}
                            disabled={isActing}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {isActing ? "Processing..." : "Simulate approval"}
                          </button>
                          <button
                            type="button"
                            onClick={() => processPayment("failed")}
                            disabled={isActing}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-60"
                          >
                            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            {isActing ? "Processing..." : "Simulate decline"}
                          </button>
                        </div>
                      </div>
                    )}

                    {checkoutPayment && checkoutPayment.status === PaymentStatus.Paid && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Payment completed — you can close this panel.
                      </div>
                    )}

                    {checkoutPayment && checkoutPayment.status === PaymentStatus.Failed && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-rose-700">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        Payment declined — this booking&apos;s payment is now failed.
                      </div>
                    )}

                    {!checkoutPayment && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-slate-600">Select a payment method</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {METHODS.map(({ value, label, Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setMethod(value)}
                              aria-pressed={method === value}
                              className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                                method === value
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/30"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <Icon className="h-5 w-5" aria-hidden="true" />
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-slate-500">
                            Amount:{" "}
                            <span className="font-semibold text-slate-800">
                              {formatMoney(booking.price)}
                            </span>{" "}
                            (set by booking)
                          </p>
                          <ShimmerButton
                            type="button"
                            onClick={() => createPayment(booking)}
                            disabled={isActing}
                            className="min-h-[40px] bg-indigo-600 px-4 text-xs text-white hover:bg-indigo-700"
                          >
                            {isActing ? "Creating..." : "Create payment"}
                          </ShimmerButton>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
