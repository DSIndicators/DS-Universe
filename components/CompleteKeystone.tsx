import { Reveal } from "@/components/ui/Reveal";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { Defer } from "@/components/ui/Defer";
import { CompleteChart } from "@/components/CompleteChart";
import { CompleteBundled, CompleteLedger, type LedgerRow } from "@/components/CompleteLedger";
import { CompleteStage, type Series } from "@/components/CompleteStage";
import Link from "next/link";
import { APART, BUNDLED, COMPLETE, COMPLETE_PCT, FOUNDERS, PRICES, WITH_BUNDLE, isPaid, money } from "@/content/pricing";
import { onWaitlist } from "@/content/launch";
import { COMPLETE_SHELVES, STORE_SHELVES, VAULT_PATH, productHref } from "@/content/release";

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
 *  · THE CHART (CompleteChart.tsx): one NT8 chart with the drawing of every
 *    product in DS Complete on it — what a buyer actually gets. It builds in
 *    the ledger's order when it scrolls into view.
 *  · THE LEDGER (CompleteLedger.tsx): one row per series, its subtotal ($0.00
 *    for the two that come free with it), and the products in it — the chart's key. Pointing
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
 *
 * 2026-10-05 — PAID ONLY. DS Complete is the paid products, plus DS ASL and
 * DS Toolkit, which come free with it; the Free Vault products are not part
 * of it. The ledger and the chart read COMPLETE_SHELVES, the "Free with DS
 * Complete" block names the two (one line each, built the same way), and one
 * plain sentence under the button says the vault is separate.
 *
 * THE LEDGER'S LAST ROW is those two: "Free with DS Complete", $0.00 — what
 * they add to the $749.90 the bundle is compared against. Its name is not a
 * link (two products, no panel of their own below); each product is.
 */

type Row = { key: Series; name: string; sum: number; unpriced: boolean };

/** The ledger runs in CATALOGUE order (flagship first), whatever series leads
 *  the store below it — it is the sum, not the shelf. */
function ledger(): Row[] {
  return COMPLETE_SHELVES.map((s) => {
    const paid = s.products.map((p) => PRICES[p.slug]).filter(isPaid);
    const sum = Math.round(paid.reduce((n, p) => n + p.now, 0) * 100) / 100;
    return { key: s.info.key as Series, name: s.info.name, sum, unpriced: paid.length === 0 };
  });
}

/** The series the "Free with DS Complete" products belong to — the chart's key for them. */
const BUNDLED_SERIES = (slug: string): Series => COMPLETE_SHELVES.find((s) => s.products.some((p) => p.slug === slug))!.info.key;
/** Series with a panel of their own under this one; the others link to a product page. */
const HAS_PANEL = new Set<Series>(STORE_SHELVES.map((s) => s.info.key));

