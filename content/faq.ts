import { BILLING, COUNT, ESSENTIALS, FOUNDERS, PRICE_DAY, PRICE_MONTHLY } from "./vaults";
import { MANAGE } from "./store";
import { SITE } from "./site";

/**
 * The questions people ask before they join, answered once. Short answers,
 * plain words, the real terms (Terms & Conditions, sections on memberships and
 * refunds). `short` marks the five the home page shows; /how-it-works shows all.
 */
export type Faq = { q: string; a: string[]; short?: boolean };

export const FAQ: Faq[] = [
  {
    short: true,
    q: "What is the difference between the two vaults?",
    a: [
      `The Free Vault holds ${COUNT.free} free tools. A free account opens it, each tool is its own download, and none of them needs a license. They are free for good, not a trial and not a stripped build.`,
      `The ${ESSENTIALS.name} holds every paid DS indicator, ${COUNT.essentials} today, for one membership at ${PRICE_MONTHLY}. Members keep the Free Vault too, on the same account.`,
    ],
  },
  {
    short: true,
    q: "How does the membership work?",
    a: [
      BILLING,
      "Checkout asks for the email on your NinjaTrader account, because the license is tied to it. Access is switched on by a person after checkout, so allow a short gap before your first chart: until then NinjaTrader shows a Vendor Notification, which is expected. Restart NinjaTrader once you are switched on.",
    ],
  },
  {
    q: "Is there a free trial?",
    a: [
      `No. The membership is ${PRICE_MONTHLY}, about ${PRICE_DAY} a day, month to month: cancel any time and you are not billed again. If you would rather start at no cost, the Free Vault is free for good.`,
    ],
  },
  {
    short: true,
    q: "Can I cancel any time?",
    a: [
      `Yes. Memberships are handled by Whop, our checkout: sign in at ${MANAGE.path}, and cancel there. Cancelling stops the next renewal and you keep the vault until the end of the period you have already paid for.`,
      "Payments already made are not refunded part-way through a month (Terms & Conditions, section 13).",
    ],
  },
  {
    short: true,
    q: "Do I get new indicators as they are made?",
    a: [
      "Yes, that is the point of the vault. Every new paid DS indicator goes into the Essentials Vault, and members get it at no extra cost. There is no bundle to buy again and no upgrade fee.",
      FOUNDERS.active ? `Today's price is the founders price, ${FOUNDERS.until}. ${FOUNDERS.rising}` : "",
    ].filter(Boolean),
  },
  {
    short: true,
    q: "What do I need to run them?",
    a: [
      `${SITE.platform}, version ${SITE.minBuild} or newer, on Windows. NinjaTrader itself is free to download and to use on a simulated account.`,
      "Each tool's own page says what it reads from your chart, so you can check before you join.",
    ],
  },
  {
    q: "How do updates reach me?",
    a: [
      `Updates are included. When a new version goes out you get the new archive: in NinjaTrader open Tools, then Remove NinjaScript Assembly, remove the old one (${ESSENTIALS.assembly} for the whole vault, or the tool's own name), restart NinjaTrader, and import the new archive.`,
      "You can take the whole vault in one archive or only the tools you use. Install each tool one way, not both.",
    ],
  },
  {
    q: "Is any of this trading advice or a signal service?",
    a: [
      "No. DS Universe tools are charting and research software. They draw what the market did, in plain words, and leave every decision to you. Nothing on this site is a forecast, a performance record or a promise of a result.",
    ],
  },
  {
    q: "Who is behind DS Universe?",
    a: [`DS Universe is built in ${SITE.city} by an intraday MNQ and MES futures trader. Questions go straight to ${SITE.email}.`],
  },
];
