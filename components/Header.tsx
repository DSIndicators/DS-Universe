"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FocusSwitch } from "./FocusSwitch";

/**
 * The header: the helmet and name, three pages, then the way in.
 * Each tab is its own page (Tom, 2026-10-26), never a scroll of home.
 * Signed out: "Sign in" and the one solid button, "Join free".
 * Signed in:  "Your vault" (the members area); a free member also sees
 *             "Unlock Essentials", the one upgrade in view.
 */
const LINKS = [
  { label: "Essentials Vault", href: "/essentials" },
  { label: "Free Vault", href: "/free-vault" },
  { label: "NinjaTrader", href: "/ninjatrader" },
  { label: "How it works", href: "/how-it-works" },
];
const here = (path: string, href: string) => path === href || path.startsWith(href + "/");
const MARK = [[48, 46], [72, 70], [96, 93], [144, 139]].map(([h, w]) => `/brand/ds-mark-black-${h}.png ${w}w`).join(", ");

export type HeaderMember = { first: string; plan: "free" | "essentials" } | null;

export function Header({ member }: { member: HeaderMember }) {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [sheetTop, setSheetTop] = useState(0);
  const hdrRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    // The sheet opens right under the header, wherever the header is (the partner strip may still be in view).
    const place = () => setSheetTop(Math.round(hdrRef.current?.getBoundingClientRect().bottom ?? 0));
    place();
    window.addEventListener("resize", place);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      window.removeEventListener("resize", place);
      document.body.style.overflow = "";
    };
  }, [open]);

  const cta = member ? (
    member.plan === "free" ? (
      <Link className="btn btn-s hdr-cta" href="/members/unlock">
        Unlock Essentials
      </Link>
    ) : null
  ) : (
    <Link className="btn btn-s hdr-cta" href="/join">
      Join free
    </Link>
  );

  return (
    <header ref={hdrRef} className="hdr" data-scrolled={scrolled || open} data-open={open}>
      <div className="wrap hdr-in">
        <Link href="/" className="brand" aria-label="DS Universe, home">
          <img src="/brand/ds-mark-black-72.png" srcSet={MARK} sizes="30px" width={139} height={144} alt="" />
          <span data-nobio="">DS Universe</span>
        </Link>
        <nav className="nav" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={here(path, l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hdr-right">
          {member ? (
            <Link className="hdr-sign" href="/members" aria-current={here(path, "/members") ? "page" : undefined}>
              Your vault
            </Link>
          ) : (
            <Link className="hdr-sign" href="/signin">
              Sign in
            </Link>
          )}
          {cta}
          <button type="button" className="hdr-menu" aria-expanded={open} aria-controls="sheet" onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      <div id="sheet" className="sheet" data-open={open} style={open ? { top: sheetTop } : undefined}>
        <Link className="sheet-link" href="/" aria-current={path === "/" ? "page" : undefined}>
          Home
        </Link>
        {LINKS.map((l) => (
          <Link key={l.href} className="sheet-link" href={l.href} aria-current={here(path, l.href) ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
        <Link className="sheet-link" href={member ? "/members" : "/signin"}>
          {member ? "Your vault" : "Sign in"}
        </Link>
        <div className="sheet-foot">
          {!member && (
            <Link className="btn btn-wide" href="/join">
              Join free
            </Link>
          )}
          {member?.plan === "free" && (
            <Link className="btn btn-wide" href="/members/unlock">
              Unlock Essentials
            </Link>
          )}
          <FocusSwitch />
        </div>
      </div>
    </header>
  );
}
