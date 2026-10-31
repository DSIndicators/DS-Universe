import type { Metadata } from "next";
import Link from "next/link";
import { Shot } from "@/components/Shot";
import { Tile } from "@/components/Tile";
import { Tick, Arrow } from "@/components/Tick";
import { widePic } from "@/content/pictures";
import { COUNT, FREE_PRODUCTS, PRICE_MONTHLY } from "@/content/vaults";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Free Vault",
  description: `The home of optimized free indicators for NinjaTrader 8: ${COUNT.free} free tools, each its own download, free for good with a free account.`,
};

/** THE FREE VAULT: the trust builder (Tom, 2026-10-26). Browse everything freely; the account is asked for only at the download. */
export default async function FreeVaultPage() {
  const s = await getSession();
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="kicker">DS Free Vault</p>
            <h1 className="d1">
              Free tools, <em>free for good.</em>
            </h1>
            <p className="lead">The home of optimized free indicators for NinjaTrader 8. {COUNT.free} tools, each its own download, no license and no trial clock. A free account is all it takes.</p>
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
              <Link className="btn" href={s ? "/members/free-vault" : "/join?next=%2Fmembers%2Ffree-vault"}>
                {s ? "Open your Free Vault" : "Join free"}
              </Link>
              <a className="btn btn-line" href="#tools">
                See the tools
              </a>
            </div>
          </div>
          <div className="hero-pic">
            <Shot pic={widePic("free")} sizes="(max-width: 960px) 92vw, 600px" priority caption="DS Chart Price, DS Session Levels, DS Adaptive Price Line and DS Parallax on one NinjaTrader 8 chart. All four are in the Free Vault." />
          </div>
        </div>
      </section>

      <section className="sec band-haze" id="tools" aria-labelledby="tools-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">In the Free Vault</p>
              <h2 id="tools-h" className="d2">
                {COUNT.free} tools, all yours.
              </h2>
            </div>
            <p className="body">Open any tool to see what it draws. When you are ready, your free account lets you download all of them.</p>
          </div>
          <div className="tiles">
            {FREE_PRODUCTS.map((p) => (
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
