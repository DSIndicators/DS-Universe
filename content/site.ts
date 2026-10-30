import { COMPLETE } from "./pricing";

/**
 * Site-wide facts and copy. One file to edit.
 * The catalogue lives next door in content/products.ts.
 *
 * Deliberate omissions: no product counts, no typed prices, no performance claims.
 * Every number the site renders comes from content/pricing.ts instead.
 */

export const SITE = {
  name: "DS Universe",
  tagline: "Trading tools for NinjaTrader 8",
  url: "https://dsuniverse.net",
  description:
    "Free and affordable order-flow indicators for NinjaTrader 8 — where the volume traded, which side was pressing and which levels held, drawn in plain trading language. A Free Vault of free tools, and every paid tool in one low-priced bundle, DS Complete.",
  email: "support@dsuniverse.net",
  city: "New York City",
  platform: "NinjaTrader 8",
  /** The oldest build the shipped archives import into — they are exported
      from 8.1.8.1 (Info.xml of every archive, checked 2026-09-25). */
  minBuild: "8.1.8.1",
  /**
   * The Whop store root. Per-product buy links live in content/whop.ts — that is
   * what the buy buttons actually use. NOTE (checked 2026-09-09): this root page
   * currently lists no products, so the site-wide "Get access" buttons point at
   * our own /products shelf instead of dropping a buyer on an empty page.
   */
  storeUrl: "https://whop.com/dsuniverse",
};

/**
 * `vault` marks the Free Vault's entry (Tom, 2026-10-05: "a tab users can see
 * instantly and be intrigued to go to"). The header, the phone menu and the
 * footer set it in the vault's own voice — the instrument face, in the house
 * teal that already means "free, on your chart" on this site, behind the
 * vault's small mark (components/Vault.tsx) — so it reads as a different
 * place from the store at a glance. Type and one accent; no pill, no glow.
 */
