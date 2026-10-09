import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Arrow";
import { Gallery } from "@/components/Gallery";
import { ListingDetail } from "@/components/ListingDetail";
import { TestFirst } from "@/components/TestFirst";
import { ProductCard } from "@/components/ProductCard";
import { CoverArt } from "@/components/CoverArt";
import { ogCardFor, squareCoverFor } from "@/content/covers";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { PriceBlock } from "@/components/Price";
import { TrialHead, TrialStrip } from "@/components/Trial";
import { trialHref } from "@/content/trial";
import { ExclusiveHead, ExclusiveStrip, completeBuyLabel } from "@/components/Exclusive";
import { VaultLabel } from "@/components/Vault";
import { Markets } from "@/components/Markets";
import { BY_SLUG, KIND_LABEL, VAULT } from "@/content/products";
import { COMPLETE_PRODUCTS, COMPLETE_SHELVES, STORE_PATH, VAULT_PATH, productHref, seriesMates } from "@/content/release";
import { BOARD_GROUND, shotsFor } from "@/content/shots";
import { CHART_GROUND, CHART_H, CHART_W, chartsFor } from "@/content/charts";
import { showcaseFor } from "@/content/showcase";
import { marketsFor } from "@/content/markets";
import { listingCopyFor } from "@/content/listing-copy";
import { APART, COMPLETE, FOUNDERS, WITH_BUNDLE, bundledFor, money, priceFor, seriesInfo } from "@/content/pricing";
import { VAULT_COPY } from "@/content/vault";
import { DISCLOSURE, SITE } from "@/content/site";
import { onWaitlist } from "@/content/launch";

/**
 * ONE PRODUCT'S PAGE — the same page at two addresses (2026-10-05):
 *
 *   /products/<slug>     every product in the store, and the two that come
 *                        free with DS Complete (DS ASL, DS Toolkit)
 *   /free-vault/<slug>   every product in the Free Vault
 *
 * Both routes render this component, so a free product's page and a paid
 * product's page cannot drift apart. What differs is said by the product's
 * own data: a vault product is headed by the vault's label instead of a
 * series chip, goes back to the vault, says under its price that it is its
 * own free download and NOT part of DS Complete, and ends on the rest of the
 * vault. A paid product offers DS Complete. DS ASL and DS Toolkit come free
 * with DS Complete and are not sold on their own: the two pages are built the
 * same way — the "Free with DS Complete" head and strip, a button that buys DS
 * Complete, that product's own note under it, and the rest of DS Complete below.
 */
/** DS Session Levels' page names the tool that adds its volume. */
const ASL = bundledFor("asl")!;
if (!ASL) throw new Error('components/ProductPage.tsx: "asl" is no longer in BUNDLED (content/pricing.ts).');

export function productMetadata(slug: string): Metadata {
  const p = BY_SLUG[slug];
  if (!p) return {};
  // Its own share card when it has a cover (content/covers.ts ogCardFor);
  // otherwise the site card from app/layout.tsx carries on.
  const card = ogCardFor(p.slug);
  const title = `${p.name} — ${p.category}`;
  return {
    title: p.name,
    description: p.purpose,
    alternates: { canonical: productHref(p.slug) },
    ...(card
      ? {
          openGraph: { title, description: p.purpose, type: "website", url: productHref(p.slug), siteName: SITE.name, images: [{ url: card, width: 1200, height: 630, alt: `${p.name} on a NinjaTrader 8 chart` }] },
          twitter: { card: "summary_large_image", title, description: p.purpose, images: [card] },
        }
      : {}),
  };
}

