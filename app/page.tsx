import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Capabilities } from "@/components/Capabilities";
import { Indicators } from "@/components/Indicators";
import { Registry } from "@/components/Registry";
import { Pricing } from "@/components/Pricing";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

// Home page. Orb: rigid rotation, no in-orb stars; uniform black background.
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        {/* Background is the global WebGL starfield over a single uniform
            space-black (set on <body>). No vignette overlay - keeps the
            backdrop one consistent black with no uneven bands. */}
        <Hero />
        <Capabilities />
        <Indicators />
        <Registry />
        <Pricing />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
