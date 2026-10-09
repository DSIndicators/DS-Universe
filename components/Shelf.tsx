import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/ProductCard";
import { CoverArt } from "@/components/CoverArt";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { PriceTag } from "@/components/Price";
import { PriceList } from "@/components/PriceList";
import { isPaid, seriesPrice } from "@/content/pricing";
import Link from "next/link";
import { productHref, type Shelf as ShelfT } from "@/content/release";
import { soloDetailFor, type SoloDetail } from "@/content/solo";

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
 * THE GRID IS FIXED — five across from 1280px for every shelf, three from
 * 768px. A four-product shelf leaves its fifth cell empty rather than growing
 * its cards, so every card — and every square cover — is one size on every
 * shelf (the 2026-09-18 lesson, kept through the 2026-10-08 marketplace
 * cards, components/ProductCard.tsx). On a phone each card is a row.
 *
 * A SERIES OF ONE (the data utility): its square cover beside its purpose and
 * four highlights, and the buy button under the price. In the grid it would
 * be a single card marooned in four empty cells.
 *
 * TWO VIEWS (the /products store). With `views`, the panel renders its body
 * twice — `.v-covers` (the boxes) and `.v-list` (PriceList) — under the one
 * shared head, and the store bar's switch shows one (globals.css,
 * html[data-store-view]). The paragraph and the solo panel's own buy button
 * belong to the covers view: in the list every row carries its own button.
 */
