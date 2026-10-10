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
    "DS Universe builds calm, precise trading tools for NinjaTrader 8 — indicators that read the market in plain language, bought once, and a Free Vault of tools that make the chart easier to live with.",
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
export const HERO = {
  eyebrow: "For NinjaTrader 8",
  title: "See the market clearly.",
  sub: "Indicators that put what matters on the chart and leave the rest off — each one bought once. The Free Vault costs nothing.",
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
    "The Pro Series puts one panel under your candles and makes it say something about price: levels on the chart, named states and measured odds, decided on closed bars.",
    "Every paid product is sold on its own, for a single payment. DS Complete is all of them at once, for half of what they cost apart; DS ASL and DS Toolkit come free with it and are not sold on their own. The Free Vault stands apart — the price line, the readout, the level map, the higher-timeframe matrix, the session levels and the panels — each its own free download.",
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
    text: "Dark and light themes, one switch per tool on the DS Toolkit rail, and color only where it carries meaning. The tool should disappear into the chart.",
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
  heading: "All of it at once, or one tool at a time.",
  sub: "DS Complete is every paid product in one purchase. Or pick them one by one: each is a single payment. Open any cover for what it shows, how it helps, and the guide to reading it.",
};

/**
 * 2026-10-06 — THE SCREEN RE-SET FOR THE NEW LINEUP (Tom: "5 homescreen images
 * needs to be taken out, 5 new mp4/images attached... place in order
 * elegantly"). OUT: replay.mp4 (the first clip), footprints-v2, sessions,
 * session-profiles and sessions-volume-v1 — each showed "DS ProStochastics" or
 * "DS Pro Session Levels". Their files moved to LOCAL3001 Picture Updates\\
 * Replaced pictures\\2026-10-06 Homepage screen. IN, from DS Media\\03 Website\\
 * Homepage Sources: one recording and four 2560x1440 pictures (lossless webp),
 * each noted on its own entry below. KEPT: live-levels-v1 and
 * zones-iceberg-rsi-v1.
 * ORDER NOW: the new recording (volume in the candles over the liquidity map),
 * the levels recording, then the pictures dark, light, dark, light, dark — the
 * two light-template charts never side by side, the two DS ProLiquidityHunter
 * pictures two apart, and the loop closing on the close-up. Everything below
 * this note about the earlier frames is the record of how the screen got here.
 */
