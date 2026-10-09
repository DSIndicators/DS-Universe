"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { VAULT_PRODUCTS, productHref } from "@/content/release";
import { KEY_BY_ID, KEY_GROUPS, STORE_SIDE, VAULT_KEYS, searchProducts, suggest, universalNotes, type VaultKey } from "@/content/vault-search";
import { ProductCard } from "@/components/ProductCard";

/**
 * THE FREE VAULT'S STOREFRONT — its search, its filters and its products
 * (search 2026-10-08; rebuilt as a marketplace later the same day).
 *
 * Tom: "The free vault and all the products looks like journal links that
 * users can read, not a marketplace." The plates (a serial number, a
 * magnified detail with a label pinned on it, a caption about the picture)
 * are gone, and so are the two other looks kept for comparison. The vault is
 * now laid out the way a store is:
 *
 *   SIDEBAR (1024px+)  the search, then the feature keys as checkbox rows,
 *                      each with the count it would leave — the filter
 *                      column every marketplace has. Below 1024px the keys
 *                      stay the sideways rails under the search.
 *   RESULTS            how many products are showing, the keys in force (each
 *                      removable), a sort, then the cards — every product by
 *                      its square cover, its kind, name, two of its own hooks,
 *                      "Free" and "Get it free" (components/ProductCard.tsx).
 *
 * SEARCH (content/vault-search.ts) is unchanged: typing filters live; keys
 * toggle and combine with AND; a key that would leave nothing is disabled; a
 * query the vault cannot answer names the store products that do; "/" puts
 * the cursor in the field, Esc clears it; the state lives in the address
 * (?q=…&k=…&sort=…) so a filtered vault can be shared and survives Back.
 * While a search is in force each card lists WHY it matched (the key's
 * evidence) in place of its hooks.
 */

type Sort = "featured" | "name";
const SORTS: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "name", label: "Name, A–Z" },
];

/** The card's rendered widths: three beside the sidebar, three on a tablet, two from 640px, a row on a phone. */
const CARD_SIZES = "(min-width: 1024px) 240px, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 104px";

/* ================================================================= SEARCH */

function readUrl() {
  if (typeof window === "undefined") return { q: "", k: [] as string[], sort: "featured" as Sort };
  const sp = new URLSearchParams(window.location.search);
  const k = (sp.get("k") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => KEY_BY_ID[s]);
  const so = sp.get("sort");
  const sort: Sort = SORTS.some((x) => x.id === so) ? (so as Sort) : "featured";
  return { q: sp.get("q") ?? "", k, sort };
}

