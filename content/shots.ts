/**
 * Every picture we hold for a product, in the order a buyer should meet them.
 *
 * One entry per real screenshot Tom supplied — nothing is left in a folder.
 * The product page shows the first one large and offers the rest on a rail
 * beside it, so a tool with six views is no longer than a tool with one.
 *
 * Files live at /shots/<slug>/NN.webp, built from the source captures at
 * 1920x1080. Narrow UI panels are centred on the site's panel colour rather
 * than cropped, so nothing is cut through.
 *
 * Captions describe what is on screen. They never claim a result.
 */
/**
 * Every demo video opens on a four-second Risk Disclosure card, and the card is
 * also the poster — so the disclosure is the first thing painted, before a
 * frame of software is shown. NinjaTrader's guidelines: "Disclosures must be
 * presented visually at the beginning of any video materials." The rail
 * thumbnail stays a picture of the software, via `thumb`.
 */
export type Shot = {
  src: string;
  /** Shown under the stage. Omit for products with a single picture. */
  caption?: string;
  /** A moving demo, shown in place of the still. */
  video?: { src: string; poster: string };
  /** Rail picture, when the stage shows something else (a video). */
  thumb?: string;
};

const s = (slug: string, n: number) => `/shots/${slug}/${String(n).padStart(2, "0")}.webp`;

export const SHOTS: Record<string, Shot[]> = {
  /* ---------------------------------------------------------- indicators */
  oracle: [
    { src: s("oracle", 1), caption: "The Neural Line, and what price sitting either side of it is telling you" },
    { src: s("oracle", 2), caption: "Hollow candles, a filled gap and a marked-up entry" },
  ],
  sonar: [
    { src: s("sonar", 1), caption: "The squeeze and breakout radar under a trending chart" },
    { src: s("sonar", 2), caption: "A short squeeze flagged on a closed bar" },
  ],
  zones: [
    { src: s("zones", 1), caption: "Supply and demand zones, and the ones price kept respecting" },
    { src: s("zones", 2), caption: "The zones price came back to, on a second session" },
  ],
  gex: [
    { src: s("gex", 1), caption: "Call, put and 0DTE walls across the session" },
    { src: s("gex", 2), caption: "Gamma flip, max pain and the expected-move band" },
  ],
  iceberg: [
    {
      src: s("iceberg", 1),
      caption: "Zones confirming and breaking as the session runs",
      video: { src: "/covers/iceberg.mp4", poster: "/covers/disclosure-card.webp" },
      thumb: "/covers/iceberg-poster.webp",
    },
    { src: s("iceberg", 1), caption: "Iceberg zones, including the ones already broken" },
    { src: s("iceberg", 2), caption: "Broken zones that price still reacts to" },
  ],
  flow: [
    {
      src: s("flow", 1),
      caption: "Order flow and volume profile building through the session",
      video: { src: "/covers/flow.mp4", poster: "/covers/disclosure-card.webp" },
      thumb: "/covers/flow-poster.webp",
    },
    { src: s("flow", 1), caption: "On a NinjaTrader 8 chart" },
  ],
  parallax: [
    {
      src: s("parallax", 1),
      caption: "Four higher timeframes beside the chart, each counting down to its own close",
      /* The only demo delivered at a true 16:9. The stage is 16:9 and every
         other clip is 1920x970, so object-cover trims 98px off EACH side of
         them; on this one that cut the fourth mini-chart - the daily - clean
         off the right edge. Re-cut from the 4276x2160 master with the crop
         taken entirely from the LEFT (Tom, 2026-09-12), so nothing on the
         right is lost and the stage crops nothing at all. Its poster is the
         same risk-disclosure card padded to 16:9 for the same reason. */
      video: { src: "/covers/parallax.mp4", poster: "/covers/disclosure-card-16x9.webp" },
      thumb: "/covers/parallax-poster.webp",
    },
    { src: s("parallax", 1), caption: "The panel on a NinjaTrader 8 chart" },
  ],
  "isotropic-lines": [{ src: s("isotropic-lines", 1) }],
  "adaptive-priceline": [
    {
      src: s("adaptive-priceline", 1),
      caption: "The price line re-anchoring as the candle moves",
      video: { src: "/covers/adaptive-priceline.mp4", poster: "/covers/disclosure-card.webp" },
      thumb: "/covers/adaptive-priceline-poster.webp",
    },
    { src: s("adaptive-priceline", 1), caption: "On a NinjaTrader 8 chart" },
  ],
  "chart-price": [
    {
      src: s("chart-price", 1),
      caption: "The read-out counting with the last price",
      video: { src: "/covers/chart-price.mp4", poster: "/covers/disclosure-card.webp" },
      thumb: "/covers/chart-price-poster.webp",
    },
    { src: s("chart-price", 1), caption: "On a NinjaTrader 8 chart" },
  ],

  /* ------------------------------------------------------------- add-ons */
  screener: [
    { src: s("screener", 1), caption: "The full board — heat map, movers, quote board and chart" },
    { src: s("screener", 2), caption: "The economic calendar for the session" },
    { src: s("screener", 3), caption: "Watchlist beside the chart" },
    { src: s("screener", 4), caption: "The same board in light mode" },
    { src: s("screener", 5), caption: "The calendar in light mode" },
    { src: s("screener", 6), caption: "Watchlist and chart in light mode" },
  ],
  marketwatch: [
    { src: s("marketwatch", 1), caption: "The bar up close — session change on everything you follow" },
    { src: s("marketwatch", 2), caption: "Docked above the chart" },
    { src: s("marketwatch", 3), caption: "A second colour scheme" },
    { src: s("marketwatch", 4), caption: "On a light chart" },
  ],
  toolkit: [
    { src: s("toolkit", 1), caption: "The dock and the drawing-tool picker, side by side" },
    { src: s("toolkit", 2), caption: "Choosing which drawing tools the dock carries" },
  ],
  "time-intervals": [{ src: s("time-intervals", 1) }],
  "bulk-replay-downloader": [
    {
      src: s("bulk-replay-downloader", 1),
      caption: "Downloading a month of market replay data",
      video: { src: "/covers/bulk-replay-downloader.mp4", poster: "/covers/disclosure-card.webp" },
      thumb: "/covers/bulk-replay-downloader-poster.webp",
    },
    { src: s("bulk-replay-downloader", 2), caption: "The download queue, file by file" },
  ],
};

export const shotsFor = (slug: string): Shot[] => SHOTS[slug] ?? [];
