import Link from "next/link";
import { COMPLETE, PRICES, money } from "@/content/pricing";
import { PRODUCTS } from "@/content/products";

/**
 * The whole offer in one line, under the hero. COMPUTED from content/pricing.ts
 * — the indicator price is read off the catalogue, so this line cannot quote a
 * number the shelves below do not show.
 */
export function HeroOffer({ className = "" }: { className?: string }) {
  const ind = PRODUCTS.filter((p) => p.kind === "indicator")
    .map((p) => PRICES[p.slug])
    .filter((p) => p && !p.free);
  const nows = [...new Set(ind.map((p) => p!.now))];
  const lead = nows.length === 1 ? `Indicators ${money(nows[0]!)} each, bought once` : "Indicators bought once";

  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px] leading-relaxed text-slate ${className}`}>
      <span className="text-ink">{lead}.</span>
      <span>The essentials are free.</span>
      <span>
        Everything is{" "}
        <Link href="#complete" className="text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
          {COMPLETE.name}, {money(COMPLETE.now)}
        </Link>
        .
      </span>
    </p>
  );
}
