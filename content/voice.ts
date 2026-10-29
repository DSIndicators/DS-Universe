/**
 * THE WHITE SITE'S VOICE (Tom, 2026-10-26 late night): "Our trading style is to
 * use order flow to help identify high probability price zones for reversions
 * and continuations. Stacking confluences one after another to help build a
 * traders confidence. Previous reaction at a price point > trend aligned >
 * high volume compared to the norm ... they should know that when they enter
 * our site ... talking to the traders heart for heart."
 *
 * CHECKED AGAINST THE PRODUCTS (content/products.ts, generated from the
 * Master sheet, which is written from the shipped code), every confluence is a
 * product that exists, and every sentence below says only what that product's
 * own listing says:
 *   location       DS Zones (FRESH > TESTING > DEFENDED / BREAKING, order flow
 *                  inside each zone), DS Iceberg (heavy volume traded in, price
 *                  rejected anyway), DS Session Levels (each session's high and
 *                  low, carried forward), DS ASL (adds each session's POC)
 *   direction      DS ProTrendRange (trend, pullback, range on one scale; the
 *                  RESUME on the bar the pullback ends), DS VWAP (colored only
 *                  while trend and value agree), DS Compass (which side holds;
 *                  changes hands only on a decisive close) — v3.1, 2026-10-29
 *   participation  DS Volume (each bar against the same minutes of the previous
 *                  20 sessions), DS Flow (buy and sell volume at every price
 *                  inside the candles), DS Data Candles (the fill shows whether
 *                  volume stood behind the move) — v3.1
 *
 * WORDING RULE. NinjaTrader's vendor guidelines ask vendors to "refrain from
 * large claims of success that cannot be verified" and say "performance claims
 * are highly monitored". So no "high probability", "predictive", "accurate" or
 * win language: the site sells EVIDENCE and CLARITY, which every product does
 * deliver, and leaves the outcome to the trader, which is also what earns trust.
 *
 * New words for the white site, not yet on the live site or in the Master
 * sheet: when Tom approves them, they go to the sheet first (fix the source).
 */
export const HERO_W = {
  title: "Multiple confluences, stacked.",
  titleTail: "Confidence in every trade.",
  /** The kicker above the headline (Tom, 2026-10-26: "Home of optimized FREE Indicators"); links to the Free Vault. */
  kicker: "Home of optimized free indicators",
  sub: "Where price reacted before. Whether the trend is with you. Whether the volume is real. DS Universe reads the order flow inside every candle and stacks those answers at the zones where price turns or carries on, so when you take a trade, you know every reason you took it.",
} as const;

export type Confluence = { n: string; kicker: string; q: string; text: string; slugs: string[] };

export const STACK = {
  label: "How we read a trade",
  title: "Three confluences. One zone.",
  lead: "Hesitation comes from not knowing why. A level taken on faith, a trend fought without noticing, a move chased that nobody else was trading. Every DS tool answers one question on your chart, in plain words, so before you click you can count your reasons.",
  items: [
    {
      n: "01",
      kicker: "Location",
      q: "Has price reacted here before?",
      text: "A level earns its place by being defended. DS Zones follows each zone from fresh to tested to defended or broken, reading the order flow inside it. DS Iceberg marks the prices where heavy volume kept trading in and price was turned away anyway. DS Session Levels carries every session's high and low into today, and DS ASL adds the price each session traded most.",
      slugs: ["zones", "iceberg", "session-levels", "asl"],
    },
    {
      n: "02",
      kicker: "Direction",
      q: "Is the trend behind it?",
      text: "A reversion against a strong trend and a pullback inside one are different trades. DS ProTrendRange shows trend, pullback and range on one scale and marks the bar a pullback ends. DS VWAP takes the trend's color only while the trend and value agree. DS Compass shows which side of the market holds, with a line that changes hands only on a decisive close.",
      slugs: ["protrendrange", "vwap", "compass"],
    },
    {
      n: "03",
      kicker: "Participation",
      q: "Is the volume real?",
      text: "Six hundred contracts is quiet at the open and an eruption in the evening. DS Volume weighs every bar against the same minutes of the last 20 sessions. DS Flow splits the volume inside each candle into buying and selling at every price, so you can see who was pressing when price arrived. DS Data Candles shows in each candle's fill whether volume stood behind its move.",
      slugs: ["volume", "flow", "data-candles"],
    },
  ] satisfies Confluence[],
  close: "One reason is an opinion. Three at the same price is a plan.",
  honest: "No tool can tell you what price will do next. What DS Universe gives you is the evidence, drawn where you trade, so the decision stays yours, and stays clear.",
} as const;

export const READS_LEAD =
  "Each capability below is one kind of evidence DS Universe puts on your chart: what it reads, the products that read it, and how it looks on a live NinjaTrader chart.";

/** The bar over the two doors on the home page. */
export const DOORS = {
  title: "Where to start",
  sub: "Every paid tool in DS Complete, at one low price, and the free tools, each its own download.",
} as const;

/**
 * THE FREE VAULT'S CHARTER (2026-10-26, Tom: "THE #1 SPOT FOR OPTIMIZED FREE
 * INDICATORS. OUR TEAM IS FOCUSED MORE ON PROVIDING FREE INDICATORS RATHER THAN
 * COMPANY GAINS. WE MAKE MAJORITY OF OUR MONEY TRADING. THESE FREE INDICATORS
 * COME AT ABSOLUTELY NO COST", set above the vault's title).
 *
 * Kept inside NinjaTrader's vendor rules and the site's own disclosures:
 *  - "#1" is a ranking nobody can verify -> "The home of".
 *  - "we make most of our money trading" reads as a trading-results claim,
 *    and the footer says no performance record is published anywhere ->
 *    "We are traders first" (true, and says the same thing about us).
 *  - "more free than paid" is not true today (9 free, 13 in DS Complete), so
 *    the count is COMPUTED from the catalogue and stated exactly.
 */
export const VAULT_CHARTER = {
  label: "Why it is free",
  title: "The home of optimized free indicators for NinjaTrader 8.",
  text: (free: number, all: number) =>
    `We are traders first. DS Universe began as the tools we built for our own charts, and we would rather more traders read the market clearly than sell every tool we make. So ${free} of our ${all} tools are free to everyone, and they always will be.`,
  figCap: "free tools, at no cost, permanently",
};

/**
 * WHAT'S NEW IN v3.1 (2026-10-29) — the approved short block from the
 * hand-off's "Website copy v3.1.md", on the home page. `slugs` are the two new
 * products, shown with their own pictures.
 */
export const WHATS_NEW = {
  title: "New in v3.1",
  lead: "DS Universe v3.1 brings the whole suite onto one look, one license and one low price.",
  points: [
    "Every paid tool is in DS Complete at the founders price.",
    "DS Compass and DS Data Candles join the lineup.",
    "Every label reads the same way and keeps out of the others' way.",
    "DS GEX gives every chart the same twice-a-day map, built from the last session close.",
    "The Free Vault stays free.",
  ],
  slugs: ["compass", "data-candles"],
} as const;
