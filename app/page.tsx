import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Capabilities } from "@/components/Capabilities";
import { Indicators } from "@/components/Indicators";
import { Registry } from "@/components/Registry";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        {/* Global faint starfield behind the whole page */}
        <div className="starfield pointer-events-none fixed inset-0 -z-10 opacity-[0.12]" />
        <Hero />
        <Capabilities />
        <Indicators />
        <Registry />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
