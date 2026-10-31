/**
 * THE PRODUCT PAGE'S TWO SHEET LINES (2026-10-09, Tom: "tight pointer
 * informations from the master worksheet that will grab the users attention").
 *
 * GENERATED (gen_v31.py, 2026-10-29) from "DS Universe - Master Product &
 * Pricing Sheet" of 2026-10-29 — do not hand-edit; change the sheet and
 * regenerate:
 *   line   — NT8 Listings, "Cover Line (250×250 image)": the product in one
 *            line, set under its name on its page;
 *   reads  — Markets, "What It Reads": what the product needs from the chart,
 *            in the page's "Before you buy" band.
 * DS ASL and DS Toolkit have no cover line of their own (they never had a
 * listing), so they show their first hook instead (content/catalog.ts).
 */
export type Pointers = { line?: string; reads?: string };

const POINTERS: Record<string, Pointers> = {
  "zones": {
    line: "Zones that know if they're holding.",
    reads: "Price, traded volume, and the bid/ask of each live trade (loaded history is estimated from one lower-timeframe series, 1 minute by default). Tick Replay optional.",
  },
  "compass": {
    line: "Who holds the market, and the room left.",
    reads: "Price and bar volume (the line is weighted by where volume traded), each reading compared with the same time of day on earlier sessions, 20 by default — history it requests itself. Closed bars.",
  },
  "ember": {
    line: "The trend's heat, in your own candles.",
    reads: "Price on the chart's own bars, any bar type: bricks of one average true range (14 bars), decided on each close. Twelve finished runs of history before a run can burn out. No volume needed. Closed bars.",
  },
  "iceberg": {
    line: "See where size was hidden.",
    reads: "Price, traded volume, and the bid/ask of each live trade (loaded history is estimated from one lower-timeframe series, 1 minute by default). No Level 2; Tick Replay optional.",
  },
  "flow": {
    line: "Who was pressing, at every price.",
    reads: "Traded volume at each price; the bid/ask of each live trade. Loaded history is estimated from one lower-timeframe series (1 minute by default), no tick download.",
  },
  "gex": {
    line: "Gamma walls on your chart. Zero setup.",
    reads: "CBOE's delayed option chain for NDX, SPX or GLD, fetched in the background, scaled to the chart by the basis. Internet access; no data subscription.",
  },
  "asl": {
    reads: "Price and traded volume, on any intraday chart: real trades read in the background, gaps filled from 1-minute bars. No Tick Replay.",
  },
  "prorsi": {
    line: "Volume-weighted RSI. Zones with a record.",
    reads: "Price and volume (closed bars). No tick data.",
  },
  "proliquidityhunter": {
    line: "Every pool, and the odds price reaches it.",
    reads: "Price only (closed bars). No volume, no tick data.",
  },
  "proheikinashi": {
    line: "The price where the color flips.",
    reads: "Price only (the chart's own bars, decided on closed bars). No volume, no tick data, no second data series.",
  },
  "protrendrange": {
    line: "Trend. Pullback. Resume. One scale.",
    reads: "Price only (closed bars). No volume, no tick data.",
  },
  "bulk-replay-downloader": {
    line: "Queue the whole range. Walk away.",
    reads: "No chart data of its own: it queues NinjaTrader's Market Replay (.nrd) download per instrument and day.",
  },
  "toolkit": {
    reads: "No market data. It reads which DS indicators and drawing tools are on the chart.",
  },
  "adaptive-priceline": {
    line: "A price line that never leaves the candle.",
    reads: "The chart's last price and bar clock, plus the color another indicator paints on the candles, when one runs beside it (Follow candle color).",
  },
  "chart-price": {
    line: "Price you can read from across the room.",
    reads: "The chart's last price, tick by tick (or bid, ask or mid, if you pick it). Nothing else.",
  },
  "ds-258": {
    line: "The four levels NQ keeps reacting to.",
    reads: "The chart's price scale only. No bars, no volume, no lookback.",
  },
  "parallax": {
    line: "Higher timeframes, without leaving yours.",
    reads: "Price on up to four higher-timeframe series of the same instrument (15m / 1h / 4h / 1D by default). No volume.",
  },
  "session-levels": {
    line: "Every session's high and low, exact.",
    reads: "Price only, on any intraday chart; one 1-minute series on range, Renko, tick, volume and Heiken Ashi charts, or bars that straddle a session edge.",
  },
  "vwap": {
    line: "Value, and whether the trend agrees.",
    reads: "Price and bar volume, built on one 1-minute series of the same instrument that it adds itself (not added on 1-minute, seconds or daily charts); the EMAs on the chart's own bars. No tick data, no Tick Replay.",
  },
  "live-background": {
    line: "Your own video, looping behind the bars.",
    reads: "No market data, only the media file you choose.",
  },
  "time-intervals": {
    line: "Your timeframes, one click away.",
    reads: "No market data. It sets the chart's own bar period: second, minute, day, week, month, year, tick, volume, range or Renko.",
  },
  "volume": {
    line: "Volume, against what's normal now.",
    reads: "Bar volume, built on one 1-minute series of the same instrument that it adds itself, plus one background request for 20 sessions of 1-minute history merged across contract rolls; the last trade checks the data clock. No Tick Replay.",
  },
};

export const pointersFor = (slug: string): Pointers => POINTERS[slug] ?? {};
