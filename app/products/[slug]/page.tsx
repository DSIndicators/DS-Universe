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
import { BY_SLUG, KIND_LABEL, PRODUCTS } from "@/content/products";
import { COVER_RATIO, boxartFor, isReleased, seriesMates, SHELVES } from "@/content/release";
import { BOARD_GROUND, shotsFor } from "@/content/shots";
import { CHART_GROUND, CHART_H, CHART_W, chartsFor } from "@/content/charts";
import { listingCopyFor } from "@/content/listing-copy";
import { COMPLETE, money, priceFor, seriesInfo } from "@/content/pricing";
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

  // ON THE CHART leads the page — the product as it looks on a real chart
  // (Tom, 2026-09-21). The annotated product-guide boards follow the body, as
  // the reading. A product with no chart of its own (the data utility) leads
  // with its boards instead.
  const chartSlides = charts.map((c) => ({
    src: c.src,
    w: CHART_W,
    h: CHART_H,
    blur: c.blur,
    title: c.caption,
    alt: `${p.name} on a NinjaTrader 8 chart — ${c.caption}`,
  }));
  const boardSlides = shots.map((b) => ({
    src: b.src,
    w: b.w,
    h: b.h,
    blur: b.blur,
    title: b.caption,
    alt: `${p.name} product guide — ${b.caption}`,
  }));
  const boardRatio = shots[0] ? shots[0].w / shots[0].h : 1;
  // The risk line travels with the FIRST pictures on the page — once, not per gallery.
  const riskLine = (
    <>
      {DISCLOSURE.chart}{" "}
      <Link href="/disclosures" className="whitespace-nowrap text-slate underline decoration-line underline-offset-4 hover:decoration-gold">
        Risk disclosures
      </Link>
      .
    </>
  );

  // "More like this" = the rest of the same series. A series of one (the data
  // utility) points at the flagship shelf instead, so no page ends in a dead end.
  const mates = seriesMates(p.slug);
  const moreShelf = mates.length ? { name: series.name, products: mates } : { name: SHELVES[0].info.name, products: SHELVES[0].products };

  return (
    <>
      {/* ---------------------------------------------------------------- head */}
      <section className="hero-wash">
        <div className="wrap pt-10 sm:pt-14 lg:pt-16">
          <Reveal>
            <Link href="/products" className="group inline-flex items-center gap-2 text-[14px] text-slate hover:text-ink">
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
            </Reveal>
            <Reveal className="lg:col-span-5 lg:justify-self-end" delay={100}>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1" aria-label="Highlights">
                {p.hooks.map((h) => (
                  <li key={h} className="flex items-center gap-3 rounded-lg border border-line bg-surface/80 px-4 py-3 text-[15px] text-ink">
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
              <p className="label mb-4">Product guide</p>
              <Gallery slides={boardSlides} ratio={boardRatio} ground={BOARD_GROUND} label={`${p.name} product guide`} mode="read" priority footnote={riskLine} />
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
            <Fact label="Platform" value={SITE.platform} />
          </dl>
        </Reveal>

        <Reveal className="lg:col-span-7 lg:col-start-6" delay={80}>
          <p className="label">How it helps</p>
          <p className="display-sm mt-5 leading-[1.45] text-ink text-pretty">{p.helps}</p>

          {/* ------------------------------------------------ price and buy */}
          <div className="mt-10 rounded-2xl border border-line bg-surface p-7 shadow-card sm:p-8">
            <PriceBlock price={price} size="lg" />
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <BuyButton slug={p.slug} />
              <Link href="/contact" className="btn-ghost">
                Ask a question
              </Link>
            </div>
            <CtaNote className="mt-3.5" />
            {/* The one bundle, said once, where the decision is being made. */}
            <p className="mt-6 border-t border-line pt-5 text-[14.5px] leading-relaxed text-slate">
              {price?.free ? "Also in " : "Or take everything — "}
              <Link href="/pricing#complete" className="text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                {COMPLETE.name}
              </Link>
              {price?.free
                ? ", every DS Universe product in one license."
                : `, every DS Universe product in one license, for ${money(COMPLETE.now)}.`}
            </p>
          </div>

          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-slate">{DISCLOSURE.short}</p>
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
      <TestFirst productName={p.name} />

      {/* ---------------------------------------------------------------- more */}
      <section className="border-t border-line">
        <div className="wrap py-20 lg:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label">{mates.length ? "From the same series" : "From the lineup"}</p>
              <h2 className="display-md mt-3 text-ink">{moreShelf.name}</h2>
            </div>
            <Link href="/products" className="group hidden items-center gap-2 text-[15px] text-ink sm:inline-flex">
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
      <dt className="text-[13px] text-mute">{label}</dt>
      <dd className="mt-1 text-[16px] text-ink">{value}</dd>
    </div>
  );
}
