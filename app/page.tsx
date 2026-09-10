import Image from "next/image";
import Link from "next/link";
import { Monitor } from "@/components/ui/Monitor";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { cta } from "@/content/launch";
import { Reveal } from "@/components/ui/Reveal";
import { Marketplace } from "@/components/Marketplace";
import { Bundles } from "@/components/Bundles";
import { NT_ASSETS, NT_LINKS } from "@/content/ninjatrader";
import { ABOUT, CLOSING, DISCLOSURE, FACTS, HERO, PRINCIPLES, SITE } from "@/content/site";

/**
 * Home order: hero → NinjaTrader featured → principles → storefront →
 * bundles → About ("Built for the trader") → closing.
 */
export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="hero-wash hem relative overflow-hidden">
        {/* pb below md+ is deliberately larger than the hem's 88px depth so the
            diagonal can never cut into the buttons. See .hem in globals.css. */}
        <div className="wrap grid items-center gap-12 pb-20 pt-10 sm:pt-16 md:pb-32 lg:grid-cols-12 lg:gap-8 lg:pt-16">
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
                {cta(HERO.secondary.label, "See what's coming")}
              </Link>
            </div>
            {/* Said once, at the top of the site, before anyone reaches a price. */}
            <WaitlistNote className="rise mt-7 max-w-md" />
          </div>

          <div className="lg:col-span-7">
            <Monitor priority className="rise-monitor lg:mt-4 lg:w-[128%]" />
            {/* Chart images may not appear without the risk disclosure
                alongside them (NinjaTrader vendor guidelines, p.2). The full
                risk and hypothetical-performance disclosures are in the footer
                of every page; this puts the plain-English one directly under
                the charts it belongs to, in body-style text rather than fine
                print. */}
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-slate lg:mt-8">
              {DISCLOSURE.short}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- the platform, featured */}
      <section className="border-b border-line bg-wash">
        <div className="wrap grid items-center gap-12 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <Reveal className="lg:col-span-5">
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
          {/* The devices sit in the LEFT column at desktop so the desktop
              render's angle points into the copy rather than off the page. Kept
              last in the DOM, so the reading order and the mobile stack still
              lead with the words. */}
          <Reveal delay={120} className="lg:col-span-7 lg:order-first">
            {/* No panel and no backdrop: the desktop render ships transparent
                and the phone photograph's flat grey ground was keyed out, so
                both devices sit directly on the section. Neither device itself
                is cropped, recoloured, distorted or mirrored — only the empty
                backdrop behind the phones was removed.

                items-end puts them on one floor line rather than centring two
                objects of different heights against each other. */}
            <div className="flex items-end justify-center gap-2 sm:gap-4">
              <Image
                src={NT_ASSETS.desktop}
                alt="The NinjaTrader platform on a desktop"
                width={510}
                height={531}
                sizes="(min-width: 1024px) 340px, 55vw"
                className="w-[62%] max-w-[340px]"
              />
              <Image
                src={NT_ASSETS.mobile}
                alt="The NinjaTrader mobile app running on two phones"
                width={1500}
                height={1216}
                sizes="(min-width: 1024px) 215px, 34vw"
                className="mb-[6%] w-[38%] max-w-[215px]"
              />
            </div>
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

      {/* ------------------------------------------------------------ bundles */}
      {/* Straight after the shelves — the moment the visitor has just seen
          everything priced one at a time (Tom, 2026-09-10). */}
      <Bundles />

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
              {cta(CLOSING.primary.label, "See what's coming")}
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
