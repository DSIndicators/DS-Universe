/**
 * THE SESSION LEVELS PAIR — its words, in one place (Tom, 2026-09-30).
 *
 *   DS Session Levels       free for everyone (Whop plan_LhYBx2nIIXwck)
 *   DS Pro Session Levels   free with DS Complete, not sold on its own —
 *                           "a little thank you to the Founders"
 *
 * Tom's picks (2026-09-30): ONE panel holding both, straight under DS Complete
 * with the thread reading "New · Inside DS Complete" (content/release.ts
 * NEW_SERIES), and ONE quiet line in the home hero. Everything the panel and
 * the hero line say is drawn from the two products' own rows in
 * content/products.ts and from content/pricing.ts GIFT — nothing here invents a
 * capability. Every sentence is documented behaviour from the READMEs; no
 * outcome, no superlative (NinjaTrader vendor guidelines).
 *
 * WHEN IT IS NO LONGER NEW: set NEW_SERIES to null in content/release.ts and
 * `NEW_NOTE.active` to false here. The panel moves to its catalogue place
 * (after the Pro Series) and the hero line goes; nothing else changes.
 */

import { BY_SLUG } from "./products";

export const PAIR = {
  free: "session-levels",
  pro: "pro-session-levels",
} as const;

/** The one line in the home hero, under the trial note. No price in the hero. */
export const NEW_NOTE = {
  active: true,
  label: "New",
  /** The sentence. The product names are set in ink by the component. */
  free: BY_SLUG[PAIR.free].name,
  freeLine: ", free for everyone — and ",
  pro: BY_SLUG[PAIR.pro].name,
  proLine: ", the volume inside each session, free with DS Complete.",
  link: "See the pair",
} as const;

/**
 * The Free | Pro sheet in the panel. Its rows are the two products' own
 * cover hooks, in order: DS Session Levels' four (both draw them — DS Pro
 * Session Levels "draws everything DS Session Levels does", its README), then
 * DS Pro Session Levels' four (only it draws them). Built from the catalogue,
 * so the sheet can never say something the product pages do not.
 */
export const COMPARE = {
  heading: "What each one does",
  rows: [
    ...BY_SLUG[PAIR.free].hooks.map((h) => ({ text: h, free: true, pro: true })),
    ...BY_SLUG[PAIR.pro].hooks.map((h) => ({ text: h, free: false, pro: true })),
  ],
  /** Both READMEs: "Use one or the other on a chart, not both." */
  note: "Use one or the other on a chart — DS Pro Session Levels draws everything DS Session Levels does, with the volume added.",
} as const;

if (BY_SLUG[PAIR.free]?.series !== "sessions" || BY_SLUG[PAIR.pro]?.series !== "sessions") {
  throw new Error("content/sessions.ts: the pair must both be in the \"sessions\" series (content/products.ts).");
}
