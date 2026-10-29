import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * DS Universe — the white site (localhost:3002), dsuniverse.net from launch.
 * Pictures are served as they are (plain <img>, no optimiser): Tom's pixels,
 * never re-encoded.
 *
 * PAGES ARE REVALIDATED, ASSETS ARE NOT (carried over from DS-Universe-3,
 * 2026-10-29). Next stamps prerendered pages with a one-year s-maxage and
 * Hostinger's CDN honours it literally; a deploy does not purge it, so without
 * these headers a new build can sit unseen behind an old copy for a day. Pages
 * revalidate (a 304, ~2 KB); everything with a file extension and everything
 * under /_next/ keeps its long immutable cache. ADD A PAGE, ADD A LINE.
 */
const REVALIDATE = [{ key: "Cache-Control", value: "public, max-age=0, s-maxage=0, must-revalidate" }];
const PAGES = ["/", "/products", "/products/:slug", "/free-vault", "/free-vault/:slug", "/ninjatrader", "/about", "/contact", "/terms", "/disclosures", "/sitemap.xml", "/robots.txt"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  // Every address the live site ever published keeps working (all permanent,
  // one hop, no chains). The DS-Universe-3 list, plus v3.1:
  //  · DS Oracle was discontinued on 2026-10-29: its page goes to the store.
  //  · /trial (the 3-day trial's page, ended 2026-10-14) goes to the store,
  //    where DS Complete's 7-day trial is.
  async redirects() {
    return [
      { source: "/pricing", destination: "/products", permanent: true },
      { source: "/trial", destination: "/products", permanent: true },
      { source: "/replay-lab", destination: "/products/bulk-replay-downloader", permanent: true },
      { source: "/favicon.ico", destination: "/brand/icon-black-48.png", permanent: false },
      // discontinued 2026-10-29
      { source: "/products/oracle", destination: "/products", permanent: true },
      // renamed 2026-10-05
      { source: "/products/promacd", destination: "/free-vault", permanent: true },
      { source: "/products/prostochastics", destination: "/free-vault", permanent: true },
      { source: "/products/prosqueeze", destination: "/free-vault", permanent: true },
      { source: "/products/pro-session-levels", destination: "/products/asl", permanent: true },
      // free products: out of the store, into the Free Vault
      { source: "/products/adaptive-priceline", destination: "/free-vault/adaptive-priceline", permanent: true },
      { source: "/products/chart-price", destination: "/free-vault/chart-price", permanent: true },
      { source: "/products/ds-258", destination: "/free-vault/ds-258", permanent: true },
      { source: "/products/parallax", destination: "/free-vault/parallax", permanent: true },
      { source: "/products/session-levels", destination: "/free-vault/session-levels", permanent: true },
      { source: "/products/vwap", destination: "/free-vault/vwap", permanent: true },
      { source: "/products/live-background", destination: "/free-vault/live-background", permanent: true },
      { source: "/products/time-intervals", destination: "/free-vault/time-intervals", permanent: true },
      { source: "/products/volume", destination: "/free-vault/volume", permanent: true },
      // paid products that were briefly vault addresses
      { source: "/free-vault/toolkit", destination: "/products/toolkit", permanent: true },
      // discontinued 2026-10-25
      { source: "/free-vault/macd", destination: "/free-vault", permanent: true },
      { source: "/free-vault/stochastics", destination: "/free-vault", permanent: true },
      { source: "/free-vault/squeeze", destination: "/free-vault", permanent: true },
      { source: "/products/macd", destination: "/free-vault", permanent: true },
      { source: "/products/stochastics", destination: "/free-vault", permanent: true },
      { source: "/products/squeeze", destination: "/free-vault", permanent: true },
    ];
  },
  async headers() {
    return PAGES.map((source) => ({ source, headers: REVALIDATE }));
  },
};
export default nextConfig;