export type NavItem = { label: string; href: string; vault?: boolean };
export const NAV: NavItem[] = [
  // Home first (Tom, 2026-09-27). One store page since 2026-09-27: /pricing
  // redirects to /products?view=list.
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Free Vault", href: "/free-vault", vault: true },
  { label: "NinjaTrader", href: "/ninjatrader" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Hero copy. Short on purpose, and NO PRICES (Tom, 2026-09-21) — the numbers
 *  live on the shelves, the DS Complete band and the product pages. */
/**
 * THE HERO (rewritten 2026-10-14, Tom: "This homepage hero is weak ... Majority
 * of our indicators is orderflow"). The lineup's centre of gravity is what
 * TRADED, not where price went: DS Flow (buy/sell volume at each price inside
 * the candles), DS Iceberg (absorption, read with the live bid/ask), DS Zones
 * (the order flow inside each level), DS ASL (each session's volume profile and
 * POC), DS ProRSI (an RSI weighed by volume). So the headline goes inside the
 * candle, and the sub names the three things a trader asks of order flow —
 * where it traded, who pressed, what held — in plain words. The eyebrow names
 * the core honestly; GEX, the trend panels and the Free Vault sit around it.
 * Vendor rules hold: no forecast, no result, no superlative. The last word of
 * the title is the one set in .fluoro (app/page.tsx splits at the last space).
 */
export const HERO = {
  eyebrow: "Order flow for NinjaTrader 8",
  title: "See inside every candle.",
  sub: "Where the volume traded, which side was pressing, and which levels absorbed size and held — drawn on your chart in plain trading language. Every paid tool in DS Complete; the Free Vault costs nothing.",
  primary: { label: "Explore the lineup", href: "/products" },
  secondary: { label: "See prices", href: "/products?view=list" },
};

/** The facts column beside "About". Reference-style metadata. */
export const FACTS = [
  { label: "Platform", value: "NinjaTrader 8" },
  // 2026-10-01: was "any instrument NinjaTrader charts", which is not true of
  // every product (DS GEX, and the tools that read traded volume). The exact
  // answer is per product: content/markets.ts.
  { label: "Markets", value: "Futures first — every product page lists its markets" },
  { label: "Timeframes", value: "Any — tick to daily" },
  { label: "Built in", value: "New York City" },
];

export const ABOUT = {
  heading: "Built for the trader who wants less on the screen, and more from it.",
  paragraphs: [
    "DS Universe is a family of indicators and tools for NinjaTrader 8, written natively in NinjaScript and drawn directly on your chart. Each indicator answers one question about the market — where a level is holding, where size was hidden, what traded inside the candle, which side the trend is on — and prints the answer in plain trading language.",
    "The panel tools put one panel under your candles and make it say something about price: levels on the chart, named states and measured odds, decided on closed bars.",
    "DS Universe is free and affordable. Every paid tool comes in one low-priced bundle, DS Complete, on one license, and founders get every future indicator and update with it. The Free Vault stands apart — the price line, the price readout, the level map, the higher-timeframe matrix, the session levels, the VWAP on your chart, volume read against the clock, a live chart background and one-click timeframe buttons — each its own free download.",
    "Everything runs on your machine, on your data, on the platform's supported public API. Nothing is hidden behind a second window.",
  ],
};

/** Three quiet principles. Every statement here must be true of the whole lineup. */
export const PRINCIPLES = [
  {
    title: "Native to the platform",
    text: "Written in NinjaScript for NinjaTrader 8 and installed like any other indicator. No bridges, no extra software.",
  },
  {
    title: "Readable at a glance",
    text: "Verdicts, levels and states are named on the chart in plain language — so the read is instant and the chart stays clean.",
  },
  {
    title: "Quiet by design",
    text: "One house palette across every tool, one switch per tool on the DS Toolkit rail, and color only where it carries meaning. The tool should disappear into the chart.",
  },
];

/**
 * The closing ask is the FREE VAULT, not the expensive thing. It is the only
 * offer on the page that costs a visitor nothing to accept. (It named the DS
 * Toolkit rail until 2026-10-05; the rail comes free with DS Complete now and
 * is not in the vault, so the line names two things that are.)
 */
export const CLOSING = {
  heading: "Start with the free ones.",
  text: "The Free Vault costs nothing, and it is not a trial. Put the price line and the session levels on your chart and see whether the rest is for you — there is a real person on the other end of the email either way.",
  primary: { label: "Open the Free Vault", href: "/free-vault" },
  secondary: { label: "Talk to us", href: "/contact" },
};

/**
 * Disclosures. The footer renders every one of these on every page.
 * `risk`, `hypothetical` and `trademark` are VERBATIM from the NinjaTrader
 * Vendor Professional and Compliance Guidelines (rev 2.11.2025) — required in
 * the footer of every page, in visible body-style text. Do not reword them.
 */
export const DISCLOSURE = {
  short:
    "DS Universe tools are charting and research software for educational and informational purposes. They are not investment advice and no output is a forecast or a guarantee of any result. Trading futures and other leveraged instruments carries substantial risk of loss and is not suitable for every investor.",
  long: "Nothing on this site presents a performance record; no win rate, return or account figure is published anywhere on it. Past behavior of any analytical method does not guarantee future outcomes. DS Universe is not a broker-dealer, an introducing broker, or a registered investment adviser, and does not manage accounts or place trades on anyone's behalf.",
  risk: "Futures and forex trading contains substantial risk and is not for every investor. An investor could potentially lose all or more than the initial investment. Risk capital is money that can be lost without jeopardizing ones' financial security or life style. Only risk capital should be used for trading and only those with sufficient risk capital should consider trading. Past performance is not necessarily indicative of future results.",
  hypothetical:
    "Hypothetical performance results have many inherent limitations, some of which are described below. No representation is being made that any account will or is likely to achieve profits or losses similar to those shown; in fact, there are frequently sharp differences between hypothetical performance results and the actual results subsequently achieved by any particular trading program. One of the limitations of hypothetical performance results is that they are generally prepared with the benefit of hindsight. In addition, hypothetical trading does not involve financial risk, and no hypothetical trading record can completely account for the impact of financial risk of actual trading. For example, the ability to withstand losses or to adhere to a particular trading program in spite of trading losses are material points which can also adversely affect actual trading results. There are numerous other factors related to the markets in general or to the implementation of any specific trading program which cannot be fully accounted for in the preparation of hypothetical performance results and all which can adversely affect trading results.",
  /**
   * The line that travels WITH a chart picture, wherever the footer cannot be
   * seen from it — under the storefront picture row, and inside the lightbox,
   * where a modal in the top layer hides the whole page behind it.
   *
   * The vendor guidelines (rev 2.11.2025, p.2) forbid "video content or chart
   * images without being accompanied by relevant Risk Disclosures and
   * Hypothetical Performance Disclosures". The footer carries both in full on
   * every page; this is the same warning within sight of the picture, in body
   * text, and it links to the full text on /disclosures.
   */
  chart:
    "Chart pictures are illustrations of the software, not a performance record. Futures trading carries substantial risk of loss and is not suitable for every investor, and hypothetical or simulated results have inherent limitations that may differ materially from live trading.",
  /**
   * The line under the HOME hero, which now holds a screen recording AND still
   * chart pictures on one rotation (2026-09-23). `short` alone no longer covers
   * it: the guidelines (rev 2.11.2025, p.2) require "video content or chart
   * images" to be accompanied by Risk AND Hypothetical Performance Disclosures,
   * and a market replay is simulated by definition. One paragraph, three
   * sentences, in body text — recording and pictures first, then what the
   * software is and is not, then the risk. The footer still carries both
   * verbatim texts in full on every page.
   */
  screen:
    "The charts above are a screen recording and pictures of the software, not a performance record; hypothetical and simulated results have inherent limitations that may differ materially from live trading. DS Universe tools are charting and research software — not investment advice, and no output is a forecast or a guarantee of any result. Trading futures and other leveraged instruments carries substantial risk of loss and is not suitable for every investor.",
  /**
   * The line that sits ABOVE a demo player. The footer carries the full text on
   * every page and the video opens on the card, but a visitor scrolling past
   * should not have to hunt for either: the guidelines require video "be
   * accompanied by relevant Risk Disclosures", and directly above the thing it
   * refers to is the only placement that is unambiguously accompanying.
   */
  demo:
    "These are screen recordings of the software, not a performance record. Futures trading carries substantial risk of loss and is not suitable for every investor, and hypothetical or simulated results have inherent limitations that may differ materially from live trading.",
  /**
   * The line under a product page's first gallery when it leads with a
   * showcase recording (2026-09-28). The same two disclosures as `chart`, with
   * the recording named — the guidelines (rev 2.11.2025, p.2) cover "video
   * content or chart images", and this sits directly under both.
   */
  showcase:
    "The recording and chart pictures above show the software running; they are not a performance record. Futures trading carries substantial risk of loss and is not suitable for every investor, and hypothetical or simulated results have inherent limitations that may differ materially from live trading.",
  /**
   * Under DS Replay (2026-10-09, v4): what the visitor is driving, and the two
   * disclosures the vendor guidelines require beside any chart in motion. The
   * examples are composed scenarios (tools/showcase/design.ts): the pattern is
   * written for the example, every candle is a recorded one; the line says so.
   */
  replay:
    "DS Replay examples are illustrative: each scenario is composed for the example from recorded one-minute futures candles, to show the conditions a tool is built for, and is not a recording of a trading session. The tool drawing on it runs its shipped rules unchanged. They show how the software reads price; they are not a performance record, no trade is taken or shown, and live markets often behave differently. Futures trading carries substantial risk of loss and is not suitable for every investor, and hypothetical or simulated results have inherent limitations that may differ materially from live trading.",
  trademark:
    "NinjaTrader® is a registered trademark of NinjaTrader Group, LLC. No NinjaTrader company has any affiliation with the owner, developer, or provider of the products or services described herein, or any interest, ownership or otherwise, in any such product or service, or endorses, recommends or approves any such product or service.",
};

/**
 * The storefront heading, on the home page. No price or count is typed here;
 * the shelves below carry their own numbers from content/pricing.ts.
 */
export const CATALOGUE = {
  eyebrow: "The lineup",
  heading: "Every paid tool, one low price.",
  sub: `DS Complete holds every paid DS Universe tool on one license, at the founders price, with a ${COMPLETE.trialDays}-day free trial first. Open any cover for what it shows and how it helps.`,
};

/* The live site's hero screen (MONITOR), its products screen and the
   "Powered by traders" lock-up were never used on the white site and were
   removed with v3.1 (2026-10-29); DS-Universe-3 content/site.ts keeps them. */
