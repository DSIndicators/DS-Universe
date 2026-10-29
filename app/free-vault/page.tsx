import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/Cover";
import { WideFigure } from "@/components/Wide";
import { SectionBar } from "@/components/SectionBar";
import { WIDE } from "@/content/capabilities";
import { COVERS, PRODUCT_VIEWS } from "@/content/catalog";
import { AFTER_CHECKOUT_FREE, onWaitlist } from "@/content/launch";
import { VAULT_PAGE as T } from "@/content/pages";
import { VAULT_PATH, VAULT_PRODUCTS } from "@/content/release";
import { DISCLOSURE, SITE } from "@/content/site";
import { COMPLETE_HREF } from "@/content/links";
import { OPENING } from "@/content/whop";
import { VAULT_COPY } from "@/content/vault";
import { VAULT_CHARTER } from "@/content/voice";
import { PRODUCTS } from "@/content/products";

export const metadata: Metadata = {
  title: VAULT_COPY.label,
  description: T.metaDescription,
  alternates: { canonical: VAULT_PATH },
};

/**
 * THE FREE VAULT, WHITE (2026-10-26 night). A place of its own, not a section
 * of the store: where /products is a ledger of rows and prices, the vault is a
 * GALLERY — every free product shown large by its own white cover, its name,
 * its one line and the way to get it, three across. Then the vault's own chart
 * (Free Vault tools only), how a free product arrives, and the way to the paid
 * side. Every word is the live vault's (DS-Universe-3 content/vault.ts,
 * app/free-vault/page.tsx, content/launch.ts).
 */
export default function FreeVaultPage() {
  const open = !onWaitlist();
  return (
    <>
      {/* ------------------------------------------------ the charter: why it is free (above the title, Tom) */}
      <section className="vault-charter field" data-section={VAULT_CHARTER.label} aria-label={VAULT_CHARTER.label}>
        <div className="wb charter-grid">
          <div className="l">
            <p className="pp-label">{VAULT_CHARTER.label}</p>
            <p className="d2 charter-title">{VAULT_CHARTER.title}</p>
            <p className="lead charter-text">{VAULT_CHARTER.text(VAULT_PRODUCTS.length, PRODUCTS.length)}</p>
          </div>
          <div className="r">
            <p className="charter-fig num">{VAULT_PRODUCTS.length}</p>
            <p className="charter-cap">{VAULT_CHARTER.figCap}</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ the entrance */}
      <section className="wb vault-head" aria-labelledby="vault-title" data-section="">
        <div className="vault-head-grid">
          <div className="t">
            <p className="pp-label vault-mark">{T.freeMark}</p>
            <h1 id="vault-title" className="d1 store-title">
              {VAULT_COPY.title}
            </h1>
            <p className="lead measure" style={{ marginTop: 28 }}>
              {VAULT_COPY.lede}
            </p>
          </div>
          <dl className="facts vault-facts">
            {VAULT_COPY.facts.map((f) => (
              <div key={f.k}>
                <dt>{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------ the deposits */}
      <SectionBar n="01" title={VAULT_COPY.shelfHeading} sub={VAULT_COPY.hero} id="deposits" />
      <section className="wb sbar-after" aria-label={VAULT_COPY.shelfHeading}>
        <ul className="vault-gallery">
          {VAULT_PRODUCTS.map((p) => {
            const v = PRODUCT_VIEWS[p.slug];
            return (
              <li key={p.slug}>
                <Link href={v.page} className="vault-pic" aria-label={p.name}>
                  <Cover cover={COVERS[p.slug]} name={p.name} sizes="(min-width: 1101px) 30vw, (min-width: 561px) 46vw, 92vw" decorative />
                </Link>
                <div className="vg-row">
                  <p className="d3 nm">
                    <Link className="lnk lnk-bare" href={v.page}>
                      {p.name}
                    </Link>
                  </p>
                  <p className="small vg-cat">{p.category}</p>
                </div>
                <p className="body vg-line">{v.line}</p>
                <p className="vg-acts">
                  {v.action ? (
                    <a className="lnk" href={v.action.href}>
                      {v.action.label}
                    </a>
                  ) : (
                    <span className="small">{OPENING.label}</span>
                  )}
                  <Link className="lnk lnk-quiet" href={v.page}>
                    {p.name} in full
                  </Link>
                </p>
              </li>
            );
          })}
        </ul>
        <p className="small measure" style={{ marginTop: 48 }}>
          {VAULT_COPY.chartsNote} {DISCLOSURE.chart}
        </p>
      </section>

      <WideFigure pic={WIDE.free} />

      {/* ------------------------------------------------ how it works */}
      <SectionBar n="02" title={T.howLabel} sub={T.howTitle} />
      <section className="wb sbar-after" aria-label={T.howLabel}>
        <div className="before-grid">
          <div className="l">
            <p className="lead measure">
              {open ? AFTER_CHECKOUT_FREE.short : "Every product is on the waitlist while the files are being attached. Joining costs nothing."}
            </p>
            <div className="vault-note">
              <p className="d4">{VAULT_COPY.licenseNote.k}</p>
              <p className="body" style={{ marginTop: 8 }}>
                {VAULT_COPY.licenseNote.v}
              </p>
            </div>
            <p className="body" style={{ marginTop: 28 }}>
              A question first? Write to{" "}
              <a className="lnk" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
              .
            </p>
          </div>
          {open && (
            <ol className="r steps steps-col">
              {AFTER_CHECKOUT_FREE.steps.map((s, i) => (
                <li key={s.title}>
                  <span className="step-n num">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="d4">{s.title}</h3>
                  <p className="body">{s.text}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ the paid side */}
      <SectionBar n="03" title={T.storeLabel} />
      <section className="wb sbar-after" aria-labelledby="paid-title">
        <div className="reader-head-grid">
          <div className="t">
            <h2 id="paid-title" className="d2">
              {VAULT_COPY.storeHeading}
            </h2>
          </div>
          <div className="s">
            <p className="body">{VAULT_COPY.storeText}</p>
            <p style={{ marginTop: 24 }}>
              <Link className="btn" href={COMPLETE_HREF}>
                {VAULT_COPY.storeCta}
              </Link>
            </p>
          </div>
        </div>
        <p className="small measure" style={{ marginTop: 56 }}>
          {DISCLOSURE.short}
        </p>
      </section>
    </>
  );
}
