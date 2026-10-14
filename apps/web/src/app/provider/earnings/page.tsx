"use client";

import { useMemo, useState } from "react";

type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

type Payment = {
  id: string;
  bookingId: string;
  customer: string;
  service: string;
  date: string; // YYYY-MM-DD
  amount: number;
  status: PaymentStatus;
};

// TODO: replace with Namra's payments API (filtered by provider)
const payments: Payment[] = [
  { id: "P-001", bookingId: "BK-0960", customer: "Bilal Shah", service: "Home Cleaning", date: "2026-08-18", amount: 60, status: "Paid" },
  { id: "P-002", bookingId: "BK-0975", customer: "Ali Khan", service: "Home Cleaning", date: "2026-09-02", amount: 60, status: "Paid" },
  { id: "P-003", bookingId: "BK-0981", customer: "Sara Ahmed", service: "Pipe Leak Fix", date: "2026-09-15", amount: 35, status: "Paid" },
  { id: "P-004", bookingId: "BK-0990", customer: "Ali Khan", service: "AC Repair", date: "2026-09-21", amount: 45, status: "Paid" },
  { id: "P-005", bookingId: "BK-1003", customer: "Usman Raza", service: "Pipe Leak Fix", date: "2026-10-09", amount: 35, status: "Paid" },
  { id: "P-006", bookingId: "BK-1001", customer: "Ali Khan", service: "Home Cleaning", date: "2026-10-08", amount: 60, status: "Pending" },
  { id: "P-007", bookingId: "BK-1002", customer: "Sara Ahmed", service: "AC Repair", date: "2026-10-08", amount: 45, status: "Pending" },
  { id: "P-008", bookingId: "BK-1005", customer: "Bilal Shah", service: "AC Repair", date: "2026-10-06", amount: 45, status: "Failed" },
  { id: "P-009", bookingId: "BK-1006", customer: "Ayesha Noor", service: "Pipe Leak Fix", date: "2026-10-05", amount: 35, status: "Refunded" },
];

const badge: Record<PaymentStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Paid: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-700",
  Refunded: "bg-gray-200 text-gray-700",
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function EarningsPage() {
  const [filter, setFilter] = useState<"All" | PaymentStatus>("All");

  const summary = useMemo(() => {
    const sum = (s: PaymentStatus) =>
      payments.filter((p) => p.status === s).reduce((t, p) => t + p.amount, 0);
    const thisMonth = "2026-10";
    return {
      totalPaid: sum("Paid"),
      thisMonth: payments
        .filter((p) => p.status === "Paid" && p.date.startsWith(thisMonth))
        .reduce((t, p) => t + p.amount, 0),
      pending: sum("Pending"),
      refunded: sum("Refunded"),
    };
  }, []);

  // Paid earnings grouped by month, last 6 months
  const monthly = useMemo(() => {
    const now = new Date(2026, 9, 1); // Oct 2026 (mock "today")
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: monthNames[d.getMonth()], total: 0 });
    }
    payments
      .filter((p) => p.status === "Paid")
      .forEach((p) => {
        const m = months.find((x) => p.date.startsWith(x.key));
        if (m) m.total += p.amount;
      });
    return months;
  }, []);

  const maxMonth = Math.max(...monthly.map((m) => m.total), 1);

  const visible = payments
    .filter((p) => filter === "All" || p.status === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const cards = [
    { label: "Total earned (paid)", value: `$${summary.totalPaid}` },
    { label: "This month", value: `$${summary.thisMonth}` },
    { label: "Pending payments", value: `$${summary.pending}` },
    { label: "Refunded", value: `$${summary.refunded}` },
  ];

  const filters: ("All" | PaymentStatus)[] = ["All", "Paid", "Pending", "Failed", "Refunded"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Earnings</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-medium">Monthly earnings (paid)</h2>
        <div className="flex h-48 items-end gap-3">
          {monthly.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs text-gray-600">${m.total}</span>
              <div
                className="w-full rounded-t-md bg-indigo-500"
                style={{ height: `${(m.total / maxMonth) * 100}%`, minHeight: m.total > 0 ? 4 : 0 }}
              />
              <span className="text-xs text-gray-500">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
          <h2 className="font-medium">Payments</h2>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  filter === f
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="px-5 py-3">Payment ID</th>
                <th className="px-5 py-3">Booking</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-5 py-3 font-medium">{p.id}</td>
                  <td className="px-5 py-3">{p.bookingId}</td>
                  <td className="px-5 py-3">{p.customer}</td>
                  <td className="px-5 py-3">{p.service}</td>
                  <td className="px-5 py-3">{p.date}</td>
                  <td className="px-5 py-3">${p.amount}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    No payments match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}