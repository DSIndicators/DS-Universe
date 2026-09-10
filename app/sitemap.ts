import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/content/products";
import { isReleased } from "@/content/release";
import { SITE } from "@/content/site";

/** Only pages that actually exist: unreleased products 404, so they stay out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const fixed = ["", "/products", "/pricing", "/ninjatrader", "/about", "/contact", "/terms", "/disclosures"];
  return [
    ...fixed.map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...PRODUCTS.filter((p) => isReleased(p.slug)).map((p) => ({
      url: `${SITE.url}/products/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
