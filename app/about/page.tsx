import type { Metadata } from "next";
import Link from "next/link";
import { AskButton } from "@/components/AskButton";
import { WideFigure } from "@/components/Wide";
import { SectionBar } from "@/components/SectionBar";
import { WIDE } from "@/content/capabilities";
import { ABOUT, CLOSING, FACTS, PRINCIPLES, SITE } from "@/content/site";

export const metadata: Metadata = { title: "About", description: SITE.description };

/**
 * About, in the white wide-body style. Every line is content/site.ts's own
 * (ABOUT, FACTS, PRINCIPLES, CLOSING). The live site's extra sentence about a
 * guide shipping with every product is left out: the guide zips were retired
 * on 2026-10-25 (Patch Notes & Versions U-071).
 */
export default function AboutPage() {
  return (
    <>
      <section className="wb about-hero about-brand" aria-labelledby="about-title" data-section="">
        <h1 id="about-title" className="d2 about-h1">
          {ABOUT.heading}
        </h1>
        {/* Who is speaking: Tom's logo, exactly as he made it. */}
        <img className="about-logo" src="/brand/ds-logo-black-720.png" srcSet="/brand/ds-logo-black-480.png 480w, /brand/ds-logo-black-720.png 720w, /brand/ds-logo-black.png 1254w" sizes="(min-width: 1101px) 380px, 260px" width={1254} height={1254} alt="DS Universe, Trading Indicators" decoding="async" />
      </section>

      <section className="wb about-grid" aria-label="What DS Universe is">
        <dl className="facts">
          {FACTS.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className="about-copy">
          {ABOUT.paragraphs.map((p, i) => (
            <p key={p} className={i === 0 ? "lead" : "body"}>
              {p}
            </p>
          ))}
        </div>
      </section>

      <WideFigure pic={WIDE.free} />

      <SectionBar n="01" title="How it is built" />
      <section className="wb sbar-after" aria-label="How it is built">
        <ul className="principles" style={{ marginTop: 0 }}>
          {PRINCIPLES.map((p) => (
            <li key={p.title}>
              <h3 className="d3">{p.title}</h3>
              <p className="body">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="complete field" data-section={CLOSING.heading} aria-labelledby="closing-title">
        <div className="wb complete-grid">
          <div className="l">
            <h2 id="closing-title" className="d2">
              {CLOSING.heading}
            </h2>
          </div>
          <div className="r">
            <p className="lead">{CLOSING.text}</p>
            <div className="hero-links" style={{ marginTop: 30 }}>
              <Link className="btn" href="/free-vault">
                {CLOSING.primary.label}
              </Link>
              <AskButton className="lnk" style={{ alignSelf: "center" }}>
                {CLOSING.secondary.label}
              </AskButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
