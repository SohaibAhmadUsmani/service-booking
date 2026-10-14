"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@service-booking/shared";
import { useAuth } from "@/lib/auth/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
        if (currentPath === redirectTo) return; // Prevent infinite redirect loops
        const target = currentPath ? `${redirectTo}?redirect=${encodeURIComponent(currentPath)}` : redirectTo;
        router.push(target);
        return;
      }

      if (allowedRoles && allowedRoles.length > 0 && user) {
        if (!allowedRoles.includes(user.role)) {
          // If unauthorized role, route to their designated workspace
          if (user.role === UserRole.Admin) {
            router.push("/admin");
          } else if (user.role === UserRole.Provider) {
            router.push("/provider");
          } else {
            router.push("/search");
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" role="alert">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            403
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-600 mb-6">
            Your account ({user.role}) does not have administrative permissions to view this resource.
          </p>
          <button
            onClick={() => {
              if (user.role === UserRole.Admin) router.push("/admin");
              else if (user.role === UserRole.Provider) router.push("/provider");
              else router.push("/search");
            }}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all"
          >
            Go to Your Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
