import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/content/products";
import { VAULT_PATH, isReleased, productHref } from "@/content/release";
import { SITE } from "@/content/site";
import { trialProducts } from "@/content/trial";

/** Only pages that actually exist: unreleased products 404, so they stay out.
 *  A product's address is productHref() — /free-vault/<slug> for a free one. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // /trial exists only while the 3-day free trial is on (content/trial.ts).
  const fixed = ["", "/products", VAULT_PATH, ...(trialProducts().length ? ["/trial"] : []), "/ninjatrader", "/about", "/contact", "/terms", "/disclosures"];
  return [
    ...fixed.map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...PRODUCTS.filter((p) => isReleased(p.slug)).map((p) => ({
      url: `${SITE.url}${productHref(p.slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
