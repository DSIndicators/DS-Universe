import { ArrowRight } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

export function CTASection() {
  return (
    <section id="docs" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-5xl">
        <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-16 sm:py-20">
          {/* aurora glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora opacity-25 blur-[100px]" />
          <div className="starfield pointer-events-none absolute inset-0 opacity-20" />

          <div className="relative flex flex-col items-center gap-6">
            <Eyebrow>Precision from Orbit</Eyebrow>
            <h2 className="font-sans text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              <span className="text-ink-white">Trade from</span>{" "}
              <span className="text-aurora">orbit.</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-ink-gray sm:text-lg">
              Nine instruments reading the same tape, agreeing before they speak,
              and stepping aside the moment you need pure price. See everything.
              Miss nothing.
            </p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row">
              <GlowButton href="#pricing">
                Get Access <ArrowRight size={16} />
              </GlowButton>
              <GlowButton href="#indicators" variant="ghost">
                Explore the Suite
              </GlowButton>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
