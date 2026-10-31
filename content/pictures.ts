/**
 * The pictures. Tom's own, exactly as he made them (lossless webp, the same
 * pixels as his PNGs; DS-Universe-White's tools/covers.mjs and tools/wide.mjs
 * made them). This site only changes how BIG they are shown: every picture
 * sits contained in the layout and opens full size on click (components/Shot.tsx).
 *
 * Covers: content/drop-covers.json, copied from DS-Universe-White (2026-10-30),
 * with each cover's srcset ladder (content/hd.json; originals scaled down below
 * native width, the colour-locked upscale above it).
 */
import DROP from "./drop-covers.json";
import HD from "./hd.json";
import { PICTURE_ALTS, SQUARE_COVERS } from "./covers";
import { BY_SLUG, PRODUCTS } from "./products";

export type Rung = { src: string; w: number };
export type Pic = { src: string; w: number; h: number; alt: string; srcSet?: string; dark?: boolean };

export const srcSetOf = (src: string, w: number, ladder?: Rung[]) =>
  ladder?.length
    ? [...ladder.filter((r) => r.w !== w), { src, w }]
        .sort((a, b) => a.w - b.w)
        .map((r) => `${r.src} ${r.w}w`)
        .join(", ")
    : undefined;

const drop = DROP as Record<string, { src: string; w: number; h: number; file: string; ladder?: Rung[]; dark?: boolean }>;

export const COVERS: Record<string, Pic | undefined> = Object.fromEntries(
  PRODUCTS.filter((p) => drop[p.slug]).map((p) => {
    const d = drop[p.slug];
    const alt =
      PICTURE_ALTS[d.file] ??
      (d.file === `${p.slug}.webp` ? SQUARE_COVERS[p.slug]?.alt : undefined) ??
      `${p.name} in NinjaTrader 8.`;
    return [p.slug, { src: d.src, w: d.w, h: d.h, alt, srcSet: srcSetOf(d.src, d.w, d.ladder), dark: d.dark }];
  }),
);

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

const hdWide = (HD as { wide?: Record<string, Rung[]> }).wide ?? {};
/** A wide shot as a Pic, with its ladder. */
export const widePic = (k: keyof typeof WIDE): Pic & { caption: string } => {
  const x = WIDE[k];
  return { src: x.src, w: x.w, h: x.h, alt: x.alt, caption: x.caption, srcSet: srcSetOf(x.src, x.w, hdWide[x.key]) };
};

/* Every product named in DESK exists. */
for (const slug of Object.keys(DESK)) if (!BY_SLUG[slug]) throw new Error(`content/pictures.ts: DESK names "${slug}", which is not in the catalogue.`);
