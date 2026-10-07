"use client";

import React, { useRef, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface FloatingCardProps {
  children: ReactNode;
  rotateDepth?: number;
  translateDepth?: number;
  timeOffset?: number;
  className?: string;
}

export function FloatingCard({
  children,
  rotateDepth = 12,
  translateDepth = 15,
  timeOffset = 0,
  className = "",
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Motion values eliminate 240Hz React component render churn
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawScale = useMotionValue(1);
  const rawZ = useMotionValue(0);

  const springConfig = { stiffness: 280, damping: 22 };
  const springRotateX = useSpring(rawRotateX, springConfig);
  const springRotateY = useSpring(rawRotateY, springConfig);
  const springScale = useSpring(rawScale, springConfig);
  const springZ = useSpring(rawZ, springConfig);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch" || shouldReduceMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotX = -(mouseY / (rect.height / 2)) * rotateDepth;
    const rotY = (mouseX / (rect.width / 2)) * rotateDepth;

    rawRotateX.set(rotX);
    rawRotateY.set(rotY);
    rawScale.set(1.03);
    rawZ.set(translateDepth);
  }

  function handlePointerLeave() {
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawScale.set(1);
    rawZ.set(0);
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: 1000 }}
      className="inline-block"
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -6, 0, 6, 0],
              }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: timeOffset,
        }}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          scale: springScale,
          z: springZ,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}
