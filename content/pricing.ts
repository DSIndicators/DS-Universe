/**
 * Prices. ONE file — every number the site shows comes from here, and every
 * sentence that states a price reads it from here, never types it.
 *
 * TOM: the site's price must always match Whop. Change a price there, change it
 * here in the same sitting. Nothing else in the codebase holds a number.
 *
 * ---------------------------------------------------------------------------
 * THE v3.1 MODEL (Tom, 2026-10-29; supersedes every earlier model)
 *
 *   · FREE AND AFFORDABLE. Every free tool stays free (the Free Vault), and
 *     every paid tool comes in ONE low-priced bundle, DS Complete.
 *   · DS COMPLETE is the only paid product: every paid DS tool on one license
 *     (product ID 2817, "DS Complete Essentials Bundle"), one assembly
 *     (DSCompleteBundleSuite), one import. No paid product is sold on its own:
 *     there are no per-product prices any more.
 *   · FOUNDERS PRICE: $39.99 a month, or $149.99 to own the set (one-time).
 *     It holds UNTIL FOUNDER SLOTS ARE FILLED — never print a number of slots
 *     (Tom's decision). Later DS Complete prices only go up as indicators join.
 *     Founders on 2817 get every future indicator and every update at no extra
 *     cost.
 *   · 7-DAY FREE TRIAL on DS Complete, set on 2817: NinjaTrader starts it the
 *     first day a tool is used, one trial per account (content/trial.ts).
 *   · The Free Vault: free, no license, each its own download, never part of
 *     DS Complete.
 *
 * Retired with v3.1: the $79.99 / $29.99 single prices, the $749.90 "value",
 * the $374.95 bundle, the "50% off" Founders Sale and "free with DS Complete".
 * The record is DS-Universe-White's previous pricing.ts in the archive
 * snapshot and the Master sheet's Parked tab.
 * ---------------------------------------------------------------------------
 */

import { PRODUCTS, type Series } from "./products";

export type Price =
  /** Free, permanently. Not a trial and not a stripped build. */
  | { free: true; inComplete?: undefined }
  /** Paid: it comes in DS Complete and is not sold on its own. */
  | { inComplete: true; free?: undefined };

const FREE: Price = { free: true };
const IN_COMPLETE: Price = { inComplete: true };

/** Every product's price follows from its group: the Free Vault is free,
 *  everything else is in DS Complete. Kept as a function of the catalogue so
 *  the two can never disagree. */
export const PRICES: Record<string, Price> = Object.fromEntries(
  PRODUCTS.map((p) => [p.slug, p.series === "vault" ? FREE : IN_COMPLETE]),
);

export const priceFor = (slug: string): Price | undefined => PRICES[slug];

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** "$39.99". Always two decimals — every price here has cents. */
export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "DS Zones, DS Iceberg and DS Flow" — the house list style, no serial comma. */
export const listOf = (names: string[]) =>
  names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/* -------------------------------------------------------------------------- */
/* DS Complete — the only paid product.                                        */
/* -------------------------------------------------------------------------- */

export const COMPLETE = {
  key: "complete",
  name: "DS Complete",
  /** The founders price, monthly. Read off the v3.1 hand-off (Master sheet, Pricing tab). */
  monthly: 39.99,
  /** The founders price to own the set, one-time. */
  own: 149.99,
  /** The 7-day free trial, set on the one license. */
  trialDays: 7,
  /** The one license every paid product calls (VendorLicense(2817)). */
  license: 2817,
  /** The one assembly it installs as — the name NinjaTrader shows in Tools → Remove NinjaScript Assembly. */
  assembly: "DSCompleteBundleSuite",
} as const;

/** "$39.99 a month" / "$149.99 to own" — said the same way everywhere. */
export const PRICE_MONTHLY = `${money(COMPLETE.monthly)} a month`;
export const PRICE_OWN = `${money(COMPLETE.own)} to own`;

/**
 * THE FOUNDERS PRICE (Tom, 2026-10-29). ONE SWITCH: every mention reads this.
 * HONEST URGENCY: no end date, no countdown and NO NUMBER OF SLOTS — it says
 * the price holds until founder slots are filled and that DS Complete only
 * costs more later, both of which are true.
 */
export const FOUNDERS = {
  active: true,
  /** The kicker over the DS Complete band. */
  kicker: "Founders price",
  /** When it ends — never a number. */
  until: "until founder slots are filled",
  /** What founders keep. */
  keeps: "every future indicator and every update at no extra cost",
  /** Where the price goes. */
  rising: "As more indicators join, the price of DS Complete will only go up.",
} as const;

/* -------------------------------------------------------------------------- */
/* The groups. Copy per group; membership comes from products.ts.               */
/* -------------------------------------------------------------------------- */

export type SeriesInfo = {
  key: Series;
  name: string;
  /** Sits under the name. One line. */
  tagline: string;
};

/** The README's own groups, in its order. */
export const SERIES: SeriesInfo[] = [
  {
    key: "chart",
    name: "On the price chart",
    tagline: "Structure, the side that holds, the bar read for you, hidden size, order flow, dealer levels and session volume.",
  },
  {
    key: "panel",
    name: "In a panel of their own",
    tagline: "One panel under your candles each, built to say something about price.",
  },
  {
    key: "addon",
    name: "Add-ons",
    tagline: "A Market Replay library queued once, and one rail that runs every DS tool on the chart.",
  },
  {
    // THE FREE VAULT. Its own page, /free-vault — never a shelf in the store
    // and never part of DS Complete.
    key: "vault",
    name: "Free Vault",
    tagline: "Free indicators and tools for NinjaTrader 8, each its own download.",
  },
];

