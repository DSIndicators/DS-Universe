"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type StoreBarItem = { id: string; label: string; price?: string };
type View = "covers" | "list";

/** Navbar (76px) + this bar (~57px) + breathing room. Sections use scroll-mt-[148px]. */
const SPY_LINE = 160;

/**
 * The store bar — the one control strip on /products (2026-09-27, the merge of
 * /products and /pricing).
 *
 * LEFT: every series as a jump link WITH its price, then DS Complete, then the
 * FAQ. Read left to right it is the whole price sheet in one line, and it stays
 * in reach while the store scrolls (sticky, under the navbar). The chip for the
 * section on screen is marked, so the bar also says where you are.
 *
 * RIGHT: Covers | Price list. Same products, same numbers, two ways to scan.
 * The choice lives in the URL (?view=list) so it can be linked — the retired
 * /pricing URL redirects to it — and on <html data-store-view>, which
 * globals.css reads to show one body of each shelf. A tiny inline script in the
 * page sets that attribute before first paint, so a /products?view=list load
 * never flashes the covers first.
 *
 * Deliberately NOT remembered in browser storage: a visitor who lands on the
 * store from a product page should find the covers, not a mode they switched on
 * a week ago and forgot.
 */
export function StoreBar({ items }: { items: StoreBarItem[] }) {
  const [view, setView] = useState<View>("covers");
  const [active, setActive] = useState<string | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  const apply = useCallback((v: View, write: boolean) => {
    setView(v);
    document.documentElement.dataset.storeView = v;
    if (write) {
      const u = new URL(window.location.href);
      if (v === "list") u.searchParams.set("view", "list");
      else u.searchParams.delete("view");
      window.history.replaceState(window.history.state, "", u);
    }
  }, []);

  // The URL decides the first view — also after a client-side navigation, where
  // the page's inline script does not run.
  useEffect(() => {
    apply(new URLSearchParams(window.location.search).get("view") === "list" ? "list" : "covers", false);
    return () => {
      delete document.documentElement.dataset.storeView;
    };
  }, [apply]);

  // Which section is on screen.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let cur: string | null = null;
        for (const it of items) {
          const el = document.getElementById(it.id);
          if (el && el.getBoundingClientRect().top <= SPY_LINE) cur = it.id;
        }
        setActive(cur);
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [items, view]);

  // On a phone the chips scroll sideways: keep the marked one in sight.
  useEffect(() => {
    const r = rail.current;
    if (!active || !r) return;
    const a = r.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!a) return;
    const out = a.offsetLeft < r.scrollLeft || a.offsetLeft + a.offsetWidth > r.scrollLeft + r.clientWidth;
    if (out) r.scrollTo({ left: Math.max(0, a.offsetLeft - 8), behavior: "smooth" });
  }, [active]);

  const switchTo = (v: View) => {
    if (v === view) return;
    // Keep the reader on the series they were looking at: the two views have
    // different heights, so without this the page lands somewhere unrelated.
    const stuck = bar.current ? bar.current.getBoundingClientRect().top <= 77 : false;
    const anchor = stuck ? active : null;
    apply(v, true);
    if (anchor) {
      requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
      });
    }
  };

  return (
    <div ref={bar} className="sticky top-[76px] z-40 border-y border-line bg-ground/90 backdrop-blur-md">
      <div className="wrap flex h-14 items-center gap-3">
        <nav aria-label="Store sections" className="relative min-w-0 flex-1">
          <div ref={rail} className="no-scrollbar relative -my-2 flex gap-1.5 overflow-x-auto py-2 pr-6 [mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)]">
            {items.map((it) => {
              const on = active === it.id;
              return (
                <a
                  key={it.id}
                  data-id={it.id}
                  href={`#${it.id}`}
                  aria-current={on ? "location" : undefined}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13.5px] transition-colors duration-200 ${
                    on
                      ? "border-gold/40 bg-gold-soft text-ink"
                      : "border-line bg-surface text-slate hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {it.label}
                  {it.price && <span className="text-[12.5px] tabular-nums text-gold-deep">{it.price}</span>}
                </a>
              );
            })}
          </div>
        </nav>

        <div role="group" aria-label="View" className="flex h-9 shrink-0 items-center rounded-full border border-line bg-surface p-0.5">
          <ViewButton on={view === "covers"} onClick={() => switchTo("covers")} label="Covers">
            <path d="M2.5 2.5h4v5h-4zM9.5 2.5h4v5h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z" />
          </ViewButton>
          <ViewButton on={view === "list"} onClick={() => switchTo("list")} label="Price list">
            <path d="M2.5 4h1M6 4h7.5M2.5 8h1M6 8h7.5M2.5 12h1M6 12h7.5" />
          </ViewButton>
        </div>
      </div>
    </div>
  );
}

function ViewButton({
  on,
  onClick,
  label,
  children,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] transition-colors duration-200 sm:px-3 ${
        on ? "bg-ivory text-ground" : "text-slate hover:text-ink"
      }`}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
      {/* Words from 640px up; below, the icon carries it and the name is still read out. */}
      <span className="sr-only sm:not-sr-only">{label}</span>
    </button>
  );
}
