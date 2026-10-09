import { COMPLETE, WITH_BUNDLE, money } from "@/content/pricing";
import { onWaitlist } from "@/content/launch";

/**
 * FREE WITH DS COMPLETE — the products that come free with DS Complete and are
 * not sold on their own (DS ASL, DS Toolkit; content/pricing.ts BUNDLED) —
 * outside the DS Complete panel. On each product's page its label heads the
 * buy box and the button buys DS Complete (components/ProductPage.tsx).
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
    <span className={`inline-flex items-center gap-2.5 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-gold ${className}`}>
      <ExclusiveMark />
      {WITH_BUNDLE.label}
    </span>
  );
}

/** The buy button's words on its page: what it buys, and for how much. */
export const completeBuyLabel = () => (onWaitlist() ? undefined : `Get ${COMPLETE.name} — ${money(COMPLETE.now)}`);
