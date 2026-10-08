/**
 * THE FREE VAULT — its words, in one place (Tom, 2026-10-05).
 *
 * Tom: put a "FREE VAULT" page on the site, "a tab users can see instantly and
 * be intrigued to go to"; the free products that were on the home page are
 * "neatly placed on the new Free vault page". "The goal is to disassociate
 * Paid from free. PAID bundle will no longer include all free products. free
 * products will be managed individually while paid will be grouped together."
 *
 * WHAT IT IS, in the site's own terms: the free products, each with its own
 * free Whop listing and its own download, on a page of their own
 * (/free-vault), each with its own page under it (/free-vault/<slug>). They
 * are not on a store shelf and not in DS Complete.
 *
 * Which products are in it is NOT typed here: it is every product whose
 * series is "vault" in content/products.ts (content/release.ts VAULT_PRODUCTS),
 * and content/pricing.ts refuses a build in which a vault product is not free
 * or a free product is outside the vault.
 *
 * WORDING. Every sentence is one the site or the Master sheet already says:
 *   · "free permanently — not a trial, not a stripped build" (the store FAQ);
 *   · "each is its own download and runs beside it" / "none is part of DS
 *     Complete" (the sheet, Read Me and DS Complete's description);
 *   · the license: "At checkout, enter the email on your NinjaTrader account
 *     … the license is switched on by hand" (content/launch.ts AFTER_CHECKOUT,
 *     the same words the READMEs and the Whop FAQ use).
 * No product count (the lineup changes), no outcome, no superlative.
 *
 * DS TOOLKIT IS NOT IN THE VAULT (2026-10-05, later the same day): it comes
 * free with DS Complete and is not offered on its own, so no sentence here
 * names the rail.
 */

export const VAULT_COPY = {
  /** The mark's words, set in mono small caps wherever the vault is named. */
  label: "Free Vault",
  /** The page's headline. */
  title: "The Free Vault.",
  /** One or two plain sentences: what it is, and how a free license works. */
  lede: "Free indicators and tools for NinjaTrader 8 — free permanently, not a trial and not a stripped build. Each one is its own download from its own free listing on Whop; checkout asks for the email on your NinjaTrader account, and the license is switched on by hand to that account.",
  /** The facts, as a spec sheet beside the headline. */
  facts: [
    { k: "Price", v: "Free, permanently. Not a trial." },
    { k: "Download", v: "Each product is its own download, with its own guide." },
    { k: "License", v: "Switched on by hand, to the NinjaTrader account email you give at checkout." },
    { k: "DS Complete", v: "Not part of it. A free product runs beside it." },
  ],
  /** The home page band. */
  band: {
    heading: "Free tools, kept in a place of their own.",
    text: "The Free Vault holds the free DS Universe products — the price line, the price readout, the level map, the higher-timeframe matrix, the session levels and the panels. Each is its own download, free permanently, and none of them is part of DS Complete.",
    cta: "Open the Free Vault",
  },
  /** The one line in the home hero. */
  hero: "Free indicators and tools, each its own download — not a trial, and separate from the store.",
  heroLink: "Open the vault",
  /** Above the tiles on the vault page. */
  shelfHeading: "Everything in the vault",
  shelfSub: "Search by what an indicator computes, or open any deposit for what it shows, how it helps and its free download.",
  /** The entrance (2026-10-08): the line under the lede, and its two ways in. */
  enter: "Open the vault",
  enterSearch: "Search by feature",
  /** Each product here is shown by its own NinjaTrader chart (content/loupe.ts). */
  chartsNote: "Every picture is the indicator on a real NinjaTrader 8 chart, magnified on the place where it does its work.",
  /** After the tiles: where the paid lineup is. */
  storeHeading: "Looking for the paid lineup?",
  storeText: "The flagship indicators, the Pro Series panels and the data utility are in the store, sold one by one or together as DS Complete. Nothing in the vault is needed to run them, and nothing in the vault is included with them.",
  storeCta: "Go to the store",
  /** On a vault product's own page, under its price. */
  pageNote: "Its own download, free permanently. It is not part of DS Complete: it runs beside it.",
  pageLink: "Everything in the Free Vault",
} as const;
