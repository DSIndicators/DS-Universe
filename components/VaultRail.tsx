"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Lens } from "@/components/Loupe";
import { shotFor } from "@/content/loupe";
import { VAULT_PRODUCTS, productHref } from "@/content/release";

/**
 * THE VAULT'S DRAWER on the home page (2026-10-08) — every Free Vault product
 * by its own chart, in brass, on one rail that slides sideways. It replaced
 * the strip of box art (Tom: "i like the chart designs more, so we'll be
 * moving to implement them to the products on the homepage").
 *
 * One row whatever the vault holds: snap-aligned frames, the next one always
 * showing at the edge so the rail reads as "more this way", two quiet arrow
 * keys that page it a frame at a time (disabled at either end), and plain
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

  const ps = VAULT_PRODUCTS.filter((p) => shotFor(p.slug));
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
      <ul
        ref={ref}
        className="vault-rail mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
        aria-label="In the Free Vault"
      >
        {ps.map((p) => {
          const shot = shotFor(p.slug)!;
          return (
            <li key={p.slug} className="w-[78vw] max-w-[300px] shrink-0 snap-start sm:w-[300px]">
              <Link href={productHref(p.slug)} className="group block" aria-label={`${p.name} — ${p.category}. Free, in the Free Vault.`}>
                <Lens shot={shot} a={3 / 2} tone="brass" showMark={false} cssWidth={{ lg: 300, sm: "300px", base: "78vw" }} />
                <span className="mt-3 flex items-baseline justify-between gap-3 border-t border-[rgba(201,165,94,0.2)] pt-2.5">
                  <span className="truncate font-display text-[15px] text-ink transition-colors group-hover:text-vault-light">{p.name}</span>
                  <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.18em] text-vault">Free</span>
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-mute">{p.category}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
