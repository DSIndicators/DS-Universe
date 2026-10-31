import { PRODUCTS } from "@/content/products";

/**
 * THE PRODUCT COVER — ONE SIZE, ONE VISION (Tom, 2026-10-08: "My goal is to
 * have 1 coherent size and vision").
 *
 * Every product in the marketplace is shown by one picture: Tom's own
 * NinjaTrader 8 chart (or, for a tool without a chart, its window), exactly
 * as he made it. The cards in the Free Vault, the store, the home page and
 * the "more" row on every product page all draw the cover from here
 * (components/CoverArt.tsx), so a cover added here appears everywhere at once.
 *
 * Masters (since 2026-10-26): DS Media\1025 New Media Cover\<Product>.png,
 * on Tom's white template, NEVER EDITED: no plate, no frame, no crop, no
 * recolour (Tom, 2026-10-26: "Don't change it in any way... Use the white
 * background as is, keep the pictures crisp and the same"). The site serves a
 * LOSSLESS webp of each at public/covers/sq/<batch>/<slug>.webp, pixel for
 * pixel the PNG, and CoverArt shows it unoptimized on a white frame. A
 * re-shot cover gets a NEW batch folder (the site's assets are cached for a
 * year under one name).
 *
 * THE DARK PLATE (2026-10-09 to 2026-10-25, batches 1009b and 1022) is
 * RETIRED: the site is moving to a white layout.
 *
 * UNTIL A PRODUCT HAS ITS COVER, its card shows a square cut of the chart it
 * already has (content/loupe.ts), centred on the place that picture was
 * measured on — the same square frame, no magnification and no labels, so
 * the grid keeps one size while the covers are being shot.
 *
 * 2026-10-25 — DS MACD, DS Stochastics and DS Squeeze were discontinued and
 * their covers are off the list.
 *
 * 2026-10-26 — NEW DEFAULT COVERS for all 21 products (batch 1026), on
 * WHITE (Tom: "Use the white background as is, keep the pictures crisp and
 * the same. we're going to be transitioning our website into a white
 * layout"). THE DARK PLATE IS RETIRED: a cover is Tom's picture untouched,
 * on a white cover frame, served unoptimized so the browser gets his exact
 * pixels. The plated 1009b and 1022 files stay in public/ for the record
 * only.
 */

export type Cover = { src: string; w: number; h: number; alt: string };

/**
 * WHAT A PRODUCT WITHOUT ITS SQUARE COVER SHOWS (Tom, 2026-10-08: "make me a
 * local:3000 shell removing all current product pictures and leaving them
 * blank for the ones that don't have any so i can visually scan how they'd
 * look").
 *   "blank"       an empty square in the card's own frame — the shell, so the
 *                 finished covers can be judged against nothing else.
 *   "chart-crop"  a square cut of the product's existing chart picture
 *                 (content/loupe.ts) — the interim look.
 * Back to "chart-crop" on 2026-10-09: every product has its cover, so this
 * does nothing today. A NEW product without a cover shows a crop of its chart,
 * never a blank square, on the live site.
 */
export const COVER_GAPS: "blank" | "chart-crop" = "chart-crop";

