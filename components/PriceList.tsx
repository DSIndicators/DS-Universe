import Image from "next/image";
import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import { PRICES, discountPct, money } from "@/content/pricing";
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
export function PriceList({ products }: { products: Product[] }) {
  return (
    <ul aria-label="Price list">
      {products.map((p) => {
        const pr = PRICES[p.slug];
        const off = discountPct(pr);
        return (
          <li
            key={p.slug}
            className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-line py-4 sm:grid-cols-[52px_minmax(0,1fr)_auto_auto] sm:gap-x-6"
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
              <Link href={`/products/${p.slug}`} className="font-display text-[17px] text-ink transition-colors hover:text-gold-deep">
                {p.name}
              </Link>
              <p className="mt-0.5 truncate text-[13.5px] text-slate">{p.category}</p>
            </div>
            {/* Price and button share one line under the name on a phone, and
                become the row's last two columns from 640px (sm:contents). */}
            <div className="col-start-2 flex items-center justify-between gap-4 sm:contents">
              <div className="flex items-baseline gap-2.5 tabular-nums sm:justify-self-end">
                {pr.free ? (
                  <span className="text-[16px] text-gold-deep">Free</span>
                ) : (
                  <>
                    {off > 0 && (
                      <s className="text-[14px] text-mute decoration-mute/70" aria-label={`list price ${money(pr.list)}`}>
                        {money(pr.list)}
                      </s>
                    )}
                    <span className="text-[17px] text-ink">{money(pr.now)}</span>
                  </>
                )}
              </div>
              <BuyButton slug={p.slug} variant="ghost" className="!h-10 !px-4 !text-[14px]" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
