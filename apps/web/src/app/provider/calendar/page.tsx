"use client";

import { useMemo, useState } from "react";

type Status = "Pending" | "Confirmed" | "Completed" | "Cancelled" | "No-show";

type Booking = {
  id: string;
  customer: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: Status;
};

// TODO: replace with Shanza's bookings API (filtered by provider and month)
const bookings: Booking[] = [
  { id: "BK-1001", customer: "Ali Khan", service: "Home Cleaning", date: "2026-10-08", time: "10:00", status: "Confirmed" },
  { id: "BK-1002", customer: "Sara Ahmed", service: "AC Repair", date: "2026-10-08", time: "14:00", status: "Pending" },
  { id: "BK-1003", customer: "Usman Raza", service: "Pipe Leak Fix", date: "2026-10-09", time: "11:30", status: "Completed" },
  { id: "BK-1004", customer: "Hina Malik", service: "Home Cleaning", date: "2026-10-10", time: "09:00", status: "Pending" },
  { id: "BK-1005", customer: "Bilal Shah", service: "AC Repair", date: "2026-10-06", time: "16:00", status: "No-show" },
  { id: "BK-1006", customer: "Ayesha Noor", service: "Pipe Leak Fix", date: "2026-10-05", time: "12:00", status: "Cancelled" },
  { id: "BK-1007", customer: "Ali Khan", service: "AC Repair", date: "2026-10-14", time: "10:30", status: "Confirmed" },
  { id: "BK-1008", customer: "Sara Ahmed", service: "Home Cleaning", date: "2026-10-14", time: "15:00", status: "Confirmed" },
  { id: "BK-1009", customer: "Usman Raza", service: "Home Cleaning", date: "2026-10-21", time: "09:30", status: "Pending" },
];

const MOCK_TODAY = "2026-10-09"; // replace with the real current date once real data is connected

const chip: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-200 text-gray-600 line-through",
  "No-show": "bg-red-100 text-red-700",
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function key(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState({ year: 2026, month: 9 }); // October 2026 (mock data month)
  const [selected, setSelected] = useState<string | null>(MOCK_TODAY);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      (map[b.date] ??= []).push(b);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, []);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const list: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [cursor]);

  function move(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelected(null);
  }

  function goToday() {
    setCursor({ year: 2026, month: 9 });
    setSelected(MOCK_TODAY);
  }

  const dayBookings = selected ? byDate[selected] ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => move(-1)} className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50">
            Prev
          </button>
          <button onClick={goToday} className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50">
            Today
          </button>
          <button onClick={() => move(1)} className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-x-auto rounded-xl border bg-white lg:col-span-2">
          <div className="min-w-[640px]">
            <h2 className="border-b px-5 py-3 font-medium">{monthLabel}</h2>

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
                const k = key(cursor.year, cursor.month, d);
                const list = byDate[k] ?? [];
                const isToday = k === MOCK_TODAY;
                const isSelected = k === selected;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(k)}
                    className={`h-28 border-b border-r p-1 text-left align-top hover:bg-indigo-50 ${
                      isSelected ? "bg-indigo-50 ring-2 ring-inset ring-indigo-400" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday ? "bg-indigo-600 font-semibold text-white" : "text-gray-700"
                      }`}
                    >
                      {d}
                    </span>
                    <div className="mt-1 space-y-1">
                      {list.slice(0, 2).map((b) => (
                        <div key={b.id} className={`truncate rounded px-1 text-[11px] ${chip[b.status]}`}>
                          {b.time} {b.customer}
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
          <h2 className="border-b px-5 py-3 font-medium">
            {selected ? `Bookings on ${selected}` : "Select a day"}
          </h2>
          <div className="space-y-3 p-5">
            {selected && dayBookings.length === 0 && (
              <p className="text-sm text-gray-500">No bookings on this day.</p>
            )}
            {!selected && (
              <p className="text-sm text-gray-500">Click a day to see its bookings.</p>
            )}
            {dayBookings.map((b) => (
              <div key={b.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{b.time}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${chip[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                <p className="mt-1">{b.customer}</p>
                <p className="text-xs text-gray-500">
                  {b.service} · {b.id}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}