import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { FusedCore } from "@/components/ui/FusedCore";

const STATS = [
  { value: "0", label: "Repaints" },
  { value: "5", label: "Run on one core" },
  { value: "1", label: "Clean chart" },
];

export function Registry() {
  return (
    <section className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="The Connective Tissue"
              title="Intelligently mixed."
              titleMuted="One mind behind it all."
              intro="The DS Systems never work alone. Five of the six run on a single mind — the DS Registry — which cross-references every reading against every other in real time and renders it without a hint of lag. The sixth, DS Pulse, reads the raw order flow standalone. Nothing outside the Systems suite touches the Registry, and where the five meet, the read is one and the same: they agree, or you see nothing."
            />

            <Reveal>
              <div className="mt-2 grid grid-cols-3 gap-4">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col gap-1 border-l border-white/[0.08] pl-4"
                  >
                    <span className="font-sans text-4xl font-extrabold text-aurora sm:text-5xl">
                      {s.value}
                    </span>
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-gray">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Registry visual — the signature orb fused with the Intelligence Core,
              titled like the suite panels to signify it's the brain of it all. */}
          <Reveal delay={0.1} className="flex justify-center">
            <div className="relative flex flex-col items-center gap-4 py-10">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-space-cyan/10 blur-[100px]" />
              <FusedCore size={360} />

              <div className="relative flex flex-col items-center gap-1.5 text-center">
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-space-electric">
                  The Intelligence Core
                </span>
                <div className="relative">
                  <span
                    aria-hidden
                    className="bg-ai absolute -inset-x-6 -inset-y-2 -z-10 rounded-full opacity-40 blur-2xl"
                  />
                  <h3 className="text-ai font-sans text-3xl font-extrabold tracking-tight sm:text-4xl">
                    DS Registry
                  </h3>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
