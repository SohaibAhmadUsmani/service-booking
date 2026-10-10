import ProviderGuard from "../../components/provider/ProviderGuard";
import ProviderShell from "../../components/provider/ProviderShell";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProviderGuard>
      <ProviderShell>{children}</ProviderShell>
    </ProviderGuard>
  );
}