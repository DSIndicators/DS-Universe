import type { Metadata } from "next";
import Link from "next/link";
import { AskButton } from "@/components/AskButton";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * Any address the site does not have (2026-10-29). The lineup changed in v3.1
 * and old links still circulate, so this page says so plainly and offers the
 * three places a visitor was most likely looking for: the store, the Free
 * Vault and a person. Retired product addresses are redirected in
 * next.config.mjs before they ever reach here.
 */
export default function NotFound() {
  return (
    <section className="wb store-head legal-head" aria-labelledby="nf-title" data-section="">
      <p className="pp-label">404</p>
      <h1 id="nf-title" className="d1 store-title">
        That page is not here.
      </h1>
      <p className="lead legal-measure" style={{ marginTop: 28 }}>
        It may have moved when the lineup changed. Every paid tool is on the products page, every free one is in the Free Vault, and a person answers the rest.
      </p>
      <div className="hero-links" style={{ marginTop: 34, marginBottom: "clamp(56px, 9vh, 128px)" }}>
        <Link className="btn" href="/products">
          See the products
        </Link>
        <Link className="lnk" href="/free-vault" style={{ alignSelf: "center" }}>
          Open the Free Vault
        </Link>
        <AskButton className="lnk" style={{ alignSelf: "center" }}>
          Ask a question
        </AskButton>
      </div>
    </section>
  );
}
