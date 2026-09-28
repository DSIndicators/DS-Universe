import { Fragment } from "react";
import { CompleteKeystone } from "@/components/CompleteKeystone";
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

      {/* DS Complete first, then one panel per series, joined by one gold
          thread (2026-09-28): the lineup reads as the bundle and what is
          inside it. The gaps live here, not in CSS margins — each gap IS a
          length of the thread. */}
      <div className={withHeading ? "mt-14 lg:mt-16" : ""}>
        <CompleteKeystone />
        {SHELVES.map((shelf, i) => (
          <Fragment key={shelf.info.key}>
            <Thread label={i === 0 ? "Inside DS Complete" : "Included"} />
            <Shelf shelf={shelf} priority={i === 0} views={views} />
          </Fragment>
        ))}
      </div>
    </section>
  );
}

/**
 * A length of the gold thread between two panels: a line at the panels' inner
 * content edge, flowing downward, a node where it meets the next panel's
 * border, and a small mono label beside it.
 */
function Thread({ label }: { label: string }) {
  return (
    <div className="relative z-10 h-12 lg:h-14" aria-hidden="true">
      <span className="thread absolute inset-y-0 left-6 w-px sm:left-8 lg:left-10" />
      <span className="absolute -bottom-[4px] left-6 -ml-[3.5px] h-[8px] w-[8px] rotate-45 border border-gold bg-ground sm:left-8 lg:left-10" />
      <span className="absolute left-10 top-1/2 -translate-y-1/2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-gold-deep/80 sm:left-12 lg:left-14">
        {label}
      </span>
    </div>
  );
}
