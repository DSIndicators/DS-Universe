import { PRODUCTS, VAULT, type Product, type Series } from "./products";
import { SERIES, type SeriesInfo } from "./pricing";

/**
 * WHERE EVERYTHING IS SHELVED (the lineup of 2026-10-05: paid and free apart).
 * Membership is never declared here — it is each product's `series` in
 * content/products.ts. This file sorts the series into the three places the
 * site has, and adds the ART.
 *
 *   STORE_SHELVES     /products and the home lineup: the series sold one by
 *                     one — flagship, Pro Series, the data utility.
 *   COMPLETE_SHELVES  what DS Complete holds: those, plus the series that
 *                     comes free with it and is not sold on its own (DS ASL,
 *                     DS Toolkit). The ledger and the drawn chart read this,
 *                     so neither can show a Free Vault product.
 *   VAULT_PRODUCTS    the Free Vault, /free-vault: the free products, each
 *                     with a page of its own under it.
 *
 * ART — the cover system. Every product wears ONE typeset box: the same
 * frame, the same type, one accent color of its own, and a drawing of what
 * that product puts on the chart, staged as a projected hologram (a glass plane
 * over an emitter, turned a few degrees). They are generated, not photographed — the
 * source is in LOCAL3001 Picture Updates\Cover system 2026-10-04 (build.py for
 * the layout and each product's line and hooks, motifs.py for the drawings).
 * Each is 1280x1600 (a 640x800 frame at 2x), transparent, the box at x 88..552,
 * y 58..748 of the frame over one baked soft shadow, so the shelf stays a row
 * of objects on ONE baseline.
 *
 * A NEW PICTURE LIVES AT A NEW PATH. Assets are served with a one-year
 * immutable cache and Next's image optimiser keys on the URL, so returning
 * visitors would keep an old cover under an old name.
 *   /boxart/1004/  the 10-04 covers that did not change on 10-05.
 *   /boxart/1005/  the 10-05 covers: the two new Pro Series panels, DS ASL, and
 *                  every Free Vault box — the four new or renamed ones, and the
 *                  five whose box printed the old series name in its corner.
 *                  DS Toolkit's is toolkit-complete.webp: its corner reads
 *                  "DS COMPLETE", like DS ASL's. (The first 10-05 render,
 *                  toolkit.webp, printed "FREE VAULT" and was moved out of the
 *                  repo the same day, before anything was pushed.)
 *   /boxart/1007/  the 10-07 covers: DS ProRSI (v2.0 cover line, hooks and
 *                  category) and DS 258 (its second hook no longer says
 *                  Opacity 7). Same drawing, same layout; only the words.
 */

/** Cover frame, width / height. Every tile and the grid read this one number. */
export const COVER_RATIO = 4 / 5;

/**
 * One box per product, by slug. A LIST, not a formula, so a single cover can
 * be re-exported under a new filename without touching the others. Picture
 * Studio (LOCAL3001 Picture Updates) edits this list; so can a person.
 */
export const BOXART: Record<string, string> = {
  "zones": "/boxart/1004/zones.webp",
  "iceberg": "/boxart/1004/iceberg.webp",
  "oracle": "/boxart/1004/oracle.webp",
  "gex": "/boxart/1004/gex.webp",
  "flow": "/boxart/1004/flow.webp",
  "prorsi": "/boxart/1007/prorsi.webp",
  "proliquidityhunter": "/boxart/1005/proliquidityhunter.webp",
  "proheikinashi": "/boxart/1005/proheikinashi.webp",
  "protrendrange": "/boxart/1004/protrendrange.webp",
  "bulk-replay-downloader": "/boxart/1004/bulk-replay-downloader.webp",
  "asl": "/boxart/1005/asl.webp",
  "toolkit": "/boxart/1005/toolkit-complete.webp",
  "adaptive-priceline": "/boxart/1005/adaptive-priceline.webp",
  "chart-price": "/boxart/1005/chart-price.webp",
  "ds-258": "/boxart/1007/ds-258.webp",
  "parallax": "/boxart/1005/parallax.webp",
  "session-levels": "/boxart/1005/session-levels.webp",
  "stochastics": "/boxart/1005/stochastics.webp",
  "squeeze": "/boxart/1005/squeeze.webp",
  "macd": "/boxart/1005/macd.webp",
  "vwap": "/boxart/1005/vwap.webp",
};

