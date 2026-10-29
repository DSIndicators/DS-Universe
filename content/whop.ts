/**
 * Where a buy button goes — the commerce layer.
 *
 * TOM: this is the only file to edit when a Whop link changes.
 *
 * THE v3.1 STORE (2026-10-29). Whop sells two things:
 *   · DS COMPLETE — every paid DS tool on one license (2817), at the founders
 *     price, in three plans: monthly, own-the-set, and the 7-day free trial
 *     (a $0 "DS Complete Free Trial" listing on Whop).
 *   · THE FREE VAULT — nine free listings, one per tool.
 * Every product was taken off Whop on 2026-10-29 while v3.1 was prepared, so
 * NO LINK IS ASSUMED LIVE. A button goes to Whop only once its link is entered
 * below; until then it shows the "Opening soon" state with "Get notified"
 * (components/CompleteActions.tsx), never an old plan.
 *
 * DS COMPLETE (2026-10-29 evening): the trial-then-monthly plan is live and
 * wired (COMPLETE_PLANS.trialMonthly). The $149.99 own-the-set plan: paste its
 * checkout into COMPLETE_PLANS.own once it exists and its button appears.
 *
 * TO OPEN A FREE VAULT TOOL AGAIN: once its listing is back up on Whop and its
 * free checkout opens, add its slug to RELISTED. Its plan and listing path are
 * already below (each read off its own checkout when it was first wired).
 *
 * Whop gave some listing paths a random suffix — use exactly what Whop gives
 * you, do not tidy.
 */

import { PRICES } from "./pricing";
import { PRODUCTS } from "./products";

export type WhopListing = {
  /** The product's page on Whop — its description, FAQ and reviews. */
  product: string;
  /** Direct checkout link for the product's plan. */
  checkout: string;
};

export const STORE = "https://whop.com/dsuniverse";
const CHECKOUT = "https://whop.com/checkout";
// The listing is linked at whop.com/dsuniverse/products/<path>/ — the short
// whop.com/dsuniverse/<path>/ can hand a signed-out visitor an old cached copy.
const L = (path: string, plan: string): WhopListing => ({ product: `${STORE}/products/${path}/`, checkout: `${CHECKOUT}/${plan}` });

/**
 * DS COMPLETE's checkouts. Supplied by Tom 2026-10-29: plan_BDcgf0PEsWLeP.
 * Opened in headless Edge on Tom's PC the same day, it reads: "DS Complete
 * Bundle · 7 days free · Then $39.99 per month · Total due today $0.00", with
 * a card form and the required "Your NinjaTrader Account Email". So it is ONE
 * plan: the 7-day free trial that becomes the monthly plan. It offers no
 * $149.99 own-the-set option, so `own` stays empty and the site says that
 * checkout is opening soon (CompleteActions) until its own plan is pasted here.
 * (The product title Whop shows on that checkout is still the pre-v3.1 one,
 * "Every Paid DS Product + DS ASL & DS Toolkit Free" — Tom's to change on Whop.)
 */
export const COMPLETE_PLANS: { listing?: string; trialMonthly?: string; own?: string } = {
  trialMonthly: "https://whop.com/checkout/plan_BDcgf0PEsWLeP",
  // own: "https://whop.com/checkout/plan_…",   // $149.99 one-time, when it exists
};

/** The Free Vault's listings, as they were wired (each checkout read "Free"). */
export const VAULT_WHOP: Record<string, WhopListing> = {
  "adaptive-priceline": L("ds-adaptive-price-line-self-anchoring-line-countdown-ninjatrader-8", "plan_XN3D0IC97yWP2"),
  "chart-price": L("ds-chart-price-large-readout-chop-detection-ninjatrader-8", "plan_E34eRRHcmYHD4"),
  "ds-258": L("ds-258-nasdaq-00-20-50-80-level-map-ninjatrader-8", "plan_LvWsdZ70h3x5m"),
  parallax: L("ds-parallax-multi-timeframe-liquidity-matrix-ninjatrader-8", "plan_RBOOqpI868f9W"),
  "session-levels": L("ds-session-levels-asia-london-new-york-session-levels-ninjatrader-8", "plan_LhYBx2nIIXwck"),
  vwap: L("ds-vwap-live-session-vwap-with-measured-bands-ninjatrader-8", "plan_eC8XsRW9rz7OU"),
  "live-background": L("ds-live-background-your-video-behind-the-chart-ninjatrader-8", "plan_oSNrguzUxIcnF"),
  "time-intervals": L("ds-time-intervals-one-click-timeframe-buttons-ninjatrader-8", "plan_pkn3YRk0zwB30"),
  volume: L("ds-volume-smart-volume-read-against-the-clock-ninjatrader-8", "plan_41tqwGSBzrBUd"),
};

/**
 * Free Vault tools confirmed live on Whop again after the 2026-10-29 take-down.
 * ALL NINE, checked 2026-10-29 (evening): the store lists them, and every
 * checkout above opened in headless Edge on Tom's PC with the product's name
 * and "Free". A tool not listed here shows "Opening soon".
 */
export const RELISTED: readonly string[] = [
  "adaptive-priceline", "chart-price", "ds-258", "parallax", "session-levels", "vwap", "live-background", "time-intervals", "volume",
];

/**
 * RETIRED FOR GOOD — plans and listings no button may ever open again,
 * whatever product they are pasted under. Since v3.1 that is every single
 * paid product's plan (no paid product is sold on its own), the pre-v3.1
 * DS Complete plan and listing, DS Oracle's, the old trial plans, and the
 * discontinued and retired free plans.
 */
