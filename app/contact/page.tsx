import type { Metadata } from "next";
import { AskButton } from "@/components/AskButton";
import { SectionBar } from "@/components/SectionBar";
import { SITE } from "@/content/site";
import { fitWord } from "@/components/fit";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about a product, an install, or a license — email DS Universe.",
  alternates: { canonical: "/contact" },
};

/** What people write about (DS-Universe-3 app/contact/page.tsx; "themes" left
 *  out — the Color theme property was removed on 2026-10-27). */
const ROUTES = [
  { label: "Before you buy", text: "Which tool fits what you trade, what it needs to run, what it does not do." },
  { label: "Installing", text: "Import, first-run settings, and getting a product onto the right chart." },
  {
    label: "Licenses",
    text: "Activation, a wrong or changed NinjaTrader email, and anything to do with your order. A license belongs to your NinjaTrader account, so a new computer needs nothing from us.",
  },
];

/** Contact, white (ported 2026-10-29 from DS-Universe-3 so the white site
 *  stands on its own as dsuniverse.net). One address; Help's "Ask us" beside it. */
export default function ContactPage() {
  return (
    <>
      <section className="wb store-head" aria-labelledby="contact-title" data-section="">
        <div className="store-grid">
          <div className="t">
            <p className="pp-label">Contact</p>
            <h1 id="contact-title" className="d1 store-title">
              A person answers.
            </h1>
          </div>
          <div className="s">
            <p className="lead">One address for everything. Say which product and, if it is an install question, which NinjaTrader build.</p>
          </div>
        </div>
      </section>

      <SectionBar n="01" title="Write to us" sub={`${SITE.city} · replies during US market hours, usually the same day.`} />
      <section className="wb sbar-after" aria-label="Write to us">
        <div className="reader-head-grid">
          <div className="t">
            <p className="d2 fit" style={fitWord(SITE.email)}>
              <a className="lnk" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </p>
            <p style={{ marginTop: 28 }}>
              <AskButton className="btn">Ask from this page</AskButton>
            </p>
          </div>
          <div className="s">
            <ul className="points" style={{ marginTop: 0 }}>
              {ROUTES.map((r) => (
                <li key={r.label}>
                  <p className="d4">{r.label}</p>
                  <p className="body" style={{ marginTop: 6 }}>
                    {r.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
