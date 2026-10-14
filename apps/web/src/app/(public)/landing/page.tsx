import AgencyHeroSection from "@/components/ui/hero-01";
import { BecomeProviderSection } from "@/components/landing/BecomeProviderSection";
import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FeaturedProvidersSection } from "@/components/landing/FeaturedProvidersSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PopularServicesSection } from "@/components/landing/PopularServicesSection";
import { PrismStatsBand } from "@/components/landing/PrismStatsBand";
import { ReviewsSection } from "@/components/landing/ReviewsSection";

/** Owner: Ayyan — Prism-inspired public marketing landing */
export default function LandingPage() {
  return (
    <div className="landing-page-scroll bg-background">
      <AgencyHeroSection />
      <PrismStatsBand />
      <PopularServicesSection />
      <CategoriesSection />
      <FeaturedProvidersSection />
      <HowItWorksSection />
      <ReviewsSection />
      <BecomeProviderSection />
      <FaqSection />
    </div>
  );
}
