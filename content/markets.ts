/**
 * MARKETS — which instruments each product is built on and runs on.
 *
 * GENERATED from the "Markets" tab of "DS Universe - Master Product & Pricing
 * Sheet" (added 2026-10-01; regenerated 2026-10-29 for v3.1 through the hand-off's
 * products-v3.1.json, gen_v31.py). Do not hand-edit the entries: change the
 * sheet's source and regenerate, so the site and the sheet keep saying the same thing.
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
 *    averages, and its caption says so (v3.0, 2026-10-25; the sheet's note).
 *  · DS Volume (2026-10-25) compares the volume a feed reports with that
 *    market's own history, so it runs wherever volume is reported; on forex
 *    and CFD feeds that is a tick count, which its note says (the sheet's
 *    "Yes — the feed's tick count").
 *
 * "BUILT ON" is a statement of fact, not of performance: the markets each
 * product's rules were built and checked on, per the sheet (most on real
 * 1-minute MNQ charts; DS Compass and DS Data Candles on NQ, ES, GC and CL too).
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

/** The instruments most of the lineup is built on (the store FAQ's answer).
 *  Each product's own "Built on" is its `builtOn` below, from the sheet. */
export const HOME_MARKETS: string[] = ["NQ", "MNQ"];

export type Markets = {
  /** The one-line answer. */
  headline: string;
  /** The sentence under the meter: what it reads, and so where it runs. */
  note: string;
  /** The sheet's "Built On" ("NQ · MNQ", "NQ · ES · GC · CL"), or null for a
   *  product that is not built on a market (DS GEX, the add-ons). */
  builtOn: string | null;
  /** The asset classes it runs on — the meter. */
  classes?: Record<MarketClass, boolean>;
  /** Named markets, for a product built for specific ones (DS GEX). */
  named?: { label: string; symbols: string }[];
};

export const MARKETS: Record<string, Markets> = {
  "zones": {
    headline: "Futures and stocks",
    note: "Its order-flow read needs real traded volume, and forex and CFDs report none in NinjaTrader.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: false, crypto: false },
  },
  "compass": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price, and volume where the feed reports it: without usable volume the line falls back to typical price and everything else works. Every reading is measured against that market's own earlier sessions.",
    builtOn: "NQ · MNQ · ES · GC · CL",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "data-candles": {
    headline: "Any market NinjaTrader charts",
    note: "The color reads price on every market. The fills and captions need usable volume: without it they switch themselves off, the Log tab says so, and direction and strength still work from price alone.",
    builtOn: "NQ · ES · GC · CL",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "iceberg": {
    headline: "Futures and stocks",
    note: "Absorption is read from real traded volume and the side it traded on. Forex and CFDs have no trade tape in NinjaTrader.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: false, crypto: false },
  },
  "flow": {
    headline: "Futures and stocks",
    note: "It profiles traded volume, split into buying and selling. Forex and CFDs have no trade tape in NinjaTrader.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: false, crypto: false },
  },
  "gex": {
    headline: "Nasdaq-100, S&P 500 and gold",
    note: "It computes its levels from the NDX, SPX and GLD option chains and draws them on these futures, on NDX and SPX index charts, on spot gold and on the matching CFD tickers. On Auto, any other symbol, ETFs included, draws nothing.",
    builtOn: null,
    named: [
      { label: "Nasdaq-100", symbols: "NQ · MNQ" },
      { label: "S&P 500", symbols: "ES · MES" },
      { label: "Gold", symbols: "GC · MGC" },
    ],
  },
  "asl": {
    headline: "Futures and stocks",
    note: "The session profiles are built from traded volume. Forex and CFDs report none in NinjaTrader — DS Session Levels, the free one, is the tool for those.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: false, crypto: false },
  },
  "prorsi": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price and volume. Zone depth is bounded by ATR and volume is measured against the chart's own normal, so both scale to whatever market the chart is on. Where a market reports no volume it runs as a classic RSI.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "proliquidityhunter": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only. Pools are sized by the average true range and the heat tiers are probabilities, so both mean the same thing on every instrument, timeframe and bar type.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "proheikinashi": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only. The cushion is counted in the chart's own unit, so the same reading means the same thing on every instrument and timeframe. Use it on real bars: on NinjaTrader's Renko bars the cushion says little, and the panel says so.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "protrendrange": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only. Both of its readings sit on one statistical scale, so one sigma is the same reading on every instrument, timeframe and bar type.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "bulk-replay-downloader": {
    headline: "What NinjaTrader's replay servers carry",
    note: "It downloads NinjaTrader's own Market Replay files: roughly the last 90 days, for the instruments NinjaTrader serves. Futures days follow the front-month contract by default.",
    builtOn: null,
  },
  "toolkit": {
    headline: "Any chart",
    note: "It works the chart, not the market: the rail lists whichever DS indicators are on that chart.",
    builtOn: null,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "adaptive-priceline": {
    headline: "Any market NinjaTrader charts",
    note: "It follows the chart's own last price, so the market makes no difference. The bar countdown shows on time-based bars.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "chart-price": {
    headline: "Any market NinjaTrader charts",
    note: "It reads the chart's own last price, tick by tick, so the market makes no difference.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "ds-258": {
    headline: "The Nasdaq map, adjustable to other markets",
    note: "It ships as the Nasdaq map: one block is 100 points. Set Block size in another instrument's own points to move it — 50 on ES gives x00, x10, x25 and x40.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "parallax": {
    headline: "Any market NinjaTrader charts",
    note: "Reads price only, and each panel fits its own scale to whatever market the chart is on.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "session-levels": {
    headline: "Any market NinjaTrader charts",
    note: "Any intraday chart. Presets for the futures day, ICT killzones and forex sessions, on New York time by default.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "vwap": {
    headline: "Any market NinjaTrader charts",
    note: "The VWAP is weighted by bar volume and built on one-minute bars, so minute, tick, range and Renko charts of an instrument show the same line. Where a feed reports no volume it becomes a time-weighted average, and the caption says so.",
    builtOn: "NQ · MNQ",
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "live-background": {
    headline: "Any chart",
    note: "Reads no market data, so it behaves the same on every instrument, bar type and timeframe.",
    builtOn: null,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "time-intervals": {
    headline: "Every chart window's toolbar",
    note: "An add-on, not an indicator: it changes the chart's own timeframe, on any instrument.",
    builtOn: null,
    classes: { futures: true, stocks: true, forex: true, crypto: true },
  },
  "volume": {
    headline: "Any market whose feed reports volume",
    note: "It compares the volume your feed reports with that market's own history, so it reads any market with volume. On forex and CFD feeds that volume is a count of ticks, so it reads activity rather than contracts.",
    builtOn: "NQ · MNQ",
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
