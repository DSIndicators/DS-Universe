"use client";

import Link from "next/link";
import type { FocusEvent, PointerEvent } from "react";
import { built, useCompleteStage, type Series } from "@/components/CompleteStage";
import { productHref } from "@/content/release";

export type LedgerRow = {
  key: Series;
  name: string;
  /** "$399.95" — or "$0.00" for the series that comes free with DS Complete
   *  and adds nothing to the sum — formatted by the server from pricing.ts. */
  price: string;
  /** Where the row's name goes: its panel below (#flagship), or — for a series
   *  of one with no panel of its own — its product's page. Left out for a
   *  series with no panel and several products: the name is then plain text
   *  and the products under it are the links. */
  href?: string;
  /** `exclusive`: comes free with DS Complete and is not sold on its own
   *  (DS ASL, DS Toolkit) — marked with the gold node of the lines above the list. */
  products: { slug: string; name: string; exclusive?: boolean }[];
};

/**
 * THE LEDGER beside the DS Complete chart — and the chart's key. One row per
 * series with its subtotal; under it, the products in it. Pointing at a row
 * isolates that series' drawings on the chart; pointing at a product isolates
 * its own. The series name still links down to its panel below, and each
 * product to its page. Every row is a series DS Complete holds — nothing free
 * is listed here (content/release.ts COMPLETE_SHELVES).
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
 * "Free with DS Complete" lines alike, so the two can never behave differently.
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
            {r.href ? (
              <a href={r.href} className="group flex items-baseline gap-3 text-[13.5px]">
                <span className={`transition-colors duration-300 ${building || on ? "text-gold-deep" : "text-ink"} group-hover:text-gold-deep`}>{r.name}</span>
                <span className="ml-auto tabular-nums text-slate">{r.price}</span>
                <span
                  className={`w-3 text-mute transition-transform group-hover:text-gold-deep ${r.href.startsWith("#") ? "group-hover:translate-y-0.5" : "group-hover:translate-x-0.5"}`}
                  aria-hidden="true"
                >
                  {r.href.startsWith("#") ? "↓" : "→"}
                </span>
              </a>
            ) : (
              // No panel below and several products: the same row, as text.
              // The arrow's column is kept empty so the figures stay in line.
              <p className="flex items-baseline gap-3 text-[13.5px]">
                <span className={`transition-colors duration-300 ${building || on ? "text-gold-deep" : "text-ink"}`}>{r.name}</span>
                <span className="ml-auto tabular-nums text-slate">{r.price}</span>
                <span className="w-3" aria-hidden="true" />
              </p>
            )}
            <p className="mt-0.5 flex flex-wrap gap-x-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
              {r.products.map((p, i) => (
                <span key={p.slug} className="whitespace-nowrap">
                  <Link
                    href={productHref(p.slug)}
                    className={`inline-block py-1 transition-colors hover:text-ink focus-visible:text-ink ${focus?.slug === p.slug ? "text-ink" : ""}`}
                    onPointerEnter={(e) => mouse(e) && setFocus({ series: r.key, slug: p.slug, source: "hover" })}
                    onPointerLeave={(e) => mouse(e) && setFocus({ series: r.key, source: "hover" })}
                    onFocus={(e) => keys(e) && setFocus({ series: r.key, slug: p.slug, source: "hover" })}
                  >
                    {p.name.replace(/^DS (?=\D)/, "")}
                    {p.exclusive && (
                      <>
                        <span className="relative top-[-1px] ml-1.5 inline-block h-[5px] w-[5px] rotate-45 border border-gold align-middle" aria-hidden="true" />
                        <span className="sr-only"> — free with DS Complete</span>
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
 * THE "FREE WITH DS COMPLETE" BLOCK — more keys to the chart.
 *
 * It names the products a buyer gets here and nowhere else (DS ASL, DS
 * Toolkit): the label once, then one line per product, every line built the
 * same way. Each line follows the ledger's own rules (usePointing): a mouse
 * over it, or keyboard focus on it, isolates that product's drawing — the
 * session bracket and its volume profile, or the rail — and the caption under
 * the chart names it; leaving restores the whole chart. It answers the ledger
 * in both directions: pointing at the product in the list lights its line
 * too, and pointing at anything else dims it like a ledger row. Each line
 * links to the product's own page.
 *
 * Lit, the node fills gold and the name turns gold. Set in type between two
 * gold hairlines, a plain hairline between the lines: no box, no glow.
 */
export type BundledItem = { slug: string; series: Series; href: string; name: string; line: string };

export function CompleteBundled({ label, note, items }: { label: string; note: string; items: BundledItem[] }) {
  const { focus, setFocus, mouse, keys, leave } = usePointing();
  if (!items.length) return null;
  return (
    <div className="mt-6 max-w-xl border-y border-[rgba(205,166,86,0.28)]" role="group" aria-label={label}>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-1 pt-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">{label}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">{note}</span>
      </p>
      <ul>
        {items.map((it, i) => {
          const on = focus?.slug === it.slug;
          const dim = !!focus && !on;
          const point = () => setFocus({ series: it.series, slug: it.slug, source: "hover" });
          return (
            <li key={it.slug} className={i ? "border-t border-line" : ""}>
              <Link
                href={it.href}
                className="group flex items-baseline gap-3 py-2.5 transition-opacity duration-300"
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
                  <span className={`transition-colors duration-300 group-hover:text-gold-deep ${on ? "text-gold-deep" : "text-ink"}`}>{it.name}</span> — {it.line}.
                </span>
                <span
                  className={`ml-auto shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-deep ${on ? "text-gold-deep" : "text-mute"}`}
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
