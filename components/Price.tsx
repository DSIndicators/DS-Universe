import { discountPct, money, type Price } from "@/content/pricing";

/**
 * Every price on the site is laid out by one of these three, so a price can
 * never be spelled two ways. Numbers come from content/pricing.ts only.
 *
 * THE STRUCK NUMBER. Where Whop shows a list price above the price you pay
 * ($99.99 -> $79.99), the site shows the same two numbers, the list quiet and
 * crossed, so the page and the checkout agree. Where there is no discount
 * (DS Bulk Replay Downloader, by Tom's rule) nothing is crossed out — a
 * struck number that was never a real price would be decoration pretending to
 * be a saving.
 */

/** One line: "$79.99  $99.99", "$79.99" (strike off) or "Free". */
export function PriceLine({
  price,
  strike = true,
  className = "",
}: {
  price: Price | undefined;
  /** Show the crossed-out list price beside it. */
  strike?: boolean;
  className?: string;
}) {
  if (!price) return null;
  if (price.free) return <span className={`text-gold-deep ${className}`}>Free</span>;
  const off = discountPct(price);
  return (
    <span className={`inline-flex items-baseline gap-2 tabular-nums ${className}`}>
      <span className="text-ink">{money(price.now)}</span>
      {strike && off > 0 && (
        <s className="text-[0.88em] text-mute decoration-mute/70" aria-label={`was ${money(price.list)}`}>
          {money(price.list)}
        </s>
      )}
    </span>
  );
}

/** The block under a product's name on its page, or at the head of a shelf. */
export function PriceBlock({
  price,
  size = "md",
  each = false,
  className = "",
}: {
  price: Price | undefined;
  size?: "md" | "lg";
  /** "each" — the shelf header prices a whole series at once. */
  each?: boolean;
  className?: string;
}) {
  if (!price) return null;
  const big = size === "lg" ? "text-[48px]" : "text-[36px]";

  if (price.free) {
    return (
      <div className={className}>
        <p className={`font-display ${big} font-light leading-none text-ink`}>Free</p>
        <p className="mt-2.5 text-[13.5px] text-slate">
          Permanently. Not a trial, not a stripped build.
        </p>
      </div>
    );
  }

  const off = discountPct(price);
  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <span className={`font-display ${big} font-light leading-none tabular-nums text-ink`}>
          {money(price.now)}
        </span>
        {each && <span className="text-[15px] text-slate">each</span>}
        {off > 0 && (
          <>
            <s className="text-[16px] tabular-nums text-mute decoration-mute/70" aria-label={`list price ${money(price.list)}`}>
              {money(price.list)}
            </s>
            <span className="chip-gold !px-2.5 !py-1 !text-[12px]">{off}% off</span>
          </>
        )}
      </div>
      <p className="mt-2.5 text-[13.5px] text-slate">
        One payment · yours to keep <span className="text-mute">· updates included</span>
      </p>
    </div>
  );
}
