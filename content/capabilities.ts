/**
 * "NAME WHAT WE USE" — the capability map of the white wide-body mockup
 * (hand-off 2026-10-26, section 4). Each capability is one panel: a title in
 * Tom's words, one line, and the products that read it.
 *
 * WORDING: every line is assembled from the Master sheet's own phrases as
 * copied into content/products.ts and content/pointers.ts (purpose, helps,
 * cover lines). No claim here goes beyond what those say. Product names,
 * prices, cover lines and links are never typed here: they are read from
 * products.ts, pricing.ts, pointers.ts and whop.ts.
 *
 * `lead` is the picture a panel opens on. Where the hand-off flagged a picture
 * as dark (DS ProLiquidityHunter, DS Bulk Replay Downloader, DS Live
 * Background) or undecided (the DS Toolkit cover), a white one leads when the
 * panel has one; the others are one click away, shown exactly as Tom made them.
 */
import { BY_SLUG } from "./products";

export type Capability = {
  key: string;
  title: string;
  line: string;
  slugs: string[];
  lead: string;
};

export const CAPABILITIES: Capability[] = [
  {
    key: "order-flow",
    title: "Order flow",
    line: "What traded at every price, split into buying and selling: inside every zone, and at the prices where size was hidden.",
    slugs: ["zones", "iceberg", "flow"],
    lead: "zones",
  },
  {
    key: "inside-the-candle",
    title: "The data behind the candles",
    line: "A candle tells you where the market went. Not where inside it the volume traded, whether volume stood behind the move, or how that minute's volume compares with what it normally trades.",
    slugs: ["flow", "data-candles", "volume"],
    lead: "flow",
  },
  {
    key: "volume-profile",
    title: "Volume profile",
    line: "Volume by price for every group of candles and every session, with each session's POC carried forward beside its high and low.",
    slugs: ["flow", "asl"],
    lead: "asl",
  },
  {
    // v3.1 (2026-10-29): DS Compass. Words from its approved card line.
    key: "market-side",
    title: "Which side holds",
    line: "One smooth, volume-weighted line that changes hands only on a decisive close, and a reading panel that measures today against the same time of day on earlier sessions.",
    slugs: ["compass"],
    lead: "compass",
  },
  {
    key: "trend",
    title: "Trend",
    line: "Trend, pullback and range on one scale. VWAP colored only while the 9/21 EMAs agree with value. The close that turns a Heikin-Ashi candle's color.",
    slugs: ["protrendrange", "vwap", "proheikinashi"],
    lead: "protrendrange",
  },
  {
    key: "dealer-gamma",
    title: "Dealer gamma",
    line: "Call and Put Walls, the Gamma Flip, the Expected Move and Max Pain, computed from the delayed option chain.",
    slugs: ["gex"],
    lead: "gex",
  },
  {
    key: "liquidity",
    title: "Liquidity",
    line: "Every swing pool and the measured odds price reaches it, with the higher timeframes running beside your chart.",
    slugs: ["parallax", "proliquidityhunter"],
    lead: "parallax",
  },
  {
    key: "momentum",
    title: "Momentum",
    line: "An RSI weighted by volume, whose turns out of an extreme become zones on price.",
    slugs: ["prorsi"],
    lead: "prorsi",
  },
  {
    key: "levels",
    title: "Levels and sessions",
    line: "Asia, London and New York highs and lows, each session's POC, and the Nasdaq 00/20/50/80 map.",
    slugs: ["session-levels", "asl", "ds-258"],
    lead: "session-levels",
  },
  {
    key: "on-the-chart",
    title: "On the chart",
    line: "The price line, the price readout, one-click timeframes and your own video behind the bars. Free, all four.",
    slugs: ["adaptive-priceline", "chart-price", "time-intervals", "live-background"],
    lead: "adaptive-priceline",
  },
  {
    key: "tools",
    title: "Tools",
    line: "One rail that switches every DS indicator on and off, and a Market Replay library queued once and left to run.",
    slugs: ["bulk-replay-downloader", "toolkit"],
    lead: "bulk-replay-downloader",
  },
];

/* Every slug is a real product with a cover, and every lead is in its own list. */
for (const c of CAPABILITIES) {
  for (const s of c.slugs) {
    if (!BY_SLUG[s]) throw new Error(`content/capabilities.ts: "${s}" is not a product.`);
  }
  if (!c.slugs.includes(c.lead)) throw new Error(`content/capabilities.ts: "${c.key}" leads with "${c.lead}", which it does not list.`);
}

/** The wide pictures (Tom, DS Media\1025 New Media Cover\Website Pictures,
 *  2026-10-26). Lossless webp, pixel-identical to the PNGs (tools/wide.mjs
 *  checks it). Captions say what each picture shows. `key` finds the picture's
 *  srcset ladder in content/hd.json (tools/upscale): the original scaled down
 *  for smaller screens, and the upscaled master for screens wider than it. */
export type Wide = { key: string; src: string; w: number; h: number; caption: string; alt: string; disclosure?: string };

