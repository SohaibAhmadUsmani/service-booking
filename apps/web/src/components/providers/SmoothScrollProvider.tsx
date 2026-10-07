"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Respect OS user preference for reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    // Prevent CSS scroll-behavior: smooth from fighting Lenis JS interpolation
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Default to 1 for natural touch inertia
      touchMultiplier: 1,
      autoResize: true,
      // Prevent Lenis from intercepting form input focus scrolling or form interactions
      prevent: (node: HTMLElement) => {
        return (
          node.tagName === "INPUT" ||
          node.tagName === "TEXTAREA" ||
          node.tagName === "SELECT" ||
          node.tagName === "FORM" ||
          node.hasAttribute("data-lenis-prevent") ||
          Boolean(node.closest?.("[data-lenis-prevent]"))
        );
      },
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();

      // Clean up DOM classes on unmount
      document.documentElement.classList.remove(
        "lenis",
        "lenis-smooth",
        "lenis-stopped",
        "lenis-scrolling"
      );
      document.body.classList.remove(
        "lenis",
        "lenis-smooth",
        "lenis-stopped",
        "lenis-scrolling"
      );

      // Restore inline scroll behavior
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    };
  }, []);

  return <>{children}</>;
}
