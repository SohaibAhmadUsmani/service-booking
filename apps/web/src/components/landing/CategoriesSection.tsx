"use client";

import Link from "next/link";
import { Marquee } from "@/components/ui/marquee";
import { GlassPanel, PrismSectionHeading } from "@/components/landing/prism/prism-ui";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { RemoteImage } from "@/components/landing/RemoteImage";
import { categories } from "@/lib/data/landing-mock";

function CategoryCard({
  name,
  count,
  image,
}: {
  name: string;
  count: number;
  image: string;
}) {
  return (
    <Link
      href={`/categories?q=${encodeURIComponent(name)}`}
      className="landing-category-card mx-3 block w-[min(100%,220px)] shrink-0 sm:w-[220px]"
    >
      <GlassPanel className="landing-service-card group relative block h-56 overflow-hidden p-0 md:h-60">
        <RemoteImage
          src={image}
          alt={name}
          fill
          sizes="220px"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 transition group-hover:from-black/90" />
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-left">
          <span className="text-sm font-semibold text-white">{name}</span>
          <span className="mt-1 block text-xs text-white/75">{count}+ services</span>
        </div>
      </GlassPanel>
    </Link>
  );
}

export function CategoriesSection() {
  const loop = [...categories, ...categories];

  return (
    <section className="relative z-10 overflow-hidden border-y border-border bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <PrismSectionHeading
            align="center"
            eyebrow="Discover"
            title="Browse by"
            titleAccent="category"
            description="From everyday chores to special occasions — find the right expert fast."
          />
        </LandingReveal>

        <LandingReveal delay={0.12} className="mt-12">
          <div className="relative -mx-4 sm:-mx-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />
            <Marquee pauseOnHover className="[--duration:38s] py-2">
              {loop.map((cat, i) => (
                <CategoryCard key={`${cat.name}-${i}`} {...cat} />
              ))}
            </Marquee>
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
