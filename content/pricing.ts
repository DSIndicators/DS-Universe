/**
 * Prices. ONE file — every number the site shows comes from here.
 *
 * TOM: the site's price must always match Whop. If you change a price there,
 * change it here in the same sitting. Nothing else in the codebase hard-codes
 * a number.
 *
 * Verified against the live Whop checkout pages on 2026-09-10:
 *   five paid indicators   $99.99 list  ->  $79.99 Founders
 *   Screener, Bulk Replay  $99.99 list  ->  $79.99 Founders
 *   the other ten          free
 *
 * Presentation rule (Tom, 2026-09-10): ONE list price and ONE Founders price.
 * The old spreadsheet also carried a "bundled" column identical to the sum of
 * the individual sale prices — two anchors saying the same thing. It is gone.
 * Never show a struck-through number that was not a real price.
 */

export type Price =
  | { free: true; list?: undefined; now?: undefined; bundleOnly?: undefined }
  | { free?: undefined; list: number; now: number; bundleOnly?: undefined }
  /** Not sold on its own — it arrives with a bundle. */
  | { bundleOnly: true; free?: undefined; list?: undefined; now?: undefined };

export const PRICES: Record<string, Price> = {
  // ---- indicators ----
  oracle: { list: 99.99, now: 79.99 },
  iceberg: { list: 99.99, now: 79.99 },
  sonar: { list: 99.99, now: 79.99 },
  zones: { list: 99.99, now: 79.99 },
  gex: { list: 99.99, now: 79.99 },
  flow: { free: true },
  parallax: { free: true },
  "isotropic-lines": { free: true },
  "adaptive-priceline": { free: true },
  "chart-price": { free: true },

  // ---- add-ons ----
  screener: { list: 99.99, now: 79.99 },
  "bulk-replay-downloader": { list: 99.99, now: 79.99 },
  marketwatch: { free: true },
  "time-intervals": { free: true },
  toolkit: { bundleOnly: true },
};

export const priceFor = (slug: string): Price | undefined => PRICES[slug];

/** "$79.99" — no trailing .00, because every price here ends in .99 anyway. */
export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The one-line label a tile shows. */
export function tilePrice(p: Price | undefined): string | null {
  if (!p) return null;
  if (p.free) return "Free";
  if (p.bundleOnly) return "In the bundle";
  return money(p.now);
}

/**
 * How we sell, said once. This is the actual differentiator — the indicator
 * market runs on subscriptions and $200-$900 one-time licences (checked
 * 2026-09-10 against ninza.co and tradedevils-indicators.com). Being a third
 * of that is the story; it does not need an adjective, which is just as well
 * because NinjaTrader's guidelines ban them.
 */
export const TERMS = [
  { title: "One payment", text: "Buy it once. There is no subscription and no renewal." },
  { title: "Updates included", text: "Every later version of what you bought, at no extra cost." },
  { title: "Much of it is free", text: "A good part of the lineup costs nothing, permanently. No trial clock, no email wall." },
];

/**
 * Bundles. Every price below was READ OFF THE LIVE WHOP PAGE on 2026-09-10 —
 * do not compute them from the individual prices, Tom sets each bundle's own
 * list anchor in Whop and they are not the sum of the parts.
 *
 *   Complete   $333.32 -> $299.99   (10% off)
 *   Indicators $299.99 -> $239.99   (20% off)
 *   Add-ons    $155.54 -> $139.99   (10% off)  <- re-read 2026-09-10 evening
 *
 * The add-on bundle used to be $159.99, a penny MORE than buying both add-ons
 * separately ($79.99 x 2 = $159.98). Tom repriced it; at $139.99 it saves
 * $19.99 against the pair and is a real bundle. If you change a price on Whop,
 * open the page and read BOTH numbers — the list anchor moves too (this one
 * went from $199.99 to $155.54, and the discount from 20% to 10%).
 *
 * A tier with no `checkout` renders "Coming soon" rather than a dead button.
 */
export type Tier = {
  key: string;
  name: string;
  blurb: string;
  list: number;
  now: number;
  includes: string[];
  /** How many paid products are actually in it — drives the per-unit line.
      Set it explicitly; `includes` may hold summary lines, not one per tool. */
  unitCount?: number;
  bonus?: string;
  /** Wide lineup art (about 2.36:1). Cards without it fall back to type alone. */
  art?: string;
  checkout?: string;
  feature?: boolean;
  live?: boolean;
};

export const TIERS: Tier[] = [
  {
    key: "complete",
    name: "DS Universe Complete",
    blurb: "Every indicator and every add-on, bought once. The cheapest route to all of it by a wide margin.",
    list: 333.32,
    now: 299.99,
    includes: ["Every paid indicator", "Every paid add-on", "DS Toolkit"],
    unitCount: 7,
    bonus: "Buying the two bundles separately comes to $399.98.",
    art: "/covers/bundle-complete.webp",
    feature: true,
    checkout: "https://whop.com/dsuniverse/products/ds-universe-complete/",
  },
  {
    key: "indicators",
    name: "DS Indicator Bundle",
    blurb: "The paid engines, with the rail that runs them.",
    list: 299.99,
    now: 239.99,
    includes: ["DS Oracle", "DS Iceberg", "DS Sonar", "DS Zones", "DS GEX"],
    unitCount: 5,
    bonus: "DS Toolkit included — it is not sold separately.",
    art: "/covers/bundle-indicators.webp",
    checkout: "https://whop.com/dsuniverse/products/ds-indicator-bundle/",
  },
  {
    key: "addons",
    name: "DS Add-On Bundle",
    blurb: "Screen the session live, then replay the same day bar by bar.",
    list: 155.54,
    now: 139.99,
    includes: ["DS Screener", "DS Bulk Replay Downloader"],
    art: "/covers/bundle-addons.webp",
    checkout: "https://whop.com/dsuniverse/products/ds-add-on-bundle/",
  },
];

export const LIVE_TIERS = TIERS.filter((t) => t.live !== false);

/**
 * Per-unit maths, computed not typed, so it can never drift from the price.
 * Returns null unless the tier declares how many products it really contains —
 * `includes` can hold summary lines ("Every paid indicator"), and dividing by
 * those would print a confident wrong number.
 */
export const perUnit = (t: Tier) => (t.unitCount ? t.now / t.unitCount : null);
export const savedPct = (t: Tier) => Math.round((1 - t.now / t.list) * 100);
