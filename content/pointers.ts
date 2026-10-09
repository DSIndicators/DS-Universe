/**
 * THE PRODUCT PAGE'S TWO SHEET LINES (2026-10-09, Tom: "tight pointer
 * informations from the master worksheet that will grab the users attention").
 *
 * GENERATED from "DS Universe - Master Product & Pricing Sheet" (updated
 * 2026-10-07) — do not hand-edit; change the sheet and regenerate:
 *   line   — NT8 Listings, "Cover Line (250×250 image)": the product in one
 *            line, set under its name on its page;
 *   reads  — Markets, "What It Reads": what the product needs from the chart,
 *            in the page's "Before you buy" band.
 * DS ASL and DS Toolkit have no NT8 listing of their own (free with DS
 * Complete), so they carry no line.
 */
export type Pointers = { line?: string; reads?: string };

const POINTERS: Record<string, Pointers> = {
  "zones": {
    "line": "Zones that know if they're holding.",
    "reads": "Price, traded volume, and the bid/ask of each live trade (loaded history is estimated from one lower-timeframe series, 1 minute by default). Tick Replay optional."
  },
  "iceberg": {
    "line": "See where size was hidden.",
    "reads": "Price, traded volume, and the bid/ask of each live trade (loaded history is estimated from one lower-timeframe series, 1 minute by default). No Level 2; Tick Replay optional."
  },
  "oracle": {
    "line": "A SuperTrend that thinks before it speaks.",
    "reads": "Price and ATR on every market; bar volume where it is usable. No lower-timeframe series, no tick data."
  },
  "gex": {
    "line": "Gamma walls on your chart. Zero setup.",
    "reads": "Cboe's delayed option chain for NDX, SPX or GLD, fetched in the background, scaled to the chart by the basis. Internet access; no data subscription."
  },
  "flow": {
    "line": "Who was pressing, at every price.",
    "reads": "Traded volume at each price; the bid/ask of each live trade. Loaded history is estimated from one lower-timeframe series (1 minute by default), no tick download."
  },
  "prorsi": {
    "line": "Volume-weighted RSI. Zones with a record.",
    "reads": "Price and volume (closed bars). No tick data."
  },
  "proliquidityhunter": {
    "line": "Every pool, and the odds price reaches it.",
    "reads": "Price only (closed bars). No volume, no tick data."
  },
  "proheikinashi": {
    "line": "The price where the color flips.",
    "reads": "Price only (the chart's own bars, decided on closed bars). No volume, no tick data, no second data series."
  },
  "protrendrange": {
    "line": "Trend. Pullback. Resume. One scale.",
    "reads": "Price only (closed bars). No volume, no tick data."
  },
  "bulk-replay-downloader": {
    "line": "Queue the whole range. Walk away.",
    "reads": "No chart data of its own: it queues NinjaTrader's Market Replay (.nrd) download per instrument and day."
  },
  "adaptive-priceline": {
    "line": "A price line that never leaves the candle.",
    "reads": "The chart's last price and bar clock. Nothing else."
  },
  "chart-price": {
    "line": "Price you can read from across the room.",
    "reads": "The chart's last price, tick by tick. Nothing else."
  },
  "ds-258": {
    "line": "The four levels NQ keeps reacting to.",
    "reads": "The chart's price scale only. No bars, no volume, no lookback."
  },
  "parallax": {
    "line": "Higher timeframes, without leaving yours.",
    "reads": "Price on up to four higher-timeframe series of the same instrument (15m / 1h / 4h / 1D by default). No volume."
  },
  "session-levels": {
    "line": "Every session's high and low, exact.",
    "reads": "Price only, on any intraday chart; one 1-minute series when the chart's own bars straddle a session edge."
  },
  "stochastics": {
    "line": "A turn only counts when four lanes agree.",
    "reads": "Price only (closed bars). No volume, no tick data."
  },
  "squeeze": {
    "line": "A squeeze that grades its own fire.",
    "reads": "Price only (closed bars). No volume, no tick data."
  },
  "macd": {
    "line": "Know the cross price before it prints.",
    "reads": "Price only (closed bars). No volume, no tick data."
  },
  "vwap": {
    "line": "Value on two clocks, measured.",
    "reads": "Price and bar volume, built on one 1-minute series of the same instrument that it adds itself (not added on 1-minute, seconds or daily charts). No tick data, no Tick Replay."
  },
  "asl": {
    "reads": "Price and traded volume, on any intraday chart: real trades read in the background, gaps filled from 1-minute bars. No Tick Replay."
  },
  "toolkit": {
    "reads": "No market data. It reads which DS indicators and drawing tools are on the chart."
  }
};

export const pointersFor = (slug: string): Pointers => POINTERS[slug] ?? {};
