import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about a product, an install, or a licence — email DS Universe.",
};

const ROUTES = [
  { label: "Before you buy", text: "Which tool fits what you trade, what it needs to run, what it does not do." },
  { label: "Installing", text: "Import, first-run settings, themes, and getting a product onto the right chart." },
  { label: "Licences", text: "Access, transfers to a new machine, and anything to do with your order." },
];

export default function ContactPage() {
  return (
    <section className="wrap grid gap-12 pb-24 pt-12 sm:pt-16 lg:grid-cols-12 lg:pb-32 lg:pt-20">
      <Reveal className="lg:col-span-6">
        <p className="label">Contact</p>
        <h1 className="display-lg mt-5 text-ink text-balance">A person answers.</h1>
        <p className="lede mt-6 max-w-md text-pretty">
          One address for everything. Say which product and, if it is an install question, which NinjaTrader build.
        </p>
        <a
          href={`mailto:${SITE.email}`}
          className="display-md mt-10 inline-block text-ink underline decoration-line decoration-1 underline-offset-8 transition-colors hover:decoration-gold"
        >
          {SITE.email}
        </a>
        <p className="mt-6 text-[14px] text-mute">{SITE.city} · replies during US market hours, usually the same day.</p>
      </Reveal>
      <Reveal className="lg:col-span-5 lg:col-start-8" delay={100}>
        <ul className="divide-y divide-line border-y border-line">
          {ROUTES.map((r) => (
            <li key={r.label} className="py-6">
              <p className="text-[16px] text-ink">{r.label}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate">{r.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
