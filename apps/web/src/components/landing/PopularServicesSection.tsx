"use client";

import Link from "next/link";
import { ArrowRight, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel, PrismSectionHeading } from "@/components/landing/prism/prism-ui";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { RemoteImage } from "@/components/landing/RemoteImage";
import { popularServices } from "@/lib/data/landing-mock";

export function PopularServicesSection() {
  return (
    <section id="services" className="relative z-20 scroll-mt-28 bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <PrismSectionHeading
              eyebrow="Trending now"
              title="Popular"
              titleAccent="services"
              description="Hand-picked offerings with top ratings — swap in live catalog data when APIs are ready."
            />
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/search">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </LandingReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularServices.map((service, index) => (
            <LandingReveal key={service.id} delay={index * 0.08}>
              <GlassPanel className="landing-service-card group relative overflow-hidden p-0">
                <div className="relative h-52 w-full overflow-hidden bg-muted md:h-56">
                  <RemoteImage
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    priority={index < 2}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                  <p className="absolute left-4 top-4 z-10 rounded-full bg-black/45 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                    {service.category}
                  </p>
                </div>
                <div className="relative z-10 bg-card p-6">
                  <h3 className="text-base font-semibold text-foreground md:text-lg">{service.name}</h3>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-sm font-medium text-foreground">${service.price}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration}
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {service.rating}
                    </span>
                  </div>
                  <Button
                    className="mt-6 w-full rounded-full transition-transform duration-300 group-hover:scale-[1.02]"
                    variant="secondary"
                    asChild
                  >
                    <Link href={`/search?q=${encodeURIComponent(service.name)}`}>Book now</Link>
                  </Button>
                </div>
              </GlassPanel>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
