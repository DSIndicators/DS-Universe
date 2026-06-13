"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { cn } from "@/components/ui/cn";

const LINKS = [
  { label: "Indicators", href: "/#indicators" },
  { label: "Features", href: "/#features" },
  { label: "Showcase", href: "/showcase" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/#docs" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "glass-strong border-b border-white/[0.08]"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Brand */}
        <a href="/#top" className="flex items-center gap-3">
          <Image
            src="/brand/emblem.png"
            alt="DS Universe emblem"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full"
            priority
          />
          <span className="font-sans text-lg font-bold tracking-tight">
            <span className="text-ink-white">DS</span>{" "}
            <span className="text-ink-gray">UNIVERSE</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-gray transition-colors hover:text-ink-white"
            >
              {l.label}
            </a>
          ))}
          <GlowButton href="/#pricing" className="px-5 py-2 text-xs">
            Get Access
          </GlowButton>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="text-ink-white md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="glass-strong border-t border-white/[0.08] md:hidden">
          <div className="flex flex-col gap-1 px-5 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-gray transition-colors hover:bg-white/[0.04] hover:text-ink-white"
              >
                {l.label}
              </a>
            ))}
            <GlowButton
              href="/#pricing"
              className="mt-2 w-full"
            >
              Get Access
            </GlowButton>
          </div>
        </div>
      )}
    </header>
  );
}
