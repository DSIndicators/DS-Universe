import Link from "next/link";
import { COMPLETE, PRICES, WITH_BUNDLE, money } from "@/content/pricing";
import { onWaitlist } from "@/content/launch";

/**
 * FREE WITH DS COMPLETE — the products that come free with DS Complete and are
 * not sold on their own (DS ASL, DS Toolkit; content/pricing.ts BUNDLED) —
 * outside the DS Complete panel. The same two marks on each product's page,
 * each said once where it belongs:
 *
 *   product page head    ExclusiveHead    how it is had
 *   product price card   ExclusiveStrip   at the moment of deciding
 *
 * Its mark is the gold thread's own node — a small outlined diamond — so it
 * reads as part of DS Complete, which it is. Gold is money on this site, and
 * this is DS Complete's offer. No pill, no glow (Tom, 2026-09-27).
 */

/** The thread's node, small. */
export function ExclusiveMark({ size = 7, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rotate-45 border border-gold ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/** The label in the instrument voice: node + "FREE WITH DS COMPLETE". */
export function ExclusiveLabel({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold ${className}`}>
      <ExclusiveMark />
      {WITH_BUNDLE.label}
    </span>
  );
}

/** PRODUCT PAGE HEAD — the first line under its purpose. */
export function ExclusiveHead({ slug, className = "" }: { slug: string; className?: string }) {
  if (!PRICES[slug]?.withComplete) return null;
  return (
    <div className={className}>
      <ExclusiveLabel />
      <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate text-pretty">
        It comes free with <span className="text-ink">{COMPLETE.name}</span> and is not sold on its own — it is inside the {COMPLETE.name}{" "}
        archive.{" "}
        <a href="#buy" className="whitespace-nowrap text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
          How to get it
        </a>
      </p>
    </div>
  );
}

/**
 * PRODUCT PRICE CARD — across the top, the same place and the same build as
 * DS Complete's Founders strip and the trial's strip, so the site says "an
 * offer on this" one way. The card's padding is undone so it runs edge to edge.
 */
export function ExclusiveStrip({ slug }: { slug: string }) {
  if (!PRICES[slug]?.withComplete) return null;
  return (
    <div className="founders-strip -mx-7 -mt-7 mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-7 py-3.5 sm:-mx-8 sm:-mt-8 sm:mb-8 sm:px-8">
      <ExclusiveLabel />
      <span className="text-[13px] text-slate">{WITH_BUNDLE.short}</span>
      <Link
        href="/products#complete"
        className="text-[13px] font-medium text-ink underline decoration-gold/60 underline-offset-4 transition-colors hover:decoration-gold sm:ml-auto"
      >
        What is in {COMPLETE.name}
      </Link>
    </div>
  );
}

/** The buy button's words on its page: what it buys, and for how much. */
export const completeBuyLabel = () => (onWaitlist() ? undefined : `Get ${COMPLETE.name} — ${money(COMPLETE.now)}`);
