import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Gallery — DS Universe",
  description:
    "The full DS Universe gallery: live chart reads, cockpit panels, and product promos across the Systems, Radars, Crewmates, Carepack, Playbooks and the DS P&L.",
};

// Everything that used to scroll in the homepage rotation, now collected here.
const GROUPS: { heading: string; blurb: string; images: string[] }[] = [
  {
    heading: "On the chart",
    blurb: "Confidence-scored zones, order blocks, premium/discount, heat and more — rendered live.",
    images: [
      "/capabilities/cap-03.webp",
      "/capabilities/cap-06.webp",
      "/capabilities/cap-04.webp",
      "/capabilities/cap-05.webp",
      "/capabilities/cap-07.webp",
      "/capabilities/cap-02.webp",
      "/capabilities/cap-11.webp",
      "/capabilities/cap-01.webp",
      "/capabilities/cap-08.webp",
      "/capabilities/cap-10.webp",
    ],
  },
  {
    heading: "Live panels",
    blurb: "The Radars' cockpit reads — Pilots, Sweeper and Beacon.",
    images: [
      "/indicators/panels/pilots.webp",
      "/indicators/panels/sweeper.webp",
      "/indicators/panels/beacon.webp",
    ],
  },
  {
    heading: "Promos",
    blurb: "DS Systems, Pulse order flow, the Carepack, Risk-Reward and the Checklist.",
    images: [
      "/promos/systems.png",
      "/promos/pulse.png",
      "/promos/carepack.png",
      "/promos/riskreward.png",
      "/promos/checklist.png",
    ],
  },
];

export default function GalleryPage() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        {/* Static gold depth backdrop + dimmed stars. */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -left-40 top-[-10%] h-[42rem] w-[42rem] rounded-full bg-[#e3b24f]/[0.10] blur-[150px]" />
          <div className="absolute -right-40 top-1/3 h-[38rem] w-[38rem] rounded-full bg-[#c4922f]/[0.08] blur-[150px]" />
          <div className="starfield absolute inset-0 opacity-[0.05]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% -10%, rgba(227,178,79,0.10), transparent 55%), radial-gradient(100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        </div>

        <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-24 sm:px-8 sm:pt-28">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-ink-gray transition-colors hover:text-ink-white"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <SectionHeading
            eyebrow="The Gallery"
            title="Every read,"
            titleMuted="in one place."
            intro="The complete archive of DS Universe captures — chart reads, live panels and promos, beyond the six suite covers on the home page."
          />

          <div className="mt-14 flex flex-col gap-16">
            {GROUPS.map((g) => (
              <div key={g.heading}>
                <div className="mb-6 flex flex-col gap-2">
                  <h3 className="font-sans text-2xl font-bold tracking-tight text-ink-white sm:text-3xl">
                    {g.heading}
                  </h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-ink-gray sm:text-base">
                    {g.blurb}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {g.images.map((src) => (
                    <figure
                      key={src}
                      className="group relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#0a0806]/40 panel-soft"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt="DS Universe capability"
                        loading="lazy"
                        decoding="async"
                        className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
