import Link from "next/link";
import { FocusSwitch } from "@/components/FocusSwitch";
import { DISCLOSURE, SITE } from "@/content/site";

/** Every page's foot: the links, the contact, and every disclosure in full
 *  (NinjaTrader vendor guidelines: visible body text on every page). */
export function Footer() {
  const site = [
    { label: "Products", href: "/products" },
    { label: "Free Vault", href: "/free-vault" },
    { label: "NinjaTrader", href: "/ninjatrader" },
    { label: "About", href: "/about" },
  ];
  const help = [
    { label: "Contact", href: "/contact" },
    { label: "Terms", href: "/terms" },
    { label: "Disclosures", href: "/disclosures" },
  ];
  return (
    <footer className="ftr">
      <div className="wb">
        <div className="ftr-grid">
          <div className="ftr-logo">
            {/* Tom's logo exactly as he made it (DS Media\01 Brand\Minimal logo), on
                no plate: black on the light footer, white on the dark page. */}
            <img className="logo-b" src="/brand/ds-logo-black-480.png" srcSet="/brand/ds-logo-black-480.png 480w, /brand/ds-logo-black-720.png 720w, /brand/ds-logo-black.png 1254w" sizes="240px" width={1254} height={1254} alt="DS Universe, Trading Indicators" loading="lazy" decoding="async" />
            <img className="logo-w" src="/brand/ds-logo-white-480.png" srcSet="/brand/ds-logo-white-480.png 480w, /brand/ds-logo-white-720.png 720w, /brand/ds-logo-white.png 1254w" sizes="240px" width={1254} height={1254} alt="DS Universe, Trading Indicators" loading="lazy" decoding="async" />
          </div>
          <div className="ftr-col">
            <p className="d4">{SITE.name}</p>
            <ul>
              {site.map((l) => (
                <li key={l.label}>
                  <Link className="lnk lnk-quiet lnk-bare" href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="ftr-col">
            <p className="d4">Help</p>
            <ul>
              {help.map((l) => (
                <li key={l.label}>
                  <Link className="lnk lnk-quiet lnk-bare" href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="ftr-col">
            <p className="d4">Contact</p>
            <ul>
              <li>
                <a className="lnk" href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
              </li>
              <li className="body">Built in {SITE.city}</li>
              <li className="body">
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
          <p data-nobio="">© 2026 {SITE.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
