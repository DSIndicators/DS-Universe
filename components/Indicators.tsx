import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { IndicatorCard } from "@/components/IndicatorCard";
import { PRODUCTS, SUITES, type Suite } from "@/components/data/products";

function SuiteBlock({ suite }: { suite: Suite }) {
  const meta = SUITES[suite];
  const items = PRODUCTS.filter((p) => p.suite === suite);

  return (
    <div className="flex flex-col gap-8">
      <Reveal>
        <div className="flex flex-col gap-2 border-l-2 border-accent-teal/50 pl-5">
          <span className="label-caps">{meta.label}</span>
          <h3 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-ink-white">{meta.title.split(" ")[0]}</span>{" "}
            <span className="text-ink-gray">{meta.title.split(" ")[1]}</span>
          </h3>
          <p className="text-ink-gray">{meta.line}</p>
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
          intro="Two suites, built for the intraday trader. The Radars decode the live tape; the Systems map the field. Cross-referenced and rendered without a hint of lag."
          className="mb-16 max-w-3xl"
        />

        <div className="flex flex-col gap-20">
          <SuiteBlock suite="radars" />
          <SuiteBlock suite="systems" />
        </div>
      </div>
    </section>
  );
}
