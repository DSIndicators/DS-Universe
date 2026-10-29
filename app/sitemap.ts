import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/content/products";
import { productHref } from "@/content/release";
import { SITE } from "@/content/site";

/** Every page the site has (2026-10-29: the live site served one; the white
 *  site takes its place). Product pages are read from the catalogue. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/products", "/free-vault", "/ninjatrader", "/about", "/contact", "/terms", "/disclosures"];
  return [...pages, ...PRODUCTS.map((p) => productHref(p.slug))].map((path) => ({ url: `${SITE.url}${path === "/" ? "" : path}` }));
}
