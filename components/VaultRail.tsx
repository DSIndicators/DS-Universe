"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { VAULT_PRODUCTS } from "@/content/release";

/**
 * THE VAULT'S DRAWER on the home page (2026-10-08) — every Free Vault product
 * on one rail that slides sideways, each as the marketplace card it is in
 * the vault itself (components/ProductCard.tsx, in brass): its square cover,
 * its name, one of its hooks, "Free" and "Get it free".
 *
 * One row whatever the vault holds: snap-aligned cards, the next one always
 * showing at the edge so the rail reads as "more this way", two quiet arrow
 * keys that page it a card at a time (disabled at either end), and plain
 * swipe / trackpad / Shift-wheel scrolling. The rail's edges line up with the
 * page's own gutters (.wrap). No autoplay — a moving shelf is noise.
 */
export function VaultRail() {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    const first = el?.querySelector("li");
    if (!el || !first) return;
    const step = (first as HTMLElement).offsetWidth + 20;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step * Math.max(1, Math.floor(el.clientWidth / step)), behavior: still ? "auto" : "smooth" });
  };

  return (
    <div className="relative">
      <div className="wrap flex items-center justify-between gap-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">In the vault</p>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => page(-1)} disabled={edge.start} className="vault-rail-key" aria-label="Previous products in the vault">
            ←
          </button>
          <button type="button" onClick={() => page(1)} disabled={edge.end} className="vault-rail-key" aria-label="More products in the vault">
            →
          </button>
        </div>
      </div>
      <ul ref={ref} className="vault-rail mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 pt-1" aria-label="In the Free Vault">
        {VAULT_PRODUCTS.map((p) => (
          <li key={p.slug} className="flex w-[72vw] max-w-[248px] shrink-0 snap-start sm:w-[248px]">
            <ProductCard slug={p.slug} tone="vault" hooks={1} phoneRow={false} sizes="(min-width: 640px) 248px, 72vw" className="w-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
