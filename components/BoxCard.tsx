import Image from "next/image";
import Link from "next/link";
import { COVER_RATIO, boxartFor, productHref, resolveProduct } from "@/content/release";
import { WITH_BUNDLE, priceFor } from "@/content/pricing";
import { PENDING_NOTE, buyHref, buyLabel, isPending, listingFor, purchaseKey } from "@/content/whop";
import { PriceFigure } from "@/components/Price";
import { TrialMark } from "@/components/Trial";
import { Arrow } from "@/components/ui/Arrow";
import { TRIAL, trialHref } from "@/content/trial";
import { shotFor } from "@/content/loupe";
import { Lens } from "@/components/Loupe";

/**
 * One storefront tile: the box, then the name, what it is and what it costs —
 * the way a gallery labels a work.
 *
 * SIZING. Every cover is the same transparent 4:5 frame with the box at one
 * height on one baseline (content/release.ts), and every tile is one cell of a
 * fixed grid, so a box renders at exactly the same size on every shelf.
 * `object-contain` — the frame already carries its own margin and shadow.
 *
 * TWO DESTINATIONS, ONE TILE (Tom, 2026-09-10, restored now that products are
 * sold one by one again): the tile opens OUR product page; the hover button
 * opens the product's direct checkout ON WHOP (content/whop.ts, since the
 * 2026-09-25 opening). Pointer screens only — on touch the tile
 * is the one target, and the product page carries the button.
 *
 * STACKING — do not collapse the frame and the lifted art into one element.
 * A `transform` creates a stacking context; if the hover lift sat on the
 * element that holds the buy button, the button's z-20 would be trapped inside
 * it and the card link (z-10, a sibling) would paint over it and eat every click
 * — which is exactly the 2026-09-10 bug. So: an untransformed `relative` frame,
 * the lift on an inner absolute layer, and the button as the FRAME's child,
 * riding up with its own identical translate.
 * The same goes for `isolation: isolate`: the dark theme's `.spotlight` (the
 * light pool behind the box) needs its own stacking context, so it lives on a
 * layer INSIDE the frame, never on the frame itself (2026-09-21).
 */
