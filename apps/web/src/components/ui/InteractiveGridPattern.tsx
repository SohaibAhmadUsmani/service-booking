"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";

interface InteractiveGridPatternProps {
  width?: number;
  height?: number;
  squares?: [number, number];
  className?: string;
  squaresClassName?: string;
}

export function InteractiveGridPattern({
  width = 44,
  height = 44,
  squares = [28, 28],
  className,
  squaresClassName,
}: InteractiveGridPatternProps) {
  const [horizontal, vertical] = squares;
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);

  return (
    <svg
      width={width * horizontal}
      height={height * vertical}
      className={cn(
        "absolute inset-0 h-full w-full pointer-events-auto stroke-white/[0.07]",
        className
      )}
    >
      <defs>
        <pattern
          id="interactive-grid"
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${width} 0 L 0 0 0 ${height}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#interactive-grid)" />
      <g>
        {Array.from({ length: horizontal * vertical }).map((_, index) => {
          const x = (index % horizontal) * width;
          const y = Math.floor(index / horizontal) * height;
          const isHovered = hoveredSquare === index;

          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={width}
              height={height}
              className={cn(
                "transition-all duration-300 stroke-transparent",
                isHovered
                  ? "fill-indigo-500/25 stroke-indigo-400/40"
                  : "fill-transparent hover:fill-indigo-500/20",
                squaresClassName
              )}
              onMouseEnter={() => setHoveredSquare(index)}
              onMouseLeave={() => setHoveredSquare(null)}
            />
          );
        })}
      </g>
    </svg>
  );
}
