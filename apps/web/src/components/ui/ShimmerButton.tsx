"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  shimmerColor?: string;
  className?: string;
}

export function ShimmerButton({
  children,
  shimmerColor = "#ffffff",
  className,
  disabled,
  ...props
}: ShimmerButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...(props as any)}
    >
      {/* Sweeping Shimmer light effect */}
      <span
        className="absolute inset-0 block -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        style={{
          backgroundSize: "200% 100%",
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
