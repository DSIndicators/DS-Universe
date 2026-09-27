import type { Metadata } from "next";
import { Marketplace } from "@/components/Marketplace";
import { Reveal } from "@/components/ui/Reveal";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { CompleteBand } from "@/components/CompleteBand";
import { StoreBar, type StoreBarItem } from "@/components/StoreBar";
import { BeforeYouBuy } from "@/components/BeforeYouBuy";
import { SHELVES } from "@/content/release";
import { COMPLETE, PRICES, TERMS, money, seriesPrice, tilePrice } from "@/content/pricing";
import { PRODUCTS } from "@/content/products";
import { StillMonitor } from "@/components/ui/StillMonitor";
import { DISCLOSURE, PRODUCTS_SCREEN } from "@/content/site";

export const metadata: Metadata = {
  title: "Products & pricing",
  description:
    "Every DS Universe product for NinjaTrader 8 and what it costs — flagship indicators, the Pro Series panels, the free chart essentials and the Market Replay utility, each bought once. DS Complete is all of it for half of what the paid ones cost apart.",
  // ?view=list is the same page in another layout — one URL for search.
  alternates: { canonical: "/products" },
};

/**
 * THE STORE — products and pricing on one page (2026-09-27).
 *
 * WHY ONE PAGE. /products and /pricing had become the same page twice: the same
 * header, the same monitor, the same "How buying works" band, the same series,
 * the same DS Complete band — and visitors could not tell which one to use.
 * Pricing is not a separate subject in a store where every product has one
 * price; it is an attribute of the listing (NN/g: let people decide "without
 * visiting each detail page"). So the listing carries it, and /pricing
 * redirects here permanently, onto the Price list view (next.config.mjs).
 *
 * THE ORDER, and why:
 *   1. What this is, with the price in the first sentence, and the chart.
 *   2. The terms — "Bought once. Never rented." — said once, before any box.
 *   3. The store bar: every series with its price, DS Complete, the FAQ, and
 *      the Covers | Price list switch. Sticky, so the sheet stays in reach.
 *   4. The shelves, in either view.
 *   5. DS Complete — summed directly under the list it sums.
 *   6. Before you buy — the three steps and the questions, where buyers pause.
 *
 * Nothing on this page types a number: every figure comes from
 * content/pricing.ts, and every count is left out (the lineup changes).
 */
export default function ProductsPage() {
  // The indicator price, if every paid indicator shares one — computed, so the
  // lede cannot quote a number the shelves below do not show.
  const nows = [
    ...new Set(
      PRODUCTS.filter((p) => p.series === "flagship" || p.series === "pro").flatMap((p) => {
        const pr = PRICES[p.slug];
        return pr && !pr.free ? [pr.now] : [];
      }),
    ),
  ];
  const lead = nows.length === 1 ? nows[0] : null;

  const bar: StoreBarItem[] = [
    ...SHELVES.map((s) => ({
      id: s.info.key,
      label: s.info.short,
      price: tilePrice(seriesPrice(s.info.key) ?? undefined) || undefined,
    })),
    { id: "complete", label: COMPLETE.name, price: money(COMPLETE.now) },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <>
      {/* Before first paint: a /products?view=list load opens on the list,
          never flashing the covers first. StoreBar owns it after hydration. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(new URLSearchParams(location.search).get('view')==='list')document.documentElement.dataset.storeView='list'}catch(e){}",
        }}
      />

      {/* -------------------------------------------------------------- head */}
      <section className="hero-wash">
        <div className="wrap pb-16 pt-12 sm:pt-16 lg:pb-20 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-6">
              <p className="label">Products &amp; pricing</p>
              <h1 className="display-xl mt-5 text-ink text-balance">Every tool, one question each.</h1>
              <p className="lede mt-6 max-w-xl text-pretty">
                {lead
                  ? `Every paid indicator is ${money(lead)}, bought once — and the chart essentials are free. `
                  : "Every product is bought once — and the chart essentials are free. "}
                Open any box for what it shows, how it helps, and the guide to reading it on a
                live chart.
              </p>
              <p className="mt-6 text-[15px] text-slate">
                <a href="#faq" className="text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                  Questions before you buy
                </a>
                <span className="text-mute"> · checkout, download and license</span>
              </p>
              <WaitlistNote className="mt-7 max-w-md" />
            </Reveal>

            <Reveal className="lg:col-span-6" delay={120}>
              <StillMonitor
                src={PRODUCTS_SCREEN.src}
                w={PRODUCTS_SCREEN.w}
                h={PRODUCTS_SCREEN.h}
                blur={PRODUCTS_SCREEN.blur}
                alt={PRODUCTS_SCREEN.alt}
                title={PRODUCTS_SCREEN.title}
                sub={PRODUCTS_SCREEN.sub}
                priority
              />
              <p className="mt-5 text-[14.5px] leading-relaxed text-slate text-pretty">{PRODUCTS_SCREEN.caption}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-mute text-pretty">{DISCLOSURE.chart}</p>
            </Reveal>
          </div>

          {/* ------------------------------------------------------- terms */}
          <div className="mt-16 border-t border-line pt-10 lg:mt-20">
            <Reveal>
              <h2 className="display-md text-ink">Bought once. Never rented.</h2>
            </Reveal>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {TERMS.map((t, i) => (
                <Reveal key={t.title} delay={i * 80}>
                  <h3 className="display-sm text-ink">{t.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-slate text-pretty">{t.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The bar is sticky inside THIS wrapper, so it stays with the store —
          shelves, DS Complete and the questions — and lets go at the footer. */}
      <div>
        <StoreBar items={bar} />
        <Marketplace withHeading={false} views className="wrap pb-24 pt-16 lg:pb-32 lg:pt-20" />
        <CompleteBand secondary={{ label: "Before you buy", href: "#faq" }} />
        <BeforeYouBuy />
      </div>
    </>
  );
}
