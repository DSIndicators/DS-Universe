import type { Metadata } from "next";
import { WideFigure } from "@/components/Wide";
import { SectionBar } from "@/components/SectionBar";
import { WIDE } from "@/content/capabilities";
import { AFTER_CHECKOUT, AFTER_CHECKOUT_FREE } from "@/content/launch";
import { NT_ASSETS, NT_FREE_ACCESS, NT_LINKS } from "@/content/ninjatrader";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "NinjaTrader",
  description:
    "NinjaTrader® is our #1 recommended trading platform, and Kinetick® our recommended market data feed. Get started for free.",
};

/**
 * The recommended-platform page, in the white wide-body style.
 * The NinjaTrader and Kinetick copy is VERBATIM from the NinjaTrader vendor kit
 * (content/ninjatrader.ts explains) and must not be reworded; the logos keep
 * at least 18px of clear space and link where NinjaTrader asked. The middle
 * band is ours: how a DS product gets from checkout onto a NinjaTrader chart,
 * in content/launch.ts's own words.
 */
const ext = { target: "_blank", rel: "sponsored noopener" } as const;

export default function NinjaTraderPage() {
  return (
    <>
      {/* ------------------------------------------------ NinjaTrader */}
      <section className="wb nt-hero" aria-labelledby="nt-title" data-section="">
        <div className="nt-grid">
          <div className="nt-copy">
            <a href={NT_LINKS.logo} {...ext} className="nt-mark" aria-label="NinjaTrader, visit ninjatrader.com">
              <img src={NT_ASSETS.wordmark} alt="NinjaTrader" width={2376} height={300} />
            </a>
            <h1 id="nt-title" className="d2 nt-h1">
              Our Recommended Trading Platform
            </h1>
            <div className="nt-body">
              <p className="lead">
                NinjaTrader® is our #1 recommended{" "}
                <a className="lnk" href={NT_LINKS.getStarted} {...ext}>
                  trading software platform
                </a>{" "}
                preferred by traders worldwide including our clients.
              </p>
              <p className="body">
                <a className="lnk" href={NT_LINKS.home} {...ext}>
                  Download NinjaTrader
                </a>{" "}
                &amp; receive immediate FREE access to:
              </p>
              <ul className="points points-tight">
                {NT_FREE_ACCESS.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="body">
                NinjaTrader&rsquo;s award-winning trading platform is consistently voted an industry leader by the trading
                community. Featuring 1000s of Apps &amp; Add-Ons for unlimited customization, NinjaTrader is used by over 1.9
                million traders for advanced market analysis, professional charting and fast order execution.
              </p>
              <p className="body">
                For new traders, start preparing for the live markets with a free{" "}
                <a className="lnk" href={NT_LINKS.simulator} {...ext}>
                  trading simulator
                </a>{" "}
                featuring real-time market data.
              </p>
              <p style={{ marginTop: 34 }}>
                <a className="btn" href={NT_LINKS.partner} {...ext}>
                  Get Started for FREE!
                </a>
              </p>
            </div>
          </div>
          {/* NinjaTrader's own renders, transparent, never wider than they were made. */}
          <div className="nt-devices">
            <img src={NT_ASSETS.desktop} alt="The NinjaTrader platform on a desktop" width={510} height={531} className="nt-desk" />
            <img src={NT_ASSETS.mobile} alt="The NinjaTrader mobile app running on two phones" width={1500} height={1216} className="nt-phone" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ DS inside NinjaTrader */}
      <WideFigure pic={WIDE.sessions} />
      <SectionBar
        n="01"
        title="From checkout to your chart."
        sub={`Every DS Universe product is written in NinjaScript for ${SITE.platform} and imports like any other add-on, in version ${SITE.minBuild} or newer.`}
      />
      <section className="wb sbar-after" aria-label="From checkout to your chart">
        <ol className="steps" style={{ marginTop: 0 }}>
          {AFTER_CHECKOUT.steps.map((s, i) => (
            <li key={s.title}>
              <span className="step-n num">{i + 1}</span>
              <h3 className="d3">{s.title}</h3>
              <p className="body">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="small measure" style={{ marginTop: 28 }}>
          {AFTER_CHECKOUT_FREE.short}
        </p>
      </section>

      {/* ------------------------------------------------ Kinetick */}
      <SectionBar n="02" title="Our Recommended Market Data Feed" />
      <section className="complete kt-band" aria-label="Kinetick">
        <div className="wb complete-grid">
          <div className="l kt-l">
            <a href={NT_LINKS.kinetick} {...ext} className="kt-mark" aria-label="Kinetick, fast market data, unfiltered">
              <img src={NT_ASSETS.kinetick} alt="Kinetick, recommended market data service" width={400} height={100} />
            </a>
          </div>
          <div className="r kt-r">
            <p className="lead">
              Kinetick® delivers reliable, fast and cost-effective{" "}
              <a className="lnk" href={NT_LINKS.kinetick} target="_blank" rel="noopener">
                market data
              </a>{" "}
              to help level the playing field for active traders. Take advantage of unfiltered, real time quotes for stocks,
              futures and forex that exceed the expectations of the world&rsquo;s most demanding traders, like us!
            </p>
            <p className="body" style={{ marginTop: 18 }}>
              Get started with FREE end-of-day{" "}
              <a className="lnk" href={NT_LINKS.kinetickHome} target="_blank" rel="noopener">
                historical market data
              </a>{" "}
              directly through the NinjaTrader platform and learn how you can significantly reduce CME Group Globex exchange
              fees on real-time market data with Kinetick.
            </p>
            <p style={{ marginTop: 30 }}>
              <a className="lnk" href={NT_LINKS.kinetick} {...ext}>
                Get Started with Free EOD Data
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
