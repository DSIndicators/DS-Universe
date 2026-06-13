import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { IndicatorCard } from "@/components/IndicatorCard";
import { IntelligenceCore } from "@/components/ui/IntelligenceCore";
import { PRODUCTS, SUITES, type Suite } from "@/components/data/products";
import { cn } from "@/components/ui/cn";

function SuiteBlock({ suite, premium }: { suite: Suite; premium?: boolean }) {
  const meta = SUITES[suite];
  const items = PRODUCTS.filter((p) => p.suite === suite);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-8",
        premium &&
          "rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-glow sm:p-9",
      )}
    >
      {/* Premium ambient glow behind the flagship suite */}
      {premium && (
        <div
          aria-hidden
          className="bg-ai pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10 rounded-[2rem] opacity-[0.07] blur-3xl"
        />
      )}

      <Reveal>
        <div
          className={cn(
            "flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8",
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-2 border-l-2 pl-5",
              premium ? "border-space-electric/70" : "border-accent-teal/50",
            )}
          >
            <span className="flex items-center gap-3">
              <span className="label-caps">{meta.label}</span>
              {premium && (
                <span className="rounded-full border border-space-electric/40 bg-space-electric/10 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-space-electric">
                  Flagship suite
                </span>
              )}
            </span>
            <h3 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="text-ink-white">{meta.title.split(" ")[0]}</span>{" "}
              <span className={premium ? "text-ai" : "text-ink-gray"}>
                {meta.title.split(" ")[1]}
              </span>
            </h3>
            <p className="text-ink-gray">{meta.line}</p>
          </div>

          {/* The Intelligence Core — the brain the whole suite reports to. */}
          {premium && (
            <div className="flex shrink-0 items-center gap-4 sm:max-w-[19rem]">
              <IntelligenceCore size={104} className="shrink-0" />
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-space-electric">
                  Intelligence Core
                </span>
                <span className="font-sans text-sm font-bold text-ink-white">
                  The DS Registry
                </span>
                <p className="text-xs leading-relaxed text-ink-gray">
                  One core binds the suite — every instrument reports here, and
                  the Registry reconciles them into a single, lag-free read.
                </p>
              </div>
            </div>
          )}
        </div>
      </Reveal>

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <Reveal as="li" key={p.name} delay={(i % 3) * 0.08} className="h-full">
            <IndicatorCard product={p} />
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

export function Indicators() {
  return (
    <section id="indicators" className="relative scroll-mt-24 py-24 sm:py-32">
      {/* soft ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-space-violet/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="The Instruments"
          title="Nine indicators."
          titleMuted="One intelligence."
          intro="Two suites, built for the intraday trader. The Systems map the field; the Radars decode the live tape. Cross-referenced and rendered without a hint of lag."
          className="mb-16 max-w-3xl"
        />

        <div className="flex flex-col gap-20">
          <SuiteBlock suite="systems" premium />
          <SuiteBlock suite="radars" />
        </div>
      </div>
    </section>
  );
}
