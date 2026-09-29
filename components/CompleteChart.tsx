"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BUILD_ORDER, SEQUENCE, built, useCompleteStage, type Focus, type Series } from "@/components/CompleteStage";
import { DRAWS } from "@/content/complete-chart";
import { SERIES } from "@/content/pricing";
import { PRODUCTS } from "@/content/products";

/**
 * THE DS COMPLETE CHART (2026-09-29) — the image of DS Complete.
 *
 * Tom: the box render was "stretched out and blurry, zero effort"; "I really
 * like the technicality of our interactive chart". The box was also a picture
 * of packaging, with a price and a product count printed on it that would go
 * stale. What a DS Complete buyer actually gets is every tool running on one
 * chart ("Built to run together on one chart" — content/pricing.ts), so that
 * is the picture: one NinjaTrader chart, every product's own drawing on it.
 *
 *   Flagship   Zones' defended demand zone · Iceberg's absorption runway and
 *              its test marks · GEX's Call Wall / Gamma Flip / Put Wall ·
 *              Flow's buy/sell profile on one candle group, heavy row boxed ·
 *              Oracle's Neural Line, violet to teal where price crosses it.
 *   Pro Series the four panels under price, titled the way NT8 titles panels,
 *              plus ProRSI's swing-anchored level on the price pane.
 *   Essentials the DS Toolkit rail · Parallax's four higher-timeframe minis ·
 *              DS 258's 00/20/50/80 lines · the Adaptive Price Line with its
 *              countdown tag · the Chart Price readout.
 *   Utility    the Market Replay days on hand, which DS Bulk Replay
 *              Downloader fetched.
 *
 * It BUILDS in the list's order when it scrolls into view. On a desktop,
 * pointing at a series or a product in the list beside it isolates its
 * drawing (CompleteStage.tsx holds the shared state).
 *
 * ON PHONES (Tom, 2026-09-29: "on mobile, users can't hover, they must click,
 * which just leads them to the product page, makes the whole website seem too
 * jumpy"). A touch screen has no hover, and the list sits a screen below the
 * chart. So on touch screens the chart carries its own controls, next to the
 * drawing: four series tabs under its header, and under the drawing a stepper
 * (‹ product ›), the product's line in its own words, and a deliberate "View
 * DS … →" link — leaving for a product page is a choice, never a side effect.
 * While nobody touches it and it is on screen, it TOURS: one product every
 * few seconds, a hairline under the stepper showing the time left. The first
 * tap on a control ends the tour for good. Reduced motion: no tour.
 * "Touch screen" = the browser does not report a fine, hovering pointer; the
 * same media query hides the controls on desktops (CSS) and gates the tour.
 *
 * NEVER GREY UNDER A BROWSER'S DARK MODE (Tom's Samsung Internet showed this
 * chart grey on 2026-09-29). Samsung's forced dark mode ignores the page's
 * declared dark scheme and recolours SVG: dark fills and dark lines get
 * lightened, and <rect>s are handled as "background" objects. So:
 *   · the dark grounds are HTML backgrounds (left alone), never SVG fills;
 *   · every neutral is the ink colour at low opacity — a light colour, which
 *     a dark mode leaves as it is — never a dark grey;
 *   · every filled shape is a <path>, never a <rect> or <circle>;
 *   · the house colours appear only in their bright form (#19F2E6, #B45CFF),
 *     softened with opacity, never as the darker #009999 / #A33DFF.
 * app/layout.tsx also declares "only dark", the standard's opt-out.
 *
 * The same rules as the chart reader: a drawn illustration, labelled so; no
 * digits, results or outcomes; crisp edges, no glow. content/complete-chart.ts
 * fails the build if a product joins the lineup without a layer here.
 */

const TEAL = "#19F2E6";
const VIOLET = "#B45CFF";
const STRONG_BULL = "#00FFFF";
const INK = "#ECEEF1";
const SLATE = "#A3ABB3";
const ONLINE = "#2EE884";
/** Neutrals: the ink colour at these opacities (see "never grey" above). */
const A = { grid: 0.045, frame: 0.12, mark: 0.2, faint: 0.32, mute: 0.52 } as const;

