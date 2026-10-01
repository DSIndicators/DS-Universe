import Link from "next/link";
import type { CSSProperties } from "react";
import { COMPLETE, GIFT, PRICES, money } from "@/content/pricing";
import { NEW_NOTE } from "@/content/sessions";
import { onWaitlist } from "@/content/launch";

/**
 * The Session levels pair, outside its own panel (2026-09-30). Three marks,
 * each said once where it belongs:
 *
 *   home hero            SessionsHeroNote  that they are new, and how each is had
 *   product page head    GiftHead          the Pro tier: how it is had
 *   product price card   GiftStrip         at the moment of deciding
 *
 * The gift's mark is the gold thread's own node — a small outlined diamond —
 * so it reads as part of DS Complete, which it is. Gold is money on this site,
 * and this is DS Complete's offer. No pill, no glow (Tom, 2026-09-27).
 */

/** The thread's node, small. */
export function GiftMark({ size = 7, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rotate-45 border border-gold ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/** The gift's label in the instrument voice: node + "FOUNDERS GIFT". */
export function GiftLabel({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold ${className}`}>
      <GiftMark />
      {GIFT.label}
    </span>
  );
}

/**
 * HOME HERO — one line under the trial note, built the same way (a hairline,
 * the label, one sentence, one link down to the panel). No price: the hero
 * carries none (Tom, 2026-09-21). Renders nothing when NEW_NOTE is off.
 */
export function SessionsHeroNote({ className = "", style }: { className?: string; style?: CSSProperties }) {
  if (!NEW_NOTE.active) return null;
  return (
    <a href="#sessions" className={`group block max-w-md border-t border-line pt-5 ${className}`} style={style}>
      <span className="inline-flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">
        <GiftMark />
        {NEW_NOTE.label}
      </span>
      <span className="mt-2 block text-[13.5px] leading-relaxed text-slate text-pretty">
        <span className="text-ink">{NEW_NOTE.free}</span>
        {NEW_NOTE.freeLine}
        <span className="text-ink">{NEW_NOTE.pro}</span>
        {NEW_NOTE.proLine}{" "}
        <span className="whitespace-nowrap text-ink underline decoration-gold/60 underline-offset-4 transition-colors group-hover:decoration-gold">
          {NEW_NOTE.link}
        </span>
      </span>
    </a>
  );
}

/** PRODUCT PAGE HEAD — the Pro tier's first line under its purpose. */
export function GiftHead({ slug, className = "" }: { slug: string; className?: string }) {
  if (!PRICES[slug]?.withComplete) return null;
  return (
    <div className={className}>
      <GiftLabel />
      <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate text-pretty">
        Free with <span className="text-ink">{COMPLETE.name}</span>, and not sold on its own — inside the {COMPLETE.name} archive
        with its README and guides.{" "}
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
export function GiftStrip({ slug }: { slug: string }) {
  if (!PRICES[slug]?.withComplete) return null;
  return (
    <div className="founders-strip -mx-7 -mt-7 mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-7 py-3.5 sm:-mx-8 sm:-mt-8 sm:mb-8 sm:px-8">
      <GiftLabel />
      <span className="text-[13px] text-slate">Free with {COMPLETE.name} · not sold on its own</span>
      <Link
        href="/products#complete"
        className="text-[13px] font-medium text-ink underline decoration-gold/60 underline-offset-4 transition-colors hover:decoration-gold sm:ml-auto"
      >
        What is in {COMPLETE.name}
      </Link>
    </div>
  );
}

/** The buy button's words on the Pro tier's page: what it buys, and for how much. */
export const giftBuyLabel = () => (onWaitlist() ? undefined : `Get ${COMPLETE.name} — ${money(COMPLETE.now)}`);
