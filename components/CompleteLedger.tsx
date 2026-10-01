"use client";

import Link from "next/link";
import type { FocusEvent, PointerEvent } from "react";
import { built, useCompleteStage, type Series } from "@/components/CompleteStage";

export type LedgerRow = {
  key: Series;
  name: string;
  /** "$399.95" or "Free · included" — formatted by the server from pricing.ts. */
  price: string;
  /** `gift`: comes only with DS Complete (DS Pro Session Levels) — marked with
   *  the gift line's gold node. */
  products: { slug: string; name: string; gift?: boolean }[];
};

/**
 * THE LEDGER beside the DS Complete chart — and the chart's key. One row per
 * series with its subtotal; under it, the products in it. Pointing at a row
 * isolates that series' drawings on the chart; pointing at a product isolates
 * its own. The series name still links down to its panel below, and each
 * product to its page.
 *
 * While the chart builds, the row being drawn lights gold, so the chart and
 * the list read as one sequence.
 *
 * On phones (2026-09-29) the list is only a price list: its names are links
 * to the product pages and nothing else. The chart carries its own controls
 * there, and this list ignores a focus set by the chart's tabs or its tour.
 */
/**
 * The pointing rules every key beside the chart follows — the ledger and the
 * Founders gift line alike, so the two can never behave differently.
 * Isolating a drawing follows a mouse or the keyboard only. A tap on a phone
 * navigates, and there is no "leave" after it to undo a highlight.
 */
function usePointing() {
  const { focus: raw, setFocus, step } = useCompleteStage();
  const focus = raw?.source === "hover" ? raw : null;
  const mouse = (e: PointerEvent<Element>) => e.pointerType === "mouse";
  const keys = (e: FocusEvent<Element>) => {
    try {
      return e.currentTarget.matches(":focus-visible, :has(:focus-visible)");
    } catch {
      return true; // an older browser without :has — keyboard focus still works
    }
  };
  const leave = () => {
    if (raw?.source === "hover") setFocus(null);
  };
  return { focus, setFocus, step, mouse, keys, leave };
}

export function CompleteLedger({ rows, label }: { rows: LedgerRow[]; label: string }) {
  const { focus, setFocus, step, mouse, keys, leave } = usePointing();
  return (
    <ul className="mt-7 max-w-xl border-t border-line" aria-label={label} onPointerLeave={(e) => mouse(e) && leave()}>
      {rows.map((r) => {
        const { building } = built(r.key, step);
        const on = focus?.series === r.key;
        const dim = focus && !on;
        return (
          <li
            key={r.key}
            className="border-b border-line py-2.5 transition-opacity duration-300"
            style={{ opacity: dim ? 0.45 : 1 }}
            onPointerEnter={(e) => mouse(e) && setFocus({ series: r.key, source: "hover" })}
            onFocus={(e) => keys(e) && setFocus({ series: r.key, source: "hover" })}
            onBlur={leave}
          >
            <a href={`#${r.key}`} className="group flex items-baseline gap-3 text-[13.5px]">
              <span className={`transition-colors duration-300 ${building || on ? "text-gold-deep" : "text-ink"} group-hover:text-gold-deep`}>{r.name}</span>
              <span className="ml-auto tabular-nums text-slate">{r.price}</span>
              <span className="w-3 text-mute transition-transform group-hover:translate-y-0.5 group-hover:text-gold-deep" aria-hidden="true">
                ↓
              </span>
            </a>
            <p className="mt-0.5 flex flex-wrap gap-x-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
              {r.products.map((p, i) => (
                <span key={p.slug} className="whitespace-nowrap">
                  <Link
                    href={`/products/${p.slug}`}
                    className={`inline-block py-1 transition-colors hover:text-ink focus-visible:text-ink ${focus?.slug === p.slug ? "text-ink" : ""}`}
                    onPointerEnter={(e) => mouse(e) && setFocus({ series: r.key, slug: p.slug, source: "hover" })}
                    onPointerLeave={(e) => mouse(e) && setFocus({ series: r.key, source: "hover" })}
                    onFocus={(e) => keys(e) && setFocus({ series: r.key, slug: p.slug, source: "hover" })}
                  >
                    {p.name.replace(/^DS (?=\D)/, "")}
                    {p.gift && (
                      <>
                        <span className="relative top-[-1px] ml-1.5 inline-block h-[5px] w-[5px] rotate-45 border border-gold align-middle" aria-hidden="true" />
                        <span className="sr-only"> — only in DS Complete</span>
                      </>
                    )}
                  </Link>
                  {/* the dot trails its name, so a wrapped line never starts with one */}
                  {i < r.products.length - 1 && <span className="ml-2.5 text-line-strong" aria-hidden="true">·</span>}
                </span>
              ))}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * THE FOUNDERS GIFT LINE (2026-09-30) — one more key to the chart.
 *
 * Tom, on the first build: pointing at "DS Pro Session Levels" in the gift
 * line "doesn't dim anything out so users won't know which one it is". It was
 * a plain link, outside the chart's shared state. Now it follows the ledger's
 * own rules (usePointing): a mouse over it, or keyboard focus on it, isolates
 * DS Pro Session Levels' drawing — the session bracket and the volume profile
 * inside it — and the caption under the chart names it; leaving restores the
 * whole chart. It answers the ledger in both directions: pointing at Pro
 * Session Levels in the list lights this line too, and pointing at anything
 * else dims it like a ledger row. A tap on a phone only follows the link down
 * to the Session levels panel, as the ledger's links do.
 *
 * Lit, the node fills gold and the name turns gold. Set in type: no box, no
 * glow.
 */
export function CompleteGift({
  slug,
  series,
  href,
  label,
  name,
  line,
}: {
  slug: string;
  series: Series;
  href: string;
  label: string;
  name: string;
  line: string;
}) {
  const { focus, setFocus, mouse, keys, leave } = usePointing();
  const on = focus?.slug === slug;
  const dim = !!focus && !on;
  const point = () => setFocus({ series, slug, source: "hover" });
  return (
    <a
      href={href}
      className="group mt-6 flex max-w-xl items-baseline gap-3 border-y border-[rgba(205,166,86,0.28)] py-3 transition-opacity duration-300"
      style={{ opacity: dim ? 0.45 : 1 }}
      onPointerEnter={(e) => mouse(e) && point()}
      onPointerLeave={(e) => mouse(e) && leave()}
      onFocus={(e) => keys(e) && point()}
      onBlur={leave}
    >
      <span
        className={`relative top-[-1px] h-[7px] w-[7px] shrink-0 rotate-45 border border-gold transition-colors duration-300 ${on ? "bg-gold" : ""}`}
        aria-hidden="true"
      />
      <span className="min-w-0 text-[13.5px] leading-snug text-slate text-pretty">
        <span className="mr-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">{label}</span>
        <span className={`transition-colors duration-300 group-hover:text-gold-deep ${on ? "text-gold-deep" : "text-ink"}`}>{name}</span> — {line}.
      </span>
      <span
        className={`ml-auto shrink-0 transition-transform group-hover:translate-y-0.5 group-hover:text-gold-deep ${on ? "text-gold-deep" : "text-mute"}`}
        aria-hidden="true"
      >
        ↓
      </span>
    </a>
  );
}
