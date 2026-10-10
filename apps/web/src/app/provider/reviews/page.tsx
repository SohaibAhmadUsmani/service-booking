"use client";

import { useMemo, useState } from "react";

type Review = {
  id: string;
  customer: string;
  service: string;
  rating: number; // 1-5
  comment: string;
  date: string; // YYYY-MM-DD
  reply?: string;
};

// TODO: replace with Namra's reviews API (filtered by provider)
const initialReviews: Review[] = [
  { id: "r1", customer: "Ali Khan", service: "Home Cleaning", rating: 5, comment: "Very professional and on time. The house looks great.", date: "2026-10-09", reply: "Thank you Ali, glad you liked it!" },
  { id: "r2", customer: "Usman Raza", service: "Pipe Leak Fix", rating: 4, comment: "Fixed the leak quickly. Slightly late but good work.", date: "2026-10-09" },
  { id: "r3", customer: "Sara Ahmed", service: "Pipe Leak Fix", rating: 5, comment: "Excellent service, will book again.", date: "2026-09-16" },
  { id: "r4", customer: "Bilal Shah", service: "Home Cleaning", rating: 3, comment: "Decent job but missed a couple of spots.", date: "2026-08-19" },
  { id: "r5", customer: "Hina Malik", service: "AC Repair", rating: 2, comment: "Had to call back as the issue returned.", date: "2026-08-02" },
];

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} out of 5`} className="text-yellow-500">
      {"★".repeat(value)}
      <span className="text-gray-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [filter, setFilter] = useState<"All" | 1 | 2 | 3 | 4 | 5>("All");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const total = reviews.length;
    const average = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    return { total, average, distribution };
  }, [reviews]);

  const visible = reviews
    .filter((r) => filter === "All" || r.rating === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  function startReply(r: Review) {
    setReplyingId(r.id);
    setReplyText(r.reply ?? "");
    setError("");
  }

  function saveReply(id: string) {
    const text = replyText.trim();
    if (text.length < 3) {
      setError("Reply must be at least 3 characters");
      return;
    }
    // TODO: send reply to the reviews API
    setReviews((list) => list.map((r) => (r.id === id ? { ...r, reply: text } : r)));
    setReplyingId(null);
    setReplyText("");
    setError("");
  }

  function deleteReply(id: string) {
    if (!window.confirm("Delete your reply?")) return;
    setReviews((list) => list.map((r) => (r.id === id ? { ...r, reply: undefined } : r)));
  }

  const filters: ("All" | 1 | 2 | 3 | 4 | 5)[] = ["All", 5, 4, 3, 2, 1];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reviews</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Overall rating</p>
          <p className="mt-2 text-4xl font-semibold">{stats.average.toFixed(1)}</p>
          <div className="mt-1 text-lg">
            <Stars value={Math.round(stats.average)} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{stats.total} reviews</p>
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
                    style={{ width: `${stats.total ? (d.count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-right text-gray-500">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            {f === "All" ? "All" : `${f} ★`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visible.map((r) => (
          <div key={r.id} className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{r.customer}</p>
                <p className="text-xs text-gray-500">
                  {r.service} · {r.date}
                </p>
              </div>
              <Stars value={r.rating} />
            </div>

            <p className="mt-3 text-sm text-gray-700">{r.comment}</p>

            {r.reply && replyingId !== r.id && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
                <p className="text-xs font-medium text-gray-500">Your reply</p>
                <p className="mt-1 text-gray-700">{r.reply}</p>
                <div className="mt-2 space-x-3 text-xs">
                  <button onClick={() => startReply(r)} className="text-indigo-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => deleteReply(r.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            )}

            {replyingId === r.id && (
              <div className="mt-4 space-y-2">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => saveReply(r.id)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Save reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingId(null);
                      setError("");
                    }}
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!r.reply && replyingId !== r.id && (
              <button
                onClick={() => startReply(r)}
                className="mt-4 text-sm text-indigo-600 hover:underline"
              >
                Reply
              </button>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
            No reviews match this filter.
          </div>
        )}
      </div>
    </div>
  );
}