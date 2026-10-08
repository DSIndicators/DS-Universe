"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { VAULT_PRODUCTS, productHref } from "@/content/release";
import { KEY_BY_ID, KEY_GROUPS, STORE_SIDE, VAULT_KEYS, searchProducts, suggest, universalNotes, type Hit, type VaultKey } from "@/content/vault-search";
import { shotFor } from "@/content/loupe";
import { Lens } from "@/components/Loupe";
import type { Product } from "@/content/products";
import { VaultMark } from "@/components/Vault";

/**
 * THE DEPOSITS — the Free Vault's search and its products (2026-10-08).
 *
 * SEARCH (content/vault-search.ts). One field and the feature keys under it.
 * Typing filters live (nine products, no round trip); a key is a toggle and
 * keys combine with AND. Each key shows how many products would remain if it
 * were added, and a key that would leave none is disabled — the page never
 * empties itself. A query the vault cannot answer says so and names the store
 * products that do. "/" focuses the field from anywhere, Esc clears it, and
 * the query lives in the address (?q=…&k=…) so a filtered vault can be
 * shared and survives Back.
 *
 * DISPLAY (content/loupe.ts). Every product is shown by its own
 * NinjaTrader chart, through a loupe: magnified on the place that proves
 * what it does, pulling back to the whole chart on hover or focus.
 *
 *   loupe    (the page's look) plates in a gallery grid: the magnified chart
 *            in a 3:2 frame with crop marks, the magnification read out in
 *            the corner, a plate under it.
 *   wall     the vault's wall of deposit boxes: brushed fronts, an engraved
 *            number, and the chart behind a wide viewing slot.
 *   exhibit  one product per row, the chart large with the indicator's own
 *            label pinned to the place it printed it, and the product's
 *            hooks beside it.
 * The other two looks are kept for comparison on a local preview only
 * (development, or ?look= in the address); visitors see the loupe.
 */

export type Look = "loupe" | "wall" | "exhibit";
const LOOKS: { id: Look; label: string }[] = [
  { id: "loupe", label: "Loupe" },
  { id: "wall", label: "Deposit wall" },
  { id: "exhibit", label: "Exhibit" },
];

const serial = (i: number) => `Nº ${String(i + 1).padStart(2, "0")}`;

/* ============================================================ THE THREE LOOKS */

