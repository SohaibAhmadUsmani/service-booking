"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CustomerHeader from "@/components/customer/CustomerHeader";
import { CalendarClock, Clock, Loader2 } from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError, apiGet, apiPatch } from "../../../lib/api/client";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
type Filter = "upcoming" | "history" | "all";

interface Booking {
  _id: string;
  bookingId: string;
  providerId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: BookingStatus;
}

interface Slot {
  start: string;
  end: string;
}

const STATUS_META: Record<BookingStatus, { label: string; chip: string }> = {
  pending: { label: "Pending", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Completed", chip: "bg-sky-50 text-sky-700 border-sky-200" },
  cancelled: { label: "Cancelled", chip: "bg-rose-50 text-rose-700 border-rose-200" },
  no_show: { label: "No-show", chip: "bg-gray-100 text-gray-600 border-gray-200" },
};

const ACTIVE: BookingStatus[] = ["pending", "confirmed"];

function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function todayString() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function CustomerBookingsPage() {
  const router = useRouter();
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("serviceId")) router.replace(`/book?${q.toString()}`);
  }, [router]);

  const { user, isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");

  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [chosen, setChosen] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

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

  async function load() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setBookings(await call(() => apiGet<Booking[]>(`/api/bookings?customerId=${user.id}`)));
    } catch (err) {
      setError(messageOf(err, "Could not load your bookings."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.id]);

  async function cancelBooking(b: Booking) {
    if (!window.confirm(`Cancel your booking on ${formatDate(b.date)} at ${b.startTime}?`)) return;
    setBusyId(b._id);
    setActionError(null);
    try {
      await call(() => apiPatch(`/api/bookings/${b._id}/cancel`));
      await load();
    } catch (err) {
      setActionError({ id: b._id, message: messageOf(err, "Could not cancel this booking.") });
    } finally {
      setBusyId(null);
    }
  }

  function openReschedule(b: Booking) {
    setReschedulingId(b._id);
    setNewDate("");
    setSlots([]);
    setChosen("");
    setActionError(null);
  }

  async function onDateChange(b: Booking, date: string) {
    setNewDate(date);
    setChosen("");
    setSlots([]);
    setActionError(null);
    if (!date) return;
    setSlotsLoading(true);
    try {
      const data = await call(() =>
        apiGet<{ date: string; slots: Slot[] }>(`/api/availability/${b.providerId}/slots?date=${date}`)
      );
      setSlots(data.slots);
    } catch (err) {
      setActionError({ id: b._id, message: messageOf(err, "Could not load available times.") });
    } finally {
      setSlotsLoading(false);
    }
  }

  async function confirmReschedule(b: Booking) {
    if (!newDate || !chosen) return;
    setBusyId(b._id);
    setActionError(null);
    try {
      await call(() => apiPatch(`/api/bookings/${b._id}/reschedule`, { date: newDate, startTime: chosen }));
      setReschedulingId(null);
      await load();
    } catch (err) {
      setActionError({ id: b._id, message: messageOf(err, "Could not reschedule this booking.") });
    } finally {
      setBusyId(null);
    }
  }

  const upcoming = bookings
    .filter((b) => ACTIVE.includes(b.status))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const history = bookings.filter((b) => !ACTIVE.includes(b.status));
  const shown = filter === "upcoming" ? upcoming : filter === "history" ? history : bookings;

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: upcoming.length },
    { id: "history", label: "History", count: history.length },
    { id: "all", label: "All", count: bookings.length },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900"><CustomerHeader /><main className="mx-auto max-w-3xl px-4 py-10">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </main></div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900"><CustomerHeader /><main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">My bookings</h1>
        <p className="mt-2 text-gray-500">
          Please{" "}
          <Link href="/login" className="text-indigo-600 underline">
            log in
          </Link>{" "}
          to see your bookings.
        </p>
      </main></div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900"><CustomerHeader /><main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">My bookings</h1>
      <p className="mt-1 text-sm text-gray-500">Your appointments and booking history.</p>

      <div className="mt-6 flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              filter === t.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : shown.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-gray-500">
          <CalendarClock className="h-8 w-8" />
          <p>{filter === "upcoming" ? "No upcoming bookings." : "Nothing to show here yet."}</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((b) => {
            const active = ACTIVE.includes(b.status);
            const busy = busyId === b._id;
            const open = reschedulingId === b._id;
            return (
              <li
                key={b._id}
                className="rounded-xl border border-gray-200 bg-white p-4 text-gray-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{formatDate(b.date)}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {b.startTime} - {b.endTime}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{b.bookingId}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_META[b.status].chip}`}
                    >
                      {STATUS_META[b.status].label}
                    </span>
                    <p className="mt-2 font-semibold">Rs {b.price.toLocaleString()}</p>
                  </div>
                </div>

                {active && (
                  <div className="mt-4 flex gap-2 border-t border-gray-200 pt-3">
                    <button
                      onClick={() => (open ? setReschedulingId(null) : openReschedule(b))}
                      disabled={busy}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {open ? "Close" : "Reschedule"}
                    </button>
                    <button
                      onClick={() => cancelBooking(b)}
                      disabled={busy}
                      className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {busy && !open ? "Cancelling..." : "Cancel booking"}
                    </button>
                  </div>
                )}

                {!active && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3">
                    <Link
                      href="/complaints"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600"
                    >
                      Report an issue
                    </Link>
                    {b.status === "completed" && (
                      <Link
                        href="/providers"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        Rate & review
                      </Link>
                    )}
                  </div>
                )}

                {open && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <label className="text-sm font-medium text-gray-900">Pick a new date</label>
                    <input
                      type="date"
                      min={todayString()}
                      value={newDate}
                      onChange={(e) => onDateChange(b, e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                    {slotsLoading && <Loader2 className="mt-3 h-5 w-5 animate-spin text-gray-400" />}
                    {newDate && !slotsLoading && slots.length === 0 && (
                      <p className="mt-3 text-sm text-gray-500">No free times on this day. Try another date.</p>
                    )}
                    {slots.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
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
                    )}
                    <button
                      onClick={() => confirmReschedule(b)}
                      disabled={!newDate || !chosen || busy}
                      className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {busy ? "Saving..." : "Confirm new time"}
                    </button>
                  </div>
                )}

                {actionError?.id === b._id && (
                  <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
                    {actionError.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main></div>
  );
}