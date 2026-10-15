"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import CatalogNav from "../../components/catalog/CatalogNav";
import styles from "../../components/catalog/catalog.module.css";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError, apiGet, apiPost } from "../../../lib/api/client";

interface Slot {
  start: string;
  end: string;
}

interface CreatedBooking {
  _id: string;
  bookingId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function todayString() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function BookingFlow() {
  const params = useSearchParams();
  const providerId = params.get("providerId") ?? "";
  const serviceId = params.get("serviceId") ?? "";
  const priceText = params.get("price") ?? "";
  const price = Number(priceText);
  const serviceName = params.get("serviceName") || "Selected service";
  const providerName = params.get("providerName") || "";

  const { user, isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [chosen, setChosen] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedBooking | null>(null);

  async function call<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && (await refreshSession())) return fn();
      throw err;
    }
  }

  function messageOf(err: unknown, fallback: string) {
    return err instanceof ApiError ? err.message : fallback;
  }

  async function loadSlots(day: string) {
    setSlots([]);
    setChosen("");
    if (!day) return;
    setSlotsLoading(true);
    try {
      const data = await apiGet<{ date: string; slots: Slot[] }>(`/api/availability/${providerId}/slots?date=${day}`, {
        auth: false,
      });
      setSlots(data.slots);
    } catch (err) {
      setError(messageOf(err, "Could not load available times."));
    } finally {
      setSlotsLoading(false);
    }
  }

  function onDateChange(day: string) {
    setDate(day);
    setError(null);
    void loadSlots(day);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const booking = await call(() =>
        apiPost<CreatedBooking>("/api/bookings", {
          providerId,
          serviceId,
          date,
          startTime: chosen,
          price,
          details: { name: name.trim(), phone: phone.trim(), notes: notes.trim() || undefined },
        })
      );
      setCreated(booking);
    } catch (err) {
      setError(messageOf(err, "Could not create the booking."));
      if (err instanceof ApiError && err.status === 409) {
        setStep(1);
        void loadSlots(date);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const validLink = OBJECT_ID.test(providerId) && OBJECT_ID.test(serviceId) && priceText !== "" && price >= 0;

  if (authLoading) {
    return (
      <div className={styles.root}><CatalogNav /><main className={styles.container}>
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </main></div>
    );
  }

  if (!validLink) {
    return (
      <div className={styles.root}><CatalogNav /><main className={styles.container}>
        <h1 className={styles.pageTitle}>Book a service</h1>
        <p className="mt-2 text-slate-500">
          Choose a service first.{" "}
          <Link href="/search" className="text-indigo-600 underline">
            Browse services
          </Link>
        </p>
      </main></div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.root}><CatalogNav /><main className={styles.container}>
        <h1 className={styles.pageTitle}>Book a service</h1>
        <p className="mt-2 text-slate-500">
          Please{" "}
          <Link href="/login" className="text-indigo-600 underline">
            log in
          </Link>{" "}
          to book {serviceName}.
        </p>
      </main></div>
    );
  }

  if (created) {
    return (
      <div className={styles.root}><CatalogNav /><main className={styles.container}>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-900">
          <CheckCircle2 className="h-10 w-10" />
          <h1 className={styles.pageTitle}>Booking requested</h1>
          <p>
            {formatDate(created.date)} at {created.startTime} - {created.endTime}
          </p>
          <p className="text-sm">Booking ID: {created.bookingId}. The provider will confirm it soon.</p>
          <Link href="/bookings" className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            View my bookings
          </Link>
        </div>
      </main></div>
    );
  }

  const steps = ["Date and time", "Your details", "Confirm"];
  const detailsOk = name.trim().length > 1 && phone.trim().length >= 7;

  return (
    <div className={styles.root}><CatalogNav /><main className={styles.container}>
      <h1 className={styles.pageTitle}>Book a service</h1>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-semibold">{serviceName}</p>
        {providerName && <p className="text-sm text-slate-500">with {providerName}</p>}
        <p className="mt-1 font-semibold">Rs {price.toLocaleString()}</p>
      </div>

      <ol className="mt-6 flex gap-2 text-sm">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-lg px-3 py-2 text-center ${
              step === i + 1 ? "bg-indigo-600 font-semibold text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {step === 1 && (
        <section className="mt-6">
          <label className="text-sm font-medium">Choose a date</label>
          <input
            type="date"
            min={todayString()}
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          {slotsLoading && <Loader2 className="mt-4 h-5 w-5 animate-spin text-slate-400" />}
          {date && !slotsLoading && slots.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">No free times on this day. Try another date.</p>
          )}
          {slots.length > 0 && (
            <>
              <p className="mt-4 text-sm font-medium">Choose a time</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => setChosen(s.start)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      chosen === s.start
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {s.start}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => {
              setError(null);
              if (!name && user) setName(`${user.firstName} ${user.lastName}`.trim());
              setStep(2);
            }}
            disabled={!date || !chosen}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!detailsOk}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6">
          <dl className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900">
            <div className="flex justify-between"><dt className="text-slate-500">Service</dt><dd>{serviceName}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Date</dt><dd>{formatDate(date)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Time</dt><dd>{chosen}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd>{name}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{phone}</dd></div>
            {notes && <div className="flex justify-between"><dt className="text-slate-500">Notes</dt><dd>{notes}</dd></div>}
            <div className="flex justify-between border-t pt-2 font-semibold"><dt>Total</dt><dd>Rs {price.toLocaleString()}</dd></div>
          </dl>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setStep(2)}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Booking..." : "Confirm booking"}
            </button>
          </div>
        </section>
      )}
    </main></div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookingFlow />
    </Suspense>
  );
}