const W = 480;
const PX0 = 34, PX1 = 428, PY0 = 22, PY1 = 292; // the price pane
const PANEL_H = 46, GAP = 6, P0 = PY1 + 10; // the four Pro panels
const panelY = (k: number) => P0 + k * (PANEL_H + GAP);
const RY = panelY(4) + 4; // the replay strip

// A drawn tape: down into demand, rejected three times under a runway, then up
// through the Neural Line. Illustration only.
const closes = [62, 60, 63, 58, 55, 57, 52, 49, 51, 46, 44, 47, 42, 40, 43, 41, 39, 42, 45, 43, 48, 51, 49, 54, 57, 55, 60, 63, 61, 66, 69, 67];
const LO = 30, HI = 78;
const N = closes.length;
const DX = (PX1 - PX0 - 16) / N;
const xAt = (i: number) => PX0 + 10 + i * DX;
const yP = (v: number) => PY0 + 8 + (1 - (v - LO) / (HI - LO)) * (PY1 - PY0 - 16);
const cand = closes.map((c, i) => {
  const o = i ? closes[i - 1] : c + 1.5;
  return { o, c, h: Math.max(o, c) + 1.2 + ((i * 37) % 7) / 3, l: Math.min(o, c) - 1.1 - ((i * 53) % 5) / 3 };
});
cand[9].h = 50.6;
cand[13].h = 50.9;
cand[16].h = 50.4;
const smooth = (a: number[], k: number) =>
  a.map((_, i) => {
    const s = a.slice(Math.max(0, i - k + 1), i + 1);
    return s.reduce((x, y) => x + y, 0) / s.length;
  });
