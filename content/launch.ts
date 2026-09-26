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

/** "the day it opens" / "in September 2026" — one phrasing, used everywhere. */
export const opensWhen = () => (LAUNCH.when ? `in ${LAUNCH.when}` : "the day it opens");

/**
 * The one-line promise, used under the hero, on /pricing and on product pages.
 * Deliberately plain: it says what joining does and what it does not do.
 */
export const WAITLIST_NOTE = {
  /** Short — sits beside a price or a button. */
  short: "Joining costs nothing.",
  /** Long — carries the whole promise on its own. */
  long: `Every product is on the waitlist while we finish attaching files. Joining costs nothing and charges nothing — you are told ${LAUNCH.when ? `when it opens ${LAUNCH.when}` : "the day it opens"}.`,
  /** The chip that marks a product. */
  chip: "Waitlist",
} as const;

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
 */
export const AFTER_CHECKOUT = {
  /** One line under a buy button. */
  short:
    "At checkout, enter the email on your NinjaTrader account. The files are yours at once; the license is switched on by hand, so allow a short wait.",
  /** The three steps, for the pricing and products pages. */
  steps: [
    {
      title: "Check out on Whop",
      text: "Checkout asks for the email on your NinjaTrader account — not your Whop email. Free products go through the same checkout, at no charge.",
    },
    {
      title: "Download and import",
      text: "The archive and its guides are in your Whop account straight away. In NinjaTrader 8.1.8.1 or newer: Tools → Import → NinjaScript Add-On, then restart.",
    },
    {
      title: "Switched on by hand",
      text: "A person activates the license on that NinjaTrader account. It is not instant — once it is on, restart NinjaTrader and the product draws.",
    },
  ],
} as const;
