import { Reveal } from "@/components/ui/Reveal";
import { BoxCard } from "@/components/BoxCard";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { PriceBlock } from "@/components/Price";
import { seriesPrice } from "@/content/pricing";
import type { Shelf as ShelfT } from "@/content/release";

/**
 * One series on the shelf: what it is, what each one costs, then the boxes.
 *
 * THE GRID IS FIXED — five across at lg for every shelf. A four-product shelf
 * leaves its fifth cell empty rather than growing its boxes: every cover is
 * normalised to one height in the artwork, and letting the layout rescale
 * them per shelf would undo exactly that (the 2026-09-18 lesson).
 *
 * A SERIES OF ONE (the data utility) is the exception: its box beside its own
 * four highlights and its buy button. In the grid it would be a single box
 * marooned in four empty cells.
 */
export function Shelf({ shelf, priority = false }: { shelf: ShelfT; priority?: boolean }) {
  const { info, products } = shelf;
  const price = seriesPrice(info.key);
  const solo = products.length === 1 ? products[0] : undefined;

  return (
    <section id={info.key} className="scroll-mt-28">
      <Reveal className="grid gap-x-10 gap-y-6 border-b border-line-strong pb-7 md:grid-cols-12">
        <div className="md:col-span-7 lg:col-span-8">
          <h3 className="display-md text-ink">{info.name}</h3>
          <p className="mt-2.5 text-[17px] leading-snug text-ink text-pretty">{info.tagline}</p>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate text-pretty">{info.blurb}</p>
        </div>
        <div className="md:col-span-5 md:justify-self-end lg:col-span-4">
          {/* A series with mixed prices gets no header price — its tiles
              carry their own. Every series is uniform today. */}
          {price && <PriceBlock price={price} each={!solo && !price.free} />}
          {solo && (
            <div className="mt-6">
              <BuyButton slug={solo.slug} />
              <CtaNote className="mt-3" slug={solo.slug} />
            </div>
          )}
        </div>
      </Reveal>

      {solo ? (
        <Reveal className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
          <div className="w-full max-w-[240px] shrink-0">
            <BoxCard slug={solo.slug} priority={priority} bare />
          </div>
          <div className="flex-1">
            <p className="max-w-xl text-[17px] leading-relaxed text-ink text-pretty">{solo.purpose}</p>
            <ul className="mt-6 grid max-w-xl gap-2.5 sm:grid-cols-2" aria-label={`${solo.name} highlights`}>
              {solo.hooks.map((h) => (
                <li key={h} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-[14.5px] text-ink">
                  <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ) : (
        <Reveal className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p, i) => (
            <BoxCard key={p.slug} slug={p.slug} priority={priority && i < 5} />
          ))}
        </Reveal>
      )}
    </section>
  );
}
