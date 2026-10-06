/**
 * "Before you buy" — the questions a buyer asks at the moment of deciding,
 * answered once, on the store page, directly under the prices and DS Complete.
 *
 * SOURCE (Tom, 2026-09-27): "DS Universe - Whop FAQ Before Purchase.xlsx",
 * built 2026-09-25 from the shipped READMEs, User Guides and the Master Product
 * Sheet. Tab "Store-wide FAQ" Q1-Q5 and tab "FAQ by Product" → DS Complete
 * Q2 and Q5, lightly revised for the site:
 *   · no product COUNTS (the site rule: the lineup changes);
 *   · the build number comes from SITE.minBuild, so it cannot drift;
 *   · Q "What happens right after I buy?" is not repeated as a question: the
 *     three steps beside the list (AFTER_CHECKOUT) already say it, word for word
 *     the way the READMEs and the Whop FAQ do;
 *   · added: "Are the free ones really free?" and "Can I get a refund?" — the
 *     second is Terms §13 in plain words (Tom chose to state it, 2026-09-27).
 *   · added 2026-10-01: "Which markets do they run on?" — a site question, not
 *     yet on Whop; its facts come from content/markets.ts (the Master sheet's
 *     Markets tab), so it cannot disagree with the product pages.
 * Store-wide Q6 ("What if I need help?") is the line under the list, with the
 * address as a link.
 *
 * Every answer is a documented behaviour, never an outcome. No profit, accuracy
 * or prediction language — NinjaTrader's vendor wording rules apply here too.
 */

import { SITE } from "./site";
import { BUNDLED, BUNDLED_NAMES, WITH_BUNDLE, bundledFor } from "./pricing";
import { VAULT_PATH, productHref } from "./release";
import { TRIAL, keepPrice, startsWhen, trialNames, trialProducts } from "./trial";
import { HOME_MARKETS, tapeOnlySlugs } from "./markets";
import { BY_SLUG } from "./products";

/** "DS Zones, DS Iceberg, DS Flow and DS ASL" — the products
 *  that read traded volume, named from content/markets.ts so the answer below
 *  cannot drift from the product pages. */
const tapeNames = (): string => {
  const n = tapeOnlySlugs().map((s) => BY_SLUG[s]?.name ?? s);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : (n[0] ?? "");
};

/** What a "How do I get …?" answer adds after the product's own note. */
const MORE: Record<string, string> = {
  asl: "It draws everything DS Session Levels does, with each session's volume added, so use one or the other on a chart. DS Session Levels itself is free for everyone, in the Free Vault.",
};
if (!bundledFor("asl")) throw new Error("content/faq.ts: the DS ASL answer has no product to belong to.");

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
  // Markets (2026-10-01): the question every buyer has before the price, and
  // sales are final once the files are issued. The short answer here; the
  // exact one is the Markets block on each product page (content/markets.ts).
  {
    q: "Which markets do they run on?",
    a: `They are built on Nasdaq futures — ${HOME_MARKETS.join(" and ")} — and most run on any market NinjaTrader charts: futures, stocks, forex and crypto. ${tapeNames()} read traded volume, so they are for futures and stocks; forex and CFDs report none in NinjaTrader. DS GEX draws the Nasdaq-100, the S&P 500 and gold. Every product page lists its own markets.`,
  },
  {
    q: "Is this a subscription?",
    a: "No. Each paid product is one payment and yours to keep — no monthly fee, nothing to renew — and every later version is included. The products in the Free Vault are free.",
  },
  // The 3-day free trial (2026-09-29, content/trial.ts) — present only while
  // the trial is on. Every condition in one answer: length, start, cost, end,
  // limit, keeping it, and the one extra step if the buyer moves to DS Complete.
  ...(trialProducts().length
    ? [
        {
          q: "Can I try one before I buy?",
          a: `Yes. ${trialNames()} each have a ${TRIAL.label}. Check out free on Whop with your NinjaTrader account email, import it, and the ${TRIAL.days} days start ${startsWhen()}. No card is asked for and nothing is charged when it ends — it simply stops running. One trial per product, per NinjaTrader account. To keep it, buy it${keepPrice() ? ` for ${keepPrice()}` : ""}: the license goes on the same account, with nothing to reinstall. Moving to DS Complete instead? Remove the trial product and restart NinjaTrader first, as with any single DS product.`,
          link: { href: "/trial", label: "How the trial works" },
        },
      ]
    : []),
  // The Free Vault (2026-10-05): free, each its own download, never part of
  // DS Complete — the sheet's own words — and licensed like everything else.
  // (DS Toolkit is not one of them: it comes free with DS Complete.)
  {
    q: "Are the free ones really free?",
    a: "Yes, permanently. Not a trial and not a stripped build: the same product, through the same checkout, at no charge. They live in the Free Vault, each as its own download, and none of them is part of DS Complete. A free product is licensed like a paid one: checkout asks for your NinjaTrader account email, and the license is switched on by hand.",
    link: { href: VAULT_PATH, label: "Open the Free Vault" },
  },
  // FREE WITH DS COMPLETE (content/pricing.ts BUNDLED): the products that are
  // not sold on their own — DS ASL and DS Toolkit — and how a buyer gets each.
  // One question per product, built the same way: the standard sentence, then
  // that product's own note (BUNDLED.note), then what else a buyer should know.
  ...BUNDLED.map((b) => ({
    q: `How do I get ${b.name}?`,
    a: `With DS Complete — ${b.name}, ${b.long}, ${WITH_BUNDLE.line}; it is inside the DS Complete archive. ${b.note}${MORE[b.slug] ? ` ${MORE[b.slug]}` : ""}`,
    link: { href: productHref(b.slug), label: b.name },
  })),
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
    a: `Nothing. It is a delivery method, not a different build: every product in it keeps its own settings, colors and guides, all licensed permanently to your NinjaTrader account. One archive, one import. ${BUNDLED_NAMES} ${BUNDLED.length > 1 ? WITH_BUNDLE.lineAll : WITH_BUNDLE.line}. The Free Vault products are not in it — each of those is its own download.`,
  },
  {
    q: "I already own a DS product. Can I still get DS Complete?",
    a: `Yes. DS Complete contains every paid product, and ${BUNDLED_NAMES} with them, so before importing it you remove the DS products you installed one by one, including an earlier DS Toolkit, and restart NinjaTrader first. Its README walks you through it.`,
  },
  {
    q: "Can I get a refund?",
    a: "Because the software is delivered digitally, sales are final once the files have been issued, except where a refund is required by law. The Free Vault and the charts on every product page are there so you can judge first.",
    link: { href: "/terms#section-13", label: "Terms, section 13" },
  },
];