export function CompleteKeystone() {
  const rows: LedgerRow[] = ledger().map((r) => ({
    key: r.key,
    name: r.name,
    // A series nobody pays for separately adds nothing to the sum: $0.00.
    price: money(r.sum),
    // Its panel below; or, with no panel, its one product's page; or, with no
    // panel and several products, nothing — the products under it are the links.
    href: HAS_PANEL.has(r.key)
      ? `#${r.key}`
      : COMPLETE_SHELVES.find((s) => s.info.key === r.key)!.products.length === 1
        ? productHref(COMPLETE_SHELVES.find((s) => s.info.key === r.key)!.products[0].slug)
        : undefined,
    products: COMPLETE_SHELVES.find((s) => s.info.key === r.key)!.products.map((p) => ({
      slug: p.slug,
      name: p.name,
      exclusive: !!PRICES[p.slug]?.withComplete,
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
            <span className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.18em] text-gold">{FOUNDERS.name}</span>
            <span className="hidden h-3 w-px bg-[rgba(205,166,86,0.35)] sm:block" aria-hidden="true" />
            <span className="w-full text-[length:calc(13.5px*var(--type))] text-ink text-balance sm:w-auto">{FOUNDERS.strip}</span>
            <span className="ml-auto hidden font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.14em] text-gold-deep/80 md:block">
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
              {/* Mounted once it is within a screen of the viewport (ui/Defer): it
                  is far down the page and the heaviest drawing on it. */}
              <Defer near className="aspect-[3/4] w-full sm:aspect-[4/5]">
                <CompleteChart className={`border-x-0 sm:rounded-[10px] sm:border-x ${FOUNDERS.active ? "border-t-0 sm:border-t" : ""}`} />
              </Defer>
            </div>

            {/* ----------------------------------------------- the offer */}
            <div className="lg:col-span-6">
              <p className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-gold">
                <span className="whitespace-nowrap">The paid lineup ·</span> <span className="whitespace-nowrap">one purchase</span>
              </p>
              <h3 id="complete-title" className="display-lg mt-3.5 text-ink">
                {COMPLETE.name}
              </h3>
              <p className="mt-4 max-w-xl text-[length:calc(14.5px*var(--type))] leading-relaxed text-slate text-pretty">{COMPLETE.lede}</p>

              {FOUNDERS.active && (
                <p className="mt-7 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-gold">Founders price</p>
              )}
              <div className={`${FOUNDERS.active ? "mt-2.5" : "mt-7"} flex flex-wrap items-baseline gap-x-3.5 gap-y-2`}>
                <span className="font-display text-[clamp(2.25rem,4vw,3rem)] font-[350] leading-none tracking-[-0.03em] text-ink tabular-nums">
                  {money(COMPLETE.now)}
                </span>
                <s className="text-[length:calc(15px*var(--type))] tabular-nums text-mute decoration-mute/70" aria-label={`${money(APART)} bought separately`}>
                  {money(APART)}
                </s>
                <span className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.14em] text-gold">{COMPLETE_PCT}% off</span>
              </div>
              {/* The value, said in words as well as struck through: the real sum
                  of the paid products' own prices (APART, computed). */}
              <p className="mt-3.5 text-[length:calc(14.5px*var(--type))] leading-snug text-slate">
                A <span className="font-medium text-ink tabular-nums">{money(APART)}</span> value — every paid product, bought one at a time.
              </p>
              <p className="mt-1.5 text-[length:calc(12.5px*var(--type))] text-mute">One payment · Yours to keep · Updates included</p>

              {/* FREE WITH DS COMPLETE (content/pricing.ts BUNDLED): said once,
                  in the panel, between the value and the ledger — the
                  products a buyer gets here and nowhere else. The label once,
                  then one line per product, built the same way: a gold node
                  (the thread's own), the product, what it adds, and the way
                  to its page. Set in type; no box, no badge. Each line is a
                  key to the chart like the ledger: pointing at it isolates
                  that product's drawing (CompleteBundled, in CompleteLedger.tsx). */}
              <CompleteBundled
                label={WITH_BUNDLE.label}
                note={BUNDLED.length > 1 ? "Not sold on their own" : WITH_BUNDLE.short}
                items={BUNDLED.map((b) => ({ slug: b.slug, series: BUNDLED_SERIES(b.slug), href: productHref(b.slug), name: b.name, line: b.panel }))}
              />

              {/* The ledger: each series' subtotal, and the chart's key. */}
              <CompleteLedger rows={rows} label={`What is inside ${COMPLETE.name}`} />

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <BuyButton slug={COMPLETE.key} label={FOUNDERS.active && !onWaitlist() ? FOUNDERS.cta : undefined} />
              </div>
              <CtaNote className="mt-4" slug={COMPLETE.key} />
              {/* Paid and free are kept apart (2026-10-05): the sheet's own
                  sentence, and the way to the vault. */}
              <p className="mt-5 max-w-md border-t border-line pt-4 text-[length:calc(12.5px*var(--type))] leading-relaxed text-mute text-pretty">
                {COMPLETE.apart}{" "}
                <Link href={VAULT_PATH} className="whitespace-nowrap text-slate underline decoration-bull/60 underline-offset-4 transition-colors hover:text-ink">
                  Free Vault
                </Link>
              </p>
            </div>
          </div>
        </CompleteStage>
      </Reveal>
    </section>
  );
}
