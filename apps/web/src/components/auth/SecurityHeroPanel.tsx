"use client";

import React from "react";
import { ShieldCheck, Lock, KeyRound, Server } from "lucide-react";
import { Float } from "../ui/Float";
import { FloatingCard } from "../ui/FloatingCard";
import { InteractiveGridPattern } from "../ui/InteractiveGridPattern";
import { ParticlesBg } from "../ui/ParticlesBg";
import { NumberTicker } from "../ui/NumberTicker";

export function SecurityHeroPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-brand-dark min-h-full">
      {/* Background Interactive Lighting Grid */}
      <InteractiveGridPattern
        className="opacity-40"
        squaresClassName="hover:fill-indigo-500/30"
      />

      {/* Floating Particles Drift */}
      <ParticlesBg />

      {/* Radial Aurora Glow Pulse */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      {/* Top Branding / Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <span className="text-white font-bold tracking-tight text-xl">
          Service<span className="text-indigo-400">Hub</span>
        </span>
      </div>

      {/* Center Hero Badge & Typography */}
      <div className="relative z-10 my-auto py-12 max-w-lg">
        {/* Floating Glowing Shield Badge */}
        <Float speed={5} amplitude={[0, 10, 4]} rotationRange={[2, 3, 1]}>
          <div className="relative mx-auto w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/20 border border-indigo-400/40 border-t-white/30 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            {/* Ambient Pulsing Glow Ring */}
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-sm pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
          </div>
        </Float>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center tracking-tight leading-tight">
          Secure Access <br />
          <span className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            for Everyone
          </span>
        </h1>

        <p className="mt-5 text-slate-300 text-center text-base md:text-lg leading-relaxed max-w-md mx-auto font-normal">
          Join the trusted service network. Experience effortless authentication
          with multi-layer credential safety and instant verification.
        </p>

        {/* 3 Desynchronized Floating Metric Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {/* Pill 1: 99.9% Uptime */}
          <FloatingCard
            rotateDepth={12}
            translateDepth={16}
            timeOffset={0}
            className="rounded-2xl"
          >
            <div className="px-5 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 border-t-white/20 backdrop-blur-md shadow-xl shadow-black/40 flex flex-col items-center justify-center min-w-[120px] transition-colors hover:border-indigo-400/60">
              <span className="text-indigo-400 font-bold text-lg tracking-tight flex items-center gap-1">
                <NumberTicker value={99.9} decimalPlaces={1} />%
              </span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Uptime
              </span>
            </div>
          </FloatingCard>

          {/* Pill 2: MFA Standard */}
          <FloatingCard
            rotateDepth={14}
            translateDepth={18}
            timeOffset={0.35}
            className="rounded-2xl"
          >
            <div className="px-5 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 border-t-white/20 backdrop-blur-md shadow-xl shadow-black/40 flex flex-col items-center justify-center min-w-[120px] transition-colors hover:border-indigo-400/60">
              <span className="text-indigo-400 font-bold text-lg tracking-tight flex items-center gap-1">
                MFA
              </span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Standard
              </span>
            </div>
          </FloatingCard>

          {/* Pill 3: 256-bit Encryption */}
          <FloatingCard
            rotateDepth={10}
            translateDepth={14}
            timeOffset={0.7}
            className="rounded-2xl"
          >
            <div className="px-5 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 border-t-white/20 backdrop-blur-md shadow-xl shadow-black/40 flex flex-col items-center justify-center min-w-[120px] transition-colors hover:border-indigo-400/60">
              <span className="text-indigo-400 font-bold text-lg tracking-tight flex items-center gap-1">
                256-bit
              </span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Encryption
              </span>
            </div>
          </FloatingCard>
        </div>
      </div>

      {/* Footer Security Watermark */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          SOC2 & ISO 27001 Certified Infrastructure
        </span>
        <span>© 2026 Identity & Access</span>
      </div>
    </div>
  );
}
