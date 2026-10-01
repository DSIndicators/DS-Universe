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
 *   Flagship   Zones' defended demand zone · Iceberg's ICE BID with its
 *              iceberg · GEX's Call Wall / Gamma Flip / Put Wall ·
 *              Flow's buy/sell profile on one candle group, heavy row boxed ·
 *              Oracle's Neural Line, violet to teal where price crosses it.
 *   Pro Series the four panels under price, titled the way NT8 titles panels:
 *              ProRSI one line in a shaded 70/30 scale (and, on price, the
 *              level its crossover made, frozen where price closed through);
 *              ProStochastics four stacked lanes of four speeds with the quad
 *              latch under them; ProSqueeze; ProMACD.
 *   Essentials the DS Toolkit rail · Parallax's four higher-timeframe charts
 *              spread along the bottom of the price pane (its default) ·
 *              DS 258's 00/20/50/80 lines · the Adaptive Price Line riding the
 *              last candle with its bar-close countdown · Chart Price's large
 *              last price, top centre, changing colour with every tick.
 *
 * Tom, 2026-09-29: "DS Chart Price ... is a price flickering every tick per
 * change", the Adaptive Price Line "do[es] not represent the indicators
 * well", "default position for DS Parallax is on the bottom, 4 spread
 * evenly", and "DS ProRSI and DS ProStochastics looks nearly identical". The
 * layers above are redrawn from the products' own showcase recordings.
 *   Utility    the Market Replay days on hand, which DS Bulk Replay
 *              Downloader fetched.
 *   Sessions   (2026-09-30) one session — London, teal, its house colour —
 *              bracketed over exactly its own bars, a tick at each end, its
 *              high and low carried forward as dotted lines that fade from the
 *              bar that closes through them, named at the bracket's end and
 *              tagged at the right edge (DS Session Levels); inside the
 *              bracket, thin volume bars against its first bar, the value area
 *              stronger, an HVN thick and an LVN a hairline with a serif, and
 *              the POC carried forward as a level until price trades back at
 *              it (DS Pro Session Levels). Placed in the one stretch of the
 *              chart where its lines meet no other tool's labels. The profile
 *              reaches about a third of its session here, not the product's
 *              15%: this session is six bars wide, and at 15% the bars would
 *              be too short to read.
 *
 * 2026-10-01 — DS ZONES AND DS ICEBERG REDRAWN to their visual redesign
 * (Build 2026-10-01), from the builds and their READMEs:
 *   Zones      the demand zone as a faint band: its action edge (the roof
 *              price meets) solid, the far edge dotted, a stem at its origin;
 *              a diamond on the roof at every bar that tested it — filled when
 *              price was rejected back out, hollow when the bar closed inside;
 *              its own volume profile just past the last bar, teal buying
 *              toward price and violet selling against the wall, the POC
 *              ticked; the caption counts the closed bars that held
 *              (DEFENDED n×), computed from the tape.
 *   Iceberg    was a violet runway box under the three wicks at 50.5. The
 *              tape closes through that price later, so the product would
 *              show it BROKEN (steel, dotted, no iceberg). What the product
 *              does draw, live, is the same price retested from ABOVE on the
 *              way up (two wicks, bars 25 and 26 — clear of the Neural Line and Flow's
 *              profile, which crowd bar 24): an ICE BID, teal — an exact
 *              line with a soft tint from its first test (a short post), a
 *              fracture just past each wick tip running down into the ice,
 *              the newest ringed (it is TESTING: within six bars of its last
 *              test), and the keel iceberg on its waterline in the runway past
 *              the last bar. The broken offer is left out: a dotted steel line
 *              through Flow's profile would only add noise to an illustration.
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
 * results or outcomes; crisp edges, no glow. The only figures are the ones
 * these tools display — an illustrative last price, the bar-close countdown,
 * the stochastic lanes' settings, a pool's touch count. content/complete-chart.ts
 * fails the build if a product joins the lineup without a layer here.
 */

const TEAL = "#19F2E6";
const VIOLET = "#B45CFF";
const INK = "#ECEEF1";
const SLATE = "#A3ABB3";
const ONLINE = "#2EE884";
/** Neutrals: the ink colour at these opacities (see "never grey" above). */
const A = { grid: 0.045, frame: 0.12, mark: 0.2, faint: 0.32, mute: 0.52 } as const;

const W = 480;
const PX0 = 34, PX1 = 428, PY0 = 22;
const PSB = 292; // the bottom of the price scale: candles and levels live above it
// DS Parallax sits where it sits by default: four higher-timeframe charts spread
// evenly along the bottom of the price pane, under the candles.
const PAR_Y = PSB + 6, PAR_H = 38, PAR_GAP = 8;
const PY1 = PAR_Y + PAR_H + 4; // the price pane's bottom edge
// The Pro panels, each titled the way NT8 titles a panel. ProStochastics is
// taller: its four speeds are four stacked lanes, as in the product.
const PANELS = [
  { slug: "prorsi", h: 46 },
  { slug: "prostochastics", h: 74 },
  { slug: "prosqueeze", h: 46 },
  { slug: "promacd", h: 46 },
] as const;
const GAP = 6, P0 = PY1 + 10;
const panelY = (k: number) => P0 + PANELS.slice(0, k).reduce((n, p) => n + p.h + GAP, 0);
const RY = panelY(PANELS.length) + 4; // the replay strip

