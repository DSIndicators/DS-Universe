import type { Metadata } from "next";
import { SectionBar } from "@/components/SectionBar";
import { SITE } from "@/content/site";
import { PREAMBLE, SECTIONS, TERMS_LAST_UPDATED } from "@/content/terms";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern the purchase and use of DS Universe software.",
  alternates: { canonical: "/terms" },
};

/**
 * Terms & Conditions, white (ported 2026-10-29 from DS-Universe-3
 * app/terms/page.tsx so the white site can stand as dsuniverse.net on its own:
 * the store FAQ links "Terms, section 13"). The words are content/terms.ts,
 * copied word for word from the live site; only the layout is the white
 * site's. Each numbered section keeps its id ("section-13").
 */
export default function TermsPage() {
  return (
    <>
      <section className="wb store-head legal-head" aria-labelledby="terms-title" data-section="">
        <p className="pp-label">Fine print</p>
        <h1 id="terms-title" className="d1 store-title">
          Terms &amp; Conditions
        </h1>
        <p className="small" style={{ marginTop: 22 }}>
          Last updated {TERMS_LAST_UPDATED}
        </p>
        <p className="lead legal-measure" style={{ marginTop: 28 }}>
          {PREAMBLE}
        </p>
      </section>

      <SectionBar n="01" title="The terms" />
      <section className="wb sbar-after" aria-label="The terms">
        <div className="legal">
          {SECTIONS.map((s) => (
            <section key={s.heading} id={sectionId(s.heading)} className="legal-sec">
              <h2 className="d4">{s.heading}</h2>
              {s.blocks.map((b, i) =>
                b.ul ? (
                  <ul key={i} className="legal-ul">
                    {b.ul.map((li) => (
                      <li key={li} className="body">
                        {li}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p key={i} className="body">
                    {b.p}
                  </p>
                ),
              )}
            </section>
          ))}
          <p className="small legal-close">
            By installing or using DS Universe software, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. Questions:{" "}
            <a className="lnk" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}

/** "13. Refunds — All Sales Final" → "section-13". */
function sectionId(heading: string) {
  const n = /^(\d+)\./.exec(heading)?.[1];
  return n ? `section-${n}` : undefined;
}