/** A shelf card's rendered widths: five across from 1280px, three from 768px, two from 640px, a row on a phone. */
const CARD_SIZES = "(min-width: 1280px) min(320px, 17vw), (min-width: 768px) 30vw, (min-width: 640px) 45vw, 104px";

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

  const detail = solo ? soloDetailFor(solo.slug) : undefined;

  const covers = solo && detail ? (
    <SoloBody slug={solo.slug} name={solo.name} category={solo.category} hooks={solo.hooks} detail={detail} priority={priority} />
  ) : solo ? (
    <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
      {/* The single product by its square cover; the cover is the way to its
          page (its buy button is in the head). */}
      <Link href={productHref(solo.slug)} className="pcard pcard-store group block w-full max-w-[280px] shrink-0 2xl:max-w-[360px]" aria-label={`${solo.name} — ${solo.category}`}>
        <CoverArt slug={solo.slug} sizes="(min-width: 1536px) 360px, 280px" priority={priority} />
      </Link>
      <div className="flex-1">
        <p className="max-w-xl text-[length:calc(15px*var(--type))] leading-relaxed text-ink text-pretty">{solo.purpose}</p>
        <ul className="mt-6 grid max-w-xl gap-2.5 sm:grid-cols-2" aria-label={`${solo.name} highlights`}>
          {solo.hooks.map((h) => (
            <li key={h} className="flex items-center gap-3 border border-line bg-white/[0.02] px-4 py-3 text-[length:calc(13.5px*var(--type))] text-ink">
              <span className="block h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
              {h}
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : (
    <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-5">
      {products.map((p, i) => (
        <li key={p.slug} className="flex min-w-0">
          <ProductCard slug={p.slug} tone="store" hooks={1} sizes={CARD_SIZES} priority={priority && i < 5} className="w-full" />
        </li>
      ))}
    </ul>
  );

  return (
    <section id={info.key} className="scroll-mt-[148px]" aria-labelledby={`${info.key}-title`}>
      <Reveal className="series-panel relative overflow-hidden rounded-xl border border-line p-6 max-[359px]:p-4 sm:p-8 lg:p-10">
        {/* ---------------------------------------------------------- head */}
        <div className="grid gap-x-10 gap-y-7 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <h3 id={`${info.key}-title`} className="display-md text-ink">
              {info.name}
            </h3>
            <p className="mt-2.5 text-[length:calc(15px*var(--type))] leading-snug text-ink text-pretty">{info.tagline}</p>
            <CoversOnly>
              <p className="mt-3 max-w-2xl text-[length:calc(14px*var(--type))] leading-relaxed text-slate text-pretty">{info.blurb}</p>
            </CoversOnly>
          </div>
          <div className="md:col-span-5">
            {/* A series with mixed prices gets no head price — its products
                carry their own chips. Every series is uniform today. */}
            {price && <PriceTag price={price} each={!solo && isPaid(price)} align="end" />}
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

/**
 * THE DATA UTILITY, IN FULL (2026-10-09, Tom: "Use the product sheet to add
 * information to DS Bulk Market Replay to cover dead space"). The panel is
 * five cards wide and holds one product, so it is laid out as a spec sheet
 * rather than a lone tile: the cover, then why it exists and what you get,
 * then the run in four numbered steps, and under all three a ruled ledger of
 * the facts a buyer asks before paying — what the data is, how far back it
 * reaches, where it lands, which markets. Every line is the product sheet's
 * (content/solo.ts). Typography, hairlines and the grid do the work: no
 * badges, no glow.
 */
function SoloBody({
  slug,
  name,
  category,
  hooks,
  detail,
  priority,
}: {
  slug: string;
  name: string;
  category: string;
  hooks: string[];
  detail: SoloDetail;
  priority: boolean;
}) {
  return (
    <div className="mt-10">
      <div className="grid gap-10 md:grid-cols-12 md:gap-x-8 xl:gap-x-10">
        <div className="md:col-span-4 xl:col-span-3">
          <Link href={productHref(slug)} className="pcard pcard-store group block w-full max-w-[360px]" aria-label={`${name} — ${category}`}>
            <CoverArt slug={slug} sizes="(min-width: 1536px) 360px, (min-width: 768px) 30vw, 90vw" priority={priority} />
          </Link>
        </div>

        <div className="md:col-span-8 xl:col-span-5">
          <p className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-gold">Why it exists</p>
          <p className="mt-4 max-w-[34ch] font-display text-[length:calc(21px*var(--type))] font-normal leading-[1.32] tracking-[-0.012em] text-ink text-balance 2xl:text-[length:calc(23px*var(--type))]">
            {detail.why}
          </p>
          <p className="mt-4 max-w-[52ch] text-[length:calc(14.5px*var(--type))] leading-relaxed text-slate text-pretty">{detail.how}</p>
          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2" aria-label={`${name} highlights`}>
            {hooks.map((h) => (
              <li key={h} className="flex items-center gap-3 border border-line bg-white/[0.02] px-4 py-3 text-[length:calc(13.5px*var(--type))] text-ink">
                <span className="block h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-line pt-8 md:col-span-12 xl:col-span-4 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
          <p className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-gold">{detail.stepsHeading}</p>
          <ol className="mt-3 grid md:grid-cols-2 md:gap-x-8 xl:grid-cols-1">
            {detail.steps.map((s, i) => (
              <li key={s} className="grid grid-cols-[2.4rem_minmax(0,1fr)] items-baseline border-b border-line py-4 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0 xl:[&:nth-last-child(2)]:border-b">
                <span className="font-mono text-[length:calc(11px*var(--type))] tracking-[0.12em] text-gold" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[length:calc(14px*var(--type))] leading-relaxed text-ink text-pretty">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <dl className="mt-10 grid border-t border-line sm:grid-cols-2 xl:grid-cols-4">
        {detail.specs.map((s, i) => (
          <div
            key={s.label}
            className={`border-b border-line py-6 sm:pr-8 xl:border-b-0 xl:pb-0 ${i % 2 ? "sm:border-l sm:pl-8" : ""} ${i > 0 ? "xl:border-l xl:pl-8" : ""}`}
          >
            <dt className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-mute">{s.label}</dt>
            <dd className="mt-2.5 text-[length:calc(14px*var(--type))] leading-relaxed text-ink text-pretty">{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 max-w-3xl text-[length:calc(13px*var(--type))] leading-relaxed text-mute text-pretty xl:mt-10">{detail.close}</p>
    </div>
  );
}
