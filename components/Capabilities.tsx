import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

// Clean rotation: ONLY the six branded suite covers (the Whop banners).
// Everything else (raw chart shots, live panels, product promos) now lives on
// the dedicated /gallery page.
const CAPS = [
  "/suite/systems.png", // DS Systems
  "/suite/radars.png", // DS Radars
  "/suite/crewmates.png", // DS Crewmates
  "/suite/carepack.png", // DS Carepack
  "/suite/guides.png", // DS Playbooks
  "/suite/pnl.png", // DS P&L
];

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="relative scroll-mt-24 overflow-hidden py-10 sm:py-14"
    >
      <div className="mx-auto mb-12 max-w-7xl px-5 sm:px-8">
        <Reveal className="flex flex-col gap-4">
          <Eyebrow>Live Capabilities</Eyebrow>
          <h2 className="font-sans text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            <span className="text-ink-white">See the edge,</span>{" "}
            <span className="text-ai">live.</span>
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-ink-gray sm:text-lg">
            This is what your chart looks like the moment DS Universe loads —
            clean, Quant-Grade reads that surface the instant the market moves, with
            nothing dragging behind. The kind of clarity that makes going back feel
            impossible.
          </p>
          <a
            href="/gallery"
            className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#f4cd7a] transition-colors hover:text-[#ffe7b0]"
          >
            Explore the full gallery
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </Reveal>
      </div>

      {/* Full-bleed auto-scrolling strip (duplicated for a seamless loop). */}
      {/* isolate => the .cap-ambience aurora (z -1) sits behind the cards: it
          bleeds above & below the strip and blooms between the pictures through
          the transparent gaps as they scroll. */}
      <div className="relative isolate">
        <div className="cap-ambience" aria-hidden />
        <div className="cap-marquee-wrap">
          <ul className="cap-marquee px-5">
          {[...CAPS, ...CAPS].map((src, i) => (
            <li
              key={i}
              className="group relative flex aspect-[16/10] w-[clamp(320px,40vw,520px)] shrink-0 items-center justify-center overflow-hidden"
              style={{
                filter:
                  "drop-shadow(0 28px 60px rgba(0,0,0,0.6)) drop-shadow(0 0 40px rgba(227,178,79,0.18))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="DS Universe suite cover"
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                aria-hidden={i >= CAPS.length}
              />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
