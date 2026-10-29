/**
 * THE 7-DAY FREE TRIAL ON DS COMPLETE (v3.1, Tom, 2026-10-29) — every word and
 * the one switch.
 *
 * WHAT IT IS. The whole of DS Complete can be tried free for 7 days before
 * anyone pays. Two systems make that happen, and the site describes both the
 * way they actually behave:
 *
 *   NINJATRADER  The trial is set on the one license, 2817, in the Vendor
 *            Dashboard. NinjaTrader's licensing guide: "customers using your
 *            product for the first time will be granted a free trial", "Free
 *            trials start the day a customer first uses your product", and
 *            "Users are limited to one free trial per product." One license,
 *            so one trial per NinjaTrader account covers every DS Complete tool,
 *            with nothing switched on by hand.
 *   WHOP     The DS Complete checkout (content/whop.ts COMPLETE_PLANS.trialMonthly,
 *            plan_BDcgf0PEsWLeP) is 7 days free, then $39.99 a month: a card is
 *            taken, nothing is charged today. The site sets those terms beside
 *            every trial button (pricing.ts COMPLETE_COPY.billing).
 *
 * THE WORDS. "Free" follows the FTC's guide to the word (16 CFR 251.1(c)): the
 * conditions sit next to the offer every time it is made — 7 days, from the
 * first day a tool is used, one per account. No "risk-free", no superlatives,
 * no promise of a result (NinjaTrader's vendor rules).
 *
 * The 3-day trial of 2026-09-29 (DS Oracle, DS Flow, DS ProRSI) ended on
 * 2026-10-14; its plans are refused by content/whop.ts.
 *
 * TO END THE TRIAL: set `active: false` — every trial mention disappears.
 */

import { COMPLETE, PRICES } from "./pricing";

export const TRIAL = {
  active: true,
  days: COMPLETE.trialDays,
  /** The mark's words. */
  label: `${COMPLETE.trialDays}-day free trial`,
  /** Where it applies. */
  on: COMPLETE.name,
} as const;

/** Every paid product is tried through DS Complete's one trial. */
export const hasTrial = (slug: string) => TRIAL.active && !!PRICES[slug]?.inComplete;