/** Every product has its box in the list — a missing one stops the build
 *  rather than requesting a picture that is not there. */
export const boxartFor = (slug: string) => {
  const art = BOXART[slug];
  if (!art) throw new Error(`content/release.ts: no box art listed for "${slug}".`);
  return art;
};
for (const p of PRODUCTS) boxartFor(p.slug);

/**
 * COVERS THAT ARE STAND-INS. A new product can be previewed on localhost
 * before its cover exists; it must never go live that way. While a slug is
 * listed here `next build` for production stops with the reason. Empty: every
 * product has its cover from the cover system.
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
 * A NEW SERIES CAN LEAD THE STORE for a while (as the Session levels pair did
 * from 2026-09-30 to 2026-10-05). Name a store series here and its panel moves
 * straight under DS Complete with "New" on its thread; null = catalogue order.
 */
export const NEW_SERIES: Series | null = null;

const ALL_SHELVES: Shelf[] = SERIES.map((info) => ({
  info,
  products: PRODUCTS.filter((p) => p.series === info.key),
})).filter((s) => s.products.length > 0);

/** The series a visitor can buy from one by one, in catalogue order. */
const STORE_KEYS: readonly Series[] = ["flagship", "pro", "utility"];
/** The series whose products come free with DS Complete and are not sold on their own. */
const EXCLUSIVE_KEYS: readonly Series[] = ["exclusive"];

const CATALOGUE_SHELVES = ALL_SHELVES.filter((s) => STORE_KEYS.includes(s.info.key));

/** The store's shelves in the order the store runs them. */
export const STORE_SHELVES: Shelf[] = [
  ...CATALOGUE_SHELVES.filter((s) => s.info.key === NEW_SERIES),
  ...CATALOGUE_SHELVES.filter((s) => s.info.key !== NEW_SERIES),
];

/** What DS Complete holds, in catalogue order — the ledger and the drawn chart read this. */
export const COMPLETE_SHELVES: Shelf[] = ALL_SHELVES.filter(
  (s) => STORE_KEYS.includes(s.info.key) || EXCLUSIVE_KEYS.includes(s.info.key),
);
export const COMPLETE_PRODUCTS: Product[] = COMPLETE_SHELVES.flatMap((s) => s.products);
export const inComplete = (slug: string) => COMPLETE_PRODUCTS.some((p) => p.slug === slug);

/** The Free Vault, in the sheet's order. */
export const VAULT_PRODUCTS: Product[] = PRODUCTS.filter((p) => p.series === VAULT);
/** Everything with a page under /products. */
export const STORE_PRODUCTS: Product[] = PRODUCTS.filter((p) => p.series !== VAULT);

/* Every series is in exactly one place. A new key in content/products.ts that
   nobody shelved stops the build instead of quietly vanishing from the site. */
for (const s of ALL_SHELVES) {
  const k = s.info.key;
  const places = [STORE_KEYS.includes(k), EXCLUSIVE_KEYS.includes(k), k === VAULT].filter(Boolean).length;
  if (places !== 1) throw new Error(`content/release.ts: the "${k}" series is shelved in ${places} places; it must be in exactly one.`);
}

/** The Free Vault's own address, and each product's page — the ONE place a product URL is made. */
export const VAULT_PATH = "/free-vault";
export const STORE_PATH = "/products";
const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));
export const productHref = (slug: string) =>
  `${bySlug.get(slug)?.series === VAULT ? VAULT_PATH : STORE_PATH}/${slug}`;

export const resolveProduct = (slug: string): Product | undefined => bySlug.get(slug);

/** Everything with a public page — the whole catalogue. */
export const RELEASED_SLUGS = new Set(PRODUCTS.map((p) => p.slug));
export const isReleased = (slug: string) => RELEASED_SLUGS.has(slug);

/** Siblings in the same series, for "more like this". */
export const seriesMates = (slug: string): Product[] => {
  const s: Series | undefined = bySlug.get(slug)?.series;
  return s ? PRODUCTS.filter((p) => p.series === s && p.slug !== slug) : [];
};