export const SQUARE_COVERS: Record<string, Cover> = {
  /* ---------------------------------- 2026-10-26, the new default covers
     Tom's own pictures, EXACTLY as he made them (DS Media\1025 New Media
     Cover\<Product>.png, 2026-10-25, on his white template): no plate, no
     frame, no crop and no recolour. Each is served as a lossless webp with
     the same pixels as its PNG (checked), at its own size: three are not
     square (DS Bulk Replay Downloader, DS Time Intervals, DS Toolkit) and are
     shown whole, contained on white (components/CoverArt.tsx). Batch 1026. */
  zones: {
    src: "/covers/sq/1026/zones.webp",
    w: 1080,
    h: 1080,
    alt: "DS Zones on a white NinjaTrader chart: supply at 30238.00 APPROACHING (SELL 70%, PRESSING), demand at 30227.25 PIVOT, the demand zone at 30208.75 DEFENDED 3× (BUY 56%, BALANCED) and supply at 30194.25 PIVOT, each with its volume profile and label at the right edge.",
  },
  iceberg: {
    src: "/covers/sq/1026/iceberg.webp",
    w: 1080,
    h: 1080,
    alt: "DS Iceberg on a white NinjaTrader chart: an ICE OFFER at 28628.25 above the range and an ICE BID at 28558.75 below it, each tagged 2×, with price turned down from the offer and falling back to the bid.",
  },
  gex: {
    src: "/covers/sq/1026/gex.webp",
    w: 1080,
    h: 1080,
    alt: "DS GEX on a white NinjaTrader chart: the Gamma Flip at 28853.41, G+ 28749.69, EM High 28704.49, CW 0DTE 28505.22, G− 28358.53 and PW 0DTE 28260.75, each line labeled with its strike and gamma at the right edge.",
  },
  flow: {
    src: "/covers/sq/1026/flow.webp",
    w: 1080,
    h: 1080,
    alt: "DS Flow on a white NinjaTrader chart: buy and sell volume at every slice of price, drawn as profiles beside each group of candles, with a reversal marker above the high and another below the low.",
  },
  proliquidityhunter: {
    src: "/covers/sq/1026/proliquidityhunter.webp",
    w: 1080,
    h: 1080,
    alt: "DS ProLiquidityHunter on a white NinjaTrader chart: price as a white line climbing toward the MAJOR pool at 29867.75 (63%), with pools at 29890.75 (44%) and 29660.00 (9%) at the right edge and the liquidity map panel below reading HUNTING ▲ 29867.75 · 63%.",
  },
  proheikinashi: {
    src: "/covers/sq/1026/proheikinashi.webp",
    w: 1080,
    h: 1080,
    alt: "DS ProHeikinAshi on a white NinjaTrader chart: a rally with its 1m, 5m and 15m levels at the right edge, the header reading UP ▲ · 12 bars · HOLDING and the Heikin-Ashi panel below with FLIP 29821.50 · ODDS 17%; a hand-drawn arrow points at the start of the move.",
  },
  "adaptive-priceline": {
    src: "/covers/sq/1026/adaptive-priceline.webp",
    w: 1080,
    h: 1080,
    alt: "DS Adaptive Price Line on a white NinjaTrader chart: the line from the live candle to the price axis, its countdown tag reading 00:35 and the price 29224.50 at the axis.",
  },
  "chart-price": {
    src: "/covers/sq/1026/chart-price.webp",
    w: 1080,
    h: 1080,
    alt: "DS Chart Price on a white NinjaTrader chart: the last price, 29224.50, in large digits across the top of the chart.",
  },
  "ds-258": {
    src: "/covers/sq/1026/ds-258.webp",
    w: 1080,
    h: 1080,
    alt: "DS 258 on a white NinjaTrader chart: price ranging between the 00, 20, 50 and 80 levels, each line in its own color across the whole chart.",
  },
  parallax: {
    src: "/covers/sq/1026/parallax.webp",
    w: 1080,
    h: 1080,
    alt: "DS Parallax on a white NinjaTrader chart: a 1-minute session above and, in its own panel below, four live mini charts of NQ on the 15m, 1h, 4h and 1D, each with its countdown to close.",
  },
  "session-levels": {
    src: "/covers/sq/1026/session-levels.webp",
    w: 1080,
    h: 1080,
    alt: "DS Session Levels on a white NinjaTrader chart: the London high 29149.50 and low 28927.25 in teal, the New York high 29213.00 and low 29017.25 in gold, and the Asia levels dotted in violet, carried forward across the day.",
  },
  asl: {
    src: "/covers/sq/1026/asl.webp",
    w: 1080,
    h: 1080,
    alt: "DS ASL on a white NinjaTrader chart: the London session's high 29425.75, low 29212.25 and POC with its volume profile, the New York high 29414.75, POC 29257.25 and low 29138.00, and the Asia levels dotted in violet.",
  },
  "bulk-replay-downloader": {
    src: "/covers/sq/1026/bulk-replay-downloader.webp",
    w: 1122,
    h: 918,
    alt: "DS Bulk Replay Downloader in NinjaTrader 8: six futures instruments selected, a date range from 2026-07-27 to 2026-09-08, and the per-file list showing finished, downloading, queued and existing Market Replay days.",
  },
  toolkit: {
    src: "/covers/sq/1026/toolkit.webp",
    w: 925,
    h: 776,
    alt: "DS Toolkit in NinjaTrader 8: the DS rail with its indicator switches, drawing tools and DS Chalk, beside the Drawing Tools window that chooses which tools sit on the rail.",
  },
  prorsi: {
    src: "/covers/sq/1026/prorsi.webp",
    w: 1080,
    h: 1080,
    alt: "DS ProRSI on a white NinjaTrader chart: an RSI 88 zone above price and an RSI 17 zone below it, the header reading RSI 71 · OVERBOUGHT, and the RSI panel with its signal line underneath.",
  },
  protrendrange: {
    src: "/covers/sq/1026/protrendrange.webp",
    w: 1080,
    h: 1080,
    alt: "DS ProTrendRange on a white NinjaTrader chart: an uptrend after a turn with its resume marks under the pullbacks, RANGE HIGH, RANGE LOW and TREND levels at the right edge, the header reading RANGING · 2 bars and the trend panel below; hand-drawn arrows point at the pullbacks.",
  },
  vwap: {
    src: "/covers/sq/1026/vwap.webp",
    w: 1080,
    h: 1080,
    alt: "DS VWAP on a white NinjaTrader chart: the 9 and 21 EMAs with the ribbon between them colored while the trend agrees with value, EMA 21 30231.00 and UPPER 30230.00 flagged at the price axis, and the caption COHERENT ▲ 26 BARS · EXTENDED ▲ over VWAP 30177.00, with LOWER 30124.00 at the border.",
  },
  "live-background": {
    src: "/covers/sq/1026/live-background.webp",
    w: 1080,
    h: 1080,
    alt: "DS Live Background: candles over a dark, warm video backdrop, with the words DOES NOT LAG YOUR CHART above them and LIVE BACKGROUND below.",
  },
  "time-intervals": {
    src: "/covers/sq/1026/time-intervals.webp",
    w: 696,
    h: 878,
    alt: "DS Time Intervals in NinjaTrader 8: the timeframe menu reading ON THIS CHART · 7 Minute, with seconds, minutes, hours, days, tick, volume, range and Renko choices, the favorites marked in teal and 7m selected.",
  },
  volume: {
    src: "/covers/sq/1026/volume.webp",
    w: 1080,
    h: 1080,
    alt: "DS Volume on a white NinjaTrader chart: a rally with its volume as a low strip along the bottom of the price panel, quiet bars faint and heavy bars solid, and a thin line at each bar's typical volume for that minute.",
  },
};

