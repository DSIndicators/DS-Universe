import Image from "next/image";
import Link from "next/link";
import type { ShelfEntry } from "@/content/release";
import { resolveProduct } from "@/content/release";
import { buyLabel, listingFor } from "@/content/whop";
import { priceFor, tilePrice } from "@/content/pricing";
import { WAITLIST_NOTE, onWaitlist } from "@/content/launch";
import { Mark } from "@/components/ui/Mark";

/**
 * One storefront tile, with the product named beneath the way a gallery labels
 * a work. Indicators use portrait box art (3:4); add-ons use their landscape
 * banner (16:9) via `wide`. A quiet "Free" chip overlays free products.
 *
 * The whole tile is a link to the product page (a stretched overlay link, so
 * the name and category below are part of the same target). On top of it, on
 * hover, sits a small buy button straight to Whop checkout — a returning buyer
 * goes from the shelf to the payment window without the stop in between. It is
 * deliberately pointer-only: on touch there is no hover, and tapping opens the
 * product page, which carries the same button.
 *
 * STRUCTURE — do not collapse these two divs back into one. The buy button has
 * to out-stack the stretched card link, and a `transform` (the hover lift)
 * creates a new stacking context that traps every z-index inside it. When the
 * lift and the button lived on the same element, the button's z-20 was sealed
 * inside that context and the card link at z-10 swallowed every click — the
 * button looked right and quietly opened the product page instead of Whop.
 * So: an untransformed frame holds the positioning, the lift goes on an inner
 * div, and the button is the frame's own child, riding the same lift itself.
 */
export function BoxCard({
  entry,
  wide = false,
  priority = false,
}: {
  entry: ShelfEntry;
  wide?: boolean;
  priority?: boolean;
}) {
  // 11:9 is the add-on art's own proportion (1134x928) — see content/release.ts.
  const frame = wide ? "aspect-[11/9]" : "aspect-[3/4]";
  const sizes = wide
    ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
    : "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw";

  // ---- placeholder: product not in the catalogue yet (no sheet copy) ----
  if (entry.pending) {
    return (
      <div className="group">
        <div className={`relative ${frame} overflow-hidden rounded-xl border border-dashed border-line-strong bg-mist`}>
          <FreeChip show={!!entry.free} />
          <WaitChip />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <Mark size={34} className="text-mute" />
            <span className="font-display text-[17px] text-slate">{entry.pending.name}</span>
            <span className="label !text-[10.5px]">Cover &amp; copy pending</span>
          </div>
        </div>
        <div className="mt-3">
          <span className="block font-display text-[16.5px] leading-tight text-mute">{entry.pending.name}</span>
          <span className="label mt-1 block !text-[11px]">Coming to the catalogue</span>
        </div>
      </div>
    );
  }

  const p = resolveProduct(entry.slug);
  if (!p) return null;
  const listing = listingFor(p.slug);
  const price = tilePrice(priceFor(p.slug));

  return (
    <div className="group relative">
      {/* Frame: no transform of its own, so it stays a clean stacking context. */}
      <div className={`relative ${frame}`}>
        {/* The art, and the hover lift. Transformed — nothing clickable in here. */}
        <div className="absolute inset-0 overflow-hidden rounded-xl ring-1 ring-black/10 transition-all duration-500 ease-silk group-hover:-translate-y-1 group-hover:shadow-lift group-hover:ring-black/20">
          <FreeChip show={!!entry.free} />
          <WaitChip />
          {entry.boxart ? (
            <Image
              src={entry.boxart}
              alt={`${p.name} cover`}
              fill
              priority={priority}
              sizes={sizes}
              className="object-cover transition-transform duration-700 ease-silk group-hover:scale-[1.035]"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-mist px-4 text-center">
              <Mark size={34} className="text-mute" />
              <span className="font-display text-[17px] text-slate">{p.name}</span>
              <span className="label !text-[10.5px]">Cover art pending</span>
            </div>
          )}
        </div>

        {/* Straight to the product's page ON WHOP (Tom, 2026-09-10) — the shelf
            is browsing, so the buyer lands on the listing with its price, offer
            and full description, not in a payment form. The direct checkout link
            belongs on our own product page, where they have already decided.

            Sibling of the lifted art, not a child of it, so its z-20 genuinely
            beats the card link at z-10. It carries the same -translate-y-1 on
            hover so it rides up with the art it sits on; that doubles as its
            reveal (it starts 4px low and transparent). */}
        {listing && (
          <a
            href={listing.product}
            target="_blank"
            rel="noopener"
            aria-label={`${buyLabel(listing)} — ${p.name}`}
            className="absolute inset-x-2.5 bottom-2.5 z-20 hidden translate-y-1 items-center justify-center rounded-md bg-white/95 py-2 text-[13px] font-medium text-ink opacity-0 shadow-sm ring-1 ring-black/10 backdrop-blur-sm transition-all duration-300 ease-silk hover:bg-white focus-visible:-translate-y-1 focus-visible:opacity-100 group-hover:-translate-y-1 group-hover:opacity-100 md:flex"
          >
            {buyLabel(listing)}
          </a>
        )}
      </div>

      <div className="mt-3">
        <span className="block truncate font-display text-[16.5px] leading-tight text-ink transition-colors duration-300 group-hover:text-gold-deep">
          {p.name}
        </span>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="label truncate !text-[11px]">{p.category}</span>
          {/* One number, no strikethrough. The shelf is a gallery; the case for
              the price is made on the product page and on /pricing. */}
          {price && (
            <span className="shrink-0 text-[13px] tabular-nums text-slate">{price}</span>
          )}
        </div>
      </div>

      {/* The card itself — stretched under the buy button so both stay clickable. */}
      <Link href={`/products/${p.slug}`} className="absolute inset-0 z-10 rounded-xl">
        <span className="sr-only">{`${p.name} — ${p.category}`}</span>
      </Link>
    </div>
  );
}

/**
 * The temporary waitlist mark. Opposite corner from the Free chip so the two
 * never collide, and gold rather than white because it is a state of the shop,
 * not a property of the product — it leaves with one switch in content/launch.ts.
 */
function WaitChip() {
  if (!onWaitlist()) return null;
  return (
    <span className="absolute right-2.5 top-2.5 z-20 rounded-full bg-gold-tint/95 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-gold-deep shadow-sm ring-1 ring-gold/30">
      {WAITLIST_NOTE.chip}
    </span>
  );
}

function FreeChip({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="absolute left-2.5 top-2.5 z-20 rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-medium tracking-[0.02em] text-ink shadow-sm ring-1 ring-black/10">
      Free
    </span>
  );
}
