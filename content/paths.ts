import { BY_SLUG } from "./products";

/**
 * Every address a product has — the ONE place a product URL is made.
 *   Free Vault tool       /free-vault/<slug>   (same as the live site)
 *   Essentials Vault tool /essentials/<slug>   (/products/<slug> forwards here)
 */
export const FREE_PATH = "/free-vault";
export const ESSENTIALS_PATH = "/essentials";
export const hrefFor = (slug: string) => `${BY_SLUG[slug]?.series === "vault" ? FREE_PATH : ESSENTIALS_PATH}/${slug}`;
