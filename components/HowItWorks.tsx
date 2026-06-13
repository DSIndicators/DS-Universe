import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Drop the DS Universe suite onto your NinjaTrader chart and link it to your live intraday data feed.",
  },
  {
    n: "02",
    title: "Load the read",
    body: "Pilots, Sweeper and Everguard light up the tape; Orbit, Stars, Balance, Ember, Council and Pulse map the field — all reconciled by the Registry.",
  },
  {
    n: "03",
    title: "Trade with precision",
    body: "Take the read when the systems align, flip the panels away to lock in on pure price. Your call, instantly.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From feed to"
          titleMuted="conviction in three steps."
          align="center"
          className="mb-14"
        />

        <div className="relative grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* connecting line on desktop */}
          <div className="pointer-events-none absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:block" />

          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <GlassCard className="flex h-full flex-col gap-4 p-7">
                <span className="font-sans text-4xl font-extrabold text-aurora">
                  {s.n}
                </span>
                <h3 className="font-sans text-xl font-semibold text-ink-white">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-gray">{s.body}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
