import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { DISCLOSURE, SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Risk Disclosures",
  description:
    "Futures risk disclosure, CFTC hypothetical performance disclosure, and trademark notice for DS Universe.",
};

/**
 * One page carrying every disclosure in full.
 *
 * WHY IT EXISTS (2026-09-10): the disclosures already appear in the footer of
 * every page, which is what the vendor guidelines require of a website. But
 * Appendix A also requires a risk disclosure LINK in the profile description of
 * every social channel, and a profile bio has room for one short URL and no
 * room for an explanation. dsuniverse.net/disclosures is that URL — a reviewer
 * following it from a bio lands on the disclosures themselves rather than on a
 * marketing page they have to scroll to the bottom of.
 *
 * The text is identical to the footer's, read from the same constants, so the
 * two can never drift. Nothing is paraphrased: the risk and hypothetical
 * performance wording is verbatim from Appendix A and the trademark statement
 * verbatim from the guidelines.
 *
 * IF YOU ADD A SOCIAL CHANNEL, put this URL in its bio.
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
    <section className="wrap pb-24 pt-12 sm:pt-16 lg:pt-20">
      <Reveal className="mx-auto max-w-3xl">
        <p className="label">Required disclosures</p>
        <h1 className="display-lg mt-5 text-ink">Risk disclosures</h1>
        <p className="body hairline mt-10 pt-10">
          These apply to everything DS Universe publishes, on this site and on any channel we post
          to. They are reproduced in the footer of every page as well.
        </p>

        <div className="mt-12 space-y-10">
          {blocks.map((b) => (
            <section key={b.heading}>
              <h2 className="display-sm text-ink">{b.heading}</h2>
              <p className="body mt-4">{b.body}</p>
            </section>
          ))}
        </div>

        <p className="hairline mt-12 pt-8 text-[15px] leading-relaxed text-slate">
          Questions about any of the above:{" "}
          <a href={`mailto:${SITE.email}`} className="text-ink underline decoration-line underline-offset-4 hover:decoration-gold">
            {SITE.email}
          </a>
          .
        </p>
      </Reveal>
    </section>
  );
}