// A drawn tape: down into demand, three wicks turned back at one price (50.5)
// on the way, then up through the Neural Line — retesting that price from
// above twice as it goes (DS Iceberg's ICE BID). Illustration only.
const closes = [62, 60, 63, 58, 55, 57, 52, 49, 51, 46, 44, 47, 42, 40, 43, 41, 39, 42, 45, 43, 48, 51, 49, 54, 57, 55, 60, 63, 61, 66, 69, 67];
const LO = 30, HI = 78;
const N = closes.length;
const DX = (PX1 - PX0 - 16) / N;
const xAt = (i: number) => PX0 + 10 + i * DX;
const yP = (v: number) => PY0 + 8 + (1 - (v - LO) / (HI - LO)) * (PSB - PY0 - 16);
const cand = closes.map((c, i) => {
  const o = i ? closes[i - 1] : c + 1.5;
  return { o, c, h: Math.max(o, c) + 1.2 + ((i * 37) % 7) / 3, l: Math.min(o, c) - 1.1 - ((i * 53) % 5) / 3 };
});
cand[9].h = 50.6;
cand[13].h = 50.9;
cand[16].h = 50.4;
cand[25].l = 50.3; // the ICE BID's two tests: wicks down to 50.5 from above,
cand[26].l = 50.4; // bodies well clear of it
const smooth = (a: number[], k: number) =>
  a.map((_, i) => {
    const s = a.slice(Math.max(0, i - k + 1), i + 1);
    return s.reduce((x, y) => x + y, 0) / s.length;
  });
const neural = smooth(closes, 5);
const cross = neural.findIndex((v, i) => i > 4 && closes[i] > v && closes[i - 1] <= neural[i - 1]);

/* DS Zones: the demand zone, from bar 11 to the right edge. A bar that trades
   to its roof tests it; it held if it closed back above the roof (a filled
   diamond), and DEFENDED counts every test that closed on the zone's own side
   of the far edge. Its profile is the volume of those bars at each price inside
   it — up bars as buying, down bars as selling — on a base it was born with. */
const ZN = { lo: 37.5, hi: 42.5, from: 11 } as const;
const ZN_TESTS = cand
  .map((c, i) => ({ i, c, held: c.c > ZN.hi }))
  .filter(({ i, c }) => i >= ZN.from && i < N - 1 && c.l <= ZN.hi);
const ZN_DEF = ZN_TESTS.filter(({ c }) => c.c >= ZN.lo).length;
const ZN_ROWS = [38, 39, 40, 41, 42].map((v, k) => {
  let buy = [0.4, 0.7, 1, 0.7, 0.4][k], sell = [0.6, 0.9, 1.3, 0.8, 0.5][k];
  for (const { c } of ZN_TESTS)
    if (c.l <= v + 0.5 && Math.min(c.h, ZN.hi) >= v - 0.5) {
      if (c.c >= c.o) buy += 1;
      else sell += 1;
    }
  return { v, buy, sell };
});
const ZN_MAX = Math.max(...ZN_ROWS.map((r) => r.buy + r.sell));
const ZN_POC = ZN_ROWS.reduce((a, b) => (b.buy + b.sell > a.buy + a.sell ? b : a)).v;

/* DS Iceberg: an ICE BID at 50.5. A test is a wick into the tint whose body
   stays well above it; two clustered tests confirm the level. TESTING for six
   bars after the latest test (the product's own window). */
const ICE = { v: 50.5, tol: 0.9 } as const;
const ICE_HITS = cand
  .map((c, i) => ({ i, c }))
  .filter(({ i, c }) => i < N - 1 && c.l <= ICE.v + ICE.tol && Math.min(c.o, c.c) > ICE.v + 2);
const ICE_TESTING = ICE_HITS.length > 0 && N - 1 - ICE_HITS[ICE_HITS.length - 1].i <= 6;
/** The runway: just past the last bar, where the iceberg sits on its waterline. */
const RUNWAY_X = xAt(N - 1) + 9;

/* The live last bar. DS Chart Price and DS Adaptive Price Line are about the
   price moving right now, so the illustration ticks: the last candle's close
   moves a quarter point at a time, the Chart Price digits change with it —
   green on an uptick, red on a downtick, amber when the tape chops (the
   product's own colours) — and the Adaptive Price Line rides it with its
   bar-close countdown. The price is illustrative, scaled so the drawn tape
   reads as MNQ; it is not market data. */
const PRICE_AT_50 = 29400;
const PT = 2.5; // price per drawing unit
const toPrice = (v: number) => PRICE_AT_50 + (v - 50) * PT;
const toV = (price: number) => 50 + (price - PRICE_AT_50) / PT;
const P_LAST = toPrice(closes[N - 1]);
const UP = "#46E36B", DOWN = "#FF5A4E", CHOP = "#F2B544";
/** A level as MNQ prints it: to the quarter point, two decimals. */
const tickPrice = (v: number) => (Math.round(toPrice(v) * 4) / 4).toFixed(2);

/* DS Session Levels / DS Pro Session Levels: one finished session, London,
   bars 4–9. Its high and low are the real extremes of its own bars (the
   product's "exact" levels); each is taken where a later bar CLOSES through
   it (a wick does not count). The profile is drawn, not computed from the
   tape — a two-node session with its POC at 56, an HVN at 48.5 and the thin
   LVN between them at 52. */
