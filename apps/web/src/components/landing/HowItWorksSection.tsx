"use client";

import { Search, CalendarCheck, ShieldCheck } from "lucide-react";
import { GlassPanel, PrismSectionHeading } from "@/components/landing/prism/prism-ui";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { howItWorks } from "@/lib/data/landing-mock";

const stepIcons = [Search, CalendarCheck, ShieldCheck];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-28 overflow-hidden border-y border-border bg-background py-20 md:py-24"
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <PrismSectionHeading
            align="center"
            eyebrow="Process"
            title="How it"
            titleAccent="works"
            description="Three simple steps from search to confirmed booking."
          />
        </LandingReveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {howItWorks.map((item, i) => {
            const Icon = stepIcons[i] ?? Search;
            return (
              <LandingReveal key={item.step} delay={i * 0.12}>
                <GlassPanel className="landing-service-card h-full p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
                      {item.step}
                    </span>
                    <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </GlassPanel>
              </LandingReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
