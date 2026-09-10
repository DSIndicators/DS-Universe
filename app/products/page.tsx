import type { Metadata } from "next";
import { Marketplace } from "@/components/Marketplace";
import { Reveal } from "@/components/ui/Reveal";
import { WaitlistNote } from "@/components/ui/WaitlistNote";

export const metadata: Metadata = {
  title: "Products",
  description: "Indicators drawn on the chart and add-ons mounted on the platform — every DS Universe product for NinjaTrader 8.",
};

export default function ProductsPage() {
  return (
    <>
      <section className="wrap pt-12 sm:pt-16 lg:pt-20">
        <Reveal className="max-w-3xl">
          <p className="label">Products</p>
          <h1 className="display-lg mt-5 text-ink text-balance">Every tool, one question each.</h1>
          <p className="lede mt-6 max-w-2xl text-pretty">
            Indicators are drawn on the chart; add-ons live on the platform. Open any product for what it shows, how it helps, and what it looks like on a live chart.
          </p>
          <nav className="mt-8 flex gap-2" aria-label="Sections">
            <a href="#indicators" className="chip hover:border-ink hover:text-ink">Indicators</a>
            <a href="#add-ons" className="chip hover:border-ink hover:text-ink">Add-ons</a>
          </nav>
          {/* Anyone landing straight on the shelf sees it before the tiles. */}
          <WaitlistNote tone="band" className="mt-8" />
        </Reveal>
      </section>
      <Marketplace withHeading={false} />
    </>
  );
}
