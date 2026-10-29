import type { Metadata } from "next";
import Link from "next/link";
import { AskButton } from "@/components/AskButton";
import { CompleteActions } from "@/components/CompleteActions";
import { Cover } from "@/components/Cover";
import { Markets } from "@/components/Markets";
import { WideFigure } from "@/components/Wide";
import { SectionBar } from "@/components/SectionBar";
import { deskFor } from "@/content/capabilities";
import { COVERS, PRODUCT_VIEWS } from "@/content/catalog";
import { AFTER_CHECKOUT, AFTER_CHECKOUT_FREE, onWaitlist } from "@/content/launch";
import { actionFor, COMPLETE_HREF } from "@/content/links";
import { marketsFor } from "@/content/markets";
import { PRODUCT_PAGE as T } from "@/content/pages";
import { pointersFor } from "@/content/pointers";
import { COMPLETE, COMPLETE_COPY, IN_COMPLETE_LABEL, priceFor, seriesInfo } from "@/content/pricing";
import { fitWord } from "@/components/fit";
import { BY_SLUG, KIND_LABEL, VAULT } from "@/content/products";
import { COMPLETE_PRODUCTS, STORE_PATH, VAULT_PATH, productHref, seriesMates } from "@/content/release";
import { DISCLOSURE, SITE } from "@/content/site";
import { VAULT_COPY } from "@/content/vault";
import { OPENING } from "@/content/whop";

/**
 * ONE PRODUCT'S PAGE, WHITE (2026-10-26 night; v3.1 2026-10-29). The same
 * page at two addresses:
 *
 *   /products/<slug>     every paid product — each comes in DS Complete
 *   /free-vault/<slug>   the Free Vault
 *
 * Top to bottom: the cover beside a buy column that stays in view (kicker,
 * name, the sheet's one line, what it is, "In DS Complete" or "Free" and the
 * way to get it, what you get, the specs); "Why you need it"; "How it works"
 * (the full v3.1 store description); the white desk shot the product is drawn
 * on, when there is one; "Before you buy"; how getting it works; and the rest
 * of its group.
 *
 * v3.1: no paid product has a price of its own. A paid page says "In DS
 * Complete" and offers DS Complete's own three plans (CompleteActions), the
 * same buttons as the band on /products.
 *
 * PICTURES (Tom, 2026-10-26: "don't include any of the dark background
 * pictures"): only the product's own white cover and a white desk shot. The one
 * exception is DS Live Background (Tom, 2026-10-26 night: "that is the one
 * exception with product page background as not white"): its cover is dark,
 * and its page turns dark around it (.tone-dark, app/globals.css).
 */
export function productMetadata(slug: string): Metadata {
  const p = BY_SLUG[slug];
  if (!p) return {};
  const cover = COVERS[slug];
  return {
    title: p.name,
    description: p.purpose,
    alternates: { canonical: productHref(p.slug) },
    // A shared product link previews with that product's own picture.
    openGraph: cover
      ? { title: `${p.name} — ${SITE.name}`, description: p.purpose, url: productHref(p.slug), images: [{ url: cover.src.split("?")[0], width: cover.w, height: cover.h, alt: cover.alt }] }
      : undefined,
  };
}

/** The full description as two paragraphs, split at the sentence boundary
 *  nearest its middle. It only ever splits at whitespace after a full stop and
 *  before a capital ("29507.00" and "2.5x" stay whole), and if the two halves
 *  do not rejoin to the exact text it returns the text whole — no word can be lost. */
