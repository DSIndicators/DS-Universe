import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { PREAMBLE, SECTIONS, TERMS_LAST_UPDATED } from "@/content/terms";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern the purchase and use of DS Universe software.",
};

export default function TermsPage() {
  return (
    <section className="wrap pb-24 pt-12 sm:pt-16 lg:pt-20">
      <Reveal className="mx-auto max-w-3xl">
        <p className="label">Fine print</p>
        <h1 className="display-lg mt-5 text-ink">Terms &amp; Conditions</h1>
        <p className="label mt-4">Last updated {TERMS_LAST_UPDATED}</p>
        <p className="body hairline mt-10 pt-10">{PREAMBLE}</p>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="display-sm text-ink">{s.heading}</h2>
              <div className="mt-4 space-y-4">
                {s.blocks.map((b, i) =>
                  b.ul ? (
                    <ul key={i} className="body list-disc space-y-2 pl-5">
                      {b.ul.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i} className="body">{b.p}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <p className="hairline mt-12 pt-8 text-[14px] italic text-mute">
          By installing or using DS Universe software, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. Questions:{" "}
          <a href={`mailto:${SITE.email}`} className="text-ink hover:text-gold-deep">{SITE.email}</a>.
        </p>
      </Reveal>
    </section>
  );
}
