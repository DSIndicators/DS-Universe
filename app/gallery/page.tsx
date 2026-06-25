import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Slot } from "@/components/ui/Slot";

export const metadata: Metadata = {
  title: "Gallery — DS Universe",
  description:
    "The DS Universe gallery: one labelled capture per indicator across the Systems, Radars, Carepack and Crewmates suites.",
};

// One labelled slot per product, grouped by suite. `src` filled = matched gold
// capture; `src` omitted = blank drop-zone for Tom to fill (the label is the
// checklist item telling him which picture belongs there). The Carepack P&L is
// pulled out of the grid into its own exclusive showcase banner below.
type Cell = { label: string; src?: string };
type Group = { heading: string; blurb: string; cells: Cell[] };

const GROUPS: Group[] = [
  {
    heading: "DS Systems",
    blurb: "The six on-chart instruments — mapped on the DS Registry core.",
    cells: [
      { label: "Orbit", src: "/gallery/orbit.png" },
      { label: "Stars", src: "/gallery/stars.png" },
      { label: "Balance", src: "/gallery/balance.png" },
      { label: "Ember", src: "/gallery/ember.png" },
      { label: "Council", src: "/gallery/council.png" },
      { label: "Pulse", src: "/gallery/pulse.png" },
    ],
  },
  {
    heading: "DS Radars",
    blurb: "The three live-tape cockpits.",
    cells: [
      { label: "Pilots", src: "/gallery/pilots.png" },
      { label: "Sweeper", src: "/gallery/sweeper.png" },
      { label: "Beacon", src: "/gallery/beacon.png" },
    ],
  },
  {
    heading: "DS Carepack",
    blurb: "The finishing tools — discipline, math and markup. The P&L is the exclusive profit engine below.",
    cells: [
      { label: "Checklist", src: "/gallery/checklist.png" },
      { label: "Risk-Reward", src: "/gallery/riskreward.png" },
      { label: "Pen", src: "/gallery/pen.png" },
    ],
  },
  {
    heading: "DS Crewmates",
    blurb: "The free Tier-1 set.",
    cells: [
      { label: "BC", src: "/gallery/bc.png" },
      { label: "TL", src: "/gallery/tl.png" },
      { label: "SR", src: "/gallery/sr.png" },
    ],
  },
];

function GalleryCell({ cell }: { cell: Cell }) {
  if (!cell.src)
    return (
      <div className="aspect-[16/10]">
        <Slot label={cell.label} />
      </div>
    );
  return (
    <figure className="group relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#0a0806]/40 panel-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cell.src}
        alt={`DS ${cell.label}`}
        loading="lazy"
        decoding="async"
        className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <figcaption className="absolute left-3 top-3 rounded-full border border-[#e3b24f]/30 bg-black/55 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[#e3b24f]/90 backdrop-blur-sm">
        {cell.label}
      </figcaption>
    </figure>
  );
}

/** The exclusive DS P&L — a full-width premium showcase banner under the
 *  Carepack tools. Gold-framed real dashboard captures, DS Universe themed. */
function PnlExclusive() {
  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#ff9a3c]/25 bg-gradient-to-br from-[#0e0b07] via-[#0a0908] to-[#0a0908] p-6 sm:p-8 panel-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#ff9a3c]/15 blur-3xl"
      />
      <div className="relative grid gap-7 lg:grid-cols-[0.85fr_1.5fr] lg:items-center">
        {/* Identity */}
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#ff9a3c]/40 bg-[#ff9a3c]/10 px-2.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-[#ffb986]">
            <Sparkles size={12} /> Exclusive
          </span>
          <h3 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-ink-white">DS </span>
            <span className="text-[#ffb986] [text-shadow:0_0_24px_rgba(255,154,60,0.4)]">
              P&amp;L
            </span>
          </h3>
          <p className="text-sm leading-relaxed text-ink-gray sm:text-base">
            The profit engine — every trade you&apos;ve taken, rendered live in
            gold. A living equity curve, a green-and-red P&amp;L calendar, win rate,
            profit factor and R-multiple, all from one CSV.
          </p>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-gray/55">
            Included with DS Systems &amp; DS Carepack · built for the comfort.
          </p>
        </div>

        {/* The real dashboards, gold-framed. */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { src: "/gallery/pnl-overview.png", label: "Overview" },
            { src: "/gallery/pnl-calendar.png", label: "P&L calendar" },
          ].map((s) => (
            <figure
              key={s.label}
              className="group relative overflow-hidden rounded-xl border border-[#ff9a3c]/20 bg-[#040406] shadow-[0_24px_60px_-30px_rgba(255,154,60,0.45)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt={`DS P&L — ${s.label}`}
                loading="lazy"
                decoding="async"
                className="block w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <figcaption className="absolute left-3 top-3 rounded-full border border-[#ff9a3c]/30 bg-black/55 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[#ffb986] backdrop-blur-sm">
                {s.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        {/* Static gold depth backdrop + dimmed stars. */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -left-40 top-[-10%] h-[42rem] w-[42rem] rounded-full bg-[#e3b24f]/[0.10] blur-[150px]" />
          <div className="absolute -right-40 top-1/3 h-[38rem] w-[38rem] rounded-full bg-[#c4922f]/[0.08] blur-[150px]" />
          <div className="starfield absolute inset-0 opacity-[0.05]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% -10%, rgba(227,178,79,0.10), transparent 55%), radial-gradient(100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        </div>

        <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-24 sm:px-8 sm:pt-28">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-ink-gray transition-colors hover:text-ink-white"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <SectionHeading
            eyebrow="The Gallery"
            title="Every indicator,"
            titleMuted="one slot each."
            intro="One labelled space per instrument across all four suites. Each gold capture sits in its own slot — empty slots are still waiting for their picture."
          />

          <div className="mt-14 flex flex-col gap-16">
            {GROUPS.map((g) => (
              <div key={g.heading}>
                <div className="mb-6 flex flex-col gap-2">
                  <h3 className="font-sans text-2xl font-bold tracking-tight text-ink-white sm:text-3xl">
                    {g.heading}
                  </h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-ink-gray sm:text-base">
                    {g.blurb}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {g.cells.map((c) => (
                    <GalleryCell key={c.label} cell={c} />
                  ))}
                </div>

                {/* The exclusive P&L banner closes the Carepack row. */}
                {g.heading === "DS Carepack" && <PnlExclusive />}
              </div>
            ))}

            {/* DS Playbooks — the two trading guides, shown as their own premium
                banner panel (included free with the DS Systems suite). */}
            <div>
              <div className="mb-6 flex flex-col gap-2">
                <h3 className="font-sans text-2xl font-bold tracking-tight text-ink-white sm:text-3xl">
                  DS Playbooks
                </h3>
                <p className="max-w-2xl text-sm leading-relaxed text-ink-gray sm:text-base">
                  Two complete trading guides — the Smart Money Playbook and
                  Breakout Patterns. Included free with the DS Systems suite.
                </p>
              </div>
              <figure className="group relative overflow-hidden rounded-2xl border border-[#e3b24f]/15 bg-[#0a0806]/40 shadow-[0_24px_60px_-30px_rgba(227,178,79,0.4)] panel-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/suite/guides.png"
                  alt="The DS Universe Playbooks — the Smart Money Playbook and Breakout Patterns, 149 pages, every chart rendered from the real DS engine."
                  loading="lazy"
                  decoding="async"
                  className="block w-full transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <figcaption className="absolute left-3 top-3 rounded-full border border-[#e3b24f]/30 bg-black/55 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[#e3b24f]/90 backdrop-blur-sm">
                  Playbooks
                </figcaption>
              </figure>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
