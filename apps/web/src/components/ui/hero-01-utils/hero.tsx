"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import Image from "next/image";
import {
  BlurInWords,
  PrismAmbient,
  instrumentSerif,
} from "@/components/landing/prism/prism-ui";

export type AvatarList = {
  image: string;
};

type HeroSectionProps = {
  avatarList: AvatarList[];
};

export default function HeroSection({ avatarList }: HeroSectionProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <section className="relative overflow-x-hidden bg-background pb-10 pt-8 md:pb-14 md:pt-12 lg:min-h-[calc(100vh-8rem)]">
      <PrismAmbient />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6">
        <p className="prism-fade-up rounded-full border border-border bg-card/60 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm">
          Verified providers · Transparent pricing · Same-day slots
        </p>

        <h1 className="mt-8 max-w-4xl text-balance text-4xl font-medium leading-[1.08] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[4.5rem]">
          <BlurInWords text="Book local pros with" delayStep={0.06} />
          <span className={`${instrumentSerif.className} text-foreground/95`}>
            {" "}
            <BlurInWords text="confidence" delayStep={0.08} />
          </span>
        </h1>

        <p
          className="prism-fade-up mt-6 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg"
          style={{ animationDelay: "0.35s" }}
        >
          Compare ratings, prices, and availability in one place — from home cleaning to repairs
          and beauty. No endless calls, no guesswork.
        </p>

        <form
          onSubmit={onSearch}
          className="prism-fade-up mt-10 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-card/80 p-2 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center"
          style={{ animationDelay: "0.45s" }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you need?"
              className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or area"
              className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button type="submit" className="h-11 rounded-xl px-6">
            Search
          </Button>
        </form>

        <div
          className="prism-fade-up mt-10 flex flex-col items-center gap-8 md:flex-row md:gap-12"
          style={{ animationDelay: "0.55s" }}
        >
          <Button
            className="group relative h-12 overflow-hidden rounded-full bg-foreground p-1 ps-6 pe-14 text-sm font-medium text-background transition-all duration-500 hover:opacity-90 hover:ps-14 hover:pe-6"
            asChild
          >
            <a href="#services">
              <span className="relative z-10">Explore services</span>
              <span className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                <ArrowUpRight size={16} />
              </span>
            </a>
          </Button>

          <div className="flex items-center gap-4">
            <ul className="flex flex-row items-center">
              {avatarList.map((avatar, index) => (
                <li key={index} className="-mr-2">
                  <Image
                    src={avatar.image}
                    alt="Customer"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full border-2 border-background object-cover"
                  />
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground sm:text-sm">Trusted by 12,000+ bookings</p>
          </div>
        </div>
      </div>
    </section>
  );
}
