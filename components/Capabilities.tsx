import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

// Optimized chart screenshots from public/capabilities (cap-01..cap-12).
const CAPS = Array.from(
  { length: 12 },
  (_, i) => `/capabilities/cap-${String(i + 1).padStart(2, "0")}.webp`,
);

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="relative scroll-mt-24 overflow-hidden py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60 [mask-image:radial-gradient(circle_at_50%_40%,#000_30%,transparent_80%)]" />

      <div className="mx-auto mb-12 max-w-7xl px-5 sm:px-8">
        <Reveal className="flex flex-col gap-4">
          <Eyebrow>Live Capabilities</Eyebrow>
          <h2 className="font-sans text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            <span className="text-ink-white">The intelligence,</span>{" "}
            <span className="text-ai">on the chart.</span>
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-ink-gray sm:text-lg">
            Confidence-scored zones, multi-timeframe Council, power movers, heat
            and order flow — every read rendered live, cross-referenced, and lag-free.
          </p>
        </Reveal>
      </div>

      {/* Full-bleed auto-scrolling strip (duplicated for a seamless loop). */}
      <div className="cap-marquee-wrap">
        <ul className="cap-marquee px-5">
          {[...CAPS, ...CAPS].map((src, i) => (
            <li
              key={i}
              className="group relative w-[clamp(320px,40vw,520px)] shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-space-deep shadow-glow-cyan"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="DS Universe live chart capability"
                loading="lazy"
                decoding="async"
                className="block w-full"
                aria-hidden={i >= CAPS.length}
              />
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06]" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
