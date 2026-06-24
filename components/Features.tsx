import { Emblem } from "@/components/ui/Emblem";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { CouncilEngine } from "@/components/CouncilEngine";
import { DsBalance } from "@/components/DsBalance";

// Sourced from the brochures' "The edge" + Registry pages.
const FEATURES = [
  {
    icon: "timeframe",
    title: "Built for every timeframe",
    body: "Every metric is tuned and normalised to read any timeframe — the same corroborated read from the 1-minute scalp to the daily swing, not lone guesses.",
  },
  {
    icon: "registry",
    title: "Cross-referenced by the Registry",
    body: "Five of the six Systems report to one core. Every reading is checked against every other before a single mark is drawn. The systems agree, or you see nothing.",
  },
  {
    icon: "norepaint",
    title: "Zero repaints",
    body: "What you saw is what happened. Signals lock to the bar and never rewrite history — the chart you trade is the chart that was true.",
  },
  {
    icon: "nolag",
    title: "No lag, ever",
    body: "Heavy intelligence that never drags your chart. Every read is cross-referenced and rendered instantly, so the tape stays smooth even mid-session.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-12 sm:py-16">
      {/* Ambient ember glow — this is the section that should catch the eye. */}
      <div className="pointer-events-none absolute left-1/2 top-24 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-[#d99a3a]/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="The Signature"
          title="Signature Ember candles,"
          titleMuted="by DS Universe."
          intro="Ember reads the engine of the trend and re-colors every candle to match — burning bright and clean when a move has fuel, cooling to a smoky exhaust the moment it runs out. It feels the change before price itself does."
          className="mb-12 max-w-3xl"
        />

        {/* Hero — the annotated Ember chart, calling its own shots live. */}
        <Reveal>
          <figure className="relative overflow-hidden rounded-3xl border border-[#d99a3a]/20 bg-[#040406] shadow-glow">
            <div className="pointer-events-none absolute -inset-x-10 -top-24 h-56 bg-[#d99a3a]/15 opacity-60 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ember/ember-annotated.webp"
              alt="DS Ember coloring a chart green and orange with check and cross marks — every trend re-read live, zero repaints."
              width={1944}
              height={1117}
              loading="lazy"
              decoding="async"
              className="relative block w-full"
            />
            <figcaption className="relative border-t border-[#e3b24f]/[0.05] px-6 py-4 text-sm text-ink-gray">
              <span className="font-semibold text-ink-white">Ember in action.</span>{" "}
              It calls exhaustion, recognizes the shift, and warns you the trend is
              cooling — early, on the candle, with zero repaints.
            </figcaption>
          </figure>
        </Reveal>

        {/* Two-up: two before/after re-reads of the same tape. */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <GlassCard glow="ember" className="flex h-full flex-col overflow-hidden">
              <div className="grid grid-cols-2">
                <figure className="relative border-b border-r border-[#e3b24f]/[0.05]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ember/ember-before-2.webp"
                    alt="Raw candles flipping color on every small pullback through a trend."
                    width={2340}
                    height={1251}
                    loading="lazy"
                    decoding="async"
                    className="block w-full"
                  />
                  <figcaption className="absolute left-3 top-3 rounded-full bg-space-black/70 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ink-gray">
                    Before
                  </figcaption>
                </figure>
                <figure className="relative border-b border-[#e3b24f]/[0.05]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ember/ember-after-2.webp"
                    alt="The same chart with DS Ember holding one color per trend and flipping only at the real turn."
                    width={2332}
                    height={1256}
                    loading="lazy"
                    decoding="async"
                    className="block w-full"
                  />
                  <figcaption className="absolute left-3 top-3 rounded-full bg-[#d99a3a]/20 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-[#ffb986]">
                    After
                  </figcaption>
                </figure>
              </div>
              <div className="flex flex-col gap-2 p-6 sm:p-7">
                <h3 className="font-sans text-lg font-semibold text-ink-white">
                  One trend, one color.
                </h3>
                <p className="text-sm leading-relaxed text-ink-gray">
                  Raw candles flip on every wiggle — a red bar inside a clean uptrend
                  looks like trouble it isn&apos;t. Ember holds the trend&apos;s true
                  color and switches only at the genuine turn, so the direction stays
                  obvious and the top stops faking you out.
                </p>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <GlassCard glow="ember" className="flex h-full flex-col overflow-hidden">
              <div className="grid grid-cols-2">
                <figure className="relative border-b border-r border-[#e3b24f]/[0.05]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ember/ember-before-1.webp"
                    alt="A raw candlestick chart before DS Ember."
                    width={2267}
                    height={1218}
                    loading="lazy"
                    decoding="async"
                    className="block w-full"
                  />
                  <figcaption className="absolute left-3 top-3 rounded-full bg-space-black/70 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ink-gray">
                    Before
                  </figcaption>
                </figure>
                <figure className="relative border-b border-[#e3b24f]/[0.05]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ember/ember-after-1.webp"
                    alt="The same chart after DS Ember re-colors every candle to the trend's health."
                    width={2266}
                    height={1217}
                    loading="lazy"
                    decoding="async"
                    className="block w-full"
                  />
                  <figcaption className="absolute left-3 top-3 rounded-full bg-[#d99a3a]/20 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-[#ffb986]">
                    After
                  </figcaption>
                </figure>
              </div>
              <div className="flex flex-col gap-2 p-6 sm:p-7">
                <h3 className="font-sans text-lg font-semibold text-ink-white">
                  The same tape, re-read.
                </h3>
                <p className="text-sm leading-relaxed text-ink-gray">
                  Raw candles tell you where price went. Ember tells you the trend&apos;s
                  health, its exhaustion, and its turns — made obvious at a glance,
                  before the move shows its hand.
                </p>
              </div>
            </GlassCard>
          </Reveal>
        </div>

        {/* The MTF Engine — DS Council, under the Ember signature. */}
        <CouncilEngine />

        {/* DS Balance — the VWAP dealing-range read. */}
        <DsBalance />

        {/* The trust grid — the rest of the edge that earns trader attention. */}
        <div className="mt-10">
          <SectionHeading
            eyebrow="Why DS Universe"
            title="A clean chart"
            titleMuted="that earns its ink."
            intro="Accuracy you can lean on, speed you never feel, and a chart that gets out of the way the second you need it to."
            className="mb-10 max-w-3xl"
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FEATURES.map((f, i) => {
              return (
                <Reveal key={f.title} delay={(i % 2) * 0.08}>
                  <GlassCard className="flex h-full items-start gap-5 p-6 sm:p-8">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-space-violet/30 to-space-cyan/20 text-[#f4cd7a] ring-1 ring-[#e3b24f]/[0.06]">
                      <Emblem name={f.icon} size={24} strokeWidth={1.5} />
                    </span>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-sans text-lg font-semibold text-ink-white">
                        {f.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-ink-gray">
                        {f.body}
                      </p>
                    </div>
                  </GlassCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
