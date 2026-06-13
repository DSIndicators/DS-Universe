"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Eye,
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

const HOLD_MS = 2000;

export function IndicatorCard({ product }: { product: Product }) {
  const Icon = ICONS[product.icon] ?? Sparkles;
  const image = `/indicators/${product.name.toLowerCase()}.webp`;

  const [show, setShow] = useState(false);
  // Load the preview image only once the user first triggers it.
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const arm = useCallback(() => {
    clear();
    timer.current = setTimeout(() => {
      setArmed(true);
      setShow(true);
    }, HOLD_MS);
  }, [clear]);

  const dismiss = useCallback(() => {
    clear();
    setShow(false);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return (
    <GlassCard
      interactive
      glow={product.glow}
      className={cn(
        "flex h-full select-none flex-col gap-4 p-6 sm:p-7",
        show && "z-40",
      )}
      onMouseEnter={arm}
      onMouseLeave={dismiss}
      onTouchStart={arm}
      onTouchEnd={dismiss}
      onTouchMove={dismiss}
      onTouchCancel={dismiss}
      onContextMenu={(e) => e.preventDefault()}
    >
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

      <h3 className="label-caps !text-sm !tracking-[0.22em]">{product.name}</h3>

      <p className="-mt-1 font-sans text-lg font-semibold text-ink-white">
        {product.tagline}
      </p>

      <p className="text-sm leading-relaxed text-ink-gray">
        {product.description}
      </p>

      <span className="mt-auto flex items-center gap-1.5 pt-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink-gray/50">
        <Eye size={12} /> Hold to preview
      </span>

      {/* Live-example preview — CSS-only fade/scale (no JS animation lib).
          x-centering on the outer; opacity/y transition on the inner. */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-[calc(100%_+_12px)] left-1/2 z-50 w-[min(360px,86vw)] -translate-x-1/2",
          show ? "visible" : "invisible",
        )}
        aria-hidden={!show}
      >
        <div
          className={cn(
            "origin-bottom transition-all duration-200 ease-out",
            show ? "scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0",
          )}
        >
          <div className="glass-strong overflow-hidden rounded-xl p-2 shadow-glow">
            {armed && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={`${product.name} — live chart example`}
                loading="lazy"
                decoding="async"
                className="w-full rounded-lg border border-white/[0.06] bg-space-deep"
              />
            )}
            <div className="flex items-center justify-between px-1.5 pb-0.5 pt-2">
              <span className="label-caps !text-[0.6rem]">{product.name}</span>
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink-gray/60">
                Live example
              </span>
            </div>
          </div>
          <div className="mx-auto h-2 w-2 -translate-y-1 rotate-45 border-b border-r border-white/[0.1] bg-white/[0.06]" />
        </div>
      </div>
    </GlassCard>
  );
}
