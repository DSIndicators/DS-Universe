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
 *
 * A THIRD LINK FOR THREE PRODUCTS — the 3-day free trial (Tom, 2026-09-29).
 *   trial    — a second plan on the SAME Whop product: "3-Day Free Trial",
 *              Free, one-time, Whop access for 3 days, the same required
 *              "NinjaTrader account email" question. Found by reading each
 *              listing's own default plan off whop.com (the trial is now the
 *              listing's main button) and then rendering every checkout:
 *                DS Oracle  plan_zZ1CGRY29Dz7n
 *                DS Flow    plan_5wUpmsoJ0Rj3I
 *                DS ProRSI  plan_OgE67QZlTofd9
 *              Each reads "<product> · Free · 3 day access — no payment
 *              required", and each product's $79.99 checkout still works.
 * The trial's own words and switch live in content/trial.ts. A product with
 * no `trial` here shows no trial anywhere on the site.
 *
 * DS SESSION LEVELS (2026-09-30).
 *   plan_LhYBx2nIIXwck — supplied by Tom; opened on Tom's PC (headless Edge):
 *   "DS Session Levels ✦ Asia, London & New York Session Levels · NinjaTrader 8
 *   · Free", the required "NinjaTrader account email" question, button "Join".
 *   Listing route read off the store's own product list (prod_VdnviWEF5KU86,
 *   one visible plan).
 * DS ASL  NO entry, on purpose: it is not sold on its own. Every button for it
 *   goes to DS Complete's checkout (purchaseKey below).
 * DS TOOLKIT  NO entry either, since 2026-10-05 (Tom: "DS Toolkit will come
 *   FREE with the purchase of DS Complete Bundle only, same as DS ASL"). Its
 *   own free listing ("ds-toolkit-one-rail-…", plan_Ywx5wxsyuCStx) is RETIRED:
 *   Tom closes it on cutover day. Every button for DS Toolkit goes to DS
 *   Complete's checkout, and the build refuses that plan or that listing path
 *   anywhere in WHOP (RETIRED_PLANS / RETIRED_LISTINGS below).
 *
 * THE LINEUP OF 2026-10-05 — THE SIX NEW LISTINGS, WIRED 2026-10-05 (night).
 *   Tom made the listings; every plan was opened on its own checkout page and
 *   the product name and price read off it (never matched by position):
 *     DS ProLiquidityHunter  plan_yFqtNooVPvdNm   $79.99 one-time
 *     DS ProHeikinAshi       plan_ziBOQITqwmlgn   $79.99 one-time
 *     DS VWAP                plan_eC8XsRW9rz7OU   Free
 *     DS MACD                plan_rwOCbeDmfIVmz   Free
 *     DS Squeeze             plan_mCyNCv0gGgsPw   Free
 *     DS Stochastics         plan_uLd7kZO8uzYwI   Free
 *   The two Pro panels have no trial plan (like DS ProTrendRange).
 *   DS Stochastics and DS Squeeze are NEW free listings. Their old $79.99
 *   listings ("ds-prostochastics-…", "ds-prosqueeze-…") are gone from the
 *   store (404), and those two plans and paths stay refused by the build
 *   (RETIRED_PLANS / RETIRED_LISTINGS below): a "Get it free" button must
 *   never open a card form.
 *   All twenty listing pages were read back on whop.com the same night (title
 *   and price / "Join for free" of each). Read them at
 *   whop.com/dsuniverse/products/<path>/ — the short address
 *   whop.com/dsuniverse/<path>/ (each listing's canonical, and the one linked
 *   here) can hand a signed-out reader an old cached copy.
 *   DS Complete is still at the address Whop gave it when it held fifteen
 *   ("…all-15-…"); that is Whop's address for the live listing, not a count
 *   this site states.
 *
 * A LISTING THAT DOES NOT EXIST YET goes in PENDING_LISTING (empty now). Its
 *   page then says so plainly instead of offering a button, and a production
 *   build refuses to run while the list is not empty (see below) — the site
 *   cannot go live half-wired by accident.
 *   TO FINISH ONE: create the listing on Whop, open its checkout and read the
 *   product name and price off it, add its `L("<listing path>", "<plan>")`
 *   line to WHOP, and take its slug out of PENDING_LISTING.
 */

import { onWaitlist } from "./launch";
import { PRICES } from "./pricing";

export type WhopListing = {
  /** The product's page on Whop — its price, description and reviews. */
  product: string;
  /** Direct checkout link for the product's plan. */
  checkout?: string;
  /** Direct checkout for the product's free-trial plan, where it has one. */
  trial?: string;
};

export const STORE = "https://whop.com/dsuniverse";
const CHECKOUT = "https://whop.com/checkout";
const L = (path: string, plan: string, trialPlan?: string): WhopListing => ({
  product: `${STORE}/${path}/`,
  checkout: `${CHECKOUT}/${plan}`,
  ...(trialPlan ? { trial: `${CHECKOUT}/${trialPlan}` } : {}),
});

export const WHOP: Record<string, WhopListing> = {
  // ---- flagship indicators ($79.99, checkout verified 2026-09-25) ----
  zones: L("ds-zones-living-supply-demand-structure-ninjatrader-8", "plan_ocxhFcbIMnpbi"),
  iceberg: L("ds-iceberg-hidden-absorption-refill-detection-ninjatrader-8", "plan_FMGkrNvXKFMzC"),
  // third argument = the 3-day free-trial plan (verified 2026-09-29)
  oracle: L("ds-oracle-ai-confirmed-supertrend-neural-line-ninjatrader-8", "plan_ujtfTI9XElO8g", "plan_zZ1CGRY29Dz7n"),
  gex: L("ds-gex-dealer-gamma-levels-fetched-live-ninjatrader-8-fb", "plan_Wos2cSDhY5RZp"),
  flow: L("ds-flow-volume-by-price-footprint-ninjatrader-8", "plan_G6CrISw6dNHR6", "plan_5wUpmsoJ0Rj3I"),
  // ---- Pro Series ($79.99, checkout verified 2026-09-25) ----
  prorsi: L("ds-prorsi-rsi-crossovers-as-price-levels-ninjatrader-8", "plan_BBivBWLYNMJhb", "plan_OgE67QZlTofd9"),
  // 2026-10-05 — new Pro panels; listing and plan from Tom, each checkout
  // opened and read: the product's name, $79.99, one-time. No trial plan.
  proliquidityhunter: L("ds-proliquidityhunter-liquidity-map-with-measured-reach-odds-ninjatrader-8", "plan_yFqtNooVPvdNm"),
  proheikinashi: L("ds-proheikinashi-heikin-ashi-candle-flip-level-panel-ninjatrader-8", "plan_ziBOQITqwmlgn"),
  // 2026-10-04 — listing and plan from Tom; the listing page was read back and
  // matches the sheet.
  protrendrange: L("ds-protrendrange-trend-pullback-range-state-panel-ninjatrader-8", "plan_vELeEOxCkpoYx"),
  // ---- data utility ($29.99, checkout verified 2026-09-25) ----
  "bulk-replay-downloader": L("ds-bulk-replay-downloader-bulk-replay-data-ninjatrader-8", "plan_kKVlaEdC9dtgS"),
  // ---- the Free Vault (checkout shows "Free", verified 2026-09-25) ----
  // toolkit — NO entry: it comes free with DS Complete and its own free
  //           listing is retired (2026-10-05; see RETIRED_PLANS below)
  "adaptive-priceline": L("ds-adaptive-price-line-self-anchoring-line-countdown-ninjatrader-8", "plan_XN3D0IC97yWP2"),
  "chart-price": L("ds-chart-price-large-readout-chop-detection-ninjatrader-8", "plan_E34eRRHcmYHD4"),
  "ds-258": L("ds-258-nasdaq-00-20-50-80-level-map-ninjatrader-8", "plan_LvWsdZ70h3x5m"),
  "session-levels": L("ds-session-levels-asia-london-new-york-session-levels-ninjatrader-8", "plan_LhYBx2nIIXwck"),
  parallax: L("ds-parallax-multi-timeframe-liquidity-matrix-ninjatrader-8", "plan_RBOOqpI868f9W"),
  // 2026-10-05 — four new free listings; each checkout opened and read: the
  // product's name and "Free". DS Stochastics and DS Squeeze are NEW listings
  // with NEW free plans, not their old $79.99 ones.
  stochastics: L("ds-stochastics-quad-rotation-stochastics-ninjatrader-8", "plan_uLd7kZO8uzYwI"),
  squeeze: L("ds-squeeze-squeeze-waves-reversion-ninjatrader-8", "plan_mCyNCv0gGgsPw"),
  macd: L("ds-macd-volatility-normalized-macd-cross-price-ninjatrader-8", "plan_rwOCbeDmfIVmz"),
  vwap: L("ds-vwap-live-session-vwap-with-measured-bands-ninjatrader-8", "plan_eC8XsRW9rz7OU"),
  // ---- the bundle ($374.95, checkout verified 2026-09-25) ----
  complete: L("ds-complete-all-15-ds-universe-products-one-license-ninjatrader-8", "plan_eVl3N0rb9CZQ2"),
};

/**
 * LISTINGS THAT DO NOT EXIST ON WHOP YET — NONE since 2026-10-05 (night): the
 * six of the 10-05 lineup are wired above. A pending product has NO entry in
 * WHOP at all, so there is nothing a button could open: its tile carries no
 * buy button, and its page shows a plain "not open yet" state where the button
 * would be (components/BuyButton.tsx). It must never go live that way — so a
 * production build stops while a slug is listed here.
 * (`DS_PREVIEW_BUILD=1 npm run build` builds anyway, for checking only;
 * Hostinger never sets it.)
 */
export const PENDING_LISTING: readonly string[] = [];
export const isPending = (slug: string) => PENDING_LISTING.includes(slug);

/** What a pending product's page says where its button would be. */
export const PENDING_NOTE = {
  /** In the button's place. Not a link. */
  label: "Not open yet",
  /** Under it, on the product page. */
  text: "Its listing on Whop is being set up, so there is nothing to check out yet. Nothing here takes an order or a payment.",
} as const;

/**
 * Plans that were PAID and belong to products that are free now. They must
 * never come back as a free product's checkout (DS Stochastics and DS Squeeze
 * have NEW free plans since 2026-10-05; these two charged $79.99).
 */
const RETIRED_PAID_PLANS: readonly string[] = ["plan_ACebJTJOzyeH9", "plan_sQ0Jx6UJRsggw"];

/**
 * RETIRED FOR GOOD — plans and listings no button may ever open again,
 * whatever product they are pasted under:
 *   · the two $79.99 plans above, and the two listings they belonged to
 *     (the old DS ProStochastics and DS ProSqueeze pages — 404 on Whop since
 *     2026-10-05);
 *   · DS Toolkit's own free plan and listing (2026-10-05). DS Toolkit comes
 *     free with DS Complete and is not offered on its own, so a link to its
 *     old free checkout would hand out what is no longer given away.
 */
const RETIRED_PLANS: readonly string[] = [...RETIRED_PAID_PLANS, "plan_Ywx5wxsyuCStx"];
const RETIRED_LISTINGS: readonly string[] = [
  "ds-toolkit-one-rail-for-every-indicator-tool-ninjatrader-8",
  "ds-prostochastics-quad-rotation-stochastics-ninjatrader-8",
  "ds-prosqueeze-squeeze-waves-reversion-ninjatrader-8",
];

const LIVE_BUILD = process.env.NODE_ENV === "production" && process.env.DS_PREVIEW_BUILD !== "1";

/* Every listed product has its own plan — a pasted duplicate would send two
   products to one checkout, so the build refuses it. */
{
  const plans = Object.values(WHOP).flatMap((w) => (w.checkout ? [w.checkout] : []));
  if (new Set(plans).size !== plans.length) {
    throw new Error("content/whop.ts: two products share one checkout plan.");
  }
  // A trial plan is a plan of its own: never another product's, never the
  // product's own paid plan (that would send a "free trial" click to a card form).
  const trials = Object.values(WHOP).flatMap((w) => (w.trial ? [w.trial] : []));
  if (new Set([...plans, ...trials]).size !== plans.length + trials.length) {
    throw new Error("content/whop.ts: a trial link repeats another checkout plan.");
  }
  for (const [slug, w] of Object.entries(WHOP)) {
    if (slug !== "complete" && !PRICES[slug]) throw new Error(`content/whop.ts: "${slug}" has a listing but is not in the catalogue.`);
    if (PRICES[slug]?.free && RETIRED_PAID_PLANS.some((plan) => w.checkout?.endsWith(`/${plan}`))) {
      throw new Error(`content/whop.ts: "${slug}" is free, but its checkout is a retired PAID plan. Make a new free plan on Whop.`);
    }
    const links = [w.checkout, w.trial, w.product].filter((x): x is string => !!x);
    const dead = [
      ...RETIRED_PLANS.filter((plan) => links.some((x) => x.endsWith(`/${plan}`))),
      ...RETIRED_LISTINGS.filter((path) => links.some((x) => x.includes(`/${path}`))),
    ];
    if (dead.length) {
      throw new Error(`content/whop.ts: "${slug}" points at ${dead.join(", ")}, which is retired and must not be linked from the site.`);
    }
  }
  for (const slug of [...Object.keys(PRICES), "complete"]) {
    // A product that comes free with DS Complete (DS ASL, DS Toolkit) has no
    // checkout of its own — and must not have one, or a button would sell, or
    // give away, what is not offered on its own.
    if (PRICES[slug]?.withComplete) {
      if (WHOP[slug] || isPending(slug)) throw new Error(`content/whop.ts: "${slug}" comes free with DS Complete, is not offered on its own, and must not have a listing.`);
      continue;
    }
    if (isPending(slug)) {
      if (WHOP[slug]) throw new Error(`content/whop.ts: "${slug}" has a listing now — take it out of PENDING_LISTING.`);
      continue;
    }
    if (!WHOP[slug]?.checkout) throw new Error(`content/whop.ts: "${slug}" has no checkout link.`);
  }
  for (const slug of PENDING_LISTING) {
    if (!PRICES[slug]) throw new Error(`content/whop.ts: "${slug}" is pending but is not in the catalogue.`);
  }
  if (PENDING_LISTING.length && LIVE_BUILD) {
    throw new Error(
      `content/whop.ts: ${PENDING_LISTING.join(", ")} ${PENDING_LISTING.length > 1 ? "have" : "has"} no Whop listing yet, so this build must not go live. ` +
        `Create each listing on Whop, put its listing path and plan in WHOP, and take it out of PENDING_LISTING before deploying. ` +
        `(To look at the site as it is: DS_PREVIEW_BUILD=1 npm run build.)`,
    );
  }
}

/**
 * Whose checkout a product is bought through: its own — or, for a product that
 * comes free with DS Complete and is not sold on its own, DS Complete's.
 */
export const purchaseKey = (slug: string) => (PRICES[slug]?.withComplete ? "complete" : slug);

export const listingFor = (key: string): WhopListing | undefined => WHOP[key];

/** The main button's destination: the direct checkout, else the listing. */
export const buyHref = (l: WhopListing) => l.checkout ?? l.product;

/**
 * The button's words. While the store is on a waitlist every button says what
 * Whop's own page says — "Join waitlist". Open: paid products say "Buy now"
 * (Whop's listing button says the same), free ones "Get it free".
 */
export const buyLabel = (key: string) =>
  onWaitlist()
    ? "Join the waitlist"
    : PRICES[key]?.free
      ? "Get it free"
      : PRICES[key]?.withComplete
        ? "Get DS Complete"
        : "Buy now";
