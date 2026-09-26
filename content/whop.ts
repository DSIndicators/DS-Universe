/**
 * Where a buy button goes — the commerce layer.
 *
 * TOM: this is the only file to edit when a Whop link changes.
 *
 * TWO LINKS PER PRODUCT
 *   product  — the listing on Whop (description, FAQ, reviews). Supplied by Tom
 *              2026-09-20; each opened and its title and price read off the page.
 *   checkout — the DIRECT checkout for that product's one plan. Supplied by Tom
 *              2026-09-25 (store live). Tom's list was NOT in the same order as
 *              the listing list, so every plan was opened on whop.com and matched
 *              by the product name and price its checkout shows — never by
 *              position. All sixteen: one-time payment (or Free), and every one
 *              asks the required "NinjaTrader account email" question.
 *
 * Every buy button on the site goes to `checkout` (buyHref). The listing stays
 * reachable as a quiet "See it on Whop" link beside the main button.
 * Whop gave some listing paths a random suffix ("-8f", "-fb") — use exactly
 * what Whop gives you, do not tidy.
 */

import { onWaitlist } from "./launch";
import { PRICES } from "./pricing";

export type WhopListing = {
  /** The product's page on Whop — its price, description and reviews. */
  product: string;
  /** Direct checkout link for the product's plan. */
  checkout?: string;
};

export const STORE = "https://whop.com/dsuniverse";
const CHECKOUT = "https://whop.com/checkout";
const L = (path: string, plan: string): WhopListing => ({
  product: `${STORE}/${path}/`,
  checkout: `${CHECKOUT}/${plan}`,
});

export const WHOP: Record<string, WhopListing> = {
  // ---- flagship indicators ($79.99, checkout verified 2026-09-25) ----
  zones: L("ds-zones-living-supply-demand-structure-ninjatrader-8", "plan_ocxhFcbIMnpbi"),
  iceberg: L("ds-iceberg-hidden-absorption-refill-detection-ninjatrader-8", "plan_FMGkrNvXKFMzC"),
  oracle: L("ds-oracle-ai-confirmed-supertrend-neural-line-ninjatrader-8", "plan_ujtfTI9XElO8g"),
  gex: L("ds-gex-dealer-gamma-levels-fetched-live-ninjatrader-8-fb", "plan_Wos2cSDhY5RZp"),
  flow: L("ds-flow-volume-by-price-footprint-ninjatrader-8", "plan_G6CrISw6dNHR6"),
  // ---- Pro Series ($79.99, checkout verified 2026-09-25) ----
  prorsi: L("ds-prorsi-rsi-crossovers-as-price-levels-ninjatrader-8", "plan_BBivBWLYNMJhb"),
  prostochastics: L("ds-prostochastics-quad-rotation-stochastics-ninjatrader-8", "plan_ACebJTJOzyeH9"),
  prosqueeze: L("ds-prosqueeze-squeeze-waves-reversion-ninjatrader-8", "plan_sQ0Jx6UJRsggw"),
  promacd: L("ds-promacd-volatility-normalised-macd-cross-price-ninjatrader-8-8f", "plan_DLiExDW7gxE3R"),
  // ---- data utility ($29.99, checkout verified 2026-09-25) ----
  "bulk-replay-downloader": L("ds-bulk-replay-downloader-bulk-replay-data-ninjatrader-8", "plan_kKVlaEdC9dtgS"),
  // ---- free essentials (checkout shows "Free", verified 2026-09-25) ----
  "adaptive-priceline": L("ds-adaptive-price-line-self-anchoring-line-countdown-ninjatrader-8", "plan_XN3D0IC97yWP2"),
  "chart-price": L("ds-chart-price-large-readout-chop-detection-ninjatrader-8", "plan_E34eRRHcmYHD4"),
  "ds-258": L("ds-258-nasdaq-00-20-50-80-level-map-ninjatrader-8", "plan_LvWsdZ70h3x5m"),
  parallax: L("ds-parallax-multi-timeframe-liquidity-matrix-ninjatrader-8", "plan_RBOOqpI868f9W"),
  toolkit: L("ds-toolkit-one-rail-for-every-indicator-tool-ninjatrader-8", "plan_Ywx5wxsyuCStx"),
  // ---- the bundle ($374.95, checkout verified 2026-09-25) ----
  complete: L("ds-complete-all-15-ds-universe-products-one-license-ninjatrader-8", "plan_eVl3N0rb9CZQ2"),
};

/* Sixteen products, sixteen different plans — a pasted duplicate would send two
   products to one checkout, so the build refuses it. */
{
  const plans = Object.values(WHOP).map((w) => w.checkout);
  if (new Set(plans).size !== plans.length) {
    throw new Error("content/whop.ts: two products share one checkout plan.");
  }
  for (const slug of [...Object.keys(PRICES), "complete"]) {
    if (!WHOP[slug]?.checkout) throw new Error(`content/whop.ts: "${slug}" has no checkout link.`);
  }
}

export const listingFor = (key: string): WhopListing | undefined => WHOP[key];

/** The main button's destination: the direct checkout, else the listing. */
export const buyHref = (l: WhopListing) => l.checkout ?? l.product;

/**
 * The button's words. While the store is on a waitlist every button says what
 * Whop's own page says — "Join waitlist". Open: paid products say "Buy now"
 * (Whop's listing button says the same), free ones "Get it free".
 */
export const buyLabel = (key: string) =>
  onWaitlist() ? "Join the waitlist" : PRICES[key]?.free ? "Get it free" : "Buy now";