const RETIRED_PLANS: readonly string[] = [
  // single paid products, retired 2026-10-29 (sold only in DS Complete now)
  "plan_ocxhFcbIMnpbi", "plan_FMGkrNvXKFMzC", "plan_Wos2cSDhY5RZp", "plan_G6CrISw6dNHR6", "plan_BBivBWLYNMJhb",
  "plan_yFqtNooVPvdNm", "plan_ziBOQITqwmlgn", "plan_vELeEOxCkpoYx", "plan_kKVlaEdC9dtgS",
  // DS Oracle (discontinued 2026-10-29)
  "plan_ujtfTI9XElO8g",
  // DS Complete before v3.1 ($374.95, "all 15 products")
  "plan_eVl3N0rb9CZQ2",
  // the 3-day trial plans (ended 2026-10-14)
  "plan_zZ1CGRY29Dz7n", "plan_5wUpmsoJ0Rj3I", "plan_OgE67QZlTofd9",
  // old paid DS ProStochastics / DS ProSqueeze, and DS Toolkit's retired free plan
  "plan_ACebJTJOzyeH9", "plan_sQ0Jx6UJRsggw", "plan_Ywx5wxsyuCStx",
  // DS MACD, DS Squeeze, DS Stochastics (discontinued 2026-10-25)
  "plan_rwOCbeDmfIVmz", "plan_mCyNCv0gGgsPw", "plan_uLd7kZO8uzYwI",
];
const RETIRED_LISTINGS: readonly string[] = [
  "ds-complete-all-15-ds-universe-products-one-license-ninjatrader-8",
  "ds-oracle-ai-confirmed-supertrend-neural-line-ninjatrader-8",
  "ds-toolkit-one-rail-for-every-indicator-tool-ninjatrader-8",
  "ds-prostochastics-quad-rotation-stochastics-ninjatrader-8",
  "ds-prosqueeze-squeeze-waves-reversion-ninjatrader-8",
  "ds-macd-volatility-normalized-macd-cross-price-ninjatrader-8",
  "ds-squeeze-squeeze-waves-reversion-ninjatrader-8",
  "ds-stochastics-quad-rotation-stochastics-ninjatrader-8",
];

/* The build refuses a retired link, a duplicated plan, a free listing for a
   product that is not free, and a paid product with a listing of its own. */
{
  const links = [
    ...Object.values(COMPLETE_PLANS).filter((x): x is string => !!x),
    ...Object.values(VAULT_WHOP).flatMap((w) => [w.product, w.checkout]),
  ];
  const dead = [
    ...RETIRED_PLANS.filter((plan) => links.some((x) => x.endsWith(`/${plan}`))),
    ...RETIRED_LISTINGS.filter((path) => links.some((x) => x.includes(`/${path}`))),
  ];
  if (dead.length) throw new Error(`content/whop.ts: ${dead.join(", ")} is retired and must not be linked from the site.`);
  const plans = [...Object.values(VAULT_WHOP).map((w) => w.checkout), COMPLETE_PLANS.trialMonthly, COMPLETE_PLANS.own].filter(
    (x): x is string => !!x,
  );
  if (new Set(plans).size !== plans.length) throw new Error("content/whop.ts: two buttons share one checkout plan.");
  for (const slug of Object.keys(VAULT_WHOP)) {
    if (!PRICES[slug]?.free) throw new Error(`content/whop.ts: "${slug}" has a free listing but is not a Free Vault product.`);
  }
  for (const p of PRODUCTS) {
    if (PRICES[p.slug]?.free && !VAULT_WHOP[p.slug]) throw new Error(`content/whop.ts: Free Vault product "${p.slug}" has no listing.`);
  }
  for (const slug of RELISTED) {
    if (!VAULT_WHOP[slug]) throw new Error(`content/whop.ts: RELISTED names "${slug}", which has no Free Vault listing.`);
  }
  // Not a refusal — the site may go live with "Opening soon" — but never silent.
  const pending = [
    ...(["trialMonthly", "own"] as const).filter((k) => !COMPLETE_PLANS[k]).map((k) => `DS Complete ${k} plan`),
    ...Object.keys(VAULT_WHOP).filter((s) => !RELISTED.includes(s)),
  ];
  if (pending.length && process.env.NODE_ENV === "production") {
    console.warn(`\n  content/whop.ts: not linked yet, shown as "Opening soon": ${pending.join(", ")}.\n`);
  }
}

/** DS Complete's live links (each undefined until entered). */
export const completeLinks = () => ({ trialMonthly: COMPLETE_PLANS.trialMonthly, own: COMPLETE_PLANS.own, listing: COMPLETE_PLANS.listing });
/** Is any DS Complete plan live yet? */
export const completeOpen = () => !!(COMPLETE_PLANS.trialMonthly || COMPLETE_PLANS.own);

/** A Free Vault tool's live listing, or undefined while it is not back up. */
export const vaultListing = (slug: string): WhopListing | undefined => (RELISTED.includes(slug) ? VAULT_WHOP[slug] : undefined);

/** What a button shows while its link is not live yet, and the request "Get notified" writes. */
export const OPENING = {
  label: "Opening soon",
  notify: "Get notified",
  complete: {
    note: "The founders plans are being set up on Whop, so there is nothing to check out yet. Nothing here takes an order or a payment.",
    request: "Please email me when DS Complete opens at the founders price.",
    /** While only the trial / monthly plan is live. */
    own: "Owning the set outright: its checkout opens soon.",
    ownRequest: "Please email me when DS Complete can be bought outright for $149.99.",
  },
  vault: {
    note: "Its free download is being put back up on Whop for v3.1. Nothing here takes an order or a payment.",
    request: (name: string) => `Please email me when ${name} is back in the Free Vault.`,
  },
} as const;
