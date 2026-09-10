import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Pages are revalidated, assets are not.
 *
 * WHY (2026-09-10): Next stamps prerendered pages with
 * `Cache-Control: s-maxage=31536000` — one year — and Hostinger's CDN honours
 * that literally. A deploy does not purge it, so hours after the launch push
 * the edge was still handing visitors an 18-hour-old copy of the home page and
 * a 23-hour-old copy of /products/oracle, while the origin had the new build.
 * On Vercel a deploy purges the edge for you; here nothing does.
 *
 * The pages below therefore ask the CDN to check with the origin before
 * serving. They are ~2KB of HTML and revalidation is a 304, so the cost is
 * nothing; the alternative is every future deploy silently not appearing.
 * Everything with a file extension and everything under /_next/ is untouched
 * and keeps its long immutable cache — the images and JS are the heavy part.
 *
 * ADD A PAGE, ADD A LINE. A route missing from this list gets the one-year
 * cache back and will look like it never deployed.
 */
const REVALIDATE = [
  { key: "Cache-Control", value: "public, max-age=0, s-maxage=0, must-revalidate" },
];

const PAGES = [
  "/",
  "/products",
  "/products/:slug",
  "/pricing",
  "/ninjatrader",
  "/about",
  "/contact",
  "/terms",
  "/sitemap.xml",
  "/robots.txt",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
  // Pin the workspace root to this folder so a stray lockfile elsewhere on the
  // machine (e.g. C:\Users\<you>\package-lock.json) is never picked up.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  async headers() {
    return PAGES.map((source) => ({ source, headers: REVALIDATE }));
  },
};
export default nextConfig;
