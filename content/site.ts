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
  { label: "Pricing", href: "/pricing" },
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

/** Home-page catalogue copy. Every product is listed there (quiet rows, no counts). */
export const CATALOGUE = {
  eyebrow: "The products",
  heading: "Built to work together, or alone.",
  sub: "Indicators are drawn on the chart. Add-ons live on the platform. Open any of them for what it shows and how it helps.",
};

/**
 * The four chart pictures under the storefront heading, on the home page and
 * on /products. Rendered by components/ChartRow.tsx; any of them opens full
 * screen.
 *
 * THESE ARE REAL SESSIONS, not renders — the stills the hero monitor rotated
 * until the recordings replaced it on 2026-09-11 (they are still listed in
 * MONITOR.frames, which is why nothing new had to be exported). Ordered LIGHT,
 * DARK, LIGHT, DARK so the row shows both themes without reading as a colour
 * test, and so no two neighbours look like the same screenshot twice.
 *
 * Files are 2560x1440, which is what makes the enlarge worth doing: the tiles
 * serve a ~280px variant and the full frame is only fetched when asked for.
 *
 * EVERY CAPTION IS READ OFF THE PICTURE, AND EVERY TOOL NAMED IS ACTUALLY IN IT.
 * The four were attributed by matching the on-chart label text against the
 * source that draws it: SUPPLY/DEMAND, DEFENDED xN, KEY LEVEL and the buy-sell
 * split are DSZones.cs; ICE SUP / ICE RES badges are DSIceberg.cs; Max Pain,
 * Gamma Flip, Put Wall, the 0DTE walls and G+/G- are DSGex.cs; the GRAVITY /
 * MASS / NOVA / VELOCITY lanes and the DORMANT-to-COOLING ribbon are
 * DSSonar.cs; the bias line through price and the five-state candles are DS
 * Oracle's Neural Line and Spectrum. (The first caption used to call that line
 * "the isotropic line" - wrong indicator, DS Isotropic Lines is not on these
 * charts. Check the source, not the shape.)
 *
 * `title` is the trading job the picture demonstrates; `caption` is the tile's
 * one line; `detail` is the longer read shown in the lightbox, where there is
 * room for it. Every figure quoted - 78/22, DEFENDED x18, -1.04K - is legible
 * in the picture, so a reader can check us. They never say what happened next,
 * never name a result, and never use "will" - same rule as content/shots.ts.
 * Swapping a picture is an edit here; the row takes however many it is given.
 *
 * THE `-v2` IN THE FILENAMES IS DELIBERATE, DO NOT TIDY IT AWAY. These stills
 * were re-exported on 2026-09-12 with the big centred watermark lifted and a
 * small DS mark placed on the right instead. Assets are served with a one-year
 * immutable cache (next.config.mjs only revalidates PAGES), and Next's image
 * optimiser keys its cache on the URL - so replacing the bytes under the old
 * name would have left anyone who saw the hero rotation between 09-09 and 09-11
 * looking at the old watermark. A new name is the only reliable cache bust.
 * Same rule for any future re-export of a published image.
 *
 * `blur` is a 16x9 JPEG of the picture itself, inlined. It is what the tile and
 * the lightbox paint while the real file is still being optimised and fetched -
 * without it the dialog opens onto an empty grey box for the second or so that
 * a 2560x1440 source takes to come back the first time, which is exactly the
 * moment someone has just asked to see the chart. Regenerate one with:
 *   PIL: Image.open(src).convert("RGB").resize((16, 9)) -> JPEG q40 -> base64
 */
