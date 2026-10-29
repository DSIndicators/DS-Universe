/**
 * Where every link on the white site goes. Nothing is typed: product pages are
 * THIS site's own (content/release.ts productHref: /products/<slug> and
 * /free-vault/<slug>), checkouts and listings are content/whop.ts, prices and
 * labels are content/pricing.ts.
 *
 *   paid product         -> DS Complete on /products (#complete), where its
 *                           three plans are: "Get DS Complete" (v3.1: no paid
 *                           product is sold on its own)
 *   Free Vault product   -> its Whop listing, "Get it free", once it is back up
 *                           (content/whop.ts RELISTED); until then no button,
 *                           and its page shows "Opening soon"
 *
 * Since 2026-10-29 the white site has every page the live site links to
 * (/contact, /terms, /disclosures were ported), so it can stand as
 * dsuniverse.net on its own. `site()` still sends any path it does not have to
 * the live site.
 */
import { SITE } from "./site";
import { PRODUCTS } from "./products";
import { productHref, STORE_PATH, VAULT_PATH } from "./release";
import { PRICES, tilePrice } from "./pricing";
import { vaultListing } from "./whop";

/** The pages this site has. Anything else is the live site's. */
const LOCAL = new Set<string>(["/", STORE_PATH, VAULT_PATH, "/ninjatrader", "/about", "/contact", "/terms", "/disclosures", ...PRODUCTS.map((p) => productHref(p.slug))]);

/** A site path: this site's own page when it has one, else the live site's. */
export const site = (href: string) => {
  if (!href.startsWith("/")) return href;
  const path = href.split(/[?#]/)[0] || "/";
  return LOCAL.has(path) ? href : `${SITE.url}${href}`;
};

export const pageFor = (slug: string) => productHref(slug);

/** Where DS Complete's plans are, on this site. */
export const COMPLETE_HREF = `${STORE_PATH}#complete`;

export function actionFor(slug: string): { href: string; label: string } | null {
  if (PRICES[slug]?.free) {
    const l = vaultListing(slug);
    return l ? { href: l.product, label: "Get it free" } : null;
  }
  return { href: COMPLETE_HREF, label: "Get DS Complete" };
}

export const priceLabel = (slug: string) => tilePrice(PRICES[slug]);
