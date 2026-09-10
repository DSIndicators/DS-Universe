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
 *  - add-ons ship their own shape      -> /boxart/<slug>-wide.webp (1134x928)
 *    Tom's add-on covers stand a portrait box inside a wider scene, and the
 *    box is wider than a 3:4 window: cropping to the indicator shape clips the
 *    title off every one of them (tested 2026-09-10). So the add-on shelf keeps
 *    the art's own 11:9 proportion and runs three across. Nothing is cropped.
 */

export type ShelfEntry =
  | { slug: string; free?: boolean; boxart: string | null; pending?: undefined }
  | { pending: { name: string }; free?: boolean; boxart?: null; slug?: undefined };

/**
 * `live: false` keeps a whole shelf off the site. The add-on shelf was held
 * back for the indicators-first launch and came back on 2026-09-10, once Tom
 * supplied NT-mark-free covers, real screenshots of each running window, and
 * the four Whop product pages.
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
    entries: [
      { slug: "screener", boxart: "/boxart/screener-wide.webp" },
      { slug: "bulk-replay-downloader", boxart: "/boxart/bulk-replay-downloader-wide.webp" },
      // DS Toolkit ships only inside the indicators bundle (Tom, 2026-09-10),
      // so it keeps a page but carries no price and no buy button.
      { slug: "toolkit", boxart: "/boxart/toolkit-wide.webp" },
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

/**
 * A SECOND real chart shot, for products that have one (Tom's 2026-09-10 media
 * folders). The product page shows it under the first as a quiet pair — two
 * shots of the same tool in different conditions say more than one, and it is
 * the cheapest possible proof that the thing runs.
 *
 * Kept here, hand-curated, because products.ts is generated.
 */
export const SECOND_SHOT: Record<string, string> = {
  oracle: "/covers/oracle-2.webp",
  sonar: "/covers/sonar-2.webp",
  zones: "/covers/zones-2.webp",
  gex: "/covers/gex-2.webp",
  iceberg: "/covers/iceberg-2.webp",
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
