"use client";

import React, { useRef, useState, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

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
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current || shouldReduceMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotX = -(mouseY / (rect.height / 2)) * rotateDepth;
    const rotY = (mouseX / (rect.width / 2)) * rotateDepth;

    setRotateX(rotX);
    setRotateY(rotY);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000 }}
      className="inline-block"
    >
      <motion.div
        animate={
          isHovered
            ? {
                rotateX,
                rotateY,
                scale: 1.03,
                z: translateDepth,
              }
            : shouldReduceMotion
            ? {}
            : {
                rotateX: [0, 1.5, 0, -1.5, 0],
                y: [0, -6, 0, 6, 0],
              }
        }
        transition={
          isHovered
            ? { type: "spring", stiffness: 300, damping: 20 }
            : {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: timeOffset,
              }
        }
        style={{
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
