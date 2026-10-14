/**
 * THE DS COMPLETE 7-DAY FREE TRIAL — every word and the one switch.
 * (Tom, 2026-10-11: "the WHOLE DS Complete bundle goes on a 7-day free trial
 * so users can find which indicators they need; every single indicator stays
 * at no free trial". Built into the site 2026-10-13. It replaces the 3-day
 * trial DS Oracle, DS Flow and DS ProRSI carried from 2026-09-29.)
 *
 * WHAT IT IS. Anyone can run every DS Complete tool — the paid products, plus
 * DS ASL and DS Toolkit, which come free with DS Complete — on their own
 * charts before paying anything. Single products are sold with NO trial of
 * their own: the site only ever offers the DS Complete trial, and a paid
 * product's page says it is inside it. Two systems make it work, and the site
 * describes both the way they actually behave:
 *
 *   WHOP     A $0 listing of its own, "DS Complete Free Trial": free, no card,
 *            no NinjaTrader-email question. It hands over the same DS Complete
 *            archive, README and guides a buyer gets. Whop's own free trials
 *            work only on recurring plans and charge the card when they end
 *            (docs.whop.com, "Free trials"), and DS Complete is a one-time
 *            payment, so the trial is a free listing, not a trial on the paid
 *            plan. Its checkout lives in content/whop.ts (`complete.trial`);
 *            with no link there the site shows no trial at all, and a
 *            production build stops (below).
 *   NINJATRADER  In the Ecosystem vendor dashboard "Free Trial" is 7 days on
 *            each of the twelve product IDs DS Complete grants (DS Complete
 *            has no ID of its own). NinjaTrader's licensing guide: "customers
 *            using your product for the first time will be granted a free
 *            trial", "Free trials start the day a customer first uses your
 *            product", "Users are limited to one free trial per product." So
 *            nobody switches a trial on by hand, and each TOOL's seven days
 *            start the first time that tool loads — a tool first opened on day
 *            five still gets its full week. Unlicensed afterwards, that tool
 *            stops drawing (OnBarUpdate and Plot are no longer called).
 *
 * `starts` records which of those a visitor should be told. It is
 * "first-load" because the dashboard is set that way. If the trial ever has to
 * be granted by hand instead, set "by-hand" and every sentence on the site that
 * says when the seven days start changes with it.
 *
 * THE WORDS. "Free" follows the FTC's guide to the word (16 CFR 251.1(c)): the
 * conditions sit next to the offer every time it is made in full — seven days
 * per tool, no card, nothing charged at the end, one per account, what keeping
 * it costs — never in a footnote. NinjaTrader's vendor rules apply as
 * everywhere else: no "risk-free", no superlatives, no promise of a result.
 * And no product COUNT is typed (Tom's rule): what is in the trial is listed
 * from the catalogue (content/release.ts COMPLETE_SHELVES).
 *
 * TO END THE TRIAL: set `active: false`. Every mark, band, line and button
 * disappears, /trial 404s, and nothing else needs touching.
 */

import { onWaitlist } from "./launch";
import { COMPLETE, money } from "./pricing";
import { COMPLETE_PRODUCTS, COMPLETE_SHELVES, type Shelf } from "./release";
import type { Product } from "./products";
import { WHOP } from "./whop";

export const TRIAL = {
  active: true,
  /** The length set on the twelve IDs in the NinjaTrader dashboard. */
  days: 7,
  /** When the seven days start — see above. */
  starts: "first-load" as "first-load" | "by-hand",
  /** Whether the Whop trial checkout asks for the NinjaTrader account email.
   *  It does not: nothing needs it, because NinjaTrader starts the trial. */
  asksEmail: false,
  /** The mark's words, set in mono small caps wherever the trial is named. */
  label: "7-day free trial",
  /** The same, short. */
  short: "7 days free",
  /** The button that goes to the trial checkout. */
  cta: "Start free trial",
  /** On a product that is inside the trial but has none of its own. */
  inLabel: "Free for 7 days in DS Complete",
  /** The help panel's row for such a product. */
  inShort: "7 days free, inside the DS Complete trial",
} as const;

/**
 * The trial checkout. While the real link is missing, `next dev` (and a
 * DS_PREVIEW_BUILD=1 build) point the buttons at DS Complete's own listing so
 * the trial can be looked at on localhost; a production build refuses to run
 * (below), so the live site can never carry a trial button that goes nowhere.
 */
