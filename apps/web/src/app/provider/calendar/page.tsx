"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiStatus, statusLabel, useAuthedApi } from "../../../lib/api/useAuthedApi";

type CalendarBooking = {
  bookingId: string;
  startTime: string;
  endTime: string;
  status: ApiStatus;
};

type CalendarDay = {
  date: string;
  working: { start: string; end: string; breaks?: { start: string; end: string }[] } | null;
  bookings: CalendarBooking[];
};

type CalendarData = { days?: CalendarDay[] };

const chip: Record<ApiStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-600 line-through",
  no_show: "bg-red-100 text-red-700",
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function todayString() {
  const n = new Date();
  return ymd(n.getFullYear(), n.getMonth(), n.getDate());
}

export default function CalendarPage() {
  const request = useAuthedApi();
  const { user } = useAuth();
  const info = (user ?? {}) as Record<string, unknown>;
  const providerId = String(info.id ?? info._id ?? "");

  const today = todayString();
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(today);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!providerId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
      const from = ymd(cursor.year, cursor.month, 1);
      const to = ymd(cursor.year, cursor.month, daysInMonth);
      try {
        const json = await request<Record<string, unknown>>(
          `/api/bookings/calendar?from=${from}&to=${to}&providerId=${encodeURIComponent(providerId)}${
            showCancelled ? "&includeCancelled=true" : ""
          }`
        );
        const data = ((json.data as CalendarData | undefined) ?? (json as CalendarData)) as CalendarData;
        if (!cancelled) setDays(data.days ?? []);
      } catch (e) {
        if (!cancelled) {
          setDays([]);
          setError(e instanceof Error ? e.message : "Could not load the calendar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [providerId, request, cursor, showCancelled, reloadKey]);

  const byDate = useMemo(() => {
    const map: Record<string, CalendarDay> = {};
    days.forEach((d) => {
      map[d.date] = d;
    });
    return map;
  }, [days]);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const list: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [cursor]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  function move(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelected(null);
  }

  function goToday() {
    const n = new Date();
    setCursor({ year: n.getFullYear(), month: n.getMonth() });
    setSelected(todayString());
  }

  const selectedDay = selected ? byDate[selected] : undefined;
  const sortedBookings = selectedDay
    ? [...selectedDay.bookings].sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  if (!providerId) {
    return <div className="text-sm text-gray-500">Loading your account...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
            />
            Show cancelled
          </label>
          <button onClick={() => move(-1)} className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50">
            Prev
          </button>
          <button onClick={goToday} className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50">
            Today
          </button>
          <button onClick={() => move(1)} className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50">
            Next
          </button>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-x-auto rounded-xl border bg-white lg:col-span-2">
          <div className="min-w-[640px]">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="font-medium">{monthLabel}</h2>
              {loading && <span className="text-xs text-gray-500">Loading...</span>}
            </div>

            <div className="grid grid-cols-7 border-b text-center text-xs text-gray-500">
              {weekdays.map((w) => (
                <div key={w} className="py-2">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                if (d === null) {
                  return <div key={i} className="h-28 border-b border-r bg-gray-50" />;
                }
                const k = ymd(cursor.year, cursor.month, d);
                const day = byDate[k];
                const list = day?.bookings ?? [];
                const isOff = !!day && day.working === null;
                const isToday = k === today;
                const isSelected = k === selected;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(k)}
                    className={`h-28 border-b border-r p-1 text-left align-top hover:bg-indigo-50 ${
                      isOff ? "bg-gray-50" : ""
                    } ${isSelected ? "bg-indigo-50 ring-2 ring-inset ring-indigo-400" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isToday ? "bg-indigo-600 font-semibold text-white" : "text-gray-700"
                        }`}
                      >
                        {d}
                      </span>
                      {isOff && <span className="pr-1 text-[10px] text-gray-400">Off</span>}
                    </div>
                    <div className="mt-1 space-y-1">
                      {list.slice(0, 2).map((b) => (
                        <div key={b.bookingId} className={`truncate rounded px-1 text-[11px] ${chip[b.status]}`}>
                          {b.startTime} {b.bookingId}
                        </div>
                      ))}
                      {list.length > 2 && (
                        <div className="text-[11px] text-gray-500">+{list.length - 2} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white">
          <h2 className="border-b px-5 py-3 font-medium">{selected ? `Bookings on ${selected}` : "Select a day"}</h2>
          <div className="space-y-3 p-5">
            {!selected && <p className="text-sm text-gray-500">Click a day to see its bookings.</p>}

            {selected && selectedDay && (
              <p className="text-sm text-gray-600">
                {selectedDay.working
                  ? `Working ${selectedDay.working.start} to ${selectedDay.working.end}${
                      selectedDay.working.breaks && selectedDay.working.breaks.length > 0
                        ? ` (break ${selectedDay.working.breaks.map((b) => `${b.start}-${b.end}`).join(", ")})`
                        : ""
                    }`
                  : "Day off"}
              </p>
            )}

            {selected && sortedBookings.length === 0 && (
              <p className="text-sm text-gray-500">No bookings on this day.</p>
            )}

            {sortedBookings.map((b) => (
              <div key={b.bookingId} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {b.startTime} - {b.endTime}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${chip[b.status]}`}>
                    {statusLabel[b.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{b.bookingId}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}