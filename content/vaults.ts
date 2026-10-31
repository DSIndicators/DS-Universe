/**
 * THE TWO VAULTS (Tom, 2026-10-30). ONE file: every name, price and promise
 * the site states comes from here, never typed in a page.
 *
 *   FREE VAULT        free tools, a free account. Each tool its own download,
 *                     no license.
 *   ESSENTIALS VAULT  the membership. Every paid DS indicator, and every one
 *                     added later, for one monthly price. Replaces "DS Complete"
 *                     as the name and the idea: not a $1,000 package you buy,
 *                     a vault you are a member of. New indicators simply go
 *                     into one vault or the other; nothing is re-packaged.
 *
 * The machinery, as the business docs of 2026-10-30 set it ("DS Universe
 * Complete Product ID's.txt", "Whop Listing FAQ (4 questions).md"): one
 * NinjaTrader license, product ID 2835 ("DS Essentials Vault", a new add-on
 * on 2026-10-30 because the Vendor Dashboard cannot rename 2817), for every
 * paid tool; the whole vault downloads as one archive (assembly
 * DSEssentialsVault) or tool by tool (each its own assembly), and a customer
 * installs each tool one way, not both. Access to 2835 is switched on by hand
 * after checkout. The assembly name is
 * what NinjaTrader shows in Tools > Remove NinjaScript Assembly, so it is
 * stated as-is wherever install steps need it.
 *
 * PRICE: the v3.1 founders price, $39.99 a month.
 * NO FREE TRIAL (Tom, 2026-10-30: "$39.99 is already extremely cheap for
 * $1.31 a day. Also users would be able to input and copy them. Let's keep it
 * simple and remove the 7-day free trial"). The build refuses trial wording.
 * TOM: change a price on Whop and here in the same sitting.
 */
import { PRODUCTS, type Product } from "./products";

export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "A, B and C" — the house list style, no serial comma. */
export const listOf = (names: string[]) =>
  names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export const ESSENTIALS = {
  key: "essentials",
  name: "DS Essentials Vault",
  short: "Essentials Vault",
  /** Founders price, per month. */
  monthly: 39.99,
  license: 2835,
  /** The whole vault's assembly (business docs, 2026-10-30). Each tool also ships as its own archive under its own assembly. */
  assembly: "DSEssentialsVault",
  /**
   * The founders "own it outright" option from v3.1 ($149.99 once). Its Whop
   * plan does not exist yet, so it is shown as a quiet "opening soon" line,
   * never a button. Set `show: false` to drop it from the site entirely.
   */
  lifetime: { show: true, price: 149.99 },
} as const;

export const FREE = {
  key: "free",
  name: "DS Free Vault",
  short: "Free Vault",
} as const;

/** "$39.99" / "$39.99 a month" — said the same way everywhere. */
export const PRICE = money(ESSENTIALS.monthly);
export const PRICE_MONTHLY = `${PRICE} a month`;
/** The same price per day, rounded to the cent (an average month, 365/12 days). */
export const PRICE_DAY = money(Math.round((ESSENTIALS.monthly / (365 / 12)) * 100) / 100);

/** FOUNDERS (v3.1, Tom 2026-10-29): honest urgency — never a slot count, never a date. */
export const FOUNDERS = {
  active: true,
  label: "Founders price",
  until: "until founder slots are filled",
  rising: "As more indicators join the vault, the price for new members will only go up.",
} as const;

/** Which vault a product sits in. The catalogue's `vault` series is the Free Vault; everything else is Essentials. */
export const isFree = (p: Product) => p.series === "vault";
export const FREE_PRODUCTS = PRODUCTS.filter(isFree);
export const ESSENTIALS_PRODUCTS = PRODUCTS.filter((p) => !isFree(p));

/** Counts are computed, never typed. */
export const COUNT = { free: FREE_PRODUCTS.length, essentials: ESSENTIALS_PRODUCTS.length };

/** The Essentials Vault in three groups, in the README's order. */
export const ESSENTIALS_GROUPS: { key: Product["series"]; name: string; line: string; products: Product[] }[] = [
  { key: "chart", name: "On your price chart", line: "Levels, order flow, volume and the bar read for you, drawn where you trade." },
  { key: "panel", name: "In a panel of their own", line: "One clean panel under your candles each, built to say something about price." },
  { key: "addon", name: "Add-ons", line: "One rail that runs every DS tool on the chart, and Market Replay data queued in one go." },
].map((g) => ({ ...g, key: g.key as Product["series"], products: ESSENTIALS_PRODUCTS.filter((p) => p.series === g.key) }));

/**
 * The renewal terms, set beside every join button (ROSCA and New York GBL
 * 527-a: an automatically renewing plan states its price, that it renews, and
 * how to cancel, clearly and before checkout).
 */
export const BILLING = `${PRICE_MONTHLY}, renewing monthly until you cancel. Cancel any time from your Whop account: you are not billed again, and the vault stays open until the end of the month you paid for.`;

/** The one join button. The price is on it: nothing about the cost is hidden behind a click. */
export const JOIN_LABEL = `Join for ${PRICE} a month`;

/* Build-time guards: groups cover every paid product exactly once, and retired wording never comes back. */
{
  const grouped = ESSENTIALS_GROUPS.flatMap((g) => g.products.map((p) => p.slug));
  if (grouped.length !== ESSENTIALS_PRODUCTS.length) throw new Error("content/vaults.ts: a paid product is in no Essentials group.");
  const all = JSON.stringify([ESSENTIALS, FREE, FOUNDERS, BILLING, JOIN_LABEL]);
  for (const bad of ["79.99", "29.99", "374.95", "749.90", "slots left", "DS Complete", "trial", "days free"]) {
    if (all.includes(bad)) throw new Error(`content/vaults.ts: retired wording "${bad}" is back.`);
  }
}

/** Guard: should an older catalogue copy ever say "DS Complete" again, the page says it the new way. */
export const vaultWording = (s: string) => s.replace(/\bDS Complete\b/g, ESSENTIALS.name);
