"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Arrow } from "@/components/ui/Arrow";
import {
  BEAR,
  BULL,
  EM,
  GEX,
  GREY,
  ICE,
  INK,
  Keel,
  LINE,
  NEUTRAL,
  ONLINE,
  ROUTES,
  S_BEAR,
  S_BULL,
  TEAL,
  VIOLET,
  ZONE,
  candlesOf,
  iceHits,
  neural,
  spectrum,
  zoneProfile,
  zoneRead,
  zoneTests,
  type Candle,
  type Route,
} from "@/components/QuestionRouter";

/**
 * THE CHART READER, WIDE (2026-10-09). Tom: "on the home page below the main
 * monitor, move the information of the monitor to the right neatly, then
 * extend our demo chart. make it more unique and informative … we have the
 * room now, we can use the space."
 *
 * From 1280px the reader leaves the narrow well under the hero buttons and
 * takes eight columns under the hero, beside the monitor's own information.
 * It tells the same story as the vertical reader (components/QuestionRouter.tsx,
 * which still serves phones, tablets and 1024–1279px) and uses the same model
 * — the same five routes, the same reads, the same house palette — but the
 * chart is a chart now:
 *
 *   ASK    all five questions are listed at once down the left, each with the
 *          tool that answers it; hover, focus or click one to ask it.
 *   CHART  the chart fills with bare grey candles: the NT8 chart as it is.
 *   DS     the tool is named over the chart, with its name for what it draws.
 *   READ   a cursor walks the SAME candles left to right. Behind it they take
 *          the tool's colours and the drawing is computed from the bars read
 *          so far, exactly as in the vertical reader; ahead of it they stay
 *          grey. Level tags sit in the price axis the way NT8 draws them.
 *
 * Under the chart, two things the narrow reader had no room for:
 *   THE LEDGER  the read in words — state, counts, side — every value computed
 *               from the drawn bars at the cursor (illustrative, never market
 *               data, and no outcome or result anywhere);
 *   THE KEY     what each mark on the chart means, in the product's own terms
 *               (from its README via content/products.ts and the notes at the
 *               top of QuestionRouter.tsx).
 *
 * Twice the bars of the vertical reader: each drawn candle is split into two
 * (deterministically, keeping its open, close and any marked wick), so the
 * chart reads at a real NT8 density. The SVG is laid out in real pixels — its
 * width is measured — so type and hairlines stay crisp at every width.
 *
 * Reduced motion: every stage lit, the read whole, nothing moves or cycles;
 * the questions still switch it. Off screen it does not tick.
 */

const TICK = 100;
const AT = { ask: 0, chart: 4, ds: 9, read: 13 };
const NB = 36;
const END = AT.read + NB + 32; // ≈ 8 s a route

/** Each of the route's 18 candles split into two, open and close kept. */
function denseOf(r: Route): Candle[] {
  const out: Candle[] = [];
  candlesOf(r).forEach((c, i) => {
    const wob = (((i * 5) % 3) - 1) * 1.1;
    const m = c.o + (c.c - c.o) * 0.55 + wob;
    const w = 0.8 + ((i * 3) % 4) * 0.4;
    const a: Candle = { o: c.o, c: m, h: Math.max(c.o, m) + w * 0.8, l: Math.min(c.o, m) - w };
    const b: Candle = { o: m, c: c.c, h: Math.max(m, c.c) + w * 0.7, l: Math.min(m, c.c) - w * 0.9 };
    if (r.highs?.[i] !== undefined) b.h = r.highs[i];
    if (r.lows?.[i] !== undefined) b.l = r.lows[i];
    out.push(a, b);
  });
  return out;
}
const DENSE = ROUTES.map(denseOf);

type Cell = { label: string; value: ReactNode; color?: string };
type KeyItem = { glyph: ReactNode; text: string };

