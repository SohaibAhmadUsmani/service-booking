"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Clock, Loader2 } from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError, apiGet } from "../../../lib/api/client";

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
  details?: { name?: string; phone?: string; notes?: string };
}

const STATUS_META: Record<BookingStatus, { label: string; chip: string }> = {
  pending: { label: "Pending", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Completed", chip: "bg-sky-50 text-sky-700 border-sky-200" },
  cancelled: { label: "Cancelled", chip: "bg-rose-50 text-rose-700 border-rose-200" },
  no_show: { label: "No-show", chip: "bg-slate-100 text-slate-600 border-slate-200" },
};

const ACTIVE: BookingStatus[] = ["pending", "confirmed"];

function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function CustomerBookingsPage() {
  const { user, isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");

  async function load() {
    if (!user) return;
    const path = `/api/bookings?customerId=${user.id}`;
    setLoading(true);
    setError(null);
    try {
      let data: Booking[];
      try {
        data = await apiGet<Booking[]>(path);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && (await refreshSession())) {
          data = await apiGet<Booking[]>(path);
        } else {
          throw err;
        }
      }
      setBookings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.id]);

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
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">My bookings</h1>
        <p className="mt-2 text-slate-500">
          Please{" "}
          <Link href="/login" className="text-indigo-600 underline">
            log in
          </Link>{" "}
          to see your bookings.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">My bookings</h1>
      <p className="mt-1 text-sm text-slate-500">Your appointments and booking history.</p>

      <div className="mt-6 flex gap-2 border-b border-slate-200 dark:border-neutral-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              filter === t.id
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : shown.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-slate-500">
          <CalendarClock className="h-8 w-8" />
          <p>{filter === "upcoming" ? "No upcoming bookings." : "Nothing to show here yet."}</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((b) => (
            <li
              key={b._id}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div>
                <p className="font-semibold">{formatDate(b.date)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  {b.startTime} - {b.endTime}
                </p>
                <p className="mt-1 text-xs text-slate-400">{b.bookingId}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_META[b.status].chip}`}
                >
                  {STATUS_META[b.status].label}
                </span>
                <p className="mt-2 font-semibold">Rs {b.price.toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}