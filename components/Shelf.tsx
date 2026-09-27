import { Reveal } from "@/components/ui/Reveal";
import { BoxCard } from "@/components/BoxCard";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { PriceTag } from "@/components/Price";
import { PriceList } from "@/components/PriceList";
import { seriesPrice } from "@/content/pricing";
import type { Shelf as ShelfT } from "@/content/release";

/**
 * One series = one PANEL (rebuilt 2026-09-27).
 *
 * WHY A PANEL. The shelves used to be told apart by hairlines: heading, price,
 * a rule, the boxes — then the next heading straight under the last row of
 * boxes. Tom: "It shows a solid white line, then Products, then below it says
 * Pro Series Panel, $79.99, then another solid line. The flow is all wrong."
 * Rules only separate; they never say which side a heading belongs to. A
 * container does (NN/g, common region: "items within a boundary are perceived
 * as a group"), so each series now sits in its own rounded panel — name,
 * price and products inside one edge — and there are no rules at all.
 *
 * INSIDE: the name, the one-line tagline and the paragraph on the left; the
 * price, in gold, on the right with its terms under it; then the products.
 * Every product carries its own gold price chip as well, so a price is never
 * more than a glance from the box it belongs to.
 *
 * THE GRID IS FIXED — five across at lg for every shelf. A four-product shelf
 * leaves its fifth cell empty rather than growing its boxes: every cover is
 * normalised to one height in the artwork, and letting the layout rescale
 * them per shelf would undo exactly that (the 2026-09-18 lesson).
 *
 * A SERIES OF ONE (the data utility): its box beside its purpose and four
 * highlights, and the buy button under the price. In the grid it would be a
 * single box marooned in four empty cells.
 *
 * TWO VIEWS (the /products store). With `views`, the panel renders its body
 * twice — `.v-covers` (the boxes) and `.v-list` (PriceList) — under the one
 * shared head, and the store bar's switch shows one (globals.css,
 * html[data-store-view]). The paragraph and the solo panel's own buy button
 * belong to the covers view: in the list every row carries its own button.
 */
export function Shelf({
  shelf,
  priority = false,
  views = false,
}: {
  shelf: ShelfT;
  priority?: boolean;
  views?: boolean;
}) {
  const { info, products } = shelf;
  const price = seriesPrice(info.key);
  const solo = products.length === 1 ? products[0] : undefined;
  /** Wraps what only the covers view shows. A plain block — never put layout classes on it. */
  const CoversOnly = ({ children }: { children: React.ReactNode }) =>
    views ? <div className="v-covers">{children}</div> : <>{children}</>;

  const covers = solo ? (
    <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
      <div className="w-full max-w-[220px] shrink-0">
        <BoxCard slug={solo.slug} priority={priority} bare />
      </div>
      <div className="flex-1">
        <p className="max-w-xl text-[17px] leading-relaxed text-ink text-pretty">{solo.purpose}</p>
        <ul className="mt-6 grid max-w-xl gap-2.5 sm:grid-cols-2" aria-label={`${solo.name} highlights`}>
          {solo.hooks.map((h) => (
            <li key={h} className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-4 py-3 text-[14.5px] text-ink">
              <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
              {h}
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : (
    <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
      {products.map((p, i) => (
        <BoxCard key={p.slug} slug={p.slug} priority={priority && i < 5} />
      ))}
    </div>
  );

  return (
    <section id={info.key} className="scroll-mt-[148px]" aria-labelledby={`${info.key}-title`}>
      <Reveal className="series-panel relative overflow-hidden rounded-xl border border-line p-6 sm:p-8 lg:p-10">
        {/* ---------------------------------------------------------- head */}
        <div className="grid gap-x-10 gap-y-7 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <h3 id={`${info.key}-title`} className="display-md text-ink">
              {info.name}
            </h3>
            <p className="mt-2.5 text-[17px] leading-snug text-ink text-pretty">{info.tagline}</p>
            <CoversOnly>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate text-pretty">{info.blurb}</p>
            </CoversOnly>
          </div>
          <div className="md:col-span-5">
            {/* A series with mixed prices gets no head price — its products
                carry their own chips. Every series is uniform today. */}
            {price && <PriceTag price={price} each={!solo && !price.free} align="end" />}
            {solo && (
              <CoversOnly>
                <div className="mt-6 md:flex md:flex-col md:items-end md:text-right">
                  <BuyButton slug={solo.slug} />
                  <CtaNote className="mt-3 md:ml-auto" slug={solo.slug} />
                </div>
              </CoversOnly>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------- body */}
        {views ? (
          <>
            <div className="v-covers">{covers}</div>
            <div className="v-list">
              <div className="mt-8">
                <PriceList products={products} />
              </div>
            </div>
          </>
        ) : (
          covers
        )}
      </Reveal>
    </section>
  );
}
