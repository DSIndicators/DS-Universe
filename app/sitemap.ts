import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/content/products";
import { hrefFor } from "@/content/paths";
import { SITE } from "@/content/site";

/** Every public page, product pages read from the catalogue (both vaults). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/essentials", "/free-vault", "/ninjatrader", "/how-it-works", "/contact", "/terms", "/disclosures"];
  return [...pages, ...PRODUCTS.map((p) => hrefFor(p.slug))].map((path) => ({ url: `${SITE.url}${path === "/" ? "" : path}` }));
}