export const WIDE = {
  /** THE HERO since 2026-10-27 (Tom: "NO NUMBERS NO POINTS, JUST TRADES",
   *  then "Re-do. New picture in the folder. Its cleaner and better"):
   *  DS Media\1025 New Media Cover\Website Pictures\Trade ideas New.png,
   *  2340 x 1378, white #FFFFFF ground. Three trades are marked as risk /
   *  reward boxes with no profit figure anywhere, so it carries the ordinary
   *  chart disclosure. Captioned with what is drawn on it, read off the
   *  picture; the chart's own legend also lists DS Zones, DS Iceberg and DS GEX. */
  hero: {
    key: "hero",
    src: "/wide/1026/desk-trade-ideas.webp",
    w: 2340,
    h: 1378,
    caption:
      "DS ASL's Asia, London and New York sessions with their volume profiles, DS ProRSI's zones and DS Volume's surges on one NinjaTrader 8 chart, three trades marked at the levels they came from, and the DS ProTrendRange panel underneath.",
    alt: "A white NinjaTrader 8 chart of the Nasdaq futures across a full session: DS ASL's Asia, London and New York brackets with each session's volume profile and its high, low, POC, LVN and HVN labeled; DS ProRSI tags at RSI 90 and RSI 19; DS Volume along the foot of the price panel with surges marked 5.3x and 7.4x; three trades drawn as risk and reward boxes, two long from the New York POC and the Asia low and one short from the London high; and the DS ProTrendRange panel beneath, reading TREND down with a RESUME at a new low.",
  },
  orderflow: {
    key: "orderflow",
    src: "/wide/1026/desk-orderflow.webp",
    w: 3840,
    h: 2159,
    caption: "DS Flow, DS Iceberg, DS GEX, DS ProRSI and DS Volume on one NinjaTrader 8 chart, with the DS ProTrendRange panel underneath.",
    alt: "A white NinjaTrader 8 chart of the Nasdaq futures: DS Flow's buy and sell profiles inside the candles with its reversal markers above and below, DS GEX's PW 0DTE and G− lines, an ICE BID at 29527.50 TESTING from DS Iceberg, DS ProRSI zones at RSI 86 and RSI 22, DS Volume along the foot of the price panel, and the DS ProTrendRange panel reading TREND ▼ beneath.",
  },
  sessions: {
    key: "sessions",
    src: "/wide/1026/desk-sessions.webp",
    w: 3840,
    h: 2159,
    caption: "DS ASL's Asia, London and New York sessions with their volume profiles, DS Volume, and DS Parallax's 15m, 1h, 4h and 1D charts underneath.",
    alt: "A white NinjaTrader 8 chart of the Nasdaq futures: three session brackets from DS ASL with each session's volume profile, high, low and POC labeled, LVN and HVN marks, DS ProRSI tags at RSI 76 and RSI 18, DS Volume along the foot, and the DS Parallax panel with live 15m, 1h, 4h and 1D mini charts and their countdowns.",
  },
  liquidity: {
    key: "liquidity",
    src: "/wide/1026/desk-liquidity.webp",
    w: 3840,
    h: 2159,
    caption: "DS ProLiquidityHunter's pools and odds, DS ASL's Asia profile and DS Iceberg on one chart, with the DS ProHeikinAshi panel underneath.",
    alt: "A white NinjaTrader 8 chart of the Nasdaq futures: DS ProLiquidityHunter's liquidity bands with MAJOR pools and their odds at the right edge, DS ASL's Asia volume profile in violet, an ICE OFFER and a broken ICE BID from DS Iceberg, 1m, 5m and 15m levels at the price axis, and the DS ProHeikinAshi panel reading UP ▲ · 1 bar · FIRM beneath.",
  },
  /** Tom, 2026-10-26 03:04: "to replace the current Free Vault chart picture
   *  since the current one has all premiums". Free Vault tools only. */
  free: {
    key: "free",
    src: "/wide/1026/desk-free-vault.webp",
    w: 3566,
    h: 2160,
    caption: "DS Chart Price, DS Session Levels, DS Adaptive Price Line and DS Parallax on one NinjaTrader 8 chart. All four are in the Free Vault.",
    alt: "A white NinjaTrader 8 chart of the Nasdaq futures: the last price, 29324.25, in large digits across the top from DS Chart Price; the London, New York and Asia session highs and lows from DS Session Levels in teal, gold and violet, carried forward as dotted lines; DS Adaptive Price Line from the live candle to the price axis with its 04:00 countdown; and the DS Parallax panel beneath with live 15m, 1h, 4h and 1D charts and their countdowns.",
  },
} satisfies Record<string, Wide>;

/**
 * THE DESK SHOT ON A PRODUCT'S OWN PAGE (hand-off 2026-10-26 night: "a wide
 * white desk shot where that product clearly appears in one"). Read off the
 * pictures, one per product, choosing the picture where the product is drawn
 * plainly rather than only listed. A product in none of them shows none.
 */
export const DESK: Partial<Record<string, keyof typeof WIDE>> = {
  asl: "hero",
  prorsi: "hero",
  volume: "hero",
  parallax: "free",
  flow: "orderflow",
  gex: "orderflow",
  protrendrange: "orderflow",
  iceberg: "liquidity",
  proliquidityhunter: "liquidity",
  proheikinashi: "liquidity",
  "session-levels": "free",
  "chart-price": "free",
  "adaptive-priceline": "free",
};
/* A desk shot must name the product in its own caption — never a picture the
   product is not on. */
for (const [slug, key] of Object.entries(DESK)) {
  const p = BY_SLUG[slug];
  if (!p) throw new Error(`content/capabilities.ts DESK: "${slug}" is not a product.`);
  if (!WIDE[key!].caption.includes(p.name)) throw new Error(`content/capabilities.ts DESK: the "${key}" caption does not name ${p.name}.`);
}
export const deskFor = (slug: string): Wide | undefined => (DESK[slug] ? WIDE[DESK[slug]!] : undefined);
