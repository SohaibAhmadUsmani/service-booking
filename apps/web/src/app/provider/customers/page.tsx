"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiStatus, statusLabel, useAuthedApi } from "../../../lib/api/useAuthedApi";

type Booking = {
  _id: string;
  bookingId: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  price: number;
  status: ApiStatus;
  details?: { name?: string; phone?: string };
};

const badge: Record<ApiStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-700",
  no_show: "bg-red-100 text-red-700",
};

const shortId = (id: string) => (id ? `…${id.slice(-6)}` : "—");

export default function CustomersPage() {
  const request = useAuthedApi();
  const { user } = useAuth();
  const info = (user ?? {}) as Record<string, unknown>;
  const providerId = String(info.id ?? info._id ?? "");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError("");
    try {
      const json = await request<unknown>(`/api/bookings?providerId=${encodeURIComponent(providerId)}`);
      const list = Array.isArray(json)
        ? json
        : ((json as { data?: unknown }).data as unknown[]) ?? [];
      setBookings(list as Booking[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load customers");
    } finally {
      setLoading(false);
    }
  }, [providerId, request]);

  useEffect(() => {
    load();
  }, [load]);

  // Group bookings by customer. The API has no customer list, so names come from
  // the details the customer typed on their bookings (newest first).
  const customers = useMemo(() => {
    const groups = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      const list = groups.get(b.customerId) ?? [];
      list.push(b);
      groups.set(b.customerId, list);
    });

    return Array.from(groups.entries())
      .map(([customerId, list]) => {
        const history = [...list].sort((a, b) =>
          (b.date + b.startTime).localeCompare(a.date + a.startTime)
        );
        const name = history.find((h) => h.details?.name?.trim())?.details?.name?.trim();
        const phone = history.find((h) => h.details?.phone?.trim())?.details?.phone?.trim();
        const completed = history.filter((h) => h.status === "completed");
        return {
          customerId,
          name: name ?? `Customer ${shortId(customerId)}`,
          phone: phone ?? "—",
          history,
          totalBookings: history.length,
          completedCount: completed.length,
          totalSpent: completed.reduce((t, h) => t + Number(h.price), 0),
          lastBooking: history[0]?.date ?? "—",
        };
      })
      .sort((a, b) => b.lastBooking.localeCompare(a.lastBooking));
  }, [bookings]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const selected = rows.find((r) => r.customerId === selectedId) ?? null;

  if (!providerId) {
    return <div className="text-sm text-gray-500">Loading your account...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or ID"
            className="w-64 rounded-lg border px-3 py-2 text-sm"
          />
          <button onClick={load} className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Bookings</th>
              <th className="px-5 py-3">Completed</th>
              <th className="px-5 py-3">Total spent</th>
              <th className="px-5 py-3">Last booking</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                  Loading customers...
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((c) => (
                <tr key={c.customerId} className="border-t">
                  <td className="px-5 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">ID {shortId(c.customerId)}</div>
                  </td>
                  <td className="px-5 py-3">{c.phone}</td>
                  <td className="px-5 py-3">{c.totalBookings}</td>
                  <td className="px-5 py-3">{c.completedCount}</td>
                  <td className="px-5 py-3">{c.totalSpent.toLocaleString()}</td>
                  <td className="px-5 py-3">{c.lastBooking}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedId(selectedId === c.customerId ? null : c.customerId)}
                      className="text-indigo-600 hover:underline"
                    >
                      {selectedId === c.customerId ? "Hide history" : "View history"}
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                  {customers.length === 0 ? "No customers yet. They appear after the first booking." : "No customers found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="rounded-xl border bg-white">
          <h2 className="border-b px-5 py-3 font-medium">Booking history: {selected.name}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="px-5 py-3">Booking ID</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {selected.history.map((b) => (
                  <tr key={b._id} className="border-t">
                    <td className="px-5 py-3 font-medium">{b.bookingId}</td>
                    <td className="px-5 py-3">{b.date}</td>
                    <td className="px-5 py-3">
                      {b.startTime} - {b.endTime}
                    </td>
                    <td className="px-5 py-3">{Number(b.price).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge[b.status]}`}>
                        {statusLabel[b.status]}
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