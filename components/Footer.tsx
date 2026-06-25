import Image from "next/image";
import Link from "next/link";
import { Twitter, Youtube, Send, Mail } from "lucide-react";
import { TermsModal } from "@/components/TermsModal";

const SUPPORT_EMAIL = "support@dsuniverse.net";

// Product columns link into the Showcase, where every brochure lives.
const COLUMNS = [
  {
    heading: "Radars",
    links: ["Pilots", "Sweeper", "Beacon"],
  },
  {
    heading: "Systems",
    links: ["Orbit", "Stars", "Balance", "Ember", "Council", "Pulse"],
  },
];

const SOCIALS = [
  { icon: Twitter, label: "X / Twitter", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
  { icon: Send, label: "Telegram", href: "#" },
  { icon: Mail, label: "Email", href: `mailto:${SUPPORT_EMAIL}` },
];

export function Footer() {
  return (
    <footer className="relative border-t border-[#e3b24f]/[0.05] py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand block */}
          <div className="col-span-2 flex flex-col gap-4">
            <Link href="#top" className="flex items-center gap-3">
              <Image
                src="/brand/emblem.png"
                alt="DS Universe emblem"
                width={44}
                height={44}
                className="h-10 w-10 object-contain"
              />
              <span className="font-sans text-lg font-bold tracking-tight">
                <span className="text-ink-white">DS</span>{" "}
                <span className="text-ink-gray">UNIVERSE</span>
              </span>
            </Link>
            <p className="label-caps !tracking-[0.25em]">
              Futures Intelligence · Every Timeframe
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-ink-gray">
              Built for every timeframe — precision from orbit. The DS Systems,
              run on one mind.
            </p>

            {/* Built-for-NinjaTrader badge */}
            <div className="mt-1 flex flex-col items-start gap-2">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-ink-gray/60">
                Built for
              </span>
              <Image
                src="/brand/ninjatrader.png"
                alt="NinjaTrader 8"
                width={600}
                height={119}
                className="h-7 w-auto"
                style={{ filter: "drop-shadow(0 0 10px rgba(255,90,20,0.45))" }}
              />
            </div>
            <div className="mt-2 flex gap-3">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e3b24f]/[0.06] bg-white/[0.03] text-ink-gray transition-colors hover:border-[#e3b24f]/[0.16] hover:text-ink-white"
                  >
                    <Icon size={16} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Product columns → Showcase */}
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h4 className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-gray/70">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="/showcase"
                      className="text-sm text-ink-gray transition-colors hover:text-ink-white"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Company */}
          <div className="flex flex-col gap-3">
            <h4 className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-gray/70">
              Company
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="/#pricing"
                  className="text-sm text-ink-gray transition-colors hover:text-ink-white"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/showcase"
                  className="text-sm text-ink-gray transition-colors hover:text-ink-white"
                >
                  Showcase
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sm text-ink-gray transition-colors hover:text-ink-white"
                >
                  Contact
                </a>
              </li>
              <li>
                <TermsModal />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-[#e3b24f]/[0.05] pt-8 text-xs text-ink-gray/70">
          <div>
            <h4 className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-gray/70">
              Disclaimer
            </h4>
            <p className="max-w-4xl leading-relaxed">
              DS Universe provides free tools and paid premium suites, all
              designed as confirmation aids, not trading signals. Nothing provided
              by DS Universe constitutes financial advice, investment
              recommendations, or an offer to buy or sell any financial instrument.
              Trading futures and other leveraged products involves substantial
              risk and may not be suitable for all traders. Past performance does
              not guarantee future results. Users are fully responsible for their
              own trading decisions. DS Universe is not a broker, financial
              advisor, or CTA. All tools are provided for educational and
              informational purposes only.
            </p>
          </div>
          <p>© {new Date().getFullYear()} DS Universe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
