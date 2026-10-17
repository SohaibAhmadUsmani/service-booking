"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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

interface Service {
  id: string;
  name?: string;
  description?: string;
  price: number;
  duration?: number;
  isActive?: boolean;
}

interface Provider {
  id: string;
  name: string;
  businessName: string | null;
  rating: number;
  reviewCount: number;
}

interface WorkingDay {
  day: number;
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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayString() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <CustomerHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
    </div>
  );
}

function BookingFlow() {
  const params = useSearchParams();
  const paramService = params.get("serviceId") ?? "";
  const paramProvider = params.get("providerId") ?? "";

  const { user, isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [serviceId, setServiceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [workingDays, setWorkingDays] = useState<WorkingDay[] | null>(null);
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
  const prefilled = useRef(false);

  function messageOf(err: unknown, fallback: string) {
    return err instanceof ApiError ? err.message : fallback;
  }

  async function call<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && (await refreshSession())) return fn();
      throw err;
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet<{ data: Service[] }>("/api/services", { auth: false }),
      apiGet<Provider[]>("/api/bookings/providers", { auth: false }),
    ])
      .then(([s, p]) => {
        if (cancelled) return;
        setServices(s.data.filter((x) => x.isActive !== false));
        setProviders(p);
      })
      .catch((err) => {
        if (!cancelled) setError(messageOf(err, "Could not load services and providers."));
      })
      .finally(() => {
        if (!cancelled) setListsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // If the link already names a service (and provider), skip those steps.
  useEffect(() => {
    if (listsLoading || prefilled.current) return;
    prefilled.current = true;
    const svc = services.find((s) => s.id === paramService);
    if (!svc) return;
    setServiceId(svc.id);
    const prov = providers.find((p) => p.id === paramProvider);
    if (prov) {
      setProviderId(prov.id);
      setStep(3);
    } else {
      setStep(2);
    }
  }, [listsLoading, services, providers, paramService, paramProvider]);

  useEffect(() => {
    if (!providerId) return;
    let cancelled = false;
    setWorkingDays(null);
    apiGet<{ workingDays: WorkingDay[] }>(`/api/availability/${providerId}`, { auth: false })
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

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedProvider = providers.find((p) => p.id === providerId);
  const serviceLabel = selectedService?.name || "Unnamed service";
  const providerLabel = selectedProvider?.businessName || selectedProvider?.name || "";
  const price = selectedService?.price ?? 0;

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

  function pickService(s: Service) {
    setServiceId(s.id);
    setError(null);
    setStep(2);
  }

  function pickProvider(p: Provider) {
    setProviderId(p.id);
    setDate("");
    setSlots([]);
    setChosen("");
    setError(null);
    setStep(3);
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
        setStep(3);
        void loadSlots(date, providerId);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <Shell>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </Shell>
    );
  }

  if (!isAuthenticated) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-gray-900">Book a service</h1>
        <p className="mt-2 text-gray-500">
          Please{" "}
          <Link href="/login" className="text-indigo-600 underline">
            log in
          </Link>{" "}
          to book a service.
        </p>
      </Shell>
    );
  }

  if (created) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-700">
          <CheckCircle2 className="h-10 w-10" />
          <h1 className="text-2xl font-bold">Booking requested</h1>
          <p>
            {formatDate(created.date)} at {created.startTime} - {created.endTime}
          </p>
          <p className="text-sm">Booking ID: {created.bookingId}. The provider will confirm it soon.</p>
          <Link href="/bookings" className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            View my bookings
          </Link>
        </div>
      </Shell>
    );
  }

  const steps = ["Service", "Provider", "Date and time", "Your details", "Confirm"];
  const detailsOk = name.trim().length > 1 && phone.trim().length >= 7;
  const field =
    "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none";
  const ghost =
    "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100";
  const primary =
    "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50";

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-gray-900">Book a service</h1>

      {selectedService && step > 1 && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-gray-900">
          <p className="font-semibold">{serviceLabel}</p>
          {providerLabel && step > 2 && <p className="text-sm text-gray-500">with {providerLabel}</p>}
          <p className="mt-1 font-semibold">Rs {price.toLocaleString()}</p>
        </div>
      )}

      <ol className="mt-6 flex gap-2 text-xs sm:text-sm">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-lg px-2 py-2 text-center ${
              step === i + 1 ? "bg-indigo-600 font-semibold text-white" : "bg-gray-100 text-gray-500"
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
          <p className="text-sm font-medium text-gray-900">Choose a service</p>
          {listsLoading && <Loader2 className="mt-4 h-5 w-5 animate-spin text-gray-400" />}
          {!listsLoading && services.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">No services are available yet.</p>
          )}
          <ul className="mt-3 space-y-2">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => pickService(s)}
                  className="flex w-full items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left text-gray-900 hover:border-indigo-400"
                >
                  <span>
                    <span className="block font-semibold">{s.name || "Unnamed service"}</span>
                    {s.description && <span className="mt-1 block text-sm text-gray-500">{s.description}</span>}
                    {s.duration ? <span className="mt-1 block text-xs text-gray-500">{s.duration} min</span> : null}
                  </span>
                  <span className="whitespace-nowrap font-semibold">Rs {s.price.toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6">
          <p className="text-sm font-medium text-gray-900">Choose a provider</p>
          {listsLoading && <Loader2 className="mt-4 h-5 w-5 animate-spin text-gray-400" />}
          {!listsLoading && providers.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">No providers are taking bookings yet.</p>
          )}
          <ul className="mt-3 space-y-2">
            {providers.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => pickProvider(p)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left text-gray-900 hover:border-indigo-400"
                >
                  <span>
                    <span className="block font-semibold">{p.businessName || p.name}</span>
                    {p.businessName && <span className="block text-sm text-gray-500">{p.name}</span>}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="h-4 w-4" />
                    {p.reviewCount > 0 ? `${p.rating.toFixed(1)} (${p.reviewCount})` : "New"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <button onClick={() => setStep(1)} className={ghost}>
              Change service
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6">
          <label className="text-sm font-medium text-gray-900">Choose a date</label>
          {workingDays && workingDays.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">This provider has not set working days yet.</p>
          )}
          {workingDays && workingDays.length > 0 && (
            <>
              <p className="mt-1 text-xs text-gray-500">
                Works on: {workingDays.map((d) => `${DAY_NAMES[d.day]} ${d.start}-${d.end}`).join(", ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {upcomingWorkingDates(workingDays).map((day) => (
                  <button
                    key={day}
                    onClick={() => onDateChange(day)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      date === day
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
                    }`}
                  >
                    {new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
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
            className={field}
          />
          {slotsLoading && <Loader2 className="mt-4 h-5 w-5 animate-spin text-gray-400" />}
          {date && !slotsLoading && slots.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">No free times on this day. Try another date.</p>
          )}
          {slots.length > 0 && (
            <>
              <p className="mt-4 text-sm font-medium text-gray-900">Choose a time</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => setChosen(s.start)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      chosen === s.start
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
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
                setStep(2);
              }}
              className={ghost}
            >
              Change provider
            </button>
            <button
              onClick={() => {
                setError(null);
                if (!name && user) setName(`${user.firstName} ${user.lastName}`.trim());
                setStep(4);
              }}
              disabled={!date || !chosen}
              className={primary}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              className={field}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={field} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className={ghost}>
              Back
            </button>
            <button onClick={() => setStep(5)} disabled={!detailsOk} className={primary}>
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="mt-6">
          <dl className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900">
            <div className="flex justify-between"><dt className="text-gray-500">Service</dt><dd>{serviceLabel}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Provider</dt><dd>{providerLabel}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Date</dt><dd>{formatDate(date)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Time</dt><dd>{chosen}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd>{name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{phone}</dd></div>
            {notes && <div className="flex justify-between"><dt className="text-gray-500">Notes</dt><dd>{notes}</dd></div>}
            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold"><dt>Total</dt><dd>Rs {price.toLocaleString()}</dd></div>
          </dl>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStep(4)} disabled={submitting} className={ghost}>
              Back
            </button>
            <button onClick={submit} disabled={submitting} className={primary}>
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