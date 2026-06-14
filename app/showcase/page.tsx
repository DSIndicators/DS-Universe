import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Showcase } from "@/components/Showcase";

export const metadata: Metadata = {
  title: "Showcase — DS Universe (Crewmates · Radars · Systems)",
  description:
    "Browse the DS Universe showcase: DS Crewmates (Free), DS Radars (Pro) and DS Systems (Universe). Read every brochure inline.",
};

export default function ShowcasePage() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        {/* Static aurora backdrop — no animation, so nothing competes with the
            PDF viewer for the GPU while you read. */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -left-40 top-[-10%] h-[42rem] w-[42rem] rounded-full bg-space-violet/15 blur-[140px]" />
          <div className="absolute -right-40 top-1/3 h-[38rem] w-[38rem] rounded-full bg-space-cyan/12 blur-[140px]" />
          <div className="starfield absolute inset-0 opacity-[0.12]" />
          <div className="absolute inset-0 bg-gradient-to-b from-space-black/40 via-transparent to-space-black/70" />
        </div>

        <section className="relative mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-ink-gray transition-colors hover:text-ink-white"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <SectionHeading
            eyebrow="The Showcase"
            title="See the whole"
            titleMuted="universe."
            intro="Three series, one design language. Pick a set to read its full brochure inline — Crewmates to learn the chart, Radars to decode the tape, Systems to map the field."
            align="center"
            className="mb-14"
          />

          <Showcase />
        </section>
      </main>
      <Footer />
    </>
  );
}
