"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { useAuthedApi } from "../../../lib/api/useAuthedApi";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type Payment = {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  method?: string;
  paidAt?: string | null;
  createdAt?: string;
};

type PaymentPage = { items?: Payment[]; totalPages?: number };
type Envelope = { data?: PaymentPage } & PaymentPage;

const MAX_PAGES = 25;

const statusLabel: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const badge: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-200 text-gray-700",
};

const filters: ("all" | PaymentStatus)[] = ["all", "paid", "pending", "failed", "refunded"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Paid payments count on the day they were paid; fall back to created date
const dateOf = (p: Payment) => p.paidAt ?? p.createdAt ?? "";
const shortId = (id: string) => (id ? `…${id.slice(-6)}` : "—");

export default function EarningsPage() {
  const request = useAuthedApi();
  const { user } = useAuth();
  const info = (user ?? {}) as Record<string, unknown>;
  const providerId = String(info.id ?? info._id ?? "");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");

  const load = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError("");
    try {
      const all: Payment[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const json = await request<Envelope>(
          `/api/payments?providerId=${encodeURIComponent(providerId)}&page=${page}&limit=20`
        );
        const data = json.data ?? json;
        all.push(...(data.items ?? []));
        totalPages = data.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages && page <= MAX_PAGES);
      setPayments(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load payments");
    } finally {
      setLoading(false);
    }
  }, [providerId, request]);

  useEffect(() => {
    load();
  }, [load]);

  const currency = payments.find((p) => p.currency)?.currency ?? "";
  const money = (n: number) => `${currency ? currency + " " : ""}${n.toLocaleString()}`;

  const summary = useMemo(() => {
    const sum = (s: PaymentStatus) =>
      payments.filter((p) => p.status === s).reduce((t, p) => t + Number(p.amount), 0);
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return {
      totalPaid: sum("paid"),
      thisMonth: payments
        .filter((p) => p.status === "paid" && dateOf(p).startsWith(thisMonthKey))
        .reduce((t, p) => t + Number(p.amount), 0),
      pending: sum("pending"),
      refunded: sum("refunded"),
    };
  }, [payments]);

  // Paid earnings by month, last 6 months (calculated here: the API has no summary endpoint)
  const monthly = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: monthNames[d.getMonth()], total: 0 });
    }
    payments
      .filter((p) => p.status === "paid")
      .forEach((p) => {
        const m = months.find((x) => dateOf(p).startsWith(x.key));
        if (m) m.total += Number(p.amount);
      });
    return months;
  }, [payments]);

  const maxMonth = Math.max(...monthly.map((m) => m.total), 1);

  const visible = payments
    .filter((p) => filter === "all" || p.status === filter)
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)));

  const cards = [
    { label: "Total earned (paid)", value: money(summary.totalPaid) },
    { label: "This month", value: money(summary.thisMonth) },
    { label: "Pending payments", value: money(summary.pending) },
    { label: "Refunded", value: money(summary.refunded) },
  ];

  if (!providerId) {
    return <div className="text-sm text-gray-500">Loading your account...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Earnings</h1>
        <button onClick={load} className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold">{loading ? "…" : c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-medium">Monthly earnings (paid)</h2>
        <div className="flex h-48 items-end gap-3">
          {monthly.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs text-gray-600">{m.total.toLocaleString()}</span>
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
                {f === "all" ? "All" : statusLabel[f]}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Booking</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              )}
              {!loading &&
                visible.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-5 py-3 font-medium">{shortId(p.id)}</td>
                    <td className="px-5 py-3">{shortId(p.bookingId)}</td>
                    <td className="px-5 py-3">{shortId(p.customerId)}</td>
                    <td className="px-5 py-3">{dateOf(p).slice(0, 10) || "—"}</td>
                    <td className="px-5 py-3">{p.method ?? "—"}</td>
                    <td className="px-5 py-3">{money(Number(p.amount))}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge[p.status]}`}>
                        {statusLabel[p.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              {!loading && visible.length === 0 && (
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