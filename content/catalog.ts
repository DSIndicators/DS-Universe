/**
 * Every product resolved once for the pages — nothing typed here.
 * Names, lines, prices and links come from the content files; covers come
 * from content/drop-covers.json, which tools/covers.mjs writes before every
 * build from the "Product Covers - drop new white covers here" folder (and the
 * one dark exception, DS Live Background, from its own folder). A product with
 * no cover there has none here, and the pages show its slot.
 *
 * `ladder` (2026-10-26 night): the same picture at other widths, for srcset.
 * Widths under the original are the original scaled down (Lanczos); widths over
 * it are the upscaled master (tools/upscale), so a large or high-density screen
 * is handed real pixels instead of the browser stretching the original.
 * tools/covers.mjs attaches a ladder only when the file is byte-for-byte the one
 * that was upscaled (content/hd.json keys each ladder by the file's SHA-1), so a
 * newly dropped cover never shows an older picture's pixels.
 */
import DROP from "./drop-covers.json";
import { pointersFor } from "./pointers";
import { PICTURE_ALTS, SQUARE_COVERS } from "./covers";
import { PRODUCTS, BY_SLUG } from "./products";
import { actionFor, pageFor, priceLabel } from "./links";

export type Rung = { src: string; w: number };
export type CoverView = { src: string; w: number; h: number; alt: string; srcSet?: string; dark?: boolean };
export type ProductView = {
  slug: string;
  name: string;
  line: string;
  price: string;
  page: string;
  action: { href: string; label: string } | null;
};

const view = (slug: string): ProductView => {
  const p = BY_SLUG[slug];
  return {
    slug,
    name: p.name,
    // DS ASL and DS Toolkit have no cover line (they never had a listing of
    // their own), so they show their first sheet hook, closed like the cover lines are.
    line: pointersFor(slug).line ?? `${p.hooks[0].replace(/\.$/, "")}.`,
    price: priceLabel(slug),
    page: pageFor(slug),
    action: actionFor(slug),
  };
};

export const PRODUCT_VIEWS: Record<string, ProductView> = Object.fromEntries(PRODUCTS.map((p) => [p.slug, view(p.slug)]));

/** "a.webp 360w, b.webp 1080w, …" — the original is always one of the rungs. */
export const srcSetOf = (src: string, w: number, ladder?: Rung[]) =>
  ladder?.length
    ? [...ladder.filter((r) => r.w !== w), { src, w }]
        .sort((a, b) => a.w - b.w)
        .map((r) => `${r.src} ${r.w}w`)
        .join(", ")
    : undefined;

const drop = DROP as Record<string, { src: string; w: number; h: number; file: string; ladder?: Rung[]; dark?: boolean }>;
/**
 * The alt text: when the file is the 2026-10-25 cover itself (<slug>.webp,
 * the same picture the live site serves), its exact description from
 * content/covers.ts; for a new picture, only what is always true of it.
 */
export const COVERS: Record<string, CoverView | undefined> = Object.fromEntries(
  PRODUCTS.filter((p) => drop[p.slug]).map((p) => {
    const d = drop[p.slug];
    const same = d.file === `${p.slug}.webp` && SQUARE_COVERS[p.slug];
    const named = PICTURE_ALTS[d.file];
    return [
      p.slug,
      {
        src: d.src,
        w: d.w,
        h: d.h,
        alt: named ?? (same ? SQUARE_COVERS[p.slug].alt : `${p.name} in NinjaTrader 8.`),
        srcSet: srcSetOf(d.src, d.w, d.ladder),
        dark: d.dark,
      },
    ];
  }),
);