/**
 * The hero screen: two screen recordings and five real NQ charts on
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
 * THE SECOND CLIP (Tom, 2026-10-02: "place the video as the 2nd video played.
 * This will show a nice rotation, 1 video with flow and 1 without flow") —
 * source "Master Product Folder\Homepage 2nd video.mp4": 7680x4320 HEVC, 60fps,
 * 60.0s, with an audio track. It is 16:9 already, so there is nothing to pad
 * and nothing is cropped; its own outer rows are black, like the first clip's.
 *   ffmpeg -i "Homepage 2nd video.mp4" -an -filter_complex \
 *     "[0:v]fps=30,split=2[a][b];
 *      [a]scale=1920:1080:flags=lanczos,format=yuv420p[v1];
 *      [b]scale=1280:720:flags=lanczos,format=yuv420p[v2]" \
 *     -map "[v1]" -c:v libx264 -profile:v high -preset medium -crf 23 -g 60 \
 *       -movflags +faststart  →  live-levels-v1.mp4      3.22 MB (1800 frames)
 *     -map "[v2]" … -level 3.1 -crf 26     →  live-levels-v1-sm.mp4   1.54 MB
 *   frame 0 of the 1080p file, libwebp q88 →  live-levels-v1-poster.webp
 * Four times the length of the first clip at about the same weight: a chart
 * with no volume numbers on it changes very little from frame to frame.
 * The screen does not send it with the page — components/ui/Monitor.tsx gives
 * it its file half-way through the first clip.
 * `tools`, by the same strict rule as the first clip: its data-series header
 * lists "DS Iceberg, DS Oracle, DS Zones, DS Pro Session Levels", and three of
 * those draw a LABELLED mark in the recording — the session's volume profile
 * with "NEW YORK HIGH" and "NEW YORK POC" = DS Pro Session Levels; the
 * "DEMAND 30040.00 APPROACHING / SELL 55% BALANCED" cards on their bands =
 * DS Zones; "ICE OFFER 30069.75 TESTING" and "ICE BID 30029.25" on their keel
 * icebergs = DS Iceberg. DS Oracle is loaded, but nothing on screen carries
 * its name (candle colouring is never claimed), so it is not listed.
 * Both are the 2026-10-01 look of DS Zones and DS Iceberg.
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
 *   timeframes        ← DS_20260921_013152.png  (RETIRED 2026-09-30: the 4th
 *                       slot became sessions-zones-v1 ← "Main cover page 6.png",
 *                       itself RETIRED 2026-10-02 — it showed the pre-10-01
 *                       DS Zones cards — for zones-iceberg-rsi-v1 ←
 *                       "Master Product Folder\Homepage image 4 replacement.png")
 *   session-profiles  ← DS_20260921_013601.png
 *   levels            ← DS_20260921_013258.png  (RETIRED 2026-09-30: the last
 *                       slot is now sessions-volume-v1 ← "Main cover page 5.png")
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
 * small triangles, the "S" swing marks, the candle coloring and the countdown
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
 * ORDER: the first clip, then the second (2026-10-02, Tom: "the 2nd video
 * played"), then footprints, then the pictures in the order they already had
 * (the firsts are Tom's). The two recordings sit together so the screen opens
 * on movement twice — volume inside the candles, then levels with no volume
 * on the candles at all — before it settles into pictures; each plays once
 * and the pictures loop after that. Taking pro-series out did put two Flow
 * pictures side by side — footprints, then sessions — where they used to
 * alternate. Footprints (volume inside each candle group) and sessions (the
 * three session profiles) do not read as the same screenshot twice.
 * Since 2026-09-30 the last four frames were all session views; since
 * 2026-10-02 the one between the two DS Flow session pictures is
 * zones-iceberg-rsi-v1, which has no session marks on it at all, so the two
 * no longer sit side by side. (2026-10-09: that last frame is now
 * gex-sessions-rsi-v1, the new showcase; it carries session profiles again,
 * but it closes the loop, after the light zones picture, not beside a Flow one.)
 *
 * `ground` is the charts' own black (#040404, sampled): the screen and the
 * enlarged view are painted with it, so a picture that is still loading, or a
 * letterbox in a window of another shape, is invisible.
 */
/**
 * A frame on the hero screen. Two kinds share one rotation since 2026-09-23:
 *
 *  · a STILL — a 2560x1440 chart picture, which is what every frame was before;
 *  · a CLIP — one of Tom's screen recordings, played IN FULL before the frame
 *    after it starts ("Video first, played in full — users can swipe to skip
 *    to next"). Once a clip has finished ONCE the rotation steps over it, so
 *    someone reading the page is not interrupted by a recording every lap
 *    ("Video once, then pictures loop", Tom, 2026-09-23). Paging, swiping or
 *    clicking back to it replays it from the start. There are two since
 *    2026-10-02; the screen handles any number.
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

/**
 * CRISPER SCREEN (2026-10-09, Tom: "make the monitors fit more elegantly and
 * have bigger crispier displays"). The monitor now shows the two recordings at
 * up to ~1250px wide on a 1.25x–2x screen, past what a 1080p file at CRF 23
 * holds sharply (the price labels and volume rows went soft). Both were
 * re-made from the 8K originals in DS Media\03 Website\Homepage Sources at
 * 2560x1440, CRF 20 (preset slow), with the same framing as before:
 *   flow-hunter-v2.mp4   -ss 0.5, crop=7054:3716:0:292 (the chart window),
 *                        scale=2560:-2, pad to 1440 in black, fps 30   9.3 MB
 *   live-levels-v2.mp4   scale=2560:1440, fps 30                         5.3 MB
 *   posters: frame 0, libwebp q88. The phone files (-sm, 720p) are unchanged.
 */
export const isClip = (f: ScreenFrame): f is ScreenClip => f.kind === "clip";

