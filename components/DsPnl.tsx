import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

/**
 * DS P&L — the companion performance dashboard. Import a NinjaTrader Trade
 * Performance CSV and it renders YOUR OWN fills as a living dashboard. This
 * is a feature read of your imported results, not a performance claim about
 * the indicators — copy stays claim-clean; the dollar figures live inside the
 * product screenshots (owner-approved imagery). The two shots sit side by side
 * with a single audience summary below the pair.
 */
const SHOTS = [
  { src: "/pnl/overview.webp", w: 1564, h: 836, label: "The overview" },
  { src: "/pnl/calendar.webp", w: 1564, h: 915, label: "The P&L calendar" },
];

export function DsPnl() {
  return (
    <section id="pnl" className="relative scroll-mt-24 py-24 sm:py-32">
      {/* soft ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-accent-teal/10 blur-[100px]" />

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Reveal className="flex flex-col gap-4 text-center">
          <Eyebrow className="self-center">DS P&amp;L · Performance Intelligence</Eyebrow>
          <h2 className="font-sans text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            <span className="text-ink-white">Your trades.</span>{" "}
            <span className="text-ai">One clear read.</span>
          </h2>
        </Reveal>

        {/* The two shots, side by side (stack on mobile). */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SHOTS.map((s) => (
            <Reveal key={s.src}>
              <figure className="relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#040406] shadow-glow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={`DS P&L — ${s.label}`}
                  width={s.w}
                  height={s.h}
                  loading="lazy"
                  decoding="async"
                  className="block w-full border-b border-white/[0.06]"
                />
                <figcaption className="px-4 py-3 text-center font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-gray/80">
                  {s.label}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* One audience summary below the pair. */}
        <Reveal className="mt-8">
          <p className="mx-auto max-w-2xl text-center text-base leading-relaxed text-ink-gray sm:text-lg">
            DS P&amp;L turns a single NinjaTrader export into your own trading, made
            legible — cumulative P&amp;L, your win/loss balance, streaks and
            per-instrument breakdowns, with a day-by-day calendar. One file in and you
            see what&apos;s working, what&apos;s leaking, and where your edge really
            lives. No spreadsheets, no formulas, and nothing leaves your machine.
          </p>
        </Reveal>

        <Reveal className="mt-8 flex justify-center">
          <Link
            href="/showcase#pnl"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-ink-white transition-colors hover:bg-white/[0.08]"
          >
            See the full P&amp;L showcase <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
