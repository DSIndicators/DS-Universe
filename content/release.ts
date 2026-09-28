import { PRODUCTS, type Product, type Series } from "./products";
import { SERIES, type SeriesInfo } from "./pricing";

/**
 * The storefront, shelved by SERIES (the tiers of the 09-20 sheet): flagship
 * indicators, Pro Series panels, the free essentials, and the data utility.
 * Shelf membership is not declared here — it is each product's `series` in
 * content/products.ts. This file adds only the ART.
 *
 * ART — the 09-20 covers (Tom's "0920 NEW Product Cover & Images"), each box
 * cut off the grey studio backdrop and re-seated in a transparent 4:5 frame at
 * ONE height on ONE baseline with ONE baked soft shadow, so the shelf reads as a
 * row of objects on the page rather than fifteen grey photographs, and works on
 * the white and the mist sections alike. Sources are 705–742px tall boxes;
 * every one is DOWNscaled to 690px, never up.
 *
 * THE FOLDER IS NEW ON PURPOSE (/boxart/0920/). Assets are served with a
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
  "zones": "/boxart/0920/zones.webp",
  "iceberg": "/boxart/0920/iceberg.webp",
  "oracle": "/boxart/0920/oracle.webp",
  "gex": "/boxart/0920/gex.webp",
  "flow": "/boxart/0920/flow.webp",
  "prorsi": "/boxart/0920/prorsi.webp",
  "prostochastics": "/boxart/0920/prostochastics.webp",
  "prosqueeze": "/boxart/0920/prosqueeze.webp",
  "promacd": "/boxart/0920/promacd.webp",
  "adaptive-priceline": "/boxart/0920/adaptive-priceline.webp",
  "chart-price": "/boxart/0920/chart-price.webp",
  "ds-258": "/boxart/0920/ds-258.webp",
  "parallax": "/boxart/0920/parallax.webp",
  "toolkit": "/boxart/0920/toolkit.webp",
  "bulk-replay-downloader": "/boxart/0920/bulk-replay-downloader.webp",
};

export const boxartFor = (slug: string) => BOXART[slug] ?? `/boxart/0920/${slug}.webp`;

export type Shelf = { info: SeriesInfo; products: Product[] };

export const SHELVES: Shelf[] = SERIES.map((info) => ({
  info,
  products: PRODUCTS.filter((p) => p.series === info.key),
})).filter((s) => s.products.length > 0);

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