function Why({ hit }: { hit?: Hit }) {
  if (!hit || !hit.why.length) return null;
  return (
    <ul className="mt-3 space-y-1.5 border-t border-dashed border-[rgba(201,165,94,0.22)] pt-3">
      {hit.why.slice(0, 3).map((w) => (
        <li key={w.key.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 text-[12.5px] leading-snug">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault pt-[2px]">{w.key.label}</span>
          <span className="text-slate text-pretty">{w.note}</span>
        </li>
      ))}
    </ul>
  );
}

function LoupePlate({ p, i, hit, priority }: { p: Product; i: number; hit?: Hit; priority: boolean }) {
  const shot = shotFor(p.slug);
  return (
    <li className="min-w-0">
      <Link href={productHref(p.slug)} className="vault-plate group block" aria-label={`${p.name} — ${p.category}. Free, in the Free Vault.`}>
        {shot ? (
          <Lens shot={shot} a={3 / 2} cssWidth={{ lg: 360, sm: "75vw", base: "150vw" }} priority={priority} showMark />
        ) : (
          <div className="aspect-[3/2] bg-[#040404]" />
        )}
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[rgba(201,165,94,0.2)] pt-3">
          <span className="font-mono text-[10px] tracking-[0.16em] text-mute">{serial(i)}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-vault">Free</span>
        </div>
        <h3 className="mt-2 font-display text-[17px] font-[500] tracking-[-0.012em] text-ink transition-colors group-hover:text-vault-light">{p.name}</h3>
        <p className="mt-0.5 text-[12.5px] text-mute">{p.category}</p>
        {hit?.why.length ? <Why hit={hit} /> : shot && <p className="mt-2.5 text-[13px] leading-snug text-slate text-pretty">{shot.reading}</p>}
      </Link>
    </li>
  );
}

function WallBox({ p, i, hit, priority }: { p: Product; i: number; hit?: Hit; priority: boolean }) {
  const shot = shotFor(p.slug);
  return (
    <li className="vault-box min-w-0">
      <Link href={productHref(p.slug)} className="group flex h-full flex-col p-5 sm:p-6" aria-label={`${p.name} — ${p.category}. Free, in the Free Vault.`}>
        <div className="flex items-center justify-between font-mono text-[10.5px] tracking-[0.22em] text-vault">
          <span>{serial(i)}</span>
          <span className="flex items-center gap-2 text-mute">
            <span className="text-[9.5px] uppercase tracking-[0.2em]">Free</span>
            <VaultMark className="text-vault" />
          </span>
        </div>
        <div className="vault-slot mt-4">
          {shot && <Lens shot={shot} a={21 / 9} cssWidth={{ lg: 340, sm: "45vw", base: "88vw" }} priority={priority} showMark={false} />}
        </div>
        <h3 className="mt-5 font-display text-[16.5px] font-[500] tracking-[-0.012em] text-ink transition-colors group-hover:text-vault-light">{p.name}</h3>
        <p className="mt-0.5 text-[12.5px] text-mute">{p.category}</p>
        {hit?.why.length ? <Why hit={hit} /> : null}
        <span className="mt-auto flex items-center gap-2 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-mute transition-colors group-hover:text-vault">
          Open the box
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </Link>
    </li>
  );
}

function ExhibitRow({ p, i, hit, priority }: { p: Product; i: number; hit?: Hit; priority: boolean }) {
  const shot = shotFor(p.slug);
  const right = i % 2 === 1;
  return (
    <li className="border-t border-[rgba(201,165,94,0.2)] py-10 first:border-t-0 first:pt-0 lg:py-14">
      <Link href={productHref(p.slug)} className="vault-plate group grid items-center gap-8 lg:grid-cols-12 lg:gap-12" aria-label={`${p.name} — ${p.category}. Free, in the Free Vault.`}>
        <div className={`lg:col-span-7 ${right ? "lg:order-last" : ""}`}>
          {shot && <Lens shot={shot} a={16 / 10} cssWidth={{ lg: 640, sm: "92vw", base: "92vw" }} priority={priority} showMark pinMark />}
        </div>
        <div className="lg:col-span-5">
          <p className="font-mono text-[10.5px] tracking-[0.2em] text-vault">
            {serial(i)} <span className="text-mute">· {p.category}</span>
          </p>
          <h3 className="display-md mt-3 text-ink transition-colors group-hover:text-vault-light">{p.name}</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-slate text-pretty">{p.purpose}</p>
          {hit?.why.length ? (
            <Why hit={hit} />
          ) : (
            <ul className="mt-5 border-t border-[rgba(201,165,94,0.18)]">
              {p.hooks.map((h) => (
                <li key={h} className="flex items-baseline gap-3 border-b border-[rgba(201,165,94,0.12)] py-2 text-[13px] text-ink">
                  <span className="h-px w-3 shrink-0 translate-y-[-3px] bg-vault" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          )}
          <span className="mt-6 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-vault">
            Open the deposit <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </Link>
    </li>
  );
}

/* ================================================================= SEARCH */

function readUrl() {
  if (typeof window === "undefined") return { q: "", k: [] as string[], look: null as Look | null };
  const sp = new URLSearchParams(window.location.search);
  const k = (sp.get("k") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => KEY_BY_ID[s]);
  const lk = sp.get("look");
  const look = LOOKS.some((l) => l.id === lk) ? (lk as Look) : null;
  return { q: sp.get("q") ?? "", k, look };
}

export function VaultRoom() {
  const products = VAULT_PRODUCTS;
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [look, setLook] = useState<Look>("loupe");
  const [compare, setCompare] = useState(process.env.NODE_ENV !== "production");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const ready = useRef(false);

  // The address is the state's home: read once, then kept in step.
  useEffect(() => {
    const u = readUrl();
    setQ(u.q);
    setPicked(u.k);
    if (u.look) {
      setLook(u.look);
      setCompare(true);
    }
    ready.current = true;
  }, []);
  useEffect(() => {
    if (!ready.current) return;
    const sp = new URLSearchParams(window.location.search);
    q.trim() ? sp.set("q", q.trim()) : sp.delete("q");
    picked.length ? sp.set("k", picked.join(",")) : sp.delete("k");
    const s = sp.toString();
    const url = `${window.location.pathname}${s ? `?${s}` : ""}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(window.history.state, "", url);
  }, [q, picked]);

  // "/" from anywhere on the page puts the cursor in the search.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const searching = q.trim().length > 0 || picked.length > 0;
  const hits = useMemo(() => searchProducts(products, q, picked), [products, q, picked]);
  const hitBy = useMemo(() => new Map(hits.map((h) => [h.slug, h])), [hits]);
  const shown = searching ? hits.map((h) => products.find((p) => p.slug === h.slug)!).filter(Boolean) : products;
  const indexOf = useMemo(() => new Map(products.map((p, i) => [p.slug, i])), [products]);
  const store = useMemo(() => (searching && hits.length === 0 && q.trim() ? searchProducts(STORE_SIDE, q, [], false).slice(0, 4) : []), [searching, hits.length, q]);

  /** How many products remain if this key were toggled on, with everything else as is. */
  const countWith = useCallback((id: string) => searchProducts(products, q, picked.includes(id) ? picked : [...picked, id]).length, [products, q, picked]);

  const notes = useMemo(() => universalNotes(q), [q]);
  const sugg = useMemo(() => (open ? suggest(q, products, picked) : []), [open, q, products, picked]);

  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const takeSuggestion = (k: VaultKey) => {
    // The suggestion becomes a key, and the word that found it leaves the field.
    const words = q.trim().split(/\s+/);
    words.pop();
    setQ(words.join(" "));
    setPicked((cur) => (cur.includes(k.id) ? cur : [...cur, k.id]));
    setOpen(false);
    setActive(-1);
  };
  const clearAll = () => {
    setQ("");
    setPicked([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (open && sugg.length) setOpen(false);
      else if (q) setQ("");
      return;
    }
    if (!sugg.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % sugg.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? sugg.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      takeSuggestion(sugg[active]);
    }
  };

  const status = !searching
    ? null
    : hits.length
      ? `${hits.length} of ${products.length} match`
      : `Nothing in the vault matches`;

  return (
    <div>
      {/* ------------------------------------------------------- the search */}
      <div className="vault-search" role="search">
        <div className="relative">
          <label htmlFor="vault-q" className="sr-only">
            Search the Free Vault by feature or name
          </label>
          <div className="vault-field flex items-center gap-3 px-4 sm:px-5">
            <svg viewBox="0 0 16 16" width="15" height="15" className="shrink-0 text-vault" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              <circle cx="7" cy="7" r="4.75" />
              <path d="M10.5 10.5 14 14" strokeLinecap="square" />
            </svg>
            <input
              ref={inputRef}
              id="vault-q"
              type="search"
              inputMode="search"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
                setActive(-1);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => window.setTimeout(() => setOpen(false), 120)}
              onKeyDown={onKeyDown}
              placeholder="Search — EMA, VWAP, momentum…"
              className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-mute focus:outline-none sm:text-[15.5px] [&::-webkit-search-cancel-button]:hidden"
              role="combobox"
              aria-expanded={open && sugg.length > 0}
              aria-controls="vault-sugg"
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 && sugg[active] ? `vault-sugg-${sugg[active].id}` : undefined}
            />
            {q || picked.length ? (
              <button type="button" onClick={clearAll} className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute transition-colors hover:text-vault-light">
                Clear
              </button>
            ) : (
              <kbd className="hidden shrink-0 border border-[rgba(201,165,94,0.3)] px-1.5 py-0.5 font-mono text-[10.5px] text-mute md:inline-block" aria-hidden="true">
                /
              </kbd>
            )}
          </div>
          {open && sugg.length > 0 && (
            <ul id="vault-sugg" role="listbox" className="vault-sugg absolute inset-x-0 top-full z-30 mt-1 py-1.5">
              {sugg.map((k, i) => (
                <li
                  key={k.id}
                  id={`vault-sugg-${k.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    takeSuggestion(k);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-baseline justify-between gap-4 px-5 py-2.5 text-[14px] ${i === active ? "bg-[rgba(201,165,94,0.09)] text-ink" : "text-slate"}`}
                >
                  <span>
                    <Emph text={k.label} q={q} />
                    <span className="ml-3 text-[12px] text-mute">{KEY_GROUPS.find((g) => g.id === k.group)?.label}</span>
                  </span>
                  <span className="font-mono text-[10.5px] tabular-nums text-mute">{countWith(k.id)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* the keys */}
        <div className="mt-6 grid gap-x-8 gap-y-5 lg:grid-cols-3">
          {KEY_GROUPS.map((g) => (
            <div key={g.id}>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-mute">{g.label}</p>
              {/* A phone gets each group as one sideways rail, so the keys
                  take three lines and the charts start within reach. */}
              <div className="vault-keys -mx-5 mt-2.5 flex gap-1.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {VAULT_KEYS.filter((k) => k.group === g.id).map((k) => {
                  const on = picked.includes(k.id);
                  const n = on ? hits.length : countWith(k.id);
                  const dead = !on && n === 0;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={on}
                      disabled={dead}
                      onClick={() => toggle(k.id)}
                      className="vault-key"
                      aria-label={`${k.label}: ${n} ${n === 1 ? "product" : "products"}`}
                      title={dead ? "No product in the vault has this together with your other choices" : undefined}
                    >
                      {k.label}
                      <span className="vault-key-n">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex min-h-[20px] flex-wrap items-baseline justify-between gap-x-6 gap-y-2" aria-live="polite">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mute">
            {status ? (
              <>
                <span className="text-vault">{status}</span>
                {picked.length > 0 && <span> · {picked.map((id) => KEY_BY_ID[id]?.label).join(" + ")}</span>}
                {q.trim() && <span> · “{q.trim()}”</span>}
              </>
            ) : (
              <span className="hidden [@media(hover:hover)]:inline">Point at a chart to pull back from the detail to the whole picture</span>
            )}
          </p>
          {compare && (
            <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em]" role="group" aria-label="Compare display looks (local preview only)">
              <span className="mr-2 text-mute">Look</span>
              {LOOKS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={look === l.id}
                  onClick={() => setLook(l.id)}
                  className={`border px-2 py-1 transition-colors ${look === l.id ? "border-[rgba(201,165,94,0.7)] text-vault-light" : "border-[rgba(201,165,94,0.2)] text-mute hover:text-ink"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* A quality the whole vault shares (content/vault-search.ts UNIVERSALS):
          said once, plainly, rather than filtered by. */}
      {notes.map((n) => (
        <p key={n} className="mt-6 border-l border-vault pl-4 text-[13.5px] leading-relaxed text-slate">
          {n}
        </p>
      ))}

      {/* ------------------------------------------------------- the deposits */}
      {shown.length > 0 ? (
        look === "wall" ? (
          <ul className="vault-wall mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p, j) => (
              <WallBox key={p.slug} p={p} i={indexOf.get(p.slug) ?? j} hit={hitBy.get(p.slug)} priority={j < 3} />
            ))}
          </ul>
        ) : look === "exhibit" ? (
          <ul className="mt-12">
            {shown.map((p, j) => (
              <ExhibitRow key={p.slug} p={p} i={indexOf.get(p.slug) ?? j} hit={hitBy.get(p.slug)} priority={j < 1} />
            ))}
          </ul>
        ) : (
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p, j) => (
              <LoupePlate key={p.slug} p={p} i={indexOf.get(p.slug) ?? j} hit={hitBy.get(p.slug)} priority={j < 3} />
            ))}
          </ul>
        )
      ) : (
        <div className="mt-10 border-t border-[rgba(201,165,94,0.2)] pt-8">
          <p className="display-sm text-ink">Nothing in the vault computes “{q.trim()}”.</p>
          {store.length > 0 ? (
            <>
              <p className="mt-2 text-[14px] text-slate">It is in the store:</p>
              <ul className="mt-5 max-w-xl border-t border-line">
                {store.map((h) => {
                  const sp = STORE_SIDE.find((p) => p.slug === h.slug)!;
                  return (
                    <li key={h.slug} className="border-b border-line">
                      <Link href={productHref(h.slug)} className="group flex items-baseline gap-3 py-3 text-[14px]">
                        <span className="text-ink transition-colors group-hover:text-gold-deep">{sp.name}</span>
                        <span className="ml-auto truncate text-[12.5px] text-mute">{sp.category}</span>
                        <span className="text-mute transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-[14px] text-slate">Try a feature above — or a word like momentum, levels or alerts.</p>
          )}
          <button type="button" onClick={clearAll} className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.16em] text-vault hover:text-vault-light">
            Show everything in the vault
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * "Search by feature" in the entrance: scrolls the search to the middle of the
 * screen (clear of the sticky header) and puts the cursor in it. A plain
 * #fragment link would scroll but not focus.
 */
export function VaultSearchLink({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <a
      href="#deposits"
      className={className}
      onClick={(e) => {
        const el = document.getElementById("vault-q") as HTMLInputElement | null;
        if (!el) return;
        e.preventDefault();
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
        el.focus({ preventScroll: true });
      }}
    >
      {children}
    </a>
  );
}

/** Emphasise the predictive part — what the visitor has not typed (Baymard). */
function Emph({ text, q }: { text: string; q: string }) {
  const last = q.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
  if (last && text.toLowerCase().startsWith(last)) {
    return (
      <>
        {text.slice(0, last.length)}
        <strong className="font-[600] text-ink">{text.slice(last.length)}</strong>
      </>
    );
  }
  return <strong className="font-[600] text-ink">{text}</strong>;
}
