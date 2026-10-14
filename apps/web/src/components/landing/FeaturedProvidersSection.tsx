"use client";

import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel, PrismSectionHeading } from "@/components/landing/prism/prism-ui";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { RemoteImage } from "@/components/landing/RemoteImage";
import { featuredProviders } from "@/lib/data/landing-mock";

export function FeaturedProvidersSection() {
  return (
    <section id="providers" className="relative scroll-mt-28 bg-background py-20 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_55%)] opacity-0 dark:opacity-100" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <PrismSectionHeading
            eyebrow="Featured providers"
            title="Professionals customers"
            titleAccent="love"
            description="Verified businesses with consistent quality. Profiles link to Khadija&apos;s provider catalog when integrated."
          />
        </LandingReveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {featuredProviders.map((provider, i) => (
            <LandingReveal key={provider.id} delay={i * 0.1}>
              <GlassPanel className="landing-service-card group overflow-hidden p-0">
                <div className="relative h-44 w-full overflow-hidden bg-muted md:h-48">
                  <RemoteImage
                    src={provider.image}
                    alt={provider.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  {provider.verified && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                      <BadgeCheck className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                      Verified
                    </span>
                  )}
                </div>
                <div className="bg-card p-6">
                  <h3 className="font-semibold text-foreground">{provider.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{provider.specialty}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/80">{provider.city}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="flex items-center gap-1 text-sm text-foreground/80">
                      <Star className="h-4 w-4 fill-amber-400/90 text-amber-400/90" />
                      {provider.rating}{" "}
                      <span className="text-muted-foreground">({provider.reviews} reviews)</span>
                    </span>
                    <Button size="sm" variant="outline" className="rounded-full" asChild>
                      <Link href="/providers">View profile</Link>
                    </Button>
                  </div>
                </div>
              </GlassPanel>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
