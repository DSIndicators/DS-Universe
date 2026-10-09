import { PRODUCTS } from "@/content/products";

/**
 * THE PRODUCT COVER — ONE SIZE, ONE VISION (Tom, 2026-10-08: "My goal is to
 * have 1 coherent size and vision").
 *
 * Every product in the marketplace is shown by one SQUARE picture: Tom's own
 * NinjaTrader 8 chart, cropped square to the move the indicator is about,
 * with his hand-drawn marks on it, shown on the site's dark plate (below). The cards in the Free
 * Vault, the store, the home page and the "more" row on every product page
 * all draw the cover from here (components/CoverArt.tsx), so a cover added
 * here appears everywhere at once.
 *
 * Masters: DS Media\DS Product Image Covers On Web\<Product name>.png
 * (1080 x 1080, shot on the light template, never edited).
 *
 * THE DARK PLATE (Tom chose version B, 2026-10-09). The light chart ground is
 * lifted out of each master and replaced with the plate #0E1116: house colours
 * keep their hue, translucent zone fills stay translucent, dark text and black
 * chalk turn light, light-tint chalk stays bright. Nothing on the chart is
 * moved or added. B adds a hairline inner frame, gold corner marks and a soft
 * edge falloff. The served files come from
 * DS Product Image Covers On Web\Dark Plate Concepts 2026-10-09\B - Plate + Frame
 * (batch 1009b). A NEW cover shot on the light template needs the same
 * treatment before it goes in, or it will be the one grey tile on the shelf. The site serves a webp copy at
 * public/covers/sq/<batch>/<slug>.webp — a cover that is re-shot gets a NEW
 * batch folder (the site's assets are cached for a year under one name).
 *
 * UNTIL A PRODUCT HAS ITS COVER, its card shows a square cut of the chart it
 * already has (content/loupe.ts), centred on the place that picture was
 * measured on — the same square frame, no magnification and no labels, so
 * the grid keeps one size while the covers are being shot.
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
  /* ------------------------------------------ 2026-10-09, the full shoot
     Masters in DS Media\DS Product Image Covers On Web (two are named
     without spaces there: "DS AdaptivePriceLine.png", "DS SessionLevels.png"). */
  zones: {
    src: "/covers/sq/1009b/zones.webp",
    w: 1080,
    h: 1080,
    alt: "DS Zones on a dark NinjaTrader chart: supply at 29289.00 APPROACHING, supply at 29271.75 BREAKING and demand at 29257.75 DEFENDED, each with its volume profile and label at the right edge; hand-drawn arrows mark the turn off demand.",
  },
  iceberg: {
    src: "/covers/sq/1009b/iceberg.webp",
    w: 1080,
    h: 1080,
    alt: "DS Iceberg on a dark NinjaTrader chart: an ICE OFFER at 30069.75 above the range and an ICE BID below it, with price rejected at each; hand-drawn arrows mark the repeated tests.",
  },
  oracle: {
    src: "/covers/sq/1009b/oracle.webp",
    w: 1080,
    h: 1080,
    alt: "DS Oracle on a dark NinjaTrader chart: the Neural Line curving under price as the trend turns up, the trailing line and the Spectrum-colored candles; hand-drawn arrows follow the turn.",
  },
  gex: {
    src: "/covers/sq/1009b/gex.webp",
    w: 1080,
    h: 1080,
    alt: "DS GEX on a dark NinjaTrader chart: price turning at the PW 0DTE level 29200.16, the EM Low 29173.24 and the Gamma Flip 29142.95, each label circled by hand.",
  },
  flow: {
    src: "/covers/sq/1009b/flow.webp",
    w: 1080,
    h: 1080,
    alt: "DS Flow on a dark NinjaTrader chart: buy and sell volume at every price, drawn as profiles along a rally from its base; hand-drawn arrows trace the move.",
  },
  proliquidityhunter: {
    src: "/covers/sq/1009b/proliquidityhunter.webp",
    w: 1080,
    h: 1080,
    alt: "DS ProLiquidityHunter on a dark NinjaTrader chart: price sweeping two resting pools and turning, with the liquidity map panel below; the sweeps are circled and marked by hand.",
  },
  proheikinashi: {
    src: "/covers/sq/1009b/proheikinashi.webp",
    w: 1080,
    h: 1080,
    alt: "DS ProHeikinAshi on a dark NinjaTrader chart: an uptrend with its FLIP levels at the right edge and the Heikin-Ashi panel below, where FLIP 29066.75 with its odds is circled by hand.",
  },
  "adaptive-priceline": {
    src: "/covers/sq/1009b/adaptive-priceline.webp",
    w: 1080,
    h: 1080,
    alt: "DS Adaptive Price Line on a dark NinjaTrader chart: the line from the live candle to the price axis, with its countdown tag on it, circled by hand.",
  },
  "chart-price": {
    src: "/covers/sq/1009b/chart-price.webp",
    w: 1080,
    h: 1080,
    alt: "DS Chart Price on a dark NinjaTrader chart: the last price, 29518.75, in large red digits at the top of the chart, between two hand-drawn arrows.",
  },
  "ds-258": {
    src: "/covers/sq/1009b/ds-258.webp",
    w: 1080,
    h: 1080,
    alt: "DS 258 on a dark NinjaTrader chart: price moving between the 00, 20, 50 and 80 levels, each in its own color; a hand-drawn arrow marks the bounce off a level.",
  },
  parallax: {
    src: "/covers/sq/1009b/parallax.webp",
    w: 1080,
    h: 1080,
    alt: "DS Parallax on a dark NinjaTrader chart: price above, and four higher-timeframe mini charts along the bottom of the panel; a hand-drawn arrow points to them.",
  },
  "session-levels": {
    src: "/covers/sq/1009b/session-levels.webp",
    w: 1080,
    h: 1080,
    alt: "DS Session Levels on a dark NinjaTrader chart: the Asia, London and New York highs and lows carried forward across the day; hand-drawn arrows mark the reactions at them.",
  },
  stochastics: {
    src: "/covers/sq/1009b/stochastics.webp",
    w: 1080,
    h: 1080,
    alt: "DS Stochastics on a dark NinjaTrader chart: the four stochastic lanes in one panel under price, with the low and the high of the move circled by hand.",
  },
  squeeze: {
    src: "/covers/sq/1009b/squeeze.webp",
    w: 1080,
    h: 1080,
    alt: "DS Squeeze on a dark NinjaTrader chart: a quiet compression and then the fire upward, the squeeze panel below; hand-drawn arrows mark the base and the move.",
  },
  macd: {
    src: "/covers/sq/1009b/macd.webp",
    w: 1080,
    h: 1080,
    alt: "DS MACD on a dark NinjaTrader chart: a divergence line along the lows, the panel confirming it, and the rally that followed; the confirmation is circled by hand.",
  },
  asl: {
    src: "/covers/sq/1009b/asl.webp",
    w: 1080,
    h: 1080,
    alt: "DS ASL on a dark NinjaTrader chart: the Asia, London and New York sessions, each with its volume profile, high, low and POC carried forward as levels; hand-drawn arrows mark the reactions.",
  },
  "bulk-replay-downloader": {
    src: "/covers/sq/1009b/bulk-replay-downloader.webp",
    w: 1080,
    h: 1080,
    alt: "DS Bulk Replay Downloader in NinjaTrader 8: six futures instruments selected, a date range, and the per-file list showing finished, existing, downloading and queued Market Replay days.",
  },
  toolkit: {
    src: "/covers/sq/1009b/toolkit.webp",
    w: 1080,
    h: 1080,
    alt: "DS Toolkit on a dark NinjaTrader chart: the DS rail with a switch for each indicator, the drawing tools and DS Chalk, with Toolkit, Chalk and NinjaTrader 8 written on the chart in chalk.",
  },

  /* ------------------------------------------- 2026-10-08, first three */
  vwap: {
    src: "/covers/sq/1009b/vwap.webp",
    w: 1080,
    h: 1080,
    alt: "DS VWAP on a dark NinjaTrader chart: a session falling away from its high, with the VWAP panel's value bands and the reach odds at its right edge below; the move is traced by a hand-drawn arrow.",
  },
  prorsi: {
    src: "/covers/sq/1009b/prorsi.webp",
    w: 1080,
    h: 1080,
    alt: "DS ProRSI on a dark NinjaTrader chart: RSI 92, RSI 87 and RSI 15 zones on price and the RSI panel below; the RSI cross and the candle it came on are circled by hand, with an arrow along the move that followed.",
  },
  protrendrange: {
    src: "/covers/sq/1009b/protrendrange.webp",
    w: 1080,
    h: 1080,
    alt: "DS ProTrendRange on a dark NinjaTrader chart: an uptrend with the indicator's marks under two pullbacks and its trend panel below; a hand-drawn arrow follows the trend.",
  },
};

export const squareCoverFor = (slug: string): Cover | undefined => SQUARE_COVERS[slug];

/**
 * THE SHARE CARD (2026-10-09). Every product with a cover also has a 1200 x 630
 * card at public/og/<OG_BATCH>/<slug>.png — its cover beside its name,
 * category and price — so a product link shared on TikTok, X, Discord or in a
 * message previews with that product's own chart instead of the one site card.
 * Made by tools/og_cards.py from this file, content/products.ts and
 * content/pricing.ts; re-run it (into a new batch) when a cover, name or price
 * changes. A product without a cover keeps the site card.
 */
export const OG_BATCH = "1009b";
export const ogCardFor = (slug: string): string | undefined => (SQUARE_COVERS[slug] ? `/og/${OG_BATCH}/${slug}.png` : undefined);

// A cover for a product that does not exist would never be seen: stop the build.
for (const slug of Object.keys(SQUARE_COVERS)) {
  if (!PRODUCTS.some((p) => p.slug === slug)) throw new Error(`content/covers.ts: "${slug}" is not a product in content/products.ts.`);
}
