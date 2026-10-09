import { HOME_MARKETS, MARKET_CLASSES, type Markets as MarketsData } from "@/content/markets";

/**
 * MARKETS — the last fact in a product page's facts column (2026-10-01).
 *
 * Tom: "adding in each product page the available instruments the indicators
 * are optimized and work for... be unique, be elegant, don't clutter."
 *
 * WHERE IT SITS: with Type, Series, Category and Platform, because it is the
 * same kind of thing — a fact about the product — and because on a desktop
 * that column ends well short of the price card beside it, so the block costs
 * the page no height at all. On a phone it is read just before "How it helps"
 * and the price: the question is answered before the money is.
 *
 * WHAT IT IS: one line that answers "does it run on what I trade?", then a
 * METER — one cell per market, a 2px bar over a mono label, the way a level
 * sits over its tag on a chart. A market it runs on is a solid bar and a lit
 * label; one it does not run on is a hairline and a struck label. The two
 * differ in weight and in a strike, never in colour alone. DS GEX is built
 * for three named markets, so its cells are those markets and their tickers.
 * A sentence underneath says WHY — what the product reads — so the meter is a
 * consequence of how the thing works, not a list of claims.
 *
 * WHAT IT IS NOT: no pills, no icons, no ticks and crosses, no colour for
 * emphasis beyond the house bull teal the candle ticks already use. Nothing
 * moves and nothing is clickable, so there is nothing to mis-tap on a phone.
 *
 * Every word comes from content/markets.ts, which is generated from the
 * Master sheet's Markets tab.
 */
export function Markets({ markets }: { markets: MarketsData }) {
  const cells = markets.named
    ? markets.named.map((n) => ({ key: n.label, label: n.label, sub: n.symbols, on: true }))
    : markets.classes
      ? MARKET_CLASSES.map((c) => ({ key: c.key, label: c.label, sub: "", on: Boolean(markets.classes?.[c.key]) }))
      : // Not bound to a market at all (the replay downloader): the sentence says it.
        [];
  // Three named markets sit three across; the four classes sit four across.
  const cols = cells.length === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div id="markets" className="scroll-mt-[120px]">
      <dt className="flex items-baseline justify-between gap-4 text-[length:calc(12.5px*var(--type))] text-mute">
        Markets
        {markets.builtOn && (
          <span className="font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.14em] text-mute">
            Built on <span className="text-slate">{HOME_MARKETS.join(" · ")}</span>
          </span>
        )}
      </dt>
      <dd className="mt-1">
        <p className="text-[length:calc(14.5px*var(--type))] text-ink">{markets.headline}</p>

        {cells.length > 0 && (
          <ul className={`mt-4 grid ${cols} gap-x-2.5`}>
            {cells.map((c) => (
              <li key={c.key} className="min-w-0">
                {/* The bar. Both states occupy the same 2px, so the labels
                    below them share one baseline. */}
                <span className="flex h-[2px] items-center" aria-hidden="true">
                  <span className={c.on ? "block h-[2px] w-full bg-bull" : "block h-px w-full bg-line-strong"} />
                </span>
                <span
                  className={
                    c.on
                      ? "mt-2 block font-mono text-[length:calc(10px*var(--type))] uppercase leading-tight tracking-[0.12em] text-ink"
                      : "mt-2 block font-mono text-[length:calc(10px*var(--type))] uppercase leading-tight tracking-[0.12em] text-mute line-through decoration-line-strong"
                  }
                >
                  {c.label}
                  <span className="sr-only">{c.on ? " — runs on it" : " — not supported"}</span>
                </span>
                {c.sub && <span className="mt-1 block font-mono text-[length:calc(11.5px*var(--type))] leading-tight text-slate">{c.sub}</span>}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-[length:calc(13px*var(--type))] leading-relaxed text-slate text-pretty">{markets.note}</p>
      </dd>
    </div>
  );
}
