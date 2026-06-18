import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

/**
 * DS P&L — the companion performance dashboard. Import a NinjaTrader Trade
 * Performance CSV and it renders YOUR OWN fills as a living dashboard. This
 * is a feature read of your imported results, not a performance claim about
 * the indicators — copy stays claim-clean; the dollar figures live inside the
 * product screenshots (owner-approved imagery).
 */
const SHOTS = [
  {
    src: "/pnl/overview.webp",
    w: 1564,
    h: 836,
    label: "The overview",
    caption:
      "Cumulative net P&L front and centre, with a live equity curve, your win/loss balance and per-instrument breakdowns — your whole account in one glance.",
  },
  {
    src: "/pnl/calendar.webp",
    w: 1564,
    h: 915,
    label: "The P&L calendar",
    caption:
      "Every day colour-graded — green for gains, red for the ones that got away — so the rhythm of your month reads in a heartbeat.",
  },
];

export function DsPnl() {
  return (
    <section id="pnl" className="relative scroll-mt-24 py-24 sm:py-32">
      {/* soft ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-accent-teal/10 blur-[100px]" />

      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal className="flex flex-col gap-4 text-center">
          <Eyebrow className="self-center">DS P&amp;L · Performance Intelligence</Eyebrow>
          <h2 className="font-sans text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            <span className="text-ink-white">Your trades.</span>{" "}
            <span className="text-ai">One clear read.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-ink-gray sm:text-lg">
            Drop in a NinjaTrader export and DS P&amp;L turns your own fills into a
            living performance dashboard — cumulative P&amp;L, your win/loss balance,
            streaks and per-instrument breakdowns, with a day-by-day calendar. No spreadsheets,
            no formulas, and nothing leaves your machine.
          </p>
        </Reveal>

        <div className="mt-12 flex flex-col gap-8">
          {SHOTS.map((s) => (
            <Reveal key={s.src}>
              <figure className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#040406] shadow-glow">
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
                <figcaption className="relative p-5 sm:p-6">
                  <h3 className="font-sans text-base font-semibold text-ink-white">
                    {s.label}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-gray">
                    {s.caption}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 flex justify-center">
          <Link
            href="/showcase#pnl-showcase"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-ink-white transition-colors hover:bg-white/[0.08]"
          >
            See the full P&amp;L showcase <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
