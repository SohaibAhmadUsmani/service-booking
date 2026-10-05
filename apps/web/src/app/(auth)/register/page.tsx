"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { UserRole } from "@service-booking/shared";
import { SecurityHeroPanel } from "../../../components/auth/SecurityHeroPanel";
import { RoleSelector } from "../../../components/auth/RoleSelector";
import { PasswordStrengthMeter } from "../../../components/auth/PasswordStrengthMeter";
import { PhoneInputWithCountry } from "../../../components/auth/PhoneInputWithCountry";
import { SocialAuthButtons } from "../../../components/auth/SocialAuthButtons";
import { ShimmerButton } from "../../../components/ui/ShimmerButton";
import { useAuth } from "../../../lib/auth/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [role, setRole] = useState<UserRole.Customer | UserRole.Provider>(
    UserRole.Customer
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          role,
          phone: phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      setSuccessMessage("Account created successfully! Redirecting...");
      if (data.data?.token && data.data?.user) {
        setSession(data.data.token, data.data.user);
      }

      // Role-based redirect
      setTimeout(() => {
        if (role === UserRole.Provider) {
          router.push("/provider");
        } else {
          router.push("/search");
        }
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* LEFT BRAND HERO PANEL */}
      <SecurityHeroPanel />

      {/* RIGHT AUTH CARD FORM */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-slate-500 font-normal">
              Sign up today and experience secure identity management.
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Toggle */}
            <RoleSelector value={role} onChange={setRole} />

            {/* 2-Column Name */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <PhoneInputWithCountry value={phone} onChange={setPhone} />

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Real-time Dynamic Password Strength Meter */}
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="text-xs text-slate-600 leading-snug cursor-pointer select-none"
              >
                I agree to the{" "}
                <span className="font-semibold text-slate-900 underline hover:text-indigo-600">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="font-semibold text-slate-900 underline hover:text-indigo-600">
                  Privacy Policy
                </span>
                .
              </label>
            </div>

            {/* Submit Shimmer CTA */}
            <ShimmerButton
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/30 transition-all mt-2"
            >
              <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </ShimmerButton>
          </form>

          {/* Social Auth Buttons */}
          <SocialAuthButtons />

          {/* Already have an account link */}
          <div className="text-center mt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              Sign in
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
