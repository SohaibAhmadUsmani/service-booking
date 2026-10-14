"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/auth/AuthContext";
import { ApiStatus, statusLabel, useAuthedApi } from "../../lib/api/useAuthedApi";

type Booking = {
  _id: string;
  bookingId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: ApiStatus;
  details?: { name?: string };
};

type Payment = { amount: number; currency?: string; status: string };
type Req = ReturnType<typeof useAuthedApi>;

const MAX_PAGES = 25;

const badge: Record<ApiStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-700",
  no_show: "bg-red-100 text-red-700",
};

const pad = (n: number) => String(n).padStart(2, "0");
function todayString() {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

async function fetchPayments(request: Req, providerId: string): Promise<Payment[]> {
  const all: Payment[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const json = await request<Record<string, unknown>>(
      `/api/payments?providerId=${encodeURIComponent(providerId)}&page=${page}&limit=20`
    );
    const data = ((json.data as Record<string, unknown> | undefined) ?? json) as {
      items?: Payment[];
      totalPages?: number;
    };
    all.push(...(data.items ?? []));
    totalPages = data.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages && page <= MAX_PAGES);
  return all;
}

export default function ProviderDashboardPage() {
  const request = useAuthedApi();
  const { user } = useAuth();
  const info = (user ?? {}) as Record<string, unknown>;
  const providerId = String(info.id ?? info._id ?? "");

  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [rating, setRating] = useState<{ averageRating: number; reviewCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!providerId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const problems: string[] = [];

      // Each call is independent: one failing does not break the rest of the dashboard
      const [b, p, r] = await Promise.allSettled([
        request<unknown>(`/api/bookings?providerId=${encodeURIComponent(providerId)}`),
        fetchPayments(request, providerId),
        request<Record<string, unknown>>(`/api/reviews/provider/${encodeURIComponent(providerId)}`),
      ]);

      if (cancelled) return;

      if (b.status === "fulfilled") {
        const json = b.value;
        const list = Array.isArray(json)
          ? json
          : ((json as { data?: unknown }).data as unknown[]) ?? [];
        setBookings(list as Booking[]);
      } else {
        problems.push(`Bookings: ${b.reason instanceof Error ? b.reason.message : "could not load"}`);
      }

      if (p.status === "fulfilled") {
        setPayments(p.value);
      } else {
        problems.push(`Earnings: ${p.reason instanceof Error ? p.reason.message : "could not load"}`);
      }

      if (r.status === "fulfilled") {
        const data = ((r.value.data as Record<string, unknown> | undefined) ?? r.value) as {
          averageRating?: number;
          reviewCount?: number;
        };
        if (typeof data.averageRating === "number") {
          setRating({ averageRating: data.averageRating, reviewCount: data.reviewCount ?? 0 });
        }
      } else {
        problems.push(`Rating: ${r.reason instanceof Error ? r.reason.message : "could not load"}`);
      }

      setErrors(problems);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [providerId, request]);

  const stats = useMemo(() => {
    const today = todayString();
    const list = bookings ?? [];
    return {
      todayCount: list.filter((x) => x.date === today && x.status !== "cancelled").length,
      upcoming: list.filter(
        (x) => x.date > today && (x.status === "pending" || x.status === "confirmed")
      ).length,
      pending: list.filter((x) => x.status === "pending").length,
      recent: [...list]
        .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
        .slice(0, 5),
    };
  }, [bookings]);

  const earned = useMemo(() => {
    const paid = (payments ?? []).filter((x) => x.status === "paid");
    const total = paid.reduce((t, x) => t + Number(x.amount), 0);
    const currency = (payments ?? []).find((x) => x.currency)?.currency ?? "";
    return `${currency ? currency + " " : ""}${total.toLocaleString()}`;
  }, [payments]);

  const show = (value: string, ready: boolean) => (loading ? "…" : ready ? value : "—");

  const cards = [
    { label: "Today's bookings", value: show(String(stats.todayCount), bookings !== null) },
    { label: "Upcoming bookings", value: show(String(stats.upcoming), bookings !== null) },
    { label: "Total earned", value: show(earned, payments !== null) },
    {
      label: "Average rating",
      value: show(rating ? rating.averageRating.toFixed(1) : "", rating !== null),
      note: rating ? `${rating.reviewCount} reviews` : undefined,
    },
  ];

  if (!providerId) {
    return <div className="text-sm text-gray-500">Loading your account...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {!loading && stats.pending > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span>
            {stats.pending} booking{stats.pending > 1 ? "s" : ""} waiting for your confirmation.
          </span>
          <Link href="/provider/bookings" className="font-medium underline">
            Review now
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold">{c.value}</p>
            {c.note && <p className="mt-1 text-xs text-gray-500">{c.note}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-medium">Recent bookings</h2>
          <Link href="/provider/bookings" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="px-5 py-3">Booking ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading &&
                stats.recent.map((b) => (
                  <tr key={b._id} className="border-t">
                    <td className="px-5 py-3 font-medium">{b.bookingId}</td>
                    <td className="px-5 py-3">{b.details?.name ?? "Customer"}</td>
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
              {!loading && stats.recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                    No bookings yet.
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