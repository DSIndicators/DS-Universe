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
 *   · the license: none since 2026-10-10 — the free builds carry no license
 *     check (content/launch.ts AFTER_CHECKOUT_FREE, the same words the READMEs
 *     and the Whop FAQ use).
 * No product count (the lineup changes), no outcome, no superlative.
 *
 * 2026-10-22: DS Time Intervals is an add-on, not an indicator, so nothing
 * here says a vault product "draws" — "import it and it is ready" is true of
 * both kinds. The README is the guide for the two products of that day.
 *
 * 2026-10-25: DS MACD, DS Stochastics and DS Squeeze were discontinued, DS VWAP
 * moved onto the chart (v3.0) and DS Volume joined, so "the panels" left the
 * home band. Every license on the old free product IDs was switched off the
 * same day; the one answer for a visitor who still sees a license message is
 * licenseNote below, shown once under "How it works" on /free-vault.
 *
 * DS TOOLKIT IS NOT IN THE VAULT (2026-10-05, later the same day): it comes
 * free with DS Complete and is not offered on its own, so no sentence here
 * names the rail.
 */

import { COMPLETE_COPY } from "./pricing";

/* v3.1 (2026-10-29): the approved Free Vault wording (Website copy v3.1.md) —
   the charter body as the lede, and the one line to DS Complete. */
export const VAULT_COPY = {
  /** The mark's words, set in mono small caps wherever the vault is named. */
  label: "Free Vault",
  /** The page's headline. */
  title: "The Free Vault.",
  /** One or two plain sentences: what it is, and how a free license works. */
  lede: "A whole vault of free indicators, each optimized, kept current and free of license keys. Download any of them, import it once, and it draws the moment it is in. New tools are added as they are built.",
  /** The facts, as a spec sheet beside the headline. */
  facts: [
    { k: "Price", v: "Free, permanently. Not a trial." },
    { k: "Download", v: "Each product is its own download, with its own README." },
    { k: "License", v: "None needed. Import it and it is ready, on any computer you use NinjaTrader on." },
    { k: "DS Complete", v: "Not part of it. A free product runs beside it." },
  ],
  /** Said once, under "How it works" (2026-10-25: every license on the old free
   *  product IDs was switched off). The announcement's approved words, with the
   *  menu path in place of "as in step 1". */
  licenseNote: {
    k: "Seeing a license message on a free DS tool?",
    v: "That copy is from before the free tools stopped needing a license. Remove it (Tools → Remove NinjaScript Assembly), restart NinjaTrader, and download the new one from the Free Vault.",
  },
  /** The home page band. */
  band: {
    heading: "Free tools, kept in a place of their own.",
    text: "The Free Vault holds the free DS Universe products — the price line, the price readout, the level map, the higher-timeframe matrix, the session levels, the VWAP on your chart, volume read against the clock, a live chart background and one-click timeframe buttons. Each is its own download, free permanently, and none of them is part of DS Complete.",
    cta: "Open the Free Vault",
  },
  /** The one line in the home hero. */
  hero: "Free indicators and tools, each its own download — not a trial, and separate from the store.",
  heroLink: "Open the vault",
  /** Above the tiles on the vault page. */
  shelfHeading: "Everything in the vault",
  shelfSub: "Search by what an indicator computes, or tick the features you want. Every product is its own free download.",
  /** The entrance (2026-10-08): the line under the lede, and its two ways in. */
  enter: "Open the vault",
  enterSearch: "Search by feature",
  /** Each product here is shown by its own NinjaTrader chart (content/covers.ts). */
  chartsNote: "Every picture is the product on a real NinjaTrader 8 chart; hand-drawn marks on a picture are added for illustration.",
  /** After the tiles: where the paid lineup is. */
  storeHeading: "Looking for the paid lineup?",
  storeText: `${COMPLETE_COPY.fromVault} Nothing in the vault is needed to run them, and nothing in the vault is part of DS Complete.`,
  storeCta: "See DS Complete",
  /** On a vault product's own page, under its price. */
  pageNote: "Its own download, free permanently. It is not part of DS Complete: it runs beside it.",
  pageLink: "Everything in the Free Vault",
} as const;
