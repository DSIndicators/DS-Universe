import Image from "next/image";
import Link from "next/link";
import { COVER_RATIO, boxartFor, resolveProduct } from "@/content/release";
import { priceFor } from "@/content/pricing";
import { buyHref, buyLabel, listingFor } from "@/content/whop";
import { PriceFigure } from "@/components/Price";
import { TrialMark } from "@/components/Trial";
import { Arrow } from "@/components/ui/Arrow";
import { TRIAL, trialHref } from "@/content/trial";

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
export function BoxCard({ slug, priority = false, bare = false }: { slug: string; priority?: boolean; bare?: boolean }) {
  const p = resolveProduct(slug);
  if (!p) return null;
  const price = priceFor(slug);
  const listing = listingFor(slug);
  // THE 3-DAY FREE TRIAL (2026-09-29, content/trial.ts). A trial product's
  // hover action is the trial — the lower step for someone still browsing; the
  // product page carries "Buy now" as before. The tile also carries one legend
  // line UNDER its price row, so the name, category and price stay on the same
  // baselines as every other tile in the row.
  const trial = trialHref(slug);
  const sizes = "(min-width: 1024px) 220px, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 90vw";

  return (
    <div className="group relative w-full min-w-0">
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

        {listing && (
          <a
            href={trial ?? buyHref(listing)}
            target="_blank"
            rel="noopener"
            className="absolute inset-x-[16%] bottom-[9%] z-20 hidden h-9 items-center justify-center rounded-md bg-ivory/95 px-3 text-[12.5px] font-medium text-ground opacity-0 shadow-lift backdrop-blur-sm transition-all duration-300 ease-silk hover:bg-white focus-visible:opacity-100 md:flex md:translate-y-1 md:group-hover:-translate-y-1.5 md:group-hover:opacity-100"
          >
            {trial ? TRIAL.ctaTile : buyLabel(slug)}
          </a>
        )}
      </div>

      {/* `bare` drops the label where the page around the tile already says
          all of it (the single-product shelf). */}
      {!bare && (
        <div className="mt-2 px-0.5">
          <span className="block truncate font-display text-[15px] leading-tight text-ink transition-colors duration-300 group-hover:text-gold-deep">
            {p.name}
          </span>
          <span className="mt-1 block truncate text-[12px] text-mute">{p.category}</span>
          {/* The price, set rather than decorated (2026-09-27): a hairline, the
              figure in the display face, and an arrow that says the box opens.
              No pill — Tom: "cheap looking circled prices". */}
          <span className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <PriceFigure price={price} />
            <Arrow className="text-mute transition-all duration-300 ease-silk group-hover:translate-x-0.5 group-hover:text-gold-deep" />
          </span>
          {/* The trial legend. The short form below 400px, where a tile is
              ~125px wide and the full phrase would not fit on one line. */}
          {trial && (
            <span className="mt-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-bull-text" aria-hidden="true">
              <TrialMark />
              <span className="min-[400px]:hidden">{TRIAL.short}</span>
              <span className="hidden min-[400px]:inline">{TRIAL.label}</span>
            </span>
          )}
        </div>
      )}

      {/* The whole tile is the link to our page; the buy button sits above it. */}
      <Link href={`/products/${p.slug}`} className="absolute inset-0 z-10 rounded-xl">
        <span className="sr-only">{`${p.name} — ${p.category}${trial ? ` — ${TRIAL.label} available` : ""}`}</span>
      </Link>
    </div>
  );
}
