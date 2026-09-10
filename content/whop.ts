/**
 * Where "Get access" goes — the commerce layer.
 *
 * TOM: this is the only file to edit when a product goes live on Whop.
 *
 *   product   the product's page on Whop — its price, offer, description and
 *             reviews. THE SHELF TILES POINT HERE (Tom, 2026-09-10): hovering a
 *             tile is browsing, so the buyer lands on the listing, not in a
 *             payment form.
 *   checkout  Whop's direct checkout link (dashboard → Checkout links; they look
 *             like https://whop.com/checkout/plan_xxxxxxxxx). Used by the main
 *             button on OUR product page, where the visitor has read the copy and
 *             decided — one click from there to the payment window. A product
 *             with no `checkout` yet falls back to `product`, so no dead ends.
 *   free      the product is free on Whop, so the button reads "Get it free"
 *             instead of "Get access" (Whop's own page says "Join for free").
 *
 * A product with NO entry here shows a quiet "Coming soon" instead of a buy
 * button — nobody is sent to a dead link. That is the five add-ons today.
 *
 * THE CHECKOUT LINKS BELOW WERE VERIFIED ONE BY ONE (2026-09-10) by opening each
 * plan URL and reading the product name and price off the live Whop checkout.
 * Tom's list arrived free-first then paid, which is NOT the order the product
 * pages were given in — mapping them positionally would have pointed all ten at
 * the wrong product. If you ever add or rotate a plan id, open it and check.
 *
 * Later: Whop's embedded checkout (docs.whop.com/payments/checkout-embed) can
 * host the payment window inline using the plan id inside the checkout URL.
 */

import { onWaitlist } from "./launch";

export type WhopListing = {
  /** Whop product page — the listing. */
  product: string;
  /** Direct checkout link. Preferred destination for every buy button. */
  checkout?: string;
  /** For embedded checkout later. */
  planId?: string;
  free?: boolean;
};

const STORE = "https://whop.com/dsuniverse";
const CHECKOUT = "https://whop.com/checkout";

export const WHOP: Record<string, WhopListing> = {
  // ---- paid indicators (verified $79.99 one-time on the checkout page) ----
  oracle: { product: `${STORE}/ds-oracle`, checkout: `${CHECKOUT}/plan_Sock9tX7HJiGX` },
  iceberg: { product: `${STORE}/ds-iceberg`, checkout: `${CHECKOUT}/plan_4h69hDBIWxT68` },
  sonar: { product: `${STORE}/ds-sonar`, checkout: `${CHECKOUT}/plan_3RO7meGKd2KsA` },
  zones: { product: `${STORE}/ds-zones`, checkout: `${CHECKOUT}/plan_GHLDALhabsiTc` },
  gex: { product: `${STORE}/ds-gex`, checkout: `${CHECKOUT}/plan_kJclRaIMx90Jb` },

  // ---- free indicators (verified "Free" on the checkout page) ----
  flow: { product: `${STORE}/ds-flow`, checkout: `${CHECKOUT}/plan_jijvuTVnLPb5D`, free: true },
  parallax: { product: `${STORE}/ds-parallax`, checkout: `${CHECKOUT}/plan_U12B5bHLJgAVd`, free: true },
  "isotropic-lines": { product: `${STORE}/ds-isotropic-lines`, checkout: `${CHECKOUT}/plan_BvtVrY0sHiJvy`, free: true },
  "adaptive-priceline": { product: `${STORE}/ds-adaptive-price-line`, checkout: `${CHECKOUT}/plan_jjKYJfJrZd7Qp`, free: true },
  "chart-price": { product: `${STORE}/ds-chart-price`, checkout: `${CHECKOUT}/plan_MxzMbqTghXBk4`, free: true },

  // ---- add-ons (Tom, 2026-09-10; every page opened and its price read) ----
  // Note the URL shape differs from the indicators: add-ons sit under
  // /products/. Use exactly what Whop gives you, do not "tidy" it.
  screener: { product: `${STORE}/products/ds-screener/` },
  "bulk-replay-downloader": { product: `${STORE}/products/ds-bulk-replay-downloader/` },
  marketwatch: { product: `${STORE}/products/ds-marketwatch/`, free: true },
  "time-intervals": { product: `${STORE}/products/ds-time-intervals/`, free: true },
  // DS Toolkit is deliberately absent: it is bundle-only, so it has no buy
  // button of its own. content/pricing.ts marks it bundleOnly and the product
  // page says where to get it instead.
};

export const listingFor = (slug: string): WhopListing | undefined => WHOP[slug];

/**
 * Where a buy button sends the buyer: straight to checkout when we have the
 * link, the Whop listing otherwise. One place, so every button agrees.
 */
export const buyHref = (l: WhopListing) => l.checkout ?? l.product;

/**
 * The button's words. Free products say so; Whop's own page says "Join for free".
 *
 * While the store is on a waitlist (content/launch.ts) every button says the
 * same thing instead, worded to match what Whop's own checkout says when the
 * buyer lands on it — "Join waitlist". A button that promises access and then
 * opens a waitlist form is the kind of small lie that costs trust.
 */
export const buyLabel = (l: WhopListing) =>
  onWaitlist() ? "Join the waitlist" : l.free ? "Get it free" : "Get access";
