import { Reveal } from "@/components/ui/Reveal";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { CompleteChart } from "@/components/CompleteChart";
import { CompleteGift, CompleteLedger, type LedgerRow } from "@/components/CompleteLedger";
import { CompleteStage, type Series } from "@/components/CompleteStage";
import { APART, COMPLETE, COMPLETE_PCT, FOUNDERS, GIFT, PRICES, isPaid, money } from "@/content/pricing";
import { onWaitlist } from "@/content/launch";
import { CATALOGUE_ORDER } from "@/content/release";

/**
 * DS COMPLETE AT THE HEAD OF THE LINEUP (2026-09-28).
 *
 * Tom: "the complete package should be the star but its hidden all the way at
 * the bottom, we should move it to the top and have it flow elegantly down to
 * the products, 1 link." It used to be a dark band after the last shelf — the
 * summary of a list most visitors never scrolled to the end of.
 *
 * So the lineup now opens with it, and it reads as the sum of what follows.
 *
 * 2026-09-29 — THE CHART REPLACES THE BOX. Tom: the box render was "stretched
 * out and blurry, zero effort" and "the current product page can be dialed
 * down". The render also printed a price and a product count that would go
 * stale. Now:
 *
 *  · THE CHART (CompleteChart.tsx): one NT8 chart with every product's own
 *    drawing on it — what a DS Complete buyer actually gets. It builds in the
 *    ledger's order when it scrolls into view.
 *  · THE LEDGER (CompleteLedger.tsx): one row per series, its subtotal (or
 *    "Free · included"), and the products in it — the chart's key. Pointing
 *    at a row or a product isolates its drawing; the series name links down
 *    to its panel, each product to its page.
 *  · THE THREAD. From this panel a single gold line runs down through the gap
 *    before every series panel (Marketplace.tsx, <Thread />).
 *
 * Dialed down: the value bar went (it was the third statement of the same
 * sum — the ledger splits it), and so did the Founders note under the button
 * (the strip, the "Founders price" label and the button already say it).
 * Kept, as Tom asked on 09-28: the struck $749.90 and "A $749.90 value".
 *
 * Gold is the one accent, as everywhere else prices live. No counts in the
 * copy (the lineup changes); no invented "was" price — $749.90 is the real
 * sum, and pricing.ts fails the build if Whop's struck figure ever stops
 * matching it. The box art (COMPLETE.art) stays for the Whop listing.
 */

type Row = { key: Series; name: string; sum: number; free: boolean };

/** The ledger runs in CATALOGUE order (flagship first), whatever series leads
 *  the store below it — it is the sum, not the shelf. */
function ledger(): Row[] {
  return CATALOGUE_ORDER.map((s) => {
    const paid = s.products.map((p) => PRICES[p.slug]).filter(isPaid);
    const sum = Math.round(paid.reduce((n, p) => n + p.now, 0) * 100) / 100;
    return { key: s.info.key as Series, name: s.info.name, sum, free: paid.length === 0 };
  });
}

/** Where the gift line points: the panel its product is shelved in. */
const PRODUCT_SERIES: Series = CATALOGUE_ORDER.find((s) => s.products.some((p) => p.slug === GIFT.slug))!.info.key;