export function VaultRoom() {
  const products = VAULT_PRODUCTS;
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("featured");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const ready = useRef(false);

  // The address is the state's home: read once, then kept in step.
  useEffect(() => {
    const u = readUrl();
    setQ(u.q);
    setPicked(u.k);
    setSort(u.sort);
    ready.current = true;
  }, []);
  useEffect(() => {
    if (!ready.current) return;
    const sp = new URLSearchParams(window.location.search);
    q.trim() ? sp.set("q", q.trim()) : sp.delete("q");
    picked.length ? sp.set("k", picked.join(",")) : sp.delete("k");
    sort !== "featured" ? sp.set("sort", sort) : sp.delete("sort");
    const s = sp.toString();
    const url = `${window.location.pathname}${s ? `?${s}` : ""}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(window.history.state, "", url);
  }, [q, picked, sort]);

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
  const shown = useMemo(() => {
    const base = searching ? hits.map((h) => products.find((p) => p.slug === h.slug)!).filter(Boolean) : products;
    return sort === "name" ? [...base].sort((a, b) => a.name.localeCompare(b.name)) : base;
  }, [searching, hits, products, sort]);
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

  const field = (
    <div className="relative">
      <label htmlFor="vault-q" className="sr-only">
        Search the Free Vault by feature or name
      </label>
      <div className="vault-field flex items-center gap-3 px-4">
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
          placeholder="Search EMA, VWAP…"
          className="h-12 min-w-0 flex-1 bg-transparent text-[14.5px] text-ink placeholder:text-mute focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          role="combobox"
          aria-expanded={open && sugg.length > 0}
          aria-controls="vault-sugg"
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && sugg[active] ? `vault-sugg-${sugg[active].id}` : undefined}
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-mute transition-colors hover:text-vault-light" aria-label="Clear the search text">
            ×
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
              className={`flex cursor-pointer items-baseline justify-between gap-4 px-4 py-2.5 text-[13.5px] ${i === active ? "bg-[rgba(201,165,94,0.09)] text-ink" : "text-slate"}`}
            >
              <span>
                <Emph text={k.label} q={q} />
                <span className="ml-3 text-[11.5px] text-mute">{KEY_GROUPS.find((g) => g.id === k.group)?.label}</span>
              </span>
              <span className="font-mono text-[10.5px] tabular-nums text-mute">{countWith(k.id)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  /** One key's state, shared by the sidebar rows and the phone rails. */
  const keyState = (k: VaultKey) => {
    const on = picked.includes(k.id);
    const n = on ? hits.length : countWith(k.id);
    return { on, n, dead: !on && n === 0 };
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-10">
      {/* ------------------------------------------------ search + filters */}
      <aside role="search" aria-label="Search and filter the Free Vault" className="min-w-0">
        {field}

        {/* the filter column, 1024px+ */}
        <div className="mt-8 hidden space-y-7 lg:block">
          {KEY_GROUPS.map((g) => (
            <fieldset key={g.id}>
              <legend className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-vault">{g.label}</legend>
              <div className="mt-2 border-t border-[rgba(201,165,94,0.16)] pt-1.5">
                {VAULT_KEYS.filter((k) => k.group === g.id).map((k) => {
                  const { on, n, dead } = keyState(k);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={on}
                      disabled={dead}
                      onClick={() => toggle(k.id)}
                      className="vault-facet"
                      title={dead ? "No product in the vault has this together with your other choices" : undefined}
                    >
                      <span className="vault-facet-box" aria-hidden="true" />
                      <span className="truncate">{k.label}</span>
                      <span className="vault-facet-n" aria-label={`${n} ${n === 1 ? "product" : "products"}`}>
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {/* the key rails, below 1024px */}
        <div className="mt-5 space-y-4 lg:hidden">
          {KEY_GROUPS.map((g) => (
            <div key={g.id}>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-mute">{g.label}</p>
              <div className="vault-keys -mx-5 mt-2 flex gap-1.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {VAULT_KEYS.filter((k) => k.group === g.id).map((k) => {
                  const { on, n, dead } = keyState(k);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={on}
                      disabled={dead}
                      onClick={() => toggle(k.id)}
                      className="vault-key"
                      aria-label={`${k.label}: ${n} ${n === 1 ? "product" : "products"}`}
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
      </aside>

      {/* ------------------------------------------------------ the results */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[rgba(201,165,94,0.16)] pb-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2" aria-live="polite">
            <p className="mr-2 text-[13.5px] text-ink">
              <span className="font-display tabular-nums">{shown.length}</span>{" "}
              <span className="text-slate">
                {shown.length === 1 ? "product" : "products"}
                {searching ? ` of ${products.length}` : " · all free"}
              </span>
            </p>
            {picked.map((id) => (
              <button key={id} type="button" onClick={() => toggle(id)} className="vault-key" aria-label={`Remove ${KEY_BY_ID[id]?.label}`}>
                {KEY_BY_ID[id]?.label}
                <span className="vault-key-n" aria-hidden="true">
                  ×
                </span>
              </button>
            ))}
            {q.trim() && (
              <button type="button" onClick={() => setQ("")} className="vault-key" aria-label={`Remove the search “${q.trim()}”`}>
                “{q.trim()}”
                <span className="vault-key-n" aria-hidden="true">
                  ×
                </span>
              </button>
            )}
            {searching && (
              <button type="button" onClick={clearAll} className="ml-1 font-mono text-[10px] uppercase tracking-[0.16em] text-mute transition-colors hover:text-vault-light">
                Clear all
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="vault-sort border border-[rgba(201,165,94,0.25)] bg-ground px-2.5 py-1.5 font-sans text-[12.5px] normal-case tracking-normal text-ink focus:border-vault focus:outline-none"
            >
              {SORTS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id === "featured" && searching ? "Best match" : o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* A quality the whole vault shares (UNIVERSALS): said once, plainly. */}
        {notes.map((n) => (
          <p key={n} className="mt-5 border-l border-vault pl-4 text-[13.5px] leading-relaxed text-slate">
            {n}
          </p>
        ))}

        {shown.length > 0 ? (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
            {shown.map((p, j) => {
              const hit = hitBy.get(p.slug);
              return (
                <li key={p.slug} className="flex min-w-0">
                  <ProductCard
                    slug={p.slug}
                    tone="vault"
                    hooks={2}
                    why={hit?.why.map((w) => ({ id: w.key.id, label: w.key.label, note: w.note }))}
                    sizes={CARD_SIZES}
                    priority={j < 3}
                    className="w-full"
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-8">
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
              <p className="mt-2 text-[14px] text-slate">Try a feature in the list — or a word like momentum, levels or alerts.</p>
            )}
            <button type="button" onClick={clearAll} className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.16em] text-vault hover:text-vault-light">
              Show everything in the vault
            </button>
          </div>
        )}
      </div>
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
