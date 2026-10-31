import type { Metadata } from "next";
import Link from "next/link";
import { Shot } from "@/components/Shot";
import { Arrow } from "@/components/Tick";
import { NT_ASSETS, NT_FREE_ACCESS, NT_LINKS } from "@/content/ninjatrader";
import { widePic } from "@/content/pictures";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "NinjaTrader",
  description: "NinjaTrader® is our #1 recommended trading platform, and Kinetick® our recommended market data feed. Get started for free.",
};

/**
 * NINJATRADER, its own tab (Tom, 2026-10-30: "there is no separate
 * ninjatrader tab. please create one with elegance").
 *
 * Two voices on one page, kept apart on purpose:
 *   · NinjaTrader's and Kinetick's words are VERBATIM from the vendor kit
 *     (content/ninjatrader.ts) and never reworded; their logos keep at least
 *     18 px of clear space, link where NinjaTrader asked, and every partner
 *     link is rel="sponsored".
 *   · Ours: how DS Universe sits inside NinjaTrader 8, in plain facts.
 * The trademark notice is in the footer of every page.
 */
const ext = { target: "_blank", rel: "sponsored noopener" } as const;

export default function NinjaTraderPage() {
  const chart = widePic("sessions");
  const ours = [
    { t: "Built in NinjaScript", b: `Every DS tool is written for ${SITE.platform}, version ${SITE.minBuild} or newer, and imports like any other add-on. Nothing to compile, nothing to copy by hand.` },
    { t: "Your license follows you", b: "Essentials tools are licensed to your NinjaTrader account, not to a computer, so the same download runs on your desktop, your laptop and a VPS." },
    { t: "Start on the simulator", b: "NinjaTrader’s simulator and the Free Vault cost nothing, so you can put DS tools on a live chart before you trade a single contract." },
  ];
  const steps = [
    { t: "Download NinjaTrader", b: "Free, with real-time futures data on its simulator.", href: NT_LINKS.partner, label: "Get NinjaTrader", external: true },
    { t: "Open the Free Vault", b: "Create a free DS account and take the tools you want.", href: "/free-vault", label: "See the Free Vault" },
    { t: "Import onto your chart", b: "Tools, Import, NinjaScript Add-On, then restart once.", href: "/how-it-works", label: "Installing, step by step" },
  ];
  return (
    <>
      <section className="hero nt-hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="kicker">Our trading platform</p>
            <a className="nt-mark" href={NT_LINKS.logo} {...ext} aria-label="NinjaTrader, visit ninjatrader.com">
              <img src={NT_ASSETS.wordmark} alt="NinjaTrader" width={2376} height={300} />
            </a>
            <h1 className="d1">Our Recommended Trading Platform</h1>
            <p className="lead">
              NinjaTrader® is our #1 recommended{" "}
              <a className="lnk" href={NT_LINKS.getStarted} {...ext}>
                trading software platform
              </a>{" "}
              preferred by traders worldwide including our clients.
            </p>
            <div className="actions">
              <a className="btn" href={NT_LINKS.partner} {...ext}>
                Get Started for FREE!
              </a>
              <a className="btn btn-line" href="#with-ds">
                How DS fits in
              </a>
            </div>
          </div>
          <div className="nt-devices" aria-hidden="false">
            <img className="nt-desk" src={NT_ASSETS.desktop} alt="The NinjaTrader platform on a desktop" width={510} height={531} />
            <img className="nt-phone" src={NT_ASSETS.mobile} alt="The NinjaTrader mobile app running on two phones" width={1500} height={1216} loading="lazy" />
          </div>
        </div>
      </section>

      <section className="sec band-haze" aria-labelledby="free-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">Free to start</p>
              <h2 id="free-h" className="d2">
                <a className="lnk" href={NT_LINKS.home} {...ext}>
                  Download NinjaTrader
                </a>{" "}
                &amp; receive immediate FREE access to:
              </h2>
            </div>
            <p className="body">
              NinjaTrader&rsquo;s award-winning trading platform is consistently voted an industry leader by the trading community. Featuring 1000s of Apps &amp; Add-Ons for unlimited customization, NinjaTrader is used by over 1.9 million traders for advanced market analysis, professional charting and fast order execution.
            </p>
          </div>
          <ol className="nt-free">
            {NT_FREE_ACCESS.map((x, i) => (
              <li key={x}>
                <span className="step-n num">0{i + 1}</span>
                <span className="d3">{x}</span>
              </li>
            ))}
          </ol>
          <p className="body" style={{ marginTop: 32 }}>
            For new traders, start preparing for the live markets with a free{" "}
            <a className="lnk" href={NT_LINKS.simulator} {...ext}>
              trading simulator
            </a>{" "}
            featuring real-time market data.
          </p>
        </div>
      </section>

      <section className="sec" id="with-ds" aria-labelledby="ds-h">
        <div className="wrap split">
          <div className="stack">
            <p className="kicker">DS Universe on NinjaTrader 8</p>
            <h2 id="ds-h" className="d2">
              Made for the platform you already trade on.
            </h2>
            <dl className="nt-facts">
              {ours.map((o) => (
                <div key={o.t}>
                  <dt className="d4">{o.t}</dt>
                  <dd className="body">{o.b}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Shot pic={chart} sizes="(max-width: 900px) 92vw, 580px" caption={chart.caption} />
        </div>
      </section>

      <section className="sec band-haze" aria-labelledby="start-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">Getting started</p>
              <h2 id="start-h" className="d2">
                From NinjaTrader to your first DS chart.
              </h2>
            </div>
            <p className="body">Three steps, all of them free.</p>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.t} className="step">
                <p className="step-n num">0{i + 1}</p>
                <h3 className="d3">{s.t}</h3>
                <p className="body">{s.b}</p>
                <p style={{ marginTop: 14 }}>
                  {s.external ? (
                    <a className="lnk lnk-teal small" href={s.href} {...ext}>
                      {s.label} <Arrow />
                    </a>
                  ) : (
                    <Link className="lnk lnk-teal small" href={s.href}>
                      {s.label} <Arrow />
                    </Link>
                  )}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sec" aria-labelledby="kt-h">
        <div className="wrap nt-kt">
          <a className="nt-kt-mark" href={NT_LINKS.kinetick} {...ext} aria-label="Kinetick, fast market data, unfiltered">
            <img src={NT_ASSETS.kinetick} alt="Kinetick, recommended market data service" width={400} height={100} />
          </a>
          <div className="stack">
            <h2 id="kt-h" className="d3">
              Our Recommended Market Data Feed
            </h2>
            <p className="body">
              Kinetick® delivers reliable, fast and cost-effective{" "}
              <a className="lnk" href={NT_LINKS.kinetick} target="_blank" rel="noopener">
                market data
              </a>{" "}
              to help level the playing field for active traders. Take advantage of unfiltered, real time quotes for stocks, futures and forex that exceed the expectations of the world&rsquo;s most demanding traders, like us!
            </p>
            <p className="body">
              Get started with FREE end-of-day{" "}
              <a className="lnk" href={NT_LINKS.kinetickHome} target="_blank" rel="noopener">
                historical market data
              </a>{" "}
              directly through the NinjaTrader platform and learn how you can significantly reduce CME Group Globex exchange fees on real-time market data with Kinetick.
            </p>
            <p>
              <a className="lnk lnk-teal" href={NT_LINKS.kinetick} {...ext}>
                Get Started with Free EOD Data
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
