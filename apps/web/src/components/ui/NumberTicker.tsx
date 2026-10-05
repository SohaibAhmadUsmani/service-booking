"use client";

import React, { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function NumberTicker({
  value,
  decimalPlaces = 1,
  className = "",
}: {
  value: number;
  decimalPlaces?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const end = value;
    const duration = 1500; // ms
    const startTime = performance.now();

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const current = end * (progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress));
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    const frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value, shouldReduceMotion]);

  return (
    <span className={className}>
      {displayValue.toFixed(decimalPlaces)}
    </span>
  );
}
