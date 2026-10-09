import Link from "next/link";
import { CoverArt } from "@/components/CoverArt";
import { TrialMark } from "@/components/Trial";
import { WITH_BUNDLE, money, priceFor } from "@/content/pricing";
import { productHref, resolveProduct } from "@/content/release";
import { TRIAL, trialHref } from "@/content/trial";
import { PENDING_NOTE, buyHref, buyLabel, isPending, listingFor, purchaseKey } from "@/content/whop";

/**
 * THE PRODUCT CARD — the marketplace's one tile (2026-10-08).
 *
 * Tom: "The free vault and all the products looks like journal links that
 * users can read, not a marketplace." What made them read as a journal: a
 * serial number and a caption about one picture ("The line from the live
 * candle to 29145.50…"), a magnified detail with a label pinned on it, and no
 * visible way to get the product — the tile was a link to an article.
 *
 * What a store tile needs (Baymard, product lists; NN/g, product photos on
 * listing pages), and nothing else:
 *   · ONE picture format for every product — the square cover
 *     (content/covers.ts) — so the grid scans as a set and products compare;
 *   · the same attributes on every card, each set apart by type, in one fixed
 *     order: its name, what kind of tool it is, what it does for you (the
 *     product's own hooks, never a caption of the picture), its price;
 *   · the ACTION on the card, always visible, not only on hover — "Get it
 *     free" / "Buy now" / "Try 3 days free" — straight to its Whop checkout;
 *   · one hit area for everything that goes to the product page (the whole
 *     card, with one synchronised hover), and the button kept apart as the
 *     only element that goes somewhere else (Baymard: 76% of sites leave
 *     users unsure what a click on a list item will do).
 *
 * TONE: brass in the Free Vault, gold — the store's money colour — elsewhere.
 * Sharp corners, hairlines and type; no pill, glow or gradient (Tom,
 * 2026-09-27). On a phone the card is a row — the square cover beside the
 * words — so a list of products scans top to bottom.
 *
 * STACKING. The card link covers the whole card (z-10); the button sits above
 * it (z-20) as its sibling. The hover lift is on the card itself, which holds
 * both, so the button is never trapped under the link (the 2026-09-10 bug).
 */

export type CardTone = "vault" | "store";
export type CardWhy = { id: string; label: string; note: string };

export function ProductCard({
  slug,
  tone = "store",
  hooks = 2,
  why,
  sizes,
  priority = false,
  phoneRow = true,
  className = "",
}: {
  slug: string;
  tone?: CardTone;
  /** How many of the product's hooks to list (one on narrow cards). */
  hooks?: number;
  /** In a search: the evidence lines for the keys that matched, shown in
   *  place of the hooks, so the visitor reads WHY the product came up. */
  why?: CardWhy[];
  /** The card's rendered widths at each breakpoint, for the cover request. */
  sizes: string;
  priority?: boolean;
  /** Below 640px, the card as a row (cover beside the words). */
  phoneRow?: boolean;
  className?: string;
}) {
  const p = resolveProduct(slug);
  if (!p) return null;
  const price = priceFor(slug);
  const listing = listingFor(purchaseKey(slug));
  const trial = trialHref(slug);
  const exclusive = !!price?.withComplete;
  const pending = isPending(slug);
  const figure = !price ? null : price.free ? "Free" : price.withComplete ? WITH_BUNDLE.label : money(price.now);
  const lines = why?.length ? null : p.hooks.slice(0, hooks);

  const row = phoneRow ? "max-sm:grid max-sm:grid-cols-[104px_minmax(0,1fr)] max-sm:gap-x-4 max-sm:p-3" : "";

  return (
    <article className={`pcard pcard-${tone} group relative flex min-w-0 flex-col ${row} ${className}`}>
      <div className={`pcard-media ${phoneRow ? "max-sm:self-start max-sm:border-b-0" : ""}`}>
        <CoverArt slug={slug} sizes={sizes} priority={priority} />
      </div>

      <div className={`flex min-w-0 flex-1 flex-col p-4 ${phoneRow ? "max-sm:p-0" : ""}`}>
        <h3 className="pcard-name font-display text-[16.5px] font-[500] leading-tight tracking-[-0.012em] text-ink">{p.name}</h3>
        <p className="mt-1 truncate text-[12px] leading-tight text-mute">{p.category}</p>

        {lines && lines.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {lines.map((h, i) => (
              <li key={h} className={`flex gap-2 text-[12.5px] leading-snug text-slate ${i > 0 && phoneRow ? "max-sm:hidden" : ""}`}>
                <svg viewBox="0 0 10 10" width="10" height="10" className="pcard-tick mt-[3px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                  <path d="M1.5 5.2 4 7.6 8.6 2.4" strokeLinecap="square" />
                </svg>
                <span className="text-pretty">{h}</span>
              </li>
            ))}
          </ul>
        )}
        {why && why.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {why.slice(0, 3).map((w) => (
              <li key={w.id} className="text-[12.5px] leading-snug">
                <span className="pcard-tick mr-2 font-mono text-[9.5px] uppercase tracking-[0.14em]">{w.label}</span>
                <span className="text-slate text-pretty">{w.note}</span>
              </li>
            ))}
          </ul>
        )}

        {/* One legend line where a card has one: the trial, the bundle, or a
            listing that is not open yet. */}
        {trial && (
          <p className="mt-3 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-bull-text">
            <TrialMark />
            {TRIAL.label}
          </p>
        )}
        {exclusive && (
          <p className="mt-3 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-gold">
            <span className="h-[6px] w-[6px] shrink-0 rotate-45 border border-gold" aria-hidden="true" />
            {WITH_BUNDLE.short}
          </p>
        )}
        {pending && (
          <p className="mt-3 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-mute">
            <span className="h-px w-3 shrink-0 bg-line-strong" aria-hidden="true" />
            {PENDING_NOTE.label}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3 sm:flex-col sm:items-stretch">
            {figure && (
              <span className={`pcard-price font-display tabular-nums ${exclusive ? "text-[13.5px] leading-snug" : "text-[18px] leading-none"} ${price?.free ? "pcard-free" : "text-ink"}`}>
                {figure}
              </span>
            )}
            {listing && !pending && (
              <a href={trial ?? buyHref(listing)} target="_blank" rel="noopener" className="pcard-btn">
                {trial ? TRIAL.ctaTile : buyLabel(slug)}
                <span className="sr-only">{` — ${p.name}, opens Whop in a new tab`}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Everything but the button goes to our product page. */}
      <Link href={productHref(p.slug)} className="pcard-link absolute inset-0 z-10">
        <span className="sr-only">{`${p.name} — ${p.category}${trial ? ` — ${TRIAL.label}` : ""}${exclusive ? ` — ${WITH_BUNDLE.line}` : ""}. Details.`}</span>
      </Link>
    </article>
  );
}
