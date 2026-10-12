import HeroSection from "@/components/ui/hero-01-utils/hero";
import type { NavigationSection } from "@/components/ui/hero-01-utils/header";
import Header from "@/components/ui/hero-01-utils/header";
import BrandSlider from "@/components/ui/hero-01-utils/brand-slider";
import type { AvatarList } from "@/components/ui/hero-01-utils/hero";

const avatarList: AvatarList[] = [
  {
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
  },
  {
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  },
  {
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
  },
  {
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
  },
];

const navigationData: NavigationSection[] = [
  { title: "Home", href: "/landing", isActive: true },
  { title: "Services", href: "#services" },
  { title: "Providers", href: "#providers" },
  { title: "How it works", href: "#how-it-works" },
  { title: "Reviews", href: "#reviews" },
  { title: "FAQ", href: "#faq" },
];

export default function AgencyHeroSection() {
  return (
    <div className="relative isolate bg-background text-foreground">
      <Header navigationData={navigationData} />
      <HeroSection avatarList={avatarList} />
      <BrandSlider />
    </div>
  );
}
