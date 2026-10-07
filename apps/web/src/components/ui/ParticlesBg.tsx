"use client";

import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface ParticlesBgProps {
  className?: string;
  count?: number;
}

export function ParticlesBg({ className = "", count = 35 }: ParticlesBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = false;
    let isIntersecting = true;
    let isDocumentVisible = !document.hidden;

    // Logical dimensions
    let logicalWidth = 600;
    let logicalHeight = 800;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    function updateDimensions() {
      if (!canvas || !ctx) return;
      const parent = canvas.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      logicalWidth = parent?.clientWidth || window.innerWidth || 600;
      logicalHeight = parent?.clientHeight || window.innerHeight || 800;

      canvas.width = Math.floor(logicalWidth * dpr);
      canvas.height = Math.floor(logicalHeight * dpr);
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * logicalWidth,
          y: Math.random() * logicalHeight,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    }

    updateDimensions();
    initParticles();

    function render() {
      if (!ctx || !canvas || !isRunning) return;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = logicalWidth;
        if (p.x > logicalWidth) p.x = 0;
        if (p.y < 0) p.y = logicalHeight;
        if (p.y > logicalHeight) p.y = 0;

        ctx.fillStyle = `rgba(147, 197, 253, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    function startAnimation() {
      if (isRunning || !isIntersecting || !isDocumentVisible) return;
      isRunning = true;
      animationFrameId = requestAnimationFrame(render);
    }

    function stopAnimation() {
      if (!isRunning) return;
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    }

    // Start initial RAF
    startAnimation();

    // Debounce resize listener (150ms)
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    function handleResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateDimensions();
      }, 150);
    }
    window.addEventListener("resize", handleResize, { passive: true });

    // Pause when tab/document is hidden
    function handleVisibilityChange() {
      isDocumentVisible = !document.hidden;
      if (isDocumentVisible && isIntersecting) {
        startAnimation();
      } else {
        stopAnimation();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Pause when scrolled off-screen via IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry?.isIntersecting ?? false;
        if (isIntersecting && isDocumentVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    // Cleanup & Zero canvas dimensions to reclaim GPU memory
    return () => {
      stopAnimation();
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();

      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    };
  }, [shouldReduceMotion, count]);

  if (shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
}