export function ChartReader({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [clock, setClock] = useState({ route: 0, tick: 0 });
  const [held, setHeld] = useState(false);
  const [calm, setCalm] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(760);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w > 0) setW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setCalm(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    if (calm || !seen) return;
    const id = window.setInterval(() => {
      setClock((c) => (c.tick < END ? { ...c, tick: c.tick + 1 } : held ? c : { route: (c.route + 1) % ROUTES.length, tick: 0 }));
    }, TICK);
    return () => window.clearInterval(id);
  }, [calm, held, seen]);

  const pick = (i: number) => {
    setHeld(true);
    setClock((c) => (c.route === i ? c : { route: i, tick: 0 }));
  };

  const { route, tick } = clock;
  const t = calm ? END : tick;
  const r = ROUTES[route];
  const tone = r.tone === "bull" ? TEAL : VIOLET;
  const ghost = r.tone === "bull" ? VIOLET : TEAL;
  const lit = { ask: t >= AT.ask, chart: t >= AT.chart, ds: t >= AT.ds, read: t >= AT.read };
  const all = DENSE[route];
  const k = lit.read ? Math.max(0, Math.min(NB, t - AT.read + 1)) : 0;
  const cs = all.slice(0, k);

  const read = readOf({ uid, r, all, cs, k, W, tone, ghost, calm, chart: lit.chart, ds: lit.ds, readOn: lit.read });

  const steps: { n: string; label: string; on: boolean }[] = [
    { n: "01", label: "Ask", on: lit.ask },
    { n: "02", label: "Chart", on: lit.chart },
    { n: "03", label: "DS", on: lit.ds },
    { n: "04", label: "Read", on: lit.read },
  ];

  return (
    <div
      ref={box}
      className={`overflow-hidden rounded-[12px] border border-line bg-[rgba(12,15,19,0.78)] backdrop-blur-[2px] ${className}`}
      onMouseLeave={() => setHeld(false)}
    >
      {/* ------------------------------------------------------------ head */}
      <div className="flex items-center justify-between gap-6 border-b border-line px-5 py-3">
        <ol className="flex items-center gap-3 font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.16em]" aria-label="How the reader works">
          {steps.map((s, i) => (
            <li key={s.n} className="flex items-center gap-3">
              {i > 0 && (
                <span
                  className={`block h-px w-8 ${s.on && !calm ? "cr-dash" : ""}`}
                  style={s.on ? ({ "--qr": tone, background: calm ? tone : undefined } as CSSProperties) : { background: LINE }}
                  aria-hidden="true"
                />
              )}
              <span className="transition-colors duration-300" style={{ color: s.on ? tone : "#5F666F" }}>
                {s.n}
              </span>
              <span className={`transition-colors duration-300 ${s.on ? "text-ink" : "text-mute/70"}`}>{s.label}</span>
            </li>
          ))}
        </ol>
        <span className="flex items-center gap-2 font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.16em] text-slate">
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping" style={{ background: ONLINE }} />
            <span
              className="relative h-1.5 w-1.5 rounded-full"
              style={{ background: ONLINE, boxShadow: "0 0 6px 1px rgba(46,232,132,0.7), 0 0 14px 2px rgba(46,232,132,0.3)" }}
            />
          </span>
          NT8
        </span>
      </div>

      {/* Two arrangements of one reader. From 1760px: the questions down the
          left, the answer under them, the chart to the right. From 1280px to
          1759px, where eight columns are narrower: the questions as five tabs
          across the top, the chart full width, the answer beside the key. */}
      <div className="grid min-[1760px]:grid-cols-[minmax(250px,29%)_minmax(0,1fr)]">
        {/* ------------------------------------------------------- the questions */}
        <div className="flex flex-col border-b border-line min-[1760px]:border-b-0 min-[1760px]:border-r">
          <p className="hidden px-5 pb-2 pt-4 font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.16em] text-mute min-[1760px]:block">The question</p>
          <div role="tablist" aria-orientation="vertical" aria-label="Pick a question" className="grid grid-cols-5 min-[1760px]:block">
            {ROUTES.map((q, i) => {
              const on = i === route;
              const c = q.tone === "bull" ? TEAL : VIOLET;
              return (
                <button
                  key={q.tag}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onMouseEnter={() => pick(i)}
                  onFocus={() => pick(i)}
                  onClick={() => pick(i)}
                  className="relative w-full border-l border-line px-4 py-3.5 text-left outline-none transition-colors duration-300 first:border-l-0 focus-visible:bg-white/[0.03] min-[1760px]:grid min-[1760px]:grid-cols-[4.6rem_minmax(0,1fr)] min-[1760px]:items-baseline min-[1760px]:gap-x-2 min-[1760px]:border-l-0 min-[1760px]:border-t min-[1760px]:px-5 min-[1760px]:py-3 min-[1760px]:first:border-t-0"
                  style={{ background: on ? `${c}0D` : undefined }}
                >
                  <span
                    className="absolute left-0 top-0 h-[2px] w-full transition-opacity duration-300 min-[1760px]:bottom-0 min-[1760px]:h-auto min-[1760px]:w-[2px]"
                    style={{ background: c, opacity: on ? 1 : 0 }}
                    aria-hidden="true"
                  />
                  <span className="block font-mono text-[length:calc(9.5px*var(--type))] tracking-[0.14em] transition-colors duration-300" style={{ color: on ? c : "#6B737C" }}>
                    {q.tag}
                  </span>
                  <span className="mt-1.5 block min-w-0 min-[1760px]:mt-0">
                    <span
                      className={`block min-h-[2.7em] text-[length:calc(13.5px*var(--type))] leading-snug transition-colors duration-300 text-pretty min-[1760px]:min-h-0 min-[1760px]:text-[length:calc(14px*var(--type))] ${on ? "text-ink" : "text-slate"}`}
                    >
                      {q.question}
                    </span>
                    <span className="mt-1 block font-mono text-[length:calc(9.5px*var(--type))] uppercase tracking-[0.14em] text-mute/80 min-[1760px]:mt-0.5">{q.product}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* the tool that answers it (wide arrangement) */}
          <Answer r={r} tone={tone} on={lit.ds} className="mt-auto hidden border-t border-line px-5 pb-5 pt-4 min-[1760px]:block" />
        </div>

        {/* ----------------------------------------------------------- the chart */}
        <div className="min-w-0 p-5">
          <div ref={stage} className="w-full">
            {read.svg}
          </div>

          {/* the ledger: the read in words, at the cursor */}
          <dl
            className="mt-4 grid border-y border-line transition-opacity duration-500"
            style={{ gridTemplateColumns: `repeat(${read.ledger.length}, minmax(0, 1fr))`, opacity: lit.read ? 1 : 0.35 }}
          >
            {read.ledger.map((c, i) => (
              <div key={c.label} className={`px-4 py-3 ${i ? "border-l border-line" : "pl-0"}`}>
                <dt className="font-mono text-[length:calc(9.5px*var(--type))] uppercase tracking-[0.16em] text-mute">{c.label}</dt>
                <dd className="mt-1.5 truncate font-mono text-[length:calc(12px*var(--type))] uppercase tracking-[0.1em]" style={{ color: c.color ?? INK }}>
                  {c.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-x-8 min-[1760px]:mt-4 min-[1760px]:block">
          {/* the tool that answers it (narrow arrangement) */}
          <Answer r={r} tone={tone} on={lit.ds} className="min-[1760px]:hidden" />
          {/* the key: what each mark means */}
          <ul className="grid content-start gap-y-2.5 min-[1760px]:grid-cols-2 min-[1760px]:gap-x-6" aria-label={`${r.product}: what the marks mean`}>
            {read.key.map((it) => (
              <li key={it.text} className="flex items-center gap-3 text-[length:calc(12.5px*var(--type))] leading-snug text-slate">
                <svg viewBox="0 0 22 12" className="h-3 w-[22px] shrink-0" aria-hidden="true">
                  {it.glyph}
                </svg>
                {it.text}
              </li>
            ))}
          </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const MUTE = "#7C848D";
const DIM = "#565D66";

function readOf({
  uid,
  r,
  all,
  cs,
  k,
  W,
  tone,
  ghost,
  calm,
  chart,
  ds,
  readOn,
}: {
  uid: string;
  r: Route;
  all: Candle[];
  cs: Candle[];
  k: number;
  W: number;
  tone: string;
  ghost: string;
  calm: boolean;
  chart: boolean;
  ds: boolean;
  readOn: boolean;
}): { svg: ReactNode; ledger: Cell[]; key: KeyItem[] } {
  const H = Math.round(Math.min(380, Math.max(280, W * 0.5)));
  const AX = 104; // the price axis column
  const XE = W - AX; // the axis line
  const TOP = 40;
  const BOT = 28;
  const PL = 14;
  const RUN = Math.round(Math.min(116, Math.max(84, W * 0.13))); // the runway past the last bar
  const DX = (XE - RUN - PL - 10) / (NB - 1);
  const bw = Math.max(3, Math.min(9, DX * 0.56));
  const x = (i: number) => PL + 10 + i * DX;
  const [lo, hi] = r.range;
  const y = (v: number) => TOP + (1 - (v - lo) / (hi - lo)) * (H - TOP - BOT);
  const clampY = (v: number) => Math.max(TOP + 9, Math.min(H - BOT - 9, v));
  const scan = `${uid}-wscan`;
  const sheen = `${uid}-wsheen`;
  const clip = `${uid}-wclip`;
  const last = cs[cs.length - 1];

  let clipShape: ReactNode = null;
  let drawing: ReactNode = null;
  let overlay: ReactNode = null;
  let tags: ReactNode = null;
  let ledger: Cell[] = [];
  let key: KeyItem[] = [];
  let candleColor: (i: number, c: Candle) => string = (_, c) => (c.c >= c.o ? BULL : BEAR);

  /** A level tag in the price axis, the way NT8 draws a level's price marker. */
  const tag = (yy: number, label: string, color: string, solid = true) => {
    const ty = clampY(yy);
    return (
      <g key={label}>
        <line x1={XE} x2={XE + 6} y1={ty} y2={ty} stroke={color} strokeOpacity={solid ? 0.9 : 0.4} />
        <rect x={XE + 6} y={ty - 8} width={AX - 12} height="16" rx="2" fill={color} fillOpacity={solid ? 0.16 : 0.05} stroke={color} strokeOpacity={solid ? 0.85 : 0.3} />
        <text x={XE + 12} y={ty + 3.5} className="font-mono" fontSize="9.5" letterSpacing="1" fill={solid ? color : MUTE}>
          {label}
        </text>
      </g>
    );
  };

  if (r.kind === "zones") {
    const { state, defended } = zoneRead(cs);
    const tests = zoneTests(cs);
    const yT = y(ZONE.hi);
    const yB = y(ZONE.lo);
    const xs = PL + 2;
    const xe = XE - 8;
    const dim = state === "BREAKING";
    const edge = state === "APPROACHING" || state === "TESTING" ? S_BULL : tone;
    const rows = zoneProfile(cs);
    const max = Math.max(...rows.map((w) => w.buy + w.sell));
    const PLEN = RUN - 26;
    const rowH = Math.max(2, (yB - yT) / rows.length - 2);
    const poc = rows.reduce((a, b) => (b.buy + b.sell > a.buy + a.sell ? b : a));
    const buy = rows.reduce((n, w) => n + w.buy, 0);
    const sell = rows.reduce((n, w) => n + w.sell, 0);
    const buyShare = buy / (buy + sell);
    const sellers = buyShare < 0.5;
    const verdict = defended > 0 && sellers && 1 - buyShare >= 0.55 ? "ABSORBED" : "BALANCED";
    const word = state === "DEFENDED" && defended > 1 ? `DEFENDED ${defended}×` : state;
    clipShape = <rect x={xs} y={yT} width={xe - xs} height={yB - yT} />;
    drawing = (
      <g opacity={dim ? 0.45 : 1} className={calm ? "" : "qr-breathe"}>
        <rect x={xs} y={yT} width={xe - xs} height={yB - yT} fill={`url(#${scan})`} opacity="0.5" />
        <rect x={xs} y={yT} width={xe - xs} height={yB - yT} fill={tone} fillOpacity="0.05" />
        {state === "TESTING" && last && (
          <rect x={xs} y={yT} width={xe - xs} height={Math.max(0, y(Math.max(last.l, ZONE.lo)) - yT)} fill={S_BULL} fillOpacity="0.14" />
        )}
        <line x1={xs + 1} x2={xe + 1} y1={yT - 1} y2={yT - 1} stroke={ghost} strokeOpacity="0.3" />
        <line x1={xs} x2={xe} y1={yT} y2={yT} stroke={edge} strokeWidth="1.25" />
        <line x1={xs} x2={xe} y1={yB} y2={yB} stroke={dim ? S_BULL : tone} strokeOpacity="0.85" strokeDasharray="1.5 3" />
        <line x1={xs} x2={xs} y1={yT} y2={yB} stroke={tone} strokeWidth="1.25" />
        {rows.map((w) => {
          const L = ((w.buy + w.sell) / max) * PLEN;
          const bwid = (w.buy / (w.buy + w.sell)) * L;
          const yy = y(w.v) - rowH / 2;
          return (
            <g key={w.v}>
              <rect x={xe - L} y={yy} width={bwid} height={rowH} fill={TEAL} fillOpacity="0.7" />
              <rect x={xe - L + bwid} y={yy} width={L - bwid} height={rowH} fill={VIOLET} fillOpacity="0.7" />
              {w === poc && <rect x={xe - L - 4} y={yy} width="2" height={rowH} fill={INK} />}
            </g>
          );
        })}
      </g>
    );
    overlay = (
      <g opacity={dim ? 0.45 : 1}>
        {tests.map(({ i, held }) => {
          const cx = x(i);
          const d = `M ${cx} ${yT - 3.6} L ${cx + 3.6} ${yT} L ${cx} ${yT + 3.6} L ${cx - 3.6} ${yT} Z`;
          return held ? (
            <path key={i} d={d} fill={INK} fillOpacity="0.92" />
          ) : (
            <path key={i} d={d} fill="#0B0E12" stroke={INK} strokeOpacity="0.85" strokeWidth="1" />
          );
        })}
      </g>
    );
    tags = tag(yT, "DEMAND", edge);
    ledger = [
      { label: "Zone", value: "Demand", color: tone },
      { label: "State", value: word, color: edge },
      {
        label: "Buy | Sell",
        value: (
          <span className="flex items-center gap-2.5">
            <span className="relative block h-[3px] w-14 overflow-hidden" aria-hidden="true">
              <span className="absolute inset-y-0 left-0" style={{ width: `${buyShare * 100}%`, background: TEAL }} />
              <span className="absolute inset-y-0 right-0" style={{ width: `${(1 - buyShare) * 100}%`, background: VIOLET }} />
            </span>
            <span style={{ color: sellers ? VIOLET : TEAL }}>{`${sellers ? "Sell" : "Buy"} ${Math.round((sellers ? 1 - buyShare : buyShare) * 100)}%`}</span>
          </span>
        ),
      },
      { label: "Read", value: verdict, color: verdict === "ABSORBED" ? tone : INK },
    ];
    key = [
      { glyph: <><rect x="1" y="3" width="20" height="6" fill={TEAL} fillOpacity="0.12" /><line x1="1" x2="21" y1="3" y2="3" stroke={TEAL} /><line x1="1" x2="21" y1="9" y2="9" stroke={TEAL} strokeDasharray="1.5 2" /></>, text: "The zone: action edge solid, far edge dotted" },
      { glyph: <path d="M 11 2 L 15 6 L 11 10 L 7 6 Z" fill={INK} />, text: "A test that price was turned back from" },
      { glyph: <path d="M 11 2 L 15 6 L 11 10 L 7 6 Z" fill="none" stroke={INK} />, text: "A test that closed inside the zone" },
      { glyph: <><rect x="3" y="2.5" width="9" height="3" fill={TEAL} /><rect x="12" y="2.5" width="7" height="3" fill={VIOLET} /><rect x="6" y="7" width="5" height="3" fill={TEAL} /><rect x="11" y="7" width="8" height="3" fill={VIOLET} /></>, text: "The zone's own buying and selling, POC ticked" },
    ];
  }

  if (r.kind === "iceberg") {
    const hits = iceHits(cs);
    const tests = hits.length;
    const live = tests >= 2;
    const lastHit = tests ? hits[tests - 1].i : -99;
    const since = cs.length - 1 - lastHit;
    const testing = live && since <= 12; // six bars of the vertical reader = twelve here
    const yL = y(ICE.level);
    const yT = y(ICE.hi);
    const yB = y(ICE.lo);
    const xe = XE - 8;
    const x1 = live ? x(hits[0].i) : xe;
    clipShape = live ? <rect x={x1} y={yT} width={xe - x1} height={yB - yT} /> : null;
    drawing = live ? (
      <g>
        <rect x={x1} y={yT} width={xe - x1} height={yB - yT} fill={`url(#${scan})`} opacity="0.5" />
        <rect x={x1} y={yT} width={xe - x1} height={yB - yT} fill={tone} fillOpacity="0.06" />
        <line x1={x1 + 1} x2={xe + 1} y1={yL - 1} y2={yL - 1} stroke={ghost} strokeOpacity="0.3" />
        <line x1={x1} x2={xe} y1={yL} y2={yL} stroke={tone} strokeWidth="1.25" />
        <line x1={x1} x2={x1} y1={yT - 2} y2={yB + 2} stroke={tone} strokeWidth="1.25" />
      </g>
    ) : null;
    overlay = live ? (
      <g>
        {hits.map(({ i, c }, n) => {
          const cx = x(i);
          const y0 = y(c.h) - 3;
          const newest = n === tests - 1 && testing;
          return (
            <g key={i}>
              <path d={`M ${cx} ${y0} l -2 -2.6 l 3.6 -2.2 l -2.6 -2.8 l 1.6 -2.2`} fill="none" stroke={newest ? S_BEAR : tone} strokeWidth="1.25" strokeLinejoin="bevel" />
              {newest && <circle cx={cx} cy={y0 - 5} r="6.5" fill="none" stroke={S_BEAR} strokeWidth="1" />}
            </g>
          );
        })}
        <Keel x={xe - RUN / 2 + 6} y={yL} s={2.1 + 0.18 * (tests - 2)} c={testing ? S_BEAR : tone} />
      </g>
    ) : null;
    tags = live ? tag(yL, "ICE OFFER", testing ? S_BEAR : tone) : tag(yL, "ICE OFFER", MUTE, false);
    ledger = [
      { label: "Level", value: "Ice offer", color: live ? tone : MUTE },
      { label: "Tests", value: live ? `${tests}×` : `${tests} of 2`, color: live ? tone : MUTE },
      { label: "Last test", value: tests ? `${since} ${since === 1 ? "bar" : "bars"} ago` : "None yet", color: tests ? INK : MUTE },
      { label: "State", value: testing ? "Testing" : live ? "Confirmed" : "Unconfirmed", color: testing ? S_BEAR : live ? tone : MUTE },
    ];
    key = [
      { glyph: <><rect x="1" y="3" width="20" height="6" fill={VIOLET} fillOpacity="0.14" /><line x1="1" x2="21" y1="6" y2="6" stroke={VIOLET} /></>, text: "The exact level, with its tolerance tinted" },
      { glyph: <path d="M 11 11 l -2 -2.6 l 3.6 -2.2 l -2.6 -2.8 l 1.6 -2.2" fill="none" stroke={VIOLET} strokeWidth="1.2" />, text: "A wick turned back at the level" },
      { glyph: <g transform="translate(11 5)"><path d="M -3.8 0.6 L 3.8 0.6 L 2.4 3.6 L 0.9 6 L -1.1 5 L -2.6 3 Z" fill={VIOLET} fillOpacity="0.45" /><path d="M -3.4 0 L 0 -4 L 3.4 0 Z" fill={VIOLET} /></g>, text: "The iceberg, sized by what it absorbed" },
      { glyph: <circle cx="11" cy="6" r="4.5" fill="none" stroke={S_BEAR} />, text: "Testing: the newest test, still live" },
    ];
  }

  if (r.kind === "gex") {
    const near = last ? GEX.reduce((a, b) => (Math.abs(b.v - last.c) < Math.abs(a.v - last.c) ? b : a)) : null;
    const flip = GEX[1].v;
    const yEt = y(EM.hi);
    const yEb = y(EM.lo);
    clipShape = <rect x={PL} y={yEt} width={XE - PL - 8} height={yEb - yEt} />;
    drawing = (
      <g>
        <rect x={PL} y={yEt} width={XE - PL - 8} height={yEb - yEt} fill={`url(#${scan})`} opacity="0.26" />
        <line x1={PL} x2={XE - 8} y1={yEt} y2={yEt} stroke={MUTE} strokeOpacity="0.35" strokeDasharray="1 3" />
        <line x1={PL} x2={XE - 8} y1={yEb} y2={yEb} stroke={MUTE} strokeOpacity="0.35" strokeDasharray="1 3" />
        {GEX.map((g) => {
          const yy = y(g.v);
          const hot = near === g;
          return (
            <g key={g.label}>
              <line x1={PL + 1} x2={XE + 1} y1={yy - 1} y2={yy - 1} stroke={ghost} strokeOpacity="0.28" />
              <line x1={PL} x2={XE} y1={yy} y2={yy} stroke={g.color} strokeWidth={hot ? 1.75 : 1} strokeOpacity={hot ? 1 : 0.55} strokeDasharray={g.label === "GAMMA FLIP" ? "5 4" : undefined} />
            </g>
          );
        })}
        <text x={PL + 4} y={yEb - 5} className="font-mono" fontSize="9.5" letterSpacing="1" fill={MUTE}>
          EXPECTED MOVE
        </text>
      </g>
    );
    tags = <>{GEX.map((g) => tag(y(g.v), g.label, g.color, near === g))}</>;
    ledger = [
      { label: "Nearest", value: near ? near.label : "—", color: near ? near.color : MUTE },
      { label: "Price vs flip", value: last ? (last.c >= flip ? "Above the flip" : "Below the flip") : "—", color: last ? INK : MUTE },
      { label: "Expected move", value: last ? (last.c <= EM.hi && last.c >= EM.lo ? "Inside" : "Outside") : "—", color: last ? INK : MUTE },
    ];
    key = [
      { glyph: <line x1="1" x2="21" y1="6" y2="6" stroke={TEAL} strokeWidth="1.5" />, text: "Call Wall" },
      { glyph: <line x1="1" x2="21" y1="6" y2="6" stroke="#A3ABB3" strokeWidth="1.5" strokeDasharray="4 3" />, text: "Gamma Flip" },
      { glyph: <line x1="1" x2="21" y1="6" y2="6" stroke={VIOLET} strokeWidth="1.5" />, text: "Put Wall" },
      { glyph: <><rect x="1" y="2" width="20" height="8" fill={TEAL} fillOpacity="0.12" /><line x1="1" x2="21" y1="2" y2="2" stroke={MUTE} strokeDasharray="1 2" /><line x1="1" x2="21" y1="10" y2="10" stroke={MUTE} strokeDasharray="1 2" /></>, text: "The expected move" },
    ];
  }

  if (r.kind === "flow") {
    const rows: { v: number; buy: number; sell: number }[] = [];
    for (let v = 34; v <= 70; v += 4) rows.push({ v, buy: 0, sell: 0 });
    for (const c of cs)
      for (const row of rows)
        if (row.v + 2 >= c.l && row.v - 2 <= c.h) {
          if (c.c >= c.o) row.buy += 1;
          else row.sell += 1;
        }
    const max = Math.max(1, ...rows.map((w) => w.buy + w.sell));
    const heavy = cs.length ? rows.reduce((a, b) => (b.buy + b.sell > a.buy + a.sell ? b : a)) : null;
    const X = XE - RUN + 12;
    const L = RUN - 22;
    const rowH = Math.abs(y(54) - y(50)) - 2;
    const buy = rows.reduce((n, w) => n + w.buy, 0);
    const sell = rows.reduce((n, w) => n + w.sell, 0);
    const tot = Math.max(1, buy + sell);
    clipShape = <rect x={X - 4} y={TOP} width={L + 10} height={H - TOP - BOT} />;
    drawing = (
      <g>
        {rows.map((w) => {
          const yy = y(w.v) - rowH / 2;
          const bwid = (w.buy / max) * L;
          const swid = (w.sell / max) * L;
          const hot = heavy === w && w.buy + w.sell > 0;
          return (
            <g key={w.v}>
              <rect x={X} y={yy} width={bwid} height={rowH} fill={TEAL} fillOpacity="0.55" />
              <rect x={X + bwid} y={yy} width={swid} height={rowH} fill={VIOLET} fillOpacity="0.55" />
              {hot && (
                <>
                  <rect x={X - 3} y={yy - 2} width={L + 8} height={rowH + 4} fill="none" stroke={TEAL} strokeWidth="1" />
                  <line x1={PL} x2={X - 6} y1={yy + rowH / 2} y2={yy + rowH / 2} stroke={TEAL} strokeOpacity="0.45" strokeDasharray="2 4" />
                </>
              )}
            </g>
          );
        })}
        <text x={X} y={TOP - 6} className="font-mono" fontSize="9.5" letterSpacing="1" fill={MUTE}>
          <tspan fill={TEAL}>BUY</tspan> / <tspan fill={VIOLET}>SELL</tspan>
        </text>
      </g>
    );
    tags = heavy && heavy.buy + heavy.sell > 0 ? tag(y(heavy.v), "HEAVY ROW", TEAL) : null;
    ledger = [
      { label: "Buying", value: cs.length ? `${Math.round((buy / tot) * 100)}%` : "—", color: cs.length ? TEAL : MUTE },
      { label: "Selling", value: cs.length ? `${Math.round((sell / tot) * 100)}%` : "—", color: cs.length ? VIOLET : MUTE },
      {
        label: "Heavy row",
        value: heavy && heavy.buy + heavy.sell > 0 ? (heavy.buy >= heavy.sell ? "Buyers led it" : "Sellers led it") : "—",
        color: heavy && heavy.buy + heavy.sell > 0 ? (heavy.buy >= heavy.sell ? TEAL : VIOLET) : MUTE,
      },
    ];
    key = [
      { glyph: <><rect x="1" y="2" width="11" height="3" fill={TEAL} fillOpacity="0.7" /><rect x="12" y="2" width="6" height="3" fill={VIOLET} fillOpacity="0.7" /><rect x="1" y="7" width="6" height="3" fill={TEAL} fillOpacity="0.7" /><rect x="7" y="7" width="12" height="3" fill={VIOLET} fillOpacity="0.7" /></>, text: "Buying and selling traded at each price" },
      { glyph: <rect x="1.5" y="3" width="19" height="6" fill="none" stroke={TEAL} />, text: "The heavy row: where the most traded" },
      { glyph: <line x1="1" x2="21" y1="6" y2="6" stroke={TEAL} strokeOpacity="0.6" strokeDasharray="2 3" />, text: "Its price, carried back across the chart" },
      { glyph: <><line x1="7" x2="7" y1="1" y2="11" stroke={BULL} /><rect x="5" y="3" width="4" height="6" fill={BULL} fillOpacity="0.55" /><line x1="15" x2="15" y1="1" y2="11" stroke={BEAR} /><rect x="13" y="4" width="4" height="5" fill={BEAR} fillOpacity="0.55" /></>, text: "Up candles count as buying, down as selling" },
    ];
  }

  if (r.kind === "oracle") {
    const nl = neural(cs);
    const pts = nl.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const side = last ? (last.c >= nl[nl.length - 1] ? "LONG" : "SHORT") : null;
    const flip = cs.findIndex((c, i) => i > 0 && c.c >= nl[i] && cs[i - 1].c < nl[i - 1]);
    const slope = nl.length > 3 ? nl[nl.length - 1] - nl[nl.length - 4] : 0;
    const spec = last ? spectrum(cs, cs.length - 1) : NEUTRAL;
    const specWord = { [S_BULL]: "Strong bull", [BULL]: "Bull", [NEUTRAL]: "Neutral", [BEAR]: "Bear", [S_BEAR]: "Strong bear" }[spec] ?? "—";
    candleColor = (i) => spectrum(cs, i);
    clipShape = <polyline points={pts} fill="none" stroke="#fff" strokeWidth="8" />;
    drawing = cs.length ? (
      <g>
        <polyline points={pts} fill="none" stroke={ghost} strokeOpacity="0.35" strokeWidth="1" transform="translate(1,-1)" />
        <polyline points={pts} fill="none" stroke={side === "LONG" ? TEAL : VIOLET} strokeWidth="2" strokeLinejoin="round" />
        {flip > 0 && (
          <path d={`M ${x(flip) - 6} ${y(cs[flip].l) + 14} L ${x(flip)} ${y(cs[flip].l) + 5} L ${x(flip) + 6} ${y(cs[flip].l) + 14} Z`} fill={TEAL} />
        )}
      </g>
    ) : null;
    tags = cs.length ? tag(y(nl[nl.length - 1]), "NEURAL LINE", side === "LONG" ? TEAL : VIOLET) : null;
    ledger = [
      { label: "Your side", value: side ? (side === "LONG" ? "Look long" : "Look short") : "—", color: side === "LONG" ? TEAL : side ? VIOLET : MUTE },
      { label: "Neural Line", value: nl.length > 3 ? (slope >= 0 ? "Rising" : "Falling") : "—", color: nl.length > 3 ? INK : MUTE },
      { label: "Last candle", value: last ? specWord : "—", color: last ? spec : MUTE },
    ];
    key = [
      { glyph: <polyline points="1,9 8,7 14,5 21,3" fill="none" stroke={TEAL} strokeWidth="1.6" />, text: "The Neural Line: teal with price above it" },
      { glyph: <polyline points="1,3 8,5 14,7 21,9" fill="none" stroke={VIOLET} strokeWidth="1.6" />, text: "Violet with price below it" },
      { glyph: <path d="M 6 11 L 11 3 L 16 11 Z" fill={TEAL} />, text: "A Major signal where price crosses it" },
      { glyph: <>{[S_BEAR, BEAR, NEUTRAL, BULL, S_BULL].map((c, n) => <rect key={c} x={1 + n * 4.2} y="3" width="3.4" height="6" fill={c} />)}</>, text: "Candle spectrum, strong bear to strong bull" },
    ];
  }

  const corner = (cx: number, cy: number, sx: number, sy: number) => (
    <path d={`M ${cx} ${cy + 10 * sy} L ${cx} ${cy} L ${cx + 10 * sx} ${cy}`} fill="none" stroke={tone} strokeWidth="1" strokeOpacity={readOn ? 0.8 : 0.25} />
  );
  const hLines = [0.2, 0.4, 0.6, 0.8].map((f) => TOP + f * (H - TOP - BOT));
  const vLines = [6, 12, 18, 24, 30].map((i) => x(i));
  const cx = k > 0 ? x(k - 1) : null;
  const reading = readOn && k < NB;

  const svg = (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="block h-auto w-full"
      role="img"
      aria-label={`${r.product} — ${r.title}, read over a drawn NT8 chart (illustration)`}
    >
      <defs>
        <pattern id={scan} width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill={tone} fillOpacity="0.32" />
        </pattern>
        <linearGradient id={sheen} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clip}>{clipShape}</clipPath>
      </defs>

      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="6" fill="#0A0D11" stroke={LINE} />
      {/* the chart's grid, its axis and its time scale */}
      <g stroke="#151A20" strokeWidth="1">
        {hLines.map((yy) => (
          <line key={`h${yy}`} x1={1} x2={XE} y1={yy} y2={yy} />
        ))}
        {vLines.map((xx) => (
          <line key={`v${xx}`} x1={xx} x2={xx} y1={TOP - 10} y2={H - BOT} />
        ))}
      </g>
      <line x1={XE} x2={XE} y1={TOP - 10} y2={H - BOT} stroke={LINE} />
      <line x1={1} x2={XE} y1={H - BOT} y2={H - BOT} stroke={LINE} />
      {hLines.map((yy) => (
        <line key={`t${yy}`} x1={XE} x2={XE + 4} y1={yy} y2={yy} stroke={LINE} />
      ))}
      {vLines.map((xx) => (
        <line key={`b${xx}`} x1={xx} x2={xx} y1={H - BOT} y2={H - BOT + 4} stroke={LINE} />
      ))}
      {corner(0.5, 0.5, 1, 1)}
      {corner(W - 0.5, 0.5, -1, 1)}
      {corner(0.5, H - 0.5, 1, -1)}
      {corner(W - 0.5, H - 0.5, -1, -1)}

      {/* the title strip */}
      <text x="14" y="21" className="font-mono" fontSize="10" letterSpacing="1.2" fill={ds ? tone : MUTE}>
        {ds ? `${r.product.toUpperCase()} · ${r.title.toUpperCase()} · ON YOUR CHART` : "NT8 · CHART"}
      </text>
      <text x={W - 12} y="21" textAnchor="end" className="font-mono" fontSize="9" letterSpacing="1.2" fill={DIM}>
        ILLUSTRATION
      </text>

      {/* the bare chart: every candle grey until the cursor has read it */}
      {chart && (
        <g opacity={readOn ? 0.32 : 0.9}>
          {all.map((c, i) =>
            i < k ? null : <Bar key={i} c={c} cx={x(i)} w={bw} y={y} color={GREY} fill={0.9} />,
          )}
        </g>
      )}

      {readOn && drawing}
      {readOn && cs.map((c, i) => <Bar key={i} c={c} cx={x(i)} w={bw} y={y} color={candleColor(i, c)} fill={0.6} />)}
      {readOn && overlay}

      {/* the cursor and the last price */}
      {readOn && cx !== null && last && (
        <g>
          <line x1={cx} x2={XE} y1={y(last.c)} y2={y(last.c)} stroke={INK} strokeOpacity="0.28" strokeDasharray="1 3" />
          <path d={`M ${XE + 1} ${y(last.c)} l 6 -4 v 8 Z`} fill={INK} fillOpacity="0.8" />
          {reading && <line x1={cx + DX / 2} x2={cx + DX / 2} y1={TOP - 10} y2={H - BOT} stroke={tone} strokeOpacity="0.45" />}
          <g transform={`translate(${Math.min(cx, XE - 44)} ${H - BOT + 6})`}>
            <rect x="-22" y="0" width="44" height="15" rx="2" fill="#0A0D11" stroke={reading ? tone : LINE} strokeOpacity={reading ? 0.7 : 1} />
            <text x="0" y="10.5" textAnchor="middle" className="font-mono" fontSize="9" letterSpacing="0.8" fill={reading ? tone : MUTE}>
              {`BAR ${k}`}
            </text>
          </g>
        </g>
      )}
      {readOn && tags}

      {!calm && readOn && clipShape && (
        <g clipPath={`url(#${clip})`}>
          <rect x="-120" y="0" width="120" height={H} fill={`url(#${sheen})`}>
            <animate attributeName="x" from="-120" to={W} dur="3.6s" repeatCount="indefinite" />
          </rect>
        </g>
      )}
    </svg>
  );

  return { svg, ledger, key };
}

function Answer({ r, tone, on, className = "" }: { r: Route; tone: string; on: boolean; className?: string }) {
  return (
    <div className={`transition-opacity duration-500 ${className}`} style={{ opacity: on ? 1 : 0.4 }}>
      <p className="font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.16em] text-mute">The answer</p>
      <p className="mt-2.5 text-[length:calc(17px*var(--type))] leading-tight text-ink">{r.product}</p>
      <p className="mt-1 text-[length:calc(13.5px*var(--type))] leading-snug" style={{ color: tone }}>
        {r.title}
      </p>
      <p className="mt-2 text-[length:calc(12.5px*var(--type))] leading-relaxed text-slate text-pretty">{r.line}</p>
      <Link
        href={`/products/${r.slug}`}
        className="group mt-3.5 inline-flex items-center gap-1.5 text-[length:calc(13px*var(--type))] text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
      >
        See {r.product}
        <Arrow />
      </Link>
    </div>
  );
}

function Bar({ c, cx, w, y, color, fill }: { c: Candle; cx: number; w: number; y: (v: number) => number; color: string; fill: number }) {
  const yo = y(c.o);
  const yc = y(c.c);
  return (
    <g>
      <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth="1" />
      <rect x={cx - w / 2} y={Math.min(yo, yc)} width={w} height={Math.max(1, Math.abs(yc - yo))} fill={color} fillOpacity={fill} stroke={color} strokeWidth="0.75" />
    </g>
  );
}
