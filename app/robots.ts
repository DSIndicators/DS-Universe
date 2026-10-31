import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

/** Everything public is crawlable; the members area, the sign-in pages and the API are not. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/members", "/signin", "/join", "/forgot", "/reset"] }], sitemap: `${SITE.url}/sitemap.xml` };
}
