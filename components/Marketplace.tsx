import { Shelf } from "@/components/Shelf";
import { Reveal } from "@/components/ui/Reveal";
import { SHELVES } from "@/content/release";
import { CATALOGUE } from "@/content/site";

/**
 * The storefront: every product, shelved by series, each tile priced and each
 * shelf buyable. Used on the home page (with the heading, covers only) and on
 * /products (heading rendered by the page, both views), so the two cannot drift.
 */
export function Marketplace({
  withHeading = true,
  views = false,
  className = "wrap py-24 lg:py-32",
}: {
  withHeading?: boolean;
  /** Render each shelf's covers AND price-list bodies (the /products store). */
  views?: boolean;
  className?: string;
}) {
  return (
    <section className={className} id="products">
      {withHeading && (
        <Reveal className="max-w-3xl">
          <p className="label">{CATALOGUE.eyebrow}</p>
          <h2 className="display-lg mt-4 text-ink text-balance">{CATALOGUE.heading}</h2>
          <p className="lede mt-5 max-w-2xl text-pretty">{CATALOGUE.sub}</p>
        </Reveal>
      )}

      {/* One panel per series; the gap between panels lives in globals.css
          (.store-shelves) — the panel edges do the separating. */}
      <div className={`store-shelves ${withHeading ? "mt-14 lg:mt-16" : ""}`}>
        {SHELVES.map((shelf, i) => (
          <Shelf key={shelf.info.key} shelf={shelf} priority={i === 0} views={views} />
        ))}
      </div>
    </section>
  );
}
