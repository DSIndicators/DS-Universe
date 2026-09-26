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
  /** The oldest build the shipped archives import into — they are exported
      from 8.1.8.1 (Info.xml of all sixteen, checked 2026-09-25). */
  minBuild: "8.1.8.1",
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

/** Hero copy. Short on purpose, and NO PRICES (Tom, 2026-09-21) — the numbers
 *  live on the shelves, the DS Complete band, the product pages and /pricing. */
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
 * The hero screen: one screen recording and five real NQ charts on
 * NinjaTrader's black ground, several DS products on each one (Tom, 2026-09-21:
 * "5 new images in. We will rotate the 6 black screen. Remove the other
 * images."; 2026-09-23: "remove the attached picture from the homepage and add
 * a video instead... Video first, played in full ( users can swipe to skip to
 * next) then our 5 pictures"). The picture he took out is the four-Pro-Series
 * one; its file stays on disk at public/covers/screen/pro-series.webp, and the
 * Pro Series panels are still shown on their own product pages.
 *
 * THE CLIP — source "New Raw Images\15 New Homepage 2.mp4": 7680x3880 HEVC,
 * 60fps, 15.0s, with an audio track. It is PADDED to 16:9, never cropped. The
 * source is 1.979:1 and the screen is a 16:9 stage with `object-cover`, so
 * covering would have trimmed 5.1% off EACH side — and on this recording that
 * is exactly where the "DS ProRSI" and "DS ProStochastics" panel titles (left)
 * and the price axis (right) live. Padding costs nothing instead: the frame's
 * own outer rows measure 0,0,0, so 220 rows of black top and bottom disappear
 * into the chart. Verified on the encoded file — rows 0-54 and 1025-1079 are
 * black, row 56 carries content, 1920x1080 = 1.7778 exactly.
 *   ffmpeg -i "15 New Homepage 2.mp4" -an \
 *     -vf "pad=iw:ceil(iw*9/16/2)*2:0:(oh-ih)/2:color=black,
 *          scale=1920:1080:flags=lanczos,fps=30,format=yuv420p" \
 *     -c:v libx264 -profile:v high -preset medium -crf 23 -g 60 \
 *     -movflags +faststart  →  replay.mp4              2.79 MB
 *   same, scale=1280:720 -crf 26 -level 3.1  →  replay-sm.mp4    1.15 MB
 *   -frames:v 1 -c:v libwebp -quality 88     →  replay-poster.webp (frame 0)
 * Silent (-an): browsers only autoplay muted video, and every other DS
 * recording on the site is silent too.
 *
 * Sources for the PICTURES — "02 Product Masters\0920 NEW Product Cover &
 * Images\Product Images\Raw", 3840x2160, served at 2560x1440 (q88):
 *   footprints-v2     ← Homepage main img 2.png  (Tom, 2026-09-23: "Replace this
 *                       picture ( first img after video ) with attached
 *                       picture"). It replaces New Homepage Main.png, which had
 *                       been the first picture since 09-21 and is still on disk
 *                       as footprints.webp. NEW FILENAME on purpose: the old one
 *                       has been served with a one-year immutable cache since
 *                       09-21, so reusing the name would have shown the old
 *                       picture to everyone who has already seen the hero.
 *                       `tools` lost DS Zones with it — the orange and teal
 *                       BANDS that were Zones with its labels off are on the
 *                       old picture, not this one. The dashed boxes on both are
 *                       still unattributed.
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
 * guide 02, "Follow the sessions"). The bands running right on the RETIRED
 * `footprints` and on `levels` are DS Zones with its labels switched off — Tom,
 * who made the charts, 2026-09-21: "DS Zones are in the first and last
 * pictures, the labels are OFF". `footprints-v2`, which replaced the first of
 * those on 09-23, has no such bands, so it does not claim DS Zones. Still NOT
 * attributed, because nothing says whose they are: the
 * small triangles, the "S" swing marks, the candle colouring and the countdown
 * chip.
 *
 * On the CLIP the same rule is applied more strictly, because its data-series
 * header lists everything LOADED on Tom's chart — "DS 258, DS Zones, DS
 * Iceberg, DS Gex, DS Flow, DS Chart Price, DS Adaptive Price Line, DS Oracle",
 * plus the DS ProRSI and DS ProStochastics panels — and loaded is not drawn.
 * `tools` names only the three whose own marks are visible in the recording:
 * the DS ProRSI panel and its "RSI 50.9 / RSI 50.5 x2 / RSI 52.7" tags on
 * price, the DS ProStochastics panel ("STOCH 21 ▲ PRIME ROTATION", "DIV ▲"),
 * and DS Flow's volume-by-price rows inside the candle groups. A visitor who
 * reads a name under the screen goes looking for its mark on the screen.
 *
 * `title` says what the picture SHOWS — no outcome, no forecast, no
 * superlative (NinjaTrader vendor guidelines).
 *
 * ORDER: the clip first, then footprints, then the pictures in the order they
 * already had (both firsts are Tom's). Taking pro-series out did put two Flow
 * pictures side by side — footprints, then sessions — where they used to
 * alternate. Left that way on purpose: the constraint the alternation rule
 * exists to serve is that the two SESSION views never sit together, and they
 * still do not (timeframes separates sessions from session-profiles, and the
 * clip separates levels from footprints around the wrap). Footprints (volume
 * inside each candle group) and sessions (the three session profiles) do not
 * read as the same screenshot twice.
 *
 * `ground` is the charts' own black (#040404, sampled): the screen and the
 * enlarged view are painted with it, so a picture that is still loading, or a
 * letterbox in a window of another shape, is invisible.
 */
/**
 * A frame on the hero screen. Two kinds share one rotation since 2026-09-23:
 *
 *  · a STILL — a 2560x1440 chart picture, which is what every frame was before;
 *  · the CLIP — Tom's 15s screen recording, first in the rotation, played IN
 *    FULL before the pictures start ("Video first, played in full — users can
 *    swipe to skip to next"). Once it has finished ONCE the rotation wraps to
 *    the first PICTURE and never back to the clip, so someone reading the page
 *    is not interrupted by the recording every lap ("Video once, then pictures
 *    loop", Tom, 2026-09-23). Paging, swiping or clicking back to it replays it
 *    from the start.
 *
 * `kind` is optional on a still, so the pictures below need no marker: anything
 * without one is a picture.
 */
export type ScreenStill = {
  kind?: "still";
  src: string;
  title: string;
  tools: string[];
  blur: string;
};

export type ScreenClip = {
  kind: "clip";
  /** 1920x1080 h264, silent. */
  src: string;
  /** 1280x720, same cut — served to phones and to saveData. */
  srcSmall: string;
  /** Frame 0 of `src`, so the poster IS the first frame and nothing jumps. */
  poster: string;
  /** Seconds. Only a fallback: the rotation moves on the video's own `ended`. */
  seconds: number;
  title: string;
  tools: string[];
  blur: string;
};

export type ScreenFrame = ScreenStill | ScreenClip;

export const isClip = (f: ScreenFrame): f is ScreenClip => f.kind === "clip";

export const MONITOR: { frames: ScreenFrame[]; ground: string; alt: string } = {
  frames: [
    {
      kind: "clip",
      src: "/covers/screen/replay.mp4",
      srcSmall: "/covers/screen/replay-sm.mp4",
      poster: "/covers/screen/replay-poster.webp",
      seconds: 15,
      title: "A session playing out, bar by bar",
      tools: ["flow", "prorsi", "prostochastics"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQABAAD//gARTGF2YzU4LjEzNC4xMDAA/9sAQwAIPj5JPklVVVVVVVVkXWRoaGhkZGRkaGhocHBwg4ODcHBwaGhwcHx8g4OPk4+Hh4OHk5Obm5u6urKy2dng/////8QATQABAQEAAAAAAAAAAAAAAAAAAgEHAQEBAAAAAAAAAAAAAAAAAAAAAhABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/AABEIAAkAEAMBIgACEQADEQD/2gAMAwEAAhEDEQA/AMKFQUP/2Q==",
    },
    {
      src: "/covers/screen/footprints-v2.webp",
      title: "Volume by price inside each candle group",
      tools: ["flow", "prorsi", "prostochastics"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDk2RYycESZ6cfzphJOMrj6DFT9zTJO1MD/2Q==",
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
