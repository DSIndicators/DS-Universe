import { MARKET_CLASSES, type Markets as MarketsData } from "@/content/markets";

/**
 * WHERE IT RUNS — the live site's meter (DS-Universe-3 components/Markets.tsx),
 * set for white: one line that answers "does it run on what I trade?", then one
 * cell per market — a 2px teal bar over its name where it runs, a hairline and
 * a struck name where it does not (weight and strike, never colour alone) —
 * and the sentence that says why. Every word is content/markets.ts.
 */
export function Markets({ markets }: { markets: MarketsData }) {
  const cells = markets.named
    ? markets.named.map((n) => ({ key: n.label, label: n.label, sub: n.symbols, on: true }))
    : markets.classes
      ? MARKET_CLASSES.map((c) => ({ key: c.key, label: c.label, sub: "", on: Boolean(markets.classes?.[c.key]) }))
      : [];
  return (
    <div className="mkt">
      <p className="mkt-head">
        <span className="d4">{markets.headline}</span>
        {markets.builtOn && <span className="small">Built on {markets.builtOn}</span>}
      </p>
      {cells.length > 0 && (
        <ul className="mkt-cells" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
          {cells.map((c) => (
            <li key={c.key} data-on={c.on}>
              <span className="bar" aria-hidden="true" />
              <span className="lbl">
                {c.label}
                <span className="sr-only">{c.on ? " — runs on it" : " — not supported"}</span>
              </span>
              {c.sub && <span className="sub num">{c.sub}</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="body" style={{ marginTop: 14, fontSize: "0.9375rem" }}>
        {markets.note}
      </p>
    </div>
  );
}
