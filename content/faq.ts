/**
 * "Before you buy" — the questions a buyer asks at the moment of deciding,
 * answered once, on the store page, and in Help on every page.
 *
 * SOURCE (v3.1, 2026-10-29): the store-wide answers of "DS Universe - Whop FAQ
 * (Before Purchase).xlsx" as approved in the hand-off's "Website copy v3.1.md"
 * (questions 1–7), with the build number and every price read from data so
 * they cannot drift. Kept from the site's own list, brought to v3.1: which
 * markets, the free ones, what DS Complete holds, owning an earlier DS
 * product, and refunds (Terms §13, Tom 2026-09-27).
 *
 * Every answer is a documented behaviour, never an outcome. No profit, accuracy
 * or prediction language — NinjaTrader's vendor wording rules apply here too.
 */

import { SITE } from "./site";
import { COMPLETE, COMPLETE_COPY, COMPLETE_GROUPS, FOUNDERS, PRICE_MONTHLY, money } from "./pricing";
import { COMPLETE_HREF } from "./links";
import { VAULT_PATH } from "./release";
import { HOME_MARKETS, tapeOnlySlugs } from "./markets";
import { BY_SLUG } from "./products";

/** "DS Zones, DS Iceberg, DS Flow and DS ASL" — the products that read traded
 *  volume, named from content/markets.ts so the answer cannot drift from the
 *  product pages. */
const tapeNames = (): string => {
  const n = tapeOnlySlugs().map((s) => BY_SLUG[s]?.name ?? s);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : (n[0] ?? "");
};

export type Faq = {
  q: string;
  a: string;
  /** Optional link appended to the answer. */
  link?: { href: string; label: string };
};

export const FAQ: Faq[] = [
  {
    q: "What platform do DS Universe products run on?",
    a: `NinjaTrader 8, version ${SITE.minBuild} or newer (Help → About shows yours). Every product installs through NinjaTrader's own import: no file copying and nothing to compile.`,
  },
  {
    q: "What does it cost? Is it a subscription?",
    a: `Free and affordable. The Free Vault is free for good. All paid products are in DS Complete: ${PRICE_MONTHLY} or ${money(COMPLETE.own)} to own, a founders price ${FOUNDERS.until}. Founders get ${FOUNDERS.keeps}.`,
  },
  {
    q: "Can I try it first?",
    a: `Yes. DS Complete has a ${COMPLETE.trialDays}-day free trial. NinjaTrader starts it the first day you use a tool, one trial per account, so you can see which tools earn a place on your chart. ${COMPLETE_COPY.billing}`,
    link: { href: COMPLETE_HREF, label: "DS Complete" },
  },
  {
    q: "What happens right after I buy?",
    a: "You get the files straight away and can install them and read the guides. Free Vault products run the moment you import them. Your license is switched on by hand, by a person, using the NinjaTrader email you enter at checkout; then restart NinjaTrader.",
  },
  {
    q: "What is in DS Complete?",
    a: `Every paid DS tool, on one license and in one import. ${COMPLETE_GROUPS.map((g) => `${g.name}: ${g.names.join(", ")}.`).join(" ")} Each keeps its own settings, colors and guides; nothing is cut down. The Free Vault is not part of it.`,
    link: { href: COMPLETE_HREF, label: "DS Complete" },
  },
  // Markets (2026-10-01): the question every buyer has before the price. The
  // short answer here; the exact one is the Markets block on each product page.
  {
    q: "Which markets do they run on?",
    a: `Most are built on Nasdaq futures, ${HOME_MARKETS.join(" and ")}, and most run on any market NinjaTrader charts: futures, stocks, forex and crypto. ${tapeNames()} read traded volume, so they are for futures and stocks; forex and CFDs report none in NinjaTrader. DS GEX draws the Nasdaq-100, the S&P 500 and gold. Every product page lists its own markets.`,
  },
  {
    q: "Are the free ones really free?",
    a: "Yes, for good. Not a trial and not a stripped build. They live in the Free Vault, each as its own download, and none of them is part of DS Complete. A free product needs no license: there is nothing to switch on, and it is ready as soon as you import it.",
    link: { href: VAULT_PATH, label: "Open the Free Vault" },
  },
  {
    q: "Can I use it on more than one computer?",
    a: "Yes. Your DS Complete license is tied to your NinjaTrader account, not to a machine, and the Free Vault products need no license at all. Everything runs on any computer you sign into: desktop, laptop or VPS.",
  },
  {
    q: "Do these place trades for me?",
    a: "No. DS Universe products are charting and research tools: they draw on your chart and never place orders. What you do with a reading stays with you and your own risk rules.",
  },
  {
    q: "What if I need help?",
    a: `Email ${SITE.email}, and a person answers, not a form. Every product comes with a README covering what it shows, its settings and troubleshooting, and most with detailed guides as well.`,
  },
  {
    q: "I already have DS products installed. What do I do?",
    a: `Before importing DS Complete, go to Tools → Remove NinjaScript Assembly, select ${COMPLETE.assembly} and every other DS assembly in the list, remove them and restart NinjaTrader. Two copies of one product clash. The DS Complete README walks you through it.`,
  },
  {
    q: "Can I get a refund?",
    a: `Because the software is delivered digitally, sales are final once the files have been issued, except where a refund is required by law. The ${COMPLETE.trialDays}-day trial and the Free Vault are there so you can judge first.`,
    link: { href: "/terms#section-13", label: "Terms, section 13" },
  },
];
