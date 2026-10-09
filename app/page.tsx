import Image from "next/image";
import Link from "next/link";
import { HeroScreen } from "@/components/ui/Monitor";
import { QuestionRouter } from "@/components/QuestionRouter";
import { ChartReader } from "@/components/ChartReader";
import { Defer } from "@/components/ui/Defer";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { Reveal } from "@/components/ui/Reveal";
import { Marketplace } from "@/components/Marketplace";
import { TrialBand, TrialHeroNote } from "@/components/Trial";
import { VaultBand, VaultHeroNote } from "@/components/Vault";
import { VaultDial } from "@/components/VaultDial";
import { trialProducts } from "@/content/trial";
import { NT_ASSETS, NT_LINKS } from "@/content/ninjatrader";
import { ABOUT, CLOSING, DISCLOSURE, FACTS, HERO, PRINCIPLES, SITE } from "@/content/site";

/**
 * Home order: hero (charts with several DS products on them, rotating) →
 * principles → the trial → storefront (DS Complete, then the paid series,
 * every tile priced) → the Free Vault band → About ("Built for the trader")
 * → closing (the Free Vault) → NinjaTrader featured.
 *
 * PAID AND FREE ARE KEPT APART (Tom, 2026-10-05). The free shelf left the
 * lineup; ONE Free Vault band takes its place, after the last paid shelf —
 * what the vault is, its boxes as a contact strip, and the way in. The hero
 * carries one quiet line about it and the closing ask points there, so the
 * vault is found from the top, the middle and the end of the page without a
 * single free tile standing among the paid ones.
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
        <div className="wrap grid items-center gap-12 pb-20 pt-10 sm:pt-14 md:pb-32 lg:grid-cols-12 lg:gap-8 lg:pt-12 xl:gap-y-12 2xl:items-start 2xl:gap-12 2xl:gap-y-14">
          <div className="lg:col-span-5 xl:row-start-1 2xl:col-span-4 2xl:pt-12">
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
            {/* The Free Vault (2026-10-05): built like the trial note, one
                link to its page. No price — the hero carries none. */}
            <VaultHeroNote className="rise mt-6" style={{ animationDelay: "360ms" }} />
            {/* The chart reader (components/QuestionRouter.tsx): a question,
                the bare NT8 chart, the DS tool, and its read. From 1024px to
                1279px it fills the well under the buttons beside the tall
                monitor; on a phone and a tablet it follows the monitor instead
                (below), so the chart still comes first. From 1280px the wide
                reader under the hero takes over. Only the visible one runs. */}
            <Defer query="(min-width: 1024px) and (max-width: 1279.98px)" className="mt-9 hidden h-[347px] max-w-md lg:block xl:hidden">
              <QuestionRouter className="rise mt-9 hidden max-w-md lg:block xl:hidden" />
            </Defer>
          </div>

          {/* UNDER THE MONITOR (2026-10-09, Tom: "move the information of the
              monitor to the right neatly, then extend our demo chart … we have
              the room now"). From 1280px this column, the screen's root and
              its info block are `display: contents`, so the monitor and its
              information become cells of this grid: row 1 is the copy and the
              monitor; row 2 is the wide chart reader across eight columns and,
              to its right under the monitor, the monitor's own information —
              the rotation listed whole, then the screen's disclosure. Below
              1280px nothing changes: the information stays under the monitor. */}
          <div className="lg:col-span-7 xl:contents 2xl:col-span-8">
            {/* WIDE BODY (2026-10-09): from 1536px the monitor takes eight of
                twelve columns and stands whole inside the canvas — bigger than
                before, and no longer cut off by the window's edge. Below that it
                keeps its old 128% reach past the column. */}
            <HeroScreen
              priority
              rootClassName="xl:contents"
              monitorClassName="rise-monitor lg:mt-4 lg:w-[128%] xl:col-span-7 xl:col-start-6 xl:row-start-1 2xl:col-span-8 2xl:col-start-5 2xl:w-full"
              infoClassName="xl:col-span-4 xl:col-start-9 xl:row-start-2 xl:self-start"
              infoFooter={
                /* Neither video content nor chart images may appear without the
                   risk AND hypothetical-performance disclosures alongside them
                   (NinjaTrader vendor guidelines rev 2.11.2025, p.2). Since
                   2026-09-23 this screen carries both — a screen recording of a
                   market replay and five chart pictures — so it takes
                   DISCLOSURE.screen, which names the recording and the simulated
                   results, not DISCLOSURE.short, which only covered the software.
                   The full verbatim texts stay in the footer of every page; this
                   is the plain-English one directly under what it belongs to, in
                   body-style text rather than fine print. */
                <p className="mt-5 max-w-2xl text-[length:calc(13.5px*var(--type))] leading-relaxed text-slate lg:mt-6 xl:mt-6 xl:text-[length:calc(12.5px*var(--type))] xl:text-mute">
                  {DISCLOSURE.screen}
                </p>
              }
            />
            <Defer query="(max-width: 1023.98px)" near className="mt-10 h-[340px] max-w-md sm:h-[378px] lg:hidden">
              <QuestionRouter className="mt-10 max-w-md lg:hidden" />
            </Defer>
          </div>

          {/* The wide chart reader (components/ChartReader.tsx), from 1280px. */}
          <Defer
            query="(min-width: 1280px)"
            className="hidden xl:col-span-8 xl:col-start-1 xl:row-start-2 xl:block xl:h-[792px] xl:self-start 2xl:h-[820px] min-[1760px]:h-[612px]"
          >
            <ChartReader className="hidden xl:col-span-8 xl:col-start-1 xl:row-start-2 xl:block xl:self-start" />
          </Defer>
        </div>
      </section>

      {/* ---------------------------------------------------------- principles */}
      {/* WIDE BODY (2026-10-09): the three principles get a lead — a heading of
          their own in the first quarter — and a step up in size, so the band
          reads as a statement rather than three small notes in a wide strip. */}
      <section className="border-b border-line bg-mist">
        <div className="wrap grid gap-10 py-20 md:grid-cols-3 md:gap-8 lg:grid-cols-12 lg:gap-10 lg:py-24 2xl:py-28">
          <Reveal className="md:col-span-3 lg:col-span-3">
            <p className="label">The standard</p>
            <h2 className="display-md mt-4 max-w-[16ch] text-ink text-balance">Three rules every DS tool is built to.</h2>
          </Reveal>
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 90} className="border-t border-line pt-6 lg:col-span-3">
              {/* A candle tick over each principle — bull, bear, bull — the
                  house colours as punctuation, not decoration. */}
              <div className="-mt-[25px] mb-5 flex items-center gap-3">
                <span className={i % 2 ? "tick-bear" : "tick-bull"} aria-hidden="true" />
                <span className="font-mono text-[length:calc(10.5px*var(--type))] tracking-[0.14em] text-mute">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-display text-[length:calc(17px*var(--type))] font-[500] tracking-[-0.015em] text-ink 2xl:text-[length:calc(19px*var(--type))]">{p.title}</h3>
              <p className="mt-3 max-w-[34ch] text-[length:calc(14.5px*var(--type))] leading-relaxed text-slate text-pretty">{p.text}</p>
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
      <Marketplace className="wrap pb-20 pt-24 lg:pb-24 lg:pt-32" />

      {/* ------------------------------------------------------ the Free Vault */}
      {/* Where the free shelf used to close the lineup (2026-10-05): one band,
          in the vault's own voice, never a row of free tiles among paid ones. */}
      <VaultBand />

      {/* --------------------------------------------------------------- about */}
      <section>
        <div className="wrap grid gap-12 py-24 md:grid-cols-12 lg:py-32">
          <Reveal className="md:col-span-4 lg:col-span-3">
            <dl className="space-y-7">
              {FACTS.map((f) => (
                <div key={f.label}>
                  <dt className="flex items-center gap-2.5 text-[length:calc(14px*var(--type))] text-ink">
                    <span className="block h-2 w-2 rounded-[2px] bg-gold" aria-hidden="true" />
                    {f.label}
                  </dt>
                  <dd className="mt-1.5 pl-[18px] text-[length:calc(14.5px*var(--type))] text-slate">{f.value}</dd>
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
      {/* WIDE BODY (2026-10-09): the closing stands beside the vault's own dial
          (components/VaultDial.tsx) from 1024px — the invitation and the door
          it opens — instead of a narrow centred block in a wide band. */}
      <section className="glow-close border-t border-line">
        <div className="wrap grid items-center gap-12 py-24 lg:grid-cols-12 lg:gap-10 lg:py-32">
          <Reveal className="text-center lg:col-span-7 lg:text-left">
            <h2 className="display-lg mx-auto max-w-2xl text-ink text-balance lg:mx-0">{CLOSING.heading}</h2>
            <p className="lede mx-auto mt-6 max-w-xl text-pretty lg:mx-0">{CLOSING.text}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href={CLOSING.primary.href} className="btn-primary">
                {CLOSING.primary.label}
              </Link>
              <Link href={CLOSING.secondary.href} className="btn-ghost">
                {CLOSING.secondary.label}
              </Link>
            </div>
            <p className="mt-8 text-[length:calc(13px*var(--type))] text-mute">
              Questions first?{" "}
              <a href={`mailto:${SITE.email}`} className="text-slate underline decoration-line underline-offset-4 hover:text-ink">
                {SITE.email}
              </a>
            </p>
          </Reveal>
          <Reveal delay={120} className="hidden lg:col-span-5 lg:block">
            <Link href={CLOSING.primary.href} aria-label={CLOSING.primary.label} className="mx-auto block w-full max-w-[400px] text-vault opacity-90 transition-opacity duration-500 hover:opacity-100 2xl:max-w-[460px]">
              <VaultDial className="block w-full" />
            </Link>
          </Reveal>
        </div>
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
              <Image src={NT_ASSETS.wordmark} alt="NinjaTrader" width={2376} height={300} sizes="260px" className="h-8 w-auto" />
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