export function BoxCard({
  slug,
  priority = false,
  bare = false,
  lead = false,
  chart = false,
  chartWidth = 380,
}: {
  slug: string;
  priority?: boolean;
  bare?: boolean;
  /**
   * THE LEAD TILE of a two-column phone grid that holds an odd number of boxes
   * (the Free Vault's nine, 2026-10-05). Below 640px it takes the whole first
   * row: its box stays in the first column at exactly the size of every other
   * box, and its words move into the second column beside it, with two of the
   * product's own hooks — so the grid has no empty cell and no tile left alone
   * on the last row. From 640px it is an ordinary tile.
   */
  lead?: boolean;
  /**
   * THE CHART TILE (Tom, 2026-10-08: "i like the chart designs more, so we'll
   * be moving to implement them to the products on the homepage"). In place
   * of the box: the product's own NinjaTrader chart through the loupe
   * (components/Loupe.tsx, in the store's gold), magnified where it does its
   * work, pulling back to the whole chart on hover. Everything under it —
   * name, category, price, the trial and DS Complete legends, the buy button
   * on hover — is the same tile. A product without a picture in
   * content/loupe.ts keeps its box.
   */
  chart?: boolean;
  /** The chart frame's widest CSS width at 1024px+, so the magnified picture
   *  is requested sharp (Shelf knows the column it sits in). */
  chartWidth?: number;
}) {
  const p = resolveProduct(slug);
  if (!p) return null;
  const price = priceFor(slug);
  // A product that comes free with DS Complete (DS ASL, DS Toolkit) is had by
  // buying DS Complete (content/whop.ts purchaseKey): its hover button says
  // "Get DS Complete".
  const listing = listingFor(purchaseKey(slug));
  const exclusive = !!price?.withComplete;
  // THE 3-DAY FREE TRIAL (2026-09-29, content/trial.ts). A trial product's
  // hover action is the trial — the lower step for someone still browsing; the
  // product page carries "Buy now" as before. The tile also carries one legend
  // line UNDER its price row, so the name, category and price stay on the same
  // baselines as every other tile in the row.
  const trial = trialHref(slug);
  const sizes = "(min-width: 1024px) 220px, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 90vw";

  const shot = chart ? shotFor(slug) : undefined;
  const buyLink = listing && (
    <a
      href={trial ?? buyHref(listing)}
      target="_blank"
      rel="noopener"
      className={
        shot
          ? "absolute bottom-[14px] left-1/2 z-20 hidden h-9 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-md bg-ivory/95 px-4 text-[12.5px] font-medium text-ground opacity-0 shadow-lift backdrop-blur-sm transition-all duration-300 ease-silk hover:bg-white focus-visible:opacity-100 md:flex md:group-hover:opacity-100"
          : "absolute inset-x-[16%] bottom-[9%] z-20 hidden h-9 items-center justify-center rounded-md bg-ivory/95 px-3 text-[12.5px] font-medium text-ground opacity-0 shadow-lift backdrop-blur-sm transition-all duration-300 ease-silk hover:bg-white focus-visible:opacity-100 md:flex md:translate-y-1 md:group-hover:-translate-y-1.5 md:group-hover:opacity-100"
      }
    >
      {trial ? TRIAL.ctaTile : buyLabel(slug)}
    </a>
  );

  return (
    <div className={`group relative w-full min-w-0 ${lead && !shot ? "max-sm:col-span-2 max-sm:grid max-sm:grid-cols-2 max-sm:items-end max-sm:gap-x-5" : ""}`}>
      {shot ? (
        <div className="relative">
          <Lens shot={shot} a={3 / 2} tone="gold" showMark priority={priority} cssWidth={{ lg: chartWidth, sm: "46vw", base: "92vw" }} />
          {buyLink}
        </div>
      ) : (
      <div className="relative" style={{ aspectRatio: String(COVER_RATIO) }}>
        <div className="spotlight absolute inset-0">
          <div className="absolute inset-0 transition-transform duration-500 ease-silk group-hover:-translate-y-1.5">
            <Image
              src={boxartFor(slug)}
              alt={`${p.name} box`}
              fill
              priority={priority}
              sizes={sizes}
              className="object-contain transition-transform duration-700 ease-silk group-hover:scale-[1.02]"
            />
          </div>
        </div>

        {buyLink}
      </div>
      )}

      {/* `bare` drops the label where the page around the tile already says
          all of it (the single-product shelf). */}
      {!bare && (
        <div className={`${shot ? "mt-4" : "mt-2"} px-0.5 ${lead && !shot ? "max-sm:mt-0 max-sm:pb-[7%]" : ""}`}>
          {/* The name never cuts off on a phone (2026-09-30 mobile scan:
              "DS Adaptive Price Li…"). Below 640px it
              may take two lines and every tile reserves both, so the
              category and the price row stay on one baseline across the
              row; from 640px it is one line, as before. */}
          <span className={`block font-display leading-tight text-ink transition-colors duration-300 group-hover:text-gold-deep ${shot ? "text-[16.5px] font-[500] tracking-[-0.012em]" : "min-h-[2.5em] text-[15px] line-clamp-2 sm:min-h-0 sm:line-clamp-1"}`}>
            {p.name}
          </span>
          <span className="mt-1 block truncate text-[12px] text-mute">{p.category}</span>
          {/* The lead tile's second column has the room a tile does not: two
              of the product's own hooks, phones only. */}
          {/* A chart tile says, in one line, what its picture shows. */}
          {shot && <span className="mt-2.5 block text-[13px] leading-snug text-slate text-pretty sm:min-h-[2.75em]">{shot.reading}</span>}
          {lead && !shot && (
            <span className="mt-3 hidden space-y-1.5 text-[12.5px] leading-snug text-slate max-sm:block" aria-hidden="true">
              {p.hooks.slice(0, 2).map((h) => (
                <span key={h} className="block text-pretty">
                  {h}
                </span>
              ))}
            </span>
          )}
          {/* The price, set rather than decorated (2026-09-27): a hairline, the
              figure in the display face, and an arrow that says the box opens.
              No pill — Tom: "cheap looking circled prices". */}
          <span className="mt-3 flex items-start justify-between gap-2 border-t border-line pt-3">
            <PriceFigure price={price} />
            <Arrow className="shrink-0 text-mute transition-all duration-300 ease-silk group-hover:translate-x-0.5 group-hover:text-gold-deep" />
          </span>
          {/* The trial legend. The short form below 440px, where a tile is
              under ~160px wide and the full phrase would not fit on one line
              (at 400px it wrapped to two — seen in the 2026-10-05 phone shots). */}
          {trial && (
            <span className="mt-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-bull-text" aria-hidden="true">
              <TrialMark />
              <span className="min-[440px]:hidden">{TRIAL.short}</span>
              <span className="hidden min-[440px]:inline">{TRIAL.label}</span>
            </span>
          )}
          {/* Its Whop listing does not exist yet (content/whop.ts
              PENDING_LISTING): said on the tile, so nobody opens the page
              expecting a button. Never seen live — a production build stops
              while anything is pending. */}
          {isPending(slug) && (
            <span className="mt-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute" aria-hidden="true">
              <span className="h-px w-3 shrink-0 bg-line-strong" />
              {PENDING_NOTE.label}
            </span>
          )}
          {/* Free with DS Complete: the price row above already says it in
              full (components/Price.tsx), so the legend line under it carries
              the other half — in gold, the thread's node, then its words. */}
          {exclusive && (
            <span className="mt-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gold" aria-hidden="true">
              <span className="h-[6px] w-[6px] shrink-0 rotate-45 border border-gold" />
              {WITH_BUNDLE.short}
            </span>
          )}
        </div>
      )}

      {/* The whole tile is the link to our page; the buy button sits above it. */}
      <Link href={productHref(p.slug)} className="absolute inset-0 z-10 rounded-xl">
        <span className="sr-only">{`${p.name} — ${p.category}${trial ? ` — ${TRIAL.label} available` : ""}${exclusive ? ` — ${WITH_BUNDLE.line}` : ""}${isPending(slug) ? ` — ${PENDING_NOTE.label.toLowerCase()}` : ""}`}</span>
      </Link>
    </div>
  );
}
