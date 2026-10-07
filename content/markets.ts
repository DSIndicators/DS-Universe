/**
 * MARKETS — which instruments each product is built on and runs on.
 *
 * GENERATED from the "Markets" tab of "DS Universe - Master Product & Pricing
 * Sheet" (added 2026-10-01; regenerated 2026-10-05 for the new lineup). Do not hand-edit the entries: change the sheet's
 * source and regenerate, so the site and the sheet keep saying the same thing.
 *
 * WHY IT EXISTS (Tom, 2026-10-01): a buyer's first question is "does it work
 * on what I trade?", and sales are final once the files are issued, so the
 * answer belongs on every product page BEFORE the price. It replaces the one
 * blanket line the site used to carry ("any instrument NinjaTrader charts"),
 * which was not true of every product.
 *
 * WHERE EVERY CLAIM COMES FROM — the shipped code (Build 2026-10-01), read
 * product by product, plus NinjaTrader's own documentation:
 *  · Price-only tools (no Volume reference anywhere in the source; thresholds
 *    in ATR or ticks, never fixed points) run on any instrument type
 *    NinjaTrader charts: futures, stocks, forex, crypto.
 *  · Tools that read TRADED VOLUME and split it into buying and selling — by
 *    the bid/ask of each trade live, estimated from lower-timeframe bars on
 *    loaded history (DS Zones, DS Iceberg, DS Flow, DS ASL) —
 *    are for exchange-traded markets. Nothing in their code refuses a forex
 *    chart; it would draw a misleading read, which is why the page says no. NinjaTrader's support states it plainly: forex is not traded on
 *    a centralized exchange, "there is no tape available for Forex trades",
 *    and its Last price is substituted with the Bid — so a buy/sell split
 *    there would be a fiction. Crypto is left out as well: its volume is
 *    fractional and needs a conversion call these products do not make.
 *  · DS GEX reads three option chains (NDX, SPX, GLD) and recognizes a fixed
 *    list of chart symbols (DSGex.cs DetectMarket). Any other symbol — QQQ,
 *    SPY and GLD charts included — resolves to no market and draws nothing.
 *  · DS 258 ships as the Nasdaq map (Block size 100 points) and is moved to
 *    another market with that one setting.
 *  · DS VWAP weighs each bar by its volume relative to the others, so it runs
 *    on any feed; where no volume is reported its lines are time-weighted
 *    averages, and the panel says so (the sheet's own footnote).
 *
 * "BUILT ON" is a statement of fact, not of performance: every chart on this
 * site is a Nasdaq futures chart, and the products' rules are judged on real
 * 1-minute MNQ charts before they ship. It is one constant, HOME_MARKETS.
 *
 * WORDING RULES (NinjaTrader vendor guidelines): a market is where a product
 * RUNS, never where it "works best" or "performs". No outcome, accuracy or
 * "optimized" language; every sentence is a documented behaviour.
 */

import { PRODUCTS } from "./products";

export type MarketClass = "futures" | "stocks" | "forex" | "crypto";

/** The meter's four cells, in the order they are drawn. */
export const MARKET_CLASSES: { key: MarketClass; label: string }[] = [
  { key: "futures", label: "Futures" },
  { key: "stocks", label: "Stocks" },
  { key: "forex", label: "Forex" },
  { key: "crypto", label: "Crypto" },
];

/** The instruments the products are built on. Rendered as "NQ · MNQ". */
export const HOME_MARKETS: string[] = ["NQ", "MNQ"];

export type Markets = {
  /** The one-line answer. */
  headline: string;
  /** The sentence under the meter: what it reads, and so where it runs. */
  note: string;
  /** Show "Built on NQ · MNQ" beside the label. */
  builtOn: boolean;
  /** The asset classes it runs on — the meter. */
  classes?: Record<MarketClass, boolean>;
  /** Named markets, for a product built for specific ones (DS GEX). */
  named?: { label: string; symbols: string }[];
};

