/**
 * Site-wide facts and copy. One file to edit.
 * The catalogue lives next door in content/products.ts.
 *
 * Deliberate omissions: no product counts, no prices, no performance claims.
 */

export const SITE = {
  name: "DS Universe",
  tagline: "Trading tools for NinjaTrader 8",
  url: "https://dsuniverse.net",
  description:
    "DS Universe builds calm, precise trading tools for NinjaTrader 8 — indicators that read the market in plain language, and add-ons that make the platform quicker to live in.",
  email: "support@dsuniverse.net",
  city: "New York City",
  platform: "NinjaTrader 8",
  /**
   * The Whop store root. Per-product buy links live in content/whop.ts — that is
   * what the buy buttons actually use. NOTE (checked 2026-09-09): this root page
   * currently lists no products, so the site-wide "Get access" buttons point at
   * our own /products shelf instead of dropping a buyer on an empty page.
   */
  storeUrl: "https://whop.com/dsuniverse",
};

export const NAV = [
  { label: "Products", href: "/products" },
  { label: "NinjaTrader", href: "/ninjatrader" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Hero copy. Short on purpose. */
export const HERO = {
  eyebrow: "For NinjaTrader 8",
  title: "See the market clearly.",
  sub: "Precision indicators and workflow add-ons that put what matters on the chart — and leave the rest off.",
  primary: { label: "Explore the products", href: "/products" },
  secondary: { label: "Get access", href: "/products" },
};

/** The facts column beside "About". Reference-style metadata. */
export const FACTS = [
  { label: "Platform", value: "NinjaTrader 8" },
  { label: "Markets", value: "Futures first — any instrument NinjaTrader charts" },
  { label: "Timeframes", value: "Any — tick to daily" },
  { label: "Built in", value: "New York City" },
];

export const ABOUT = {
  heading: "Built for the trader who wants less on the screen, and more from it.",
  paragraphs: [
    "DS Universe is a family of indicators and add-ons for NinjaTrader 8, written natively in NinjaScript and drawn directly on your chart. Each indicator answers one question about the market — who is in control, where the market actually did business, whether a move is loading — and prints the answer in plain trading language.",
    "The add-ons live on the platform rather than the chart: a screening dashboard, a market-watch panel, one-click timeframes, and a single rail that turns any DS indicator on or off and keeps your drawing tools beside it.",
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
    text: "Dark and light themes, one switch per tool, and nothing that flashes for attention. The tool should disappear into the chart.",
  },
];

export const CLOSING = {
  heading: "See it on your own chart.",
  text: "Every product comes with a plain-English guide and a real person on the other end of the email.",
  primary: { label: "Get access", href: "/products" },
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
  long: "Nothing on this site presents a performance record; no win rate, return or account figure is published anywhere on it. Past behaviour of any analytical method does not guarantee future outcomes. DS Universe is not a broker-dealer, an introducing broker, or a registered investment adviser, and does not manage accounts or place trades on anyone's behalf.",
  risk: "Futures and forex trading contains substantial risk and is not for every investor. An investor could potentially lose all or more than the initial investment. Risk capital is money that can be lost without jeopardizing ones' financial security or life style. Only risk capital should be used for trading and only those with sufficient risk capital should consider trading. Past performance is not necessarily indicative of future results.",
  hypothetical:
    "Hypothetical performance results have many inherent limitations, some of which are described below. No representation is being made that any account will or is likely to achieve profits or losses similar to those shown; in fact, there are frequently sharp differences between hypothetical performance results and the actual results subsequently achieved by any particular trading program. One of the limitations of hypothetical performance results is that they are generally prepared with the benefit of hindsight. In addition, hypothetical trading does not involve financial risk, and no hypothetical trading record can completely account for the impact of financial risk of actual trading. For example, the ability to withstand losses or to adhere to a particular trading program in spite of trading losses are material points which can also adversely affect actual trading results. There are numerous other factors related to the markets in general or to the implementation of any specific trading program which cannot be fully accounted for in the preparation of hypothetical performance results and all which can adversely affect trading results.",
  trademark:
    "NinjaTrader® is a registered trademark of NinjaTrader Group, LLC. No NinjaTrader company has any affiliation with the owner, developer, or provider of the products or services described herein, or any interest, ownership or otherwise, in any such product or service, or endorses, recommends or approves any such product or service.",
};

/** Home-page catalogue copy. Every product is listed there (quiet rows, no counts). */
export const CATALOGUE = {
  eyebrow: "The products",
  heading: "Built to work together, or alone.",
  sub: "Indicators are drawn on the chart. Add-ons live on the platform. Open any of them for what it shows and how it helps.",
};

/** The hero monitor. Point `src` at a chart still (16:9) or an .mp4 recording. */
export const MONITOR = {
  kind: "image" as "image" | "video",
  src: "/covers/hero-suite.webp",
  poster: "/covers/hero-suite.webp",
  alt: "DS Universe indicators working together on a NinjaTrader 8 chart",
};
