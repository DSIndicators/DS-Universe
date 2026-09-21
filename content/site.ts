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
    "DS Universe builds calm, precise trading tools for NinjaTrader 8 — indicators that read the market in plain language, bought once, and free essentials that make the chart easier to live with.",
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
  { label: "Pricing", href: "/pricing" },
  { label: "NinjaTrader", href: "/ninjatrader" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Hero copy. Short on purpose. The offer line under it is computed from
 *  content/pricing.ts (components/HeroOffer.tsx), so it cannot drift. */
export const HERO = {
  eyebrow: "For NinjaTrader 8",
  title: "See the market clearly.",
  sub: "Indicators that put what matters on the chart and leave the rest off — each one bought once, and the essentials free.",
  primary: { label: "Explore the lineup", href: "/products" },
  secondary: { label: "See pricing", href: "/pricing" },
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
    "DS Universe is a family of indicators and tools for NinjaTrader 8, written natively in NinjaScript and drawn directly on your chart. Each indicator answers one question about the market — where a level is holding, where size was hidden, what traded inside the candle, which side the trend is on — and prints the answer in plain trading language.",
    "The Pro Series takes the oscillators every trader already knows and makes them say something about price: levels on the chart, named states, graded signals, decided on closed bars.",
    "Every product is sold on its own, for a single payment, and the chart essentials — the price line, the readout, the level map, the higher-timeframe matrix and the DS Toolkit rail — are free. DS Complete is everything at once, for half of what the paid products cost apart.",
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
    text: "Dark and light themes, one switch per tool on the DS Toolkit rail, and colour only where it carries meaning. The tool should disappear into the chart.",
  },
];

/**
 * The closing ask is the FREE essentials, not the expensive thing. It is the
 * only offer on the page that costs a visitor nothing to accept, and it puts the
 * DS Toolkit rail — the thing every other product appears on — onto their chart.
 */
export const CLOSING = {
  heading: "Start with the free ones.",
  text: "The essentials cost nothing, and they are not a trial. Put the rail and the price line on your chart and see whether the rest is for you — there is a real person on the other end of the email either way.",
  primary: { label: "See the free essentials", href: "/products#essentials" },
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
   * The line that sits ABOVE a demo player. The footer carries the full text on
   * every page and the video opens on the card, but a visitor scrolling past
   * should not have to hunt for either: the guidelines require video "be
   * accompanied by relevant Risk Disclosures", and directly above the thing it
   * refers to is the only placement that is unambiguously accompanying.
   */
  demo:
    "These are screen recordings of the software, not a performance record. Futures trading carries substantial risk of loss and is not suitable for every investor, and hypothetical or simulated results have inherent limitations that may differ materially from live trading.",
  trademark:
    "NinjaTrader® is a registered trademark of NinjaTrader Group, LLC. No NinjaTrader company has any affiliation with the owner, developer, or provider of the products or services described herein, or any interest, ownership or otherwise, in any such product or service, or endorses, recommends or approves any such product or service.",
};

/**
 * The storefront heading, on the home page. No price or count is typed here;
 * the shelves below carry their own numbers from content/pricing.ts.
 */
export const CATALOGUE = {
  eyebrow: "The lineup",
  heading: "Every tool on its own. Bought once.",
  sub: "Each indicator is sold by itself for a single payment, and the chart essentials are free. Open any cover for what it shows, how it helps, and the guide to reading it.",
};

/**
 * The hero screen: six real NQ charts on NinjaTrader's black ground, several DS
 * products on each one (Tom, 2026-09-21: "5 new images in. We will rotate the
 * 6 black screen. Remove the other images."). The seven grey-ground DS
 * Complete shots that rotated here before are retired.
 *
 * Sources — "02 Product Masters\0920 NEW Product Cover & Images\Product
 * Images\Raw", 3840x2160, served at 2560x1440 (q88):
 *   footprints        ← New Homepage Main.png  (Tom: "the first main picture")
 *   pro-series        ← DS_20260921_012913.png
 *   sessions          ← DS_20260921_013448.png
 *   timeframes        ← DS_20260921_013152.png
 *   session-profiles  ← DS_20260921_013601.png
 *   levels            ← DS_20260921_013258.png
 *
 * `tools` is what is ON each picture, attributed from its LABELS, never from a
 * shape: panel titles ("DS ProRSI", "DS ProStochastics", "DS ProMACD",
 * "DS ProSqueeze"); "RSI 62.2"-style levels on price = DS ProRSI; the
 * "NQ · 30m / 1h / 2h / 4h" matrix = DS Parallax; "ICE SUP 5x 47%" = DS
 * Iceberg; "CW 0DTE" / "G-" = DS GEX; volume-by-price rows on candle groups,
 * and the ASIA / LONDON / NEW YORK session profiles = DS Flow (its own product
 * guide 02, "Follow the sessions"). The bands running right on `footprints` and
 * `levels` are DS Zones with its labels switched off — Tom, who made the
 * charts, 2026-09-21: "DS Zones are in the first and last pictures, the labels
 * are OFF". Still NOT attributed, because nothing says whose they are: the
 * small triangles, the "S" swing marks, the candle colouring and the countdown
 * chip.
 *
 * `title` says what the picture SHOWS — no outcome, no forecast, no
 * superlative (NinjaTrader vendor guidelines).
 *
 * ORDER: footprints first (Tom), then the Flow pictures alternate with the
 * others, so the two session views (sessions, session-profiles) never sit
 * together, wrap-around included.
 *
 * `ground` is the charts' own black (#040404, sampled): the screen and the
 * enlarged view are painted with it, so a picture that is still loading, or a
 * letterbox in a window of another shape, is invisible.
 */
export type ScreenFrame = { src: string; title: string; tools: string[]; blur: string };

export const MONITOR: { frames: ScreenFrame[]; ground: string; alt: string } = {
  frames: [
    {
      src: "/covers/screen/footprints.webp",
      title: "Volume by price inside each candle group",
      tools: ["flow", "zones", "prorsi", "prostochastics"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDktgHQEn3pDuxjAH0qWmv0H1p2A//Z",
    },
    {
      src: "/covers/screen/pro-series.webp",
      title: "The four Pro Series panels under one chart",
      tools: ["prorsi", "prostochastics", "promacd", "prosqueeze"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDkvL9waTYeOaU0h7UwP//Z",
    },
    {
      src: "/covers/screen/sessions.webp",
      title: "Asia, London and New York, session by session",
      tools: ["flow", "prorsi", "prostochastics"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDkevVPy4pSMcKMj1Ip69KD0pgf/9k=",
    },
    {
      src: "/covers/screen/timeframes.webp",
      title: "30m, 1h, 2h and 4h beside the chart you trade",
      tools: ["parallax", "prostochastics"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDj8E9RSgAcEEmn+tMP3qYH/9k=",
    },
    {
      src: "/covers/screen/session-profiles.webp",
      title: "Where each session’s volume built up",
      tools: ["flow", "prorsi", "prostochastics"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDk8ycfKMjvgZpGHQgFT3Hap6jl/hpiP//Z",
    },
    {
      src: "/covers/screen/levels.webp",
      title: "Zones, hidden size, dealer levels and RSI levels on one chart",
      tools: ["zones", "iceberg", "gex", "prorsi", "prostochastics"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDkcfWkI5HWpaY33hTA/9k=",
    },
  ],
  ground: "#040404",
  alt: "DS Universe indicators running together on a NinjaTrader 8 chart",
};
