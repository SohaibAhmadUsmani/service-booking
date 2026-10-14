"use client";

import { useRouter } from "next/navigation";
import { Briefcase, TrendingUp, Users } from "lucide-react";
import { GlassPanel, PrismSectionHeading } from "@/components/landing/prism/prism-ui";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { PillCtaButton } from "@/components/landing/PillCtaButton";

const perks = [
  { icon: Users, title: "Reach new clients", text: "Show up in search and category browse across your city." },
  { icon: TrendingUp, title: "Grow your business", text: "Dashboard tools for services, calendar, and earnings." },
  { icon: Briefcase, title: "You stay in control", text: "Set prices, availability, and policies on your terms." },
];

export function BecomeProviderSection() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-20 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <LandingReveal>
            <PrismSectionHeading
              eyebrow="For professionals"
              title="Become a"
              titleAccent="provider"
              description="Join hundreds of professionals growing with ServiceBook. List services, manage bookings, and get paid — all in one place."
            />
            <div className="mt-8 flex flex-wrap gap-4">
              <PillCtaButton onClick={() => router.push("/register")}>Start earning</PillCtaButton>
              <PillCtaButton href="/provider" variant="outline">
                Provider dashboard
              </PillCtaButton>
            </div>
          </LandingReveal>

          <div className="space-y-4">
            {perks.map((perk, i) => (
              <LandingReveal key={perk.title} delay={i * 0.1}>
                <GlassPanel className="flex gap-4 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    <perk.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{perk.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{perk.text}</p>
                  </div>
                </GlassPanel>
              </LandingReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
