"use client";

import Link from "next/link";
import { cta } from "@/content/launch";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { NAV, SITE } from "@/content/site";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-silk ${
        scrolled ? "border-b border-line bg-white/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="wrap flex h-[76px] items-center justify-between">
        <Link href="/" className="group flex items-center gap-3" aria-label={`${SITE.name} — home`}>
          <Badge size={34} className="ring-1 ring-black/10 transition-transform duration-500 ease-silk group-hover:scale-105" />
          <span className="font-display text-[19px] font-medium tracking-[-0.01em] text-ink">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`text-[15px] transition-colors duration-200 ${
                  active ? "text-ink" : "text-slate hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <Link href="/products" className="btn-ghost h-11 px-5">
            {cta("Get access", "See what's coming")}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white md:hidden"
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 top-0 h-[1.5px] w-5 bg-ink transition-transform duration-300 ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[6px] h-[1.5px] w-5 bg-ink transition-opacity duration-200 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[12px] h-[1.5px] w-5 bg-ink transition-transform duration-300 ${
                open ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-b border-line bg-white md:hidden"
      >
        <nav className="wrap flex flex-col py-3" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="py-3.5 text-[17px] text-ink">
              {n.label}
            </Link>
          ))}
          <Link href="/products" className="btn-primary mb-3 mt-2">
            {cta("Get access", "See what's coming")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