const SES = { a: 4, b: 9 } as const;
const SES_BARS = cand.slice(SES.a, SES.b + 1);
const SES_HI = Math.max(...SES_BARS.map((c) => c.h));
const SES_LO = Math.min(...SES_BARS.map((c) => c.l));
const after = (test: (i: number) => boolean) => {
  const i = closes.findIndex((_, k) => k > SES.b && test(k));
  return i < 0 ? N : i;
};
const HI_TAKEN = after((k) => closes[k] > SES_HI);
const LO_TAKEN = after((k) => closes[k] < SES_LO);
const POC_V = 56, HVN_V = 48.5, LVN_V = 52;
const POC_BACK = after((k) => cand[k].l <= POC_V && cand[k].h >= POC_V);
const PROFILE = (() => {
  const rows: { v: number; f: number }[] = [];
  for (let v = Math.ceil(SES_LO * 2) / 2; v <= SES_HI; v += 0.5) {
    const k = rows.length;
    const f = 0.12 + 0.06 * ((k * 37) % 5) / 4 + 0.84 * Math.exp(-(((v - POC_V) / 1.7) ** 2)) + 0.6 * Math.exp(-(((v - HVN_V) / 1.4) ** 2));
    rows.push({ v, f: v === LVN_V ? 0.08 : v === POC_V ? 1 : Math.min(0.94, f) });
  }
  // the value area: the busiest rows around the POC until they hold 70% of the volume
  const total = rows.reduce((n, r) => n + r.f, 0);
  let lo = rows.findIndex((r) => r.v === POC_V), hi = lo, sum = rows[lo].f;
  while (sum < total * 0.7) {
    const up = rows[hi + 1]?.f ?? -1, dn = rows[lo - 1]?.f ?? -1;
    if (up >= dn) sum += rows[++hi].f;
    else sum += rows[--lo].f;
  }
  return rows.map((r, i) => ({ ...r, va: i >= lo && i <= hi }));
})();
type Tape = { price: number; dir: 1 | -1; chop: boolean; secs: number; flips: number[] };
const TAPE0: Tape = { price: P_LAST, dir: 1, chop: false, secs: 42, flips: [] };

/* ProRSI: a short RSI over the tape (six warm-up bars so it starts settled).
   ProStochastics: four lanes of four speeds, fast to slow. */
const rsi = (() => {
  const x = [60, 61, 59, 62, 60, 61, ...closes];
  let ag = 0, al = 0;
  const out: number[] = [];
  x.forEach((c, i) => {
    const d = i ? c - x[i - 1] : 0;
    const g = Math.max(d, 0), l = Math.max(-d, 0);
    if (i <= 5) { ag += g / 5; al += l / 5; } else { ag = (ag * 4 + g) / 5; al = (al * 4 + l) / 5; }
    out.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  });
  return out.slice(6);
})();
const stoch = (len: number, k: number) =>
  smooth(
    closes.map((c, i) => {
      const w = cand.slice(Math.max(0, i - len + 1), i + 1);
      const lo = Math.min(...w.map((b) => b.l)), hi = Math.max(...w.map((b) => b.h));
      return ((c - lo) / (hi - lo)) * 100;
    }),
    k,
  );
// Fast to slow: the fast lane turns with every swing, the slow one only with
// the whole move. (Labelled with the product's lane settings; the drawing
// scales them to its 32 bars.)
const LANES = [
  { label: "5·3", v: stoch(3, 1) },
  { label: "14·3", v: stoch(5, 2) },
  { label: "40·4", v: stoch(10, 3) },
  { label: "60·10", v: stoch(20, 3) },
];
/* ProRSI's level on price: the swing high whose RSI crossover made it, drawn
   right until price closes through it — and frozen there, as the product does. */
const RSI_HI = 2;
const RSI_LVL = Math.max(cand[RSI_HI].h, 64.6);
const RSI_FREEZE = closes.findIndex((c, i) => i > RSI_HI + 3 && c > RSI_LVL);
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
const TAB: Record<Series, string> = { flagship: "Flagship", pro: "Pro Series", sessions: "Sessions", essentials: "Essentials", utility: "Utility" };
/** Under 380px five full words do not fit one row (2026-09-30): the two
 *  longest shorten to the word that names them on their own panels. */
const TAB_SHORT: Record<Series, string> = { flagship: "Flagship", pro: "Pro", sessions: "Sessions", essentials: "Free", utility: "Utility" };

/** How long the tour rests on each product, and on the whole chart between rounds. */
const DWELL = 3200;
const DWELL_ALL = 2200;

/** One product's drawing: shown once its series is built, dimmed while
 *  something else is being pointed at. */
