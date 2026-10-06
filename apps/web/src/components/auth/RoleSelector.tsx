"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Briefcase } from "lucide-react";
import { UserRole } from "@service-booking/shared";
import { cn } from "../../lib/utils";

interface RoleSelectorProps {
  value: UserRole.Customer | UserRole.Provider;
  onChange: (role: UserRole.Customer | UserRole.Provider) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const roles = [
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
  ];

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Select Your Role
      </label>
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
        {roles.map((role) => {
          const isSelected = value === role.id;
          const Icon = role.icon;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id as any)}
              className={cn(
                "relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-colors duration-200 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
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
                    stiffness: 380,
                    damping: 28,
                  }}
                />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  isSelected ? "text-indigo-600" : "text-slate-400"
                )}
              />
              <span>{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
