import Link from "next/link";
import { cta } from "@/content/launch";
import { Badge } from "@/components/ui/Badge";
import { DISCLOSURE, NAV, SITE } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-mist">
      <div className="wrap py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Badge size={28} className="ring-1 ring-white/15" />
              <span className="font-display text-[length:calc(15px*var(--type))] font-medium text-ink">{SITE.name}</span>
            </div>
            <p className="mt-4 text-[length:calc(14px*var(--type))] leading-relaxed text-slate">{SITE.tagline}. {SITE.city}.</p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-3 inline-block text-[length:calc(14px*var(--type))] text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-gold"
            >
              {SITE.email}
            </a>
          </div>

          <nav className="flex gap-12" aria-label="Footer">
            <ul className="space-y-3 text-[length:calc(14px*var(--type))]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className={`transition-colors hover:text-ink ${n.vault ? "text-bull-text" : "text-slate"}`}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-3 text-[length:calc(14px*var(--type))]">
              <li>
                <Link href="/products" className="text-slate transition-colors hover:text-ink">
                  {cta("Get access", "See what's coming")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate transition-colors hover:text-ink">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/disclosures" className="text-slate transition-colors hover:text-ink">
                  Disclosures
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Disclosures — required on every page (NinjaTrader vendor guidelines):
            futures risk disclosure, CFTC hypothetical performance disclosure, and
            the verbatim NinjaTrader trademark statement.

            SIZE IS A COMPLIANCE PROPERTY, NOT A DESIGN ONE. The guidelines ask
            for the disclosures "in same or similar style text as the primary
            content that is easily visible", and Appendix A repeats it. These
            were set at 13.5px against 17px body copy, which reads as fine print
            — the single most flagged thing in a vendor review. They now match
            the footer's own primary text at 15px, in the same colour as body
            copy, with normal leading. Do not shrink them again. */}
        <div className="hairline mt-12 pt-8 [&>p+p]:mt-4 xl:columns-2 xl:gap-x-16 xl:[&>p+p]:mt-0 xl:[&>p]:mb-4 xl:[&>p]:break-inside-avoid">
          <p className="label">Disclosures</p>
          <p className="max-w-4xl text-[length:calc(14px*var(--type))] leading-relaxed text-slate xl:max-w-none">{DISCLOSURE.short}</p>
          <p className="max-w-4xl text-[length:calc(14px*var(--type))] leading-relaxed text-slate xl:max-w-none">
            <strong className="font-medium text-ink">Risk disclosure.</strong> {DISCLOSURE.risk}
          </p>
          <p className="max-w-4xl text-[length:calc(14px*var(--type))] leading-relaxed text-slate xl:max-w-none">
            <strong className="font-medium text-ink">Hypothetical performance disclosure.</strong>{" "}
            {DISCLOSURE.hypothetical}
          </p>
          <p className="max-w-4xl text-[length:calc(14px*var(--type))] leading-relaxed text-slate xl:max-w-none">{DISCLOSURE.long}</p>
          <p className="max-w-4xl text-[length:calc(14px*var(--type))] leading-relaxed text-slate xl:max-w-none">{DISCLOSURE.trademark}</p>
          <p className="pt-2 text-[length:calc(12.5px*var(--type))] text-mute">
            © {year} {SITE.name}. An independent software developer. Kinetick® is a registered
            trademark of its owner.
          </p>
        </div>
      </div>
    </footer>
  );
}
