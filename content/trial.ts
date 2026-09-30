/**
 * THE 3-DAY FREE TRIAL — every word and the one switch (Tom, 2026-09-29).
 *
 * WHAT IT IS. Three paid indicators — DS Oracle, DS Flow and DS ProRSI — can be
 * run free for three days before anyone pays. Two systems make that happen,
 * and the site describes both the way they actually behave:
 *
 *   WHOP     Each of the three products has a second plan, "3-Day Free Trial":
 *            Free, no card, the same required "NinjaTrader account email"
 *            question as the paid plan. It hands over the same archive and
 *            guide a buyer gets. The links live in content/whop.ts (`trial`),
 *            and a product appears in the trial ONLY if it has one there.
 *   NINJATRADER  In the Ecosystem vendor dashboard each of the three has
 *            "Free Trial?" switched on at 3 days. NinjaTrader's licensing guide:
 *            "If you have a free trial configured, customers using your product
 *            for the first time will be granted a free trial", "Free trials
 *            start the day a customer first uses your product", and "Users are
 *            limited to one free trial per product." So nobody has to switch a
 *            trial on by hand: the clock starts when the indicator first loads
 *            on that NinjaTrader account. Unlicensed afterwards = it stops
 *            running (OnBarUpdate and Plot are no longer called).
 *
 * `starts` records which of those two a visitor should be told. It is
 * "first-load" because the dashboard is set that way. If a trial ever has to be
 * granted by hand instead, set it to "by-hand" and every sentence on the site
 * that says when the three days start changes with it.
 *
 * THE WORDS. "Free" follows the FTC's guide to the word (16 CFR 251.1(c)): the
 * conditions sit next to the offer every time it is made — three days, no card,
 * nothing charged at the end, one per account — never in a footnote.
 * NinjaTrader's vendor rules apply as everywhere else: no "risk-free", no
 * superlatives, no promise of a result. And no product COUNT is typed: the
 * names are listed from the data, so adding a fourth trial is one link in
 * content/whop.ts.
 *
 * TO END THE TRIAL: set `active: false`. Every mark, band, strip and button
 * disappears and the site is exactly what it was before 2026-09-29.
 */

import { onWaitlist } from "./launch";
import { PRICES, money } from "./pricing";
import { BY_SLUG, type Product } from "./products";
import { WHOP } from "./whop";

export const TRIAL = {
  active: true,
  /** The length Whop and the NinjaTrader dashboard are both set to. */
  days: 3,
  /** When the three days start — see above. */
  starts: "first-load" as "first-load" | "by-hand",
  /** The mark's words, set in mono small caps wherever the trial is named. */
  label: "3-day free trial",
  /** The same, short — under a tile price, where a line is ~130px wide. */
  short: "3 days free",
  /** The button that goes to the trial checkout. */
  cta: "Start free trial",
  /** The hover button on a shelf tile. */
  ctaTile: "Try 3 days free",
} as const;

/** The trial products, in the order content/whop.ts lists them. */
export function trialProducts(): Product[] {
  if (!TRIAL.active || onWaitlist()) return [];
  return Object.entries(WHOP).flatMap(([slug, w]) => (w.trial && BY_SLUG[slug] ? [BY_SLUG[slug]] : []));
}

export const hasTrial = (slug: string) => trialProducts().some((p) => p.slug === slug);

/** The trial checkout for a product, or undefined. */
export const trialHref = (slug: string) => (hasTrial(slug) ? WHOP[slug]?.trial : undefined);

/** "DS Oracle, DS Flow and DS ProRSI" — the house list style, no serial comma. */
export function trialNames(): string {
  const n = trialProducts().map((p) => p.name);
  return n.length < 2 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}

/** What keeping a trial product costs: "$79.99" when they share one price, else null. */
export function keepPrice(slug?: string): string | null {
  const ps = (slug ? [slug] : trialProducts().map((p) => p.slug)).map((s) => PRICES[s]);
  const first = ps[0];
  if (!first || first.free || !ps.every((p) => p && !p.free && p.now === first.now)) return null;
  return money(first.now);
}

/** When the three days start, in one phrase. */
export const startsWhen = () =>
  TRIAL.starts === "first-load" ? "the first time it loads in NinjaTrader" : "when your trial license is switched on";

/**
 * The conditions — the terms of the offer, set beside it every time it is made
 * in full (the home band, /trial). Short forms travel with every smaller mark.
 */
export function trialTerms(slug?: string) {
  const keep = keepPrice(slug);
  return [
    { k: "Length", v: `${TRIAL.days} days, from ${startsWhen()}.` },
    { k: "Cost", v: "Free. No card is asked for." },
    { k: "When it ends", v: "It stops running. Nothing is charged and nothing renews." },
    { k: "Limit", v: "One trial per product, per NinjaTrader account." },
    {
      k: "To keep it",
      v: `${keep ? `${keep}, one payment` : "One payment"}. Nothing to reinstall.`,
    },
  ];
}

/** How taking the trial works, in three steps — the same order as the buy steps. */
export function trialSteps() {
  const keep = keepPrice();
  return [
    {
      title: "Check out free on Whop",
      text: "Enter the email on your NinjaTrader account — not your Whop email. The archive and its guide are yours at once.",
    },
    {
      title: TRIAL.starts === "first-load" ? "Import it and load it" : "Import it",
      text:
        TRIAL.starts === "first-load"
          ? "Tools → Import → NinjaScript Add-On, then put it on a chart. NinjaTrader starts the three days itself — nothing to wait for."
          : "Tools → Import → NinjaScript Add-On. A person switches the trial license on; the three days start then.",
    },
    {
      title: "Keep it, or let it end",
      text: `Buy it${keep ? ` for ${keep}` : ""} whenever you like — during the three days or after — and the license goes on the same NinjaTrader account. Or do nothing: it simply stops.`,
    },
  ];
}
