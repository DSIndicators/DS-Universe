import type { Metadata } from "next";
import { Marketplace } from "@/components/Marketplace";
import { Reveal } from "@/components/ui/Reveal";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { CompleteBand } from "@/components/CompleteBand";
import { SHELVES } from "@/content/release";
import { seriesPrice, tilePrice } from "@/content/pricing";
import { StillMonitor } from "@/components/ui/StillMonitor";
import { DISCLOSURE, PRODUCTS_SCREEN } from "@/content/site";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Every DS Universe product for NinjaTrader 8 — flagship indicators, the Pro Series panels, the free chart essentials and the Market Replay utility. Each one bought once; DS Complete is all of it.",
};

export default function ProductsPage() {
  return (
    <>
      {/* The header: the words on the left, one chart in the monitor on the
          right (Tom, 2026-09-26). The "How buying works" band runs under both
          at full width — squeezed into half a column its three steps would
          wrap to one word a line. */}
      <section className="wrap pt-12 sm:pt-16 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-6">
            <p className="label">Products</p>
            <h1 className="display-lg mt-5 text-ink text-balance">Every tool, one question each.</h1>
            <p className="lede mt-6 max-w-xl text-pretty">
              Each one sold on its own, for a single payment — and the chart essentials free.
              Open any box for what it shows, how it helps, and the guide to reading it on a
              live chart.
            </p>
            {/* The series, in the order the shelves run. Built from the catalogue,
                so a jump link can never point at a shelf that no longer exists. */}
            <nav className="mt-8 flex flex-wrap gap-2" aria-label="Series">
              {SHELVES.map((s) => {
                const p = seriesPrice(s.info.key);
                return (
                  <a key={s.info.key} href={`#${s.info.key}`} className="chip hover:border-ink hover:text-ink">
                    {s.info.name}
                    {p && <span className="ml-2 text-[12px] tabular-nums text-gold-deep">{tilePrice(p)}</span>}
                  </a>
                );
              })}
              <a href="#complete" className="chip hover:border-ink hover:text-ink">
                DS Complete
              </a>
            </nav>
          </Reveal>

          <Reveal className="lg:col-span-6" delay={120}>
            <StillMonitor
              src={PRODUCTS_SCREEN.src}
              w={PRODUCTS_SCREEN.w}
              h={PRODUCTS_SCREEN.h}
              blur={PRODUCTS_SCREEN.blur}
              alt={PRODUCTS_SCREEN.alt}
              title={PRODUCTS_SCREEN.title}
              sub={PRODUCTS_SCREEN.sub}
              priority
            />
            <p className="mt-5 text-[14.5px] leading-relaxed text-slate text-pretty">{PRODUCTS_SCREEN.caption}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-mute text-pretty">{DISCLOSURE.chart}</p>
          </Reveal>
        </div>
        <Reveal>
          <WaitlistNote tone="band" className="mt-12" />
        </Reveal>
      </section>
      <Marketplace withHeading={false} />
      <CompleteBand />
    </>
  );
}
