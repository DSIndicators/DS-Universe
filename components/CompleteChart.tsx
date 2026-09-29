"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BUILD_ORDER, built, useCompleteStage, type Series } from "@/components/CompleteStage";
import { DRAWS } from "@/content/complete-chart";
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
 * It BUILDS in the list's order when it scrolls into view (each series lights
 * its row in the list beside it), and pointing at a series or a product in
 * that list isolates its drawing (CompleteStage.tsx holds the shared state).
 * Reduced motion: everything is shown at once and nothing moves.
 *
 * The same rules as the chart reader: a drawn illustration, labelled so; no
 * digits, results or outcomes; crisp edges, no glow. content/complete-chart.ts
 * fails the build if a product joins the lineup without a layer here.
 */

const TEAL = "#19F2E6";
const VIOLET = "#B45CFF";
const BULL = "#009999";
const BEAR = "#A33DFF";
const STRONG_BULL = "#00FFFF";
const LINE = "#2C3139";
const GRID = "#14181D";
const GREY = "#3A4049";
const MUTE = "#7C848D";
const FAINT = "#565D66";
const ONLINE = "#2EE884";

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

const SERIES_OF = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p.series])) as Record<string, Series>;
const NAME_OF = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p.name])) as Record<string, string>;

/** One product's drawing: shown once its series is built, dimmed while the
 *  visitor points at something else. */
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