export const MONITOR: { frames: ScreenFrame[]; ground: string; alt: string } = {
  frames: [
    {
      // ← "Homepage Flow and Liquidity Hunter.mp4" (DS Media\\03 Website\\Homepage
      // Sources, 2026-10-06): 7054x4320 HEVC, 60 fps, 30.0 s. The chart window sits
      // inside a black frame (rows 292-4008), so the frame is trimmed, the chart
      // scaled to 1920 wide and padded 34 rows top and bottom in black — nothing
      // of the chart is cropped. It starts 0.5 s in: until then the data-series
      // header still reads "DS Flow (Calculating...)". Labelled marks only: the
      // DS ProLiquidityHunter panel and its "MAJOR 33% 29924.00"-style flags on
      // price; DS Flow's volume-by-price rows on the candle groups; "ASIA HIGH",
      // "NEW YORK POC", "LONDON LOW" on session profiles = DS ASL; "ICE OFFER
      // 29941.25" = DS Iceberg. DS Oracle and DS Zones are loaded, not claimed.
      kind: "clip",
      src: "/covers/screen/flow-hunter-v2.mp4",
      srcSmall: "/covers/screen/flow-hunter-v1-sm.mp4",
      poster: "/covers/screen/flow-hunter-v2-poster.webp",
      seconds: 30,
      title: "A session playing out, with its liquidity pools mapped beneath",
      tools: ["flow", "proliquidityhunter", "asl", "iceberg"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDkGRRnBJpGByPlwKkk/rUR7UwP/9k=",
    },
    {
      // The second recording (2026-10-02): no DS Flow on it — the first clip is
      // volume inside the candles over the liquidity map, this one is levels.
      // 60s; the screen gives it its file half-way through the first clip.
      kind: "clip",
      src: "/covers/screen/live-levels-v2.mp4",
      srcSmall: "/covers/screen/live-levels-v1-sm.mp4",
      poster: "/covers/screen/live-levels-v2-poster.webp",
      seconds: 60,
      title: "Levels forming as a New York session trades",
      tools: ["asl", "zones", "iceberg"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDjipDYpMe9Pb7xplAH/9k=",
    },
    {
      // ← DS_20261006_021500.png. "ASIA HIGH 29861.75", "LONDON POC 29830.00" with
      // their session profiles = DS ASL; the DS ProLiquidityHunter panel and its
      // "87% 29886.75" flags on price. Price is drawn as a line on close.
      src: "/covers/screen/levels-liquidity-v1.webp",
      title: "Session highs, lows and POCs on price, the liquidity map beneath",
      tools: ["asl", "proliquidityhunter"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDktvfA+vagryDlPwpv+NJ3oA//2Q==",
    },
    {
      // ← DS_20261006_020927.png, light template. "SUPPLY 29919.25 DEFENDED 4×" cards
      // = DS Zones; "ASIA HIGH 29924.00", "LONDON POC 29850.00" = DS ASL; "ICE BID
      // 29828.25" = DS Iceberg; "NQ · 15m / 1h / 4h / 1D" = DS Parallax; the
      // "DS ProHeikinAshi" panel, "UP ▲ · 1 bar · HOLDING".
      src: "/covers/screen/one-chart-light-v1.webp",
      title: "Zones, session levels, an iceberg bid and four timeframes over the Heikin-Ashi panel",
      tools: ["zones", "asl", "iceberg", "parallax", "proheikinashi"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDrt3HLilOSBg5qM/6upl+6KYH/2Q==",
    },
    {
      // ← DS_20261006_020755.png. ASIA / LONDON / NEW YORK profiles with "NEW YORK
      // POC", "ASIA H", "ASIA L" at the axis = DS ASL; the volume-by-price rows on
      // the candle groups = DS Flow.
      src: "/covers/screen/sessions-asl-v1.webp",
      title: "Asia, London and New York, session after session, each with its volume profile",
      tools: ["asl", "flow"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDkcq5wRhj37UhbHyjoOM4ptFAH/9k=",
    },
    {
      // ← DS_20261006_022256.png, light template. "DEMAND 29220.00 PIVOT" cards =
      // DS Zones; the DS ProLiquidityHunter panel and its "MAJOR 47% 29116.75" flag.
      // The two ENTRY / TARGET / STOP boxes are drawn on the chart and belong to no
      // product on the site; the title does not mention them and nothing is claimed.
      src: "/covers/screen/zones-liquidity-v1.webp",
      title: "Supply and demand zones on price, pool odds flagged at the axis",
      tools: ["zones", "proliquidityhunter"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDpDjI+Ygil3cc4BprdKavWmB//2Q==",
    },
    {
      // ← DS_20261009_043034.png (Homepage Sources, 2026-10-09: "replace the
      // last outdated RSI picture with the new ds showcase picture"). It takes
      // the place of zones-iceberg-rsi-v1.webp, which showed DS ProRSI's old
      // levels. 1920x1079 native: one row of the chart's own black added at
      // the foot to make 1920x1080, never enlarged; LOSSLESS webp. Attributed
      // by its labels: "G+ 30930.83", "CW 0DTE / EM High 30890.92", "Max Pain
      // 30711.32", "Gamma Flip 30646.58" and the "08:30 NDX …" strike tags =
      // DS GEX; "NEW YORK HIGH / POC / LOW", "LONDON HIGH", "ASIA HIGH" with
      // their session profiles = DS ASL; "ICE BID 30691.00 3× 176" on its keel
      // = DS Iceberg; the "RSI 78" zone flag on price and the "DS ProRSI"
      // panel (ZONES HELD / BROKE, RSI 57 BEARISH) = DS ProRSI. The candle
      // colouring is not claimed.
      src: "/covers/screen/gex-sessions-rsi-v1.webp",
      title: "Dealer gamma levels, session profiles, an iceberg bid and an RSI zone on one chart",
      tools: ["gex", "asl", "iceberg", "prorsi"],
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDyRxGsaqsZZ/4m6VGQ2R8mPwpx601vvCiwj//Z",
    },
  ],
  ground: "#040404",
  alt: "DS Universe indicators running together on a NinjaTrader 8 chart",
};

/**
 * The picture in the monitor at the top of /products (Tom, 2026-10-10,
 * "Product Page Monitor Hero.png" from DS Media\03 Website\Homepage Sources;
 * replaces the 2026-09-26 DS Flow picture, products-hero-v1). Every mark was
 * traced to the product that draws it before it was named: the 57% / 45% / 19%
 * pools, "HUNTING" and the panel underneath are DS ProLiquidityHunter; "Call
 * Wall" and "EM High" are DS GEX; "ICE OFFER" / "ICE BID" are DS Iceberg; the
 * Asia / London / New York highs, lows, POCs and profiles are DS ASL; "RSI 79"
 * is a DS ProRSI zone. Kept lossless (fine chart labels). Cropped 2 px top and
 * bottom to an exact 16:9. A re-export gets a NEW filename (assets are cached
 * for a year).
 */
export const PRODUCTS_SCREEN = {
  src: "/covers/products-hero-v2.webp",
  w: 1913,
  h: 1076,
  blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDyNlCkhYmPPBIpuH4/d4/4DU9NPT8aUXd2G9D/2Q==",
  title: "Five DS tools on one Nasdaq chart",
  sub: "DS ProLiquidityHunter · DS GEX · DS Iceberg · DS ASL · DS ProRSI",
  alt: "A Nasdaq futures chart with DS ProLiquidityHunter's liquidity pools and odds and its panel underneath, the DS GEX Call Wall, DS Iceberg bid and offer levels, DS ASL session levels and profiles, and a DS ProRSI zone",
  caption:
    "DS ProLiquidityHunter's pools above and below price with their odds, the DS GEX Call Wall, DS Iceberg bids and an offer, DS ASL's session levels and profiles, and a DS ProRSI zone, together on one chart.",
} as const;

/** "Powered by traders" lock-up beside the DS mark in the header (Tom,
 *  2026-09-26; source "Master Product Folder\DS Powered by Traders.png",
 *  trimmed to its artwork and kept lossless with its transparency). */
export const POWERED_BY = {
  src: "/brand/powered-by-traders-v1.webp",
  w: 1303,
  h: 160,
  alt: "Powered by traders",
} as const;