export const SCREENS = [
  {
    src: "/covers/hero/01-v2.webp",
    title: "Which side the market is on",
    caption: "The Neural Line carries the bias; chop stays grey, so a trend has to earn its colour.",
    detail:
      "DS Oracle's Neural Line is the bias boundary — above it, look long; below it, look short — and it only changes sides when a closed bar clears it by a margin, so ordinary chop cannot flip it back and forth. The candles behind it are graded into five states, with chop left grey. Around them DS Zones holds the supply and demand bands, DS Iceberg marks a support tested four times, and DS GEX prints Max Pain overhead.",
    alt: "A light NinjaTrader 8 chart showing the DS Oracle Neural Line and graded candles, DS Zones supply and demand bands, a DS Iceberg support and the DS GEX Max Pain level, with the DS Sonar panel below",
    blur:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDpc8daTcfwNRL0p6/eP0NAH//Z",
  },
  {
    src: "/covers/hero/02-v2.webp",
    title: "When structure and dealer levels agree",
    caption: "Supply defended eighteen times, sitting on the gamma flip. Two engines, one price.",
    detail:
      "Two independent engines landing on the same prices. The band overhead reads DEFENDED x18 and KEY LEVEL on 4.27K of volume, and DS GEX's gamma flip sits a few points beneath it. Under price, a demand pivot on an 80/20 aggressive buy–sell split sits directly on the put wall, with a DS Iceberg support tested four times below that. A level two different methods arrive at independently is a different level from one drawn by hand.",
    alt: "A dark NinjaTrader 8 chart showing a DS Zones supply level defended eighteen times sitting on the DS GEX gamma flip, a demand pivot on the put wall, and a DS Iceberg support below",
    blur:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDmwM9V/Sj8KtydT+NQP90UAf/Z",
  },
  {
    src: "/covers/hero/03-v2.webp",
    title: "A level is only as good as the flow behind it",
    caption: "Two demand zones — one strong on a 78/22 split, one weak at 51/49. The card separates them.",
    detail:
      "Both bands are demand, and a drawn rectangle would treat them alike. The card is the difference: the upper zone reads FRESH and STRONG on a 78/22 aggressive buy–sell split; the lower reads FRESH but WEAK at 51/49, on more than twice the volume. DS Zones prints the split that actually traded inside each level, so the two are ranked before price returns to either. DS GEX's 0DTE call wall sits between them.",
    alt: "A light NinjaTrader 8 chart showing two DS Zones demand bands with different buy-sell splits and strength readings, and the DS GEX 0DTE call wall between them",
    blur:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDpc/T8+aD9c+tRJ/qx9KWPp+FAH//Z",
  },
  {
    src: "/covers/hero/04-v2.webp",
    title: "A level holding, and a level under pressure",
    caption: "Defended ten times, but sellers now hold the split 63/37 and Sonar reads CRITICAL.",
    detail:
      "The demand band has been defended ten times and reads KEY LEVEL — yet the flow inside it has turned: sellers 63%, buyers 37%, net delta −1.04K. DS Zones puts that turn on the card instead of leaving it to be guessed. Overhead, supply is holding on a 64/36 split with a DS Iceberg resistance tagged above it, DS GEX's gamma flip and put wall frame the range, and DS Sonar reads CRITICAL — the squeeze is on, and the panel keeps reporting which lanes fire next.",
    alt: "A dark NinjaTrader 8 chart showing a DS Zones demand level defended ten times with sellers holding the split, a DS Iceberg resistance, the DS GEX gamma flip and put wall, and the DS Sonar panel reading CRITICAL",
    blur:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDmseoIpcH0qyvU/hUcn+rX/eoA/9k=",
  },
];

/**
 * The hero screen.
 *
 * `clips` are two real NinjaTrader sessions with the DS stack running on them
 * (Tom, 2026-09-11, sped up, silent). They play in order and crossfade into each
 * other: first the levels session — supply and demand zones, the iceberg tags,
 * the Sonar lanes — then the trend session, where the isotropic line bends
 * through the move. Both are light charts, so the screen belongs to the page
 * instead of punching a dark hole in it, and both are letterboxed into 16:9 at
 * encode time in the chart's own #E3E3E3, so nothing is cropped and the fill is
 * invisible. Phones get the smaller encodes.
 *
 * `frames` are the six stills the screen rotated before the recordings arrived.
 * They stay here on purpose: delete `clips` and the rotation comes straight back,
 * no code change. Ordered LIGHT, DARK, LIGHT, DARK… so each change reads as a
 * change rather than a slow wobble.
 */
export const MONITOR = {
  clips: [
    // the levels session: supply and demand zones, the iceberg tags, the Sonar lanes
    { src: "/covers/hero/clip-1.mp4", srcSmall: "/covers/hero/clip-1-sm.mp4" },
    // the trend session: the isotropic line bending through the move, same Sonar lanes
    { src: "/covers/hero/clip-2.mp4", srcSmall: "/covers/hero/clip-2-sm.mp4" },
  ],
  // a real frame of the first clip: first paint, blocked autoplay, reduced motion
  poster: "/covers/hero/poster.webp",
  frames: [
    "/covers/hero/01-v2.webp",
    "/covers/hero/02-v2.webp",
    "/covers/hero/03-v2.webp",
    "/covers/hero/04-v2.webp",
    "/covers/hero/05-v2.webp",
    "/covers/hero/06-v2.webp",
  ],
  alt: "DS Universe indicators running on a live NinjaTrader 8 chart",
};
