import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { cta } from "@/content/launch";
import { LIVE_TIERS, TERMS, money, perUnit, savedPct } from "@/content/pricing";
import { DISCLOSURE, SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One payment, no subscription, updates included. Half the DS Universe lineup is free; the rest is priced well below what the NinjaTrader indicator market charges.",
};

/**
 * The price page. Its job is not to list numbers — the product pages already
 * do that. Its job is to answer "where do these people stand on price", which
 * is a question about the MODEL, not the digits: bought once, never rented,
 * half of it free. The numbers are the evidence, not the argument.
 *
 * Deliberately no countdown, no "limited spots", no second struck-through
 * anchor. The prices are low enough to state plainly, and NinjaTrader's vendor
 * guidelines forbid superlatives in any case.
 */
export default function PricingPage() {
  return (
    <>
      {/* --------------------------------------------------------- position */}
      <section className="hero-wash hem">
        <div className="wrap py-20 lg:py-28">
          <Reveal className="max-w-3xl">
            <p className="label">Pricing</p>
            <h1 className="display-xl mt-5 text-ink text-balance">
              Bought once. Never rented.
            </h1>
            <p className="lede mt-6 max-w-2xl text-pretty">
              Half of what we make is free and always will be. The rest is priced
              the way we would want to be charged: a single payment, every later
              version included, and no clock running against you.
            </p>
            <WaitlistNote tone="band" className="mt-8" />
          </Reveal>

          <div className="mt-14 grid gap-10 border-t border-line pt-10 md:grid-cols-3 md:gap-8">
            {TERMS.map((t, i) => (
              <Reveal key={t.title} delay={i * 90}>
                <h2 className="display-sm text-ink">{t.title}</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-slate text-pretty">{t.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- bundles */}
      <section className="wrap py-20 lg:py-28">
        <Reveal className="max-w-2xl">
          <h2 className="display-lg text-ink text-balance">Buy it together, pay less</h2>
          <p className="lede mt-5 text-pretty">
            Every product is sold on its own from its own page. These are simply
            the cheaper way to take more than one.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {LIVE_TIERS.map((t, i) => (
            <Reveal key={t.key} delay={i * 90}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-8 ${
                  t.feature ? "border-gold/40 bg-gold-tint shadow-lift" : "border-line bg-white"
                }`}
              >
                <h3 className="display-sm text-ink">{t.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate text-pretty">{t.blurb}</p>

                <div className="mt-7 flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-[40px] leading-none tabular-nums text-ink">
                    {money(t.now)}
                  </span>
                  <span className="text-[17px] tabular-nums text-mute line-through">
                    {money(t.list)}
                  </span>
                </div>
                <p className="mt-2 text-[13.5px] text-slate">
                  {savedPct(t)}% off
                  {perUnit(t) !== null && <> · works out at {money(perUnit(t)!)} each</>}
                </p>

                <ul className="mt-7 space-y-2.5 border-t border-line pt-6">
                  {t.includes.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-[15px] text-ink">
                      <span className="mt-[7px] block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                      {line}
                    </li>
                  ))}
                </ul>
                {t.bonus && <p className="mt-4 text-[14px] text-gold-deep">{t.bonus}</p>}

                <div className="mt-auto pt-8">
                  {t.checkout ? (
                    <a href={t.checkout} target="_blank" rel="noopener" className="btn-primary w-full justify-center">
                      {cta(`Get ${t.name.toLowerCase()}`)}
                    </a>
                  ) : (
                    <span className="inline-flex h-12 w-full items-center justify-center rounded-md border border-dashed border-line-strong px-5 text-[15px] text-slate">
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- where free */}
      <section className="border-y border-line bg-mist">
        <div className="wrap grid gap-10 py-20 md:grid-cols-12 lg:py-24">
          <Reveal className="md:col-span-5">
            <h2 className="display-lg text-ink text-balance">And the free half</h2>
          </Reveal>
          <Reveal className="md:col-span-7" delay={80}>
            <p className="body text-pretty">
              A good part of the lineup is free — not a trial, not a stripped
              version, and not a queue for your email address. They are the same
              builds we use ourselves. If they are all you ever take from us,
              that is a fine outcome.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                See the lineup
              </Link>
              <Link href="/contact" className="btn-ghost">
                Ask a question
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- terms */}
      <section className="wrap py-16 lg:py-20">
        <Reveal className="max-w-3xl space-y-4">
          <h2 className="display-md text-ink">The small print, in full</h2>
          <p className="text-[15px] leading-relaxed text-slate text-pretty">
            Prices are in US dollars and are charged by Whop, which handles the
            payment and sends the download. A licence covers your own use of the
            product you bought, including later versions of it — it does not
            cover products we release afterwards. Founders pricing is our launch
            price; it will not be the price forever.
          </p>
          <p className="text-[15px] leading-relaxed text-slate text-pretty">{DISCLOSURE.short}</p>
          <p className="pt-2 text-[14px] text-slate">
            Anything unclear, ask before you buy —{" "}
            <a href={`mailto:${SITE.email}`} className="text-ink underline decoration-line underline-offset-4 hover:decoration-gold">
              {SITE.email}
            </a>
          </p>
        </Reveal>
      </section>
    </>
  );
}
