"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { InteractiveGridPattern } from "@/components/ui/InteractiveGridPattern";
import { ParticlesBg } from "@/components/ui/ParticlesBg";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { landingStats } from "@/lib/data/landing-mock";

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden bg-brand-dark pb-20 pt-12 text-white sm:pb-28 sm:pt-16">
      <BackgroundBeams />
      <ParticlesBg count={40} />
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <InteractiveGridPattern className="opacity-60" squares={[24, 16]} />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge variant="glow" className="mb-6 px-4 py-1.5 text-sm">
            Premium local services, one tap away
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Book trusted pros for{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
              every part of life
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-slate-400 sm:text-lg">
            Search by service or location, compare ratings and prices, and schedule in minutes —
            no phone tag, no guesswork.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          onSubmit={handleSearch}
          className="relative mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-indigo-500/10 backdrop-blur-md sm:p-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you need? e.g. cleaning, AC repair"
                className="h-12 border-white/10 bg-brand-cardDark pl-10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-400"
              />
            </div>
            <div className="relative flex-1 sm:max-w-[220px]">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or area"
                className="h-12 border-white/10 bg-brand-cardDark pl-10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-400"
              />
            </div>
            <ShimmerButton
              type="submit"
              className="h-12 min-w-[140px] bg-indigo-500 px-6 text-white hover:bg-indigo-400"
            >
              Search
            </ShimmerButton>
          </div>
          <p className="mt-3 px-2 text-left text-xs text-slate-500">
            Popular:{" "}
            {["Home cleaning", "Salon at home", "Electrician"].map((term) => (
              <button
                key={term}
                type="button"
                className="mr-2 text-indigo-300/90 underline-offset-2 hover:underline"
                onClick={() => setQuery(term)}
              >
                {term}
              </button>
            ))}
          </p>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {landingStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center backdrop-blur-sm"
            >
              <p className="text-2xl font-bold text-white sm:text-3xl">
                <NumberTicker value={stat.value} decimalPlaces={stat.value % 1 === 0 ? 0 : 1} />
                {stat.suffix}
              </p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/categories"
            className="text-sm text-indigo-300 transition-colors hover:text-indigo-200"
          >
            Browse all categories →
          </Link>
        </div>
      </div>
    </section>
  );
}
