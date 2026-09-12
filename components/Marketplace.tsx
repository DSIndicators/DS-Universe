import { Reveal } from "@/components/ui/Reveal";
import { BoxCard } from "@/components/BoxCard";
import { ChartRow } from "@/components/ChartRow";
import { LIVE_SHELVES } from "@/content/release";
import { CATALOGUE } from "@/content/site";

/**
 * The storefront: the first-release lineup as box-art shelves.
 * Used on the home page (with the catalogue heading) and on /products
 * (heading rendered by the page). Never renders a count, never a price.
 *
 * A shelf marked `wide` lays its art out in 16:9 tiles instead of 3:4 boxes -
 * the add-on art is drawn landscape, so cropping it to a box would cut the
 * product's own copy off its cover.
 *
 * Between the heading and the first shelf sits ChartRow: four real charts, one
 * row, any of them full screen on click (Tom, 2026-09-12). It is inside this
 * component rather than on the pages so home and /products cannot drift, and
 * so the pictures are the first thing under the heading on both - the shelves
 * below are box art, and box art shows the packaging, not the software.
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

      <ChartRow className={withHeading ? "mt-14" : ""} />

      <div className="mt-20 space-y-24">
        {LIVE_SHELVES.map((shelf, si) => {
          const perRow = shelf.wide ? 3 : 5;
          return (
            <div key={shelf.title} id={shelf.title.toLowerCase().replace(/[^a-z]+/g, "-")}>
              <Reveal className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-5">
                <h3 className="display-md text-ink">{shelf.title}</h3>
                <p className="max-w-md text-[14.5px] leading-relaxed text-slate">{shelf.blurb}</p>
              </Reveal>
              <div
                className={
                  shelf.wide
                    ? "mt-8 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3"
                    : "mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6"
                }
              >
                {shelf.entries.map((e, i) => (
                  <Reveal key={e.slug ?? e.pending.name} delay={(i % perRow) * 60}>
                    <BoxCard entry={e} wide={shelf.wide} priority={si === 0 && i < 5} />
                  </Reveal>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
