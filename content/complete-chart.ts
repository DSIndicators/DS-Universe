import { PRODUCTS } from "@/content/products";

/**
 * WHAT EACH PRODUCT DRAWS on the DS Complete chart (components/CompleteChart.tsx).
 *
 * Tom, 2026-09-29: the DS Complete box render was "stretched out and blurry,
 * zero effort"; he liked the technicality of the chart reader. So the image
 * of DS Complete is now what it actually is: one NinjaTrader chart with every
 * product's own drawing on it at once — "built to run together on one chart".
 *
 * One line per product, shown when a visitor points at it in the list beside
 * the chart. Each line is the product's own wording (content/products.ts:
 * its hooks, or the name the chart reader uses for what it draws). No numbers,
 * no results.
 *
 * Every product must have a line here AND a layer in CompleteChart.tsx. The
 * check below fails the build if the lineup changes and this list does not,
 * so the picture can never quietly show a lineup the store no longer sells.
 */
export const DRAWS: Record<string, string> = {
  zones: "Living Zones — tracked FRESH to DEFENDED or BREAKING",
  iceberg: "Absorption Runways — ICE BID below price, ICE OFFER above, an iceberg on each, every test marked",
  oracle: "Neural Line — above it, look long; below it, look short",
  gex: "Dealer Gamma Map — Call Wall, Gamma Flip, Put Wall",
  flow: "Candle X-Ray — buy vs sell volume at every price, heavy rows flagged",
  prorsi: "One RSI, its extremes shaded; its crossovers become levels on price",
  prostochastics: "Four speeds in four lanes, one quad latch",
  prosqueeze: "Compression as one live number; every fire graded",
  protrendrange: "Trend and swing on one scale — the pullback filled as a pocket, the state named bar by bar",
  "session-levels": "Each session bracketed over its own bars, its high and low carried forward until it opens again",
  "pro-session-levels": "The session's volume profile inside its bracket, its POC carried forward as a level",
  "adaptive-priceline": "Always anchored to the candle; the bar-close countdown rides the line",
  "chart-price": "The last price, large, changing every tick: green up, red down, amber when it chops",
  "ds-258": "Every 00/20/50/80 in view, a whisper not a wall",
  parallax: "Four higher timeframes along the bottom of the chart, resting stops marked",
  toolkit: "One rail: every DS indicator on or off in one click",
  "bulk-replay-downloader": "Market Replay days fetched in one queued run, days you have skipped",
};

/** The layers CompleteChart.tsx actually draws — kept in step with DRAWS. */
export const DRAWN = [
  "zones", "iceberg", "oracle", "gex", "flow",
  "prorsi", "prostochastics", "prosqueeze", "protrendrange",
  "session-levels", "pro-session-levels",
  "adaptive-priceline", "chart-price", "ds-258", "parallax", "toolkit",
  "bulk-replay-downloader",
] as const;

for (const p of PRODUCTS) {
  if (!DRAWS[p.slug] || !(DRAWN as readonly string[]).includes(p.slug)) {
    throw new Error(
      `content/complete-chart.ts: "${p.slug}" is in the lineup but has no drawing on the DS Complete chart. ` +
        `Add its line to DRAWS and its layer to components/CompleteChart.tsx.`,
    );
  }
}
for (const slug of DRAWN) {
  if (!PRODUCTS.some((p) => p.slug === slug)) {
    throw new Error(`content/complete-chart.ts: the DS Complete chart draws "${slug}", which is no longer in the lineup.`);
  }
}