export const seriesInfo = (key: Series) => SERIES.find((s) => s.key === key)!;

const namesIn = (key: Series) => PRODUCTS.filter((p) => p.series === key).map((p) => p.name);
/** "DS Toolkit" is listed as "DS Toolkit (with DS Chalk)", as the README does. */
const shown = (name: string) => (name === "DS Toolkit" ? "DS Toolkit (with DS Chalk)" : name);

/** What DS Complete holds, group by group — named from the catalogue, never typed. */
export const COMPLETE_GROUPS = SERIES.filter((s) => s.key !== "vault").map((s) => ({
  key: s.key,
  name: s.name,
  names: namesIn(s.key).map(shown),
}));

/** The approved v3.1 wording (Website copy v3.1.md), with every price and name read from data. */
export const COMPLETE_COPY = {
  headline: "Every paid DS tool. One license. One low price.",
  body: `DS Complete holds every paid DS Universe tool on one license, so there is nothing to buy or activate product by product. It costs ${PRICE_MONTHLY}, or ${money(COMPLETE.own)} to own the whole set outright, at the founders price ${FOUNDERS.until}. As a founder, every indicator added to DS Complete later, and every update, comes to you at no extra cost. ${FOUNDERS.rising}`,
  points: [
    "Founders price, every paid DS tool",
    `${PRICE_MONTHLY} or ${PRICE_OWN}`,
    "Every future indicator included",
    `Try every tool free for ${COMPLETE.trialDays} days`,
  ],
  trial: `Try DS Complete free for ${COMPLETE.trialDays} days first. NinjaTrader starts the trial the first day you use a tool, one trial per account.`,
  /** The checkout's own terms, set beside every trial button (FTC 16 CFR 251.1(c);
   *  ROSCA: a free trial that becomes a subscription says so before checkout).
   *  Read off the live checkout, plan_BDcgf0PEsWLeP, 2026-10-29. */
  billing: `${COMPLETE.trialDays} days free, then ${PRICE_MONTHLY} until you cancel. Checkout asks for a card; nothing is charged today, and cancelling in your Whop account before day ${COMPLETE.trialDays + 1} means nothing is charged at all.`,
  apart: "The Free Vault is not part of DS Complete. Each free tool is its own download, needs no license and runs beside it.",
  /** On every paid product page, in place of a price of its own. */
  onProduct: `Comes in DS Complete: every paid DS tool on one license, at the founders price of ${PRICE_MONTHLY} or ${PRICE_OWN}. Try it free for ${COMPLETE.trialDays} days.`,
  /** The line to DS Complete on the Free Vault page. */
  fromVault: `When you want the rest of the suite, every paid DS tool is in DS Complete at the founders price of ${PRICE_MONTHLY} or ${PRICE_OWN}.`,
  /** Under the founders price on a paid product page. */
  founders: `Founders keep ${FOUNDERS.keeps}.`,
  buttons: {
    trial: `Start the ${COMPLETE.trialDays}-day free trial`,
    own: `Own it for ${money(COMPLETE.own)}`,
  },
} as const;

/** The short label a tile or a row shows. */
export const IN_COMPLETE_LABEL = "In DS Complete";
export const tilePrice = (p: Price | undefined) => (!p ? "" : p.free ? "Free" : IN_COMPLETE_LABEL);

/**
 * How we sell, said once (the store's terms band). NinjaTrader's vendor
 * guidelines forbid superlatives, which is just as well — these terms do not
 * need one.
 */
export const TERMS: { title: string; text: string; link?: { href: string; label: string } }[] = [
  {
    title: "One license",
    text: `Every paid DS tool is in DS Complete, on one license tied to your NinjaTrader account, delivered as one import. Nothing is sold or activated product by product.`,
  },
  {
    title: "Founders price",
    text: `${PRICE_MONTHLY}, or ${money(COMPLETE.own)} to own the set outright, ${FOUNDERS.until}. ${FOUNDERS.rising}`,
  },
  {
    title: "Everything that comes next",
    text: `Founders get ${FOUNDERS.keeps}: the new tools join your DS Complete as they are built.`,
  },
  {
    title: "The Free Vault is separate",
    text: "Free for good, each its own download, no license. Not part of DS Complete, and not a trial or a stripped build.",
    link: { href: "/free-vault", label: "Open the Free Vault" },
  },
];

/* -------------------------------------------------------------------------- */
/* Build-time checks                                                           */
/* -------------------------------------------------------------------------- */

for (const p of PRODUCTS) {
  if (!PRICES[p.slug]) throw new Error(`content/pricing.ts: no price for "${p.slug}".`);
}
/* Every product sits in a known group, and the groups are not empty. */
for (const s of SERIES) {
  if (!PRODUCTS.some((p) => p.series === s.key)) throw new Error(`content/pricing.ts: the "${s.key}" group has no products.`);
}
for (const p of PRODUCTS) {
  if (!SERIES.some((s) => s.key === p.series)) throw new Error(`content/pricing.ts: "${p.slug}" is in an unknown group "${p.series}".`);
}
/* The approved copy must never carry a slot count or an old figure. */
{
  const all = JSON.stringify([COMPLETE_COPY, TERMS, FOUNDERS]);
  for (const bad of ["79.99", "29.99", "374.95", "749.90", "50%", "slots left", "free with DS Complete"]) {
    if (all.includes(bad)) throw new Error(`content/pricing.ts: retired wording "${bad}" is back in the copy.`);
  }
}
