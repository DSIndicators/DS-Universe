import { Shelf } from "@/components/Shelf";
import { Reveal } from "@/components/ui/Reveal";
import { SHELVES } from "@/content/release";
import { CATALOGUE } from "@/content/site";

/**
 * The storefront: every product, shelved by series, each tile priced and each
 * shelf buyable. Used on the home page (with the heading) and on /products
 * (heading rendered by the page), so the two cannot drift.
 */
export function Marketplace({ withHeading = true }: { withHeading?: boolean }) {
  return (
    <section className="wrap py-24 lg:py-32" id="products">
      {withHeading && (
        <Reveal className="max-w-3xl">
          <p className="label">{CATALOGUE.eyebrow}</p>
          <h2 className="display-lg mt-4 text-ink text-balance">{CATALOGUE.heading}</h2>
          <p className="lede mt-5 max-w-2xl text-pretty">{CATALOGUE.sub}</p>
        </Reveal>
      )}

      <div className={`${withHeading ? "mt-20" : ""} space-y-24 lg:space-y-28`}>
        {SHELVES.map((shelf, i) => (
          <Shelf key={shelf.info.key} shelf={shelf} priority={i === 0} />
        ))}
      </div>
    </section>
  );
}
