"use client";

import React, { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export function NumberTicker({
  value,
  decimalPlaces = 1,
  className = "",
}: {
  value: number;
  decimalPlaces?: number;
  className?: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(spanRef, { once: true, margin: "0px" });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!spanRef.current) return;

    if (shouldReduceMotion || !isInView) {
      spanRef.current.textContent = value.toFixed(decimalPlaces);
      return;
    }

    const start = 0;
    const end = value;
    const duration = 1500; // ms
    const startTime = performance.now();
    let frameId: number;

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out exponential curve
      const current = end * (progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress));
      
      if (spanRef.current) {
        spanRef.current.textContent = current.toFixed(decimalPlaces);
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    }

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value, decimalPlaces, isInView, shouldReduceMotion]);

  return (
    <span ref={spanRef} className={className}>
      {value.toFixed(decimalPlaces)}
    </span>
  );
}
