"use client";

import React from "react";
import { Check, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const passedCount = [
    hasMinLength,
    hasUppercase,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  let strengthLabel = "NONE";
  let barColor = "bg-slate-200";

  if (passedCount === 1) {
    strengthLabel = "WEAK";
    barColor = "bg-rose-500";
  } else if (passedCount === 2 || passedCount === 3) {
    strengthLabel = "MEDIUM";
    barColor = "bg-amber-500";
  } else if (passedCount === 4) {
    strengthLabel = "STRONG";
    barColor = "bg-emerald-500";
  }

  const checklistItems = [
    { label: "8+ characters", met: hasMinLength },
    { label: "Uppercase letter", met: hasUppercase },
    { label: "Includes number", met: hasNumber },
    { label: "Special symbol", met: hasSymbol },
  ];

  return (
    <div className="w-full mt-3">
      {/* 4 Segment Progress Bar */}
      <div className="flex items-center gap-1.5 h-1.5 w-full mb-2">
        {[0, 1, 2, 3].map((index) => {
          const isActive = index < passedCount;
          return (
            <div
              key={index}
              className="flex-1 h-full bg-slate-200 rounded-full overflow-hidden"
            >
              <motion.div
                className={cn("h-full rounded-full transition-colors", barColor)}
                initial={{ width: "0%" }}
                animate={{ width: isActive ? "100%" : "0%" }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Strength Label */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Strength:{" "}
          <span
            className={cn(
              "font-bold",
              strengthLabel === "STRONG"
                ? "text-emerald-600"
                : strengthLabel === "MEDIUM"
                ? "text-amber-600"
                : strengthLabel === "WEAK"
                ? "text-rose-600"
                : "text-slate-400"
            )}
          >
            {strengthLabel}
          </span>
        </span>
      </div>

      {/* 2x2 Requirement Checklist */}
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
        {checklistItems.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-200",
              item.met
                ? "text-emerald-600 font-medium"
                : "text-slate-400 font-normal"
            )}
          >
            {item.met ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"
              >
                <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
              </motion.div>
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-300 stroke-[2] flex-shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
