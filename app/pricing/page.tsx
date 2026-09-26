import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { CompleteBand } from "@/components/CompleteBand";
import { BuyButton } from "@/components/BuyButton";
import { COMPLETE, PRICES, TERMS, discountPct, money, seriesPrice } from "@/content/pricing";
import { COVER_RATIO, SHELVES, boxartFor } from "@/content/release";
import { PRODUCTS } from "@/content/products";
import { StillMonitor } from "@/components/ui/StillMonitor";
import { DISCLOSURE, PRODUCTS_SCREEN } from "@/content/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Every DS Universe product for NinjaTrader 8 is sold on its own, for a single payment, and the chart essentials are free. DS Complete is every product for half of what the paid ones cost apart.",
};

/**
 * The price page (2026-09-20, flat single prices).
 *
 * Its job is to put every number in one place a visitor can scan in ten
 * seconds, and then sum it. So: the terms, one list of every product and its
 * price grouped the way the shelves are, and DS Complete underneath it — the
 * only bundle, measured against the list directly above it.
 *
 * Deliberately absent, all for the same reason — they would be claims about a
 * price list we cannot back: no countdown, no "limited spots", no "most popular"
 * badge (nothing has sold yet), and no struck-through number that is not the
 * real list price Whop shows. NinjaTrader's vendor guidelines forbid
 * superlatives anyway; the arithmetic is the argument.
 */
export default function PricingPage() {
  // The indicator price, if every discounted product shares one — computed, so
  // the headline cannot quote a number the list below does not show.
  const nows = [
    ...new Set(
      PRODUCTS.filter((p) => p.series === "flagship" || p.series === "pro").flatMap((p) => {
        const pr = PRICES[p.slug];
        return pr && !pr.free ? [pr.now] : [];
      }),
    ),
  ];
  const lead = nows.length === 1 ? nows[0] : null;

  return (
    <>
      {/* --------------------------------------------------------- position */}
      <section className="hero-wash hem">
        <div className="wrap pb-28 pt-20 lg:pb-36 lg:pt-28">
          {/* Words left, the chart in the monitor right — the same header as
              /products (Tom, 2026-09-26: the right half sat empty). "How buying
              works" runs full width under both. */}
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-6">
              <p className="label">Pricing</p>
              <h1 className="display-xl mt-5 text-ink text-balance">Bought once. Never rented.</h1>
              <p className="lede mt-6 max-w-xl text-pretty">
                {lead
                  ? `Every paid indicator is ${money(lead)} — a single payment, with every later version included. `
                  : "Every product is a single payment, with every later version included. "}
                The chart essentials are free. And {COMPLETE.name} is all of it, for half of what the
                paid products cost bought one at a time.
              </p>
            </Reveal>
            <Reveal className="lg:col-span-6" delay={120}>
              <StillMonitor
                src={PRODUCTS_SCREEN.src}
                w={PRODUCTS_SCREEN.w}
                h={PRODUCTS_SCREEN.h}
                blur={PRODUCTS_SCREEN.blur}
                alt={PRODUCTS_SCREEN.alt}
                title={PRODUCTS_SCREEN.title}
                sub={PRODUCTS_SCREEN.sub}
                priority
              />
              <p className="mt-5 text-[14.5px] leading-relaxed text-slate text-pretty">{PRODUCTS_SCREEN.caption}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-mute text-pretty">{DISCLOSURE.chart}</p>
            </Reveal>
          </div>
          <Reveal>
            <WaitlistNote tone="band" className="mt-12" />
          </Reveal>

          <div className="mt-14 grid gap-10 border-t border-line pt-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {TERMS.map((t, i) => (
              <Reveal key={t.title} delay={i * 80}>
                <h2 className="display-sm text-ink">{t.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-slate text-pretty">{t.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ every price */}
      <section className="wrap pb-24 pt-8 lg:pb-32" id="prices">
        <Reveal className="max-w-2xl">
          <h2 className="display-lg text-ink text-balance">Every price, in one place</h2>
          <p className="lede mt-5 text-pretty">
            The same numbers as the shelves and the Whop checkout — one list, grouped the way
            the lineup is.
          </p>
        </Reveal>

        <div className="mt-14 space-y-16">
          {SHELVES.map((s) => {
            const sp = seriesPrice(s.info.key);
            return (
              <Reveal key={s.info.key}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line-strong pb-4">
                  <div>
                    <h3 className="display-sm text-ink">{s.info.name}</h3>
                    <p className="mt-1.5 text-[14.5px] text-slate">{s.info.tagline}</p>
                  </div>
                  {sp && (
                    <p className="text-[14px] tabular-nums text-slate">
                      {sp.free ? "Free, permanently" : `${money(sp.now)}${s.products.length > 1 ? " each" : ""} · one payment`}
                    </p>
                  )}
                </div>
                <ul>
                  {s.products.map((p) => {
                    const pr = PRICES[p.slug];
                    const off = discountPct(pr);
                    return (
                      <li key={p.slug} className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-line py-4 sm:grid-cols-[52px_minmax(0,1fr)_auto_auto] sm:gap-x-6">
                        <Link href={`/products/${p.slug}`} className="spotlight relative block w-[52px]" style={{ aspectRatio: String(COVER_RATIO) }} tabIndex={-1} aria-hidden="true">
                          <Image src={boxartFor(p.slug)} alt="" fill sizes="52px" className="object-contain" />
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/products/${p.slug}`} className="font-display text-[17px] text-ink transition-colors hover:text-gold-deep">
                            {p.name}
                          </Link>
                          <p className="mt-0.5 truncate text-[13.5px] text-slate">{p.category}</p>
                        </div>
                        <div className="col-start-2 flex items-baseline gap-2.5 tabular-nums sm:col-start-auto sm:justify-self-end">
                          {pr.free ? (
                            <span className="text-[16px] text-gold-deep">Free</span>
                          ) : (
                            <>
                              {off > 0 && (
                                <s className="text-[14px] text-mute decoration-mute/70" aria-label={`list price ${money(pr.list)}`}>
                                  {money(pr.list)}
                                </s>
                              )}
                              <span className="text-[17px] text-ink">{money(pr.now)}</span>
                            </>
                          )}
                        </div>
                        <div className="col-start-2 sm:col-start-auto">
                          <BuyButton slug={p.slug} variant="ghost" className="!h-10 !px-4 !text-[14px]" />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </section>

      <CompleteBand />
    </>
  );
}
