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
import type { Product } from "@/components/data/products";
import { cn } from "@/components/ui/cn";

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

export function IndicatorCard({ product }: { product: Product }) {
  const Icon = ICONS[product.icon] ?? Sparkles;
  const isEmber = product.name === "EMBER";

  return (
    <GlassCard
      interactive
      glow={product.glow}
      className="relative flex h-full flex-col gap-4 p-6 sm:p-7"
    >
      {/* Always-on ember glow for the heat-map card */}
      {isEmber && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_50%_38%,rgba(255,122,47,0.28),transparent_70%)] blur-2xl"
        />
      )}

      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]",
            isEmber ? "text-[#ff8a4c]" : "text-accent-teal",
          )}
        >
          <Icon size={20} strokeWidth={1.6} />
        </span>
        {product.codename && (
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-gray/70">
            {product.codename}
          </span>
        )}
      </div>

      <h3 className="label-caps !text-sm !tracking-[0.22em]">{product.name}</h3>

      <p className="-mt-1 font-sans text-lg font-semibold text-ink-white">
        {product.tagline}
      </p>

      <p className="text-sm leading-relaxed text-ink-gray">
        {product.description}
      </p>

      {/* HD product panel — the radar's live readout, shown inline under the copy. */}
      {product.panel && (
        <div className="mt-auto flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-space-deep">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.panel}
            alt={`DS ${product.name} — live panel`}
            loading="lazy"
            decoding="async"
            className="max-h-full w-auto max-w-full object-contain"
          />
        </div>
      )}
    </GlassCard>
  );
}
