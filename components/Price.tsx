import { discountPct, money, type Price } from "@/content/pricing";

/**
 * Every price on the site is laid out by one of these, so a price can never be
 * spelled two ways. Numbers come from content/pricing.ts only.
 *
 * THE LOOK — restraint (rebuilt 2026-09-27, second pass).
 * The first pass made prices "hype" with gold pills and a glowing gold
 * gradient. Tom: "cheap looking circled prices, too generic, too AI ... we need
 * sturdy and elegance." He was right: pills, gradients and glows are the
 * default vocabulary of template storefronts. What reads as expensive is the
 * opposite — typography doing the work, one accent used precisely, everything
 * on a grid ("every premium design decision is a decision about restraint").
 *
 * So a price is now SET, not decorated:
 *   · the figure in the display face (Outfit), ivory, tabular, no fill behind it;
 *   · gold appears once per price, as a short rule and a small-caps label —
 *     the accent marks where to look, the number carries the weight;
 *   · the terms are a line of text, not a row of chips;
 *   · on a tile, a hairline and the figure — the way a catalogue or a watch
 *     maker's site prints a price.
 * The emphasis is scale and position, never effects. No countdown, no
 * "limited", no superlative, and no struck number that was never a real price.
 *
 * THE STRUCK NUMBER. Only where Whop shows a real list price above the price
 * you pay does the site cross one out. Since 2026-09-26 that is DS Complete
 * alone ($749.90 = the paid products bought separately).
 */

const TERMS_PAID = "One payment · Yours to keep · Updates included";
const TERMS_FREE = "Permanently · Not a trial · Nothing stripped out";

/** The figure a tile or a list row carries: plain type, no container. */
export function PriceFigure({
  price,
  size = "sm",
  className = "",
}: {
  price: Price | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  if (!price) return null;
  const type = size === "md" ? "text-[14.5px]" : "text-[13.5px]";
  return (
    <span className={`inline-block font-mono ${type} font-normal leading-none text-ink tabular-nums ${className}`}>
      {price.free ? "Free" : money(price.now)}
    </span>
  );
}

/**
 * The price at the head of a series panel, or on a product page: a short gold
 * rule and a small-caps label, the figure large in the display face, and the
 * terms as one quiet line underneath.
 */
export function PriceTag({
  price,
  size = "md",
  each = false,
  align = "start",
  className = "",
}: {
  price: Price | undefined;
  size?: "md" | "lg";
  /** "each" — a series panel prices several products at once. */
  each?: boolean;
  /** Right-aligned at the head of a panel on wide screens. */
  align?: "start" | "end";
  className?: string;
}) {
  if (!price) return null;
  const big = size === "lg" ? "text-[clamp(2.25rem,3.8vw,3rem)]" : "text-[clamp(2rem,3.2vw,2.6rem)]";
  const end = align === "end" ? "md:items-end md:text-right" : "";
  const off = discountPct(price);

  return (
    <div className={`flex flex-col ${end} ${className}`}>
      <span className="block h-px w-8 bg-gold" aria-hidden="true" />
      <span className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold-deep">Price</span>
      <span className="mt-2 flex items-baseline gap-3">
        <span className={`font-display ${big} font-[350] leading-none tracking-[-0.03em] text-ink tabular-nums`}>
          {price.free ? "Free" : money(price.now)}
        </span>
        {each && !price.free && <span className="text-[14.5px] text-slate">each</span>}
        {off > 0 && !price.free && (
          <s className="text-[15px] tabular-nums text-mute decoration-mute/70" aria-label={`list price ${money(price.list)}`}>
            {money(price.list)}
          </s>
        )}
      </span>
      <span className="mt-3 text-[12.5px] text-slate">{price.free ? TERMS_FREE : TERMS_PAID}</span>
    </div>
  );
}

/** Product page — the tag at its large size. */
export function PriceBlock({ price, className = "" }: { price: Price | undefined; size?: "md" | "lg"; className?: string }) {
  return <PriceTag price={price} size="lg" className={className} />;
}