const REAL_TRIAL = WHOP.complete?.trial;
const PREVIEW = process.env.NODE_ENV !== "production" || process.env.DS_PREVIEW_BUILD === "1";
const HREF: string | undefined = REAL_TRIAL ?? (PREVIEW ? WHOP.complete?.product : undefined);

if (TRIAL.active && !REAL_TRIAL && !PREVIEW) {
  throw new Error(
    "content/trial.ts: the DS Complete 7-day trial is switched on, but content/whop.ts has no trial checkout for it. " +
      "Put the \"DS Complete Free Trial\" plan in COMPLETE_TRIAL (content/whop.ts), or set TRIAL.active to false, before deploying.",
  );
}

/** Is the trial on the site at all. */
export const trialOn = () => TRIAL.active && !onWaitlist() && !!HREF;

/** The DS Complete trial checkout, or undefined when the trial is off. */
export const trialCheckout = () => (trialOn() ? HREF : undefined);

/** The trial's own Whop listing page (description, welcome), when known. */
export const trialListing = () => (trialOn() ? (WHOP.complete?.trialListing ?? undefined) : undefined);

/** Everything the trial lets a trader run, in catalogue order: DS Complete's contents. */
export function trialProducts(): Product[] {
  return trialOn() ? COMPLETE_PRODUCTS : [];
}

/** The same, by series — the shape the trial's "what you can run" list is set in. */
export function trialShelves(): Shelf[] {
  return trialOn() ? COMPLETE_SHELVES : [];
}

/** Is this product (or DS Complete itself) inside the trial. */
export const inTrial = (slug: string) => trialOn() && (slug === COMPLETE.key || COMPLETE_PRODUCTS.some((p) => p.slug === slug));

/** The trial checkout for anything inside it, else undefined. */
export const trialHref = (slug: string) => (inTrial(slug) ? HREF : undefined);

/** What keeping everything costs: DS Complete's price, one payment. */
export const keepPrice = () => money(COMPLETE.now);

/** When a tool's seven days start, in one phrase. */
export const startsWhen = () =>
  TRIAL.starts === "first-load" ? "the first time that tool loads in NinjaTrader" : "when your trial license is switched on";

/**
 * The conditions — the terms of the offer, set beside it every time it is made
 * in full (the home band, /trial). Shorter forms travel with every smaller mark.
 */
export function trialTerms() {
  return [
    { k: "Length", v: `${TRIAL.days} days for each tool, from ${startsWhen()}.` },
    { k: "What runs", v: `Every ${COMPLETE.name} tool, from the same archive buyers get.` },
    { k: "Cost", v: "Free. No card is asked for." },
    { k: "When it ends", v: "That tool stops drawing. Nothing is charged and nothing renews." },
    { k: "Limit", v: "One trial per product, per NinjaTrader account." },
    { k: "To keep it", v: `${COMPLETE.name}, ${keepPrice()} in one payment, with nothing to reinstall. Or only the tools you used, one by one.` },
  ];
}

/** How taking the trial works, in three steps — the same order as the buy steps. */
export function trialSteps() {
  return [
    {
      title: "Check out free on Whop",
      text: TRIAL.asksEmail
        ? `Enter the email on your NinjaTrader account. The ${COMPLETE.name} archive and its guides are yours at once.`
        : `No card and no license to wait for. The ${COMPLETE.name} archive and its guides are yours at once.`,
    },
    {
      title: "Import it once",
      text:
        TRIAL.starts === "first-load"
          ? "Tools → Import → NinjaScript Add-On, then restart NinjaTrader. Each tool's seven days start the first time you put it on a chart, so you can take them one at a time."
          : "Tools → Import → NinjaScript Add-On. A person switches the trial license on; the seven days start then.",
    },
    {
      title: "Keep it, or let it end",
      text: `Buy ${COMPLETE.name} for ${keepPrice()} and the license goes on the same NinjaTrader account, with nothing to reinstall; buy a day or two before a week ends and it is switched on while the trial still runs. Or buy only the tools you used. Or do nothing: each tool simply stops.`,
    },
  ];
}

/** The one step a trader who already owns a single DS product must take first. */
export const TRIAL_OWNER_NOTE = `Already own a single paid DS product? Remove it first (Tools → Remove NinjaScript Assembly, then restart NinjaTrader): ${COMPLETE.name} contains it, and two copies of one product clash. Your license on it stays and works inside ${COMPLETE.name}.`;
