import { Crosshair, Zap, Layers, EyeOff } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

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
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Why DS Universe"
          title="A clean chart"
          titleMuted="that earns its ink."
          intro="Accuracy you can lean on, speed you never feel, and a chart that gets out of the way the second you need it to."
          className="mb-14 max-w-3xl"
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
    </section>
  );
}
