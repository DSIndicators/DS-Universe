import Image from "next/image";
import Link from "next/link";
import { Twitter, Youtube, Send, Mail } from "lucide-react";

const COLUMNS = [
  {
    heading: "Radars",
    links: ["Pilots", "Sweeper", "Everguard"],
  },
  {
    heading: "Systems",
    links: ["Orbit", "Stars", "Balance", "Ember", "Council", "Pulse"],
  },
  {
    heading: "Company",
    links: ["Pricing", "Docs", "Contact", "Terms"],
  },
];

const SOCIALS = [
  { icon: Twitter, label: "X / Twitter", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
  { icon: Send, label: "Telegram", href: "#" },
  { icon: Mail, label: "Email", href: "mailto:hello@dsuniverse.example" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand block */}
          <div className="col-span-2 flex flex-col gap-4">
            <Link href="#top" className="flex items-center gap-3">
              <Image
                src="/brand/emblem.png"
                alt="DS Universe emblem"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
              />
              <span className="font-sans text-lg font-bold tracking-tight">
                <span className="text-ink-white">DS</span>{" "}
                <span className="text-ink-gray">UNIVERSE</span>
              </span>
            </Link>
            <p className="label-caps !tracking-[0.25em]">
              Intraday Futures Intelligence
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-ink-gray">
              MNQ / MES — precision from orbit. Nine instruments, one mind.
            </p>
            <div className="mt-2 flex gap-3">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-ink-gray transition-colors hover:border-white/20 hover:text-ink-white"
                  >
                    <Icon size={16} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h4 className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-gray/70">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-sm text-ink-gray transition-colors hover:text-ink-white"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.06] pt-8 text-xs text-ink-gray/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DS Universe. All rights reserved.</p>
          <p className="max-w-2xl leading-relaxed">
            Trading futures involves substantial risk. DS Universe indicators are
            analytical tools, not financial advice or trade signals. Past
            performance is not indicative of future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
