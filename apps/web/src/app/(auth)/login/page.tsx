"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { UserRole } from "@service-booking/shared";
import { SecurityHeroPanel } from "../../../components/auth/SecurityHeroPanel";
import { SocialAuthButtons } from "../../../components/auth/SocialAuthButtons";
import { ShimmerButton } from "../../../components/ui/ShimmerButton";
import { useAuth } from "../../../lib/auth/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const isSubmittingRef = useRef(false);

  // Parse redirect query param if available
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect && redirect.startsWith("/")) {
        setRedirectPath(redirect);
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Re-entrancy / double submission lock
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;

    setErrorMessage(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          const mapped: Record<string, string> = {};
          data.details.forEach((d: { field: string; message: string }) => {
            if (d.field) mapped[d.field] = d.message;
          });
          setFieldErrors(mapped);
        }
        throw new Error(data.error || "Invalid email or password.");
      }

      setSuccessMessage("Signed in successfully! Redirecting...");
      if (data.data?.token && data.data?.user) {
        if (data.data.refreshToken) {
          setSession(data.data.token, data.data.refreshToken, data.data.user);
        } else {
          setSession(data.data.token, data.data.user);
        }
      }

      // Respect redirect query param or perform role-based routing
      setTimeout(() => {
        if (redirectPath) {
          router.push(redirectPath);
          return;
        }

        const userRole = data.data?.user?.role;
        if (userRole === UserRole.Provider) {
          router.push("/provider");
        } else if (userRole === UserRole.Admin) {
          router.push("/admin");
        } else {
          router.push("/search");
        }
      }, 700);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Unable to sign in. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    setInfoMessage(
      "Password reset instructions have been dispatched to your email address if an account exists."
    );
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* LEFT BRAND HERO PANEL */}
      <SecurityHeroPanel />

      {/* RIGHT AUTH CARD FORM */}
      <div
        data-lenis-prevent
        className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto"
      >
        <div className="w-full max-w-md mx-auto my-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-slate-500 font-normal">
              Enter your credentials to access your dashboard and bookings.
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
            >
              <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Work Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all min-h-[44px]"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors p-1"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all min-h-[44px]"
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
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2.5 pt-1 min-h-[36px]">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="text-xs text-slate-600 cursor-pointer select-none"
              >
                Remember this device for 30 days
              </label>
            </div>

            {/* Submit Shimmer CTA */}
            <ShimmerButton
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/30 transition-all mt-3 min-h-[44px] cursor-pointer"
            >
              <span>{isLoading ? "Signing in..." : "Sign in"}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </ShimmerButton>
          </form>

          {/* Social Auth */}
          <SocialAuthButtons mode="login" />

          {/* Don't have an account link */}
          <div className="text-center mt-6 text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* Footer Credit & Watermark */}
        <div className="text-center pt-8 text-[11px] text-slate-400 font-medium tracking-wide uppercase">
          © 2026 IDENTITY & ACCESS. SECURELY BUILT BY SECURITY PROFESSIONALS.
        </div>
      </div>
    </main>
  );
}
