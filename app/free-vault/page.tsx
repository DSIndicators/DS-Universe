import type { Metadata } from "next";
import Link from "next/link";
import { Shot } from "@/components/Shot";
import { Tile } from "@/components/Tile";
import { Tick, Arrow } from "@/components/Tick";
import { widePic } from "@/content/pictures";
import { COUNT, FREE_PRODUCTS, PRICE_MONTHLY } from "@/content/vaults";
import { hrefFor } from "@/content/paths";
import { BACK, FRESH, FRESH_NAMES, REOPENED, returnOn } from "@/content/returns";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Free Vault",
  description: `The home of optimized free indicators for NinjaTrader 8: ${COUNT.free} free tools, each its own download, free for good with a free account.`,
};

/**
 * THE FREE VAULT: the trust builder (Tom, 2026-10-26). Browse everything freely; the account is asked for only at the download.
 * Since 2026-11-01, while the return is on (content/returns.ts), it opens as THE FREE VAULT IS BACK: what happened
 * (closed for the v3.2 rebuild, open again), a reopening line with the date, what changed while it was closed, and
 * the shelf with the new tool marked. Typography and hairlines only; one line draws itself in once.
 */
export default async function FreeVaultPage() {
  const s = await getSession();
  const back = returnOn();
  const join = s ? "/members/free-vault" : "/join?next=%2Fmembers%2Ffree-vault";
  // while the return is on, the new tools lead the shelf; otherwise the sheet's order
  const shelf = back ? [...FRESH, ...BACK] : FREE_PRODUCTS;
  return (
    <>
      <section className="hero">
        <div className="hero-grid hero-wide">
          <div className="hero-copy">
            {back ? (
              <>
                <p className="kicker">DS Free Vault · Back</p>
                <h1 className="d1">
                  The Free Vault <em className="ret-em">is back.</em>
                </h1>
                <p className="ret-stamp num" data-nobio="">
                  <span className="ret-rule" aria-hidden="true" />
                  <span data-nobio="">Reopened {REOPENED}</span>
                  <span className="ret-tally">
                    <span aria-hidden="true">·</span>
                    <span data-nobio="">{BACK.length} back</span>
                    {FRESH.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="ret-new" data-nobio="">{FRESH.length} new</span>
                      </>
                    )}
                  </span>
                </p>
                <p className="lead">
                  We closed it while the tools were rebuilt for v3.2. It is open again: {COUNT.free} free tools for NinjaTrader 8, each its own download with no license
                  {FRESH.length > 0 ? <>, and {FRESH.length === 1 ? "one" : FRESH.length} you have not seen before: {FRESH_NAMES}.</> : "."}
                </p>
              </>
            ) : (
              <>
                <p className="kicker">DS Free Vault</p>
                <h1 className="d1">
                  Free tools, <em>free for good.</em>
                </h1>
                <p className="lead">The home of optimized free indicators for NinjaTrader 8. {COUNT.free} tools, each its own download, no license and no trial clock. A free account is all it takes.</p>
              </>
            )}
            <ul className="checks">
              <li>
                <Tick /> Not a trial and not a stripped build
              </li>
              <li>
                <Tick /> No card, ever
              </li>
              <li>
                <Tick /> New free tools added as they are made
              </li>
            </ul>
            <div className="actions">
              <Link className="btn" href={join}>
                {s ? "Open your Free Vault" : back ? "Join free and take them" : "Join free"}
              </Link>
              <a className="btn btn-line" href="#tools">
                See the tools
              </a>
            </div>
          </div>
          <div className="hero-pic">
            <Shot pic={widePic("free")} sizes="(max-width: 960px) 92vw, 62vw" priority caption="DS Chart Price, DS Session Levels, DS Adaptive Price Line and DS Parallax on one NinjaTrader 8 chart. All four are in the Free Vault." />
          </div>
        </div>
      </section>

      {back && (
        <section className="sec" aria-labelledby="closed-h">
          <div className="wrap">
            <div className="head">
              <div>
                <p className="kicker">While it was closed</p>
                <h2 id="closed-h" className="d2">
                  Rebuilt, <em>not just reopened.</em>
                </h2>
              </div>
              <p className="body">Every free tool came back to the same standard as the Essentials Vault, in a place of its own in NinjaTrader, and the vault came back with more in it than it had.</p>
            </div>
            <div className="pillars">
              <div className="pillar">
                <p className="pillar-fig num" data-nobio="">
                  v3.2
                </p>
                <p className="small pillar-figline">the house standard, on the free tools too</p>
                <h3 className="d4">The same care as the paid tools</h3>
                <p className="body">One label style with a name in front of every value, one Label size, the DS colors, and every setting explained in plain words in the Properties window.</p>
              </div>
              <div className="pillar">
                <p className="pillar-fig num" data-nobio="">
                  1
                </p>
                <p className="small pillar-figline">folder of their own in NinjaTrader</p>
                <h3 className="d4">Easy to find</h3>
                <p className="body">The free tools sit together in the DSFreeVault folder of the Indicators list, apart from the paid tools, and each one still installs on its own.</p>
              </div>
              {FRESH.length > 0 ? (
                <div className="pillar">
                  <p className="pillar-fig num" data-nobio="">
                    +{FRESH.length}
                  </p>
                  <p className="small pillar-figline">{FRESH.length === 1 ? "tool that was not here before" : "tools that were not here before"}</p>
                  <h3 className="d4">{FRESH_NAMES}</h3>
                  <p className="body">
                    {FRESH[0].purpose.split(" — ")[0]}.{" "}
                    <Link className="lnk lnk-teal" href={hrefFor(FRESH[0].slug)}>
                      See {FRESH[0].name} <Arrow />
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="pillar">
                  <p className="pillar-fig num" data-nobio="">
                    {COUNT.free}
                  </p>
                  <p className="small pillar-figline">free tools, each its own download</p>
                  <h3 className="d4">Free for good</h3>
                  <p className="body">No card, no license key and no trial clock. Take the ones you use and come back for the rest.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="sec band-haze" id="tools" aria-labelledby="tools-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">{back ? "Back in the vault" : "In the Free Vault"}</p>
              <h2 id="tools-h" className="d2">
                {back ? `${COUNT.free} tools, yours again.` : `${COUNT.free} tools, all yours.`}
              </h2>
            </div>
            <p className="body">Open any tool to see what it draws. When you are ready, your free account lets you download all of them.</p>
          </div>
          <div className="tiles">
            {shelf.map((p) => (
              <Tile key={p.slug} p={p} tag={false} />
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="notice notice-teal">
            <div>
              <p className="d3">Want the rest of the suite?</p>
              <p className="body">The Essentials Vault opens every paid DS indicator, and every new one, for {PRICE_MONTHLY}. Your Free Vault stays as it is.</p>
            </div>
            <Link className="btn" href="/essentials">
              See the Essentials Vault <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