export const squareCoverFor = (slug: string): Cover | undefined => SQUARE_COVERS[slug];

/**
 * ALT TEXT FOR TOM'S NEWER PICTURES, keyed by the picture's own file name
 * (tools/covers.mjs records it in content/drop-covers.json). Each is read off
 * the picture as Tom made it. Pictures come from:
 *  - DS Master Folder\<Product>\<Product>.png, for a product with no other
 *    picture (Tom, 2026-10-29: "product images come from each product's own
 *    DS Master Folder\<Product>\ folder");
 *  - the "... White Website Pictures" folders beside the site (Tom,
 *    2026-10-29 evening: "3 new pictures including new ds proliquidityhunter.
 *    The rest have old labels and thats OK").
 * A picture not listed here gets the plain "<Product> in NinjaTrader 8." alt.
 */
export const PICTURE_ALTS: Record<string, string> = {
  "DS Bulk Replay Downlaoder.png":
    "DS Bulk Replay Downloader's window in NinjaTrader 8: NQ, ES, MNQ, MES, GC and MGC ticked in the instrument list, a date range from 2026-07-27 to 2026-09-08 with Skip weekends, Skip already-downloaded days and Auto-roll futures contracts on, and each day's replay file listed with its progress: two at 100%, one downloading, one queued and the rest already on disk.",
  "DS Compass.png":
    "DS Compass on a white NinjaTrader chart: the teal Compass line curving up beneath price, tagged \"Compass +3.2 ATR 30176.00\" at the right edge, and its reading panel below: LONG SIDE HOLDS, 75 bars, one side throughout, with its Room, Stretch, Session, Tape and Hold rows.",
  "DS Data Candles.png":
    "DS Data Candles on a white NinjaTrader chart: candles painted teal, cyan, gray, graphite and magenta through a rally and a decline, with a \"3.1x RANGE\" caption under one bar and an \"ABSORBED 2.9x\" caption over a group of bars near the low.",
  "DS ProLiquidityHunter.png":
    "DS ProLiquidityHunter on a white NinjaTrader chart: a liquidity pool at 29215.00 above price with 56% reach odds and +27.75 points to go, a major pool at 29022.75 below with 55% and the H mark beneath it, and the panel underneath reading HUNTING ▲ 29215.00 · 56% with its pool ladder and odds.",
  "DS VWAP Updated.png":
    "DS VWAP on a white NinjaTrader chart: the session VWAP along the lows tagged \"COHERENT ▲ 6 BARS\" and \"VWAP 31364.00\", the 9 and 21 EMAs with the space between them shaded where the trend agrees, and the Upper VWAP 31405.25, EMA 21 31391.00 and Lower VWAP 31322.50 tags at the right edge.",
  "DS Zones Updated.png":
    "DS Zones on a white NinjaTrader chart: supply at 31266.50 (PIVOT, BUY 57%) and 31241.50 (DEFENDED 10×, ABSORBED) above price, demand at 31178.50 (PIVOT), 31146.25 (DEFENDED, BUY 55% BALANCED) and 31118.75 (FRESH, BUY 52% BALANCED) below, each label centred on its zone with a small delta glyph.",
};

/**
 * THE SHARE CARD (2026-10-09). Every product with a cover also has a 1200 x 630
 * card at public/og/<OG_BATCH>/<slug>.png — its cover beside its name,
 * category and price — so a product link shared on TikTok, X, Discord or in a
 * message previews with that product's own chart instead of the one site card.
 * Made by tools/og_cards.py from this file, content/products.ts and
 * content/pricing.ts; re-run it (into a new batch) when a cover, name or price
 * changes. A product without a cover keeps the site card.
 */
export const OG_BATCH = "1026";
export const ogCardFor = (slug: string): string | undefined => (SQUARE_COVERS[slug] ? `/og/${OG_BATCH}/${slug}.png` : undefined);

// A cover for a product that does not exist would never be seen: stop the build.
for (const slug of Object.keys(SQUARE_COVERS)) {
  if (!PRODUCTS.some((p) => p.slug === slug)) throw new Error(`content/covers.ts: "${slug}" is not a product in content/products.ts.`);
}
