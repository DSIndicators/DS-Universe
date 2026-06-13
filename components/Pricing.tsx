import { Check } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/components/ui/cn";

const TIERS = [
  {
    name: "Free",
    price: "Free",
    cadence: "with ads",
    lifetime: false,
    blurb: "The DS Crewmates. A beginner's chart that reads like a pro's.",
    features: [
      "DS BC — market structure (BOS · CHoCH)",
      "DS TL — self-cleaning trend line",
      "DS SR — touch-ranked support & resistance",
      "DS CL — on-chart trade checklist",
      "Free forever · no card required",
    ],
    featured: false,
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$49.99",
    cadence: "one-time",
    lifetime: true,
    blurb: "The DS Radars. Three radars reading the tape, decoded live.",
    features: [
      "Lifetime access — pay once, yours forever",
      "Everything in Free",
      "DS Pilots — direction & conviction",
      "DS Sweeper — the trap hunter",
      "DS Everguard — integrity & conviction",
    ],
    featured: true,
    cta: "Get Pro — Lifetime",
  },
  {
    name: "Universe",
    price: "$199.99",
    cadence: "one-time",
    lifetime: true,
    blurb: "The DS Systems. All instruments, reconciled by the Registry.",
    features: [
      "Lifetime access — pay once, yours forever",
      "Everything in Pro",
      "Orbit · Stars · Balance",
      "Ember heat map · Council consensus",
      "Pulse · the DS Registry core · early access",
    ],
    featured: false,
    cta: "Get Universe — Lifetime",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-32 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-space-magenta/10 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Access"
          title="One payment."
          titleMuted="Lifetime access."
          intro="No subscriptions, ever. Pay once and the tools are yours for life — free updates included. Start free with the Crewmates, then own the Radars or the full Universe outright."
          align="center"
          className="mb-16"
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.08} className="h-full">
              <GlassCard
                glow={tier.featured ? "violet" : "none"}
                className={cn(
                  "flex h-full flex-col gap-6 p-7 sm:p-8",
                  tier.featured
                    ? "border-white/[0.16] bg-white/[0.06] shadow-glow lg:-translate-y-3 lg:scale-[1.03]"
                    : "",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="label-caps !text-sm">{tier.name}</h3>
                  {tier.featured && (
                    <span className="rounded-full border border-accent-teal/40 bg-accent-teal/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-accent-teal">
                      Most Popular
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-end gap-1">
                    <span className="font-sans text-5xl font-extrabold tracking-tight text-ink-white">
                      {tier.price}
                    </span>
                    <span className="mb-1.5 text-sm text-ink-gray">
                      {tier.cadence}
                    </span>
                  </div>
                  {tier.lifetime && (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent-teal/40 bg-accent-teal/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-accent-teal">
                      Lifetime access
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-ink-gray">
                  {tier.blurb}
                </p>

                <ul className="flex flex-1 flex-col gap-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-ink-white/90">
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-accent-teal"
                        strokeWidth={2.4}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <GlowButton
                  href="/showcase"
                  variant={tier.featured ? "primary" : "ghost"}
                  className="w-full"
                >
                  {tier.cta}
                </GlowButton>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
