"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PrismSectionHeading } from "@/components/landing/prism/prism-ui";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { faqItems } from "@/lib/data/landing-mock";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-28 border-t border-border bg-background py-20 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <LandingReveal>
          <PrismSectionHeading
            align="center"
            eyebrow="Support"
            title="Frequently asked"
            titleAccent="questions"
            description="Everything you need to know before your first booking."
          />
        </LandingReveal>

        <LandingReveal delay={0.12}>
          <Accordion type="single" collapsible className="mt-10 w-full">
            {faqItems.map((item, i) => (
              <AccordionItem key={item.question} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-foreground/80">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </LandingReveal>
      </div>
    </section>
  );
}
