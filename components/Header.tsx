"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/content/site";
import { FocusSwitch } from "@/components/FocusSwitch";

/**
 * The header: a text wordmark (the new helmet mark is white-on-black and waits
 * for Tom's white-site version), four plain links and one "Get started". No
 * box; a hairline appears under it once the page moves. Since 2026-10-26 night
 * every tab is a page of its own (Products, Free Vault), never a scroll of home. The page you are on
 * is marked by ink and a short teal underline.
 */
const LINKS = [
  { label: "Home", href: "/", cls: "hdr-far hdr-home" },
  { label: "Products", href: "/products", cls: "hdr-mid" },
  { label: "NinjaTrader", href: "/ninjatrader", cls: "hdr-far" },
  { label: "About", href: "/about", cls: "hdr-far" },
];
/** The Free Vault sits apart from the plain tabs (Tom, 2026-10-27: "making
 *  FREE VAULT stand out more"): an outlined teal control beside the solid
 *  "Get started", so the free way in and the paid way in read as the pair. */
const VAULT = { label: "Free Vault", href: "/free-vault" };

/** A tab is current on its own page and on every page under it
 *  (/products/zones keeps "Products" marked). */
const here = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

/** The helmet's size rungs (public/brand), so the browser never shrinks a big file 15x. */
const MARK = (tone: "black" | "white") =>
  [[48, 46], [72, 70], [96, 93], [144, 139]].map(([h, w]) => `/brand/ds-mark-${tone}-${h}.png ${w}w`).join(", ");

export function Header() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 8);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  // Small screens: the four links live behind one "Menu" — a sheet under the
  // header, closed by a link, the button, Escape or a tap outside.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  // WHERE YOU ARE (2026-10-26 late night): the name of the section the reader
  // has scrolled into, read off the last [data-section] whose top has passed
  // under the header. Measured on scroll in one animation frame; nothing moves
  // the layout.
  const [where, setWhere] = useState("");
  const tide = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = (document.querySelector<HTMLElement>(".hdr")?.offsetHeight ?? 84) + 24;
      let name = "";
      for (const el of document.querySelectorAll<HTMLElement>("[data-section]")) {
        // a hidden copy (the reader's mobile list on a wide screen, or the
        // other way round) has no box and reports top 0: skip it
        if (el.getClientRects().length === 0) continue;
        if (el.getBoundingClientRect().top <= line) name = el.dataset.section ?? "";
      }
      setWhere(name);
      // the tide line: how far down the page you are (a transform only)
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (tide.current) tide.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    // the reader renames its section AFTER the scroll that moved it on a step:
    // re-read whenever any data-section changes, so the label never lags
    const mo = new MutationObserver(on);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-section"] });
    return () => {
      mo.disconnect();
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [path]);
  useEffect(() => {
    if (!open) return;
    // The sheet opens right under the header wherever the header is: below the
    // partner strip at the top of a page, at the very top once scrolled (it
    // used to open at a fixed 68px and covered the header under the strip).
    const h = document.querySelector<HTMLElement>(".hdr");
    if (h) document.documentElement.style.setProperty("--sheet-top", `${Math.round(h.getBoundingClientRect().bottom)}px`);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);
  return (
    <header className="hdr" data-scrolled={scrolled || open}>
      <span ref={tide} className="hdr-tide" aria-hidden="true" />
      <div className="hdr-left">
        <Link href="/" className="hdr-mark" aria-label={`${SITE.name}, home`}>
          {/* The helmet from Tom's logo; the white one shows on the dark page. */}
          <img className="hdr-logo hdr-logo-b" src="/brand/ds-mark-black-72.png" srcSet={MARK("black")} sizes="38px" width={441} height={456} alt="" />
          <img className="hdr-logo hdr-logo-w" src="/brand/ds-mark-white-72.png" srcSet={MARK("white")} sizes="38px" width={441} height={456} alt="" />
          <span data-nobio="">{SITE.name}</span>
        </Link>
        <span className="hdr-where" data-on={where !== ""} aria-hidden="true">
          <span key={where}>{where}</span>
        </span>
      </div>
      <nav className="hdr-nav" aria-label="Main">
        <FocusSwitch variant="header" />
        {LINKS.map((l) => (
          <Link key={l.label} className={l.cls} href={l.href} aria-current={here(path, l.href) ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
        <Link className="hdr-vault" href={VAULT.href} aria-current={here(path, VAULT.href) ? "page" : undefined}>
          {VAULT.label}
        </Link>
        <Link className="hdr-go" href="/products#complete">
          Get started
        </Link>
        <button type="button" className="hdr-menu" aria-expanded={open} aria-controls="menu-sheet" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Menu"}
        </button>
      </nav>
      <div id="menu-sheet" className="sheet" data-open={open} aria-hidden={!open} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <ul>
          {[...LINKS.slice(0, 2), VAULT, ...LINKS.slice(2)].map((l) => (
            <li key={l.label}>
              <Link href={l.href} tabIndex={open ? 0 : -1} aria-current={here(path, l.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="sheet-focus">
          <FocusSwitch />
        </div>
      </div>
    </header>
  );
}
