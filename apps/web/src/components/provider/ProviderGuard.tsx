"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthContext";

export default function ProviderGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="p-8 text-sm text-gray-500">Loading...</div>;
  }

  if (String(user?.role).toLowerCase() !== "provider") {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Providers only</h1>
        <p className="mt-2 text-sm text-gray-600">
          This area is for service provider accounts. Log in with a provider account to continue.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}