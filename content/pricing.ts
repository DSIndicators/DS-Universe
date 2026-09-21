/**
 * Prices. ONE file — every number the site shows comes from here, and every
 * comparison it makes is computed from these numbers, never typed.
 *
 * TOM: the site's price must always match Whop. Change a price there, change it
 * here in the same sitting. Nothing else in the codebase holds a number.
 *
 * ---------------------------------------------------------------------------
 * THE MODEL (Tom, 2026-09-20 — "DS LAUNCH 09-20"; supersedes the five packs)
 *
 *   · Every product is sold on its own, at one flat, permanent price.
 *   · Every paid indicator: $99.99 list, 20% off -> $79.99. One payment.
 *   · DS Bulk Replay Downloader: $29.99, 0% off, and it stays that way.
 *   · The chart essentials and the DS Toolkit rail: free.
 *   · ONE bundle, DS Complete: every product, 50% off what the paid ones cost
 *     bought one at a time.
 *
 * EVERY NUMBER BELOW WAS READ OFF THE LIVE WHOP LISTING on 2026-09-20, all
 * sixteen pages opened one by one (the listings were in waitlist mode):
 *   nine paid indicators   $99.99 struck -> $79.99  (20% off)
 *   DS Complete            $749.90 struck -> $374.95 (50% off)
 *   DS Bulk Replay         $29.99 — BUT Whop also shows a $37.49 struck anchor
 *                          ("20% off"). Tom's rule is 0% off, so this site shows
 *                          $29.99 and nothing crossed out. The anchor should come
 *                          off the Whop listing.
 *   five free products     no price on Whop (free, waitlist)
 *
 * DS COMPLETE IS HALF OF WHAT THE PAID PRODUCTS COST APART — and that is
 * asserted at build time below. Its struck-through $749.90 on Whop is exactly the
 * sum of the paid prices a buyer would really pay, so the comparison is true
 * arithmetic, not an invented anchor. (The sheet's Pricing tab also carried a
 * $929.90 -> $464.95 formula that summed LIST prices; the box art, the Whop
 * listing, the catalogue and the Read Me all say $374.95, and so does Whop.)
 * ---------------------------------------------------------------------------
 */

import { PRODUCTS, type Series } from "./products";

export type Price =
  /** Free, permanently. Not a trial and not a stripped build. */
  | { free: true; list?: undefined; now?: undefined }
  /** One payment. `list` equals `now` when there is no discount. */
  | { free?: undefined; list: number; now: number };

const paid = (list: number, now: number): Price => ({ list, now });
const FREE: Price = { free: true };

export const PRICES: Record<string, Price> = {
  // ---- flagship indicators ---------------------------------------------
  zones: paid(99.99, 79.99),
  iceberg: paid(99.99, 79.99),
  oracle: paid(99.99, 79.99),
  gex: paid(99.99, 79.99),
  flow: paid(99.99, 79.99),
  // ---- Pro Series panels -----------------------------------------------
  // The sheet's Pricing tab had these at 0% ($99.99). Tom's rule ("each
  // indicator ... 20% off each"), the sheet's own section header and Whop all
  // say $79.99.
  prorsi: paid(99.99, 79.99),
  prostochastics: paid(99.99, 79.99),
  prosqueeze: paid(99.99, 79.99),
  promacd: paid(99.99, 79.99),
  // ---- data utility — no discount, by rule --------------------------------
  "bulk-replay-downloader": paid(29.99, 29.99),
  // ---- free essentials -------------------------------------------------
  "adaptive-priceline": FREE,
  "chart-price": FREE,
  "ds-258": FREE,
  parallax: FREE,
  toolkit: FREE,
};

export const priceFor = (slug: string): Price | undefined => PRICES[slug];

/** Whole-percent discount, or 0. Computed, so it cannot disagree with the prices. */
export const discountPct = (p: Price | undefined) =>
  p && !p.free && p.list > p.now ? Math.round((1 - p.now / p.list) * 100) : 0;

/* -------------------------------------------------------------------------- */
/* The shelves. Copy per series; membership comes from products.ts.            */
/* -------------------------------------------------------------------------- */

export type SeriesInfo = {
  key: Series;
  name: string;
  /** Sits under the name. One line. */
  tagline: string;
  /** A short paragraph for the shelf header. */
  blurb: string;
};

