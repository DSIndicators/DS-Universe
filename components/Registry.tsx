import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Planet } from "@/components/ui/Planet";

const STATS = [
  { value: "0", label: "Repaints" },
  { value: "9", label: "Systems, one core" },
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
              intro="No instrument works alone. They're all intelligently mixed and bound by a single mind — the DS Registry — which cross-references every reading against every other in real time and renders it without a hint of lag. The result is one coherent read: the systems agree, or you see nothing."
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

          {/* Registry visual */}
          <Reveal delay={0.1} className="flex justify-center">
            <div className="relative flex items-center justify-center py-10">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-space-cyan/10 blur-[100px]" />
              <Planet size={380} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
