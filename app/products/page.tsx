import type { Metadata } from "next";
import Link from "next/link";
import { CompleteBand } from "@/components/CompleteBand";
import { Faq } from "@/components/Faq";
import { Lineup } from "@/components/Lineup";
import { SectionBar } from "@/components/SectionBar";
import { WideFigure } from "@/components/Wide";
import { WIDE } from "@/content/capabilities";
import { AFTER_CHECKOUT, onWaitlist } from "@/content/launch";
import { site } from "@/content/links";
import { STORE_PAGE as T } from "@/content/pages";
import { COMPLETE, FOUNDERS, TERMS, money } from "@/content/pricing";
import { STORE_SHELVES, VAULT_PATH, VAULT_PRODUCTS } from "@/content/release";

export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDescription,
  alternates: { canonical: "/products" },
};

/** Bar numbers run down the page: DS Complete 01, the shelves from 02, then these. */
const TERMS_N = 2 + STORE_SHELVES.length;
const nn = (n: number) => String(n).padStart(2, "0");

/**
 * THE STORE, WHITE (2026-10-26 night — Tom: "the top tabs ( free vault,
 * products ) all lead to the same page, just scrolled down. Each page should
 * have its own elegantly unique pages").
 *
 * Its character is the LEDGER: what things cost first, set as a spec sheet,
 * then DS Complete (the star, as on the live store), then every shelf as rows
 * of name, line, price and button, then the terms, the three steps and the
 * questions. The live store's own words and order (DS-Universe-3
 * app/products/page.tsx, components/BeforeYouBuy.tsx). Nothing here types a
 * number: every figure is computed in content/pricing.ts.
 */
export default function ProductsPage() {
  // v3.1: one paid product at two prices, and the Free Vault. Every figure
  // and count is computed (content/pricing.ts, content/release.ts).
  const offer = [
    { price: money(COMPLETE.monthly), label: COMPLETE.name, note: FOUNDERS.active ? "A month · founders price" : "A month", href: "#complete" },
    { price: money(COMPLETE.own), label: COMPLETE.name, note: FOUNDERS.active ? "To own the set · founders price" : "To own the set", href: "#complete" },
    { price: "Free", label: "Free Vault", note: `${VAULT_PRODUCTS.length} tools · no license`, href: VAULT_PATH },
  ];

  return (
    <>
      {/* ------------------------------------------------ head: the offer as a spec sheet */}
      <section className="wb store-head" aria-labelledby="store-title" data-section="">
        <div className="store-grid">
          <div className="t">
            <p className="pp-label">{T.label}</p>
            <h1 id="store-title" className="d1 store-title">
              {T.title}
            </h1>
          </div>
          <div className="s">
            <p className="lead">{T.lede}</p>
            <p className="body" style={{ marginTop: 22 }}>
              <a className="lnk" href="#faq">
                {T.faqLink}
              </a>
              <span style={{ color: "var(--ink-3)" }}> · {T.faqAfter}</span>
            </p>
          </div>
        </div>
        <ul className="offer" aria-label="Prices at a glance">
          {offer.map((o) => (
            <li key={o.note}>
              <Link href={o.href}>
                <span className="pp-label">{o.label}</span>
                <span className="fig num">{o.price}</span>
                <span className="small">{o.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <WideFigure pic={WIDE.sessions} />

      {/* ------------------------------------------------ DS Complete leads the shelves */}
      <CompleteBand id="complete" n="01" />

      {/* ------------------------------------------------ the shelves, each on its own bar */}
      <section className="store-shelves" aria-label="The lineup">
        <Lineup shelves={STORE_SHELVES} start={2} />
      </section>

      {/* ------------------------------------------------ bought once */}
      <SectionBar n={nn(TERMS_N)} title={T.terms} />
      <section className="wb sbar-after" aria-label={T.terms}>
        <ul className="principles terms4">
          {TERMS.map((t) => (
            <li key={t.title}>
              <h3 className="d4">{t.title}</h3>
              <p className="body">
                {t.text}
                {t.link && (
                  <>
                    {" "}
                    <Link className="lnk" href={site(t.link.href)}>
                      {t.link.label}
                    </Link>
                    .
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------ before you buy */}
      <SectionBar n={nn(TERMS_N + 1)} title={T.beforeLabel} sub={T.beforeTitle} id="faq" />
      <section className="wb sbar-after" aria-label={T.beforeLabel}>
        <div className="before-grid">
          <div className="l">
            {!onWaitlist() && (
              <ol className="steps steps-col" style={{ marginTop: 0 }}>
                {AFTER_CHECKOUT.steps.map((s, i) => (
                  <li key={s.title}>
                    <span className="step-n num">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="d4">{s.title}</h3>
                    <p className="body">{s.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="r">
            <Faq />
          </div>
        </div>
      </section>
    </>
  );
}
