"use client";

import { Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import CustomerHeader from "@/components/customer/CustomerHeader";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError, apiGet, apiPost } from "../../../lib/api/client";

interface Slot {
  start: string;
  end: string;
}

interface Provider {
  id: string;
  name: string;
  businessName: string | null;
  rating: number;
  reviewCount: number;
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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The next few dates (as YYYY-MM-DD) on which the provider works. */
function upcomingWorkingDates(days: { day: number }[], count = 6) {
  const worked = new Set(days.map((d) => d.day));
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < 60 && out.length < count; i++) {
    const x = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (worked.has(x.getDay())) {
      out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`);
    }
  }
  return out;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <CustomerHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
    </div>
  );
}

function BookingFlow() {
  const params = useSearchParams();
  const initialProvider = params.get("providerId") ?? "";
  const serviceId = params.get("serviceId") ?? "";
  const priceText = params.get("price") ?? "";
  const price = Number(priceText);
  const serviceName = params.get("serviceName") || "Selected service";

  const { user, isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();

  const hasProvider = OBJECT_ID.test(initialProvider);
  const [providerId, setProviderId] = useState(hasProvider ? initialProvider : "");
  const [providerName, setProviderName] = useState(params.get("providerName") || "");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(hasProvider ? 2 : 1);
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
  const [workingDays, setWorkingDays] = useState<{ day: number; start: string; end: string }[] | null>(null);

  useEffect(() => {
    if (step !== 1) return;
    let cancelled = false;
    setProvidersLoading(true);
    apiGet<Provider[]>("/api/bookings/providers", { auth: false })
      .then((list) => {
        if (!cancelled) setProviders(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load providers.");
      })
      .finally(() => {
        if (!cancelled) setProvidersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step]);

  useEffect(() => {
    if (!providerId) return;
    let cancelled = false;
    setWorkingDays(null);
    apiGet<{ workingDays: { day: number; start: string; end: string }[] }>(`/api/availability/${providerId}`, {
      auth: false,
    })
      .then((a) => {
        if (!cancelled) setWorkingDays(a.workingDays);
      })
      .catch(() => {
        if (!cancelled) setWorkingDays([]);
      });
    return () => {
      cancelled = true;
    };
  }, [providerId]);

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

  async function loadSlots(day: string, forProvider: string) {
    setSlots([]);
    setChosen("");
    if (!day || !forProvider) return;
    setSlotsLoading(true);
    try {
      const data = await apiGet<{ date: string; slots: Slot[] }>(
        `/api/availability/${forProvider}/slots?date=${day}`,
        { auth: false }
      );
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
    void loadSlots(day, providerId);
  }

  function pickProvider(p: Provider) {
    setProviderId(p.id);
    setProviderName(p.businessName || p.name);
    setDate("");
    setSlots([]);
    setChosen("");
    setError(null);
    setStep(2);
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
        setStep(2);
        void loadSlots(date, providerId);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const validService = OBJECT_ID.test(serviceId) && priceText !== "" && price >= 0;

  if (authLoading) {
    return (
      <Shell>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Shell>
    );
  }

  if (!validService) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Book a service</h1>
        <p className="mt-2 text-muted-foreground">
          Choose a service first.{" "}
          <Link href="/search" className="text-indigo-600 underline">
            Browse services
          </Link>
        </p>
      </Shell>
    );
  }

  if (!isAuthenticated) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Book a service</h1>
        <p className="mt-2 text-muted-foreground">
          Please{" "}
          <Link href="/login" className="text-indigo-600 underline">
            log in
          </Link>{" "}
          to book {serviceName}.
        </p>
      </Shell>
    );
  }

  if (created) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center text-emerald-500">
          <CheckCircle2 className="h-10 w-10" />
          <h1 className="text-2xl font-bold">Booking requested</h1>
          <p>
            {formatDate(created.date)} at {created.startTime} - {created.endTime}
          </p>
          <p className="text-sm">Booking ID: {created.bookingId}. The provider will confirm it soon.</p>
          <Link href="/bookings" className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            View my bookings
          </Link>
        </div>
      </Shell>
    );
  }

  const steps = ["Provider", "Date and time", "Your details", "Confirm"];
  const detailsOk = name.trim().length > 1 && phone.trim().length >= 7;

  return (
    <Shell>
      <h1 className="text-2xl font-bold">Book a service</h1>

      <div className="mt-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
        <p className="font-semibold">{serviceName}</p>
        {providerName && step > 1 && <p className="text-sm text-muted-foreground">with {providerName}</p>}
        <p className="mt-1 font-semibold">Rs {price.toLocaleString()}</p>
      </div>

      <ol className="mt-6 flex gap-2 text-sm">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-lg px-3 py-2 text-center ${
              step === i + 1 ? "bg-indigo-600 font-semibold text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-500">{error}</div>
      )}

      {step === 1 && (
        <section className="mt-6">
          <p className="text-sm font-medium">Choose a provider</p>
          {providersLoading && <Loader2 className="mt-4 h-5 w-5 animate-spin text-muted-foreground" />}
          {!providersLoading && providers.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">No providers are taking bookings yet.</p>
          )}
          <ul className="mt-3 space-y-2">
            {providers.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => pickProvider(p)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left text-card-foreground hover:border-indigo-400"
                >
                  <span>
                    <span className="block font-semibold">{p.businessName || p.name}</span>
                    {p.businessName && <span className="block text-sm text-muted-foreground">{p.name}</span>}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    {p.reviewCount > 0 ? `${p.rating.toFixed(1)} (${p.reviewCount})` : "New"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6">
          <label className="text-sm font-medium">Choose a date</label>
          {workingDays && workingDays.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">This provider has not set working days yet.</p>
          )}
          {workingDays && workingDays.length > 0 && (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Works on: {workingDays.map((d) => `${DAY_NAMES[d.day]} ${d.start}-${d.end}`).join(", ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {upcomingWorkingDates(workingDays).map((day) => (
                  <button
                    key={day}
                    onClick={() => onDateChange(day)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      date === day ? "border-indigo-500 bg-indigo-500 text-white" : "border-input hover:border-indigo-400"
                    }`}
                  >
                    {new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </button>
                ))}
              </div>
            </>
          )}
          <input
            type="date"
            min={todayString()}
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-card-foreground"
          />
          {slotsLoading && <Loader2 className="mt-4 h-5 w-5 animate-spin text-muted-foreground" />}
          {date && !slotsLoading && slots.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">No free times on this day. Try another date.</p>
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
                        : "border-input hover:border-indigo-400"
                    }`}
                  >
                    {s.start}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Change provider
            </button>
            <button
              onClick={() => {
                setError(null);
                if (!name && user) setName(`${user.firstName} ${user.lastName}`.trim());
                setStep(3);
              }}
              disabled={!date || !chosen}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-card-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-card-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-card-foreground"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!detailsOk}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="mt-6">
          <dl className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm text-card-foreground">
            <div className="flex justify-between"><dt className="text-muted-foreground">Service</dt><dd>{serviceName}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Provider</dt><dd>{providerName}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Date</dt><dd>{formatDate(date)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Time</dt><dd>{chosen}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd>{name}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd>{phone}</dd></div>
            {notes && <div className="flex justify-between"><dt className="text-muted-foreground">Notes</dt><dd>{notes}</dd></div>}
            <div className="flex justify-between border-t pt-2 font-semibold"><dt>Total</dt><dd>Rs {price.toLocaleString()}</dd></div>
          </dl>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setStep(3)}
              disabled={submitting}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
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
    </Shell>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookingFlow />
    </Suspense>
  );
}