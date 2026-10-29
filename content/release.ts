import { PRODUCTS, VAULT, type Product, type Series } from "./products";
import { SERIES, type SeriesInfo } from "./pricing";

/**
 * WHERE EVERYTHING IS SHELVED (v3.1, 2026-10-29). Membership is never declared
 * here — it is each product's `series` in content/products.ts. This file sorts
 * the groups into the two places the site has:
 *
 *   STORE_SHELVES     /products and the home lineup: DS Complete's groups, in
 *                     the README's order — on the price chart, in a panel of
 *                     their own, add-ons. Every product on them comes in
 *                     DS Complete; none is sold on its own.
 *   VAULT_PRODUCTS    the Free Vault, /free-vault: the free products, each
 *                     with a page of its own under it.
 *
 * Covers are content/catalog.ts (tools/covers.mjs). The 2026-10-04 box-art
 * system (BOXART) was retired from this site with v3.1.
 */

export type Shelf = { info: SeriesInfo; products: Product[] };

const ALL_SHELVES: Shelf[] = SERIES.map((info) => ({
  info,
  products: PRODUCTS.filter((p) => p.series === info.key),
})).filter((s) => s.products.length > 0);

/** DS Complete's groups, in the README's order. */
const COMPLETE_KEYS: readonly Series[] = ["chart", "panel", "addon"];

/** The store's shelves — what DS Complete holds, group by group. */
export const STORE_SHELVES: Shelf[] = ALL_SHELVES.filter((s) => COMPLETE_KEYS.includes(s.info.key));
/** The same shelves under DS Complete's name (the band and the product pages read this). */
export const COMPLETE_SHELVES: Shelf[] = STORE_SHELVES;
export const COMPLETE_PRODUCTS: Product[] = COMPLETE_SHELVES.flatMap((s) => s.products);

/** The Free Vault, in the sheet's order. */
export const VAULT_PRODUCTS: Product[] = PRODUCTS.filter((p) => p.series === VAULT);
/** Everything with a page under /products. */
export const STORE_PRODUCTS: Product[] = PRODUCTS.filter((p) => p.series !== VAULT);

/* Every group is in exactly one place. A new key in content/products.ts that
   nobody shelved stops the build instead of quietly vanishing from the site. */
for (const s of ALL_SHELVES) {
  const k = s.info.key;
  const places = [COMPLETE_KEYS.includes(k), k === VAULT].filter(Boolean).length;
  if (places !== 1) throw new Error(`content/release.ts: the "${k}" group is shelved in ${places} places; it must be in exactly one.`);
}

/** The Free Vault's own address, and each product's page — the ONE place a product URL is made. */
export const VAULT_PATH = "/free-vault";
export const STORE_PATH = "/products";
const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));
export const productHref = (slug: string) =>
  `${bySlug.get(slug)?.series === VAULT ? VAULT_PATH : STORE_PATH}/${slug}`;

/** Siblings in the same group, for "more like this". */
export const seriesMates = (slug: string): Product[] => {
  const s: Series | undefined = bySlug.get(slug)?.series;
  return s ? PRODUCTS.filter((p) => p.series === s && p.slug !== slug) : [];
};
