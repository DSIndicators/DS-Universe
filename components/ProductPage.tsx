import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Arrow";
import { Gallery } from "@/components/Gallery";
import { ProductMedia, type MediaItem } from "@/components/ProductMedia";
import { BuyBar } from "@/components/BuyBar";
import { ProductReplay } from "@/components/ProductReplay";
import { Defer } from "@/components/ui/Defer";
import { hasReplay } from "@/content/engine";
import { TestFirst } from "@/components/TestFirst";
import { ProductCard } from "@/components/ProductCard";
import { ogCardFor, squareCoverFor } from "@/content/covers";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { PriceTag } from "@/components/Price";
import { TrialButton, TrialLabel } from "@/components/Trial";
import { keepPrice, startsWhen, trialHref } from "@/content/trial";
import { ExclusiveLabel, completeBuyLabel } from "@/components/Exclusive";
import { VaultLabel } from "@/components/Vault";
import { Markets } from "@/components/Markets";
import { BY_SLUG, KIND_LABEL, VAULT } from "@/content/products";
import { COMPLETE_PRODUCTS, COMPLETE_SHELVES, STORE_PATH, VAULT_PATH, productHref, seriesMates } from "@/content/release";
import { shotsFor } from "@/content/shots";
import { CHART_H, CHART_W, chartsFor } from "@/content/charts";
import { showcaseFor } from "@/content/showcase";
import { marketsFor, HOME_MARKETS } from "@/content/markets";
import { listingCopyFor } from "@/content/listing-copy";
import { pointersFor } from "@/content/pointers";
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

/**
 * THE PAGE, AS A STORE'S PRODUCT PAGE (rebuilt 2026-10-09). Tom: "transform
 * it into a product looking page, ours looks like a journal. move our videos
 * to the bottom, tight pointer informations from the master worksheet that
 * will grab the users attention … we must provide services they NEED."
 *
 * Top to bottom:
 *   1. THE BUY STAGE — the pictures on the left (ProductMedia: charts, the
 *      annotated boards, the box art; no recording), and beside them a buy box
 *      that stays in view while they are browsed: the name, the sheet's one
 *      line for it (pointers.ts, NT8 "Cover Line"), what it is, the price and
 *      the button (or the trial, or DS Complete), what you get, and the specs.
 *      Under the pictures, "Why you need it" — the sheet's "How It Helps".
 *   2. THE POINTERS — the listing's own heading and lede as a statement, and
 *      its four points as a numbered grid (Whop Listings).
 *   3. BEFORE YOU BUY — where it runs, what it reads (Markets tab), and the
 *      listing's closing lines (no repaint, what it is not).
 *   4. Test it first (unchanged).
 *   5. SEE IT WORK — DS Replay (2026-10-09, v4): the product's shipped rules
 *      drawn on a composed scenario (real candles) the visitor drives like a chart
 *      (components/engine, content/engine.ts, tools/showcase). Products without a chart (DS Bulk Replay
 *      Downloader, DS Toolkit) keep their recording here, "In motion".
 *   6. More from the same shelf.
 * Once the buy box has scrolled away, a slim bar keeps the price and the
 * button at the foot of the window (BuyBar).
 *
 * Both routes render it: /products/<slug> (the store, plus DS ASL and DS
 * Toolkit, which come free with DS Complete) and /free-vault/<slug> (the
 * vault), so a free page and a paid page cannot drift apart. What differs is
 * said by the product's own data, as before: a vault product carries the
 * vault's label, its free terms and the note that it is NOT part of DS
 * Complete; a paid one offers DS Complete; DS ASL and DS Toolkit are had by
 * buying DS Complete.
 */