const neural = smooth(closes, 5);
const cross = neural.findIndex((v, i) => i > 4 && closes[i] > v && closes[i - 1] <= neural[i - 1]);
const last = closes[N - 1];
/** Two decimals: server and browser must print the same numbers (hydration). */
const r2 = (n: number) => Math.round(n * 100) / 100;
const pts = (a: number[], y: (v: number) => number, from = 0) => a.map((v, i) => `${r2(xAt(i + from))},${r2(y(v))}`).join(" ");
/** A rectangle as a path (dark modes treat <rect> as a background object). */
const box = (x: number, y: number, w: number, h: number) => `M${r2(x)} ${r2(y)}h${r2(w)}v${r2(h)}h${r2(-w)}Z`;
/** A small dot as a path, for the same reason. */
const dot = (cx: number, cy: number, r: number) => `M${r2(cx - r)} ${r2(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

const SERIES_OF = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p.series])) as Record<string, Series>;
const NAME_OF = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p.name])) as Record<string, string>;
const SERIES_NAME = Object.fromEntries(SERIES.map((s) => [s.key, s.name])) as Record<Series, string>;
/** The tabs' short words (the ledger's series names, cut to fit four across a phone). */
const TAB: Record<Series, string> = { flagship: "Flagship", pro: "Pro Series", essentials: "Essentials", utility: "Utility" };

/** How long the tour rests on each product, and on the whole chart between rounds. */
const DWELL = 3200;
const DWELL_ALL = 2200;

/** One product's drawing: shown once its series is built, dimmed while
 *  something else is being pointed at. */
function L({ p, children }: { p: string; children: ReactNode }) {
  const { focus, step } = useCompleteStage();
  const s = SERIES_OF[p];
  const { shown } = built(s, step);
  const lit = !focus || (focus.slug ? focus.slug === p : focus.series === s);
  return (
    <g className="cc-l" style={{ opacity: !shown ? 0 : lit ? 1 : 0.13, transition: "opacity 450ms ease" }}>
      {children}
    </g>
  );
}

/* ------------------------------------------------------------ navigation */

/** The stepper's next and previous: through every product in the list's
 *  order; a series' own "all" view sits before its first product. */
function next(f: Focus): Focus {
  if (!f) return { ...SEQUENCE[0], source: "tap" };
  if (!f.slug) return { ...SEQUENCE.find((p) => p.series === f.series)!, source: "tap" };
  const i = SEQUENCE.findIndex((p) => p.slug === f.slug);
  return i + 1 < SEQUENCE.length ? { ...SEQUENCE[i + 1], source: "tap" } : null;
}
function prev(f: Focus): Focus {
  if (!f) return { ...SEQUENCE[SEQUENCE.length - 1], source: "tap" };
  if (!f.slug) {
    const first = SEQUENCE.findIndex((p) => p.series === f.series);
    return first > 0 ? { ...SEQUENCE[first - 1], source: "tap" } : null;
  }
  const i = SEQUENCE.findIndex((p) => p.slug === f.slug);
  const p = SEQUENCE[i - 1];
  return p && p.series === f.series ? { ...p, source: "tap" } : { series: f.series, source: "tap" };
}

/** Is this a touch screen (no fine, hovering pointer)? False until mounted. */
function useTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const set = () => setTouch(!mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return touch;
}

/* ------------------------------------------------------------------ card */

export function CompleteChart({ className = "" }: { className?: string }) {
  const { focus, setFocus, step, setStep } = useCompleteStage();
  const card = useRef<HTMLDivElement>(null);
  const box0 = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(1);
  const touch = useTouch();
  const [reduced, setReduced] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [stopped, setStopped] = useState(false);
  // The tour's place: an index into SEQUENCE, or SEQUENCE.length for the
  // whole chart. It starts on the whole chart, so the finished build is seen.
  const [pos, setPos] = useState(SEQUENCE.length);

  // Type size: the drawing scales down on phones; its labels do not shrink
  // below what the desktop shows.
  useEffect(() => {
    const el = box0.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      if (w > 0) setFs(Math.min(2.2, Math.max(1, 520 / w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build once, when the chart is on screen.
  useEffect(() => {
    const el = box0.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      setReduced(true);
      setStep(BUILD_ORDER.length + 1);
      return;
    }
    const timers: number[] = [];
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        for (let k = 1; k <= BUILD_ORDER.length + 1; k++) timers.push(window.setTimeout(() => setStep(k), 250 + (k - 1) * 700));
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [setStep]);

  // The tour only runs while the chart is on screen and the tab is in front.
  useEffect(() => {
    const el = card.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    const vis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const touring = touch && !reduced && !stopped && step > BUILD_ORDER.length && onScreen && pageVisible;

  useEffect(() => {
    if (!touring) return;
    const all = pos >= SEQUENCE.length;
    setFocus(all ? null : { ...SEQUENCE[pos], source: "tour" });
    const id = window.setTimeout(() => setPos((pos + 1) % (SEQUENCE.length + 1)), all ? DWELL_ALL : DWELL);
    return () => window.clearTimeout(id);
  }, [touring, pos, setFocus]);

  /** A visitor's own choice: the tour ends for good, their pick stands. */
  const choose = (f: Focus) => {
    setStopped(true);
    setFocus(f);
  };

  const t = (size: number) => size * fs;
  // The replay strip sits under its label, whatever size the label is drawn at.
  const stripY = RY + 7 + t(6);
  const H = stripY + 14;
  // Phones: the 258 tags would crowd the GEX labels at the right edge; the
  // dotted levels stay, the tags go.
  const tags258 = fs < 1.3;

  return (
    <div ref={card} className={`border border-line bg-[rgba(14,17,21,0.72)] ${className}`}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-mute min-[400px]:tracking-[0.16em]">
          One chart <span className="text-slate">·</span> every tool
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ONLINE }} aria-hidden="true" />
          NT8
        </span>
      </div>

      {/* touch screens: the series tabs, right above the drawing */}
      <div className="grid grid-cols-4 gap-1 border-b border-line px-2 py-2.5 min-[400px]:gap-1.5 min-[400px]:px-3 [@media(hover:hover)_and_(pointer:fine)]:hidden" role="group" aria-label="Show one series on the chart">
        {BUILD_ORDER.map((s) => {
          const on = focus?.series === s || built(s, step).building;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={focus?.series === s}
              onClick={() => choose(focus?.series === s && !focus.slug ? null : { series: s, source: "tap" })}
              className="h-8 truncate rounded-[3px] border px-0.5 font-mono text-[8px] uppercase tracking-[0.04em] transition-colors duration-300 min-[360px]:text-[8.5px] min-[360px]:tracking-[0.06em] min-[400px]:text-[9px] min-[400px]:tracking-[0.12em]"
              style={{ borderColor: on ? "rgba(25,242,230,0.5)" : "#23272D", color: on ? TEAL : "#7C848D" }}
            >
              {TAB[s]}
            </button>
          );
        })}
      </div>

      <div ref={box0} className="p-2 sm:p-3">
        <noscript>
          <style>{`.cc-l{opacity:1!important}`}</style>
        </noscript>
        {/* the chart window's ground is HTML, not SVG (see "never grey") */}
        <div className="rounded-[5px] border border-line bg-[#0B0E12]">
          <Drawing t={t} H={H} stripY={stripY} tags258={tags258} />
        </div>
      </div>

      {/* desktops: what the pointer is on, in the product's own words */}
      <div className="hidden min-h-[40px] items-baseline gap-3 border-t border-line px-4 py-2.5 [@media(hover:hover)_and_(pointer:fine)]:flex" aria-live="polite">
        <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#565D66]">Illustration</span>
        <span className="min-w-0 text-[12.5px] leading-snug text-slate">
          {focus?.slug ? (
            <>
              <span className="mr-2 text-ink">{NAME_OF[focus.slug]}</span>
              {DRAWS[focus.slug]}
            </>
          ) : focus ? (
            PRODUCTS.filter((p) => p.series === focus.series).map((p) => p.name).join(" · ")
          ) : (
            <span className="text-mute">Point at a product in the list to find its drawing.</span>
          )}
        </span>
      </div>

      {/* touch screens: the stepper, the line, and the way to the product */}
      <TouchFoot focus={focus} touring={touring} pos={pos} choose={choose} />
    </div>
  );
}

/* ------------------------------------------------------------ touch foot */

function TouchFoot({ focus, touring, pos, choose }: { focus: Focus; touring: boolean; pos: number; choose: (f: Focus) => void }) {
  const s = focus?.series;
  const inSeries = s ? SEQUENCE.filter((p) => p.series === s) : [];
  const k = focus?.slug ? inSeries.findIndex((p) => p.slug === focus.slug) + 1 : 0;
  const top = !s ? "Every series" : focus?.slug ? `${TAB[s]} · ${k} / ${inSeries.length}` : `${TAB[s]} · all`;
  const name = !s ? "All tools" : focus?.slug ? NAME_OF[focus.slug] : SERIES_NAME[s];
  const dwell = pos >= SEQUENCE.length ? DWELL_ALL : DWELL;

  return (
    <div className="border-t border-line [@media(hover:hover)_and_(pointer:fine)]:hidden">
      <div className="flex items-center gap-2 px-3 pt-3">
        <StepButton label="Previous tool" onClick={() => choose(prev(focus))} flip />
        <div className="min-w-0 flex-1 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mute">{top}</p>
          <p className="mt-0.5 truncate text-[14px] leading-tight text-ink">{name}</p>
        </div>
        <StepButton label="Next tool" onClick={() => choose(next(focus))} />
      </div>

      {/* the tour's clock: a hairline that fills while it rests on a product */}
      <div className="mx-3 mt-3 h-px overflow-hidden bg-line" aria-hidden="true">
        {touring && <div key={pos} className="cc-dwell h-full origin-left" style={{ background: "rgba(25,242,230,0.6)", animationDuration: `${dwell}ms` }} />}
      </div>

      {/* fixed height: the card never jumps as the line changes */}
      <div className="flex min-h-[118px] flex-col px-4 pb-3.5 pt-2.5" aria-live={touring ? "off" : "polite"}>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#565D66]">Illustration</span>
        <p className="mt-1 text-[12.5px] leading-snug text-slate text-pretty">
          {!s ? (
            <span className="text-mute">Every DS tool, drawn on one chart. Tap a series, or step through them one by one.</span>
          ) : focus?.slug ? (
            DRAWS[focus.slug]
          ) : (
            PRODUCTS.filter((p) => p.series === s).map((p) => p.name).join(" · ")
          )}
        </p>
        {s && (
          <p className="mt-auto pt-1.5">
            {focus?.slug ? (
              <Link
                href={`/products/${focus.slug}`}
                onClick={() => choose({ ...focus, source: "tap" })}
                className="inline-block py-1 text-[12.5px] text-ink underline decoration-line-strong underline-offset-4"
              >
                View {NAME_OF[focus.slug]} →
              </Link>
            ) : (
              <a href={`#${s}`} onClick={() => choose({ ...focus, source: "tap" })} className="inline-block py-1 text-[12.5px] text-ink underline decoration-line-strong underline-offset-4">
                Go to the {SERIES_NAME[s]} ↓
              </a>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function StepButton({ label, onClick, flip = false }: { label: string; onClick: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px] border border-line text-slate transition-colors active:border-line-strong active:text-ink"
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" style={{ transform: flip ? "scaleX(-1)" : undefined }} aria-hidden="true">
        <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* --------------------------------------------------------------- drawing */

function Drawing({ t, H, stripY, tags258 }: { t: (n: number) => number; H: number; stripY: number; tags258: boolean }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Every DS Universe product drawn together on one NinjaTrader chart (illustration)">
      <defs>
        <pattern id="cc-scan-t" width="4" height="3" patternUnits="userSpaceOnUse">
          <path d="M0 0h4v1h-4Z" fill={TEAL} fillOpacity="0.3" />
        </pattern>
        <pattern id="cc-scan-v" width="4" height="3" patternUnits="userSpaceOnUse">
          <path d="M0 0h4v1h-4Z" fill={VIOLET} fillOpacity="0.3" />
        </pattern>
      </defs>

      {/* the grid and the pane divider */}
      <g stroke={INK} strokeOpacity={A.grid}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PX0 + (PX1 - PX0) * f} x2={PX0 + (PX1 - PX0) * f} y1={PY0} y2={RY - 6} />
        ))}
      </g>
      <line x1={PX0} x2={W - 6} y1={PY1 + 4} y2={PY1 + 4} stroke={INK} strokeOpacity={A.frame} />
      <text x="8" y={6 + t(7)} className="font-mono" fontSize={t(7)} letterSpacing="1" fill={INK} fillOpacity={A.mute}>
        MNQ · 1 MIN
      </text>

      {/* ---------------------------------------------------- essentials */}
      <L p="ds-258">
        {([[70, "80"], [58, "50"], [46, "20"], [34, "00"]] as const).map(([v, tag]) => (
          <g key={tag}>
            <line x1={PX0} x2={PX1} y1={yP(v)} y2={yP(v)} stroke={INK} strokeOpacity="0.16" strokeDasharray="1 3" />
            {tags258 && (
              <text x={PX1 - 2} y={yP(v) - 2} textAnchor="end" className="font-mono" fontSize={t(6)} fill={INK} fillOpacity={A.faint}>
                {tag}
              </text>
            )}
          </g>
        ))}
      </L>
      <L p="parallax">
        <g transform={`translate(${PX0 + 6} ${PY0 + 4})`}>
          {[0, 1, 2, 3].map((k) => (
            <g key={k} transform={`translate(${(k % 2) * 46} ${Math.floor(k / 2) * 30})`}>
              <path d={box(0.5, 0.5, 41, 25)} fill={INK} fillOpacity="0.02" stroke={INK} strokeOpacity={A.frame} />
              {[0, 1, 2, 3, 4, 5].map((j) => {
                const hh = 4 + ((j * 7 + k * 5) % 9);
                return <path key={j} d={box(5 + j * 6, 20 - hh - ((j + k) % 3) * 2, 3, hh)} fill={INK} fillOpacity={A.mark} />;
              })}
              <line x1="3" x2="39" y1={k % 2 ? 5 : 21} y2={k % 2 ? 5 : 21} stroke={k % 2 ? VIOLET : TEAL} strokeOpacity={k % 2 ? 0.8 : 0.6} strokeDasharray="2 2" />
            </g>
          ))}
        </g>
      </L>
      <L p="chart-price">
        <g transform={`translate(${(PX0 + PX1) / 2 - 20} ${PY0 + 4})`}>
          <path d={box(0.5, 0.5, 87, 21)} fill="none" stroke={INK} strokeOpacity={A.frame} />
          <text x="6" y="9" className="font-mono" fontSize="5.5" letterSpacing="1" fill={INK} fillOpacity={A.faint}>
            LAST
          </text>
          <path d="M 8 18 L 12 12.5 L 16 18 Z" fill={TEAL} />
          <path d={box(21, 12, 60, 6)} fill={TEAL} fillOpacity="0.85" />
        </g>
      </L>
      <L p="toolkit">
        <g transform="translate(6 22)">
          <path d={box(0.5, 0.5, 19, 175)} fill={INK} fillOpacity="0.03" stroke={INK} strokeOpacity={A.frame} />
          {Array.from({ length: 9 }).map((_, k) =>
            k === 6 ? (
              <path key={k} d={box(6.5, 8.5 + k * 13, 7, 7)} fill="none" stroke={INK} strokeOpacity={A.mark} />
            ) : (
              <path key={k} d={box(6, 8 + k * 13, 8, 8)} fill={TEAL} fillOpacity="0.7" />
            ),
          )}
          <line x1="4" x2="16" y1="128" y2="128" stroke={INK} strokeOpacity={A.frame} />
          {[0, 1, 2].map((k) => (
            <path key={k} d={box(6.5, 136.5 + k * 12, 7, 7)} fill="none" stroke={INK} strokeOpacity={A.mute} />
          ))}
        </g>
      </L>

      {/* ------------------------------------------------------ flagship */}
      <L p="zones">
        <path d={box(xAt(11) - 4, yP(42.5), PX1 - xAt(11) + 4, yP(37.5) - yP(42.5))} fill="url(#cc-scan-t)" stroke={TEAL} />
        <path d={box(xAt(11) - 4, yP(42.5), 2, yP(37.5) - yP(42.5))} fill={TEAL} />
        <text x={xAt(11)} y={yP(37.5) + 2 + t(6)} className="font-mono" fontSize={t(6)} letterSpacing="0.9" fill={TEAL}>
          DEMAND · DEFENDED
        </text>
      </L>
      <L p="iceberg">
        <path d={box(xAt(9) - 3, yP(51.4), xAt(19) - xAt(9), yP(49.6) - yP(51.4))} fill="url(#cc-scan-v)" stroke={VIOLET} />
        {[9, 13, 16].map((i) => (
          <path key={i} d={`M ${r2(xAt(i) - 3)} ${r2(yP(51.4) - 5)} L ${r2(xAt(i))} ${r2(yP(51.4) - 2)} L ${r2(xAt(i) + 3)} ${r2(yP(51.4) - 5)}`} fill="none" stroke={VIOLET} />
        ))}
      </L>
      <L p="gex">
        {([[74, "CALL WALL", TEAL], [54, "GAMMA FLIP", SLATE], [31.5, "PUT WALL", VIOLET]] as const).map(([v, tag, c]) => (
          <g key={tag}>
            <line x1={PX1 - 70} x2={PX1} y1={yP(v)} y2={yP(v)} stroke={c} strokeWidth="1.25" />
            <text x={PX1 - 70} y={yP(v) - 3} className="font-mono" fontSize={t(5.5)} letterSpacing="0.9" fill={c}>
              {tag}
            </text>
          </g>
        ))}
      </L>
      <L p="flow">
        {[44, 46, 48, 50, 52].map((v, k) => {
          const b = [10, 16, 26, 14, 8][k];
          const s = [8, 12, 14, 18, 10][k];
          const X = xAt(20) + 5;
          return (
            <g key={v}>
              <path d={box(X, yP(v) - 2, b, 3.5)} fill={TEAL} fillOpacity="0.55" />
              <path d={box(X + b, yP(v) - 2, s, 3.5)} fill={VIOLET} fillOpacity="0.55" />
              {k === 2 && <path d={box(X - 1.5, yP(v) - 3.5, b + s + 3, 6.5)} fill="none" stroke={TEAL} />}
            </g>
          );
        })}
      </L>
      <L p="oracle">
        <polyline points={pts(neural.slice(0, cross + 1), yP)} fill="none" stroke={VIOLET} strokeWidth="1.5" />
        <polyline points={pts(neural.slice(cross), yP, cross)} fill="none" stroke={TEAL} strokeWidth="1.5" />
        <path d={`M ${r2(xAt(cross))} ${r2(yP(neural[cross]) + 7)} l -3.5 6 h 7 z`} fill={TEAL} />
      </L>

      {/* the price itself — not a layer; it is always there */}
      <g>
        {cand.map((c, i) => {
          const x = xAt(i);
          const a = c.c >= c.o ? 0.62 : 0.3;
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={yP(c.h)} y2={yP(c.l)} stroke={INK} strokeOpacity={a} />
              <path d={box(x - 3, yP(Math.max(c.o, c.c)), 6, Math.max(1, Math.abs(yP(c.o) - yP(c.c))))} fill={INK} fillOpacity={r2(a * 0.55)} stroke={INK} strokeOpacity={a} strokeWidth="0.75" />
            </g>
          );
        })}
      </g>

      {/* drawn over the candles: the price line rides the last bar, its tag
          carrying the bar-close countdown as a filling bar */}
      <L p="adaptive-priceline">
        <line x1={xAt(N - 1) + 4} x2={PX1 + 2} y1={yP(last)} y2={yP(last)} stroke={TEAL} />
        <path d={box(PX1 + 2.5, yP(last) - 4, 33, 8)} fill={TEAL} fillOpacity="0.16" stroke={TEAL} />
        <path d={box(PX1 + 5, yP(last) - 1.5, 20, 3)} fill={TEAL} />
      </L>

      {/* ------------------------------------------------------ Pro Series */}
      <L p="prorsi">
        <line x1={xAt(13)} x2={PX1} y1={yP(cand[13].l)} y2={yP(cand[13].l)} stroke={TEAL} strokeOpacity="0.6" strokeDasharray="4 2" />
        <path d={dot(xAt(13), yP(cand[13].l), 1.8)} fill={TEAL} fillOpacity="0.8" />
      </L>
      {(["prorsi", "prostochastics", "prosqueeze", "promacd"] as const).map((slug, k) => {
        const y0 = panelY(k);
        const yy = (f: number) => y0 + 10 + (1 - f) * (PANEL_H - 15);
        let body: ReactNode = null;
        if (slug === "prorsi") {
          const rsi = closes.map((c) => (c - LO) / (HI - LO));
          body = (
            <>
              <line x1={PX0} x2={PX1} y1={yy(0.5)} y2={yy(0.5)} stroke={INK} strokeOpacity={A.frame} strokeDasharray="2 3" />
              <polyline points={pts(rsi, yy)} fill="none" stroke={TEAL} strokeWidth="1.25" />
              <polyline points={pts(smooth(rsi, 4), yy)} fill="none" stroke={VIOLET} strokeOpacity="0.8" />
            </>
          );
        } else if (slug === "prostochastics") {
          body = (
            <>
              {[2, 4, 7, 11].map((s, j) => (
                <polyline
                  key={s}
                  points={pts(smooth(closes, s).map((v) => Math.min(1, Math.max(0, ((v - LO) / (HI - LO)) * 1.1 - 0.05))), yy)}
                  fill="none"
                  stroke={j === 0 ? STRONG_BULL : TEAL}
                  strokeOpacity={[1, 0.8, 0.55, 0.35][j]}
                />
              ))}
            </>
          );
        } else if (slug === "prosqueeze") {
          body = (
            <>
              {closes.map((c, i) => {
                const m = (c - (i ? closes[i - 1] : c)) / 6 + Math.sin(i / 4) * 0.35;
                const h = r2(Math.max(0.8, Math.abs(m) * 12));
                return <path key={i} d={box(xAt(i) - 2.5, m >= 0 ? yy(0.5) - h : yy(0.5), 5, h)} fill={m >= 0 ? TEAL : VIOLET} fillOpacity="0.6" />;
              })}
              {closes.map((_, i) => {
                const on = i >= 8 && i <= 18;
                return <path key={`d${i}`} d={box(xAt(i) - 1.5, y0 + PANEL_H - 5, 3, 3)} fill={INK} fillOpacity={on ? 0.85 : A.mark} />;
              })}
            </>
          );
        } else {
          const f = smooth(closes, 3);
          const s = smooth(closes, 9);
          body = (
            <>
              {f.map((v, i) => {
                const d = (v - s[i]) / 5;
                const h = r2(Math.max(0.8, Math.abs(d) * 10));
                return <path key={i} d={box(xAt(i) - 2.5, d >= 0 ? yy(0.55) - h : yy(0.55), 5, h)} fill={d >= 0 ? TEAL : VIOLET} fillOpacity={d >= 0 ? 0.5 : 0.75} />;
              })}
              {f.map((v, i) => {
                const d = v - s[i];
                return <path key={`r${i}`} d={box(xAt(i) - DX / 2, y0 + PANEL_H - 4, DX - 0.5, 2.5)} fill={d > 0 ? TEAL : VIOLET} fillOpacity={Math.abs(d) > 2 ? 1 : 0.5} />;
              })}
            </>
          );
        }
        return (
          <g key={slug}>
            <path d={box(PX0 + 0.5, y0 + 0.5, PX1 - PX0 - 1, PANEL_H - 1)} fill="none" stroke={INK} strokeOpacity={A.frame} />
            <L p={slug}>
              <text x={PX0 + 5} y={y0 + 3 + t(6)} className="font-mono" fontSize={t(6)} letterSpacing="0.9" fill={INK} fillOpacity={A.mute}>
                {NAME_OF[slug].toUpperCase()}
              </text>
              {body}
            </L>
          </g>
        );
      })}

      {/* ------------------------------------------------------- utility */}
      <L p="bulk-replay-downloader">
        <text x={PX0} y={RY + 2 + t(6)} className="font-mono" fontSize={t(6)} letterSpacing="0.9" fill={INK} fillOpacity={A.mute}>
          MARKET REPLAY · DAYS ON HAND
        </text>
        {Array.from({ length: 30 }).map((_, k) => {
          const x = PX0 + k * ((PX1 - PX0) / 30);
          const w = (PX1 - PX0) / 30 - 2;
          return k < 26 ? (
            <path key={k} d={box(x, stripY, w, 6)} fill={TEAL} fillOpacity="0.55" />
          ) : (
            <path key={k} d={box(x + 0.5, stripY + 0.5, w - 1, 5)} fill="none" stroke={INK} strokeOpacity={A.mark} />
          );
        })}
      </L>
    </svg>
  );
}
