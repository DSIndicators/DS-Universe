import { Fragment } from "react";
import { CompleteKeystone } from "@/components/CompleteKeystone";
import { Shelf } from "@/components/Shelf";
import { Reveal } from "@/components/ui/Reveal";
import { NEW_SERIES, STORE_SHELVES } from "@/content/release";
import Link from "next/link";
import { CATALOGUE, DISCLOSURE } from "@/content/site";

const CHARTS_NOTE = "Every picture is the product running in NinjaTrader 8; hand-drawn marks on a picture are added for illustration.";

/**
 * The storefront: DS Complete, then every PAID product, shelved by series,
 * each tile priced and each shelf buyable. Used on the home page (with the
 * heading, cards only) and on /products (heading rendered by the page, both
 * views), so the two cannot drift. Every product is a marketplace card
 * (components/ProductCard.tsx, 2026-10-08).
 *
 * PAID ONLY (2026-10-05). The free products are not a shelf here any more:
 * they are the Free Vault, a page of their own (/free-vault). DS ASL and DS
 * Toolkit have no shelf either — they are shown inside DS Complete, which
 * they come free with and which is the only way to get them.
 * The shelves come from content/release.ts STORE_SHELVES.
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
        {STORE_SHELVES.map((shelf, i) => (
          <Fragment key={shelf.info.key}>
            <Thread
              label={i === 0 ? "Inside DS Complete" : "Included"}
              isNew={shelf.info.key === NEW_SERIES}
            />
            {/* No shelf is preloaded (2026-10-09): every one sits below the
                first screen, under DS Complete, and a preload there only
                competed with the first screen's own text and pictures. */}
            <Shelf shelf={shelf} views={views} />
          </Fragment>
        ))}
      </div>
      {/* Every card shows a chart, and chart pictures may not appear without
          the risk and hypothetical-performance disclosures beside them
          (NinjaTrader vendor guidelines rev 2.11.2025, p.2): the lineup always
          closes on DISCLOSURE.chart. */}
      <p className="mt-10 max-w-3xl text-[length:calc(12.5px*var(--type))] leading-relaxed text-mute">
        {CHARTS_NOTE} {DISCLOSURE.chart}{" "}
        <Link href="/disclosures" className="underline decoration-mute/50 underline-offset-4 hover:text-ink">
          Disclosures
        </Link>
      </p>
    </section>
  );
}

/**
 * A length of the gold thread between two panels: a line at the panels' inner
 * content edge, flowing downward, a node where it meets the next panel's
 * border, and a small mono label beside it.
 */
function Thread({ label, isNew = false }: { label: string; isNew?: boolean }) {
  return (
    <div className="relative z-10 h-12 lg:h-14" aria-hidden="true">
      <span className="thread absolute inset-y-0 left-6 w-px sm:left-8 lg:left-10" />
      <span className="absolute -bottom-[4px] left-6 -ml-[3.5px] h-[8px] w-[8px] rotate-45 border border-gold bg-ground sm:left-8 lg:left-10" />
      <span className="absolute left-10 top-1/2 -translate-y-1/2 font-mono text-[length:calc(9.5px*var(--type))] uppercase tracking-[0.16em] text-gold-deep/80 sm:left-12 lg:left-14">
        {/* A new series (content/release.ts NEW_SERIES) says so on its thread
            — the word in full gold, then the usual label. */}
        {isNew && (
          <>
            <span className="text-gold">New</span>
            <span className="px-2 text-gold-deep/50">·</span>
          </>
        )}
        {label}
      </span>
    </div>
  );
}
