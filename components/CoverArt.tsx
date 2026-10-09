import Image from "next/image";
import { COVER_GAPS, squareCoverFor } from "@/content/covers";
import { shotFor } from "@/content/loupe";
import { boxartFor, resolveProduct } from "@/content/release";

/**
 * A product's SQUARE cover (content/covers.ts) — the one picture every
 * marketplace card shows.
 *
 *   1. Its square cover, when Tom has shot one.
 *   2. Without one, while content/covers.ts COVER_GAPS is "blank" (the cover
 *      shoot): an empty square in the same frame.
 *   3. Otherwise, a square cut of the chart picture the product already has
 *      (content/loupe.ts), centred on the place that picture was measured on.
 *      Plain object-fit: cover — no magnification, no label, no crop marks.
 *   4. A product with neither keeps its box art, contained in the square.
 *
 * The hover (a slow 3% push-in) is driven by the card's `.group` in
 * app/globals.css (THE PRODUCT CARD), and is off under reduced motion.
 */
export function CoverArt({
  slug,
  sizes,
  priority = false,
  className = "",
}: {
  slug: string;
  /** The card's rendered widths, for the image request. */
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const p = resolveProduct(slug);
  const name = p?.name ?? slug;
  const cover = squareCoverFor(slug);
  if (cover) {
    return (
      <div className={`cover-art relative aspect-square overflow-hidden bg-[#0E1116] ${className}`}>
        <Image src={cover.src} alt={cover.alt} fill sizes={sizes} priority={priority} quality={92} className="cover-img object-cover" />
      </div>
    );
  }
  // The cover shoot's shell: an empty square until the cover exists.
  if (COVER_GAPS === "blank") {
    return <div className={`cover-art cover-blank relative aspect-square ${className}`} aria-hidden="true" />;
  }
  const shot = shotFor(slug);
  if (shot) {
    // Where the square sits along the picture's long side so the measured
    // focus is as near its centre as the picture allows (0 = flush left/top).
    const r = shot.w / shot.h;
    const along = (c: number, k: number) => (k > 1 ? Math.min(1, Math.max(0, (c * k - 0.5) / (k - 1))) : 0.5);
    const x = r > 1 ? along(shot.focus.cx, r) : 0.5;
    const y = r < 1 ? along(shot.focus.cy, 1 / r) : 0.5;
    // The square shows only part of a wide picture, so ask for it that much wider.
    const wide = widen(sizes, Math.max(r, 1));
    return (
      <div className={`cover-art relative aspect-square overflow-hidden bg-[#040404] ${className}`}>
        <Image
          src={shot.src}
          alt={shot.alt}
          fill
          sizes={wide}
          priority={priority}
          quality={92}
          className="cover-img object-cover"
          style={{ objectPosition: `${Math.round(x * 1000) / 10}% ${Math.round(y * 1000) / 10}%` }}
        />
      </div>
    );
  }
  return (
    <div className={`cover-art relative aspect-square overflow-hidden bg-surface ${className}`}>
      <Image src={boxartFor(slug)} alt={`${name} box`} fill sizes={sizes} priority={priority} className="cover-img object-contain p-[8%]" />
    </div>
  );
}

/** Multiply the slot width of every `sizes` entry (never its media query) by k. */
function widen(sizes: string, k: number) {
  return sizes
    .split(",")
    .map((part) => part.trim().replace(/(\d+(?:\.\d+)?)(px|vw)$/, (_, n: string, u: string) => `${Math.round(Number(n) * k)}${u}`))
    .join(", ");
}
