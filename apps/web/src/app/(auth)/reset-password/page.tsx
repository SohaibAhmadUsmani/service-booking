"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { PASSWORD_REGEX } from "@service-booking/shared";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string>("");
  const [tokenResolved, setTokenResolved] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const isSubmittingRef = useRef(false);

  useEffect(() => {
    // Resolve token from searchParams or fallback to window.location
    const paramToken = searchParams.get("token");
    if (paramToken) {
      setToken(paramToken);
    } else if (typeof window !== "undefined") {
      const urlToken = new URLSearchParams(window.location.search).get("token");
      if (urlToken) {
        setToken(urlToken);
      }
    }
    setTokenResolved(true);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;

    setErrorMessage(null);
    setFieldErrors({});

    // Client-side validations
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      errors.password = "New password is required.";
    } else if (!PASSWORD_REGEX.test(password)) {
      errors.password =
        "Password must be 8-72 characters and contain uppercase, lowercase, number, and special character.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (errors.password || errors.confirmPassword) {
      setFieldErrors(errors);
      setErrorMessage("Please fix the validation errors below.");
      isSubmittingRef.current = false;
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err.message || "An unexpected error occurred while resetting your password."
      );
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  // If token check is complete and no token was provided in URL
  if (tokenResolved && !token) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-6 text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Invalid Reset Link
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          The password reset link is missing a valid security token or has expired. Please request a new link to reset your password.
        </p>

        <div className="space-y-3">
          <Link
            href="/forgot-password"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Request New Reset Link</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  // Success confirmation card
  if (isSuccess) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6 text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Password Reset Successful
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Your password has been securely updated. You can now sign in with your new password.
        </p>

        <Link
          href="/login"
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Continue to Login</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Active reset password form
  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 text-indigo-600">
        <KeyRound className="w-6 h-6" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Reset Your Password
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Please choose a strong, secure new password for your account.
      </p>

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* New Password */}
        <div>
          <label
            htmlFor="reset-password"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            New Password
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="reset-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {fieldErrors.password}
            </p>
          )}

          {/* Password Strength Meter */}
          <PasswordStrengthMeter password={password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="reset-confirm-password"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="reset-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }
              }}
              className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            <button
              type="button"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !password || !confirmPassword}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Resetting password...</span>
            </>
          ) : (
            <>
              <span>Reset Password</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      {/* Back to Login */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Remember your password? Sign in</span>
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-white">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-xs font-medium text-slate-500">
              Loading password reset...
            </p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