export function CompleteChart({ className = "" }: { className?: string }) {
  const { focus, setStep } = useCompleteStage();
  const box = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(1);

  // Type size: the drawing scales down on phones; its labels do not shrink
  // below what the desktop shows.
  useEffect(() => {
    const el = box.current;
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
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
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

  const t = (size: number) => size * fs;
  // The replay strip sits under its label, whatever size the label is drawn at.
  const stripY = RY + 7 + t(6);
  const H = stripY + 14;
  // Phones: the 258 tags would crowd the GEX labels at the right edge; the
  // dotted levels stay, the tags go.
  const tags258 = fs < 1.3;

  const caption = focus?.slug
    ? { name: NAME_OF[focus.slug], text: DRAWS[focus.slug] }
    : focus
      ? { name: null, text: PRODUCTS.filter((p) => p.series === focus.series).map((p) => p.name).join(" · ") }
      : null;

  return (
    <div className={`border border-line bg-[rgba(14,17,21,0.72)] ${className}`}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-mute min-[400px]:tracking-[0.16em]">
          One chart <span className="text-slate">·</span> every tool
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ONLINE }} aria-hidden="true" />
          NT8
        </span>
      </div>

      <div ref={box} className="p-2 sm:p-3">
        <noscript>
          <style>{`.cc-l{opacity:1!important}`}</style>
        </noscript>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Every DS Universe product drawn together on one NinjaTrader chart (illustration)">
          <defs>
            <pattern id="cc-scan-t" width="4" height="3" patternUnits="userSpaceOnUse">
              <rect width="4" height="1" fill={TEAL} fillOpacity="0.3" />
            </pattern>
            <pattern id="cc-scan-v" width="4" height="3" patternUnits="userSpaceOnUse">
              <rect width="4" height="1" fill={VIOLET} fillOpacity="0.3" />
            </pattern>
          </defs>

          {/* the chart window */}
          <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="5" fill="#0B0E12" stroke={LINE} />
          <g stroke={GRID}>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={PX0 + (PX1 - PX0) * f} x2={PX0 + (PX1 - PX0) * f} y1={PY0} y2={RY - 6} />
            ))}
          </g>
          <line x1={PX0} x2={W - 6} y1={PY1 + 4} y2={PY1 + 4} stroke={LINE} />
          <text x="8" y="13" className="font-mono" fontSize={t(7)} letterSpacing="1" fill={MUTE}>
            MNQ · 1 MIN
          </text>

          {/* ---------------------------------------------------- essentials */}
          <L p="ds-258">
            {([[70, "80"], [58, "50"], [46, "20"], [34, "00"]] as const).map(([v, tag]) => (
              <g key={tag}>
                <line x1={PX0} x2={PX1} y1={yP(v)} y2={yP(v)} stroke="#A6ADB8" strokeOpacity="0.18" strokeDasharray="1 3" />
                {tags258 && (
                  <text x={PX1 - 2} y={yP(v) - 2} textAnchor="end" className="font-mono" fontSize={t(6)} fill={FAINT}>
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
                  <rect width="42" height="26" fill="#0E1116" stroke={LINE} />
                  {[0, 1, 2, 3, 4, 5].map((j) => {
                    const hh = 4 + ((j * 7 + k * 5) % 9);
                    return <rect key={j} x={5 + j * 6} y={20 - hh - ((j + k) % 3) * 2} width="3" height={hh} fill={GREY} />;
                  })}
                  <line x1="3" x2="39" y1={k % 2 ? 5 : 21} y2={k % 2 ? 5 : 21} stroke={k % 2 ? BEAR : BULL} strokeDasharray="2 2" />
                </g>
              ))}
            </g>
          </L>
          <L p="chart-price">
            <g transform={`translate(${(PX0 + PX1) / 2 - 20} ${PY0 + 4})`}>
              <rect width="88" height="22" fill="none" stroke={LINE} />
              <text x="6" y="9" className="font-mono" fontSize="5.5" letterSpacing="1" fill={FAINT}>
                LAST
              </text>
              <path d="M 8 18 L 12 12.5 L 16 18 Z" fill={TEAL} />
              <rect x="21" y="12" width="60" height="6" fill={TEAL} fillOpacity="0.85" />
            </g>
          </L>
          <L p="toolkit">
            <g transform="translate(6 22)">
              <rect width="20" height="176" fill="#12161B" fillOpacity="0.9" stroke={LINE} />
              {Array.from({ length: 9 }).map((_, k) => (
                <rect key={k} x="6" y={8 + k * 13} width="8" height="8" fill={k === 6 ? "none" : TEAL} fillOpacity={k === 6 ? 0 : 0.7} stroke={k === 6 ? GREY : "none"} />
              ))}
              <line x1="4" x2="16" y1="128" y2="128" stroke={LINE} />
              {[0, 1, 2].map((k) => (
                <rect key={k} x="6" y={136 + k * 12} width="8" height="8" fill="none" stroke={MUTE} />
              ))}
            </g>
          </L>

          {/* ------------------------------------------------------ flagship */}
          <L p="zones">
            <rect x={xAt(11) - 4} y={yP(42.5)} width={PX1 - xAt(11) + 4} height={yP(37.5) - yP(42.5)} fill="url(#cc-scan-t)" />
            <rect x={xAt(11) - 4} y={yP(42.5)} width={PX1 - xAt(11) + 4} height={yP(37.5) - yP(42.5)} fill="none" stroke={TEAL} />
            <rect x={xAt(11) - 4} y={yP(42.5)} width="2" height={yP(37.5) - yP(42.5)} fill={TEAL} />
            <text x={xAt(11)} y={yP(37.5) + 2 + t(6)} className="font-mono" fontSize={t(6)} letterSpacing="0.9" fill={TEAL}>
              DEMAND · DEFENDED
            </text>
          </L>
          <L p="iceberg">
            <rect x={xAt(9) - 3} y={yP(51.4)} width={xAt(19) - xAt(9)} height={yP(49.6) - yP(51.4)} fill="url(#cc-scan-v)" />
            <rect x={xAt(9) - 3} y={yP(51.4)} width={xAt(19) - xAt(9)} height={yP(49.6) - yP(51.4)} fill="none" stroke={VIOLET} />
            {[9, 13, 16].map((i) => (
              <path key={i} d={`M ${xAt(i) - 3} ${yP(51.4) - 5} L ${xAt(i)} ${yP(51.4) - 2} L ${xAt(i) + 3} ${yP(51.4) - 5}`} fill="none" stroke={VIOLET} />
            ))}
          </L>
          <L p="gex">
            {([[74, "CALL WALL", TEAL], [54, "GAMMA FLIP", "#A3ABB3"], [31.5, "PUT WALL", VIOLET]] as const).map(([v, tag, c]) => (
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
                  <rect x={X} y={yP(v) - 2} width={b} height="3.5" fill={TEAL} fillOpacity="0.55" />
                  <rect x={X + b} y={yP(v) - 2} width={s} height="3.5" fill={VIOLET} fillOpacity="0.55" />
                  {k === 2 && <rect x={X - 1.5} y={yP(v) - 3.5} width={b + s + 3} height="6.5" fill="none" stroke={TEAL} />}
                </g>
              );
            })}
          </L>
          <L p="oracle">
            <polyline points={pts(neural.slice(0, cross + 1), yP)} fill="none" stroke={VIOLET} strokeWidth="1.5" />
            <polyline points={pts(neural.slice(cross), yP, cross)} fill="none" stroke={TEAL} strokeWidth="1.5" />
            <path d={`M ${xAt(cross)} ${yP(neural[cross]) + 7} l -3.5 6 h 7 z`} fill={TEAL} />
          </L>

          {/* the price itself — not a layer; it is always there */}
          <g>
            {cand.map((c, i) => {
              const x = xAt(i);
              const col = c.c >= c.o ? "#8A929C" : "#4A515B";
              return (
                <g key={i}>
                  <line x1={x} x2={x} y1={yP(c.h)} y2={yP(c.l)} stroke={col} />
                  <rect x={x - 3} y={yP(Math.max(c.o, c.c))} width="6" height={Math.max(1, Math.abs(yP(c.o) - yP(c.c)))} fill={col} fillOpacity="0.55" stroke={col} strokeWidth="0.75" />
                </g>
              );
            })}
          </g>

          {/* drawn over the candles: the price line rides the last bar */}
          <L p="adaptive-priceline">
            <line x1={xAt(N - 1) + 4} x2={PX1 + 2} y1={yP(last)} y2={yP(last)} stroke={TEAL} />
            <rect x={PX1 + 2} y={yP(last) - 4.5} width="34" height="9" fill={TEAL} fillOpacity="0.9" />
            <line x1={PX1 + 6} x2={PX1 + 22} y1={yP(last)} y2={yP(last)} stroke="#0B0E12" strokeWidth="1.5" />
          </L>

          {/* ------------------------------------------------------ Pro Series */}
          <L p="prorsi">
            <line x1={xAt(13)} x2={PX1} y1={yP(cand[13].l)} y2={yP(cand[13].l)} stroke={BULL} strokeDasharray="4 2" />
            <circle cx={xAt(13)} cy={yP(cand[13].l)} r="1.8" fill={BULL} />
          </L>
          {(["prorsi", "prostochastics", "prosqueeze", "promacd"] as const).map((slug, k) => {
            const y0 = panelY(k);
            const yy = (f: number) => y0 + 10 + (1 - f) * (PANEL_H - 15);
            let body: ReactNode = null;
            if (slug === "prorsi") {
              const rsi = closes.map((c) => (c - LO) / (HI - LO));
              body = (
                <>
                  <line x1={PX0} x2={PX1} y1={yy(0.5)} y2={yy(0.5)} stroke={LINE} strokeDasharray="2 3" />
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
                      stroke={[STRONG_BULL, TEAL, BULL, "#0A6F6F"][j]}
                      strokeOpacity={1 - j * 0.15}
                    />
                  ))}
                </>
              );
            } else if (slug === "prosqueeze") {
              body = (
                <>
                  {closes.map((c, i) => {
                    const m = (c - (i ? closes[i - 1] : c)) / 6 + Math.sin(i / 4) * 0.35;
                    const h = r2(Math.abs(m) * 12);
                    return <rect key={i} x={xAt(i) - 2.5} y={r2(m >= 0 ? yy(0.5) - h : yy(0.5))} width="5" height={Math.max(0.8, h)} fill={m >= 0 ? TEAL : VIOLET} fillOpacity="0.6" />;
                  })}
                  {closes.map((_, i) => (
                    <rect key={`d${i}`} x={xAt(i) - 1.5} y={y0 + PANEL_H - 5} width="3" height="3" fill={i >= 8 && i <= 18 ? "#D9DDE2" : GREY} />
                  ))}
                </>
              );
            } else {
              const f = smooth(closes, 3);
              const s = smooth(closes, 9);
              body = (
                <>
                  {f.map((v, i) => {
                    const d = (v - s[i]) / 5;
                    const h = r2(Math.abs(d) * 10);
                    return <rect key={i} x={xAt(i) - 2.5} y={r2(d >= 0 ? yy(0.55) - h : yy(0.55))} width="5" height={Math.max(0.8, h)} fill={d >= 0 ? BULL : BEAR} fillOpacity="0.7" />;
                  })}
                  {f.map((v, i) => {
                    const d = v - s[i];
                    return <rect key={`r${i}`} x={xAt(i) - DX / 2} y={y0 + PANEL_H - 4} width={DX - 0.5} height="2.5" fill={d > 2 ? TEAL : d > 0 ? BULL : d > -2 ? BEAR : VIOLET} />;
                  })}
                </>
              );
            }
            return (
              <g key={slug}>
                <rect x={PX0} y={y0} width={PX1 - PX0} height={PANEL_H} fill="#0D1014" stroke={LINE} />
                <L p={slug}>
                  <text x={PX0 + 5} y={y0 + 3 + t(6)} className="font-mono" fontSize={t(6)} letterSpacing="0.9" fill={MUTE}>
                    {NAME_OF[slug].toUpperCase()}
                  </text>
                  {body}
                </L>
              </g>
            );
          })}

          {/* ------------------------------------------------------- utility */}
          <L p="bulk-replay-downloader">
            <text x={PX0} y={RY + 2 + t(6)} className="font-mono" fontSize={t(6)} letterSpacing="0.9" fill={MUTE}>
              MARKET REPLAY · DAYS ON HAND
            </text>
            {Array.from({ length: 30 }).map((_, k) => {
              const have = k < 26;
              return (
                <rect key={k} x={PX0 + k * ((PX1 - PX0) / 30)} y={stripY} width={(PX1 - PX0) / 30 - 2} height="6" fill={have ? TEAL : "none"} fillOpacity={have ? 0.55 : 0} stroke={have ? "none" : GREY} />
              );
            })}
          </L>
        </svg>
      </div>

      {/* what the visitor is pointing at, in the product's own words */}
      <div className="flex min-h-[40px] flex-col gap-1 border-t border-line px-4 py-2.5 sm:flex-row sm:items-baseline sm:gap-3" aria-live="polite">
        <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#565D66]">Illustration</span>
        <span className="min-w-0 text-[12.5px] leading-snug text-slate">
          {caption ? (
            <>
              {caption.name && <span className="mr-2 text-ink">{caption.name}</span>}
              {caption.text}
            </>
          ) : (
            <span className="text-mute">
              <span className="hidden [@media(hover:hover)]:inline">Point at a product in the list to find its drawing.</span>
              <span className="[@media(hover:hover)]:hidden">Every DS tool, drawn on one chart.</span>
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
