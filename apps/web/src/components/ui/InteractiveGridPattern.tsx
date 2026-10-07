"use client";

import React, { useId, useMemo } from "react";
import { cn } from "../../lib/utils";

interface InteractiveGridPatternProps {
  width?: number;
  height?: number;
  squares?: [number, number];
  className?: string;
  squaresClassName?: string;
}

export const InteractiveGridPattern = React.memo(function InteractiveGridPattern({
  width = 44,
  height = 44,
  squares = [28, 28],
  className,
  squaresClassName,
}: InteractiveGridPatternProps) {
  const patternId = useId();
  const [horizontal, vertical] = squares;

  // Memoize SVG rect nodes to eliminate 784 per-frame React re-renders
  const gridSquares = useMemo(() => {
    const total = horizontal * vertical;
    const elements: React.JSX.Element[] = [];

    for (let index = 0; index < total; index++) {
      const x = (index % horizontal) * width;
      const y = Math.floor(index / horizontal) * height;

      elements.push(
        <rect
          key={index}
          x={x}
          y={y}
          width={width}
          height={height}
          className={cn(
            "stroke-transparent fill-transparent transition-all duration-300 motion-reduce:transition-none",
            "hover:fill-indigo-500/25 hover:stroke-indigo-400/40",
            squaresClassName
          )}
        />
      );
    }

    return elements;
  }, [horizontal, vertical, width, height, squaresClassName]);

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
          id={patternId}
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
      <rect width="100%" height="100%" fill={`url(#${patternId})`} pointerEvents="none" />
      <g className="pointer-events-auto">{gridSquares}</g>
    </svg>
  );
});
