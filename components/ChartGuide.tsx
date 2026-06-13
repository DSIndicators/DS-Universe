import { Reveal } from "@/components/ui/Reveal";

/**
 * "How To Read The Chart" — the official DS Universe teaching chart, shown as a
 * static optimized image (84 KB webp) so it stays crisp and never costs render
 * time. Placed under the pricing tiers so buyers can see exactly what every read
 * looks like on a live chart while they decide.
 */
export function ChartGuide() {
  return (
    <Reveal>
      <figure className="relative mt-20 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#040406] shadow-glow">
        {/* soft ambient halo so the static image sits in the page's glow system */}
        <div className="bg-ai pointer-events-none absolute -inset-x-10 -top-24 h-56 opacity-[0.08] blur-3xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/how-to-read-chart.webp"
          alt="DS Universe — How To Read The Chart: an annotated live candlestick chart showing early exhaustion, strong pressure, sellers pressure, the 75% STR support shelf with a 63% confidence score, big buyers, and exhaustion at the highs."
          width={2157}
          height={993}
          loading="lazy"
          decoding="async"
          className="relative block w-full"
        />
        <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.06]" />
      </figure>
    </Reveal>
  );
}
