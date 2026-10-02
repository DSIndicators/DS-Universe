import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Arrow";
import { Gallery } from "@/components/Gallery";
import { ListingDetail } from "@/components/ListingDetail";
import { TestFirst } from "@/components/TestFirst";
import { BoxCard } from "@/components/BoxCard";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { PriceBlock } from "@/components/Price";
import { TrialHead, TrialStrip } from "@/components/Trial";
import { GiftHead, GiftStrip, giftBuyLabel } from "@/components/Sessions";
import { Markets } from "@/components/Markets";
import { BY_SLUG, KIND_LABEL, PRODUCTS } from "@/content/products";
import { CATALOGUE_ORDER, COVER_RATIO, boxartFor, isReleased, seriesMates } from "@/content/release";
import { BOARD_GROUND, shotsFor } from "@/content/shots";
import { CHART_GROUND, CHART_H, CHART_W, chartsFor } from "@/content/charts";
import { showcaseFor } from "@/content/showcase";
import { marketsFor } from "@/content/markets";
import { listingCopyFor } from "@/content/listing-copy";
import { APART, COMPLETE, FOUNDERS, GIFT, money, priceFor, seriesInfo } from "@/content/pricing";
import { PAIR } from "@/content/sessions";
import { DISCLOSURE, SITE } from "@/content/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return PRODUCTS.filter((p) => isReleased(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = BY_SLUG[slug];
  if (!p) return {};
  return { title: p.name, description: p.purpose };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = BY_SLUG[slug];
  if (!p || !isReleased(slug)) notFound();

  const price = priceFor(p.slug);
  const series = seriesInfo(p.series);
  const shots = shotsFor(p.slug);
  const charts = chartsFor(p.slug);
  const listingCopy = listingCopyFor(p.slug);
  const showcase = showcaseFor(p.slug);
  const markets = marketsFor(p.slug);

  // ON THE CHART leads the page — the product as it looks on a real chart
  // (Tom, 2026-09-21). The annotated product-guide boards follow the body, as
  // the reading. A product with no chart of its own (the data utility) leads
  // with its boards instead.
  // THE SHOWCASE RECORDING leads that first gallery (2026-09-28): the product
  // moving on a chart, then the stills.
  const showcaseSlide = showcase
    ? {
        src: showcase.src,
        w: showcase.w,
        h: showcase.h,
        blur: showcase.blur,
        title: showcase.caption,
        alt: `${p.name} — a screen recording of the software running`,
        video: { src: showcase.src, srcSmall: showcase.srcSmall, poster: showcase.poster, seconds: showcase.seconds },
      }
    : null;
  const stillSlides = charts.map((c) => ({
    src: c.src,
    w: CHART_W,
    h: CHART_H,
    blur: c.blur,
    title: c.caption,
    alt: `${p.name} on a NinjaTrader 8 chart — ${c.caption}`,
  }));
  const chartSlides = showcaseSlide && stillSlides.length ? [showcaseSlide, ...stillSlides] : stillSlides;
  const guideSlides = shots.map((b) => ({
    src: b.src,
    w: b.w,
    h: b.h,
    blur: b.blur,
    title: b.caption,
    alt: `${p.name} product guide — ${b.caption}`,
  }));
  const boardRatio = shots[0] ? shots[0].w / shots[0].h : 1;
  // A product with no chart of its own leads with its boards — and with its
  // recording in front of them, when it has one (it is made in the boards' shape).
  const leadsWithGuide = chartSlides.length === 0;
  const boardSlides = leadsWithGuide && showcaseSlide ? [showcaseSlide, ...guideSlides] : guideSlides;
  // The risk line travels with the FIRST pictures on the page — once, not per gallery.
  const riskLine = (
    <>
      {showcase ? DISCLOSURE.showcase : DISCLOSURE.chart}{" "}
      <Link href="/disclosures" className="whitespace-nowrap text-slate underline decoration-line underline-offset-4 hover:decoration-gold">
        Risk disclosures
      </Link>
      .
    </>
  );

  // "More like this" = the rest of the same series. A series of one (the data
  // utility) points at the flagship shelf instead, so no page ends in a dead end.
  const mates = seriesMates(p.slug);
  const moreShelf = mates.length ? { name: series.name, products: mates } : { name: CATALOGUE_ORDER[0].info.name, products: CATALOGUE_ORDER[0].products };

  return (
    <>
      {/* ---------------------------------------------------------------- head */}
      <section className="hero-wash">
        <div className="wrap pt-10 sm:pt-14 lg:pt-16">
          <Reveal>
            <Link href="/products" className="group inline-flex items-center gap-2 text-[13px] text-slate hover:text-ink">
              <Arrow className="rotate-180 group-hover:-translate-x-0.5" />
              All products
            </Link>
          </Reveal>
          <div className="grid gap-10 pb-28 pt-10 lg:grid-cols-12 lg:items-end lg:pb-36">
            <Reveal className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/products#${p.series}`} className="chip-gold hover:bg-gold-soft/70">
                  {series.name}
                </Link>
                <span className="label pl-1">{p.category}</span>
              </div>
              <h1 className="display-xl mt-5 text-ink">{p.name}</h1>
              <p className="lede mt-6 max-w-2xl text-pretty">{p.purpose}</p>
              {/* The 3-day free trial, where the product has one (2026-09-29):
                  the page's first action. Nothing renders for the others. */}
              <TrialHead slug={p.slug} className="mt-9" />
              {/* The Founders gift (2026-09-30): how the Pro tier is had. */}
              <GiftHead slug={p.slug} className="mt-9" />
            </Reveal>
            <Reveal className="lg:col-span-5 lg:justify-self-end" delay={100}>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1" aria-label="Highlights">
                {p.hooks.map((h) => (
                  <li key={h} className="flex items-center gap-3 rounded-lg border border-line bg-surface/80 px-4 py-3 text-[14px] text-ink">
                    <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ on the chart */}
      {chartSlides.length > 0 ? (
        <section className="wrap -mt-16 lg:-mt-24" aria-label={`${p.name} on the chart`}>
          <Reveal>
            <p className="label mb-4">On the chart</p>
            <Gallery slides={chartSlides} ratio={CHART_W / CHART_H} ground={CHART_GROUND} label={`${p.name} on the chart`} priority footnote={riskLine} />
          </Reveal>
        </section>
      ) : (
        boardSlides.length > 0 && (
          <section className="wrap -mt-16 lg:-mt-24" aria-label={`${p.name} product guide`}>
            <Reveal>
              <p className="label mb-4">{showcase ? "In action" : "Product guide"}</p>
              <Gallery slides={boardSlides} ratio={boardRatio} ground={BOARD_GROUND} label={`${p.name} ${showcase ? "in action" : "product guide"}`} mode="read" priority footnote={riskLine} />
            </Reveal>
          </section>
        )
      )}

      {/* ---------------------------------------------------------------- body */}
      <section className="wrap grid gap-12 py-20 lg:grid-cols-12 lg:py-28">
        <Reveal className="lg:col-span-4">
          {/* The box, small, above the facts — the page's one picture of the
              product as a product. */}
          <div className="spotlight relative w-[176px]" style={{ aspectRatio: String(COVER_RATIO) }}>
            <Image src={boxartFor(p.slug)} alt={`${p.name} box`} fill sizes="176px" className="object-contain" />
          </div>
          <dl className="mt-10 space-y-6 border-t border-line pt-8">
            <Fact label="Type" value={KIND_LABEL[p.kind].singular} />
            <Fact label="Series" value={series.name} />
            <Fact label="Category" value={p.category} />
            <Fact label="Platform" value={`${SITE.platform} · ${SITE.minBuild} or newer`} />
            {/* Where it runs (2026-10-01): the instruments it is built on and
                the markets it runs on, from what the product actually reads. */}
            {markets && <Markets markets={markets} />}
          </dl>
        </Reveal>

        <Reveal className="lg:col-span-7 lg:col-start-6" delay={80}>
          <p className="label">How it helps</p>
          <p className="display-sm mt-5 leading-[1.45] text-ink text-pretty">{p.helps}</p>

          {/* ------------------------------------------------ price and buy */}
          <div id="buy" className="mt-10 scroll-mt-[120px] overflow-hidden rounded-2xl border border-line bg-surface p-7 shadow-card sm:p-8">
            {/* The trial, across the top of the card — at the moment of deciding to pay. */}
            <TrialStrip slug={p.slug} />
            {/* The Founders gift, in the same place (2026-09-30). */}
            <GiftStrip slug={p.slug} />
            <PriceBlock price={price} size="lg" />
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {/* The Pro tier is bought as DS Complete: the button says so, and
                  what it costs, so the checkout it opens holds no surprise. */}
              <BuyButton slug={p.slug} label={price?.withComplete ? giftBuyLabel() : undefined} />
              <Link href="/contact" className="btn-ghost">
                Ask a question
              </Link>
            </div>
            <CtaNote className="mt-3.5" slug={p.slug} />
            {/* The one bundle, said once, where the decision is being made. */}
            <p className="mt-6 border-t border-line pt-5 text-[13.5px] leading-relaxed text-slate">
              {price?.withComplete ? (
                GIFT.owners
              ) : (
                <>
                  {price?.free ? "Also in " : "Or take everything — "}
                  <Link href="/products#complete" className="text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                    {COMPLETE.name}
                  </Link>
                  {p.slug === PAIR.free
                    ? `, every DS Universe product in one license — and the only way to get ${GIFT.name}, which adds each session's volume profile and POC.`
                    : price?.free
                      ? ", every DS Universe product in one license."
                      : FOUNDERS.active
                        ? `, every DS Universe product in one license — a ${money(APART)} value, ${money(COMPLETE.now)} in the ${FOUNDERS.name}.`
                        : `, every DS Universe product in one license, for ${money(COMPLETE.now)}.`}
                </>
              )}
            </p>
          </div>

          <p className="mt-8 max-w-xl text-[14px] leading-relaxed text-slate">{DISCLOSURE.short}</p>
        </Reveal>
      </section>

      {/* ------------------------------------------------------- product guide */}
      {chartSlides.length > 0 && boardSlides.length > 0 && (
        <section className="border-t border-line bg-wash" aria-label={`${p.name} product guide`}>
          <div className="wrap py-20 lg:py-28">
            <Reveal className="max-w-2xl">
              <p className="label">Product guide</p>
              <h2 className="display-md mt-3 text-ink text-balance">Every mark on the chart, explained</h2>
              <p className="body mt-4 text-pretty">
                The annotated boards: a chart, with what each part of {p.name} shows laid out beside it. Open any board to read it at full size.
              </p>
            </Reveal>
            <Reveal className="mt-10" delay={80}>
              <Gallery slides={boardSlides} ratio={boardRatio} ground={BOARD_GROUND} label={`${p.name} product guide`} mode="read" />
            </Reveal>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ in detail */}
      {listingCopy && <ListingDetail copy={listingCopy} />}

      {/* ----------------------------------------------------- test it yourself */}
      <TestFirst productName={p.name} slug={p.slug} />

      {/* ---------------------------------------------------------------- more */}
      <section className="border-t border-line">
        <div className="wrap py-20 lg:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label">{mates.length ? "From the same series" : "From the lineup"}</p>
              <h2 className="display-md mt-3 text-ink">{moreShelf.name}</h2>
            </div>
            <Link href="/products" className="group hidden items-center gap-2 text-[14px] text-ink sm:inline-flex">
              Every product
              <Arrow />
            </Link>
          </Reveal>
          <Reveal className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {moreShelf.products.slice(0, 5).map((m) => (
              <BoxCard key={m.slug} slug={m.slug} />
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12.5px] text-mute">{label}</dt>
      <dd className="mt-1 text-[14.5px] text-ink">{value}</dd>
    </div>
  );
}
