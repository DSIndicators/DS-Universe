import Link from "next/link";
import { COVERS } from "@/content/pictures";
import type { Product } from "@/content/products";
import { hrefFor } from "@/content/paths";
import { lineFor } from "./Tile";
import { Lock } from "./Tick";

/** A vault as a list: small contained cover, name and line, then what you can do with it. */
export function Rows({ items, locked, action }: { items: Product[]; locked?: boolean; action?: (p: Product) => React.ReactNode }) {
  return (
    <ul className="rows">
      {items.map((p) => {
        const c = COVERS[p.slug];
        return (
          <li key={p.slug} className={`row${locked ? " row-locked" : ""}`}>
            <span className={`row-pic${c?.dark ? " row-pic-dark" : ""}`}>{c && <img src={c.src} srcSet={c.srcSet} sizes="76px" width={c.w} height={c.h} alt="" loading="lazy" decoding="async" />}</span>
            <span className="row-text">
              <span className="d4" style={{ display: "block" }}>
                {p.name} <span className="tiny num">{p.version}</span>
              </span>
              <span className="small" style={{ display: "block" }}>
                {lineFor(p)}
              </span>
            </span>
            <span className="row-act">
              {locked ? (
                <span className="lock">
                  <Lock /> Locked
                </span>
              ) : (
                action?.(p)
              )}
              <Link className="lnk small" href={hrefFor(p.slug)}>
                Details
              </Link>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
