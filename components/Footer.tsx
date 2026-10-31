import Link from "next/link";
import { FocusSwitch } from "./FocusSwitch";
import { DISCLOSURE, SITE } from "@/content/site";

/** Every page's foot: the links, the contact, and every disclosure in full
 *  (NinjaTrader vendor guidelines: visible body text on every page). */
export function Footer() {
  const cols = [
    {
      title: "The vaults",
      links: [
        { label: "Essentials Vault", href: "/essentials" },
        { label: "Free Vault", href: "/free-vault" },
        { label: "How it works", href: "/how-it-works" },
        { label: "Your vault", href: "/members" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "Contact", href: "/contact" },
        { label: "NinjaTrader", href: "/ninjatrader" },
        { label: "Terms", href: "/terms" },
        { label: "Disclosures", href: "/disclosures" },
      ],
    },
  ];
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          <div className="ftr-brand">
            <img src="/brand/ds-logo-black-480.png" srcSet="/brand/ds-logo-black-480.png 480w, /brand/ds-logo-black-720.png 720w" sizes="128px" width={1254} height={1254} alt="DS Universe, Trading Indicators" loading="lazy" decoding="async" />
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="d4">{c.title}</p>
              <ul>
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="d4">Contact</p>
            <ul>
              <li>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li className="small">Built in {SITE.city}</li>
              <li className="small">
                For {SITE.platform}, version {SITE.minBuild} or newer
              </li>
              <li>
                <FocusSwitch />
              </li>
            </ul>
          </div>
        </div>
        <div className="ftr-legal" id="disclosures">
          <p>{DISCLOSURE.risk}</p>
          <p>{DISCLOSURE.hypothetical}</p>
          <p>{DISCLOSURE.short}</p>
          <p>
            {DISCLOSURE.long} {DISCLOSURE.chart}
          </p>
          <p>{DISCLOSURE.trademark}</p>
          <p data-nobio="">© {SITE.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
