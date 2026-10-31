import Link from "next/link";
import { Shot } from "@/components/Shot";
import { Tile } from "@/components/Tile";
import { Vaults } from "@/components/Vaults";
import { Steps } from "@/components/Steps";
import { Faq } from "@/components/Faq";
import { Arrow, Tick } from "@/components/Tick";
import { widePic } from "@/content/pictures";
import { COUNT, ESSENTIALS_PRODUCTS, FREE_PRODUCTS, JOIN_LABEL, PRICE_DAY, PRICE_MONTHLY } from "@/content/vaults";
import { LATEST, STRENGTHS } from "@/content/strengths";
import { getSession } from "@/lib/auth";
import { FocusSwitch } from "@/components/FocusSwitch";

/**
 * HOME (2026-10-30). Built to be understood in one screen and finished in a
 * few: what DS Universe is, the two vaults, what is inside, how to start.
 * Research behind the order (NN/g, Google 2012, Microsoft dwell-time study):
 * visitors judge a page in a fraction of a second and decide to stay in about
 * ten; simple, familiar layouts win; most attention goes to the first screen.
 * So the first screen carries the whole offer, price included, and one button.
 */
export default async function Home() {
  const s = await getSession();
  const hero = widePic("home");
  const flow = widePic("orderflow");
  return (
    <>
      <section className="hero">
        <div className="hero-grid hero-wide">
          <div className="hero-copy">
            <FocusSwitch variant="hero" />
            <p className="kicker">Indicators for NinjaTrader 8</p>
            <h1 className="d1">
              Start free. <em>Open everything</em> when you’re ready.
            </h1>
            <p className="lead">
              DS Universe draws where the volume traded, which side was pressing and which levels held, in plain words on your chart. {COUNT.free} tools are free in the Free Vault. The other {COUNT.essentials}, and every one we build next, live in the Essentials Vault for {PRICE_MONTHLY}.
            </p>
            <div className="actions">
              <Link className="btn" href={s ? "/members/unlock" : "/join?vault=essentials"}>
                {JOIN_LABEL}
              </Link>
              <Link className="btn btn-line" href="/free-vault">
                Open the Free Vault
              </Link>
            </div>
            <p className="hero-day">
              <span className="hero-day-num" data-nobio="">{`${PRICE_DAY} a day`}</span>
              <span className="hero-day-rest">for every paid DS indicator. Cancel any time.</span>
            </p>
          </div>
          <div className="hero-pic">
            <Shot pic={hero} sizes="(max-width: 960px) 92vw, 62vw" priority caption={hero.caption} />
          </div>
        </div>
      </section>

      <section className="sec band-haze" aria-labelledby="vaults-h">
        <div className="wrap">
          <div className="head-c">
            <p className="kicker">The vaults</p>
            <h2 id="vaults-h" className="d2">
              One account. Two vaults.
            </h2>
            <p className="lead">Your free account opens the Free Vault for good. Add the Essentials membership and the rest of the suite opens beside it.</p>
          </div>
          <Vaults signedIn={!!s} />
        </div>
      </section>

      <section className="sec" aria-labelledby="current-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">Why traders stay</p>
              <h2 id="current-h" className="d2">
                Consistently updated for <em>the current market.</em>
              </h2>
            </div>
            <p className="body">A DS indicator is never finished. Each one is reworked as the market changes, and every release is tuned for speed before it reaches your chart.</p>
          </div>
          <div className="pillars">
            {STRENGTHS.map((x) => (
              <div key={x.key} className="pillar">
                <p className="pillar-fig num" data-nobio="">
                  {x.fig}
                </p>
                <p className="small pillar-figline">{x.figLine}</p>
                <h3 className="d4">{x.title}</h3>
                <p className="body">{x.body}</p>
              </div>
            ))}
          </div>
          <div className="latest">
            <p className="kicker kicker-plain">New in {LATEST.version}</p>
            <ul className="checks latest-list">
              {LATEST.items.map((t) => (
                <li key={t}>
                  <Tick /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="inside-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">Inside the Essentials Vault</p>
              <h2 id="inside-h" className="d2">
                Take a look behind the door.
              </h2>
            </div>
            <div className="stack-s">
              <p className="body">Every tool below comes with the membership. Open any of them to see what it draws, what it reads from your chart and how it helps.</p>
              <p>
                <Link className="lnk lnk-teal" href="/essentials">
                  The whole Essentials Vault <Arrow />
                </Link>
              </p>
            </div>
          </div>
          <div className="tiles tiles-s">
            {ESSENTIALS_PRODUCTS.map((p) => (
              <Tile key={p.slug} p={p} tag={false} sizes="(max-width: 600px) 46vw, (max-width: 960px) 24vw, 220px" />
            ))}
          </div>
        </div>
      </section>

      <section className="sec band-haze" aria-labelledby="free-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">In the Free Vault</p>
              <h2 id="free-h" className="d2">
                {COUNT.free} indicators, free for good.
              </h2>
            </div>
            <div className="stack-s">
              <p className="body">No card and no license key. Each one is its own small download, built and updated to the same standard as the Essentials Vault.</p>
              <p>
                <Link className="lnk lnk-teal" href="/free-vault">
                  The whole Free Vault <Arrow />
                </Link>
              </p>
            </div>
          </div>
          <div className="tiles tiles-s">
            {FREE_PRODUCTS.map((p) => (
              <Tile key={p.slug} p={p} tag={false} sizes="(max-width: 600px) 46vw, (max-width: 960px) 24vw, 220px" />
            ))}
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="chart-h">
        <div className="wrap split">
          <Shot pic={flow} sizes="(max-width: 900px) 92vw, 580px" caption="DS Flow, DS Iceberg, DS GEX, DS ProRSI and DS Volume on one chart, with the DS ProTrendRange panel underneath." />
          <div className="stack">
            <p className="kicker">On your chart</p>
            <h2 id="chart-h" className="d2">
              The data behind the candles, in plain words.
            </h2>
            <p className="body">Most of the suite reads order flow: what actually traded at each price, not only where price went. Every read is drawn as a clean, named level, so a glance tells you what you are looking at.</p>
            <ul className="checks">
              <li>
                <Tick /> Where the volume traded, split into buying and selling
              </li>
              <li>
                <Tick /> Which side is pressing, and where size was hidden
              </li>
              <li>
                <Tick /> Which levels are holding, tested or broken
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="sec band-haze" aria-labelledby="how-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">How it works</p>
              <h2 id="how-h" className="d2">
                From here to your chart in three steps.
              </h2>
            </div>
            <p className="body">No bundles to compare and nothing to activate tool by tool. Pick a vault, import the tools you want, and new ones arrive as they are made.</p>
          </div>
          <Steps />
        </div>
      </section>

      <section className="sec" aria-labelledby="faq-h">
        <div className="wrap">
          <div className="head-c">
            <p className="kicker">Questions</p>
            <h2 id="faq-h" className="d2">
              Before you join
            </h2>
          </div>
          <Faq short />
          <p className="center small" style={{ marginTop: 28 }}>
            More answers on{" "}
            <Link className="lnk" href="/how-it-works">
              How it works
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="band sec">
        <div className="wrap center stack-l">
          <h2 className="d2">Start free today.</h2>
          <p className="lead">Open the Free Vault in under a minute. Unlock the rest whenever you are ready.</p>
          <div className="actions">
            <Link className="btn btn-white" href={s ? "/members" : "/join"}>
              {s ? "Open your vault" : "Join free"}
            </Link>
            <Link className="btn btn-ghost-white" href="/essentials">
              See the Essentials Vault
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
