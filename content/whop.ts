/**
 * Where a buy button goes — the commerce layer.
 *
 * TOM: this is the only file to edit when a Whop link changes.
 *
 * The sixteen listing URLs below were supplied by Tom on 2026-09-20 and EACH ONE
 * WAS OPENED and its title and price read off the live page before it was wired
 * (see the table at the top of content/pricing.ts). Whop gave some of them a
 * random suffix ("-8f", "-fb") — use exactly what Whop gives you, do not tidy.
 *
 * Every button goes to the product's LISTING on Whop, not a bare checkout: the
 * listing carries the description and the reviews, and while the store is on a
 * waitlist (content/launch.ts) its button IS the waitlist form, so our button
 * and the page it opens say the same thing. If direct checkout links
 * (https://whop.com/checkout/plan_xxxxxxxxx) are made later, add them as
 * `checkout` and the product page's main button prefers them automatically.
 *
 * Later: Whop's embedded checkout (docs.whop.com/payments/checkout-embed) can
 * host the payment window inline using the plan id inside a checkout URL.
 */

import { onWaitlist } from "./launch";
import { PRICES } from "./pricing";

export type WhopListing = {
  /** The product's page on Whop — its price, description and reviews. */
  product: string;
  /** Direct checkout link, when one exists. */
  checkout?: string;
};

export const STORE = "https://whop.com/dsuniverse";
const L = (path: string): WhopListing => ({ product: `${STORE}/${path}/` });

export const WHOP: Record<string, WhopListing> = {
  // ---- flagship indicators ($79.99, verified) ----
  zones: L("ds-zones-living-supply-demand-structure-ninjatrader-8"),
  iceberg: L("ds-iceberg-hidden-absorption-refill-detection-ninjatrader-8"),
  oracle: L("ds-oracle-ai-confirmed-supertrend-neural-line-ninjatrader-8"),
  gex: L("ds-gex-dealer-gamma-levels-fetched-live-ninjatrader-8-fb"),
  flow: L("ds-flow-volume-by-price-footprint-ninjatrader-8"),
  // ---- Pro Series ($79.99, verified) ----
  prorsi: L("ds-prorsi-rsi-crossovers-as-price-levels-ninjatrader-8"),
  prostochastics: L("ds-prostochastics-quad-rotation-stochastics-ninjatrader-8"),
  prosqueeze: L("ds-prosqueeze-squeeze-waves-reversion-ninjatrader-8"),
  promacd: L("ds-promacd-volatility-normalised-macd-cross-price-ninjatrader-8-8f"),
  // ---- data utility ($29.99, verified) ----
  "bulk-replay-downloader": L("ds-bulk-replay-downloader-bulk-replay-data-ninjatrader-8"),
  // ---- free essentials (no price on Whop, verified) ----
  "adaptive-priceline": L("ds-adaptive-price-line-self-anchoring-line-countdown-ninjatrader-8"),
  "chart-price": L("ds-chart-price-large-readout-chop-detection-ninjatrader-8"),
  "ds-258": L("ds-258-nasdaq-00-20-50-80-level-map-ninjatrader-8"),
  parallax: L("ds-parallax-multi-timeframe-liquidity-matrix-ninjatrader-8"),
  toolkit: L("ds-toolkit-one-rail-for-every-indicator-tool-ninjatrader-8"),
  // ---- the bundle ($749.90 -> $374.95, verified) ----
  complete: L("ds-complete-all-15-ds-universe-products-one-license-ninjatrader-8"),
};

export const listingFor = (key: string): WhopListing | undefined => WHOP[key];

/** The main button's destination: a direct checkout if we have one, else the listing. */
export const buyHref = (l: WhopListing) => l.checkout ?? l.product;

/**
 * The button's words. While the store is on a waitlist every button says what
 * Whop's own page says — "Join waitlist" — so a click never promises more than
 * the next page does. Free products say "Get it free" when open (Whop's own page
 * says "Join for free").
 */
export const buyLabel = (key: string) =>
  onWaitlist() ? "Join the waitlist" : PRICES[key]?.free ? "Get it free" : "Get access";