export function ProductPage({ slug }: { slug: string }) {
  const p = BY_SLUG[slug];
  const inVault = p.series === VAULT;
  /** Where this page came from, and goes back to. */
  const home = inVault ? { href: VAULT_PATH, label: VAULT_COPY.label } : { href: STORE_PATH, label: "All products" };

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
  // utility) points at the flagship shelf instead, so no page ends in a dead
  // end. A vault product only ever points at the rest of the vault. A product
  // that comes free with DS Complete points at the rest of DS Complete: the
  // other one that comes with it first, then the bundle in the ledger's order.
  const mates = seriesMates(p.slug);
  const bundled = bundledFor(p.slug);
  const moreShelf = bundled
    ? { name: COMPLETE.name, products: [...mates, ...COMPLETE_PRODUCTS.filter((x) => x.slug !== p.slug && !mates.some((m) => m.slug === x.slug))] }
    : mates.length
      ? { name: series.name, products: mates }
      : { name: COMPLETE_SHELVES[0].info.name, products: COMPLETE_SHELVES[0].products };
  const more = moreShelf.products.slice(0, 5);
  // The head leaves room under it for the gallery that overlaps it; a product
  // with no pictures yet (a new one) closes its head at the ordinary depth.
  const hasLead = chartSlides.length > 0 || boardSlides.length > 0;

  // STRUCTURED DATA (2026-10-09): schema.org Product for search engines — the
  // name, what it is, its square cover and the one offer it is sold by. Only
  // facts the page already states: no rating, no review count. A product that
  // is not sold on its own (DS ASL, DS Toolkit) has no offer, so none is
  // printed; nor is one for a product without its cover yet.
  const cover = squareCoverFor(p.slug);
  const offer = price && !price.withComplete ? (price.free ? "0.00" : price.now.toFixed(2)) : null;
  const ld =
    cover && offer
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.purpose,
          category: p.category,
          image: `${SITE.url}${cover.src}`,
          brand: { "@type": "Brand", name: SITE.name },
          url: `${SITE.url}${productHref(p.slug)}`,
          offers: {
            "@type": "Offer",
            price: offer,
            priceCurrency: "USD",
            availability: onWaitlist() ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
            url: `${SITE.url}${productHref(p.slug)}`,
          },
        }
      : null;

  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
      {/* ---------------------------------------------------------------- head */}
      <section className="hero-wash">
        <div className="wrap pt-10 sm:pt-14 lg:pt-16">
          <Reveal>
            <Link href={home.href} className="group inline-flex items-center gap-2 text-[13px] text-slate hover:text-ink">
              <Arrow className="rotate-180 group-hover:-translate-x-0.5" />
              {home.label}
            </Link>
          </Reveal>
          <div className={`grid gap-10 pt-10 lg:grid-cols-12 lg:items-end ${hasLead ? "pb-28 lg:pb-36" : "pb-12 lg:pb-16"}`}>
            <Reveal className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {inVault ? (
                  // The vault's own label, in its own voice — not the store's gold chip.
                  <Link href={VAULT_PATH} className="transition-opacity hover:opacity-80">
                    <VaultLabel />
                  </Link>
                ) : (
                  // A series with no panel in the store (free with DS Complete) goes to DS Complete, where it is.
                  <Link href={`${STORE_PATH}#${price?.withComplete ? "complete" : p.series}`} className="chip-gold hover:bg-gold-soft/70">
                    {series.name}
                  </Link>
                )}
                <span className={`label ${inVault ? "border-l border-line-strong pl-3" : "pl-1"}`}>{p.category}</span>
              </div>
              <h1 className="display-xl mt-5 text-ink">{p.name}</h1>
              <p className="lede mt-6 max-w-2xl text-pretty">{p.purpose}</p>
              {/* The 3-day free trial, where the product has one (2026-09-29):
                  the page's first action. Nothing renders for the others. */}
              <TrialHead slug={p.slug} className="mt-9" />
              {/* Free with DS Complete (DS ASL, DS Toolkit): how it is had. */}
              <ExclusiveHead slug={p.slug} className="mt-9" />
              {/* THE BUY LINE (2026-10-09): every other product shows its price
                  and its button in the first screen, as a store's product page
                  does — before, they waited at the price card below the
                  gallery. A trial product leads with its trial (above); a
                  product free with DS Complete with how it is had. */}
              {price && !price.withComplete && !trialHref(p.slug) && (
                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <span className={`font-display text-[30px] font-[300] leading-none tabular-nums ${price.free ? "text-bull-text" : "text-ink"}`}>{price.free ? "Free" : money(price.now)}</span>
                  <BuyButton slug={p.slug} />
                  <span className="text-[13px] leading-snug text-slate">{price.free ? "Permanently · not a trial" : "One payment · yours to keep"}</span>
                </div>
              )}
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
          {/* The product's square cover, small, above the facts — the same
              picture its card carries on every shelf (content/covers.ts). */}
          <CoverArt slug={p.slug} sizes="(min-width: 1024px) 300px, 280px" className="w-full max-w-[280px] border border-line lg:max-w-[300px]" />
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
            {/* Free with DS Complete, in the same place. */}
            <ExclusiveStrip slug={p.slug} />
            <PriceBlock price={price} size="lg" />
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {/* DS ASL and DS Toolkit are had by buying DS Complete: the button
                  says so, and what it costs, so the checkout it opens holds no
                  surprise. */}
              <BuyButton slug={p.slug} label={price?.withComplete ? completeBuyLabel() : undefined} />
              <Link href="/contact" className="btn-ghost">
                Ask a question
              </Link>
            </div>
            <CtaNote className="mt-3.5" slug={p.slug} />
            {/* Said once, where the decision is being made. A PAID product
                offers the one bundle. A FREE product says the opposite, in the
                sheet's own words: it is its own download and not part of DS
                Complete (2026-10-05 — paid and free are kept apart). */}
            <p className="mt-6 border-t border-line pt-5 text-[13.5px] leading-relaxed text-slate">
              {bundled ? (
                bundled.note
              ) : inVault ? (
                <>
                  {VAULT_COPY.pageNote}{" "}
                  <Link href={VAULT_PATH} className="whitespace-nowrap text-ink underline decoration-bull/60 underline-offset-4 hover:decoration-bull-text">
                    {VAULT_COPY.pageLink}
                  </Link>
                  {/* The free session levels and the tool that adds their volume. */}
                  {p.slug === "session-levels" && (
                    <>
                      {" "}
                      · {ASL.name} adds each session&rsquo;s volume profile and POC, and {WITH_BUNDLE.line}:{" "}
                      <Link href={productHref(ASL.slug)} className="whitespace-nowrap text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                        {ASL.name}
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  Or take the whole paid lineup —{" "}
                  <Link href="/products#complete" className="text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                    {COMPLETE.name}
                  </Link>
                  {FOUNDERS.active
                    ? `, every paid DS Universe product in one license — a ${money(APART)} value, ${money(COMPLETE.now)} in the ${FOUNDERS.name}.`
                    : `, every paid DS Universe product in one license, for ${money(COMPLETE.now)}.`}
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
              <p className="label">{inVault ? "More in the vault" : bundled ? "Also in the bundle" : mates.length ? "From the same series" : "From the lineup"}</p>
              <h2 className="display-md mt-3 text-ink">{moreShelf.name}</h2>
            </div>
            <Link href={home.href} className="group hidden items-center gap-2 text-[14px] text-ink sm:inline-flex">
              {inVault ? "The whole vault" : "Every product"}
              <Arrow />
            </Link>
          </Reveal>
          {/* Up to five cards on a desktop row (1280px+). Narrower grids show
              only as many as close a full row — three in the tablet's three
              columns — so no card is left alone on a last row; a phone lists
              up to four as rows (moreCell). The marketplace card, as on every
              shelf (components/ProductCard.tsx). */}
          <Reveal className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-5">
            {more.map((m, i) => (
              <div key={m.slug} className={`flex ${moreCell(i, more.length)}`}>
                <ProductCard slug={m.slug} tone={inVault ? "vault" : "store"} hooks={1} sizes={MORE_SIZES} className="w-full" />
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}

/**
 * Which of the "more" cards show at which width, so every grid closes on a
 * full row: up to four rows on a phone, three from 640px (three cards), five
 * from 1280px (all of them). Written out in full — Tailwind cannot see a
 * class built from a number.
 */
function moreCell(i: number, n: number) {
  const phone = Math.min(n, 4); // cards listed as rows on a phone
  const tablet = n > 3 ? 3 : n; // cards shown in three columns
  const onPhone = i < phone, onTablet = i < tablet;
  if (onPhone && onTablet) return "min-w-0";
  if (onPhone && !onTablet) return "min-w-0 sm:hidden xl:flex";
  if (!onPhone && onTablet) return "hidden min-w-0 sm:flex";
  return "hidden min-w-0 xl:flex";
}

/** The "more" cards' rendered widths: five across from 1280px, three from 640px, a row on a phone. */
const MORE_SIZES = "(min-width: 1280px) 210px, (min-width: 640px) 30vw, 104px";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12.5px] text-mute">{label}</dt>
      <dd className="mt-1 text-[14.5px] text-ink">{value}</dd>
    </div>
  );
}
