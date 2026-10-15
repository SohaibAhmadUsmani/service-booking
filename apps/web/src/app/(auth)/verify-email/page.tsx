"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Send,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type VerificationStatus = "idle" | "verifying" | "success" | "failed" | "no-token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend form states
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendStatusMessage, setResendStatusMessage] = useState<string | null>(null);
  const [resendErrorMessage, setResendErrorMessage] = useState<string | null>(null);

  // Guard against React 18/19 StrictMode double-execution
  const verificationAttemptedRef = useRef(false);

  useEffect(() => {
    // Resolve token from searchParams or URL fallback
    const paramToken =
      searchParams.get("token") ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token")
        : null);

    if (!paramToken) {
      setStatus("no-token");
      setShowResendForm(true);
      return;
    }

    if (verificationAttemptedRef.current) return;
    verificationAttemptedRef.current = true;

    setStatus("verifying");
    verifyToken(paramToken);
  }, [searchParams]);

  async function verifyToken(tokenToVerify: string) {
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "The verification link is invalid, expired, or has already been used."
        );
      }

      setSuccessMessage(
        data.message || "Your email address has been successfully verified."
      );
      setStatus("success");
    } catch (err: any) {
      setErrorMessage(
        err.message || "The verification token could not be verified."
      );
      setStatus("failed");
    }
  }

  async function handleResendVerification(e: React.FormEvent) {
    e.preventDefault();

    if (!resendEmail.trim()) {
      setResendErrorMessage("Please enter your email address.");
      return;
    }

    setResendErrorMessage(null);
    setResendStatusMessage(null);
    setIsResending(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to resend verification link.");
      }

      setResendStatusMessage(
        data.message || "A new verification email has been sent. Please check your inbox."
      );
    } catch (err: any) {
      setResendErrorMessage(
        err.message || "Failed to resend verification email. Please try again later."
      );
    } finally {
      setIsResending(false);
    }
  }

  // 1. Verifying State
  if (status === "verifying") {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Verifying your email
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Please wait while we validate your verification token...
        </p>
      </div>
    );
  }

  // 2. Success State
  if (status === "success") {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6 text-emerald-600">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Email Verified!
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {successMessage || "Your email address has been successfully verified. You now have full access to your account."}
        </p>

        <Link
          href="/login"
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Continue to Login</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  // 3. Failure or No Token State
  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-6 text-rose-600">
        <AlertCircle className="w-8 h-8" aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {status === "no-token" ? "Missing Verification Token" : "Verification Failed"}
      </h1>

      <p className="text-sm text-slate-500 mb-5 leading-relaxed">
        {status === "no-token"
          ? "No verification token was provided in the link. Please check the link from your email or request a new one below."
          : (errorMessage || "The verification link is invalid, expired, or has already been used.")}
      </p>

      {/* Resend Form Accordion / Box */}
      {showResendForm ? (
        <div className="pt-2 pb-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Resend Verification Link
            </h2>

            {resendErrorMessage && (
              <div
                role="alert"
                className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{resendErrorMessage}</span>
              </div>
            )}

            {resendStatusMessage && (
              <div
                role="status"
                className="mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{resendStatusMessage}</span>
              </div>
            )}

            <form onSubmit={handleResendVerification} noValidate className="space-y-3">
              <div>
                <label
                  htmlFor="resend-email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="resend-email"
                    type="email"
                    required
                    placeholder="john.doe@company.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResending || !resendEmail.trim()}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Sending email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Send Verification Email</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowResendForm(true)}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 mb-3 shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Resend Verification</span>
        </button>
      )}

      {/* Return to Sign In */}
      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Return to Sign In</span>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-white">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-xs font-medium text-slate-500">
              Loading email verification...
            </p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
