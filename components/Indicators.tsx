import {
  Navigation,
  Crosshair,
  ShieldCheck,
  Orbit,
  Sparkles,
  Scale,
  Flame,
  Vote,
  AudioLines,
  type LucideIcon,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PRODUCTS, SUITES, type Product, type Suite } from "@/components/data/products";

const ICONS: Record<string, LucideIcon> = {
  Navigation,
  Crosshair,
  ShieldCheck,
  Orbit,
  Sparkles,
  Scale,
  Flame,
  Vote,
  AudioLines,
};

function ProductCard({ product, index }: { product: Product; index: number }) {
  const Icon = ICONS[product.icon] ?? Sparkles;
  return (
    <Reveal as="li" delay={(index % 3) * 0.08} className="h-full">
      <GlassCard interactive glow={product.glow} className="flex h-full flex-col gap-4 p-6 sm:p-7">
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-accent-teal">
            <Icon size={20} strokeWidth={1.6} />
          </span>
          {product.codename && (
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-gray/70">
              {product.codename}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <h3 className="label-caps !text-sm !tracking-[0.22em]">
            {product.name}
          </h3>
        </div>

        <p className="-mt-1 font-sans text-lg font-semibold text-ink-white">
          {product.tagline}
        </p>

        <p className="text-sm leading-relaxed text-ink-gray">
          {product.description}
        </p>
      </GlassCard>
    </Reveal>
  );
}

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
          <ProductCard key={p.name} product={p} index={i} />
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
          intro="Two suites, built for MNQ / MES. The Radars decode the live tape; the Systems map the field. Cross-referenced and rendered without a hint of lag."
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
