import ProviderShell from "../../components/provider/ProviderShell";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { UserRole } from "@service-booking/shared";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Provider]} redirectTo="/login">
      <ProviderShell>{children}</ProviderShell>
    </ProtectedRoute>
  );
}