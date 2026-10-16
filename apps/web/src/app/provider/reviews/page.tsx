"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { useAuthedApi } from "../../../lib/api/useAuthedApi";

type Review = {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  serviceId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
};

type ReviewPage = { items?: Review[]; totalPages?: number };
type ReviewEnvelope = { data?: ReviewPage } & ReviewPage;
type Summary = { averageRating: number; reviewCount: number };
type SummaryEnvelope = { data?: Summary } & Partial<Summary>;

const MAX_PAGES = 25;
const shortId = (id?: string) => (id ? `…${id.slice(-6)}` : "—");

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span aria-label={`${v} out of 5`} className="text-yellow-500">
      {"★".repeat(v)}
      <span className="text-gray-300">{"★".repeat(5 - v)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const request = useAuthedApi();
  const { user } = useAuth();
  const info = (user ?? {}) as Record<string, unknown>;
  const providerId = String(info.id ?? info._id ?? "");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | 1 | 2 | 3 | 4 | 5>("all");

  const load = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError("");
    try {
      const all: Review[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const json = await request<ReviewEnvelope>(
          `/api/reviews?providerId=${encodeURIComponent(providerId)}&page=${page}&limit=20`
        );
        const data = json.data ?? json;
        all.push(...(data.items ?? []));
        totalPages = data.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages && page <= MAX_PAGES);
      setReviews(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reviews");
    }

    // The rating summary is separate: if it fails we compute it from the reviews
    try {
      const s = await request<SummaryEnvelope>(`/api/reviews/provider/${encodeURIComponent(providerId)}`);
      const data = (s.data ?? s) as Partial<Summary>;
      if (typeof data.averageRating === "number" && typeof data.reviewCount === "number") {
        setSummary({ averageRating: data.averageRating, reviewCount: data.reviewCount });
      }
    } catch {
      setSummary(null);
    }
    setLoading(false);
  }, [providerId, request]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const computedAvg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    return {
      average: summary?.averageRating ?? computedAvg,
      count: summary?.reviewCount ?? reviews.length,
      // The API has no star breakdown, so it is counted from the loaded reviews
      distribution: [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
      })),
    };
  }, [reviews, summary]);

  const visible = reviews
    .filter((r) => filter === "all" || r.rating === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const filterOptions: ("all" | 1 | 2 | 3 | 4 | 5)[] = ["all", 5, 4, 3, 2, 1];

  if (!providerId) {
    return <div className="text-sm text-gray-500">Loading your account...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <button onClick={load} className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Overall rating</p>
          <p className="mt-2 text-4xl font-semibold">{loading ? "…" : stats.average.toFixed(1)}</p>
          <div className="mt-1 text-lg">
            <Stars value={stats.average} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{stats.count} reviews</p>
        </div>

        <div className="rounded-xl border bg-white p-5 md:col-span-2">
          <p className="mb-3 text-sm text-gray-500">Rating breakdown</p>
          <div className="space-y-2">
            {stats.distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3 text-sm">
                <span className="w-10">{d.star} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-yellow-400"
                    style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-right text-gray-500">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === f
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "All" : `${f} ★`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
            Loading reviews...
          </div>
        )}
        {!loading &&
          visible.map((r) => (
            <div key={r.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">Customer {shortId(r.customerId)}</p>
                  <p className="text-xs text-gray-500">
                    Booking {shortId(r.bookingId)} · {r.createdAt.slice(0, 10)}
                  </p>
                </div>
                <Stars value={r.rating} />
              </div>
              <p className="mt-3 text-sm text-gray-700">
                {r.comment?.trim() ? r.comment : "No written comment."}
              </p>
            </div>
          ))}
        {!loading && visible.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
            No reviews yet.
          </div>
        )}
      </div>
    </div>
  );
}