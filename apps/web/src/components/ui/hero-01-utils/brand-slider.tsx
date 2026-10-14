"use client";

import { Marquee } from "@/components/ui/marquee";

const PARTNER_NAMES = [
  "MetroHome",
  "FreshFix",
  "GlowLab",
  "ProServe",
  "UrbanCare",
  "SwiftBook",
] as const;

function PartnerWordmark({ name }: { name: string }) {
  return (
    <div className="mx-6 flex h-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 px-8 lg:mx-10">
      <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-foreground">
        {name}
      </span>
    </div>
  );
}

export default function BrandSlider() {
  return (
    <section
      aria-label="Partner brands"
      className="relative z-10 border-b border-border bg-background pb-10 pt-2"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="relative flex justify-center py-2 text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="hidden h-px w-24 bg-gradient-to-l from-border to-transparent md:block lg:w-40" />
              <p className="max-w-md px-4 text-sm font-normal text-muted-foreground">
                Preferred by teams and households across our partner network
              </p>
              <div className="hidden h-px w-24 bg-gradient-to-r from-border to-transparent md:block lg:w-40" />
            </div>
          </div>

          <div className="overflow-hidden py-2">
            <Marquee pauseOnHover className="[--duration:28s] p-0">
              {PARTNER_NAMES.map((name) => (
                <PartnerWordmark key={name} name={name} />
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
}
