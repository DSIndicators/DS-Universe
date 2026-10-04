import { PRODUCTS, type Product, type Series } from "./products";
import { SERIES, type SeriesInfo } from "./pricing";

/**
 * The storefront, shelved by SERIES (the tiers of the 09-20 sheet): flagship
 * indicators, Pro Series panels, the Session levels pair (2026-09-30), the free
 * essentials, and the data utility.
 * Shelf membership is not declared here — it is each product's `series` in
 * content/products.ts. This file adds only the ART.
 *
 * ART — the 10-04 covers. Every product now wears ONE typeset box: the same
 * frame, the same type, one accent color of its own, and a drawing of what
 * that product puts on the chart, staged as a projected hologram (a glass plane
 * over an emitter, turned a few degrees). They are generated, not photographed — the
 * source is in LOCAL3001 Picture Updates\Cover system 2026-10-04 (build.py for
 * the layout and each product's line and hooks, motifs.py for the drawings).
 * Each is 1280x1600 (a 640x800 frame at 2x), transparent, the box at x 88..552,
 * y 58..748 of the frame over one baked soft shadow, so the shelf stays a row
 * of objects on ONE baseline. The 09-20 and 09-30 photographed covers they
 * replace are in Picture Studio's "Replaced pictures".
 *
 * THE FOLDER IS NEW ON PURPOSE (/boxart/1004/). Assets are served with a
 * one-year immutable cache and Next's image optimiser keys on the URL, so a new
 * picture must live at a new path or returning visitors keep the old one.
 */

/** Cover frame, width / height. Every tile and the grid read this one number. */
export const COVER_RATIO = 4 / 5;

/**
 * One box per product, by slug. A LIST, not a formula, so a single cover can
 * be re-exported under a new filename without touching the others (one-year
 * immutable asset cache: a new picture needs a new path). Picture Studio
 * (LOCAL3001 Picture Updates) edits this list; so can a person.
 */
export const BOXART: Record<string, string> = {
  "zones": "/boxart/1004/zones.webp",
  "iceberg": "/boxart/1004/iceberg.webp",
  "oracle": "/boxart/1004/oracle.webp",
  "gex": "/boxart/1004/gex.webp",
  "flow": "/boxart/1004/flow.webp",
  "prorsi": "/boxart/1004/prorsi.webp",
  "prostochastics": "/boxart/1004/prostochastics.webp",
  "prosqueeze": "/boxart/1004/prosqueeze.webp",
  "protrendrange": "/boxart/1004/protrendrange.webp",
  "adaptive-priceline": "/boxart/1004/adaptive-priceline.webp",
  "chart-price": "/boxart/1004/chart-price.webp",
  "ds-258": "/boxart/1004/ds-258.webp",
  "parallax": "/boxart/1004/parallax.webp",
  "toolkit": "/boxart/1004/toolkit.webp",
  "bulk-replay-downloader": "/boxart/1004/bulk-replay-downloader.webp",
  "session-levels": "/boxart/1004/session-levels.webp",
  "pro-session-levels": "/boxart/1004/pro-session-levels.webp",
};

export const boxartFor = (slug: string) => BOXART[slug] ?? `/boxart/1004/${slug}.webp`;

/**
 * COVERS THAT ARE STAND-INS. A new product can be previewed on localhost
 * before its cover exists; it must never go live that way. While a slug is
 * listed here `next build` for production stops with the reason. Empty since
 * 2026-10-04: every product has its cover from the cover system.
 * (`DS_PREVIEW_BUILD=1 npm run build` builds anyway — for checking, not for
 * deploying; Hostinger never sets it.)
 */
export const PLACEHOLDER_ART: readonly string[] = [];
if (PLACEHOLDER_ART.length && process.env.NODE_ENV === "production" && process.env.DS_PREVIEW_BUILD !== "1") {
  throw new Error(
    `content/release.ts: ${PLACEHOLDER_ART.join(", ")} still shows a stand-in cover. ` +
      `Put the real box art in public/boxart, point BOXART at it and empty PLACEHOLDER_ART before deploying.`,
  );
}

export type Shelf = { info: SeriesInfo; products: Product[] };

/**
 * A NEW SERIES LEADS THE STORE for a while (Tom, 2026-09-30: the Session levels
 * pair sits straight under DS Complete, where the Founders gift is seen beside
 * the offer it comes with). Set to null when it is no longer new: the panel
 * drops back to its catalogue place (content/pricing.ts SERIES — after the Pro
 * Series) and the thread loses its "New" label. Nothing else changes.
 */
export const NEW_SERIES: Series | null = "sessions";

const CATALOGUE_SHELVES: Shelf[] = SERIES.map((info) => ({
  info,
  products: PRODUCTS.filter((p) => p.series === info.key),
})).filter((s) => s.products.length > 0);

/** The shelves in the order the store runs them. */
export const SHELVES: Shelf[] = [
  ...CATALOGUE_SHELVES.filter((s) => s.info.key === NEW_SERIES),
  ...CATALOGUE_SHELVES.filter((s) => s.info.key !== NEW_SERIES),
];

/** The shelves in catalogue order — the DS Complete ledger reads this. */
export const CATALOGUE_ORDER: Shelf[] = CATALOGUE_SHELVES;

const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));
export const resolveProduct = (slug: string): Product | undefined => bySlug.get(slug);

/** Everything with a public page — the whole catalogue. */
export const RELEASED_SLUGS = new Set(PRODUCTS.map((p) => p.slug));
export const isReleased = (slug: string) => RELEASED_SLUGS.has(slug);

/** Siblings in the same series, for "more like this". */
export const seriesMates = (slug: string): Product[] => {
  const s: Series | undefined = bySlug.get(slug)?.series;
  return s ? PRODUCTS.filter((p) => p.series === s && p.slug !== slug) : [];
};
