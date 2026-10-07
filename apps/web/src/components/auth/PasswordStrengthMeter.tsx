"use client";

import React, { useMemo } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PASSWORD_REGEX } from "@service-booking/shared";
import { cn } from "../../lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface CriteriaItem {
  id: string;
  label: string;
  met: boolean;
}

/**
 * Calculates cryptographic password entropy (NIST SP 800-63B / Shannon model):
 * E = L * log2(R) where L is length and R is the character pool size.
 */
export function calculatePasswordEntropy(password: string): number {
  if (!password) return 0;

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/\d/.test(password)) poolSize += 10;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) poolSize += 33;

  // Capture extended Unicode / spaces if present
  const extras = password.replace(/[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g, "");
  if (extras.length > 0) poolSize += 15;

  if (poolSize === 0) return 0;
  return Math.round(password.length * Math.log2(poolSize));
}

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  // 5 Criteria strictly synchronized with backend PASSWORD_REGEX
  const hasMinLength = password.length >= 8 && password.length <= 72;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  // Full conformance check with shared backend regex
  const isBackendCompliant = PASSWORD_REGEX.test(password);

  const criteriaList: CriteriaItem[] = [
    { id: "length", label: "8+ characters (max 72)", met: hasMinLength },
    { id: "uppercase", label: "Uppercase letter (A–Z)", met: hasUppercase },
    { id: "lowercase", label: "Lowercase letter (a–z)", met: hasLowercase },
    { id: "number", label: "Includes number (0–9)", met: hasNumber },
    { id: "symbol", label: "Special symbol (!@#$...)", met: hasSymbol },
  ];

  const passedCount = criteriaList.filter((c) => c.met).length;
  const entropyBits = useMemo(() => calculatePasswordEntropy(password), [password]);

  // Determine strength label, bar color, and text color
  let strengthLabel = "EMPTY";
  let barColor = "bg-slate-200";
  let labelTextColor = "text-slate-400";

  if (passedCount === 1) {
    strengthLabel = "VERY WEAK";
    barColor = "bg-rose-500";
    labelTextColor = "text-rose-600";
  } else if (passedCount === 2) {
    strengthLabel = "WEAK";
    barColor = "bg-orange-500";
    labelTextColor = "text-orange-600";
  } else if (passedCount === 3) {
    strengthLabel = "FAIR";
    barColor = "bg-amber-500";
    labelTextColor = "text-amber-600";
  } else if (passedCount === 4) {
    strengthLabel = "GOOD";
    barColor = "bg-sky-500";
    labelTextColor = "text-sky-600";
  } else if (passedCount === 5) {
    strengthLabel = isBackendCompliant ? "STRONG" : "ALMOST STRONG";
    barColor = "bg-emerald-500";
    labelTextColor = "text-emerald-600";
  }

  return (
    <div className={cn("w-full mt-3", className)}>
      {/* 5-Segment Dynamic Progress Bar */}
      <div
        role="progressbar"
        aria-label="Password strength"
        aria-valuenow={passedCount}
        aria-valuemin={0}
        aria-valuemax={5}
        className="flex items-center gap-1.5 h-1.5 w-full mb-2"
      >
        {[0, 1, 2, 3, 4].map((index) => {
          const isSegmentActive = index < passedCount;
          return (
            <div
              key={index}
              className="flex-1 h-full bg-slate-200 rounded-full overflow-hidden"
            >
              <motion.div
                className={cn("h-full rounded-full transition-colors duration-300", barColor)}
                initial={{ width: "0%" }}
                animate={{ width: isSegmentActive ? "100%" : "0%" }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 26,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Strength & Entropy Score Badges */}
      <div className="flex justify-between items-center mb-3">
        <div
          role="status"
          aria-live="polite"
          className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"
        >
          <span>Strength:</span>
          <span className={cn("font-bold tracking-tight transition-colors duration-200", labelTextColor)}>
            {strengthLabel}
          </span>
        </div>

        {/* Entropy Meter */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-semibold">Entropy:</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors duration-200",
              entropyBits >= 60
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : entropyBits >= 40
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : entropyBits > 0
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-slate-100 text-slate-400 border border-slate-200"
            )}
          >
            {entropyBits} bits
          </span>
        </div>
      </div>

      {/* Animated 5-Criteria Requirement Checklist */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {criteriaList.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-200",
              item.met
                ? "text-emerald-600 font-medium"
                : "text-slate-400 font-normal"
            )}
          >
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <AnimatePresence mode="wait" initial={false}>
                {item.met ? (
                  <motion.div
                    key="checked"
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.2, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 480, damping: 24 }}
                    className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm"
                  >
                    <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="unchecked"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-white flex items-center justify-center flex-shrink-0"
                  />
                )}
              </AnimatePresence>
            </div>
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