function L({ p, also = [], children }: { p: string; also?: string[]; children: ReactNode }) {
  const { focus, step } = useCompleteStage();
  const s = SERIES_OF[p];
  const { shown } = built(s, step);
  // `also`: products that draw this layer too (DS Pro Session Levels draws
  // every bracket DS Session Levels does).
  const lit = !focus || (focus.slug ? focus.slug === p || also.includes(focus.slug) : focus.series === s || also.some((a) => SERIES_OF[a] === focus.series));
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

/** The live last bar: a tick every 0.4–1 s, a quarter or half point at a
 *  time, pulled back toward where the drawing ends so the candle never
 *  wanders off; "chop" (amber) = four direction changes in the last five
 *  ticks; the bar-close countdown runs every second. Seeded, so every visit
 *  ticks the same way; it only runs while the chart is on screen. */
function useTape(active: boolean) {
  const [tape, setTape] = useState<Tape>(TAPE0);
  useEffect(() => {
    if (!active) return;
    let seed = 90217;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let t = 0;
    const tick = () => {
      setTape((s) => {
        // a tape has some momentum (62% to keep going), and a pull home
        const drift = s.price - P_LAST;
        const up = rnd() < (s.dir > 0 ? 0.62 : 0.38) - drift * 0.08;
        const dir: 1 | -1 = up ? 1 : -1;
        const size = rnd() < 0.72 ? 0.25 : 0.5;
        const flips = [...s.flips, dir !== s.dir ? 1 : 0].slice(-5);
        return { ...s, price: s.price + dir * size, dir, flips, chop: flips.reduce((a, b) => a + b, 0) >= 4 };
      });
      t = window.setTimeout(tick, 400 + rnd() * 600);
    };
    t = window.setTimeout(tick, 500);
    const clock = window.setInterval(() => setTape((s) => ({ ...s, secs: s.secs > 0 ? s.secs - 1 : 59 })), 1000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(clock);
    };
  }, [active]);
  return tape;
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
  const tape = useTape(!reduced && step > BUILD_ORDER.length && onScreen && pageVisible);

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
  // Phones: the 258 tags would crowd the GEX labels at the right edge, and the
  // stochastic lanes' names their lines; the levels and lanes stay, the small
  // tags go.
  const roomy = fs < 1.3;

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
      {/* Five series since 2026-09-30: the tabs take the width their words
          need (not five equal columns, which cut "Flagship" and "Essentials"
          short at 320px) and share what is left. */}
      <div className="flex gap-1 border-b border-line px-2 py-2.5 min-[400px]:gap-1.5 min-[400px]:px-3 [@media(hover:hover)_and_(pointer:fine)]:hidden" role="group" aria-label="Show one series on the chart">
        {BUILD_ORDER.map((s) => {
          const on = focus?.series === s || built(s, step).building;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={focus?.series === s}
              onClick={() => choose(focus?.series === s && !focus.slug ? null : { series: s, source: "tap" })}
              className="h-8 min-w-0 flex-[1_1_auto] whitespace-nowrap rounded-[3px] border px-1 font-mono text-[8px] uppercase tracking-[0.02em] transition-colors duration-300 min-[360px]:text-[8.5px] min-[360px]:tracking-[0.05em] min-[400px]:text-[9px] min-[400px]:tracking-[0.1em]"
              style={{ borderColor: on ? "rgba(25,242,230,0.5)" : "#23272D", color: on ? TEAL : "#7C848D" }}
            >
              <span className="min-[380px]:hidden">{TAB_SHORT[s]}</span>
              <span className="hidden min-[380px]:inline">{TAB[s]}</span>
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
          <Drawing t={t} H={H} stripY={stripY} roomy={roomy} tape={tape} />
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

/** An oscillator line that takes the colour of the zone it is in: violet above
 *  `hi`, teal below `lo`, ink between (segment by segment, no clip paths). */
function Segments({ values, y, hi, lo, width }: { values: number[]; y: (v: number) => number; hi: number; lo: number; width: number }) {
  return (
    <g strokeWidth={width} strokeLinecap="round">
      {values.slice(1).map((v, i) => {
        const a = values[i];
        const c = a > hi && v > hi ? VIOLET : a < lo && v < lo ? TEAL : INK;
        return <line key={i} x1={r2(xAt(i))} x2={r2(xAt(i + 1))} y1={r2(y(a))} y2={r2(y(v))} stroke={c} strokeOpacity={c === INK ? 0.8 : 1} />;
      })}
    </g>
  );
}

/** DS Parallax's four minis: each timeframe's closes (its own scale) and its
 *  liquidity pools, anchored to a swing — buy-side at a high, sell-side at a
 *  low — with a touch count; a pool price has since run through is swept and
 *  ghosts out. Drawn, not market data. */
type Pool = { side: "buy" | "sell"; from: number; touches: number; swept?: boolean };
const MINI_RAW: { tf: string; c: number[]; pools: Pool[] }[] = [
  { tf: "15m", c: [0.32, 0.36, 0.29, 0.41, 0.46, 0.42, 0.56, 0.62, 0.7], pools: [{ side: "sell", from: 2, touches: 2 }] },
  { tf: "1h", c: [0.72, 0.52, 0.36, 0.3, 0.38, 0.46, 0.5, 0.63, 0.74], pools: [{ side: "sell", from: 3, touches: 2 }, { side: "buy", from: 0, touches: 1, swept: true }] },
  { tf: "4h", c: [0.76, 0.6, 0.68, 0.5, 0.56, 0.42, 0.5, 0.45, 0.53], pools: [{ side: "buy", from: 0, touches: 2 }, { side: "sell", from: 5, touches: 1 }] },
  { tf: "1D", c: [0.8, 0.7, 0.62, 0.67, 0.5, 0.56, 0.46, 0.41, 0.38], pools: [{ side: "buy", from: 3, touches: 2 }, { side: "sell", from: 7, touches: 1, swept: true }] },
];
const MINIS = MINI_RAW.map((m) => {
  const raw = m.c.map((c, i) => {
    const o = i ? m.c[i - 1] : c + 0.03;
    return { o, c, h: Math.max(o, c) + 0.045, l: Math.min(o, c) - 0.045 };
  });
  const lo = Math.min(...raw.map((b) => b.l)) - 0.03, hi = Math.max(...raw.map((b) => b.h)) + 0.03;
  const n = (v: number) => (v - lo) / (hi - lo);
  const bars = raw.map((b) => ({ o: n(b.o), c: n(b.c), h: n(b.h), l: n(b.l) }));
  const pools = m.pools.map((pl) => ({ ...pl, at: pl.side === "buy" ? bars[pl.from].h : bars[pl.from].l }));
  return { tf: m.tf, bars, pools };
});

function Drawing({ t, H, stripY, roomy, tape }: { t: (n: number) => number; H: number; stripY: number; roomy: boolean; tape: Tape }) {
  // The last candle follows the tape; every other candle is fixed.
  const vNow = toV(tape.price);
  const bars = cand.map((c, i) => (i < N - 1 ? c : { o: c.o, c: vNow, h: Math.max(c.h, c.o, vNow), l: Math.min(c.l, c.o, vNow) }));
  const priceColour = tape.chop ? CHOP : tape.dir > 0 ? UP : DOWN;
  const xLast = xAt(N - 1);
  const clock = `00:${String(tape.secs).padStart(2, "0")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Every DS Universe product drawn together on one NinjaTrader chart (illustration)">
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
            {roomy && (
              <text x={PX1 - 2} y={yP(v) - 2} textAnchor="end" className="font-mono" fontSize={t(6)} fill={INK} fillOpacity={A.faint}>
                {tag}
              </text>
            )}
          </g>
        ))}
      </L>
      {/* DS Parallax, in its default place: four higher-timeframe charts spread
          evenly along the bottom of the price pane, each marking its resting
          stops — buy-side above the highs, sell-side below the lows; the
          touch count sets the line weight; a swept level ghosts out. */}
      <L p="parallax">
        {MINIS.map((m, k) => {
          const w = (PX1 - PX0 - 12 - 3 * PAR_GAP) / 4;
          const x0 = PX0 + 6 + k * (w + PAR_GAP);
          const top = PAR_Y + 5 + t(4.6);
          const bot = PAR_Y + PAR_H - 4;
          const my = (f: number) => r2(bot - f * (bot - top));
          const cw = (w - 10) / m.bars.length;
          const cx = (i: number) => x0 + 5 + (i + 0.5) * cw;
          return (
            <g key={m.tf}>
              <path d={box(x0 + 0.5, PAR_Y + 0.5, w - 1, PAR_H - 1)} fill={INK} fillOpacity="0.02" stroke={INK} strokeOpacity={A.frame} />
              <text x={x0 + 3} y={PAR_Y + 2 + t(4.6)} className="font-mono" fontSize={t(4.6)} letterSpacing="0.6" fill={INK} fillOpacity={A.mute}>
                {`NQ · ${m.tf}`}
              </text>
              {m.pools.map((pl, q) => {
                const c = pl.side === "buy" ? TEAL : VIOLET;
                const y = my(pl.at);
                return (
                  <g key={q}>
                    <line x1={cx(pl.from) - cw * 0.3} x2={x0 + w - 3} y1={y} y2={y} stroke={c} strokeOpacity={pl.swept ? 0.35 : 0.85} strokeWidth={pl.touches > 1 ? 1.2 : 0.7} strokeDasharray={pl.swept ? "2 2" : undefined} />
                    {!pl.swept && pl.touches > 1 && (
                      <text x={x0 + w - 3} y={pl.side === "buy" ? y - 1.5 : y + 1.5 + t(4)} textAnchor="end" className="font-mono" fontSize={t(4)} fill={c}>
                        {`×${pl.touches}`}
                      </text>
                    )}
                  </g>
                );
              })}
              {m.bars.map((b, i) => {
                const up = b.c >= b.o;
                const c = up ? TEAL : VIOLET;
                return (
                  <g key={i}>
                    <line x1={r2(cx(i))} x2={r2(cx(i))} y1={my(b.h)} y2={my(b.l)} stroke={c} strokeOpacity="0.75" />
                    <path d={box(cx(i) - cw * 0.26, my(Math.max(b.o, b.c)), cw * 0.52, Math.max(0.8, my(Math.min(b.o, b.c)) - my(Math.max(b.o, b.c))))} fill={c} fillOpacity="0.85" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </L>
      {/* DS Chart Price: the last price, large, top centre, changing on every
          tick — green up, red down, amber when the tape chops. */}
      <L p="chart-price">
        <text x={(PX0 + PX1) / 2} y={PY0 + 2 + t(13)} textAnchor="middle" className="font-mono" fontSize={t(13)} fontWeight="600" letterSpacing="0.4" fill={priceColour}>
          {tape.price.toFixed(2)}
        </text>
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

      {/* ------------------------------------------------------ sessions */}
      {/* DS Session Levels: the London bracket over exactly its own bars,
          a tick at each end; its high and low carried forward, dotted, fading
          from the bar that closed through them; named at the bracket's end
          and tagged at the right edge. DS Pro Session Levels draws the same
          bracket, so pointing at either lights it. */}
      <L p="session-levels" also={["pro-session-levels"]}>
        {(() => {
          const xs = r2(xAt(SES.a) - 3.5), xe = r2(xAt(SES.b) + 3.5);
          const yh = r2(yP(SES_HI)), yl = r2(yP(SES_LO));
          const level = (y: number, taken: number) => (
            <>
              <line x1={xe} x2={r2(xAt(taken))} y1={y} y2={y} stroke={TEAL} strokeOpacity="0.55" strokeDasharray="1 2" />
              <line x1={r2(xAt(taken))} x2={W - 4} y1={y} y2={y} stroke={TEAL} strokeOpacity="0.2" strokeDasharray="1 2" />
            </>
          );
          return (
            <>
              {level(yh, HI_TAKEN)}
              {level(yl, LO_TAKEN)}
              <path d={`M${xs} ${r2(yh + 3)}V${yh}H${xe}V${r2(yh + 3)}M${xs} ${r2(yl - 3)}V${yl}H${xe}V${r2(yl - 3)}`} fill="none" stroke={TEAL} strokeOpacity="0.9" />
              {roomy && (
                <g className="font-mono" fontSize={t(4.6)} letterSpacing="0.5" fill={TEAL}>
                  <text x={xe} y={yh - 2} textAnchor="end">{`LONDON HIGH ${tickPrice(SES_HI)}`}</text>
                  <text x={xe} y={yl + 1.5 + t(4.6)} textAnchor="end">{`LONDON LOW ${tickPrice(SES_LO)}`}</text>
                  {/* both were taken later, so both edge tags are faint */}
                  <text x={W - 4} y={yh - 1.5} textAnchor="end" fillOpacity="0.45">LONDON H</text>
                  <text x={W - 4} y={yl - 1.5} textAnchor="end" fillOpacity="0.45">LONDON L</text>
                </g>
              )}
            </>
          );
        })()}
      </L>
      {/* DS Pro Session Levels: the volume inside the bracket — thin bars
          against its first bar, the value area stronger, the POC the longest
          and carried forward as a level until price trades back at it. */}
      <L p="pro-session-levels">
        {(() => {
          const x0 = r2(xAt(SES.a) - 3.5);
          const reach = (xAt(SES.b) - xAt(SES.a) + 7) * 0.34;
          const yc = r2(yP(POC_V));
          return (
            <>
              <line x1={x0} x2={x0} y1={r2(yP(SES_HI))} y2={r2(yP(SES_LO))} stroke={TEAL} strokeOpacity="0.5" />
              {PROFILE.map((r) => {
                const y = yP(r.v);
                if (r.v === LVN_V)
                  return (
                    <path key={r.v} d={`M${x0} ${r2(y)}h${r2(reach * 0.55)}m0 -1.6v3.2`} fill="none" stroke={TEAL} strokeOpacity="0.75" strokeWidth="0.6" />
                  );
                const h = r.v === HVN_V ? 2 : 1.1;
                return <path key={r.v} d={box(x0, y - h / 2, Math.max(1.2, r.f * reach), h)} fill={TEAL} fillOpacity={r.v === POC_V ? 0.95 : r.va ? 0.5 : 0.22} />;
              })}
              {/* solid to the session's end, dotted forward from there, faint
                  once price has traded back at it */}
              <line x1={r2(x0 + reach)} x2={r2(xAt(SES.b) + 3.5)} y1={yc} y2={yc} stroke={TEAL} strokeOpacity="0.85" />
              <line x1={r2(xAt(SES.b) + 3.5)} x2={r2(xAt(POC_BACK))} y1={yc} y2={yc} stroke={TEAL} strokeOpacity="0.7" strokeDasharray="1 2" />
              <line x1={r2(xAt(POC_BACK))} x2={W - 4} y1={yc} y2={yc} stroke={TEAL} strokeOpacity="0.22" strokeDasharray="1 2" />
              {roomy && (
                <g className="font-mono" fontSize={t(4.6)} letterSpacing="0.5" fill={TEAL}>
                  {/* labelled where no candle covers it */}
                  <text x={r2(xAt(12))} y={yc - 2}>{`LONDON POC ${tickPrice(POC_V)}`}</text>
                  <text x={W - 4} y={yc - 1.5} textAnchor="end" fillOpacity="0.45">LONDON POC</text>
                </g>
              )}
            </>
          );
        })()}
      </L>

      {/* ------------------------------------------------------ flagship */}
      {/* DS Zones: the band, its edges, its stem and its own profile (the
          diamonds sit on the candles and are drawn after them, below). */}
      <L p="zones">
        {(() => {
          const xs = r2(xAt(ZN.from) - 4), yt = r2(yP(ZN.hi)), yb = r2(yP(ZN.lo));
          const rowH = r2((yb - yt) / ZN_ROWS.length - 1.6);
          return (
            <>
              <path d={box(xs, yt, PX1 - xs, yb - yt)} fill={TEAL} fillOpacity="0.07" />
              <line x1={xs} x2={PX1} y1={yt} y2={yt} stroke={TEAL} />
              <line x1={xs} x2={PX1} y1={yb} y2={yb} stroke={TEAL} strokeOpacity="0.7" strokeDasharray="1 2" />
              <line x1={xs} x2={xs} y1={yt} y2={yb} stroke={TEAL} />
              {ZN_ROWS.map((r) => {
                const len = ((r.buy + r.sell) / ZN_MAX) * (PX1 - RUNWAY_X + 5);
                const b = (r.buy / (r.buy + r.sell)) * len;
                const y = yP(r.v) - rowH / 2;
                return (
                  <g key={r.v}>
                    <path d={box(PX1 - len, y, b, rowH)} fill={TEAL} fillOpacity="0.75" />
                    <path d={box(PX1 - len + b, y, len - b, rowH)} fill={VIOLET} fillOpacity="0.75" />
                    {r.v === ZN_POC && <path d={box(PX1 - len - 2.5, y, 1.2, rowH)} fill={INK} />}
                  </g>
                );
              })}
              <text x={xAt(ZN.from)} y={yb + 2 + t(6)} className="font-mono" fontSize={t(6)} letterSpacing="0.9" fill={TEAL}>
                {`DEMAND · DEFENDED ${ZN_DEF}×`}
              </text>
            </>
          );
        })()}
      </L>
      {/* DS Iceberg: the ICE BID — the exact line with its soft tint, from the
          post at its first test to the iceberg in the runway (fractures and the
          iceberg are drawn after the candles, below). */}
      <L p="iceberg">
        {(() => {
          const x1 = r2(xAt(ICE_HITS[0].i)), yl = r2(yP(ICE.v));
          const yt = r2(yP(ICE.v + ICE.tol)), yb = r2(yP(ICE.v - ICE.tol));
          return (
            <>
              <path d={box(x1, yt, RUNWAY_X - x1, yb - yt)} fill={TEAL} fillOpacity="0.08" />
              <line x1={x1} x2={RUNWAY_X} y1={yl} y2={yl} stroke={TEAL} />
              <line x1={x1} x2={x1} y1={r2(yt - 1.5)} y2={r2(yb + 1.5)} stroke={TEAL} />
            </>
          );
        })()}
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
        {bars.map((c, i) => {
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

      {/* On the candles. DS Zones: a diamond on the roof at every bar that
          tested the zone — filled when price was rejected back out, hollow
          when the bar closed inside. */}
      <L p="zones">
        {ZN_TESTS.map(({ i, held }) => {
          const x = r2(xAt(i)), y = r2(yP(ZN.hi));
          const d = `M${x} ${r2(y - 2.3)}L${r2(x + 2.3)} ${y}L${x} ${r2(y + 2.3)}L${r2(x - 2.3)} ${y}Z`;
          return held ? <path key={i} d={d} fill={INK} fillOpacity="0.9" /> : <path key={i} d={d} fill="none" stroke={INK} strokeOpacity="0.85" strokeWidth="0.8" />;
        })}
      </L>
      {/* DS Iceberg: a fracture just past each wick tip, running down into the
          ice — the newest ringed while the level is TESTING — then the iceberg
          on its waterline: the peaked tip above the line, the long mass below. */}
      <L p="iceberg">
        {ICE_HITS.map(({ i, c }, k) => {
          const x = r2(xAt(i)), y0 = r2(yP(c.l) + 2);
          const newest = ICE_TESTING && k === ICE_HITS.length - 1;
          return (
            <g key={i}>
              <path d={`M${x} ${y0}l-1.3 1.7l2.4 1.5l-1.7 1.9l1.1 1.5`} fill="none" stroke={TEAL} strokeLinejoin="bevel" />
              {newest && <path d={dot(x, r2(y0 + 3.3), 4.4)} fill="none" stroke={TEAL} strokeWidth="0.8" />}
            </g>
          );
        })}
        <g transform={`translate(${r2(RUNWAY_X)} ${r2(yP(ICE.v))})`}>
          <path d="M-3.8 0.6L3.8 0.6L2.4 3.6L0.9 7.4L0 8.6L-1.1 6L-2.6 3.4Z" fill={TEAL} fillOpacity="0.45" />
          <path d="M-3.4 0L-1.3 -2.5L0 -4.4L1.5 -2.2L3.4 0Z" fill={TEAL} />
          <path d="M-3.4 0L-1.3 -2.5L0 -4.4L-0.4 -1.1Z" fill={INK} fillOpacity="0.35" />
        </g>
        {roomy && (
          <text x={r2(RUNWAY_X + 6)} y={r2(yP(ICE.v) + t(4.6) * 0.36)} className="font-mono" fontSize={t(4.6)} letterSpacing="0.5" fill={TEAL}>
            {`ICE BID ${ICE_HITS.length}×`}
          </text>
        )}
      </L>

      {/* DS Adaptive Price Line: anchored to the last candle — a ring at the
          price, the bar-close countdown riding the line, then the line on to
          the edge of the chart. It moves with every tick. */}
      <L p="adaptive-priceline">
        {(() => {
          const y = r2(yP(vNow));
          const fsz = t(5.2);
          const bx = xLast + 12;
          const bw = r2(fsz * 0.62 * clock.length + 6);
          const bh = r2(fsz + 4);
          return (
            <>
              <path d={dot(xLast + 7, y, 1.9)} fill="none" stroke={TEAL} strokeOpacity="0.9" />
              <line x1={xLast + 9} x2={bx} y1={y} y2={y} stroke={TEAL} strokeOpacity="0.7" />
              <path d={box(bx + 0.5, y - bh / 2, bw, bh)} fill="none" stroke={TEAL} strokeOpacity="0.8" />
              <text x={bx + 0.5 + bw / 2} y={y + fsz * 0.36} textAnchor="middle" className="font-mono" fontSize={fsz} fill={INK} fillOpacity="0.9">
                {clock}
              </text>
              <line x1={bx + bw + 0.5} x2={W - 3} y1={y} y2={y} stroke={TEAL} strokeOpacity="0.7" />
            </>
          );
        })()}
      </L>

      {/* ------------------------------------------------------ Pro Series */}
      {/* DS ProRSI on the price pane: the level its crossover made, anchored
          to the swing high, drawn right until price closed through it — and
          frozen there. */}
      <L p="prorsi">
        <line x1={xAt(RSI_HI)} x2={xAt(RSI_FREEZE)} y1={yP(RSI_LVL)} y2={yP(RSI_LVL)} stroke={VIOLET} strokeOpacity="0.85" />
        <path d={dot(xAt(RSI_HI), yP(RSI_LVL), 1.8)} fill={VIOLET} />
        <line x1={xAt(RSI_FREEZE)} x2={xAt(RSI_FREEZE)} y1={yP(RSI_LVL) - 3} y2={yP(RSI_LVL) + 3} stroke={VIOLET} />
        <text x={xAt(RSI_HI) + 5} y={yP(RSI_LVL) - 3} className="font-mono" fontSize={t(5)} letterSpacing="0.8" fill={VIOLET}>
          RSI LEVEL
        </text>
      </L>
      {PANELS.map(({ slug, h: ph }, k) => {
        const y0 = panelY(k);
        const yy = (f: number) => y0 + 10 + (1 - f) * (ph - 15);
        let body: ReactNode = null;
        if (slug === "prorsi") {
          // DS ProRSI: ONE line in a scale with its extremes shaded — violet
          // above 70, teal below 30 — the line taking the colour of the zone
          // it is in, and its signal line alongside.
          const yr = (v: number) => yy(v / 100);
          body = (
            <>
              <path d={box(PX0 + 1, yr(100), PX1 - PX0 - 2, yr(70) - yr(100))} fill={VIOLET} fillOpacity="0.07" />
              <path d={box(PX0 + 1, yr(30), PX1 - PX0 - 2, yr(0) - yr(30))} fill={TEAL} fillOpacity="0.07" />
              {[70, 30].map((v) => (
                <line key={v} x1={PX0} x2={PX1} y1={yr(v)} y2={yr(v)} stroke={v > 50 ? VIOLET : TEAL} strokeOpacity="0.3" strokeDasharray="2 3" />
              ))}
              <polyline points={pts(smooth(rsi, 4), yr)} fill="none" stroke={CHOP} strokeOpacity="0.55" />
              <Segments values={rsi} y={yr} hi={70} lo={30} width={1.25} />
            </>
          );
        } else if (slug === "prostochastics") {
          // DS ProStochastics: FOUR speeds as four stacked lanes, fast on top,
          // each named by its settings; the quad latch along the bottom lights
          // where three or more lanes agree.
          const laneTop = y0 + 4 + t(6);
          const laneH = (y0 + ph - 7 - laneTop) / LANES.length;
          body = (
            <>
              {LANES.map((ln, j) => {
                const ly0 = laneTop + j * laneH;
                const ly = (v: number) => ly0 + 1.5 + (1 - v / 100) * (laneH - 3);
                return (
                  <g key={ln.label}>
                    {j > 0 && <line x1={PX0 + 1} x2={PX1 - 1} y1={ly0} y2={ly0} stroke={INK} strokeOpacity={A.grid * 1.6} />}
                    <Segments values={ln.v} y={ly} hi={80} lo={20} width={0.9} />
                    {roomy && (
                      <text x={PX1 - 3} y={ly0 + laneH / 2 + t(4.2) * 0.36} textAnchor="end" className="font-mono" fontSize={t(4.2)} fill={INK} fillOpacity={A.mute}>
                        {ln.label}
                      </text>
                    )}
                  </g>
                );
              })}
              {closes.map((_, i) => {
                const hi = LANES.filter((ln) => ln.v[i] > 70).length;
                const lo = LANES.filter((ln) => ln.v[i] < 30).length;
                const c = hi >= 3 ? VIOLET : lo >= 3 ? TEAL : null;
                return <path key={`q${i}`} d={box(xAt(i) - DX / 2 + 0.3, y0 + ph - 4.5, DX - 0.6, 2.5)} fill={c ?? INK} fillOpacity={c ? 0.85 : A.grid * 2} />;
              })}
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
                return <path key={`d${i}`} d={box(xAt(i) - 1.5, y0 + ph - 5, 3, 3)} fill={INK} fillOpacity={on ? 0.85 : A.mark} />;
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
                return <path key={`r${i}`} d={box(xAt(i) - DX / 2, y0 + ph - 4, DX - 0.5, 2.5)} fill={d > 0 ? TEAL : VIOLET} fillOpacity={Math.abs(d) > 2 ? 1 : 0.5} />;
              })}
            </>
          );
        }
        return (
          <g key={slug}>
            <path d={box(PX0 + 0.5, y0 + 0.5, PX1 - PX0 - 1, ph - 1)} fill="none" stroke={INK} strokeOpacity={A.frame} />
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
