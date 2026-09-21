import Image from "next/image";
import Link from "next/link";
import { COVER_RATIO, boxartFor, resolveProduct } from "@/content/release";
import { priceFor } from "@/content/pricing";
import { buyHref, buyLabel, listingFor } from "@/content/whop";
import { PriceLine } from "@/components/Price";

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
 * opens the product's page ON WHOP. Pointer screens only — on touch the tile
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
            href={buyHref({ product: listing.product })}
            target="_blank"
            rel="noopener"
            className="absolute inset-x-[16%] bottom-[9%] z-20 hidden h-9 items-center justify-center rounded-full bg-ivory/95 px-3 text-[13px] font-medium text-ground opacity-0 shadow-lift backdrop-blur-sm transition-all duration-300 ease-silk hover:bg-white focus-visible:opacity-100 md:flex md:translate-y-1 md:group-hover:-translate-y-1.5 md:group-hover:opacity-100"
          >
            {buyLabel(slug)}
          </a>
        )}
      </div>

      {/* `bare` drops the label where the page around the tile already says
          all of it (the single-product shelf). */}
      {!bare && (
        <div className="mt-2 px-0.5">
          <span className="block truncate font-display text-[16.5px] leading-tight text-ink transition-colors duration-300 group-hover:text-gold-deep">
            {p.name}
          </span>
          <span className="mt-1 block truncate text-[12.5px] text-mute">{p.category}</span>
          {/* One quiet number. The crossed-out list price and the discount are
              said once, at the head of the shelf, not fifteen times. */}
          <PriceLine price={price} strike={false} className="mt-2 text-[14.5px]" />
        </div>
      )}

      {/* The whole tile is the link to our page; the buy button sits above it. */}
      <Link href={`/products/${p.slug}`} className="absolute inset-0 z-10 rounded-xl">
        <span className="sr-only">{`${p.name} — ${p.category}`}</span>
      </Link>
    </div>
  );
}
