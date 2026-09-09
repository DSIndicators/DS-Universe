/**
 * Where "Get access" goes — the commerce layer.
 *
 * TOM: this is the only file to edit when a product goes live on Whop.
 *
 *   product   the Whop product page. The buyer lands there, sees the price and
 *             the current offer, and buys. This is what ships today.
 *   checkout  OPTIONAL. A Whop checkout link (dashboard → Checkout links; they
 *             look like https://whop.com/checkout/plan_xxxxxxxxx). The moment
 *             you paste one in, that product's page grows a second button that
 *             skips the Whop page and opens the payment window directly.
 *   free      the product is free on Whop, so the button reads "Get it free"
 *             instead of "Get access" (Whop's own page says "Join for free").
 *
 * A product with NO entry here shows a quiet "Coming soon" instead of a buy
 * button — nobody is sent to a dead link. That is the five add-ons today.
 *
 * Later: Whop's embedded checkout (docs.whop.com/payments/checkout-embed) needs
 * a plan id per product; add `planId` here and the product page can host the
 * checkout inline. The shape below is ready for it.
 */

export type WhopListing = {
  product: string;
  checkout?: string;
  planId?: string;
  free?: boolean;
};

const STORE = "https://whop.com/dsuniverse";

export const WHOP: Record<string, WhopListing> = {
  // ---- paid indicators ----
  oracle: { product: `${STORE}/ds-oracle` },
  iceberg: { product: `${STORE}/ds-iceberg` },
  sonar: { product: `${STORE}/ds-sonar` },
  zones: { product: `${STORE}/ds-zones` },
  gex: { product: `${STORE}/ds-gex` },

  // ---- free indicators ----
  flow: { product: `${STORE}/ds-flow`, free: true },
  parallax: { product: `${STORE}/ds-parallax`, free: true },
  "isotropic-lines": { product: `${STORE}/ds-isotropic-lines`, free: true },
  "adaptive-priceline": { product: `${STORE}/ds-adaptive-price-line`, free: true },
  "chart-price": { product: `${STORE}/ds-chart-price`, free: true },

  // ---- add-ons: not on Whop yet ----
  // screener, bulk-replay-downloader, toolkit, marketwatch, time-intervals
  // Paste them in the same shape when their Whop pages exist.
};

export const listingFor = (slug: string): WhopListing | undefined => WHOP[slug];

/** The button's words. Free products say so; Whop's own page says "Join for free". */
export const buyLabel = (l: WhopListing) => (l.free ? "Get it free" : "Get access");
