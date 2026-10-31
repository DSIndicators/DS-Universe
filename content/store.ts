/**
 * Where a button goes — the commerce layer, copied from DS-Universe-White's
 * content/whop.ts (2026-10-30) and renamed for the vaults.
 *
 * TOM: this is the only file to edit when a Whop link changes.
 *
 *   ESSENTIALS VAULT  the monthly membership checkout, $39.99 a month, NO free
 *                     trial (Tom, 2026-10-30). TOM, ON WHOP: take the 7-day
 *                     trial off plan_BDcgf0PEsWLeP (or make a new monthly plan
 *                     and paste it below), and rename the product from
 *                     "DS Complete Bundle" to "DS Essentials Vault".
 *   FREE VAULT        nine free listings, one per tool.
 */
import { FREE_PRODUCTS } from "./vaults";

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
export const ESSENTIALS_PLANS: { listing?: string; monthly?: string; own?: string } = {
  // Until Tom removes the trial on Whop, this checkout still shows "7 days free".
  monthly: "https://whop.com/checkout/plan_BDcgf0PEsWLeP",
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
    ...Object.values(ESSENTIALS_PLANS).filter((x): x is string => !!x),
    ...Object.values(VAULT_WHOP).flatMap((w) => [w.product, w.checkout]),
  ];
  const dead = [
    ...RETIRED_PLANS.filter((plan) => links.some((x) => x.endsWith(`/${plan}`))),
    ...RETIRED_LISTINGS.filter((path) => links.some((x) => x.includes(`/${path}`))),
  ];
  if (dead.length) throw new Error(`content/store.ts: ${dead.join(", ")} is retired and must not be linked from the site.`);
  const plans = [...Object.values(VAULT_WHOP).map((w) => w.checkout), ESSENTIALS_PLANS.monthly, ESSENTIALS_PLANS.own].filter(
    (x): x is string => !!x,
  );
  if (new Set(plans).size !== plans.length) throw new Error("content/store.ts: two buttons share one checkout plan.");
  for (const slug of Object.keys(VAULT_WHOP)) {
    if (!FREE_PRODUCTS.some((p) => p.slug === slug)) throw new Error(`content/store.ts: "${slug}" has a free listing but is not a Free Vault product.`);
  }
  for (const p of FREE_PRODUCTS) {
    if (!VAULT_WHOP[p.slug]) throw new Error(`content/store.ts: Free Vault product "${p.slug}" has no listing.`);
  }
  for (const slug of RELISTED) {
    if (!VAULT_WHOP[slug]) throw new Error(`content/store.ts: RELISTED names "${slug}", which has no Free Vault listing.`);
  }
  // Not a refusal — the site may go live with "Opening soon" — but never silent.
  const pending = [
    ...(["monthly", "own"] as const).filter((k) => !ESSENTIALS_PLANS[k]).map((k) => `Essentials ${k} plan`),
    ...Object.keys(VAULT_WHOP).filter((s) => !RELISTED.includes(s)),
  ];
  if (pending.length && process.env.NODE_ENV === "production") {
    console.warn(`\n  content/store.ts: not linked yet, shown as "Opening soon": ${pending.join(", ")}.\n`);
  }
}

/** The Essentials Vault monthly checkout, or undefined while it is not live. */
export const essentialsCheckout = () => ESSENTIALS_PLANS.monthly;
/**
 * Where an Essentials member downloads the vault. Whop delivers the files
 * inside the membership, so until a direct link is pasted here the members
 * area says where to find them in Whop and links to whop.com.
 */
export const ESSENTIALS_DOWNLOAD: string | undefined = undefined;

/** The founders own-it-outright checkout, once it exists. */
export const lifetimeCheckout = () => ESSENTIALS_PLANS.own;

/** A Free Vault tool's live listing, or undefined while it is not back up. */
export const vaultListing = (slug: string): WhopListing | undefined => (RELISTED.includes(slug) ? VAULT_WHOP[slug] : undefined);

/**
 * Where members manage or cancel. Whop's own steps (docs, read 2026-10-30):
 * sign in at whop.com, Profile, Orders, then the membership. Canceling stops
 * renewal; access stays until the end of the period already paid.
 */
export const MANAGE = {
  url: "https://whop.com/",
  path: "whop.com, then Profile, then Orders",
  help: "https://docs.whop.com/memberships-and-access/cancellations-and-refunds/cancel-a-subscription",
};
