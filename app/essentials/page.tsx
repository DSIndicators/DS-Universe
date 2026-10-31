import type { Metadata } from "next";
import Link from "next/link";
import { Shot } from "@/components/Shot";
import { Tile } from "@/components/Tile";
import { Vaults } from "@/components/Vaults";
import { Faq } from "@/components/Faq";
import { Tick } from "@/components/Tick";
import { widePic } from "@/content/pictures";
import { BILLING, COUNT, ESSENTIALS, ESSENTIALS_GROUPS, FOUNDERS, JOIN_LABEL, PRICE, PRICE_DAY, PRICE_MONTHLY } from "@/content/vaults";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Essentials Vault",
  description: `Every paid DS Universe indicator for NinjaTrader 8, and every one added later, in one membership: ${PRICE_MONTHLY}, cancel any time.`,
};

/**
 * THE ESSENTIALS VAULT (renamed from DS Complete, 2026-10-30). Not a package
 * with a big number on it: a membership with a small one. The page says what
 * it costs before anything else, shows every tool inside as a calm grid of
 * contained covers, and puts the renewal terms beside every join button.
 */
export default async function EssentialsPage() {
  const s = await getSession();
  const member = s?.plan === "essentials";
  const go = member ? "/members/essentials" : s ? "/members/unlock" : "/join?vault=essentials";
  return (
    <>
      <section className="hero">
        <div className="hero-grid hero-wide">
          <div className="hero-copy">
            <p className="kicker">{ESSENTIALS.name}</p>
            <h1 className="d1">
              Every paid DS indicator. <em>One membership.</em>
            </h1>
            <p className="lead">
              All {COUNT.essentials} paid DS tools on one license, with every indicator we add later included. No bundles to buy again and nothing to activate tool by tool.
            </p>
            <div className="vault-price" style={{ marginTop: 32 }}>
              <span className="fig num" style={{ color: "var(--ink)" }}>
                {PRICE}
              </span>
              <span className="per small">a month · about {PRICE_DAY} a day{FOUNDERS.active ? ` · ${FOUNDERS.label.toLowerCase()}` : ""}</span>
            </div>
            <div className="actions">
              <Link className="btn" href={go}>
                {member ? "Open your Essentials Vault" : JOIN_LABEL}
              </Link>
              <a className="btn btn-line" href="#inside">
                See what is inside
              </a>
            </div>
            {!member && <p className="small hero-note">{BILLING}</p>}
          </div>
          <div className="hero-pic">
            <Shot pic={widePic("vault")} sizes="(max-width: 960px) 92vw, 62vw" priority caption={widePic("vault").caption} />
          </div>
        </div>
      </section>

      <section className="sec band-haze" aria-labelledby="why-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">Why a membership</p>
              <h2 id="why-h" className="d2">
                A vault, not a bundle.
              </h2>
            </div>
            <p className="body">There is no package to price up every time a tool ships. New indicators go into the vault, and the vault is yours for as long as you are a member.</p>
          </div>
          <div className="steps">
            {[
              { t: "The vault grows", b: "Every new paid DS indicator goes straight into the vault. Members get it with the next update, at no extra cost." },
              { t: "One license, your choice of tools", b: "Every tool runs on one NinjaTrader license tied to your NinjaTrader account. Take the whole vault in one archive, or only the tools you use." },
              { t: "Month to month", b: `About ${PRICE_DAY} a day, no contract. Cancel from your Whop account any time and you are not billed again.` },
            ].map((x, i) => (
              <div key={x.t} className="step">
                <p className="step-n num">0{i + 1}</p>
                <h2 className="d3">{x.t}</h2>
                <p className="body">{x.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="inside" aria-labelledby="inside-h">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">Inside the vault</p>
              <h2 id="inside-h" className="d2">
                {COUNT.essentials} tools today, more as they are made.
              </h2>
            </div>
            <p className="body">Open any tool for what it draws and how it helps. Every one of them comes with the membership; none is sold on its own.</p>
          </div>
          {ESSENTIALS_GROUPS.map((g) => (
            <div key={g.key} className="group">
              <div className="group-head">
                <h3 className="d3">{g.name}</h3>
                <p className="small">{g.line}</p>
              </div>
              <div className="tiles">
                {g.products.map((p) => (
                  <Tile key={p.slug} p={p} tag={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sec band-haze" aria-labelledby="price-h">
        <div className="wrap">
          <div className="head-c">
            <p className="kicker">Membership</p>
            <h2 id="price-h" className="d2">
              Start with the free one if you like.
            </h2>
            <p className="lead">Both vaults open from one account. The Free Vault stays yours whether or not you join Essentials.</p>
          </div>
          <Vaults signedIn={!!s} />
        </div>
      </section>

      <section className="sec" aria-labelledby="faq-h">
        <div className="wrap">
          <div className="head-c">
            <p className="kicker">Questions</p>
            <h2 id="faq-h" className="d2">
              The short answers
            </h2>
          </div>
          <Faq short />
        </div>
      </section>

      <section className="band sec">
        <div className="wrap center stack-l">
          <h2 className="d2">Open the vault.</h2>
          <ul className="checks" style={{ justifyContent: "center", display: "flex", flexWrap: "wrap", gap: "10px 28px", color: "#fff" }}>
            {[PRICE_MONTHLY, `about ${PRICE_DAY} a day`, "cancel any time"].map((t) => (
              <li key={t} style={{ color: "rgba(255,255,255,.9)" }}>
                <Tick /> {t}
              </li>
            ))}
          </ul>
          <div className="actions">
            <Link className="btn btn-white" href={go}>
              {member ? "Open your Essentials Vault" : JOIN_LABEL}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
