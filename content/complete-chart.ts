import { COMPLETE_PRODUCTS } from "@/content/release";

/**
 * WHAT EACH PRODUCT DRAWS on the DS Complete chart (components/CompleteChart.tsx).
 *
 * Tom, 2026-09-29: the DS Complete box render was "stretched out and blurry,
 * zero effort"; he liked the technicality of the chart reader. So the image
 * of DS Complete is what it actually is: one NinjaTrader chart with the
 * drawing of every product IN DS COMPLETE on it at once — "built to run
 * together on one chart".
 *
 * 2026-10-05: DS Complete is the paid products, DS ASL and DS Toolkit. The
 * Free Vault products are not part of it, so the chart does not draw them —
 * and the check below reads COMPLETE_PRODUCTS, so a vault product can never
 * be drawn as part of the bundle again. DS Toolkit's rail is back on the left
 * of the price pane (it comes free with DS Complete), listing one switch for
 * each indicator in the bundle and nothing else (RAIL_ROWS).
 *
 * One line per product, shown when a visitor points at it in the list beside
 * the chart. Each line is the product's own wording (content/products.ts:
 * its hooks, or the name the chart reader uses for what it draws). No numbers,
 * no results.
 *
 * Every product in DS Complete must have a line here AND a layer in
 * CompleteChart.tsx. The check below fails the build if the bundle changes and
 * this list does not, so the picture can never quietly show a lineup the store
 * no longer sells.
 */
export const DRAWS: Record<string, string> = {
  zones: "Living Zones — tracked FRESH to DEFENDED or BREAKING",
  iceberg: "Absorption Runways — ICE BID below price, ICE OFFER above, an iceberg on each, every test marked",
  oracle: "Neural Line — above it, look long; below it, look short",
  gex: "Dealer Gamma Map — Call Wall, Gamma Flip, Put Wall",
  flow: "Candle X-Ray — buy vs sell volume at every price, heavy rows flagged",
  prorsi: "A volume-weighted RSI, its extremes shaded; its turns become zones on price",
  proliquidityhunter: "Every resting pool mapped over a line on close — buy-side over the highs, sell-side under the lows, SWEPT or RUN on the next close",
  proheikinashi: "Heikin-Ashi under real candles, each standing on its own open; the flip level drawn on price as a real price",
  protrendrange: "Trend and swing on one scale — the pullback filled as a pocket, the state named bar by bar",
  "bulk-replay-downloader": "Market Replay days fetched in one queued run, days you have skipped",
  asl: "Each session bracketed over its own bars, its volume profile inside the bracket, its POC carried forward as a level",
  toolkit: "One rail: every DS indicator on the chart on or off in one click, the drawing tools underneath",
};

/** The layers CompleteChart.tsx actually draws — kept in step with DRAWS. */
export const DRAWN = [
  "zones", "iceberg", "oracle", "gex", "flow",
  "prorsi", "proliquidityhunter", "proheikinashi", "protrendrange",
  "bulk-replay-downloader",
  "asl", "toolkit",
] as const;

/**
 * THE ROWS ON THE DS TOOLKIT RAIL — one switch per DS indicator on the chart
 * ("Lists only the DS indicators actually on that chart"). The chart is DS
 * Complete's, so the rows are the indicators IN DS Complete, in the ledger's
 * order: read from COMPLETE_PRODUCTS, never typed, so the rail cannot list a
 * product the bundle does not hold. Add-ons are not rows (the downloader runs
 * outside the chart, and the rail does not list itself).
 */
export const RAIL_ROWS: readonly string[] = COMPLETE_PRODUCTS.filter((p) => p.kind === "indicator").map((p) => p.slug);
for (const slug of RAIL_ROWS) {
  if (!(DRAWN as readonly string[]).includes(slug)) {
    throw new Error(`content/complete-chart.ts: the DS Toolkit rail lists "${slug}", which the DS Complete chart does not draw.`);
  }
}

for (const p of COMPLETE_PRODUCTS) {
  if (!DRAWS[p.slug] || !(DRAWN as readonly string[]).includes(p.slug)) {
    throw new Error(
      `content/complete-chart.ts: "${p.slug}" is in DS Complete but has no drawing on the DS Complete chart. ` +
        `Add its line to DRAWS and its layer to components/CompleteChart.tsx.`,
    );
  }
}
for (const slug of [...DRAWN, ...Object.keys(DRAWS)]) {
  if (!COMPLETE_PRODUCTS.some((p) => p.slug === slug)) {
    throw new Error(`content/complete-chart.ts: the DS Complete chart draws "${slug}", which is not part of DS Complete.`);
  }
}
