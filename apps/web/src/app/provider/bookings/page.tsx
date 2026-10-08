"use client";

import { useMemo, useState } from "react";

type Status = "Pending" | "Confirmed" | "Completed" | "Cancelled" | "No-show";

type Booking = {
  id: string;
  customer: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  price: number;
  status: Status;
};

const initialBookings: Booking[] = [
  { id: "BK-1001", customer: "Ali Khan", service: "Home Cleaning", date: "2026-10-08", time: "10:00", price: 60, status: "Confirmed" },
  { id: "BK-1002", customer: "Sara Ahmed", service: "AC Repair", date: "2026-10-08", time: "14:00", price: 45, status: "Pending" },
  { id: "BK-1003", customer: "Usman Raza", service: "Pipe Leak Fix", date: "2026-10-09", time: "11:30", price: 35, status: "Completed" },
  { id: "BK-1004", customer: "Hina Malik", service: "Home Cleaning", date: "2026-10-10", time: "09:00", price: 60, status: "Pending" },
  { id: "BK-1005", customer: "Bilal Shah", service: "AC Repair", date: "2026-10-06", time: "16:00", price: 45, status: "No-show" },
  { id: "BK-1006", customer: "Ayesha Noor", service: "Pipe Leak Fix", date: "2026-10-05", time: "12:00", price: 35, status: "Cancelled" },
];

const filters: ("All" | Status)[] = ["All", "Pending", "Confirmed", "Completed", "Cancelled", "No-show"];

const badge: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-200 text-gray-700",
  "No-show": "bg-red-100 text-red-700",
};

// Which actions are allowed from each status
const actions: Record<Status, { label: string; to: Status; danger?: boolean }[]> = {
  Pending: [
    { label: "Confirm", to: "Confirmed" },
    { label: "Cancel", to: "Cancelled", danger: true },
  ],
  Confirmed: [
    { label: "Complete", to: "Completed" },
    { label: "No-show", to: "No-show", danger: true },
    { label: "Cancel", to: "Cancelled", danger: true },
  ],
  Completed: [],
  Cancelled: [],
  "No-show": [],
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => filter === "All" || b.status === filter)
      .filter(
        (b) =>
          !q ||
          b.id.toLowerCase().includes(q) ||
          b.customer.toLowerCase().includes(q) ||
          b.service.toLowerCase().includes(q)
      )
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [bookings, filter, query]);

  function counts(s: "All" | Status) {
    return s === "All" ? bookings.length : bookings.filter((b) => b.status === s).length;
  }

  function changeStatus(b: Booking, to: Status) {
    if (to === "Cancelled" || to === "No-show") {
      if (!window.confirm(`Mark ${b.id} (${b.customer}) as ${to}?`)) return;
    }
    // TODO: call Shanza's bookings API to update status
    setBookings((list) => list.map((x) => (x.id === b.id ? { ...x, status: to } : x)));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bookings</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-sm ${
                filter === f
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f} ({counts(f)})
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ID, customer, service"
          className="w-64 rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="px-5 py-3">Booking ID</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-5 py-3 font-medium">{b.id}</td>
                <td className="px-5 py-3">{b.customer}</td>
                <td className="px-5 py-3">{b.service}</td>
                <td className="px-5 py-3">{b.date}</td>
                <td className="px-5 py-3">{b.time}</td>
                <td className="px-5 py-3">${b.price}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge[b.status]}`}>
                    {b.status}
                  </span>
                </td>
                <td className="space-x-3 px-5 py-3">
                  {actions[b.status].length === 0 && <span className="text-gray-400">—</span>}
                  {actions[b.status].map((a) => (
                    <button
                      key={a.label}
                      onClick={() => changeStatus(b, a.to)}
                      className={a.danger ? "text-red-600 hover:underline" : "text-indigo-600 hover:underline"}
                    >
                      {a.label}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                  No bookings match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}