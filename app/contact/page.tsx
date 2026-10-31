import type { Metadata } from "next";
import { SITE } from "@/content/site";

export const metadata: Metadata = { title: "Contact", description: "Questions about a vault, an install, or a license: email DS Universe." };

const ROUTES = [
  { label: "Before you join", text: "Which tools fit what you trade, what they need to run, what they do not do." },
  { label: "Installing", text: "Import, first-run settings, and getting a tool onto the right chart." },
  { label: "Licenses and membership", text: "Activation, a wrong or changed NinjaTrader email, billing, and anything to do with your membership. A license belongs to your NinjaTrader account, so a new computer needs nothing from us." },
];

export default function Contact() {
  return (
    <section className="hero">
      <div className="wrap split" style={{ alignItems: "start" }}>
        <div className="stack">
          <p className="kicker">Contact</p>
          <h1 className="d1">A person answers.</h1>
          <p className="lead">One address for everything. Say which tool and, for an install question, which NinjaTrader build.</p>
          <p className="d3">
            <a className="lnk" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
          </p>
          <p className="small">{SITE.city} · replies during US market hours, usually the same day.</p>
        </div>
        <ul className="rows" style={{ marginTop: 12 }}>
          {ROUTES.map((r) => (
            <li key={r.label} style={{ padding: "20px 0", borderBottom: "1px solid var(--rule)" }}>
              <p className="d4">{r.label}</p>
              <p className="body" style={{ marginTop: 6 }}>
                {r.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
