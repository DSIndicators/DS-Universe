"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { Planet } from "@/components/ui/Planet";

// The suites, flagship first. Each has its own gold-family accent; DS Systems
// is the premium flagship and is badged + brightest.
const SUITES = [
  {
    name: "DS Systems",
    color: "#ffe7b0",
    items: "Orbit · Stars · Balance · Ember · Council · Pulse",
    flagship: true,
  },
  {
    name: "DS Radars",
    color: "#f4cd7a",
    items: "Pilots · Sweeper · Beacon",
  },
  {
    name: "DS Crewmates",
    color: "#cfa450",
    items: "BC · TL · SR",
  },
  {
    name: "DS Carepack",
    color: "#d99a3a",
    items: "Checklist · Risk-Reward · Pen · P&L",
  },
];

export function Hero() {
  const reduce = useReducedMotion();

  // Only mount the heavy raymarched orb on desktop. On phones/tablets it's
  // hidden anyway (lg:block), so skipping the WebGL canvas entirely keeps mobile
  // light and lag-free.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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
      {/* No veil - the background stays one uniform space-black (set on body)
          with the global starfield. Headline sits on the dark left side; the orb
          is far right, so no wash is needed and there are no uneven shade bands. */}

      {/* Lensed black hole - large, pulled toward center (desktop) */}
      <div className="pointer-events-none absolute right-[-2%] top-1/2 hidden -translate-y-1/2 lg:block xl:right-[3%]">
        {isDesktop && <Planet size={1000} />}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          {/* Gold astronaut emblem - above the suite list, pulled up tight */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            {...rise(0)}
            src="/brand/astronaut.png"
            alt="DS Universe"
            className="mb-8 h-auto w-[clamp(160px,17vw,230px)] select-none"
          />
          <div className="flex flex-col gap-1.5">
            {SUITES.map((s, i) => (
              <motion.p
                key={s.name}
                {...rise(0.05 + i * 0.07)}
                className="font-mono text-[0.6rem] uppercase tracking-[0.2em] sm:text-[0.66rem]"
              >
                <span
                  className={s.flagship ? "font-bold" : "font-semibold"}
                  style={{
                    color: s.color,
                    textShadow: `0 0 ${s.flagship ? 18 : 12}px ${s.color}${s.flagship ? "88" : "55"}`,
                  }}
                >
                  {s.name}
                </span>
                {s.flagship && (
                  <span
                    className="ml-2 border border-[#ffe7b0]/40 px-1.5 py-0.5 text-[0.5rem] font-bold tracking-[0.18em] text-[#ffe7b0]"
                    style={{ boxShadow: "0 0 14px rgba(255,231,176,0.25)" }}
                  >
                    FLAGSHIP
                  </span>
                )}
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
            <span className="text-gold [text-shadow:0_0_40px_rgba(227,178,79,0.35)]">
              UNIVERSE
            </span>
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
            Quant-Grade indicators, radars, and chart tools, built for serious
            traders.
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
