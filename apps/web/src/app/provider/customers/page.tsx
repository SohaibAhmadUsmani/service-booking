"use client";

import { useMemo, useState } from "react";

type Status = "Pending" | "Confirmed" | "Completed" | "Cancelled" | "No-show";

type Booking = {
  id: string;
  customerId: string;
  service: string;
  date: string; // YYYY-MM-DD
  price: number;
  status: Status;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

const customers: Customer[] = [
  { id: "c1", name: "Ali Khan", email: "ali.khan@example.com", phone: "+92 300 1111111" },
  { id: "c2", name: "Sara Ahmed", email: "sara.ahmed@example.com", phone: "+92 301 2222222" },
  { id: "c3", name: "Usman Raza", email: "usman.raza@example.com", phone: "+92 302 3333333" },
  { id: "c4", name: "Hina Malik", email: "hina.malik@example.com", phone: "+92 303 4444444" },
  { id: "c5", name: "Bilal Shah", email: "bilal.shah@example.com", phone: "+92 304 5555555" },
];

// TODO: replace with Shanza's bookings API (filtered by provider)
const bookings: Booking[] = [
  { id: "BK-1001", customerId: "c1", service: "Home Cleaning", date: "2026-10-08", price: 60, status: "Confirmed" },
  { id: "BK-0990", customerId: "c1", service: "AC Repair", date: "2026-09-21", price: 45, status: "Completed" },
  { id: "BK-0975", customerId: "c1", service: "Home Cleaning", date: "2026-09-02", price: 60, status: "Completed" },
  { id: "BK-1002", customerId: "c2", service: "AC Repair", date: "2026-10-08", price: 45, status: "Pending" },
  { id: "BK-0981", customerId: "c2", service: "Pipe Leak Fix", date: "2026-09-15", price: 35, status: "Completed" },
  { id: "BK-1003", customerId: "c3", service: "Pipe Leak Fix", date: "2026-10-09", price: 35, status: "Completed" },
  { id: "BK-1004", customerId: "c4", service: "Home Cleaning", date: "2026-10-10", price: 60, status: "Pending" },
  { id: "BK-1005", customerId: "c5", service: "AC Repair", date: "2026-10-06", price: 45, status: "No-show" },
  { id: "BK-0960", customerId: "c5", service: "Home Cleaning", date: "2026-08-18", price: 60, status: "Completed" },
];

const badge: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-200 text-gray-700",
  "No-show": "bg-red-100 text-red-700",
};

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .map((c) => {
        const history = bookings
          .filter((b) => b.customerId === c.id)
          .sort((a, b) => b.date.localeCompare(a.date));
        const totalSpent = history
          .filter((b) => b.status === "Completed")
          .reduce((sum, b) => sum + b.price, 0);
        return {
          ...c,
          history,
          totalBookings: history.length,
          totalSpent,
          lastBooking: history[0]?.date ?? "—",
        };
      })
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
  }, [query]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone"
          className="w-64 rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Bookings</th>
              <th className="px-5 py-3">Total spent</th>
              <th className="px-5 py-3">Last booking</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3">
                  <div>{c.email}</div>
                  <div className="text-xs text-gray-500">{c.phone}</div>
                </td>
                <td className="px-5 py-3">{c.totalBookings}</td>
                <td className="px-5 py-3">${c.totalSpent}</td>
                <td className="px-5 py-3">{c.lastBooking}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                    className="text-indigo-600 hover:underline"
                  >
                    {selectedId === c.id ? "Hide history" : "View history"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="rounded-xl border bg-white">
          <h2 className="border-b px-5 py-3 font-medium">
            Booking history: {selected.name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="px-5 py-3">Booking ID</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {selected.history.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-5 py-3 font-medium">{b.id}</td>
                    <td className="px-5 py-3">{b.service}</td>
                    <td className="px-5 py-3">{b.date}</td>
                    <td className="px-5 py-3">${b.price}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}