export const MARKETS: Record<string, Markets> = {
  "zones": {
    headline: "Futures and stocks",
    note: "Its order-flow read needs real traded volume, and forex and CFDs report none in NinjaTrader.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: false, crypto: false },
  },
  "iceberg": {
    headline: "Futures and stocks",
    note: "Absorption is read from real traded volume and the side it traded on. Forex and CFDs have no trade tape in NinjaTrader.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: false, crypto: false },
  },
  "oracle": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price on every market, and volume where the feed reports it. Without usable volume it runs on price alone.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "gex": {
    headline: "Nasdaq-100, S&P 500 and gold",
    note: "It computes its levels from the NDX, SPX and GLD option chains and draws them on these futures, on NDX and SPX index charts and on spot gold. Any other symbol, ETFs included, draws nothing.",
    builtOn: false,
    named: [
      { label: "Nasdaq-100", symbols: "NQ · MNQ" },
      { label: "S&P 500", symbols: "ES · MES" },
      { label: "Gold", symbols: "GC · MGC" },
    ],
  },
  "flow": {
    headline: "Futures and stocks",
    note: "It profiles traded volume, split into buying and selling. Forex and CFDs have no trade tape in NinjaTrader.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: false, crypto: false },
  },
  "prorsi": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price and volume. Zone depth is bounded by ATR and volume is measured against the chart's own normal, so both scale to whatever market the chart is on. Where a market reports no volume it runs as a classic RSI.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "proliquidityhunter": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only. Pools are sized by the average true range and the heat tiers are probabilities, so both mean the same thing on every instrument, timeframe and bar type.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "proheikinashi": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only. The cushion is counted in the chart's own unit, so the same reading means the same thing on every instrument and timeframe. Use it on real bars: on NinjaTrader's Renko bars the cushion says little, and the panel says so.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "protrendrange": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only. Both of its readings sit on one statistical scale, so one sigma is the same reading on every instrument, timeframe and bar type.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "bulk-replay-downloader": {
    headline: "What NinjaTrader's replay servers carry",
    note: "It downloads NinjaTrader's own Market Replay files: roughly the last 90 days, for the instruments NinjaTrader serves. Futures days follow the front-month contract by default.",
    builtOn: false,
  },
  "asl": {
    headline: "Futures and stocks",
    note: "The session profiles are built from traded volume. Forex and CFDs report none in NinjaTrader — DS Session Levels, the free one, is the tool for those.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: false, crypto: false },
  },
  "toolkit": {
    headline: "Any chart",
    note: "It works the chart, not the market: the rail lists whichever DS indicators are on that chart.",
    builtOn: false,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "adaptive-priceline": {
    headline: "Any market NinjaTrader charts",
    note: "It follows the chart's own last price, so the market makes no difference. The bar countdown shows on time-based bars.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "chart-price": {
    headline: "Any market NinjaTrader charts",
    note: "It reads the chart's own last price, tick by tick, so the market makes no difference.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "ds-258": {
    headline: "The Nasdaq map, adjustable to other markets",
    note: "It ships as the Nasdaq map: one block is 100 points. Set Block size in another instrument's own points to move it — 50 on ES gives x00, x10, x25 and x40.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "parallax": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only, and each panel fits its own scale to whatever market the chart is on.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "session-levels": {
    headline: "Any market NinjaTrader charts",
    note: "Any intraday chart. Presets for the futures day, ICT killzones and forex sessions, on New York time by default.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "stochastics": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only. A stochastic runs from 0 to 100 on every market, so nothing needs adjusting.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "squeeze": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only. Compression is Bollinger width over ATR — a ratio, with nothing tied to one market's point size.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "macd": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only. Its default MACD-V scale is volatility-normalized, so its zones sit at the same values on every instrument.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "vwap": {
    headline: "Any market NinjaTrader charts",
    note: "Both VWAPs are weighted by bar volume and built on one-minute bars, so they are the same lines on every intraday chart of an instrument. Where a feed reports no volume they become time-weighted averages, and the panel says so.",
    builtOn: true,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
};

export const marketsFor = (slug: string): Markets | undefined => MARKETS[slug];

/** The products that read traded volume — the store FAQ names them. */
export const tapeOnlySlugs = (): string[] =>
  Object.keys(MARKETS).filter((s) => MARKETS[s].classes && !MARKETS[s].classes!.forex);

/* Every product page carries a Markets block, so a product without an entry
   (or an entry without a product) stops `next build` rather than shipping a
   page that says nothing about where it runs. */
for (const p of PRODUCTS) {
  const m = MARKETS[p.slug];
  if (!m) throw new Error(`content/markets.ts: no markets for "${p.slug}".`);
  if (m.classes && m.named) throw new Error(`content/markets.ts: "${p.slug}" has both a meter and named markets.`);
}
for (const slug of Object.keys(MARKETS)) {
  if (!PRODUCTS.some((p) => p.slug === slug)) {
    throw new Error(`content/markets.ts: "${slug}" has markets but is not in the catalogue.`);
  }
}
