import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * DS Universe — the simpler two-vault site (localhost:3003, 2026-10-30).
 * Pictures are served as they are (plain <img>, no optimiser): Tom's pixels,
 * never re-encoded. Every address the live site published keeps working.
 */
const FREE = ["adaptive-priceline", "chart-price", "ds-258", "parallax", "session-levels", "vwap", "live-background", "time-intervals", "volume"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  async redirects() {
    return [
      // The store is now the Essentials Vault.
      { source: "/products", destination: "/essentials", permanent: true },
      { source: "/pricing", destination: "/essentials", permanent: true },
      { source: "/trial", destination: "/essentials", permanent: true },
      { source: "/about", destination: "/how-it-works", permanent: true },
      { source: "/login", destination: "/signin", permanent: true },
      { source: "/signup", destination: "/join", permanent: true },
      { source: "/favicon.ico", destination: "/brand/icon-black-48.png", permanent: false },
      { source: "/replay-lab", destination: "/essentials/bulk-replay-downloader", permanent: true },
      // retired or renamed products (DS-Universe-White's list)
      { source: "/products/oracle", destination: "/essentials", permanent: true },
      { source: "/products/pro-session-levels", destination: "/essentials/asl", permanent: true },
      ...["promacd", "prostochastics", "prosqueeze", "macd", "stochastics", "squeeze"].map((s) => ({ source: `/products/${s}`, destination: "/free-vault", permanent: true })),
      ...["macd", "stochastics", "squeeze"].map((s) => ({ source: `/free-vault/${s}`, destination: "/free-vault", permanent: true })),
      { source: "/products/adaptive-priceline", destination: "/free-vault/adaptive-priceline", permanent: true },
      ...FREE.filter((s) => s !== "adaptive-priceline").map((s) => ({ source: `/products/${s}`, destination: `/free-vault/${s}`, permanent: true })),
      { source: "/free-vault/toolkit", destination: "/essentials/toolkit", permanent: true },
      // every paid product page: /products/<slug> → /essentials/<slug>
      { source: "/products/:slug", destination: "/essentials/:slug", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/members/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }, { key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "X-Frame-Options", value: "SAMEORIGIN" }] },
    ];
  },
};
export default nextConfig;
