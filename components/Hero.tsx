"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { Planet } from "@/components/ui/Planet";

// The four suites, flagship first — each its own premium accent + soft glow.
const SUITES = [
  {
    name: "DS Systems",
    color: "#b074ff",
    items: "Orbit · Stars · Balance · Ember · Council · Pulse",
  },
  {
    name: "DS Radars",
    color: "#5fd4e0",
    items: "Pilots · Sweeper · Everguard",
  },
  {
    name: "DS Crewmates",
    color: "#2dd4bf",
    items: "BC · TL · SR",
  },
  {
    name: "DS Carepack",
    color: "#ff9a3c",
    items: "Checklist · Risk-Reward · Pen · P&L",
  },
];

export function Hero() {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const, delay },
        };

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      {/* Atmospheric banner wash (blurred, low opacity) */}
      <Image
        src="/brand/banner.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="pointer-events-none select-none object-cover object-right opacity-40 blur-[2px]"
      />
      {/* Starfield + legibility veil */}
      <div className="starfield absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-hero-veil" />
      <div className="absolute inset-0 bg-gradient-to-t from-space-black via-transparent to-space-black/60" />

      {/* Planet bleeding in from the right (desktop) */}
      <div className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 lg:block xl:-right-10">
        <Planet size={620} />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="flex flex-col gap-1.5">
            {SUITES.map((s, i) => (
              <motion.p
                key={s.name}
                {...rise(0.05 + i * 0.07)}
                className="font-mono text-[0.6rem] uppercase tracking-[0.2em] sm:text-[0.66rem]"
              >
                <span
                  className="font-semibold"
                  style={{ color: s.color, textShadow: `0 0 14px ${s.color}66` }}
                >
                  {s.name}
                </span>
                <span className="text-ink-gray/40"> : </span>
                <span className="text-ink-gray/80">{s.items}</span>
              </motion.p>
            ))}
          </div>

          <motion.h1
            {...rise(0.15)}
            className="mt-6 font-sans text-6xl font-extrabold leading-[0.92] tracking-tight sm:text-7xl md:text-8xl"
          >
            <span className="text-ink-white">DS</span>{" "}
            <span className="text-ink-gray">UNIVERSE</span>
          </motion.h1>

          <motion.div
            {...rise(0.28)}
            className="mt-7 h-px w-40 bg-gradient-to-r from-accent-teal to-transparent"
          />

          <motion.p
            {...rise(0.34)}
            className="label-caps mt-5 !text-sm tracking-[0.3em]"
          >
            Futures Intelligence · Every Timeframe
          </motion.p>

          <motion.p
            {...rise(0.42)}
            className="mt-5 max-w-xl text-base leading-relaxed text-ink-gray sm:text-lg"
          >
            Indicators, radars, and chart tools — one cross-referenced system,
            built for serious traders.
          </motion.p>

          <motion.div
            {...rise(0.5)}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <GlowButton href="#pricing">
              Get Access <ArrowRight size={16} />
            </GlowButton>
            <GlowButton href="#indicators" variant="ghost">
              View Indicators
            </GlowButton>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-ink-gray/60">
        <ChevronDown size={22} className="animate-float" />
      </div>
    </section>
  );
}
