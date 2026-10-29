import Link from "next/link";
import { Cover } from "@/components/Cover";
import { SectionBar } from "@/components/SectionBar";
import { COVERS, PRODUCT_VIEWS } from "@/content/catalog";
import type { Shelf } from "@/content/release";

/**
 * The store's shelves. Each series opens on its own teal bar (number, name,
 * tagline), so the shelves never run into one another, and its products follow
 * as a ledger: cover, name and category, the sheet's one line, the price, the
 * way to buy. Rows are spaced and ruled so each product reads as its own
 * line, and a row lifts to a faint teal tint under the pointer so the eye
 * keeps its place across the wide row. Each name and cover opens the
 * product's own page.
 */
export function Lineup({ shelves, start = 1 }: { shelves: Shelf[]; start?: number }) {
  return (
    <>
      {shelves.map((shelf, i) => (
        <div key={shelf.info.key} id={shelf.info.key} className="shelf">
          <SectionBar n={String(start + i).padStart(2, "0")} title={shelf.info.name} sub={shelf.info.tagline} as="h3" />
          <ul className="wb shelf-rows">
            {shelf.products.map((p) => {
              const v = PRODUCT_VIEWS[p.slug];
              return (
                <li key={p.slug}>
                  <Link href={v.page} tabIndex={-1} aria-hidden="true" className="thumb-a">
                    <Cover cover={COVERS[p.slug]} name="" sizes="120px" className="thumb" decorative />
                  </Link>
                  <div className="nm">
                    <Link className="d4 lnk lnk-bare" href={v.page}>
                      {p.name}
                    </Link>
                    <div className="cat">{p.category}</div>
                  </div>
                  <p className="line">{v.line}</p>
                  <p className="price num">{v.price}</p>
                  <p className="act">
                    {v.action && (
                      <a className="lnk" href={v.action.href}>
                        {v.action.label}
                      </a>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
