import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ABOUT, CLOSING, FACTS, PRINCIPLES, SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: SITE.description,
};

export default function AboutPage() {
  return (
    <>
      <section className="wrap pt-12 sm:pt-16 lg:pt-20">
        <Reveal className="max-w-3xl">
          <p className="label">About</p>
          <h1 className="display-lg mt-5 text-ink text-balance">{ABOUT.heading}</h1>
        </Reveal>
      </section>

      <section className="wrap grid gap-12 py-16 md:grid-cols-12 lg:py-20">
        <Reveal className="md:col-span-4 lg:col-span-3">
          <dl className="space-y-7">
            {FACTS.map((f) => (
              <div key={f.label}>
                <dt className="flex items-center gap-2.5 text-[15px] text-ink">
                  <span className="block h-2 w-2 rounded-[2px] bg-gold" aria-hidden="true" />
                  {f.label}
                </dt>
                <dd className="mt-1.5 pl-[18px] text-[16px] text-slate">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal className="md:col-span-8 lg:col-span-8 lg:col-start-5" delay={80}>
          <div className="max-w-2xl space-y-5">
            {ABOUT.paragraphs.map((p) => (
              <p key={p} className="body text-pretty">{p}</p>
            ))}
            <p className="body text-pretty">
              DS Universe is made in {SITE.city} by a trader who builds the tools he trades with. Every product ships with a plain-English guide, and support is a person, not a form.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-line bg-mist">
        <div className="wrap grid gap-10 py-20 md:grid-cols-3 md:gap-8 lg:py-24">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 90} className="border-t border-line-strong pt-6">
              <h2 className="display-sm text-ink">{p.title}</h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-slate text-pretty">{p.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="wrap py-24 text-center lg:py-28">
        <Reveal>
          <h2 className="display-md text-ink">{CLOSING.heading}</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="btn-primary">Explore the products</Link>
            <Link href="/contact" className="btn-ghost">{CLOSING.secondary.label}</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
