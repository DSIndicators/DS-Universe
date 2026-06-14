import { Crosshair, Zap, Layers, EyeOff } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { CouncilEngine } from "@/components/CouncilEngine";

// Sourced from the brochures' "The edge" + Registry pages.
const FEATURES = [
  {
    icon: Crosshair,
    title: "Built for intraday",
    body: "Every metric is tuned and normalised for the intraday trader — corroborated reads across timeframes, not lone guesses.",
  },
  {
    icon: Layers,
    title: "Cross-referenced by the Registry",
    body: "Nine systems report to one core. Every reading is checked against every other before a single mark is drawn. The systems agree, or you see nothing.",
  },
  {
    icon: EyeOff,
    title: "Zero repaints",
    body: "What you saw is what happened. Signals lock to the bar and never rewrite history — the chart you trade is the chart that was true.",
  },
  {
    icon: Zap,
    title: "No lag, ever",
    body: "Heavy intelligence that never drags your chart. Every read is cross-referenced and rendered instantly, so the tape stays smooth even mid-session.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-24 sm:py-32">
      {/* Ambient ember glow — this is the section that should catch the eye. */}
      <div className="pointer-events-none absolute left-1/2 top-24 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-[#ff7a2f]/10 blur-[130px]" />

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
          <figure className="relative overflow-hidden rounded-3xl border border-[#ff7a2f]/20 bg-[#040406] shadow-glow">
            <div className="pointer-events-none absolute -inset-x-10 -top-24 h-56 bg-[#ff7a2f]/15 opacity-60 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ember/ember-annotated.webp"
              alt="DS Ember coloring an intraday chart — calling out exhaustion early, recognizing a trend shift, and warning 'getting brighter, careful' before the move turns."
              width={2085}
              height={1171}
              loading="lazy"
              decoding="async"
              className="relative block w-full"
            />
            <figcaption className="relative border-t border-white/[0.06] px-6 py-4 text-sm text-ink-gray">
              <span className="font-semibold text-ink-white">Ember in action.</span>{" "}
              It calls exhaustion, recognizes the shift, and warns you the trend is
              cooling — early, on the candle, with zero repaints.
            </figcaption>
          </figure>
        </Reveal>

        {/* Two-up: intelligent zones + the before/after re-read. */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <GlassCard glow="ember" className="flex h-full flex-col overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ember/zones-you-can-trust.webp"
                alt="DS Universe intelligent zones — MTF, multi-layered support and resistance with confidence scores, not messy lines."
                width={2263}
                height={1222}
                loading="lazy"
                decoding="async"
                className="block w-full border-b border-white/[0.06]"
              />
              <div className="flex flex-col gap-2 p-6 sm:p-7">
                <h3 className="font-sans text-lg font-semibold text-ink-white">
                  Intelligent zones — not just messy lines on a chart.
                </h3>
                <p className="text-sm leading-relaxed text-ink-gray">
                  Multi-timeframe, multi-layered support &amp; resistance, each one
                  confidence-scored. Untested levels start humble and earn their
                  rating through real interaction — zones you can actually trust,
                  drawn only when the systems agree.
                </p>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <GlassCard glow="ember" className="flex h-full flex-col overflow-hidden">
              <div className="grid grid-cols-2">
                <figure className="relative border-b border-r border-white/[0.06]">
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
                <figure className="relative border-b border-white/[0.06]">
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
                  <figcaption className="absolute left-3 top-3 rounded-full bg-[#ff7a2f]/20 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-[#ffb986]">
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

        {/* The trust grid — the rest of the edge that earns trader attention. */}
        <div className="mt-16">
          <SectionHeading
            eyebrow="Why DS Universe"
            title="A clean chart"
            titleMuted="that earns its ink."
            intro="Accuracy you can lean on, speed you never feel, and a chart that gets out of the way the second you need it to."
            className="mb-10 max-w-3xl"
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={(i % 2) * 0.08}>
                  <GlassCard className="flex h-full items-start gap-5 p-6 sm:p-8">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-space-violet/30 to-space-cyan/20 text-space-cyan ring-1 ring-white/[0.08]">
                      <Icon size={22} strokeWidth={1.6} />
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
