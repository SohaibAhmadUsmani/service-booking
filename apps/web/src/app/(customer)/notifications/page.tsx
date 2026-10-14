"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  RotateCcw,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { Notification, NotificationType } from "@service-booking/shared";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError, apiDelete, apiGet, apiPatch } from "../../../lib/api/client";

interface Envelope<T> {
  success: boolean;
  data: T;
}

interface NotificationListData {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

type Filter = "all" | "unread";

const TYPE_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; chip: string; dot: string }
> = {
  [NotificationType.BookingConfirmed]: {
    icon: CheckCheck,
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  [NotificationType.BookingCancelled]: {
    icon: XCircle,
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  [NotificationType.BookingRescheduled]: {
    icon: CalendarClock,
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  [NotificationType.BookingCompleted]: {
    icon: CheckCircle2,
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  [NotificationType.PaymentReceived]: {
    icon: CreditCard,
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  [NotificationType.PaymentRefunded]: {
    icon: RotateCcw,
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  [NotificationType.NewReview]: {
    icon: Star,
    chip: "bg-pink-50 text-pink-700 border-pink-200",
    dot: "bg-pink-500",
  },
};

const FALLBACK_META = {
  icon: Bell,
  chip: "bg-slate-100 text-slate-600 border-slate-200",
  dot: "bg-slate-400",
};

const TYPE_LABELS: Record<string, string> = {
  [NotificationType.BookingConfirmed]: "Booking",
  [NotificationType.BookingCancelled]: "Booking",
  [NotificationType.BookingRescheduled]: "Booking",
  [NotificationType.BookingCompleted]: "Booking",
  [NotificationType.PaymentReceived]: "Payment",
  [NotificationType.PaymentRefunded]: "Payment",
  [NotificationType.NewReview]: "Review",
  [NotificationType.UpcomingAppointment]: "Reminder",
  [NotificationType.ProviderUpdate]: "Update",
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

function formatTimestamp(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load(reset: boolean, currentFilter: Filter) {
    const nextPage = reset ? 1 : page + 1;
    if (reset) {
      setIsLoading(true);
      setLoadError(null);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const query = `?limit=10&page=${nextPage}${currentFilter === "unread" ? "&unread=true" : ""}`;
      const res = await apiGet<Envelope<NotificationListData>>(`/api/notifications${query}`);
      const data = res.data;
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    load(true, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, filter]);

  async function markRead(id: string) {
    if (actingId) return;
    setActingId(id);
    setActionError(null);
    try {
      await apiPatch<Envelope<Notification>>(`/api/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id && !item.read
            ? { ...item, read: true, readAt: new Date().toISOString() }
            : item
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setActingId(null);
    }
  }

  async function markAllRead() {
    if (actingId) return;
    setActingId("all");
    setActionError(null);
    try {
      await apiPatch<Envelope<{ modified: number }>>("/api/notifications/read-all");
      setItems((prev) =>
        prev.map((item) =>
          item.read ? item : { ...item, read: true, readAt: new Date().toISOString() }
        )
      );
      setUnreadCount(0);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setActingId(null);
    }
  }

  async function remove(id: string) {
    if (actingId) return;
    const target = items.find((item) => item.id === id);
    setActingId(id);
    setActionError(null);
    try {
      await apiDelete<Envelope<{ deleted: boolean }>>(`/api/notifications/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((count) => Math.max(0, count - 1));
      if (target && !target.read) setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setActingId(null);
    }
  }

  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl animate-pulse space-y-4" aria-busy="true">
          <div className="h-8 w-56 rounded-xl bg-slate-200" />
          <div className="h-4 w-80 rounded-lg bg-slate-200" />
          <div className="h-24 rounded-2xl bg-slate-200" />
          <div className="h-24 rounded-2xl bg-slate-200" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Info className="mx-auto mb-4 h-10 w-10 text-indigo-500" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-slate-900">Sign in to view notifications</h1>
          <p className="mt-2 text-sm text-slate-500">
            Get booking, payment and review alerts in one place.
          </p>
          <Link
            href="/login?redirect=/notifications"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Booking, payment and review updates for your account.
            </p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0 || actingId !== null}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            {actingId === "all" ? "Marking..." : "Mark all as read"}
          </button>
        </header>

        <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Filter notifications">
          {(["all", "unread"] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-[36px] flex-1 rounded-lg px-4 text-xs font-semibold capitalize transition-colors ${
                filter === value
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {loadError && (
          <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" aria-hidden="true" />
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => load(true, filter)}
              className="ml-auto rounded-lg px-2 py-1 font-semibold text-rose-700 underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {actionError && (
          <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" aria-hidden="true" />
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="ml-auto rounded-lg px-2 py-1 font-semibold text-rose-700 underline hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {!loadError && items.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Bell className="mx-auto mb-3 h-9 w-9 text-slate-300" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900">
              {filter === "unread" ? "No unread notifications" : "You're all caught up"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "unread"
                ? "Everything has been read."
                : "Booking, payment and review alerts will show up here."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => {
            const meta = TYPE_META[item.type] ?? FALLBACK_META;
            const Icon = meta.icon;
            const paymentLink = Boolean(item.data?.paymentId);

            return (
              <article
                key={item.id}
                className={`rounded-2xl border p-4 shadow-sm transition-colors ${
                  item.read ? "border-slate-200 bg-white" : "border-indigo-100 bg-indigo-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border ${meta.chip}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.read && (
                        <span
                          className={`h-2 w-2 flex-shrink-0 rounded-full ${meta.dot}`}
                          aria-label="Unread"
                        />
                      )}
                      <h2
                        className={`truncate text-sm text-slate-900 ${
                          item.read ? "font-medium" : "font-semibold"
                        }`}
                      >
                        {item.title}
                      </h2>
                      <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {TYPE_LABELS[item.type] ?? "Update"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {formatTimestamp(item.createdAt)}
                      {item.readAt ? ` · read ${formatTimestamp(item.readAt)}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => markRead(item.id)}
                        disabled={actingId !== null}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {actingId === item.id ? "Saving..." : "Mark read"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      disabled={actingId !== null}
                      aria-label={`Delete notification: ${item.title}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {paymentLink && (
                  <div className="mt-2 flex justify-end">
                    <Link
                      href="/payments"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      View payment <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {items.length > 0 && page < totalPages && (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => load(false, filter)}
              disabled={isLoadingMore}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              <Clock className="h-4 w-4 animate-pulse" aria-hidden="true" />
              {isLoadingMore ? "Loading..." : `Load more (${total - items.length} remaining)`}
            </button>
          </div>
        )}

        {items.length > 0 && filter === "all" && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Showing {items.length} of {total}
          </p>
        )}
      </div>
    </main>
  );
}
