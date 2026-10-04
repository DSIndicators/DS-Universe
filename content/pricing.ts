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
 *   · Every paid indicator: $79.99, one payment (was shown as $99.99 -> $79.99
 *     until 2026-09-26; see below).
 *   · DS Bulk Replay Downloader: $29.99, 0% off, and it stays that way.
 *   · The chart essentials and the DS Toolkit rail: free.
 *   · DS Session Levels: free (2026-09-30). DS Pro Session Levels: NOT sold on
 *     its own — free with DS Complete (WITH_COMPLETE, and GIFT below).
 *   · ONE bundle, DS Complete: every product, 50% off what the paid ones cost
 *     bought one at a time. The pair adds $0 to that sum.
 *
 * 2026-09-26: Tom took the $99.99 compare-at price off all nine indicator
 * listings on Whop (it had never been a price anyone paid — FTC 16 CFR 233.1),
 * so every indicator is now ONE number, $79.99, with nothing crossed out. The
 * only struck figure left anywhere is DS Complete's $749.90, which is the real
 * sum of the paid products. Re-read on Whop 2026-09-26.
 *
 * EVERY NUMBER BELOW WAS READ OFF THE LIVE WHOP LISTING on 2026-09-20, all
 * sixteen pages opened one by one (the listings were in waitlist mode):
 *   nine paid indicators   $99.99 struck -> $79.99  (20% off)
 *   DS Complete            $749.90 struck -> $374.95 (50% off)
 *   DS Bulk Replay         $29.99, nothing crossed out (the old $37.49 anchor is
 *                          gone from Whop — re-checked 2026-09-25)
 *   five free products     "Free" on Whop
 * RE-READ 2026-09-25 (store opened): every listing AND every direct checkout
 * shows exactly these numbers.
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

/** One payment. `list` equals `now` when there is no discount. */
export type PaidPrice = { free?: undefined; withComplete?: undefined; list: number; now: number };

export type Price =
  /** Free, permanently. Not a trial and not a stripped build. */
  | { free: true; withComplete?: undefined; list?: undefined; now?: undefined }
  | PaidPrice
  /** Not sold on its own: it comes, at no charge, with DS Complete (2026-09-30,
   *  DS Pro Session Levels). It adds nothing to APART and nothing to the
   *  discount — it is a reason to choose the bundle. */
  | { withComplete: true; free?: undefined; list?: undefined; now?: undefined };

/** A price somebody pays. Read this, never `!p.free` — there are three kinds. */
export const isPaid = (p: Price | undefined): p is PaidPrice => !!p && typeof p.now === "number";

const paid = (list: number, now: number): Price => ({ list, now });
/** One price, nothing crossed out. */
const flat = (now: number): Price => paid(now, now);
const FREE: Price = { free: true };
const WITH_COMPLETE: Price = { withComplete: true };