export const SERIES: SeriesInfo[] = [
  {
    key: "flagship",
    name: "Flagship indicators",
    tagline: "The engines. Structure, liquidity, dealer levels, order flow and trend.",
    blurb:
      "Each one reads the market from its own angle and prints the answer on the chart in plain trading language — where a level is holding, where size was hidden, where the options market sits, what traded inside the candle, and which side the trend is on.",
  },
  {
    key: "pro",
    name: "Pro Series panels",
    tagline: "The classic oscillators, rebuilt to say something about price.",
    blurb:
      "RSI, stochastics, the squeeze and MACD — each one a single locked-scale panel that turns its read into levels, named states and graded signals, decided on closed bars.",
  },
  {
    key: "essentials",
    name: "Free essentials",
    tagline: "The chart, easier to read and easier to drive.",
    blurb:
      "The price line, the price readout, the Nasdaq level map, the higher-timeframe matrix and the rail that switches every DS indicator on and off. Free permanently — no trial clock, no email wall, nothing removed to make room for a paid version.",
  },
  {
    key: "utility",
    name: "Data utility",
    tagline: "A Market Replay library, queued once and left to run.",
    blurb:
      "Queue every instrument and date you want and it fetches NinjaTrader's own replay data unattended, file by file, skipping the days you already have.",
  },
];

export const seriesInfo = (key: Series) => SERIES.find((s) => s.key === key)!;

/** The price every product in a series shares, or null if they differ. */
export function seriesPrice(key: Series): Price | null {
  const ps = PRODUCTS.filter((p) => p.series === key).map((p) => PRICES[p.slug]);
  const first = ps[0];
  if (!first) return null;
  const same = ps.every((p) => p && p.free === first.free && p.now === first.now && p.list === first.list);
  return same ? first : null;
}

/* -------------------------------------------------------------------------- */
/* DS Complete — the only bundle.                                              */
/* -------------------------------------------------------------------------- */

export const COMPLETE = {
  key: "complete",
  name: "DS Complete",
  /** What it costs. Read off Whop, 2026-09-20. */
  now: 374.95,
  /** The struck-through figure on Whop. Must equal APART — checked below. */
  whopAnchor: 749.9,
  blurb:
    "Every DS Universe product — the flagship indicators, the Pro Series panels, the data utility, and the free essentials with the rail that runs them — in one permanent license.",
  /** The four hooks from the sheet, minus the count. */
  points: [
    "Every product, one purchase",
    "Every free essential included",
    "Each product keeps its own permanent license",
    "Built to run together on one chart",
  ],
  art: "/boxart/0920/complete-v2.webp",
} as const;

/** What the paid products cost bought one at a time. COMPUTED. */
export const APART = round2(
  Object.values(PRICES).reduce((n, p) => n + (p.free ? 0 : p.now), 0),
);
export const COMPLETE_SAVING = round2(APART - COMPLETE.now);
export const COMPLETE_PCT = Math.round((1 - COMPLETE.now / APART) * 100);

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/* The one invariant the Complete offer rests on. Throws during `next build` if
   a price moves and Complete stops being what the page says it is. */
if (Math.abs(APART - COMPLETE.whopAnchor) > 0.001) {
  throw new Error(
    `content/pricing.ts: the paid products now sum to ${APART}, but DS Complete is still ` +
      `compared against ${COMPLETE.whopAnchor}. Re-read the Complete listing on Whop.`,
  );
}
for (const p of PRODUCTS) {
  if (!PRICES[p.slug]) throw new Error(`content/pricing.ts: no price for "${p.slug}".`);
}
for (const slug of Object.keys(PRICES)) {
  if (!PRODUCTS.some((p) => p.slug === slug)) {
    throw new Error(`content/pricing.ts: "${slug}" has a price but is not in the catalogue.`);
  }
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** "$79.99". Always two decimals — every price here has cents. */
export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The single line a tile shows. */
export const tilePrice = (p: Price | undefined) => (!p ? "" : p.free ? "Free" : money(p.now));

/**
 * How we sell, said once. NinjaTrader's vendor guidelines forbid superlatives,
 * which is just as well — these terms do not need one.
 */
export const TERMS = [
  {
    title: "One payment",
    text: "Buy a product once and it is yours. There is no subscription, no renewal and no clock running against you.",
  },
  {
    title: "Updates included",
    text: "Every later version of what you bought, at no extra cost.",
  },
  {
    title: "The essentials are free",
    text: "The chart essentials and the DS Toolkit rail cost nothing, permanently. Not a trial, not a stripped build.",
  },
  {
    title: "One bundle",
    text: "DS Complete is every product at once, for half of what the paid ones cost bought separately.",
  },
];
