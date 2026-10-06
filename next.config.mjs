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
  "/free-vault",
  "/free-vault/:slug",
  "/trial",
  "/ninjatrader",
  "/about",
  "/contact",
  "/terms",
  "/disclosures",
  "/sitemap.xml",
  "/robots.txt",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 92 is the lightbox: a 2560x1440 chart downscaled to ~1140 and read for
  // detail. Listing it keeps Next from rejecting the value once qualities are
  // enforced; 75 is the default every other picture uses.
  images: { formats: ["image/avif", "image/webp"], qualities: [75, 92] },
  // Pin the workspace root to this folder so a stray lockfile elsewhere on the
  // machine (e.g. C:\Users\<you>\package-lock.json) is never picked up.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  // /pricing was merged into /products on 2026-09-27 (the two pages had
  // become one page twice). Permanent, so search engines move the URL's
  // standing over (Google: every permanent redirect type counts the same);
  // it lands on the Price list view, which is what /pricing was. A #fragment
  // (e.g. /pricing#complete) survives the redirect in every browser.
  //
  // THE LINEUP OF 2026-10-05 — every address that moved, forwarded for good:
  //  · four products were renamed, so their old addresses go to the new ones
  //    (three of them are free now, so they land in the Free Vault);
  //  · the five free products already on the site moved from /products/<slug>
  //    to /free-vault/<slug>;
  //  · DS Toolkit went the other way the same day. It comes free with DS
  //    Complete now and is not in the Free Vault, so its page is
  //    /products/toolkit (where it always was) and the vault address it held
  //    for a few hours, /free-vault/toolkit, forwards there. There is NO
  //    /products/toolkit -> /free-vault/toolkit rule any more: the two would
  //    loop.
  // All permanent (308). The TEMPORARY /products/promacd -> /products#pro rule
  // of 2026-10-04 is gone: the product is back, as DS MACD, in the Free Vault.
  // The old shelf anchors (/products#essentials, /products#sessions) cannot be
  // redirected here — a #fragment never reaches the server — so /products
  // forwards them itself before first paint (app/products/page.tsx).
  async redirects() {
    return [
      { source: "/pricing", destination: "/products?view=list", permanent: true },
      // renamed
      { source: "/products/promacd", destination: "/free-vault/macd", permanent: true },
      { source: "/products/prostochastics", destination: "/free-vault/stochastics", permanent: true },
      { source: "/products/prosqueeze", destination: "/free-vault/squeeze", permanent: true },
      { source: "/products/pro-session-levels", destination: "/products/asl", permanent: true },
      // free products: out of the store, into the Free Vault
      { source: "/products/adaptive-priceline", destination: "/free-vault/adaptive-priceline", permanent: true },
      { source: "/products/chart-price", destination: "/free-vault/chart-price", permanent: true },
      { source: "/products/ds-258", destination: "/free-vault/ds-258", permanent: true },
      { source: "/products/parallax", destination: "/free-vault/parallax", permanent: true },
      { source: "/products/session-levels", destination: "/free-vault/session-levels", permanent: true },
      // DS Toolkit: out of the Free Vault, free with DS Complete (2026-10-05)
      { source: "/free-vault/toolkit", destination: "/products/toolkit", permanent: true },
      // the four free products that never had a store address: a guessed one still lands
      { source: "/products/macd", destination: "/free-vault/macd", permanent: true },
      { source: "/products/stochastics", destination: "/free-vault/stochastics", permanent: true },
      { source: "/products/squeeze", destination: "/free-vault/squeeze", permanent: true },
      { source: "/products/vwap", destination: "/free-vault/vwap", permanent: true },
    ];
  },
  async headers() {
    return PAGES.map((source) => ({ source, headers: REVALIDATE }));
  },
};
export default nextConfig;
