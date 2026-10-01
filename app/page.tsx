import Image from "next/image";
import Link from "next/link";
import { HeroScreen } from "@/components/ui/Monitor";
import { QuestionRouter } from "@/components/QuestionRouter";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { Reveal } from "@/components/ui/Reveal";
import { Marketplace } from "@/components/Marketplace";
import { TrialBand, TrialHeroNote } from "@/components/Trial";
import { SessionsHeroNote } from "@/components/Sessions";
import { trialProducts } from "@/content/trial";
import { NT_ASSETS, NT_LINKS } from "@/content/ninjatrader";
import { ABOUT, CLOSING, DISCLOSURE, FACTS, HERO, PRINCIPLES, SITE } from "@/content/site";

/**
 * Home order: hero (the DS Complete sessions, rotating) → principles →
 * storefront (four series, every tile priced) → DS Complete → About ("Built
 * for the trader") → closing → NinjaTrader featured.
 *
 * WHY NINJATRADER IS LAST (Tom, 2026-09-26): the NinjaTrader bar already opens
 * every page, so a second NinjaTrader panel straight under the hero sent the
 * visitor's first scroll to someone else's product. The products now come
 * first. Nothing in NinjaTrader's kit asks for a position: the vendor email
 * suggests a menu entry and a landing page (both exist: the nav item and
 * /ninjatrader), and requires the disclosures in every page footer (they are).
 *
 * WHERE THE PRICING SITS (2026-09-20, flat single prices). The offer is stated
 * once in the hero as one computed line, priced on every tile and at the head
 * of every shelf, and summed once at the end as DS Complete — the only bundle,
 * the only dark band on the page, directly under the shelves it sums.
 *
 * The hero screen shows real charts with several DS products running on one
 * chart at once — which is the case for DS Complete made without a word.
 */
