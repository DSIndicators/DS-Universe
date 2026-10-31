import Link from "next/link";
import { COVERS } from "@/content/pictures";
import { pointersFor } from "@/content/pointers";
import type { Product } from "@/content/products";
import { hrefFor } from "@/content/paths";
import { isFree } from "@/content/vaults";

/** One sentence for a product: its cover line, else its first hook. */
export const lineFor = (p: Product) => pointersFor(p.slug).line ?? `${p.hooks[0].replace(/\.$/, "")}.`;

/**
 * A tool on a shelf: its cover CONTAINED in a square (whole picture, never
 * cropped), its name, which vault it is in, one line. The whole tile is the link.
 */
export function Tile({ p, sizes = "(max-width: 560px) 92vw, 280px", tag = true }: { p: Product; sizes?: string; tag?: boolean }) {
  const c = COVERS[p.slug];
  const free = isFree(p);
  return (
    <Link href={hrefFor(p.slug)} className="tile">
      <span className={`tile-pic${c?.dark ? " tile-pic-dark" : ""}`}>
        {c ? (
          <img src={c.src} srcSet={c.srcSet} sizes={sizes} width={c.w} height={c.h} alt={c.alt} loading="lazy" decoding="async" />
        ) : (
          <span className="tile-empty">Picture coming</span>
        )}
      </span>
      <span>
        <span className="tile-name">
          <span className="d4">{p.name}</span>
          {tag && <span className={`tile-tag${free ? " tile-tag-free" : ""}`}>{free ? "Free" : "Essentials"}</span>}
        </span>
        <span className="tile-line" style={{ display: "block", marginTop: 6 }}>
          {lineFor(p)}
        </span>
      </span>
    </Link>
  );
}
