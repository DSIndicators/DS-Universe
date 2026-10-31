import type { Metadata } from "next";
import Link from "next/link";
import { Steps } from "@/components/Steps";
import { Faq } from "@/components/Faq";
import { Vaults } from "@/components/Vaults";
import { INSTALL, UPDATE } from "@/content/install";
import { SITE } from "@/content/site";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "How it works", description: "How the Free Vault and the Essentials Vault work: joining, billing, installing into NinjaTrader 8, updates and cancelling." };

export default async function HowItWorks() {
  const s = await getSession();
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="stack" style={{ maxWidth: 780 }}>
            <p className="kicker">How it works</p>
            <h1 className="d1">
              Simple on purpose. <em>Two vaults, one account.</em>
            </h1>
            <p className="lead">Every DS indicator lives in one of two places. Free tools are in the Free Vault. Everything else is in the Essentials Vault, and every new tool simply joins one of them.</p>
          </div>
          <div style={{ marginTop: 56 }}>
            <Steps />
          </div>
        </div>
      </section>

      <section className="sec band-haze" aria-labelledby="install-h">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div className="stack">
            <p className="kicker">Installing</p>
            <h2 id="install-h" className="d2">
              Onto your chart in a minute.
            </h2>
            <p className="body">
              Every DS tool is written in NinjaScript for {SITE.platform} and imports like any other add-on, in version {SITE.minBuild} or newer.
            </p>
            <ol className="install">
              {INSTALL.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
          <div className="stack">
            <p className="kicker">Updating</p>
            <h2 className="d2">When a new version lands.</h2>
            <p className="body">New tools and new versions arrive in the same vault download.</p>
            <ol className="install">
              {UPDATE.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="faq-h">
        <div className="wrap">
          <div className="head-c">
            <p className="kicker">Questions</p>
            <h2 id="faq-h" className="d2">
              Everything people ask
            </h2>
          </div>
          <Faq />
          <p className="center small" style={{ marginTop: 28 }}>
            Something else?{" "}
            <Link className="lnk" href="/contact">
              Write to us
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="sec band-haze" aria-label="The two vaults">
        <div className="wrap">
          <Vaults signedIn={!!s} />
        </div>
      </section>
    </>
  );
}
