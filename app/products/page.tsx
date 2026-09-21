import type { Metadata } from "next";
import { Marketplace } from "@/components/Marketplace";
import { Reveal } from "@/components/ui/Reveal";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { CompleteBand } from "@/components/CompleteBand";
import { SHELVES } from "@/content/release";
import { seriesPrice, tilePrice } from "@/content/pricing";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Every DS Universe product for NinjaTrader 8 — flagship indicators, the Pro Series panels, the free chart essentials and the Market Replay utility. Each one bought once; DS Complete is all of it.",
};

export default function ProductsPage() {
  return (
    <>
      <section className="wrap pt-12 sm:pt-16 lg:pt-20">
        <Reveal className="max-w-3xl">
          <p className="label">Products</p>
          <h1 className="display-lg mt-5 text-ink text-balance">Every tool, one question each.</h1>
          <p className="lede mt-6 max-w-2xl text-pretty">
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
          <WaitlistNote tone="band" className="mt-8" />
        </Reveal>
      </section>
      <Marketplace withHeading={false} />
      <CompleteBand />
    </>
  );
}
