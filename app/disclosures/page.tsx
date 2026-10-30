import type { Metadata } from "next";
import { SectionBar } from "@/components/SectionBar";
import { DISCLOSURE, SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Risk Disclosures",
  description: "Futures risk disclosure, CFTC hypothetical performance disclosure, and trademark notice for DS Universe.",
  alternates: { canonical: "/disclosures" },
};

/**
 * Every disclosure in full, on one page (ported 2026-10-29 from DS-Universe-3
 * app/disclosures/page.tsx). WHY IT EXISTS: NinjaTrader's vendor guidelines
 * (Appendix A) want a risk-disclosure LINK in the profile of every social
 * channel; dsuniverse.net/disclosures is that link. The text is the footer's,
 * read from the same constants, so the two can never drift.
 */
export default function DisclosuresPage() {
  const blocks = [
    { heading: "Risk disclosure", body: DISCLOSURE.risk },
    { heading: "Hypothetical performance disclosure", body: DISCLOSURE.hypothetical },
    { heading: "What our software is", body: DISCLOSURE.short },
    { heading: "No performance record", body: DISCLOSURE.long },
    { heading: "Trademarks", body: DISCLOSURE.trademark },
  ];
  return (
    <>
      <section className="wb store-head legal-head" aria-labelledby="disc-title" data-section="">
        <p className="pp-label">Required disclosures</p>
        <h1 id="disc-title" className="d1 store-title">
          Risk disclosures
        </h1>
        <p className="lead legal-measure" style={{ marginTop: 28 }}>
          These apply to everything DS Universe publishes, on this site and on any channel we post to. They are reproduced in the footer of every page as well.
        </p>
      </section>

      <SectionBar n="01" title="In full" />
      <section className="wb sbar-after" aria-label="The disclosures">
        <div className="legal">
          {blocks.map((b) => (
            <section key={b.heading} className="legal-sec">
              <h2 className="d4">{b.heading}</h2>
              <p className="body">{b.body}</p>
            </section>
          ))}
          <p className="small legal-close">
            Questions about any of the above:{" "}
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
