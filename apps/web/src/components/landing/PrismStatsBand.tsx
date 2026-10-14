"use client";

import { NumberTicker } from "@/components/ui/NumberTicker";
import { GlassPanel } from "@/components/landing/prism/prism-ui";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { landingStats } from "@/lib/data/landing-mock";

export function PrismStatsBand() {
  return (
    <section className="relative z-10 border-y border-border bg-background py-16 md:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-5 px-4 sm:px-6 md:grid-cols-4 md:gap-6">
        {landingStats.map((stat, i) => (
          <LandingReveal key={stat.label} delay={i * 0.08}>
            <GlassPanel className="landing-stat-card px-6 py-8 text-center md:px-7 md:py-10">
              <p className="text-3xl font-medium tabular-nums text-foreground md:text-4xl">
                <NumberTicker
                  value={stat.value}
                  decimalPlaces={stat.value % 1 === 0 ? 0 : 1}
                />
                {stat.suffix}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
            </GlassPanel>
          </LandingReveal>
        ))}
      </div>
    </section>
  );
}
