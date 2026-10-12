import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import { PublicFooter } from "@/components/landing/PublicFooter";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ServiceBook — Book trusted local services",
  description:
    "Discover verified providers, compare prices, and book home, beauty, repair, and more in minutes.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${barlow.className} min-h-screen scroll-smooth bg-background text-foreground antialiased`}
    >
      {children}
      <PublicFooter />
    </div>
  );
}
