import Image from "next/image";
import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import { PriceFigure } from "@/components/Price";
import { External, TrialMark } from "@/components/Trial";
import { TRIAL, trialHref } from "@/content/trial";
import { GIFT, PRICES, discountPct, isPaid, money } from "@/content/pricing";
import { COVER_RATIO, boxartFor } from "@/content/release";
import type { Product } from "@/content/products";

/**
 * The "Price list" view of a shelf: one row per product — a small cover, the
 * name and what it is, the price, and its buy button. The same products and the
 * same numbers as the covers view, laid out to be scanned down a column
 * (Baymard: a list beats a grid for comparing one attribute across products).
 *
 * This is the old /pricing page's list, moved into the store it duplicated
 * (2026-09-27). Numbers come from content/pricing.ts only.
 */
export function PriceList({ products, buttonWidth = 124 }: { products: Product[]; buttonWidth?: number }) {
  // Every row of one list shares one button width, so the price column stays
  // on one line. 124px fits "Buy now" and "Get it free"; the Session levels
  // list passes 168px for "Get DS Complete" (2026-09-30).
  const bw = { width: buttonWidth };
  return (
    <>
    {/* Column heads, like a printed price list — from 640px, where the row
        is a true table row. */}
    <div className="hidden grid-cols-[52px_minmax(0,1fr)_auto_auto] gap-x-6 pb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute sm:grid" aria-hidden="true">
      <span />
      <span>Product</span>
      <span className="min-w-[84px] text-right">Price</span>
      <span style={bw} />
    </div>
    <ul aria-label="Price list">
      {products.map((p) => {
        const pr = PRICES[p.slug];
        const off = discountPct(pr);
        return (
          <li
            key={p.slug}
            className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-t border-line py-4 sm:grid-cols-[52px_minmax(0,1fr)_auto_auto] sm:gap-x-6"
          >
            <Link
              href={`/products/${p.slug}`}
              className="spotlight relative block w-[52px]"
              style={{ aspectRatio: String(COVER_RATIO) }}
              tabIndex={-1}
              aria-hidden="true"
            >
              <Image src={boxartFor(p.slug)} alt="" fill sizes="52px" className="object-contain" />
            </Link>
            <div className="min-w-0">
              <Link href={`/products/${p.slug}`} className="font-display text-[15px] text-ink transition-colors hover:text-gold-deep">
                {p.name}
              </Link>
              <p className="mt-0.5 truncate text-[12.5px] text-slate">{p.category}</p>
              {/* The 3-day free trial (content/trial.ts): a direct link, on
                  the rows that have one. The row's own price and buy button
                  are untouched. */}
              {trialHref(p.slug) && (
                <a
                  href={trialHref(p.slug)}
                  target="_blank"
                  rel="noopener"
                  className="mt-1.5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-bull-text transition-colors hover:text-ink"
                >
                  <TrialMark />
                  {TRIAL.ctaTile}
                  <External className="!h-3 !w-3" />
                </a>
              )}
              {/* The Founders gift (2026-09-30): the row that is bought as DS Complete. */}
              {pr?.withComplete && (
                <span className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gold">
                  <span className="h-[6px] w-[6px] shrink-0 rotate-45 border border-gold" aria-hidden="true" />
                  {GIFT.label}
                </span>
              )}
            </div>
            {/* Price and button share one line under the name on a phone, and
                become the row's last two columns from 640px (sm:contents). */}
            <div className="col-start-2 flex items-center justify-between gap-4 sm:contents">
              <div className="flex items-center gap-2.5 sm:justify-self-end">
                {off > 0 && isPaid(pr) && (
                  <s className="text-[13px] tabular-nums text-mute decoration-mute/70" aria-label={`list price ${money(pr.list)}`}>
                    {money(pr.list)}
                  </s>
                )}
                <PriceFigure price={pr} size="md" className="sm:min-w-[84px] sm:text-right" />
              </div>
              <span className="contents sm:block sm:shrink-0" style={bw}>
                <BuyButton slug={p.slug} variant="ghost" className="!h-10 !px-4 !text-[13px] sm:w-full" />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
    </>
  );
}