export function ProductPage({ slug }: { slug: string }) {
  const p = BY_SLUG[slug];
  const inVault = p.series === VAULT;
  const home = inVault ? { href: VAULT_PATH, label: VAULT_COPY.label } : { href: STORE_PATH, label: "Products" };

  const price = priceFor(p.slug);
  const series = seriesInfo(p.series);
  const shots = shotsFor(p.slug);
  const charts = chartsFor(p.slug);
  const copy = listingCopyFor(p.slug);
  const showcase = showcaseFor(p.slug);
  const markets = marketsFor(p.slug);
  const sheet = pointersFor(p.slug);
  const cover = squareCoverFor(p.slug);
  const trial = trialHref(p.slug);
  const keep = keepPrice(p.slug);
  const bundled = bundledFor(p.slug);

  // THE PICTURES: the charts first, then the annotated boards, then the box
  // art. The recording is kept for the foot of the page.
  const media: MediaItem[] = [
    ...charts.map((c) => ({ src: c.src, w: CHART_W, h: CHART_H, blur: c.blur, caption: c.caption, alt: `${p.name} on a NinjaTrader 8 chart — ${c.caption}`, kind: "chart" as const })),
    ...shots.map((b) => ({ src: b.src, w: b.w, h: b.h, blur: b.blur, caption: b.caption, alt: `${p.name} product guide — ${b.caption}`, kind: "board" as const })),
    ...(cover ? [{ src: cover.src, w: cover.w, h: cover.h, caption: `${p.name} · ${p.category}`, alt: cover.alt, kind: "cover" as const }] : []),
  ];

  // "More like this" = the rest of the same series. A series of one (the data
  // utility) points at the flagship shelf instead, so no page ends in a dead
  // end. A vault product only ever points at the rest of the vault. A product
  // that comes free with DS Complete points at the rest of DS Complete: the
  // other one that comes with it first, then the bundle in the ledger's order.
  const mates = seriesMates(p.slug);
  const moreShelf = bundled
    ? { name: COMPLETE.name, products: [...mates, ...COMPLETE_PRODUCTS.filter((x) => x.slug !== p.slug && !mates.some((m) => m.slug === x.slug))] }
    : mates.length
      ? { name: series.name, products: mates }
      : { name: COMPLETE_SHELVES[0].info.name, products: COMPLETE_SHELVES[0].products };
  const more = moreShelf.products.slice(0, 5);

  // STRUCTURED DATA (2026-10-09): schema.org Product for search engines — the
  // name, what it is, its square cover and the one offer it is sold by. Only
  // facts the page already states: no rating, no review count. A product that
  // is not sold on its own (DS ASL, DS Toolkit) has no offer, so none is
  // printed; nor is one for a product without its cover yet.
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

  /** The words beside the license row and under the box: how it is owned. */
  const license = price?.withComplete ? "Inside the DS Complete archive · updates included" : price?.free ? "Free, permanently · not a trial" : "One payment · yours to keep · updates included";
  const buyLabel = price?.withComplete ? completeBuyLabel() : undefined;
  const points = copy?.points ?? p.hooks;
  const odd = points.length % 2 === 1;

  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}

      {/* ======================================================= 1. the buy stage */}
      <section className="hero-wash">
        <div className="wrap pb-20 pt-8 sm:pt-10 lg:pb-28 lg:pt-12">
          {/* where this page sits */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[length:calc(13px*var(--type))] text-mute">
            <Link href={home.href} className="text-slate transition-colors hover:text-ink">
              {home.label}
            </Link>
            {!inVault && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`${STORE_PATH}#${price?.withComplete ? "complete" : p.series}`} className="text-slate transition-colors hover:text-ink">
                  {price?.withComplete ? COMPLETE.name : series.name}
                </Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="text-ink" aria-current="page">
              {p.name}
            </span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-14 2xl:gap-x-16">
            {/* ------------------------------------------------- the pictures */}
            <div className="min-w-0 lg:col-span-7 lg:row-start-1">
              <ProductMedia
                items={media}
                label={`${p.name}: pictures`}
                priority
                footnote={
                  <>
                    {DISCLOSURE.chart}{" "}
                    <Link href="/disclosures" className="whitespace-nowrap text-slate underline decoration-line underline-offset-4 hover:decoration-gold">
                      Risk disclosures
                    </Link>
                    .
                  </>
                }
              />
            </div>

            {/* -------------------------------------------------- the buy box */}
            <aside className="lg:col-span-5 lg:row-span-2 lg:row-start-1" aria-label={`Buy ${p.name}`}>
              <div className="lg:sticky lg:top-[108px]">
                <div className="overflow-hidden rounded-[12px] border border-line bg-[rgba(13,16,20,0.78)] backdrop-blur-[2px]">
                  <div className="px-6 pb-7 pt-6 sm:px-8 sm:pt-7">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      {inVault ? (
                        <Link href={VAULT_PATH} className="transition-opacity hover:opacity-80">
                          <VaultLabel />
                        </Link>
                      ) : price?.withComplete ? (
                        <ExclusiveLabel />
                      ) : (
                        <Link href={`${STORE_PATH}#${p.series}`} className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-deep">
                          {series.name}
                        </Link>
                      )}
                      {p.category.toLowerCase() !== (price?.withComplete ? "" : inVault ? "" : series.name.toLowerCase()) && (
                        <span className="label min-[400px]:border-l min-[400px]:border-line-strong min-[400px]:pl-3">{p.category}</span>
                      )}
                    </div>
                    <h1 className="display-lg mt-5 text-ink">{p.name}</h1>
                    {sheet.line && (
                      <p className="mt-3 font-display text-[length:calc(21px*var(--type))] font-normal leading-snug tracking-[-0.012em] text-ink text-balance 2xl:text-[length:calc(23px*var(--type))]">
                        {sheet.line}
                      </p>
                    )}
                    <p className="mt-4 text-[length:calc(14.5px*var(--type))] leading-relaxed text-slate text-pretty">{p.purpose}</p>
                  </div>

                  {/* price and the way to own it */}
                  <div id="buy" className="scroll-mt-[120px] border-t border-line px-6 py-7 sm:px-8">
                    <PriceTag price={price} size="lg" />
                    {trial ? (
                      <div className="mt-7">
                        <TrialLabel />
                        <div className="mt-3.5 flex flex-wrap items-center gap-3">
                          <TrialButton slug={p.slug} />
                          <BuyButton slug={p.slug} variant="ghost" />
                        </div>
                        <p className="mt-3.5 text-[length:calc(13px*var(--type))] leading-snug text-slate text-pretty">
                          No card. The three days start {startsWhen()}.
                          {keep ? (
                            <>
                              {" "}
                              <span className="tabular-nums text-ink">{keep}</span> to keep it.
                            </>
                          ) : null}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-7 flex flex-wrap items-center gap-3">
                        <BuyButton slug={p.slug} label={buyLabel} />
                        <Link href="/contact" className="btn-ghost">
                          Ask a question
                        </Link>
                      </div>
                    )}
                    <CtaNote className="mt-3.5" slug={p.slug} />
                  </div>

                  {/* what you get */}
                  <div className="border-t border-line px-6 py-6 sm:px-8">
                    <p className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-mute">What you get</p>
                    <ul className="mt-3.5 space-y-2.5" aria-label="Highlights">
                      {p.hooks.map((h) => (
                        <li key={h} className="flex items-start gap-3 text-[length:calc(14px*var(--type))] leading-snug text-ink">
                          <Check />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* the specs */}
                  <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-t border-line px-6 py-6 text-[length:calc(13.5px*var(--type))] sm:px-8">
                    <Spec label="Platform" value={`${SITE.platform} · ${SITE.minBuild} or newer`} />
                    <Spec label="Type" value={KIND_LABEL[p.kind].singular} />
                    {markets && <Spec label="Runs on" value={markets.headline} />}
                    {markets?.builtOn && <Spec label="Built on" value={HOME_MARKETS.join(" · ")} />}
                    <Spec label="License" value={license} />
                  </dl>

                  {/* the one other way to have it */}
                  <p className="border-t border-line bg-white/[0.015] px-6 py-5 text-[length:calc(13px*var(--type))] leading-relaxed text-slate sm:px-8">
                    {bundled ? (
                      bundled.note
                    ) : inVault ? (
                      <>
                        {VAULT_COPY.pageNote}{" "}
                        <Link href={VAULT_PATH} className="whitespace-nowrap text-ink underline decoration-bull/60 underline-offset-4 hover:decoration-bull-text">
                          {VAULT_COPY.pageLink}
                        </Link>
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
              </div>
            </aside>

            {/* ------------------------------------------- why you need it */}
            <div className="min-w-0 lg:col-span-7 lg:row-start-2">
              <div className="border-t border-line pt-8">
                <p className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-gold">Why you need it</p>
                <p className="mt-4 max-w-[62ch] text-[length:calc(17px*var(--type))] leading-[1.6] text-ink text-pretty 2xl:text-[length:calc(18px*var(--type))]">{p.helps}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= 2. the pointers */}
      <section className="border-y border-line bg-mist" aria-labelledby="pointers-title">
        <div className="wrap grid gap-12 py-20 lg:grid-cols-12 lg:gap-10 lg:py-24 2xl:py-28">
          <Reveal className="lg:col-span-5">
            <p id="pointers-title" className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-gold">
              {copy?.heading ?? "What you get"}
            </p>
            <p className="display-md mt-5 max-w-[24ch] text-ink text-balance">{copy?.lede ?? p.purpose}</p>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={80}>
            <ol className="grid border-l border-t border-line sm:grid-cols-2">
              {points.map((pt, i) => (
                <li
                  key={pt}
                  className={`flex flex-col border-b border-r border-line bg-ground/40 p-6 sm:p-7 ${odd && i === points.length - 1 ? "sm:col-span-2" : ""}`}
                >
                  <span className="font-mono text-[length:calc(11px*var(--type))] tracking-[0.14em] text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mt-4 text-[length:calc(15.5px*var(--type))] leading-[1.5] text-ink text-pretty">{pt}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ======================================================== 3. before you buy */}
      <section aria-labelledby="before-title">
        <div className="wrap py-20 lg:py-24">
          <Reveal className="max-w-2xl">
            <p className="label">Before you buy</p>
            <h2 id="before-title" className="display-md mt-3 text-ink text-balance">
              What it needs, where it runs, and what it is not.
            </h2>
          </Reveal>
          <Reveal className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12" delay={80}>
            <div className="border-t border-line-strong pt-6">
              <p className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-mute">Where it runs</p>
              {markets ? (
                <dl className="mt-4">
                  <Markets markets={markets} />
                </dl>
              ) : (
                <p className="mt-4 text-[length:calc(14.5px*var(--type))] text-ink">{SITE.platform}</p>
              )}
            </div>
            <div className="border-t border-line-strong pt-6">
              <p className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-mute">What it reads</p>
              <p className="mt-4 text-[length:calc(14.5px*var(--type))] leading-relaxed text-ink text-pretty">{sheet.reads ?? "The chart's own bars."}</p>
              <p className="mt-4 text-[length:calc(13px*var(--type))] leading-relaxed text-slate">
                {SITE.platform} · {SITE.minBuild} or newer. Everything runs on your machine, on your own data feed.
              </p>
            </div>
            <div className="border-t border-line-strong pt-6">
              <p className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-mute">Good to know</p>
              <div className="mt-4 space-y-3">
                {(copy?.close ?? []).map((c) => (
                  <p key={c} className="text-[length:calc(14.5px*var(--type))] leading-relaxed text-ink text-pretty">
                    {c}
                  </p>
                ))}
              </div>
              <p className="mt-5 text-[length:calc(12.5px*var(--type))] leading-relaxed text-mute">{DISCLOSURE.short}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======================================================= 4. test it first */}
      <TestFirst productName={p.name} slug={p.slug} />

      {/* ===================================================== 5. on real NQ */}
      {hasReplay(p.slug) ? (
        <section className="border-t border-line" aria-labelledby="replay-title">
          <div className="wrap py-20 lg:py-24">
            <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="label">See it work</p>
                <h2 id="replay-title" className="display-md mt-3 text-ink text-balance">
                  {p.name}, moment by moment
                </h2>
              </div>
              <p className="max-w-[56ch] text-[length:calc(15px*var(--type))] leading-relaxed text-slate text-pretty lg:col-span-5">
                The conditions {p.name} is built for, drawn by its shipped rules. Scroll and scale it like a chart, replay it bar by bar, jump
                between its moments, or switch the chart to light.
              </p>
            </Reveal>
            <div className="mt-10">
              <Defer near className="min-h-[640px] sm:min-h-[720px] lg:min-h-[800px]">
                <ProductReplay slug={p.slug} name={p.name} />
              </Defer>
            </div>
            <p className="mt-5 max-w-[110ch] text-[length:calc(12.5px*var(--type))] leading-relaxed text-mute">
              {DISCLOSURE.replay}{" "}
              <Link href="/disclosures" className="whitespace-nowrap text-slate underline decoration-line underline-offset-4 hover:decoration-gold">
                Risk disclosures
              </Link>
              .
            </p>
          </div>
        </section>
      ) : (
        showcase && (
        <section className="border-t border-line" aria-labelledby="motion-title">
          <div className="wrap py-20 lg:py-24">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="label">In motion</p>
                <h2 id="motion-title" className="display-md mt-3 text-ink text-balance">
                  See {p.name} run
                </h2>
              </div>
              <span className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-mute">Recording · {showcase.seconds} s</span>
            </Reveal>
            <Reveal className="mt-10" delay={80}>
              <Gallery
                slides={[
                  {
                    src: showcase.src,
                    w: showcase.w,
                    h: showcase.h,
                    blur: showcase.blur,
                    title: showcase.caption,
                    alt: `${p.name} — a screen recording of the software running`,
                    video: { src: showcase.src, srcSmall: showcase.srcSmall, poster: showcase.poster, seconds: showcase.seconds },
                  },
                ]}
                ratio={showcase.w / showcase.h}
                ground="#040404"
                label={`${p.name} in motion`}
                footnote={
                  <>
                    {DISCLOSURE.showcase}{" "}
                    <Link href="/disclosures" className="whitespace-nowrap text-slate underline decoration-line underline-offset-4 hover:decoration-gold">
                      Risk disclosures
                    </Link>
                    .
                  </>
                }
              />
            </Reveal>
          </div>
        </section>
      )
      )}

      {/* ================================================================ 6. more */}
      <section className="border-t border-line">
        <div className="wrap py-20 lg:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label">{inVault ? "More in the vault" : bundled ? "Also in the bundle" : mates.length ? "From the same series" : "From the lineup"}</p>
              <h2 className="display-md mt-3 text-ink">{moreShelf.name}</h2>
            </div>
            <Link href={home.href} className="group hidden items-center gap-2 text-[length:calc(14px*var(--type))] text-ink sm:inline-flex">
              {inVault ? "The whole vault" : "Every product"}
              <Arrow />
            </Link>
          </Reveal>
          <Reveal className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-5">
            {more.map((m) => (
              <div key={m.slug} className={`flex ${moreCell(more.indexOf(m), more.length)}`}>
                <ProductCard slug={m.slug} tone={inVault ? "vault" : "store"} hooks={1} sizes={MORE_SIZES} className="w-full" />
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- the buy bar */}
      <BuyBar watch="buy">
        {cover && (
          <span className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-[4px] border border-line sm:block">
            <Image src={cover.src} alt="" fill sizes="40px" className="object-cover" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[length:calc(15px*var(--type))] text-ink">{p.name}</span>
          {sheet.line && <span className="hidden truncate text-[length:calc(12.5px*var(--type))] text-mute md:block">{sheet.line}</span>}
        </span>
        <span
          className={`shrink-0 font-display font-[350] tabular-nums text-ink ${
            price?.withComplete ? "hidden text-[length:calc(15px*var(--type))] md:block" : "text-[length:calc(16px*var(--type))] sm:text-[length:calc(20px*var(--type))]"
          }`}
        >
          {price?.free ? "Free" : price?.withComplete ? WITH_BUNDLE.label : price ? money(price.now) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          {trial ? (
            <TrialButton slug={p.slug} className="!h-10" />
          ) : (
            /* DS ASL / DS Toolkit: the price is in the label on wider screens; a phone gets the short form. */
            <BuyButton slug={p.slug} label={price?.withComplete ? (onWaitlist() ? undefined : `Get ${COMPLETE.name}`) : buyLabel} className="!h-10" />
          )}
          {trial && <BuyButton slug={p.slug} variant="ghost" className="!hidden !h-10 lg:!inline-flex" />}
        </span>
      </BuyBar>
    </>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="mt-[3px] h-3.5 w-3.5 shrink-0 text-bull-text" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5l3.2 3L13 4.5" />
    </svg>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-mute">{label}</dt>
      <dd className="text-ink">{value}</dd>
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
const MORE_SIZES = "(min-width: 1280px) min(320px, 17vw), (min-width: 640px) 30vw, 104px";
