"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { User, Briefcase } from "lucide-react";
import { UserRole } from "@service-booking/shared";
import { cn } from "../../lib/utils";

interface RoleSelectorProps {
  value: UserRole.Customer | UserRole.Provider;
  onChange: (role: UserRole.Customer | UserRole.Provider) => void;
  className?: string;
}

const ROLES = [
  {
    id: UserRole.Customer,
    label: "Customer",
    icon: User,
  },
  {
    id: UserRole.Provider,
    label: "Service Provider",
    icon: Briefcase,
  },
] as const;

export function RoleSelector({ value, onChange, className }: RoleSelectorProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // W3C APG Radio Group keyboard navigation pattern
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) {
    let targetIndex = -1;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % ROLES.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      targetIndex = (currentIndex - 1 + ROLES.length) % ROLES.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = ROLES.length - 1;
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(ROLES[currentIndex].id);
      return;
    }

    if (targetIndex !== -1) {
      const targetRole = ROLES[targetIndex].id;
      onChange(targetRole);
      buttonRefs.current[targetIndex]?.focus();
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <label
        id="role-selector-label"
        className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
      >
        Select Your Role
      </label>

      <div
        role="radiogroup"
        aria-labelledby="role-selector-label"
        className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80"
      >
        {ROLES.map((role, idx) => {
          const isSelected = value === role.id;
          const Icon = role.icon;

          return (
            <button
              key={role.id}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(role.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                "relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-colors duration-200 z-10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                isSelected
                  ? "text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="roleActivePill"
                  className="absolute inset-0 bg-white rounded-xl border border-slate-200 shadow-sm -z-10"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors duration-200",
                  isSelected ? "text-indigo-600" : "text-slate-400"
                )}
                aria-hidden="true"
              />
              <span>{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
