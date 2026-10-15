"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Rate limiting countdown state (in seconds)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  const isSubmittingRef = useRef(false);

  // Active rate-limiting countdown timer
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;

    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setErrorMessage(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryCountdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSubmittingRef.current || isLoading || retryCountdown !== null) return;
    isSubmittingRef.current = true;

    setErrorMessage(null);
    setFieldError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldError("Email address is required.");
      isSubmittingRef.current = false;
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldError("Please enter a valid email address.");
      isSubmittingRef.current = false;
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail.toLowerCase() }),
      });

      const data = await res.json();

      // Check for Rate Limit (HTTP 429)
      if (res.status === 429) {
        const retryHeader = res.headers.get("Retry-After");
        const parsedHeader = retryHeader ? parseInt(retryHeader, 10) : null;
        const seconds =
          data.details?.retryAfter ||
          (parsedHeader && !isNaN(parsedHeader) ? parsedHeader : 60);

        setRetryCountdown(seconds);
        setErrorMessage(
          `Too many password reset requests. Please wait ${seconds} seconds before trying again.`
        );
        return;
      }

      // If server returned other non-OK status (e.g. 500)
      if (!res.ok) {
        throw new Error(
          data.error || "Unable to send password reset instructions."
        );
      }

      // Successful request (backend always returns 200 with generic message for privacy)
      setSubmittedEmail(trimmedEmail);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 text-indigo-600">
          <KeyRound className="w-6 h-6" aria-hidden="true" />
        </div>

        {/* Heading & Subtext */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Forgot your password?
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Enter your registered email address and we&apos;ll send you instructions to reset your password.
        </p>

        {/* Rate Limiting Active Banner */}
        {retryCountdown !== null && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
          >
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Rate limit active</p>
              <p className="mt-0.5">
                Too many requests. Please wait{" "}
                <span className="font-bold tabular-nums">{retryCountdown}</span>s before trying again.
              </p>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {errorMessage && retryCountdown === null && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Confirmation Card */}
        {isSuccess ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div
              role="status"
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-900 text-sm">
                  Instructions Dispatched
                </p>
                <p className="text-emerald-700 leading-relaxed">
                  If an account exists for <span className="font-semibold text-emerald-900">{submittedEmail}</span>,
                  we have sent instructions to reset your password. Please check your inbox and spam folder.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Didn&apos;t receive the email? Make sure the email address is correct or check your spam folder.
            </p>

            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setEmail("");
              }}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Try another email address
            </button>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              {fieldError && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {fieldError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || retryCountdown !== null}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Sending instructions...</span>
                </>
              ) : retryCountdown !== null ? (
                <>
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>Retry in {retryCountdown}s</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
