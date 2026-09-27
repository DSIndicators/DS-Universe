/**
 * "Before you buy" — the questions a buyer asks at the moment of deciding,
 * answered once, on the store page, directly under the prices and DS Complete.
 *
 * SOURCE (Tom, 2026-09-27): "DS Universe - Whop FAQ Before Purchase.xlsx",
 * built 2026-09-25 from the shipped READMEs, User Guides and the Master Product
 * Sheet. Tab "Store-wide FAQ" Q1-Q5 and tab "FAQ by Product" → DS Complete
 * Q2 and Q5, lightly revised for the site:
 *   · no product COUNTS (the site rule: the lineup changes) — Whop's "Five
 *     essentials are free" reads "The chart essentials are free" here;
 *   · the build number comes from SITE.minBuild, so it cannot drift;
 *   · Q "What happens right after I buy?" is not repeated as a question: the
 *     three steps beside the list (AFTER_CHECKOUT) already say it, word for word
 *     the way the READMEs and the Whop FAQ do;
 *   · added: "Are the free ones really free?" and "Can I get a refund?" — the
 *     second is Terms §13 in plain words (Tom chose to state it, 2026-09-27).
 * Store-wide Q6 ("What if I need help?") is the line under the list, with the
 * address as a link.
 *
 * Every answer is a documented behaviour, never an outcome. No profit, accuracy
 * or prediction language — NinjaTrader's vendor wording rules apply here too.
 */

import { SITE } from "./site";

export type Faq = {
  q: string;
  a: string;
  /** Optional link appended to the answer. */
  link?: { href: string; label: string };
};

export const FAQ: Faq[] = [
  {
    q: "What do DS Universe products run on?",
    a: `NinjaTrader 8, version ${SITE.minBuild} or newer (Help → About shows yours). Every product installs through NinjaTrader's own import — no file copying and nothing to compile.`,
  },
  {
    q: "Is this a subscription?",
    a: "No. Each product is one payment and yours to keep — no monthly fee, nothing to renew — and every later version is included. The chart essentials are free.",
  },
  {
    q: "Are the free ones really free?",
    a: "Yes, permanently. Not a trial and not a stripped build: the same product, through the same checkout, at no charge. They are the simplest way to see how DS Universe draws on your own chart before you pay for anything.",
  },
  {
    q: "Can I use it on more than one computer?",
    a: "Yes. Your license is tied to your NinjaTrader account, not to a machine, so it runs on any computer you sign into — desktop, laptop or VPS.",
  },
  {
    q: "Do these place trades for me?",
    a: "No. DS Universe products are charting and research tools: they draw on your chart and never place orders. What you do with a reading stays with you and your own risk rules.",
  },
  {
    q: "Is anything cut down in DS Complete?",
    a: "Nothing. It is a delivery method, not a different build: every product keeps its own settings, colors and guides, all licensed permanently to your NinjaTrader account. One archive, one import.",
  },
  {
    q: "I already own a DS product. Can I still get DS Complete?",
    a: "Yes. DS Complete contains every product, so before importing it you remove the single DS products you installed — free ones too — and restart NinjaTrader. Its README walks you through it.",
  },
  {
    q: "Can I get a refund?",
    a: "Because the software is delivered digitally, sales are final once the files have been issued, except where a refund is required by law. The free essentials and the charts on every product page are there so you can judge first.",
    link: { href: "/terms#section-13", label: "Terms, section 13" },
  },
];
