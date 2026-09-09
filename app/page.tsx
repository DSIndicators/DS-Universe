import Image from "next/image";
import Link from "next/link";
import { Monitor } from "@/components/ui/Monitor";
import { Reveal } from "@/components/ui/Reveal";
import { Marketplace } from "@/components/Marketplace";
import { NT_ASSETS, NT_LINKS } from "@/content/ninjatrader";
import { ABOUT, CLOSING, FACTS, HERO, PRINCIPLES, SITE } from "@/content/site";

/**
 * Home order (Tom, 2026-09-08 evening): hero → NinjaTrader featured (took the
 * old About slot) → principles → storefront → About ("Built for the trader",
 * moved to the bottom) → closing.
 */
export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="hero-wash hem relative overflow-hidden">
        <div className="wrap grid items-center gap-12 pb-20 pt-10 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pb-14 lg:pt-16">
          <div className="lg:col-span-5">
            <p className="label rise">{HERO.eyebrow}</p>
            <h1 className="display-xl rise mt-5 text-ink text-balance" style={{ animationDelay: "80ms" }}>
              {HERO.title}
            </h1>
            <p className="lede rise mt-6 max-w-md text-pretty" style={{ animationDelay: "160ms" }}>
              {HERO.sub}
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Link href={HERO.primary.href} className="btn-primary">
                {HERO.primary.label}
              </Link>
              <Link href={HERO.secondary.href} className="btn-ghost">
                {HERO.secondary.label}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Monitor priority className="rise-monitor lg:mt-4 lg:w-[128%]" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------- the platform, featured */}
      <section className="border-b border-line bg-wash">
        <div className="wrap grid items-center gap-12 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <Reveal className="lg:col-span-7">
            {/* Official wordmark, ≥18px clear space, NinjaTrader partner link. */}
            <a
              href={NT_LINKS.partner}
              target="_blank"
              rel="sponsored noopener"
              className="inline-block py-[18px] pr-[18px]"
              aria-label="NinjaTrader — visit ninjatrader.com"
            >
              <Image src={NT_ASSETS.wordmark} alt="NinjaTrader" width={2376} height={300} className="h-8 w-auto" />
            </a>
            <h2 className="display-md mt-3 text-ink text-balance">Our recommended trading platform.</h2>
            <p className="body mt-4 max-w-xl text-pretty">
              NinjaTrader® is our #1 recommended trading platform — free to download, with a
              free trading simulator and real-time futures data. Every DS Universe tool is
              built to live on it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={NT_LINKS.partner} target="_blank" rel="sponsored noopener" className="btn-primary">
                Get Started for FREE!
              </a>
              <Link href="/ninjatrader" className="btn-ghost">
                About the platform
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-5">
            <Image
              src={NT_ASSETS.monitor}
              alt="The NinjaTrader platform on a desktop monitor"
              width={500}
              height={465}
              className="mx-auto w-full max-w-[360px]"
            />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- principles */}
      <section className="border-b border-line bg-mist">
        <div className="wrap grid gap-10 py-20 md:grid-cols-3 md:gap-8 lg:py-24">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 90} className="border-t border-line-strong pt-6">
              <h3 className="display-sm text-ink">{p.title}</h3>
              <p className="mt-3 text-[15.5px] leading-relaxed text-slate text-pretty">{p.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- storefront */}
      <Marketplace />

      {/* --------------------------------------------------------------- about */}
      <section className="border-t border-line">
        <div className="wrap grid gap-12 py-24 md:grid-cols-12 lg:py-32">
          <Reveal className="md:col-span-4 lg:col-span-3">
            <dl className="space-y-7">
              {FACTS.map((f) => (
                <div key={f.label}>
                  <dt className="flex items-center gap-2.5 text-[15px] text-ink">
                    <span className="block h-2 w-2 rounded-[2px] bg-gold" aria-hidden="true" />
                    {f.label}
                  </dt>
                  <dd className="mt-1.5 pl-[18px] text-[16px] text-slate">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal className="md:col-span-8 lg:col-span-8 lg:col-start-5" delay={80}>
            <h2 className="display-lg text-ink text-balance">{ABOUT.heading}</h2>
            <div className="mt-8 max-w-2xl space-y-5">
              {ABOUT.paragraphs.map((p) => (
                <p key={p} className="body text-pretty">
                  {p}
                </p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- closing */}
      <section className="border-t border-line">
        <Reveal className="wrap py-24 text-center lg:py-32">
          <h2 className="display-lg mx-auto max-w-2xl text-ink text-balance">{CLOSING.heading}</h2>
          <p className="lede mx-auto mt-6 max-w-xl text-pretty">{CLOSING.text}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={CLOSING.primary.href} className="btn-primary">
              {CLOSING.primary.label}
            </Link>
            <Link href={CLOSING.secondary.href} className="btn-ghost">
              {CLOSING.secondary.label}
            </Link>
          </div>
          <p className="mt-8 text-[14px] text-mute">
            Questions first?{" "}
            <a href={`mailto:${SITE.email}`} className="text-slate underline decoration-line underline-offset-4 hover:text-ink">
              {SITE.email}
            </a>
          </p>
        </Reveal>
      </section>
    </>
  );
}
