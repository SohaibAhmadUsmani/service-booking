"use client";

import React, { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FloatProps {
  children: ReactNode;
  speed?: number; // duration in seconds
  amplitude?: [number, number, number]; // [x, y, z] in px
  rotationRange?: [number, number, number]; // [rx, ry, rz] in degrees
  timeOffset?: number; // delay offset in seconds
  className?: string;
}

export function Float({
  children,
  speed = 5,
  amplitude = [0, 10, 5],
  rotationRange = [2, 2, 1],
  timeOffset = 0,
  className = "",
}: FloatProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const [xAmp, yAmp] = amplitude;
  const [rxRot, ryRot, rzRot] = rotationRange;

  return (
    <motion.div
      className={className}
      initial={{ y: 0, x: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
      animate={{
        y: [-yAmp / 2, yAmp / 2, -yAmp / 2],
        x: [-xAmp / 2, xAmp / 2, -xAmp / 2],
        rotateX: [-rxRot, rxRot, -rxRot],
        rotateY: [-ryRot, ryRot, -ryRot],
        rotateZ: [-rzRot, rzRot, -rzRot],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: timeOffset,
      }}
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  );
}
