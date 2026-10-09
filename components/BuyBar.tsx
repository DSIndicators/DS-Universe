"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * THE BUY BAR (2026-10-09). Once the product page's buy box has scrolled out
 * of view, a slim bar holds the product's name, its line, its price and its
 * button at the foot of the window, the way a store's product page keeps the
 * purchase one tap away while the visitor reads on. It leaves again when the
 * buy box comes back, and when the footer is reached so the disclosures there
 * are never covered. While it shows, the Help tab lifts above it (globals.css,
 * html[data-buybar]).
 *
 * `watch` is the id of the element whose leaving the view brings the bar in.
 * The contents are rendered on the server and passed in.
 */
export function BuyBar({ watch, children }: { watch: string; children: ReactNode }) {
  const [on, setOn] = useState(false);

  // Measured on scroll and resize (one frame at a time), not with an
  // IntersectionObserver: a jump straight past the box — an anchor, a restored
  // scroll position — never crosses it, so an observer would never report it.
  useEffect(() => {
    const el = document.getElementById(watch);
    const foot = document.querySelector("footer");
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const past = el.getBoundingClientRect().bottom < 0;
      const atFoot = foot ? foot.getBoundingClientRect().top < window.innerHeight : false;
      setOn(past && !atFoot);
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [watch]);

  useEffect(() => {
    const root = document.documentElement;
    if (on) root.dataset.buybar = "on";
    else delete root.dataset.buybar;
    return () => {
      delete root.dataset.buybar;
    };
  }, [on]);

  return (
    <div
      className={`buy-bar fixed inset-x-0 bottom-0 z-[45] border-t border-line-strong bg-[rgba(9,11,14,0.92)] backdrop-blur-md transition-[transform,opacity] duration-500 ease-silk ${
        on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      aria-hidden={!on}
      inert={!on}
    >
      <div className="wrap flex h-[64px] items-center gap-4 pb-[env(safe-area-inset-bottom)] sm:gap-6">{children}</div>
    </div>
  );
}
