"use client";

import React from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { InteractiveGridPattern } from "../ui/InteractiveGridPattern";
import { ParticlesBg } from "../ui/ParticlesBg";
import { NumberTicker } from "../ui/NumberTicker";

export function SecurityHeroPanel() {
  return (
    <div className="relative flex flex-col justify-between p-8 xl:p-12 overflow-hidden bg-brand-dark h-full w-full select-none">
      {/* Background Interactive Lighting Grid */}
      <InteractiveGridPattern
        className="opacity-40"
        squaresClassName="hover:fill-indigo-500/30"
      />

      {/* Floating Particles Drift */}
      <ParticlesBg />

      {/* Centered Radial Aurora Glow Pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      {/* Top Branding / Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <span className="text-white font-bold tracking-tight text-xl">
          Service<span className="text-indigo-400">Hub</span>
        </span>
      </div>

      {/* Center Hero Badge & Typography (Strict Horizontal & Vertical Center Symmetry) */}
      <div className="relative z-10 my-auto py-8 w-full max-w-lg mx-auto flex flex-col items-center text-center">
        {/* Centered Glowing Shield Badge (Rock-solid, no random floating displacement) */}
        <div className="relative mx-auto w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-purple-600/20 border border-indigo-400/35 border-t-white/30 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-indigo-500/25">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/15 blur-md pointer-events-none" />
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-inner">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
        </div>

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

        {/* 3 Perfectly Symmetrical Metric Cards in Symmetrical 3-Column Grid */}
        <div className="mt-10 grid grid-cols-3 gap-3.5 w-full">
          {/* Card 1: 99.9% Uptime */}
          <div className="px-4 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 border-t-white/20 backdrop-blur-md shadow-xl shadow-black/40 flex flex-col items-center justify-center transition-all duration-200 hover:border-indigo-400/60 hover:bg-slate-800/80 group">
            <span className="text-indigo-400 font-bold text-lg tracking-tight flex items-center gap-0.5 group-hover:text-indigo-300 transition-colors">
              <NumberTicker value={99.9} decimalPlaces={1} />%
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Uptime
            </span>
          </div>

          {/* Card 2: MFA Standard */}
          <div className="px-4 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 border-t-white/20 backdrop-blur-md shadow-xl shadow-black/40 flex flex-col items-center justify-center transition-all duration-200 hover:border-indigo-400/60 hover:bg-slate-800/80 group">
            <span className="text-indigo-400 font-bold text-lg tracking-tight group-hover:text-indigo-300 transition-colors">
              MFA
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Standard
            </span>
          </div>

          {/* Card 3: 256-bit Encryption */}
          <div className="px-4 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 border-t-white/20 backdrop-blur-md shadow-xl shadow-black/40 flex flex-col items-center justify-center transition-all duration-200 hover:border-indigo-400/60 hover:bg-slate-800/80 group">
            <span className="text-indigo-400 font-bold text-lg tracking-tight group-hover:text-indigo-300 transition-colors">
              256-bit
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Encryption
            </span>
          </div>
        </div>
      </div>

      {/* Footer Security Watermark */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium pt-4 w-full">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          SOC2 & ISO 27001 Certified Infrastructure
        </span>
        <span>© 2026 Identity & Access</span>
      </div>
    </div>
  );
}