export const PRICES: Record<string, Price> = {
  // ---- flagship indicators ---------------------------------------------
  zones: flat(79.99),
  iceberg: flat(79.99),
  oracle: flat(79.99),
  gex: flat(79.99),
  flow: flat(79.99),
  // ---- Pro Series panels -----------------------------------------------
  prorsi: flat(79.99),
  prostochastics: flat(79.99),
  prosqueeze: flat(79.99),
  protrendrange: flat(79.99), // 2026-10-04: took DS ProMACD's place, at its price
  // ---- the session levels pair (2026-09-30, Master Sheet "Pricing" tab) --
  "session-levels": FREE,
  "pro-session-levels": WITH_COMPLETE,
  // ---- data utility — no discount, by rule --------------------------------
  "bulk-replay-downloader": flat(29.99),
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
  isPaid(p) && p.list > p.now ? Math.round((1 - p.now / p.list) * 100) : 0;

/* -------------------------------------------------------------------------- */
/* The shelves. Copy per series; membership comes from products.ts.            */
/* -------------------------------------------------------------------------- */

export type SeriesInfo = {
  key: Series;
  name: string;
  /** The store bar's chip — one word or two, beside the series price. */
  short: string;
  /** Sits under the name. One line. */
  tagline: string;
  /** A short paragraph for the shelf header. */
  blurb: string;
};

export const SERIES: SeriesInfo[] = [
  {
    key: "flagship",
    short: "Flagship",
    name: "Flagship indicators",
    tagline: "The engines. Structure, liquidity, dealer levels, order flow and trend.",
    blurb:
      "Each one reads the market from its own angle and prints the answer on the chart in plain trading language — where a level is holding, where size was hidden, where the options market sits, what traded inside the candle, and which side the trend is on.",
  },
  {
    key: "pro",
    short: "Pro Series",
    name: "Pro Series panels",
    tagline: "The classic oscillators, rebuilt to say something about price.",
    blurb:
      "RSI, stochastics, the squeeze, and the trend with its pullbacks — each one a single locked-scale panel that turns its read into levels, named states and graded signals, decided on closed bars.",
  },
  {
    // 2026-09-30. One free tool and its Pro tier, which comes only with DS
    // Complete — shelved together so the step between them is plain to see.
    key: "sessions",
    short: "Sessions",
    name: "Session levels",
    tagline: "Every session's high and low, exactly where it happened — and, with DS Complete, the volume that built it.",
    blurb:
      "Asia, London and New York, each bracketed over exactly its own bars in its own color, its high and low carried forward until that session opens again. DS Session Levels is free for everyone. DS Pro Session Levels adds each session's volume profile and carries its POC forward as a level beside the high and low — it comes free with DS Complete and is not sold on its own.",
  },
  {
    key: "essentials",
    short: "Essentials",
    name: "Free essentials",
    tagline: "The chart, easier to read and easier to drive.",
    blurb:
      "The price line, the price readout, the Nasdaq level map, the higher-timeframe matrix and the rail that switches every DS indicator on and off. Free permanently — no trial clock, and nothing removed to make room for a paid version.",
  },
  {
    key: "utility",
    short: "Utility",
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
  const same = ps.every(
    (p) => p && p.free === first.free && p.withComplete === first.withComplete && p.now === first.now && p.list === first.list,
  );
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
    "Every DS Universe product — the flagship indicators, the Pro Series panels, the session levels, the data utility, and the free essentials with the rail that runs them — in one permanent license, with DS Pro Session Levels, which comes only with it.",
  /** The one line beside the DS Complete chart (CompleteKeystone.tsx). */
  lede: "Every DS Universe product, built to run together on one chart — in one permanent license.",
  /** The four hooks from the sheet, minus the count. */
  points: [
    "Every product, one purchase",
    "Every free essential included",
    "DS Pro Session Levels, only in DS Complete",
    "Each product keeps its own permanent license",
    "Built to run together on one chart",
  ],
  /** The box render — the Whop listing's art. The site shows the drawn chart instead (2026-09-29). */
  art: "/boxart/0920/complete-v2.webp",
} as const;

/**
 * THE FOUNDERS SALE on DS Complete (Tom, 2026-09-28: "This is a Founders Sale
 * for the Complete, The 50% off won't last. Make it known ... Not sure when
 * the sale will complete. make it more know that its a $749.90 value").
 *
 * ONE SWITCH. Every mention of the sale on the site reads this object: the
 * strip across the DS Complete panel, the "founders price" label, the
 * button's words, the /products price row and the line on every product page
 * (the note under the button was dropped on 2026-09-29 when the panel was
 * dialed down — the strip already says it). When the sale ends, set `active: false` (and update COMPLETE.now /
 * whopAnchor to the new Whop price) — nothing else needs touching.
 *
 * HONEST URGENCY. There is no end date, so there is no countdown and no date
 * on the page: it says the founders price is temporary and that DS Complete
 * costs more after it, which is true. The "$749.90 value" is not a made-up
 * "was" price — it is APART, the real sum of the paid products' own prices,
 * computed below and checked against Whop at build time.
 */
export const FOUNDERS = {
  active: true,
  name: "Founders Sale",
  /** Across the top of the DS Complete panel. */
  strip: "50% off DS Complete — the founders price won't last",
  /** The buy button's words while the store is open. */
  cta: "Buy at the founders price",
} as const;

/**
 * THE FOUNDERS GIFT (Tom, 2026-09-30): DS Pro Session Levels is free ONLY to
 * DS Complete buyers — "a little thank you to the Founders", at no cost. It is
 * inside the DS Complete archive, with its README and guides, and is not sold
 * on its own (its README, word for word: "It comes free with DS Complete, and
 * is not sold on its own").
 *
 * Every mention on the site reads this object: the gift line in the DS
 * Complete panel, its ledger mark, the Session levels panel, the product page,
 * the tile and the FAQ. While the Founders Sale runs it is named a Founders
 * gift; when FOUNDERS.active goes false it reads "Only in DS Complete" — the
 * product stays in DS Complete either way, so nothing else changes.
 */
export const GIFT = {
  slug: "pro-session-levels",
  name: "DS Pro Session Levels",
  label: FOUNDERS.active ? "Founders gift" : "Only in DS Complete",
  /** After the product's name. */
  line: "free with DS Complete, not sold on its own",
  /** For people who already own DS Complete — its README's own promise. */
  owners:
    "Already own DS Complete? It is added to your license at no charge — update DS Complete to the version that includes it. Nothing to buy, nothing to send.",
} as const;

/** What the paid products cost bought one at a time. COMPUTED. */
export const APART = round2(
  Object.values(PRICES).reduce((n, p) => n + (isPaid(p) ? p.now : 0), 0),
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
if (!PRICES[GIFT.slug]?.withComplete) {
  throw new Error(`content/pricing.ts: the Founders gift (${GIFT.slug}) must be priced WITH_COMPLETE.`);
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** "$79.99". Always two decimals — every price here has cents. */
export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The single line a tile shows. */
export const tilePrice = (p: Price | undefined) =>
  !p ? "" : p.free ? "Free" : p.withComplete ? "With DS Complete" : money(p.now);

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
    text: "The chart essentials, DS Session Levels and the DS Toolkit rail cost nothing, permanently. Not a trial, not a stripped build.",
  },
  {
    title: "One bundle",
    text: "DS Complete is every product at once, for half of what the paid ones cost bought separately — and the only way to get DS Pro Session Levels.",
  },
];
