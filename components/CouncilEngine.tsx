import { Anchor, Gavel, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/components/ui/cn";

// The three voters of the DS Council, in their own voices.
const AIS = [
  {
    name: "Atlas",
    role: "The Anchor",
    facet: "Trend · Timeframe · Structure",
    color: "#6d8cff",
    icon: Anchor,
    body: "Atlas holds the weight of the larger chart — dominant structure and prevailing order flow. He doesn't change his mind without a real reason: the steady hand while the lower frames thrash.",
    payoff:
      "Keeps you on the side the market actually plays. When Atlas votes, you know where the weight of the chart is leaning — so you stop fading moves that have real structure behind them.",
  },
  {
    name: "Sage",
    role: "The Judge",
    facet: "Momentum · Confluence",
    color: "#a86bff",
    icon: Gavel,
    body: "Sage weighs evidence instead of reacting to it. Calm, deliberate, hard to spook — the voice asking whether a move has genuine confluence or is just noise, sitting between macro intent and live momentum.",
    payoff:
      "Filters the chop. Sage is often the deciding vote — the one that turns two disagreeing extremes into a single, clear call.",
  },
  {
    name: "Nova",
    role: "The Spark",
    facet: "Momentum · Instinct",
    color: "#f06ab8",
    icon: Zap,
    body: "Nova is fast and curious — first to feel a shift in momentum, first to call a turn forming. Sharp early, and the first to admit she can be too quick on her own.",
    payoff:
      "Gets you there early. Because she only counts when Atlas or Sage agrees, you get her speed without the false starts.",
  },
];

const TFS = ["1m", "5m", "10m", "15m", "60m"];
// 1 = bullish (green), 0 = bearish (red). A realistic, mostly-aligned read.
const GRID: { label: string; color: string; cells: number[] }[] = [
  { label: "ATLAS", color: "#6d8cff", cells: [1, 1, 1, 1, 0] },
  { label: "SAGE", color: "#a86bff", cells: [1, 1, 1, 1, 1] },
  { label: "NOVA", color: "#f06ab8", cells: [0, 1, 1, 0, 1] },
  { label: "COUNCIL", color: "#f2f1f6", cells: [1, 1, 1, 1, 1] },
];

function CouncilPanel() {
  return (
    <div className="glass relative w-full max-w-sm rounded-2xl px-5 py-4 sm:px-6 sm:py-5">
      <div className="mb-3 text-center font-mono text-[0.7rem] uppercase tracking-[0.24em] text-space-magenta">
        DS Council
      </div>
      <div className="grid grid-cols-[auto_repeat(5,1fr)] items-center gap-x-2 gap-y-2">
        <span />
        {TFS.map((tf) => (
          <span key={tf} className="text-center font-mono text-[0.58rem] text-ink-gray/80">
            {tf}
          </span>
        ))}
        {GRID.map((row) => (
          <Row key={row.label} row={row} />
        ))}
      </div>
    </div>
  );
}

function Row({ row }: { row: (typeof GRID)[number] }) {
  return (
    <>
      <span
        className="pr-2 font-mono text-[0.6rem] font-semibold tracking-[0.08em]"
        style={{ color: row.color }}
      >
        {row.label}
      </span>
      {row.cells.map((c, i) => (
        <span
          key={i}
          className={cn(
            "h-4 w-full rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
            c
              ? "bg-[#1aa548]"
              : "bg-[#a82d2d]",
          )}
        />
      ))}
    </>
  );
}

export function CouncilEngine() {
  return (
    <div className="relative mt-24">
      {/* Ambient premium glow — the signature aurora wash behind the engine. */}
      <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-space-violet/10 blur-[140px]" />

      <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <SectionHeading
          eyebrow="The MTF Engine"
          title="DS Council —"
          titleMuted="three minds, one verdict."
          intro="Three AI voters read the market across five timeframes and have to agree before the system says a word. Atlas anchors the trend, Sage weighs the evidence, Nova catches the turn early — a two-of-three majority on each timeframe, or you see nothing."
          className="max-w-2xl"
        />
        <Reveal delay={0.1} className="w-full shrink-0 lg:w-auto">
          <div className="flex flex-col items-center gap-3">
            <CouncilPanel />
            <p className="max-w-sm text-center text-xs leading-relaxed text-ink-gray/70">
              Five timeframes, three voters. Each frame needs a two-of-three
              majority — green across the grid is your green light.
            </p>
          </div>
        </Reveal>
      </div>

      {/* The three voters */}
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {AIS.map((ai, i) => {
          const Icon = ai.icon;
          return (
            <Reveal key={ai.name} delay={(i % 3) * 0.08} className="h-full">
              <GlassCard className="relative flex h-full flex-col gap-4 overflow-hidden p-6 sm:p-7">
                {/* per-voter colored glow */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl"
                  style={{ backgroundColor: ai.color }}
                />
                <div className="flex items-center gap-3.5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1"
                    style={{
                      backgroundColor: `${ai.color}1f`,
                      color: ai.color,
                      boxShadow: `inset 0 0 0 1px ${ai.color}40`,
                    }}
                  >
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <div className="flex flex-col">
                    <h3
                      className="font-sans text-xl font-bold tracking-tight"
                      style={{ color: ai.color }}
                    >
                      {ai.name}
                    </h3>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-gray/70">
                      {ai.role}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ink-gray/55">
                  {ai.facet}
                </span>
                <p className="text-sm leading-relaxed text-ink-gray">{ai.body}</p>
                <p className="mt-auto border-t border-white/[0.06] pt-4 text-sm leading-relaxed text-ink-white/85">
                  {ai.payoff}
                </p>
              </GlassCard>
            </Reveal>
          );
        })}
      </div>

      {/* The engines at work — zones + the live Council read on one chart. */}
      <Reveal className="mt-6">
        <figure className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#040406] shadow-glow">
          <div className="bg-ai pointer-events-none absolute -inset-x-10 -top-24 h-56 opacity-[0.08] blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/council/engines-at-work.webp"
            alt="A live DS Universe chart — confidence-scored Prime Resistance, Strong and Prime Support zones across the Premium / Equilibrium / Discount runway, with the DS Council ATLAS/SAGE/NOVA consensus panel."
            width={1667}
            height={1085}
            loading="lazy"
            decoding="async"
            className="relative block w-full"
          />
          <figcaption className="relative border-t border-white/[0.06] p-6 sm:p-7">
            <h3 className="font-sans text-lg font-semibold text-ink-white">
              The engines at work.
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-gray">
              Those zones aren&apos;t floating there for nothing. Each one is a
              precisely calculated level — multiple raw zones merged, weighted and
              positioned by real volume, then confirmed by the Council&apos;s
              cohesive vote across every timeframe. A zone only earns its
              confidence score once the whole system agrees it&apos;s real.
            </p>
          </figcaption>
        </figure>
      </Reveal>
    </div>
  );
}
