import { Check, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ChartGuide } from "@/components/ChartGuide";
import { cn } from "@/components/ui/cn";

type Tier = {
  name: string;
  price: string;
  /** Struck-through list price, shown above the sale price. */
  originalPrice?: string;
  /** Limited-time sale note (e.g. "−20% · Limited time"). */
  saleNote?: string;
  cadence: string;
  lifetime: boolean;
  blurb: string;
  highlight?: { title: string; body: string };
  features: string[];
  featured: boolean;
  newRelease?: boolean;
  cta: string;
};

const TIERS: Tier[] = [
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
    name: "Radars",
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
    featured: false,
    cta: "Get Radars — Lifetime",
  },
  {
    name: "Systems",
    price: "$199.99",
    originalPrice: "$249.99",
    saleNote: "−20% · Limited time",
    cadence: "one-time",
    lifetime: true,
    blurb: "The DS Systems. All instruments, reconciled by the Registry.",
    // Pulse ships free inside Systems — called out separately below.
    highlight: {
      title: "DS Pulse included — free",
      body: "Our most powerful order-flow read, bundled into Systems at no extra cost.",
    },
    features: [
      "Lifetime access — pay once, yours forever",
      "Everything in Radars",
      "Orbit · Stars · Balance",
      "Ember — signature trend candles",
      "Council — multi-timeframe consensus",
      "The DS Registry core · early access",
      "All future updates & additions — included",
    ],
    featured: true,
    newRelease: true,
    cta: "Get Systems — Lifetime",
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
          intro="No subscriptions, ever. Pay once and the tools are yours for life — free updates included. Start free with the Crewmates, then own the Radars or the full Systems suite outright."
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
                {tier.newRelease && (
                  <span className="bg-ai absolute -right-2.5 -top-3.5 z-20 rotate-3 rounded-full px-3.5 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-space-black shadow-glow-cyan">
                    New Release Sale
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="label-caps !text-sm">{tier.name}</h3>
                  {tier.featured && (
                    <span className="rounded-full border border-accent-teal/40 bg-accent-teal/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-accent-teal">
                      Most Popular
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {tier.originalPrice && (
                    <div className="flex items-center gap-2.5">
                      <span className="font-sans text-lg font-semibold text-ink-gray/70 line-through decoration-space-magenta/70 decoration-2">
                        {tier.originalPrice}
                      </span>
                      {tier.saleNote && (
                        <span className="rounded-full bg-[#ff7a2f]/15 px-2.5 py-0.5 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#ffb986] ring-1 ring-[#ff7a2f]/40">
                          {tier.saleNote}
                        </span>
                      )}
                    </div>
                  )}
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

                {tier.highlight && (
                  <div className="relative overflow-hidden rounded-xl border border-accent-teal/30 bg-accent-teal/[0.07] p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles size={15} className="shrink-0 text-accent-teal" />
                      <span className="font-sans text-sm font-semibold text-ink-white">
                        {tier.highlight.title}
                      </span>
                    </div>
                    <span className="mx-auto mt-2 inline-flex rounded-full bg-accent-teal/15 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-accent-teal">
                      Requires Tick Replay
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-ink-gray">
                      {tier.highlight.body}
                    </p>
                  </div>
                )}

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

        {/* The benefits, made visible — what every read looks like on a chart. */}
        <ChartGuide />
      </div>
    </section>
  );
}
