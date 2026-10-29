import { COMPLETE, money } from "./pricing";

/**
 * Waitlist mode — the whole thing behind one switch.
 *
 * WHY IT EXISTS (Tom, 2026-09-10): every product on Whop is set to a waitlist
 * while the files are being attached. Whop's LISTING pages still show its
 * generic "Get access", but the checkout step is the waitlist form — it reads
 * "Join waitlist", shows "Total if accepted", and takes no payment. So the
 * checkout links stay exactly where they are; only our words change.
 *
 * TOM — TO OPEN THE DOORS: set `waitlist: false`. That is the whole job.
 * Every tile chip, every button label and every notice on the site turns back
 * to selling in one edit. Nothing else references the waitlist.
 *
 * `when` is optional. Leave it null and the copy reads "the day it opens";
 * set it to something like "September 2026" and every notice names it instead.
 */
export const LAUNCH: { waitlist: boolean; when: string | null } = {
  // OPENED 2026-09-25: every product live on Whop with files attached, direct
  // checkout links wired in content/whop.ts.
  waitlist: false,
  when: null,
};

/** Read this, never LAUNCH.waitlist directly — one name to grep for. */
export const onWaitlist = () => LAUNCH.waitlist;

/**
 * A call-to-action's words. Pass what the button says when the shop is open;
 * while it is on a waitlist it says Whop's own wording instead, so the button
 * and the page it opens agree.
 *
 * `whenWaiting` overrides that for buttons that go to OUR OWN shelf rather than
 * to Whop — an internal link cannot "join" anything, and a button that says it
 * does is a promise the next page does not keep.
 */
export const cta = (whenOpen: string, whenWaiting = "Join the waitlist") =>
  onWaitlist() ? whenWaiting : whenOpen;

/**
 * What happens after checkout — said the same way everywhere on the site, and
 * the same way the READMEs and the Whop FAQ say it (Tom, 2026-09-24: licenses
 * are granted by a person, from the NinjaTrader email asked at checkout).
 * Deliberately no promised turnaround time: none has been set.
 *
 * v3.1 (2026-10-29): the paid path is DS Complete only — one license (2817),
 * one archive, one import, installed as DSCompleteBundleSuite. The 7-day trial
 * is NinjaTrader's own: it starts the first day a tool is used, with nothing
 * switched on by hand. AFTER_CHECKOUT_FREE is the Free Vault's path.
 */
export const AFTER_CHECKOUT = {
  /** One line under a buy button. */
  short:
    `At checkout, enter the email on your NinjaTrader account. The files are yours at once; a paid license is switched on by hand, so allow a short wait. The ${COMPLETE.trialDays}-day trial starts by itself the first day you use a tool.`,
  /** The three steps — "Before you buy" at the foot of /products. */
  steps: [
    {
      title: "Start the trial on Whop",
      text: `Checkout asks for the email on your NinjaTrader account (not your Whop email) and a card. Nothing is charged for ${COMPLETE.trialDays} days; then ${money(COMPLETE.monthly)} a month until you cancel in your Whop account.`,
    },
    {
      title: "Download and import",
      text: `DS Complete is one archive and one import. In NinjaTrader 8.1.8.1 or newer: Tools → Import → NinjaScript Add-On, then restart. It installs as ${COMPLETE.assembly}.`,
    },
    {
      title: "Switched on",
      text: `On the trial, NinjaTrader starts the ${COMPLETE.trialDays} days the first day you use a tool. On a paid plan, a person activates the license on that NinjaTrader account; it is not instant. Once it is on, restart NinjaTrader and every tool draws.`,
    },
  ],
} as const;

/** The Free Vault's path: no license, nothing to switch on (2026-10-10).
 *  2026-10-22: worded for an add-on too (DS Time Intervals is not put on a
 *  chart; it is on every chart's toolbar), so no line says "it draws". */
export const AFTER_CHECKOUT_FREE = {
  /** One line under a free product's button. */
  short: "Free checkout on Whop, then download and import. There is no license to switch on: it is ready as soon as NinjaTrader restarts.",
  steps: [
    {
      title: "Get it free on Whop",
      text: "Each free product has its own free checkout. Nothing is charged and no card is asked for.",
    },
    {
      title: "Download and import",
      text: "The archive and its instructions are in your Whop account straight away. In NinjaTrader 8.1.8.1 or newer: Tools → Import → NinjaScript Add-On, then restart.",
    },
    {
      title: "It is ready",
      text: "There is no license and nothing to activate: add an indicator to a chart and it is there, and an add-on such as DS Time Intervals is on every chart's toolbar. Any computer you use NinjaTrader on.",
    },
  ],
} as const;
