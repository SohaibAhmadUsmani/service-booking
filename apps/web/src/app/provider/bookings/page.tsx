"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiStatus, statusLabel, useAuthedApi } from "../../../lib/api/useAuthedApi";

type Booking = {
  _id: string;
  bookingId: string;
  customerId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  price: number;
  status: ApiStatus;
  details?: { name?: string; phone?: string };
};

const filters: ("all" | ApiStatus)[] = ["all", "pending", "confirmed", "completed", "cancelled", "no_show"];

const badge: Record<ApiStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-700",
  no_show: "bg-red-100 text-red-700",
};

// Allowed changes, from Shanza's status table
const actions: Record<ApiStatus, { label: string; to: ApiStatus; danger?: boolean }[]> = {
  pending: [
    { label: "Confirm", to: "confirmed" },
    { label: "Cancel", to: "cancelled", danger: true },
  ],
  confirmed: [
    { label: "Complete", to: "completed" },
    { label: "No-show", to: "no_show", danger: true },
    { label: "Cancel", to: "cancelled", danger: true },
  ],
  completed: [],
  cancelled: [],
  no_show: [],
};

export default function BookingsPage() {
  const request = useAuthedApi();
  const { user } = useAuth();
  const info = (user ?? {}) as Record<string, unknown>;
  const providerId = String(info.id ?? info._id ?? "");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ApiStatus>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError("");
    try {
      // providerId is required until the login checks (PR #12) are merged;
      // after that the token supplies it and this stays harmless
      const json = await request<unknown>(`/api/bookings?providerId=${encodeURIComponent(providerId)}`);
      const list = Array.isArray(json)
        ? json
        : ((json as { data?: unknown }).data as unknown[]) ?? [];
      setBookings(list as Booking[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }, [providerId, request]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => filter === "all" || b.status === filter)
      .filter(
        (b) =>
          !q ||
          b.bookingId.toLowerCase().includes(q) ||
          (b.details?.name ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  }, [bookings, filter, query]);

  function count(s: "all" | ApiStatus) {
    return s === "all" ? bookings.length : bookings.filter((b) => b.status === s).length;
  }

  async function changeStatus(b: Booking, to: ApiStatus) {
    if (to === "cancelled" || to === "no_show") {
      if (!window.confirm(`Mark ${b.bookingId} as ${statusLabel[to]}?`)) return;
    }
    setBusyId(b._id);
    setError("");
    try {
      const updated =
        to === "cancelled"
          ? await request<Booking>(`/api/bookings/${b._id}/cancel`, { method: "PATCH" })
          : await request<Booking>(`/api/bookings/${b._id}/status`, {
              method: "PATCH",
              body: { status: to },
            });
      setBookings((list) =>
        list.map((x) => (x._id === b._id ? { ...x, ...updated, status: updated.status ?? to } : x))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update booking");
    } finally {
      setBusyId(null);
    }
  }

  if (!providerId) {
    return <div className="text-sm text-gray-500">Loading your account...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <button onClick={load} className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
              {f === "all" ? "All" : statusLabel[f]} ({count(f)})
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ID or customer"
          className="w-64 rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="px-5 py-3">Booking ID</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                  Loading bookings...
                </td>
              </tr>
            )}
            {!loading &&
              visible.map((b) => (
                <tr key={b._id} className="border-t">
                  <td className="px-5 py-3 font-medium">{b.bookingId}</td>
                  <td className="px-5 py-3">{b.details?.name ?? "Customer"}</td>
                  <td className="px-5 py-3">{b.details?.phone ?? "—"}</td>
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
                  <td className="space-x-3 px-5 py-3">
                    {actions[b.status]?.length === 0 && <span className="text-gray-400">—</span>}
                    {actions[b.status]?.map((a) => (
                      <button
                        key={a.label}
                        disabled={busyId === b._id}
                        onClick={() => changeStatus(b, a.to)}
                        className={`disabled:opacity-50 ${
                          a.danger ? "text-red-600 hover:underline" : "text-indigo-600 hover:underline"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            {!loading && visible.length === 0 && (
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