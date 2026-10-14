"use client";

import { Star } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";
import { GlassPanel, PrismSectionHeading } from "@/components/landing/prism/prism-ui";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { testimonials } from "@/lib/data/landing-mock";

function ReviewCard({ quote, author, role, rating }: (typeof testimonials)[0]) {
  return (
    <GlassPanel className="mx-3 flex h-full min-h-[220px] w-[min(100%,340px)] shrink-0 flex-col p-6 sm:w-[340px]">
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="font-medium text-foreground">{author}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: rating }).map((_, j) => (
            <Star key={j} className="h-3.5 w-3.5 fill-amber-400/90 text-amber-400/90" />
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}

export function ReviewsSection() {
  const loop = [...testimonials, ...testimonials];

  return (
    <section id="reviews" className="relative scroll-mt-28 overflow-hidden bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <PrismSectionHeading
            align="center"
            eyebrow="Reviews"
            title="Loved by customers"
            titleAccent="& providers"
          />
        </LandingReveal>

        <LandingReveal delay={0.15} className="mt-12">
          <div className="relative -mx-4 sm:-mx-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />
            <Marquee pauseOnHover className="[--duration:35s] py-2">
              {loop.map((t, i) => (
                <ReviewCard key={`${t.id}-${i}`} {...t} />
              ))}
            </Marquee>
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
