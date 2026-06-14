import { ArrowRight } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

const PARAGRAPHS = [
  "We built DS Universe for one simple reason: traders deserve tools that actually have their back.",
  "Every indicator in this suite started at a real chart, during real market hours, solving a real problem we ran into ourselves. We're traders first — so we know exactly what it feels like to need clarity when the market is moving fast and the noise is loud. That's the standard we hold every tool to before it ever reaches your screen.",
  "Our purpose is to keep looking out for traders. To keep sharpening, refining, and building the best tools we can possibly put in your hands — and to never stop, because the markets never stop either. Whether you're here for a single free Tier 1 indicator or running the full DS Radars and DS Systems suites, you're part of how we got here, and we're glad you're with us.",
];

export function CTASection() {
  return (
    <section id="about" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-5xl">
        <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-16 sm:px-16 sm:py-20">
          {/* ambient aurora + ember glows so the panel feels alive */}
          <div className="pointer-events-none absolute -left-24 top-[-20%] h-[26rem] w-[26rem] rounded-full bg-aurora opacity-25 blur-[100px]" />
          <div className="pointer-events-none absolute -right-20 bottom-[-25%] h-[24rem] w-[24rem] rounded-full bg-[#ff7a2f]/15 blur-[100px]" />
          <div className="starfield pointer-events-none absolute inset-0 opacity-[0.18]" />

          <div className="relative flex flex-col gap-8">
            <div className="flex flex-col items-center gap-5 text-center">
              <Eyebrow>Precision from Orbit</Eyebrow>
              <h2 className="font-sans text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
                <span className="text-ink-white">Welcome to</span>{" "}
                <span className="text-aurora">DS Universe</span>
              </h2>
            </div>

            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              {PARAGRAPHS.map((p) => (
                <p
                  key={p.slice(0, 24)}
                  className="text-base leading-relaxed text-ink-gray sm:text-lg"
                >
                  {p}
                </p>
              ))}
              <p className="mt-1 text-center font-sans text-xl font-semibold tracking-tight text-ink-white sm:text-2xl">
                Welcome in.{" "}
                <span className="text-aurora">Let&apos;s get to work.</span>
              </p>
            </div>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:justify-center">
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