export default function HomePage() {
  const cut = HERO.title.lastIndexOf(" ");
  const titleHead = HERO.title.slice(0, cut);
  const titleTail = HERO.title.slice(cut + 1);
  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="hero-wash hem relative overflow-hidden">
        {/* pb below md+ is deliberately larger than the hem's 88px depth so the
            diagonal can never cut into the buttons. See .hem in globals.css. */}
        <div className="wrap grid items-center gap-12 pb-20 pt-10 sm:pt-14 md:pb-32 lg:grid-cols-12 lg:gap-8 lg:pt-12">
          <div className="lg:col-span-5">
            {/* Two hints of the house palette, and only two (2026-09-27): a
                bull-teal status light on the eyebrow, and the last word of
                the headline in fluorescent teal-to-violet (.fluoro). */}
            <p className="label rise flex items-center gap-2.5">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inset-0 rounded-full bg-[#19F2E6] opacity-60 motion-safe:animate-ping" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[#19F2E6]" />
              </span>
              {HERO.eyebrow}
            </p>
            <h1 className="display-xl rise mt-5 text-ink text-balance" style={{ animationDelay: "80ms" }}>
              {titleHead} <span className="fluoro">{titleTail}</span>
            </h1>
            <p className="lede rise mt-6 max-w-md text-pretty" style={{ animationDelay: "160ms" }}>
              {HERO.sub}
            </p>
            {/* NO PRICES IN THE HERO (Tom, 2026-09-21: "It might scare users
                away before they even get a chance to see the indicators").
                The charts come first; the numbers live on the shelves, the
                DS Complete band and the product pages. */}
            <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Link href={HERO.primary.href} className="btn-primary">
                {HERO.primary.label}
              </Link>
              <Link href={HERO.secondary.href} className="btn-ghost">
                {HERO.secondary.label}
              </Link>
            </div>
            {/* Said once, at the top of the site, before anyone reaches a price. */}
            <WaitlistNote className="rise mt-7 max-w-md" />
            {/* The 3-day free trial (2026-09-29): that it exists, whose it is,
                and its condition — one link down to the band. No price: the
                hero still carries none. Renders nothing when the trial is off. */}
            <TrialHeroNote className="rise mt-8" style={{ animationDelay: "320ms" }} />
            {/* The Session levels pair (2026-09-30, Tom: "one quiet 'New' line
                in the hero"): built like the trial note, one link down to its
                panel under DS Complete. No price. Off with NEW_NOTE.active. */}
            <SessionsHeroNote className="rise mt-6" style={{ animationDelay: "360ms" }} />
            {/* The chart reader (components/QuestionRouter.tsx): a question,
                the bare NT8 chart, the DS tool, and its read. From 1024px it
                fills the well under the buttons beside the tall monitor; on a
                phone and a tablet it follows the monitor instead (below), so
                the chart still comes first. Only the visible one runs. */}
            <QuestionRouter className="rise mt-9 hidden max-w-md lg:block" />
          </div>

          <div className="lg:col-span-7">
            <div className="rise-monitor lg:mt-4">
              <HeroScreen priority monitorClassName="lg:w-[128%]" />
            </div>
            {/* Neither video content nor chart images may appear without the
                risk AND hypothetical-performance disclosures alongside them
                (NinjaTrader vendor guidelines rev 2.11.2025, p.2). Since
                2026-09-23 this screen carries both — a screen recording of a
                market replay and five chart pictures — so it takes
                DISCLOSURE.screen, which names the recording and the simulated
                results, not DISCLOSURE.short, which only covered the software.
                The full verbatim texts stay in the footer of every page; this
                is the plain-English one directly under what it belongs to, in
                body-style text rather than fine print. */}
            <p className="mt-5 max-w-2xl text-[13.5px] leading-relaxed text-slate lg:mt-6">
              {DISCLOSURE.screen}
            </p>
            <QuestionRouter className="mt-10 max-w-md lg:hidden" />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- principles */}
      <section className="border-b border-line bg-mist">
        <div className="wrap grid gap-10 py-20 md:grid-cols-3 md:gap-8 lg:py-24">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 90} className="border-t border-line pt-6">
              {/* A candle tick over each principle — bull, bear, bull — the
                  house colours as punctuation, not decoration. */}
              <div className="-mt-[25px] mb-5 flex items-center gap-3">
                <span className={i % 2 ? "tick-bear" : "tick-bull"} aria-hidden="true" />
                <span className="font-mono text-[10.5px] tracking-[0.14em] text-mute">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="display-sm text-ink">{p.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-slate text-pretty">{p.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- 3-day free trial */}
      {/* The offer in full, directly before the lineup it belongs to (2026-09-29,
          components/Trial.tsx). A visitor meets "try it" before "buy it"; the
          lineup — DS Complete first — follows straight on. */}
      {trialProducts().length > 0 && (
        <div className="wrap pt-24 lg:pt-32">
          <TrialBand />
        </div>
      )}

      {/* ---------------------------------------------------------- storefront */}
      {/* Opens with DS Complete and threads down through every series
          (2026-09-28: it used to be a band after the last shelf). */}
      <Marketplace />

      {/* --------------------------------------------------------------- about */}
      <section>
        <div className="wrap grid gap-12 py-24 md:grid-cols-12 lg:py-32">
          <Reveal className="md:col-span-4 lg:col-span-3">
            <dl className="space-y-7">
              {FACTS.map((f) => (
                <div key={f.label}>
                  <dt className="flex items-center gap-2.5 text-[14px] text-ink">
                    <span className="block h-2 w-2 rounded-[2px] bg-gold" aria-hidden="true" />
                    {f.label}
                  </dt>
                  <dd className="mt-1.5 pl-[18px] text-[14.5px] text-slate">{f.value}</dd>
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
      <section className="glow-close border-t border-line">
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
          <p className="mt-8 text-[13px] text-mute">
            Questions first?{" "}
            <a href={`mailto:${SITE.email}`} className="text-slate underline decoration-line underline-offset-4 hover:text-ink">
              {SITE.email}
            </a>
          </p>
        </Reveal>
      </section>
      {/* ------------------------------------------- the platform, featured */}
      <section className="border-t border-line bg-wash">
        <div className="wrap grid items-center gap-12 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <Reveal className="lg:col-span-5">
            {/* Official wordmark, ≥18px clear space, NinjaTrader partner link. */}
            <a
              href={NT_LINKS.logo}
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
            <div className="spotlight flex items-end justify-center gap-2 py-4 sm:gap-4">
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

    </>
  );
}
