"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BackgroundBeams({ className }: { className?: string }) {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
    "M-390 -181C-390 -181 -322 224 142 351C606 478 674 883 674 883",
  ];

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <svg
        className="absolute h-full w-full opacity-40"
        width="100%"
        height="100%"
        viewBox="0 0 696 874"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, i) => (
          <motion.path
            key={i}
            d={path}
            stroke={`url(#beam-gradient-${i})`}
            strokeOpacity="0.5"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 2.5,
              delay: i * 0.3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: 1,
            }}
          />
        ))}
        <defs>
          {paths.map((_, i) => (
            <linearGradient
              key={i}
              id={`beam-gradient-${i}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop stopColor="#6366F1" stopOpacity="0" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-dark/95 to-brand-dark" />
    </div>
  );
}
