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
 *   · Every paid product is sold on its own, at one flat, permanent price.
 *   · Every paid indicator: $79.99, one payment (was shown as $99.99 -> $79.99
 *     until 2026-09-26; see below).
 *   · DS Bulk Replay Downloader: $29.99, 0% off, and it stays that way.
 *   · ONE bundle, DS Complete: the paid products, DS ASL and DS Toolkit, 50%
 *     off what the paid ones cost bought one at a time. DS ASL and DS Toolkit
 *     are NOT sold on their own — each comes free with DS Complete
 *     (WITH_COMPLETE, and WITH_BUNDLE below) and adds $0 to that sum.
 *   · THE FREE VAULT (Tom, 2026-10-05): the free products stand apart. Each is
 *     its own free listing and its own download; none is part of DS Complete.
 *   · DS TOOLKIT (Tom, 2026-10-05, later the same day): "DS Toolkit will come
 *     FREE with the purchase of DS Complete Bundle only, same as DS ASL." It
 *     left the Free Vault; it has no listing and no download of its own.
 *
 * THE LINEUP OF 2026-10-05 (Master sheet, Pricing tab — its own checks: single
 * prices sum to $749.90, DS Complete $374.95): DS ProLiquidityHunter and
 * DS ProHeikinAshi joined the Pro Series at $79.99; DS Stochastics and
 * DS Squeeze left it and are free; DS MACD is back, free; DS VWAP is new, free.
 * Nine indicators at $79.99 + $29.99 is still $749.90, so DS Complete's
 * arithmetic did not move. The six new Whop listings were wired the same
 * night (content/whop.ts); nothing is pending.
 *
 * 2026-09-26: Tom took the $99.99 compare-at price off all nine indicator
 * listings on Whop (it had never been a price anyone paid — FTC 16 CFR 233.1),
 * so every indicator is now ONE number, $79.99, with nothing crossed out. The
 * only struck figure left anywhere is DS Complete's $749.90, which is the real
 * sum of the paid products. Re-read on Whop 2026-09-26.
 *
 * THE NUMBERS OF THE 09-20 LINEUP WERE READ OFF THE LIVE WHOP LISTINGS on
 * 2026-09-20, every page opened one by one (the listings were in waitlist mode):
 *   nine paid indicators   $99.99 struck -> $79.99  (20% off)
 *   DS Complete            $749.90 struck -> $374.95 (50% off)
 *   DS Bulk Replay         $29.99, nothing crossed out (the old $37.49 anchor is
 *                          gone from Whop — re-checked 2026-09-25)
 *   the free products      "Free" on Whop
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
  /** Not sold on its own: it comes free with DS Complete (DS ASL, DS Toolkit).
   *  It adds nothing to APART and nothing to the discount — it is a reason to
   *  choose the bundle. */
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
  proliquidityhunter: flat(79.99), // 2026-10-05
  proheikinashi: flat(79.99), // 2026-10-05
  protrendrange: flat(79.99),
  // ---- data utility — no discount, by rule --------------------------------
  "bulk-replay-downloader": flat(29.99),
  // ---- free with DS Complete, not sold on their own ---------------------------
  asl: WITH_COMPLETE,
  toolkit: WITH_COMPLETE, // 2026-10-05: out of the Free Vault, into the bundle
  // ---- the Free Vault ---------------------------------------------------
  "adaptive-priceline": FREE,
  "chart-price": FREE,
  "ds-258": FREE,
  parallax: FREE,
  "session-levels": FREE,
  stochastics: FREE,
  squeeze: FREE,
  macd: FREE,
  vwap: FREE,
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
    tagline: "One panel under your candles each, built to say something about price.",
    blurb:
      "RSI crossovers left on the chart as levels, a liquidity map with measured reach odds, Heikin-Ashi with its flip level as a real price, and the trend with its pullbacks — each a single panel under your candles, decided on closed bars.",
  },
  {
    key: "utility",
    short: "Utility",
    name: "Data utility",
    tagline: "A Market Replay library, queued once and left to run.",
    blurb:
      "Queue every instrument and date you want and it fetches NinjaTrader's own replay data unattended, file by file, skipping the days you already have.",
  },
  {
    // DS ASL and DS Toolkit. Not a shelf in the store: they are shown as part
    // of DS Complete, which is the only way to get them (content/release.ts
    // STORE_SHELVES). The name is the one label the site uses for both.
    key: "exclusive",
    short: "Free with DS Complete",
    name: "Free with DS Complete",
    tagline: "Advanced Session Levels, and the rail that switches every DS indicator on and off.",
    blurb:
      "DS ASL draws each session's volume profile inside its bracket and carries its POC forward as a level beside the high and low. DS Toolkit is one rail on the chart: every DS indicator as an on/off row, your drawing tools underneath. Each comes free with DS Complete and is not sold on its own.",
  },
  {
    // THE FREE VAULT (2026-10-05). Its own page, /free-vault — never a shelf
    // in the store and never part of DS Complete.
    key: "vault",
    short: "Free Vault",
    name: "Free Vault",
    tagline: "Free indicators and tools for NinjaTrader 8, each its own download.",
    blurb:
      "The price line, the price readout, the Nasdaq level map, the higher-timeframe matrix, the session levels, and the stochastics, squeeze, MACD and VWAP panels. Free permanently — no trial clock, and nothing removed to make room for a paid version.",
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

/** "DS Zones, DS Iceberg and DS Flow" — the house list style, no serial comma. */
const listOf = (names: string[]) =>
  names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
const namesIn = (key: Series) => PRODUCTS.filter((p) => p.series === key).map((p) => p.name);

/**
 * FREE WITH DS COMPLETE — the products that are not sold or offered on their
 * own and come free with the bundle. Two of them, presented identically:
 *
 *   DS ASL      Advanced Session Levels (until 2026-10-05: DS Pro Session
 *               Levels, presented as a "Founders gift").
 *   DS Toolkit  the rail. Until 2026-10-05 a free download of its own; Tom:
 *               "DS Toolkit will come FREE with the purchase of DS Complete
 *               Bundle only, same as DS ASL."
 *
 * ONE WORDING for both, everywhere (Tom's standard, 2026-10-05):
 *   label     "Free with DS Complete"
 *   sentence  "comes free with DS Complete and is not sold on its own"
 * Every mention on the site reads WITH_BUNDLE and BUNDLED: the lines in the
 * DS Complete panel, the ledger marks, the product pages, the tiles and the
 * FAQ. Nothing else types either phrase.
 */
export const WITH_BUNDLE = {
  label: "Free with DS Complete",
  /** After a product's name. */
  line: "comes free with DS Complete and is not sold on its own",
  /** The same sentence about several products at once. */
  lineAll: "come free with DS Complete and are not sold on their own",
  /** Beside the label where there is room for only a few words. */
  short: "Not sold on its own",
} as const;

export type Bundled = {
  slug: string;
  name: string;
  /** What it is, in a few words — said once beside the name. */
  long: string;
  /** In the DS Complete panel, after the name: what it adds. No full stop. */
  panel: string;
  /** Under the price on its own page: what a buyer needs to know before
   *  checking out. A fact about that product, never a sales line. */
  note: string;
};

export const BUNDLED: readonly Bundled[] = [
  {
    slug: "asl",
    name: "DS ASL",
    long: "Advanced Session Levels",
    panel: "Advanced Session Levels: each session's volume profile and POC",
    /** For people who already own DS Complete — its README's own promise. */
    note: "Already own DS Complete? It is added to your license at no charge — update DS Complete to the version that includes it. Nothing to buy, nothing to send.",
  },
  {
    slug: "toolkit",
    name: "DS Toolkit",
    long: "the rail that switches every DS indicator on a chart on and off",
    panel: "one rail on the chart: every DS indicator on or off in one click, your drawing tools underneath",
    /** Two copies of one assembly clash in NinjaTrader, so an earlier
     *  stand-alone DS Toolkit has to go before DS Complete is imported. Kept
     *  general on purpose: the steps are the DS Complete README's to give. */
    note: "Installed an earlier DS Toolkit? It is inside DS Complete now, and two copies clash: remove the DS products you installed one by one, including an earlier DS Toolkit, and restart NinjaTrader before importing DS Complete. Its README walks you through it.",
  },
];
export const bundledFor = (slug: string): Bundled | undefined => BUNDLED.find((b) => b.slug === slug);
/** "DS ASL and DS Toolkit" — named from the list, so the sentence follows it. */
export const BUNDLED_NAMES = listOf(BUNDLED.map((b) => b.name));

export const COMPLETE = {
  key: "complete",
  name: "DS Complete",
  /** What it costs. Read off Whop, 2026-09-20. */
  now: 374.95,
  /** The struck-through figure on Whop. Must equal APART — checked below. */
  whopAnchor: 749.9,
  /**
   * The sheet's own description of DS Complete (Product Details, 2026-10-05),
   * with its typed counts left out and every product NAMED from the catalogue,
   * so the sentence cannot go stale when the lineup changes.
   */
  blurb: `DS Complete is the whole paid DS Universe lineup, licensed once. It bundles the flagship indicators (${listOf(namesIn("flagship"))}), the Pro Series panels (${listOf(namesIn("pro"))}) and ${listOf(namesIn("utility"))}. ${BUNDLED_NAMES} ${BUNDLED.length > 1 ? WITH_BUNDLE.lineAll : WITH_BUNDLE.line}.`,
  /** What DS Complete does NOT hold. (The sheet's sentence said "the free DS
   *  Universe products"; it names the vault here, because two products now
   *  come free WITH DS Complete and the two must not be confused.) */
  apart: "The Free Vault products are not part of DS Complete: each is its own download and runs beside it.",
  /** The one line beside the DS Complete chart (CompleteKeystone.tsx). */
  lede: "Every paid DS Universe product, built to run together on one chart — in one permanent license.",
  /** The sheet's hooks (its "$374.95 vs. $749.90 apart" is the panel's own price row, computed). */
  points: [
    "Every paid product, one purchase",
    `${BUNDLED_NAMES}, free with DS Complete`,
    "Every product keeps its own permanent license",
    "Built together, owned together",
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
 * button's words, the /products price row and the line on every paid product
 * page. When the sale ends, set `active: false` (and update COMPLETE.now /
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
/* PAID AND FREE ARE KEPT APART (2026-10-05), and so is what comes with the
   bundle. Three kinds of price, three places, each tied to the other both ways:
     free            <=>  the "vault" series      (the Free Vault)
     with DS Complete <=>  the "exclusive" series  (free with the bundle, no
                                                   listing of its own)
     a paid price    <=>  every other series      (the store)
   So "free" can never drift back onto a store shelf or into DS Complete, and
   a product that comes with the bundle can never be offered as a download of
   its own (DS Toolkit was one until 2026-10-05). */
for (const p of PRODUCTS) {
  const price = PRICES[p.slug];
  const free = !!price?.free;
  if (free !== (p.series === "vault")) {
    throw new Error(`content/pricing.ts: "${p.slug}" is ${free ? "free but not in the Free Vault" : "in the Free Vault but not free"}.`);
  }
  const bundled = !!price?.withComplete;
  if (bundled !== (p.series === "exclusive")) {
    throw new Error(
      `content/pricing.ts: "${p.slug}" is ${bundled ? "priced WITH_COMPLETE but not in the \"exclusive\" series" : "in the \"exclusive\" series but not priced WITH_COMPLETE"}.`,
    );
  }
  if (bundled !== BUNDLED.some((b) => b.slug === p.slug)) {
    throw new Error(
      `content/pricing.ts: "${p.slug}" ${bundled ? "comes free with DS Complete but has no entry in BUNDLED" : "is in BUNDLED but is not priced WITH_COMPLETE"}.`,
    );
  }
}
for (const b of BUNDLED) {
  const p = PRODUCTS.find((x) => x.slug === b.slug);
  if (!p) throw new Error(`content/pricing.ts: BUNDLED lists "${b.slug}", which is not in the catalogue.`);
  if (p.name !== b.name) throw new Error(`content/pricing.ts: BUNDLED's name for "${b.slug}" no longer matches the catalogue's.`);
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** "$79.99". Always two decimals — every price here has cents. */
export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The single line a tile shows. */
export const tilePrice = (p: Price | undefined) =>
  !p ? "" : p.free ? "Free" : p.withComplete ? WITH_BUNDLE.label : money(p.now);

/**
 * How we sell, said once. NinjaTrader's vendor guidelines forbid superlatives,
 * which is just as well — these terms do not need one.
 */
export const TERMS: { title: string; text: string; link?: { href: string; label: string } }[] = [
  {
    title: "One payment",
    text: "Buy a product once and it is yours. There is no subscription, no renewal and no clock running against you.",
  },
  {
    title: "Updates included",
    text: "Every later version of what you bought, at no extra cost.",
  },
  {
    title: "One bundle",
    text: `DS Complete is every paid product at once, for half of what they cost bought separately. ${BUNDLED_NAMES} ${BUNDLED.length > 1 ? WITH_BUNDLE.lineAll : WITH_BUNDLE.line}.`,
  },
  {
    title: "The Free Vault is separate",
    text: "The Free Vault products are not in the store and not in DS Complete. Each is its own download, free permanently — not a trial, not a stripped build.",
    link: { href: "/free-vault", label: "Open the Free Vault" },
  },
];