function halves(text: string): string[] {
  const s = text.split(/(?<=[.!?][”"’)]?)\s+(?=[A-Z])/);
  if (s.length < 4) return [text];
  let acc = 0;
  let cut = 1;
  let best = Infinity;
  for (let i = 0; i < s.length - 1; i++) {
    acc += s[i].length + 1;
    const off = Math.abs(acc - text.length / 2);
    if (off < best) {
      best = off;
      cut = i + 1;
    }
  }
  const out = [s.slice(0, cut).join(" "), s.slice(cut).join(" ")];
  const norm = (x: string) => x.replace(/\s+/g, " ").trim();
  return norm(out.join(" ")) === norm(text) ? out : [text];
}

export function ProductPage({ slug }: { slug: string }) {
  const p = BY_SLUG[slug];
  const inVault = p.series === VAULT;
  const price = priceFor(p.slug);
  const series = seriesInfo(p.series);
  const markets = marketsFor(p.slug);
  const sheet = pointersFor(p.slug);
  const cover = COVERS[p.slug];
  const action = actionFor(p.slug);
  const desk = deskFor(p.slug);
  const dark = !!cover?.dark;

  const home = inVault ? { href: VAULT_PATH, label: VAULT_COPY.label } : { href: STORE_PATH, label: "Products" };
  const kicker = inVault ? { href: VAULT_PATH, label: VAULT_COPY.label } : { href: `${STORE_PATH}#${p.series}`, label: series.name };
  const figure = price?.free ? "Free" : IN_COMPLETE_LABEL;
  const license = price?.free ? T.license.free : T.license.complete;
  const after = price?.free ? AFTER_CHECKOUT_FREE : AFTER_CHECKOUT;
  const line = sheet.line ?? `${p.hooks[0].replace(/\.$/, "")}.`;

  // "More like this": the rest of the group, then (for a paid product) the
  // rest of DS Complete; a vault product only at the vault.
  const mates = seriesMates(p.slug);
  const moreProducts = inVault ? mates : [...mates, ...COMPLETE_PRODUCTS.filter((x) => x.slug !== p.slug && !mates.some((m) => m.slug === x.slug))];
  const more = moreProducts.slice(0, 5);
  const moreLabel = inVault ? T.more.vault : T.more.series;
  const moreName = inVault ? VAULT_COPY.label : COMPLETE.name;
  /** The bars are numbered down the page; a product with no desk shot skips that bar. */
  let barN = 0;
  const bar = () => String(++barN).padStart(2, "0");

  // schema.org Product — only facts the page states. Since v3.1 a paid product
  // has no price of its own, so only a Free Vault product carries an offer.
  const ld =
    cover && price?.free
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.purpose,
          category: p.category,
          image: `${SITE.url}${cover.src.split("?")[0]}`,
          brand: { "@type": "Brand", name: SITE.name },
          url: `${SITE.url}${productHref(p.slug)}`,
          offers: {
            "@type": "Offer",
            price: "0.00",
            priceCurrency: "USD",
            availability: onWaitlist() ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
            url: `${SITE.url}${productHref(p.slug)}`,
          },
        }
      : null;

  /** What the archive installs as — the name NinjaTrader shows when removing it. */
  const installs =
    p.assembly === COMPLETE.assembly
      ? `It installs inside ${COMPLETE.assembly}, the one DS Complete assembly: the name NinjaTrader shows in Tools → Remove NinjaScript Assembly.`
      : `It installs as ${p.assembly}: the name NinjaTrader shows in Tools → Remove NinjaScript Assembly.`;

  return (
    <div className={dark ? "pp tone-dark" : "pp"}>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}

      {/* ------------------------------------------------ the cover and the buy column */}
      <section className="wb pp-top" aria-labelledby="pp-title" data-section={p.name}>
        <nav aria-label="Breadcrumb" className="crumbs">
          <Link href={home.href}>{home.label}</Link>
          {!inVault && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={kicker.href}>{series.name}</Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{p.name}</span>
        </nav>

        <div className="pp-grid">
          <div className="pp-media">
            <div className="pp-cover">
              <Cover cover={cover} name={p.name} sizes="(min-width: 1101px) 52vw, 100vw" eager />
            </div>
            <p className="small" style={{ marginTop: 16 }}>
              {DISCLOSURE.chart}
            </p>
          </div>

          <aside className="pp-buy" aria-label={`Get ${p.name}`}>
            <div className="pp-panel">
              <p className="pp-kicker">
                <Link className="lnk lnk-bare" href={kicker.href}>
                  {kicker.label}
                </Link>
                <span aria-hidden="true">·</span>
                <span>{p.category}</span>
                {p.isNew && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>New in {p.version}</span>
                  </>
                )}
              </p>
              <h1 id="pp-title" className="d2 pp-name fit" style={fitWord(p.name)}>
                {p.name}
              </h1>
              {sheet.line && <p className="pp-line">{sheet.line}</p>}
              <p className="body" style={{ marginTop: 16 }}>
                {p.purpose}
              </p>

              <div id="buy" className="pp-price">
                <p className={inVault ? "pp-figure num" : "pp-figure pp-figure-s num"}>{figure}</p>
                <p className="small">{license}</p>
                {inVault ? (
                  <>
                    <div className="pp-acts">
                      {action ? (
                        <a className="btn" href={action.href}>
                          {action.label}
                        </a>
                      ) : (
                        <>
                          <span className="btn btn-static" aria-disabled="true">
                            {OPENING.label}
                          </span>
                          <AskButton className="btn" text={OPENING.vault.request(p.name)}>
                            {OPENING.notify}
                          </AskButton>
                        </>
                      )}
                      {/* Opens Help on "Ask us", already about this product (as on the live site). */}
                      <AskButton className="lnk">{T.ask}</AskButton>
                    </div>
                    <p className="small measure" style={{ marginTop: 16 }}>
                      {action ? after.short : OPENING.vault.note}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="body" style={{ marginTop: 16 }}>
                      {COMPLETE_COPY.onProduct}
                    </p>
                    <div style={{ marginTop: 22 }}>
                      <CompleteActions noteClass="small measure" />
                    </div>
                    <p className="pp-acts" style={{ marginTop: 18 }}>
                      <Link className="lnk" href={COMPLETE_HREF}>
                        What is in {COMPLETE.name}
                      </Link>
                      <AskButton className="lnk">{T.ask}</AskButton>
                    </p>
                    <p className="small measure" style={{ marginTop: 16 }}>
                      {after.short}
                    </p>
                  </>
                )}
              </div>

              <div className="pp-get">
                <p className="pp-label">{T.get}</p>
                <ul className="points points-tight">
                  {p.hooks.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>

              <dl className="pp-specs">
                <div>
                  <dt>Platform</dt>
                  <dd>
                    {SITE.platform} · {SITE.minBuild} or newer
                  </dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{KIND_LABEL[p.kind].singular}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{p.version}</dd>
                </div>
                {markets && (
                  <div>
                    <dt>Runs on</dt>
                    <dd>{markets.headline}</dd>
                  </div>
                )}
                {markets?.builtOn && (
                  <div>
                    <dt>Built on</dt>
                    <dd>{markets.builtOn}</dd>
                  </div>
                )}
                <div>
                  <dt>License</dt>
                  <dd>{license}</dd>
                </div>
              </dl>

              <p className="small pp-other">
                {inVault ? (
                  <>
                    {VAULT_COPY.pageNote}{" "}
                    <Link className="lnk" href={VAULT_PATH}>
                      {VAULT_COPY.pageLink}
                    </Link>
                    {p.slug === "session-levels" && BY_SLUG.asl && (
                      <>
                        {" "}
                        · {BY_SLUG.asl.name} adds each session&rsquo;s volume profile and POC, in {COMPLETE.name}:{" "}
                        <Link className="lnk" href={productHref("asl")}>
                          {BY_SLUG.asl.name}
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  COMPLETE_COPY.founders
                )}
              </p>
            </div>
          </aside>

          {/* ------------------------------------------------ why you need it */}
          <div className="pp-why">
            <p className="pp-label">{T.why}</p>
            <p className="pp-helps">{p.helps}</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ how it works: the full v3.1 description */}
      <SectionBar n={bar()} title={T.how} />
      <section className="wb sbar-after" aria-label={T.how}>
        <div className="pp-points-grid">
          <div className="t">
            <p className="d3">{line}</p>
          </div>
          <div className="pp-desc">
            {halves(p.description).map((para) => (
              <p key={para.slice(0, 32)} className="body">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ on the desk */}
      {desk && (
        <>
          <SectionBar n={bar()} title="On the chart" />
          <WideFigure pic={desk} />
        </>
      )}

      {/* ------------------------------------------------ before you buy */}
      <SectionBar n={bar()} title={T.beforeLabel} sub={T.beforeTitle} />
      <section className="wb sbar-after pp-before" aria-label={T.beforeLabel}>
        <div className="pp-three">
          <div id="markets">
            <p className="pp-label">{T.runs}</p>
            {markets ? <Markets markets={markets} /> : <p className="body">{SITE.platform}</p>}
          </div>
          <div>
            <p className="pp-label">{T.reads}</p>
            <p className="body" style={{ color: "var(--ink)" }}>
              {sheet.reads ?? T.readsFallback}
            </p>
            <p className="small" style={{ marginTop: 14 }}>
              {SITE.platform} · {SITE.minBuild} or newer. {T.runsLocal}
            </p>
          </div>
          <div>
            <p className="pp-label">{T.know}</p>
            <p className="body" style={{ color: "var(--ink)", marginBottom: 12 }}>
              {p.name} {p.version}. {installs}
            </p>
            <p className="small" style={{ marginTop: 14 }}>
              {DISCLOSURE.short}
            </p>
          </div>
        </div>
        <ol className="steps">
          {after.steps.map((s, i) => (
            <li key={s.title}>
              <span className="step-n num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="d4">{s.title}</h3>
              <p className="body">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------ more */}
      <SectionBar n={bar()} title={moreLabel} sub={moreName} />
      <section className="wb sbar-after pp-more" aria-label={moreLabel}>
        <ul className="pp-more-grid">
          {more.map((m) => {
            const v = PRODUCT_VIEWS[m.slug];
            return (
              <li key={m.slug}>
                <Link href={v.page} className="vault-pic" aria-label={m.name}>
                  <Cover cover={COVERS[m.slug]} name={m.name} sizes="(min-width: 1101px) 18vw, 45vw" decorative />
                </Link>
                <p className="d4 nm">
                  <Link className="lnk lnk-bare" href={v.page}>
                    {m.name}
                  </Link>
                </p>
                <p className="small">{v.line}</p>
                <p className="small num" style={{ color: "var(--ink)", marginTop: 6 }}>
                  {v.price}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="pp-more-all">
          <Link className="lnk" href={home.href}>
            {inVault ? T.all.vault : T.all.store}
          </Link>
        </p>
      </section>
    </div>
  );
}

