import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Arrow";
import { TestFirst } from "@/components/TestFirst";
import { TrialGrid, TrialLabel, TrialTerms } from "@/components/Trial";
import { FAQ } from "@/content/faq";
import { DISCLOSURE } from "@/content/site";
import { TRIAL, trialNames, trialProducts } from "@/content/trial";

export const metadata: Metadata = {
  title: "3-day free trial",
  // Names from the data, never typed — the trial list can change.
  description: `Run ${trialNames()} on your own NinjaTrader 8 charts for three days, free — the full product, no card, nothing charged when it ends.`,
  alternates: { canonical: "/trial" },
};

/**
 * /trial — THE 3-DAY FREE TRIAL ON ONE PAGE (2026-09-29).
 *
 * WHY A PAGE OF ITS OWN. The home band and the product pages carry the trial
 * where visitors already are; this is the address to hand to people who are
 * not on the site yet — a NinjaTrader Ecosystem listing, a post, a reply.
 * dsuniverse.net/trial opens straight onto the offer, its terms, the three
 * products and how it works, with nothing to scroll past. It is not in the
 * menu (the menu stays as it was); home, the store, the FAQ and the sitemap
 * link it.
 *
 * Every word comes from content/trial.ts and every link from content/whop.ts.
 * With the trial off the page 404s, like an unreleased product.
 */
export default function TrialPage() {
  const ps = trialProducts();
  if (!ps.length) notFound();

  // The questions a trial-taker asks next, in the store FAQ's own words. The
  // trial's own question is left out: this page is its answer.
  const faqs = FAQ.filter((f) =>
    ["What do DS Universe products run on?", "Is this a subscription?", "Can I use it on more than one computer?", "Do these place trades for me?"].includes(f.q),
  );

  return (
    <>
      {/* -------------------------------------------------------------- head */}
      <section className="hero-wash">
        <div className="wrap pb-14 pt-12 sm:pt-16 lg:pb-16 lg:pt-20">
          <Reveal>
            <Link href="/products" className="group inline-flex items-center gap-2 text-[13px] text-slate hover:text-ink">
              <Arrow className="rotate-180 group-hover:-translate-x-0.5" />
              All products
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
            <Reveal className="lg:col-span-7">
              <TrialLabel />
              <h1 className="display-xl mt-5 text-ink text-balance">Three days on your own charts.</h1>
              <p className="lede mt-6 max-w-xl text-pretty">
                {trialNames()} each come with a {TRIAL.label}: the full product, not a demo, on your instrument
                and your timeframe — and no card asked for.
              </p>
            </Reveal>
            <Reveal className="lg:col-span-5" delay={100}>
              <TrialTerms />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ products and steps */}
      <section className="wrap pb-20 lg:pb-28" aria-label="The trial products">
        <Reveal className="trial-panel relative overflow-hidden rounded-xl border p-6 sm:p-8 lg:p-10">
          <TrialGrid products={ps} />
        </Reveal>
      </section>

      {/* ------------------------------------------ how to spend three days */}
      {/* The product pages' own "Test it first" section, product-neutral: the
          three days are best spent on Market Replay and the simulator. */}
      <TestFirst productName="it" />

      {/* --------------------------------------------------------- questions */}
      <section className="border-t border-line">
        <div className="wrap grid gap-12 py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
          <Reveal className="lg:col-span-5">
            <p className="label">Before you start</p>
            <h2 className="display-md mt-4 text-ink text-balance">What people ask first.</h2>
            <p className="mt-6 text-[14px] leading-relaxed text-slate text-pretty">
              Not ready to try a paid one? The chart essentials are free, permanently — no trial clock at all.
            </p>
            <Link href="/products#essentials" className="group mt-4 inline-flex items-center gap-2 text-[14px] text-ink">
              See the free essentials
              <Arrow />
            </Link>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7" delay={80}>
            <ul className="border-b border-line">
              {faqs.map((f) => (
                <li key={f.q} className="border-t border-line">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[15px] leading-snug text-ink transition-colors hover:text-gold-deep [&::-webkit-details-marker]:hidden">
                      <span className="text-pretty">{f.q}</span>
                      <svg
                        viewBox="0 0 16 16"
                        className="mt-1 h-4 w-4 shrink-0 text-mute transition-transform duration-300 ease-silk group-open:rotate-45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M8 2.5v11M2.5 8h11" />
                      </svg>
                    </summary>
                    <p className="max-w-2xl pb-6 pr-10 text-[14px] leading-relaxed text-slate text-pretty">{f.a}</p>
                  </details>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-xl text-[13px] leading-relaxed text-mute">{DISCLOSURE.short}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
