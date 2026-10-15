"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface CountryFlagProps {
  country: string;
  className?: string;
}

export function CountryFlag({ country, className }: CountryFlagProps) {
  const code = country.toUpperCase();

  const flagContent = (() => {
    switch (code) {
      case "US":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="14" fill="#B22234" />
            <path
              d="M0,1.077h20v1.077H0z M0,3.231h20v1.077H0z M0,5.385h20v1.077H0z M0,7.538h20v1.077H0z M0,9.692h20v1.077H0z M0,11.846h20v1.077H0z"
              fill="#FFFFFF"
            />
            <rect width="8.5" height="7.5" fill="#3C3B6E" />
            <circle cx="2" cy="1.8" r="0.55" fill="#FFFFFF" />
            <circle cx="4.25" cy="1.8" r="0.55" fill="#FFFFFF" />
            <circle cx="6.5" cy="1.8" r="0.55" fill="#FFFFFF" />
            <circle cx="3.1" cy="3.6" r="0.55" fill="#FFFFFF" />
            <circle cx="5.4" cy="3.6" r="0.55" fill="#FFFFFF" />
            <circle cx="2" cy="5.4" r="0.55" fill="#FFFFFF" />
            <circle cx="4.25" cy="5.4" r="0.55" fill="#FFFFFF" />
            <circle cx="6.5" cy="5.4" r="0.55" fill="#FFFFFF" />
          </svg>
        );
      case "CA":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="14" fill="#D80621" />
            <rect x="5" width="10" height="14" fill="#FFFFFF" />
            <path
              d="M10 2.5l.8 2 1.8-.8-.8 1.8 1.7.5-1.5 1.2.5 1.8-1.5-.8-.5 2.5-.5-2.5-1.5.8.5-1.8-1.5-1.2 1.7-.5-.8-1.8 1.8.8z"
              fill="#D80621"
            />
          </svg>
        );
      case "GB":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="14" fill="#012169" />
            <path d="M0 0l20 14M20 0L0 14" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M0 0l20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.2" />
            <path d="M10 0v14M0 7h20" stroke="#FFFFFF" strokeWidth="4" />
            <path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth="2.4" />
          </svg>
        );
      case "PK":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="14" fill="#01411C" />
            <rect width="5" height="14" fill="#FFFFFF" />
            <path
              d="M14.5 4.5a3.8 3.8 0 1 0 0 5 3.2 3.2 0 1 1 0-5z"
              fill="#FFFFFF"
            />
            <polygon
              points="14.2,4.8 14.7,6.2 13.5,5.3 15,5.3 13.7,6.2"
              fill="#FFFFFF"
            />
          </svg>
        );
      case "AE":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="4.66" fill="#00732F" />
            <rect y="4.66" width="20" height="4.66" fill="#FFFFFF" />
            <rect y="9.33" width="20" height="4.67" fill="#000000" />
            <rect width="5" height="14" fill="#FF0000" />
          </svg>
        );
      case "AU":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="14" fill="#00008B" />
            <rect width="9" height="6.5" fill="#012169" />
            <path d="M0 0l9 6.5M9 0L0 6.5" stroke="#FFFFFF" strokeWidth="1.2" />
            <path d="M0 0l9 6.5M9 0L0 6.5" stroke="#C8102E" strokeWidth="0.6" />
            <path d="M4.5 0v6.5M0 3.25h9" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M4.5 0v6.5M0 3.25h9" stroke="#C8102E" strokeWidth="1.2" />
            <circle cx="15" cy="3" r="0.6" fill="#FFFFFF" />
            <circle cx="16.5" cy="5.5" r="0.6" fill="#FFFFFF" />
            <circle cx="15" cy="8.5" r="0.6" fill="#FFFFFF" />
            <circle cx="13.5" cy="6" r="0.6" fill="#FFFFFF" />
            <circle cx="4.5" cy="10.5" r="1.1" fill="#FFFFFF" />
          </svg>
        );
      case "DE":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="4.66" fill="#000000" />
            <rect y="4.66" width="20" height="4.66" fill="#DD0000" />
            <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
          </svg>
        );
      case "IN":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="4.66" fill="#FF9933" />
            <rect y="4.66" width="20" height="4.66" fill="#FFFFFF" />
            <rect y="9.33" width="20" height="4.67" fill="#128807" />
            <circle
              cx="10"
              cy="7"
              r="1.8"
              fill="none"
              stroke="#000080"
              strokeWidth="0.6"
            />
            <circle cx="10" cy="7" r="0.5" fill="#000080" />
          </svg>
        );
      case "FR":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="6.66" height="14" fill="#0055A5" />
            <rect x="6.66" width="6.66" height="14" fill="#FFFFFF" />
            <rect x="13.33" width="6.67" height="14" fill="#EF4135" />
          </svg>
        );
      case "SA":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="14" fill="#006C35" />
            <path
              d="M5 8.5h10M6 9.5l2-1M14 9.5l-2-1"
              stroke="#FFFFFF"
              strokeWidth="0.7"
              strokeLinecap="round"
            />
            <path
              d="M6 5.5h8"
              stroke="#FFFFFF"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="1.5 1"
            />
          </svg>
        );
      case "SG":
        return (
          <svg viewBox="0 0 20 14" className="w-full h-full" aria-hidden="true">
            <rect width="20" height="7" fill="#ED2939" />
            <rect y="7" width="20" height="7" fill="#FFFFFF" />
            <path d="M5.5 2a2.4 2.4 0 1 0 0 3 2 2 0 1 1 0-3z" fill="#FFFFFF" />
            <circle cx="6.5" cy="2.5" r="0.35" fill="#FFFFFF" />
            <circle cx="7.2" cy="3.2" r="0.35" fill="#FFFFFF" />
            <circle cx="7.2" cy="4.2" r="0.35" fill="#FFFFFF" />
            <circle cx="6.5" cy="4.9" r="0.35" fill="#FFFFFF" />
            <circle cx="5.8" cy="3.7" r="0.35" fill="#FFFFFF" />
          </svg>
        );
      default:
        return (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
            {code.slice(0, 2)}
          </div>
        );
    }
  })();

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-5 h-3.5 rounded-[3px] overflow-hidden shadow-xs border border-slate-200/90 flex-shrink-0 select-none",
        className
      )}
    >
      {flagContent}
    </span>
  );
}
