import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { NT_ASSETS, NT_FREE_ACCESS, NT_LINKS } from "@/content/ninjatrader";
import { DISCLOSURE } from "@/content/site";

export const metadata: Metadata = {
  title: "NinjaTrader",
  description:
    "NinjaTrader® is our #1 recommended trading platform, and Kinetick® our recommended market data feed. Get started for free.",
};

/**
 * The recommended-platform page. Section copy is VERBATIM from the NinjaTrader
 * vendor kit and must not be reworded — see content/ninjatrader.ts.
 */
export default function NinjaTraderPage() {
  const linkCls =
    "text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-gold";
  return (
    <>
      {/* ------------------------------------------------------- NinjaTrader */}
      <section className="hero-wash relative overflow-hidden">
        <div className="wrap grid items-center gap-12 pb-20 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="lg:col-span-7">
            <Reveal>
              {/* Official wordmark, ≥18px clear space on all sides, partner link. */}
              <a
                href={NT_LINKS.partner}
                target="_blank"
                rel="sponsored noopener"
                className="inline-block py-[18px] pr-[18px]"
                aria-label="NinjaTrader — visit ninjatrader.com"
              >
                <Image
                  src={NT_ASSETS.wordmark}
                  alt="NinjaTrader"
                  width={2376}
                  height={300}
                  priority
                  className="h-8 w-auto sm:h-9"
                />
              </a>
              <h1 className="display-lg mt-4 text-ink text-balance">
                Our Recommended Trading Platform
              </h1>
            </Reveal>

            <Reveal delay={80} className="mt-7 max-w-2xl space-y-5">
              <p className="body text-pretty">
                NinjaTrader® is our #1 recommended{" "}
                <a href={NT_LINKS.getStarted} target="_blank" rel="sponsored noopener" className={linkCls}>
                  trading software platform
                </a>{" "}
                preferred by traders worldwide including our clients.
              </p>
              <p className="body">
                <a href={NT_LINKS.home} target="_blank" rel="sponsored noopener" className={linkCls}>
                  Download NinjaTrader
                </a>{" "}
                &amp; receive immediate FREE access to:
              </p>
              <ul className="space-y-3 pt-1">
                {NT_FREE_ACCESS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[16.5px] text-slate">
                    <span className="block h-2 w-2 shrink-0 rounded-[2px] bg-gold" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="body text-pretty">
                NinjaTrader&rsquo;s award-winning trading platform is consistently voted an industry
                leader by the trading community. Featuring 1000s of Apps &amp; Add-Ons for unlimited
                customization, NinjaTrader is used by over 1.9 million traders for advanced market
                analysis, professional charting and fast order execution.
              </p>
              <p className="body text-pretty">
                For new traders, start preparing for the live markets with a free{" "}
                <a href={NT_LINKS.simulator} target="_blank" rel="sponsored noopener" className={linkCls}>
                  trading simulator
                </a>{" "}
                featuring real-time market data.
              </p>
              <div className="pt-4">
                <a href={NT_LINKS.partner} target="_blank" rel="sponsored noopener" className="btn-primary">
                  Get Started for FREE!
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={160} className="lg:col-span-6">
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

      {/* ---------------------------------------------------------- Kinetick */}
      <section className="border-y border-line bg-mist">
        <div className="wrap grid gap-10 py-20 lg:grid-cols-12 lg:gap-10 lg:py-24">
          <Reveal className="lg:col-span-4">
            {/* Official Kinetick logo, ≥18px clear space, vendor-kit link. */}
            <a
              href={NT_LINKS.kinetick}
              target="_blank"
              rel="sponsored noopener"
              className="inline-block p-[18px] pl-0"
              aria-label="Kinetick — fast market data, unfiltered"
            >
              <Image
                src={NT_ASSETS.kinetick}
                alt="Kinetick — recommended market data service"
                width={400}
                height={100}
                className="h-16 w-auto"
              />
            </a>
          </Reveal>
          <Reveal delay={80} className="lg:col-span-8">
            <h2 className="display-md text-ink text-balance">Our Recommended Market Data Feed</h2>
            <div className="mt-6 max-w-2xl space-y-5">
              <p className="body text-pretty">
                Kinetick® delivers reliable, fast and cost-effective{" "}
                <a href={NT_LINKS.kinetick} target="_blank" rel="noopener" className={linkCls}>
                  market data
                </a>{" "}
                to help level the playing field for active traders. Take advantage of unfiltered,
                real time quotes for stocks, futures and forex that exceed the expectations of the
                world&rsquo;s most demanding traders, like us!
              </p>
              <p className="body text-pretty">
                Get started with FREE end-of-day{" "}
                <a href={NT_LINKS.kinetickHome} target="_blank" rel="noopener" className={linkCls}>
                  historical market data
                </a>{" "}
                directly through the NinjaTrader platform and learn how you can significantly reduce
                CME Group Globex exchange fees on real-time market data with Kinetick.
              </p>
              <div className="pt-3">
                <a href={NT_LINKS.kinetick} target="_blank" rel="sponsored noopener" className="btn-ghost">
                  Get Started with Free EOD Data
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- attribution */}
      <section className="wrap py-14 lg:py-16">
        <Reveal>
          <p className="max-w-4xl text-[13.5px] leading-relaxed text-slate">{DISCLOSURE.trademark}</p>
        </Reveal>
      </section>
    </>
  );
}
