import { PRODUCTS, type Product } from "./products";

/**
 * The first-release storefront (Tom's release plan, 2026-09-08).
 * Only what is in these shelves is shown on the site. No prices are ever
 * rendered; `free: true` earns a quiet chip.
 *
 * Art (from "Product Images/", indicators re-rendered 2026-09-09):
 *  - indicators ship PORTRAIT box art  -> /boxart/<slug>.webp (880x1173)
 *    Tom's covers arrive 880x1189 already composed portrait and aligned; each
 *    is centre-cropped 8px top and bottom to land on an exact 3:4, so the tile
 *    frame trims nothing and the art is native (no upscaling) to 2x DPR.
 *  - add-ons ship LANDSCAPE banners    -> /boxart/<slug>-wide.webp (1280x698)
 *    so the add-on shelf renders as wide tiles rather than cropping the art.
 */

export type ShelfEntry =
  | { slug: string; free?: boolean; boxart: string | null; pending?: undefined }
  | { pending: { name: string }; free?: boolean; boxart?: null; slug?: undefined };

/**
 * `live: false` keeps a whole shelf off the site. Launch order (Tom, 2026-09-09):
 * indicators first, add-ons after. Flip the add-on shelf back to live when its
 * Whop pages and real screenshots exist — that is the only change needed; the
 * product pages, art and copy are all already in place behind it.
 */
export const SHELVES: { title: string; blurb: string; wide?: boolean; live?: boolean; entries: ShelfEntry[] }[] = [
  {
    title: "Indicators",
    blurb: "Drawn on the chart itself. Each one answers a single question about the market in front of you.",
    entries: [
      { slug: "oracle", boxart: "/boxart/oracle.webp" },
      { slug: "sonar", boxart: "/boxart/sonar.webp" },
      { slug: "zones", boxart: "/boxart/zones.webp" },
      { slug: "gex", boxart: "/boxart/gex.webp" },
      { slug: "iceberg", boxart: "/boxart/iceberg.webp" },
      { slug: "flow", free: true, boxart: "/boxart/flow.webp" },
      { slug: "parallax", free: true, boxart: "/boxart/parallax.webp" },
      { slug: "isotropic-lines", free: true, boxart: "/boxart/isotropic-lines.webp" },
      { slug: "adaptive-priceline", free: true, boxart: "/boxart/adaptive-priceline.webp" },
      { slug: "chart-price", free: true, boxart: "/boxart/chart-price.webp" },
    ],
  },
  {
    title: "Add-ons",
    blurb: "Mounted on the platform, not the chart. Workflow, screening and data utilities.",
    wide: true,
    live: false, // ← launching after the indicators. One word to bring back.
    entries: [
      { slug: "screener", boxart: "/boxart/screener-wide.webp" },
      { slug: "bulk-replay-downloader", boxart: "/boxart/bulk-replay-downloader-wide.webp" },
      { slug: "toolkit", free: true, boxart: "/boxart/toolkit-wide.webp" },
      { slug: "marketwatch", free: true, boxart: "/boxart/marketwatch-wide.webp" },
      { slug: "time-intervals", free: true, boxart: "/boxart/time-intervals-wide.webp" },
    ],
  },
];

/**
 * Demo recordings. A product with an entry here shows a silent, looping clip
 * where its chart still would sit; the still stays as the poster frame, so the
 * page looks identical before the video starts. Encode 16:9-ish, no audio,
 * +faststart. Keep this here (hand-curated) — products.ts is generated.
 */
export const DEMOS: Record<string, { src: string; poster: string }> = {
  "bulk-replay-downloader": {
    src: "/covers/bulk-replay-downloader.mp4",
    // A frame lifted from the clip itself, so the panel shows the real window
    // whether or not the browser lets the video autoplay.
    poster: "/covers/bulk-replay-downloader-poster.webp",
  },
};

/** The shelves actually shown on the site. */
export const LIVE_SHELVES = SHELVES.filter((s) => s.live !== false);

const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));

export function resolveProduct(slug: string): Product | undefined {
  return bySlug.get(slug);
}

/** Everything currently on sale (or free) - the only product pages that exist publicly. */
export const RELEASED_SLUGS = new Set(
  LIVE_SHELVES.flatMap((s) => s.entries.flatMap((e) => (e.slug ? [e.slug] : []))),
);

export const isReleased = (slug: string) => RELEASED_SLUGS.has(slug);
