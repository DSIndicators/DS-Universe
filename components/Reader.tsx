"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CoverView = { src: string; w: number; h: number; alt: string; srcSet?: string };
export type ProductView = {
  slug: string;
  name: string;
  line: string;
  price: string;
  page: string;
  action: { href: string; label: string } | null;
};
export type CapView = { key: string; title: string; line: string; slugs: string[]; lead: string };

type Props = {
  caps: CapView[];
  /** Only the products that have a cover today (content/drop-covers.json). */
  covers: Record<string, CoverView | undefined>;
  products: Record<string, ProductView>;
  disclosure: string;
};

/** How much scroll each capability holds while the stage is pinned. */
const STEP_VH = 70;

/**
 * "WHAT IT READS" — one pinned stage, wide.
 *
 *   [ the capabilities ]   [ the picture, white on white ]   [ title, one line, the products ]
 *
 * Scrolling walks the capabilities in order; the picture crossfades and the
 * words change in place, so the panels flow into each other instead of being
 * stacked boxes. Picking a product in the list puts its picture on the stage.
 * Native scrolling throughout (a sticky stage, not a scroll hijack), every
 * capability reachable from the index, and below 1100px it becomes a plain
 * sequence of blocks.
 */
export function Reader({ caps, covers, products, disclosure }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el || el.offsetParent === null) return;
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.min(Math.max(-el.getBoundingClientRect().top / total, 0), 0.9999);
      setActive(Math.floor(p * caps.length));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [caps.length]);

  const goTo = useCallback(
    (i: number) => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const total = el.offsetHeight - window.innerHeight;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: top + ((i + 0.5) / caps.length) * total, behavior: still ? "auto" : "smooth" });
    },
    [caps.length],
  );

  // A panel opens on its lead product, or, while that product has no picture,
  // on the first of its products that has one: never on an empty slot.
  const shownFor = (c: CapView) => picked[c.key] ?? (covers[c.lead] ? c.lead : (c.slugs.find((s) => covers[s]) ?? c.lead));
  const pick = (c: CapView, slug: string) => setPicked((s) => ({ ...s, [c.key]: slug }));

  const cap = caps[active];
  const shown = shownFor(cap);
  const stageSlugs = Array.from(new Set(caps.flatMap((c) => c.slugs)));

  return (
    <>
      {/* ---------------- wide: the pinned stage ---------------- */}
      <section
        ref={ref}
        className="reader"
        aria-label="What DS Universe reads"
        data-section={`What it reads · ${cap.title}`}
        style={{ height: `calc(${caps.length} * ${STEP_VH}vh + 100vh)` }}
      >
        <div className="reader-pin">
          <nav className="reader-index" aria-label="Capabilities">
            <ol>
              {caps.map((c, i) => (
                <li key={c.key}>
                  <button type="button" aria-current={i === active} onClick={() => goTo(i)}>
                    {c.title}
                  </button>
                </li>
              ))}
            </ol>
            <p className="small measure-s" style={{ marginTop: 40, fontSize: "0.75rem" }}>
              {disclosure}
            </p>
          </nav>

          <div className="reader-stage">
            <div className="stage-box">
              {stageSlugs.map((s) => (
                <StageItem key={s} cover={covers[s]} name={products[s].name} on={s === shown} eager={s === caps[0].lead} />
              ))}
            </div>
            <p className="small stage-cap measure" aria-hidden="true">
              {covers[shown]?.alt ?? ""}
            </p>
          </div>

          <div className="reader-copy">
            {caps.map((c, i) => (
              <div key={c.key} className="panel" data-on={i === active} aria-hidden={i !== active}>
                <h3 className="d2">{c.title}</h3>
                <p className="lead measure-s" style={{ marginTop: 22 }}>
                  {c.line}
                </p>
                <Rows cap={c} products={products} shown={shownFor(c)} onPick={(s) => pick(c, s)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- narrow: one block per capability ---------------- */}
      <div className="reader-m wb">
        {caps.map((c) => {
          const s = shownFor(c);
          return (
            <section key={c.key} className="cap-m" aria-labelledby={`m-${c.key}`} data-section={`What it reads · ${c.title}`}>
              <h3 id={`m-${c.key}`} className="d2">
                {c.title}
              </h3>
              <p className="lead" style={{ marginTop: 16 }}>
                {c.line}
              </p>
              <div className="stage-box">
                {c.slugs.map((x) => (
                  <StageItem key={x} cover={covers[x]} name={products[x].name} on={x === s} />
                ))}
              </div>
              <div className="cap-panel">
                <Rows cap={c} products={products} shown={s} onPick={(x) => pick(c, x)} />
              </div>
            </section>
          );
        })}
        <p className="small" style={{ marginTop: 40 }}>
          {disclosure}
        </p>
      </div>
    </>
  );
}

/** One picture on the stage — or, until Tom's new white cover is dropped in,
 *  an empty slot carrying the product's name (the same size, so nothing jumps). */
function StageItem({ cover, name, on, eager = false }: { cover?: CoverView; name: string; on: boolean; eager?: boolean }) {
  if (!cover)
    return (
      <div className="slot" data-on={on} aria-hidden={!on}>
        <span>{name}</span>
      </div>
    );
  return (
    <img
      src={cover.src}
      srcSet={cover.srcSet}
      sizes={cover.srcSet ? "(min-width: 1101px) 44vw, 92vw" : undefined}
      width={cover.w}
      height={cover.h}
      alt={on ? cover.alt : ""}
      aria-hidden={!on}
      data-on={on}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
    />
  );
}

function Rows({
  cap,
  products,
  shown,
  onPick,
}: {
  cap: CapView;
  products: Record<string, ProductView>;
  shown: string;
  onPick: (slug: string) => void;
}) {
  const p = products[shown];
  return (
    <>
      <ul className="rows">
        {cap.slugs.map((s) => {
          const x = products[s];
          return (
            <li key={s}>
              <button
                type="button"
                className="row"
                data-on={s === shown}
                aria-pressed={cap.slugs.length > 1 ? s === shown : undefined}
                onClick={() => onPick(s)}
                disabled={cap.slugs.length === 1}
              >
                <span className="row-name">{x.name}</span>
                <span className="row-price num">{x.price}</span>
                <span className="row-line">{x.line}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="row-acts">
        <a className="lnk" href={p.page}>
          {p.name} in full
        </a>
        {p.action && (
          <a className="lnk lnk-quiet" href={p.action.href}>
            {p.action.label}
          </a>
        )}
      </div>
    </>
  );
}