export function CompleteKeystone() {
  const rows: LedgerRow[] = ledger().map((r) => ({
    key: r.key,
    name: r.name,
    price: r.free ? "Free · included" : money(r.sum),
    products: CATALOGUE_ORDER.find((s) => s.info.key === r.key)!.products.map((p) => ({
      slug: p.slug,
      name: p.name,
      gift: !!PRICES[p.slug]?.withComplete,
    })),
  }));

  return (
    <section id="complete" className="scroll-mt-[148px]" aria-labelledby="complete-title">
      <Reveal className="complete-panel relative overflow-hidden rounded-xl border">
        {/* ------------------------------------------------ founders strip */}
        {/* The sale, said across the top of the panel before anything else:
            a live gold light, the name, what it is, and that it will end.
            No countdown and no date — there is no end date to show. */}
        {FOUNDERS.active && (
          <div className="founders-strip relative flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-6 py-3.5 sm:px-8 lg:px-10">
            <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
              <span className="absolute inset-0 rounded-full bg-gold opacity-60 motion-safe:animate-ping" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-gold">{FOUNDERS.name}</span>
            <span className="hidden h-3 w-px bg-[rgba(205,166,86,0.35)] sm:block" aria-hidden="true" />
            <span className="w-full text-[13.5px] text-ink text-balance sm:w-auto">{FOUNDERS.strip}</span>
            <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.14em] text-gold-deep/80 md:block">
              Can end at any time
            </span>
          </div>
        )}
        <CompleteStage>
          <div className="relative grid gap-y-8 p-6 sm:p-8 lg:grid-cols-12 lg:gap-x-10 lg:p-10">
            {/* ----------------------------------------------- the chart */}
            {/* On phones the chart runs to the panel's edges: every pixel of
                width goes to the drawing. */}
            <div className={`-mx-6 sm:mx-0 lg:col-span-6 ${FOUNDERS.active ? "-mt-6 sm:mt-0" : ""}`}>
              <CompleteChart className={`border-x-0 sm:rounded-[10px] sm:border-x ${FOUNDERS.active ? "border-t-0 sm:border-t" : ""}`} />
            </div>

            {/* ----------------------------------------------- the offer */}
            <div className="lg:col-span-6">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">
                <span className="whitespace-nowrap">The whole lineup ·</span> <span className="whitespace-nowrap">one purchase</span>
              </p>
              <h3 id="complete-title" className="display-lg mt-3.5 text-ink">
                {COMPLETE.name}
              </h3>
              <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-slate text-pretty">{COMPLETE.lede}</p>

              {FOUNDERS.active && (
                <p className="mt-7 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">Founders price</p>
              )}
              <div className={`${FOUNDERS.active ? "mt-2.5" : "mt-7"} flex flex-wrap items-baseline gap-x-3.5 gap-y-2`}>
                <span className="font-display text-[clamp(2.25rem,4vw,3rem)] font-[350] leading-none tracking-[-0.03em] text-ink tabular-nums">
                  {money(COMPLETE.now)}
                </span>
                <s className="text-[15px] tabular-nums text-mute decoration-mute/70" aria-label={`${money(APART)} bought separately`}>
                  {money(APART)}
                </s>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold">{COMPLETE_PCT}% off</span>
              </div>
              {/* The value, said in words as well as struck through: the real sum
                  of the paid products' own prices (APART, computed). */}
              <p className="mt-3.5 text-[14.5px] leading-snug text-slate">
                A <span className="font-medium text-ink tabular-nums">{money(APART)}</span> value — every paid product, bought one at a time.
              </p>
              <p className="mt-1.5 text-[12.5px] text-mute">One payment · Yours to keep · Updates included</p>

              {/* THE FOUNDERS GIFT (2026-09-30, content/pricing.ts GIFT): said
                  once, in the panel, between the value and the ledger — the
                  one product a buyer gets here and nowhere else. A gold node
                  (the thread's own), the label, the product, and a way down
                  to it. Set in type; no box, no badge. It is a key to the
                  chart like the ledger: pointing at it isolates the product's
                  drawing (CompleteGift, in CompleteLedger.tsx). */}
              <CompleteGift
                slug={GIFT.slug}
                series={PRODUCT_SERIES}
                href={`#${PRODUCT_SERIES}`}
                label={GIFT.label}
                name={GIFT.name}
                line={GIFT.line}
              />

              {/* The ledger: each series' subtotal, and the chart's key. */}
              <CompleteLedger rows={rows} label={`What is inside ${COMPLETE.name}`} />

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <BuyButton slug={COMPLETE.key} label={FOUNDERS.active && !onWaitlist() ? FOUNDERS.cta : undefined} />
              </div>
              <CtaNote className="mt-4" slug={COMPLETE.key} />
            </div>
          </div>
        </CompleteStage>
      </Reveal>
    </section>
  );
}
