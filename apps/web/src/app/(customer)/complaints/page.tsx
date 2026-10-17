"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileQuestion,
  HelpCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Complaint, ComplaintCategory, ComplaintStatus } from "@service-booking/shared";
import CustomerHeader from "@/components/customer/CustomerHeader";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError, apiGet, apiPost } from "@/lib/api/client";

interface BookingOption {
  _id: string;
  bookingId: string;
  date: string;
  startTime: string;
  price: number;
  status: string;
}

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  [ComplaintCategory.ProviderNoShow]: "Provider did not show up",
  [ComplaintCategory.PoorQuality]: "Poor service quality",
  [ComplaintCategory.Overcharged]: "Overcharged or pricing dispute",
  [ComplaintCategory.UnprofessionalBehavior]: "Unprofessional behavior",
  [ComplaintCategory.CancellationDispute]: "Cancellation / Refund issue",
  [ComplaintCategory.Other]: "Other incident",
};

const STATUS_BADGES: Record<ComplaintStatus, { label: string; className: string }> = {
  [ComplaintStatus.Open]: {
    label: "Open",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [ComplaintStatus.UnderReview]: {
    label: "Under Review",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  [ComplaintStatus.Resolved]: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  [ComplaintStatus.Rejected]: {
    label: "Closed / Rejected",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export default function CustomerComplaintsPage() {
  const { user, isAuthenticated } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // File Complaint Dialog state
  const [showModal, setShowModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>(ComplaintCategory.PoorQuality);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchComplaints = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ status: string; data: { items: Complaint[] } }>("/api/complaints");
      setComplaints(res.data.items || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const res = await apiGet<BookingOption[]>(`/api/bookings?customerId=${user.id}`);
      setBookings(Array.isArray(res) ? res : []);
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchComplaints();
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setSubmitError("Please select a booking.");
      return;
    }
    if (description.trim().length < 10) {
      setSubmitError("Description must be at least 10 characters long.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiPost("/api/complaints", {
        bookingId: selectedBookingId,
        category,
        description: description.trim(),
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowModal(false);
        setSelectedBookingId("");
        setDescription("");
        fetchComplaints();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Sign in to view disputes</h1>
          <p className="mt-2 text-gray-600">You must be logged in to view your dispute history and file claims.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Support & Disputes</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track filed complaints, report service incidents, and monitor administrative resolutions.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" /> File a complaint
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
            <button onClick={fetchComplaints} className="ml-auto flex items-center gap-1 font-semibold underline">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-12 flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No disputes on record</h3>
            <p className="mt-1 text-sm text-gray-500">
              You have not filed any complaints. If you ever experience issues with a service, report them here.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" /> Report an issue
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {complaints.map((c) => {
              const badge = STATUS_BADGES[c.status] || STATUS_BADGES[ComplaintStatus.Open];
              return (
                <div
                  key={c.id || c.complaintId}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-gray-500">{c.complaintId}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm font-medium text-gray-900">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-gray-700 leading-relaxed">{c.description}</p>

                  {c.resolutionNotes && (
                    <div className="mt-4 rounded-lg bg-emerald-50/70 p-3.5 border border-emerald-100">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolution notes
                      </h4>
                      <p className="mt-1 text-xs text-emerald-900">{c.resolutionNotes}</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
                    <span>Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                    <span>Status updated: {new Date(c.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* File Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900">File a complaint</h2>
            <p className="mt-1 text-xs text-gray-500">
              Our support team investigates all complaints and facilitates resolutions or refunds.
            </p>

            {submitSuccess ? (
              <div className="my-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="mt-3 font-semibold text-gray-900">Complaint submitted successfully!</p>
                <p className="text-xs text-gray-500">Our team will review your case shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {submitError && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{submitError}</div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700">Select booking</label>
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose a booking --</option>
                    {bookings.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.bookingId} ({b.date} at {b.startTime} - ${b.price}) [{b.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Issue category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                      <option key={catKey} value={catKey}>
                        {catLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Detailed description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please explain what happened, including dates, missed promises, or discrepancies..."
                    required
                    minLength={10}
                    maxLength={2000}
                    className="mt-1 block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400">{description.length}/2000 characters</span>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit complaint"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
