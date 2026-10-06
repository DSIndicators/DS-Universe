import type { Metadata } from "next";
import { Marketplace } from "@/components/Marketplace";
import { Reveal } from "@/components/ui/Reveal";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { StoreBar, type StoreBarItem } from "@/components/StoreBar";
import { BeforeYouBuy } from "@/components/BeforeYouBuy";
import { TrialStoreNote } from "@/components/Trial";
import { STORE_SHELVES } from "@/content/release";
import { COMPLETE, COMPLETE_PCT, FOUNDERS, PRICES, isPaid, money, seriesPrice, tilePrice } from "@/content/pricing";
import { PRODUCTS } from "@/content/products";
import { StillMonitor } from "@/components/ui/StillMonitor";
import { DISCLOSURE, PRODUCTS_SCREEN } from "@/content/site";

export const metadata: Metadata = {
  title: "Products & pricing",
  description:
    "The DS Universe store for NinjaTrader 8 and what everything costs — the flagship indicators, the Pro Series panels and the Market Replay utility, each bought once. DS Complete is all of them for half of what they cost apart.",
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
 *   1. What this is, the offer in three gold numbers, and the chart.
 *   2. The store bar: DS Complete, every series with its price, the FAQ, and
 *      the Covers | Price list switch. Sticky, so the sheet stays in reach.
 *   3. DS Complete at the head of the shelves (components/CompleteKeystone.tsx,
 *      2026-09-28 — Tom: "the complete package should be the star"), joined
 *      by one gold thread to one PANEL per series (components/Shelf.tsx), in
 *      either view.
 *   4. Before you buy — "Bought once. Never rented.", the three steps and the
 *      questions, where buyers pause.
 *
 * Nothing on this page types a number: every figure comes from
 * content/pricing.ts, and every count is left out (the lineup changes).
 *
 * PAID ONLY (2026-10-05). The free shelf, its entry in the price bar and the
 * Session levels pair left this page: the free products are the Free Vault
 * (/free-vault), and DS ASL and DS Toolkit are shown as part of DS Complete. The third price
 * at the head is now the data utility. Old links to the two anchors that are
 * gone (/products#essentials, /products#sessions) are forwarded by the script
 * below — a server cannot see a #fragment, so the page does it before paint.
 */

/** Anchors this page used to have, and where their content lives now. */
const MOVED_ANCHORS: Record<string, string> = {
  "#essentials": "/free-vault",
  "#sessions": "/free-vault/session-levels",
};
export default function ProductsPage() {
  // The indicator price, if every paid indicator shares one — computed, so the
  // lede cannot quote a number the shelves below do not show.
  const nows = [
    ...new Set(
      PRODUCTS.filter((p) => p.series === "flagship" || p.series === "pro").flatMap((p) => {
        const pr = PRICES[p.slug];
        return isPaid(pr) ? [pr.now] : [];
      }),
    ),
  ];
  const lead = nows.length === 1 ? nows[0] : null;
  const utilityPrice = seriesPrice("utility");
  const utility = utilityPrice && isPaid(utilityPrice) ? utilityPrice.now : null;

  // DS Complete leads the row, as it leads the shelves (2026-09-28).
  const offer = [
    {
      price: money(COMPLETE.now),
      label: COMPLETE.name,
      note: FOUNDERS.active ? `Founders Sale · ${COMPLETE_PCT}% off` : `Everything, ${COMPLETE_PCT}% off`,
      href: "#complete",
    },
    lead !== null
      ? { price: money(lead), label: "Indicators", note: "Each, one payment", href: "#flagship" }
      : { price: "Once", label: "Indicators", note: "One payment", href: "#flagship" },
    utility !== null
      ? { price: money(utility), label: "Data utility", note: "One payment", href: "#utility" }
      : { price: "Once", label: "Data utility", note: "One payment", href: "#utility" },
  ];

  const bar: StoreBarItem[] = [
    { id: "complete", label: COMPLETE.name, price: money(COMPLETE.now) },
    ...STORE_SHELVES.map((s) => ({
      id: s.info.key,
      label: s.info.short,
      price: tilePrice(seriesPrice(s.info.key) ?? undefined) || undefined,
    })),
    { id: "faq", label: "FAQ" },
  ];

  return (
    <>
      {/* Before first paint: a /products?view=list load opens on the list,
          never flashing the covers first. StoreBar owns it after hydration. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            `try{var m=${JSON.stringify(MOVED_ANCHORS)}[location.hash];if(m)location.replace(m);` +
            "if(new URLSearchParams(location.search).get('view')==='list')document.documentElement.dataset.storeView='list'}catch(e){}",
        }}
      />

      {/* -------------------------------------------------------------- head */}
      <section className="hero-wash">
        <div className="wrap pb-14 pt-12 sm:pt-16 lg:pb-20 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-6">
              <p className="label">Products &amp; pricing</p>
              <h1 className="display-xl mt-5 text-ink text-balance">Every tool, one question each.</h1>
              <p className="lede mt-6 max-w-xl text-pretty">
                Every product here is bought once and kept — no subscription. Open any box for what it
                shows, how it helps, and the guide to reading it on a live chart.
              </p>

              {/* THE OFFER IN THREE NUMBERS (2026-09-27). The first thing under
                  the headline is what things cost, each one a jump to the panel
                  it prices. Computed — never typed. Set like a spec sheet: one
                  ruled row, three columns split by hairlines, a small-caps label
                  over each figure. No boxes, no fills (second pass: "sturdy"). */}
              <ul className="mt-9 grid max-w-xl grid-cols-3 divide-x divide-line border-y border-line" aria-label="Prices at a glance">
                {offer.map((o, i) => (
                  <li key={o.href}>
                    <a href={o.href} className={`group flex h-full flex-col py-4 ${i === 0 ? "pr-3 sm:pr-5" : "px-3 sm:px-5"}`}>
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] min-[360px]:whitespace-nowrap text-gold-deep sm:text-[10.5px] sm:tracking-[0.14em]">{o.label}</span>
                      <span className="mt-2.5 font-display text-[clamp(1.05rem,3.6vw,1.5rem)] font-[400] leading-none tracking-[-0.025em] text-ink tabular-nums transition-colors group-hover:text-gold-deep">
                        {o.price}
                      </span>
                      <span className="mt-2 text-[12px] leading-snug text-mute sm:text-[12.5px]">{o.note}</span>
                    </a>
                  </li>
                ))}
              </ul>

              {/* The 3-day free trial, named once on the store's first screen
                  (2026-09-29) — the tiles below carry its legend. */}
              <TrialStoreNote className="mt-6 max-w-xl" />

              <p className="mt-6 text-[14px] text-slate">
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
              <p className="mt-5 text-[13.5px] leading-relaxed text-slate text-pretty">{PRODUCTS_SCREEN.caption}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-mute text-pretty">{DISCLOSURE.chart}</p>
            </Reveal>
          </div>

        </div>
      </section>

      {/* The bar is sticky inside THIS wrapper, so it stays with the store —
          shelves, DS Complete and the questions — and lets go at the footer. */}
      <div>
        <StoreBar items={bar} />
        <Marketplace withHeading={false} views className="wrap pb-24 pt-16 lg:pb-32 lg:pt-20" />
        <BeforeYouBuy />
      </div>
    </>
  );
}
