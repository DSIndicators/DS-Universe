import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * DS P&L Showcase — shown as its own section on the Showcase page, separate from
 * the three package brochures (Crewmates / Radars / Systems) so it doesn't break
 * that 1:1 package mapping. Static rasterized pages scrolled inside a frame, the
 * same buttery pattern as the main brochure viewer.
 */
const PNL_PAGES = 12;
const pages = Array.from(
  { length: PNL_PAGES },
  (_, i) => `/brochures/pnl/page-${String(i + 1).padStart(2, "0")}.webp`,
);

export function PnlShowcase() {
  return (
    <div id="pnl-showcase" className="mt-24 scroll-mt-28">
      <SectionHeading
        eyebrow="The P&L Showcase"
        title="Every trade,"
        titleMuted="one dashboard."
        intro="DS P&L turns a NinjaTrader export into a living performance dashboard — your own fills, cumulative P&L, your win/loss balance and a colour-graded calendar. Read the full showcase inline."
        align="center"
        className="mb-12"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-space-deep">
        <div className="max-h-[82vh] min-h-[560px] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
            {pages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`DS P&L Showcase — page ${i + 1} of ${PNL_PAGES}`}
                width={1224}
                height={1584}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="block w-full rounded-lg border border-white/[0.06] shadow-glow"
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-ink-gray/60">
        Scroll the pages above to read the full DS P&amp;L showcase.
      </p>
    </div>
  );
}
