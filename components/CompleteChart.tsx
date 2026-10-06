"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BUILD_ORDER, SEQUENCE, built, useCompleteStage, type Focus, type Series } from "@/components/CompleteStage";
import { DRAWS, RAIL_ROWS } from "@/content/complete-chart";
import { SERIES } from "@/content/pricing";
import { COMPLETE_PRODUCTS, STORE_SHELVES, productHref } from "@/content/release";

/**
 * THE DS COMPLETE CHART (2026-09-29) — the image of DS Complete.
 *
 * Tom: the box render was "stretched out and blurry, zero effort"; "I really
 * like the technicality of our interactive chart". The box was also a picture
 * of packaging, with a price and a product count printed on it that would go
 * stale. What a DS Complete buyer actually gets is every tool in it running on
 * one chart ("Built to run together on one chart"), so that is the picture: one
 * NinjaTrader chart, the drawing of every product IN DS COMPLETE on it.
 *
 * 2026-10-05 — REDRAWN TO THE NEW BUNDLE. DS Complete is the paid products,
 * DS ASL and DS Toolkit; the Free Vault products are not part of it. So the
 * chart lost every vault layer — DS Parallax's four mini charts, DS 258's
 * level lines, the DS Adaptive Price Line, DS Chart Price's large readout (and
 * the ticking last bar those two were drawn on), and the stochastics and
 * squeeze panels, which are free products now — and gained the two new Pro
 * Series panels. Nothing from the vault and nothing retired is drawn as part
 * of the bundle, and content/complete-chart.ts fails the build if that ever
 * changes.
 *
 * THE DS TOOLKIT RAIL IS BACK (the same day: Tom — "DS Toolkit will come FREE
 * with the purchase of DS Complete Bundle only, same as DS ASL"). It stands
 * where it stood before the restructure, at the left of the price pane, in
 * the same drawing: a faint framed rail, one filled switch per indicator, a
 * hairline, the drawing tools as outlines under it. Its switches are the
 * indicators IN DS COMPLETE and nothing else, one each, in the ledger's order
 * (content/complete-chart.ts RAIL_ROWS) — all on, because every one of them is
 * drawn on this chart.
 *
 *   Flagship   Zones' defended demand zone · Iceberg's ICE BID with its
 *              iceberg · GEX's Call Wall / Gamma Flip / Put Wall ·
 *              Flow's buy/sell profile on one candle group, heavy row boxed ·
 *              Oracle's Neural Line, violet to teal where price crosses it.
 *   Pro Series the four panels under price, titled the way NT8 titles panels:
 *              ProRSI — one line in a shaded 70/30 scale (and, on price, the
 *              level its crossover made, frozen where price closed through).
 *              ProLiquidityHunter — price as a line on close over its pools:
 *              a band from every swing extreme price has not traded back
 *              through, buy-side (teal) over the highs and sell-side (violet)
 *              under the lows, stronger the nearer price is to it; a pool
 *              price trades through ends on a bright stop and is named by the
 *              NEXT close — SWEPT if it closed back inside, RUN if it held
 *              beyond (the product's own rule, computed from the tape).
 *              ProHeikinAshi — the Heikin-Ashi candle of every bar standing on
 *              its own open (the dashed line), teal up and violet down, drawn
 *              hollow where the real close is already through its flip level
 *              (FLIP PENDING); two slower Heikin-Ashi candles as lanes above;
 *              and, on price, the flip level as a dashed rail with its flag —
 *              the middle of the last Heikin-Ashi body, the product's formula.
 *              ProTrendRange — its TREND line over its SWING line on one
 *              scale, the pullback pockets, the state ribbon.
 *   Utility    the Market Replay days on hand, which DS Bulk Replay
 *              Downloader fetched.
 *   Free with DS Complete
 *   DS Toolkit the rail at the left of the price pane (above).
 *   DS ASL     (Advanced Session Levels) one session —
 *              London, teal, its house colour — bracketed over exactly its own
 *              bars, a tick at each end, its high and low carried forward as
 *              dotted lines that fade from the bar that closes through them,
 *              named at the bracket's end and tagged at the right edge; inside
 *              the bracket, thin volume bars against its first bar, the value
 *              area stronger, an HVN thick and an LVN a hairline with a serif,
 *              and the POC carried forward as a level until price trades back
 *              at it. The profile reaches about a third of its session here,
 *              not the product's 15%: this session is six bars wide, and at
 *              15% the bars would be too short to read.
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
 *   Iceberg    the price retested from ABOVE on the way up (two wicks, bars
 *              25 and 26): an ICE BID, teal — an exact line with a soft tint
 *              from its first test (a short post), a fracture just past each
 *              wick tip running down into the ice, the newest ringed (it is
 *              TESTING: within six bars of its last test), and the keel
 *              iceberg on its waterline in the runway past the last bar.
 *
 * It BUILDS in the list's order when it scrolls into view. On a desktop,
 * pointing at a series or a product in the list beside it isolates its
 * drawing (CompleteStage.tsx holds the shared state).
 *
 * ON PHONES (Tom, 2026-09-29: "on mobile, users can't hover, they must click,
 * which just leads them to the product page, makes the whole website seem too
 * jumpy"). A touch screen has no hover, and the list sits a screen below the
 * chart. So on touch screens the chart carries its own controls, next to the
 * drawing: the series tabs under its header, and under the drawing a stepper
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
 * these tools display — illustrative session prices and a zone's test count.
 * Nothing on it moves once it has built.
 */

const TEAL = "#19F2E6";
const VIOLET = "#B45CFF";
const INK = "#ECEEF1";
const SLATE = "#A3ABB3";
const ONLINE = "#2EE884";
/** Neutrals: the ink colour at these opacities (see "never grey" above). */
const A = { grid: 0.045, frame: 0.12, mark: 0.2, faint: 0.32, mute: 0.52 } as const;

const W = 480;
// The price pane starts to the right of the DS Toolkit rail, which stands in
// the margin at the left (RAIL below) — as it did before 2026-10-05.
const PX0 = 34, PX1 = 428, PY0 = 22;
/* The DS Toolkit rail: a frame, one switch per indicator in DS Complete
   (RAIL_ROWS, so it grows and shrinks with the bundle), a hairline, three
   drawing tools. Geometry in drawing units, from the rail's own top-left. */
const RAIL = { x: 6, y: PY0, w: 20, pitch: 13, sw: 8, tools: 3, toolPitch: 12 } as const;
const RAIL_RULE = 8 + RAIL_ROWS.length * RAIL.pitch + 3; // the hairline under the switches
const RAIL_H = RAIL_RULE + 8 + RAIL.tools * RAIL.toolPitch + 3;
const PSB = 292; // the bottom of the price scale: candles and levels live above it
const PY1 = PSB + 6; // the price pane's bottom edge
// The Pro panels, each titled the way NT8 titles a panel. The two in the
// middle are taller: one is a map of bands, the other a row of candles.
const PANELS = [
  { slug: "prorsi", h: 46 },
  { slug: "proliquidityhunter", h: 62 },
  { slug: "proheikinashi", h: 62 },
  { slug: "protrendrange", h: 46 },
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

/* The price scale. Illustrative, scaled so the drawn tape reads as MNQ; it
   is not market data. */
const PRICE_AT_50 = 29400;
const PT = 2.5; // price per drawing unit
const toPrice = (v: number) => PRICE_AT_50 + (v - 50) * PT;
/** The amber of DS ProRSI's signal line. */
const AMBER = "#F2B544";
/** A level as MNQ prints it: to the quarter point, two decimals. */
const tickPrice = (v: number) => (Math.round(toPrice(v) * 4) / 4).toFixed(2);

/* DS ASL: one finished session, London,
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
/* ProRSI: a short RSI over the tape (six warm-up bars so it starts settled). */
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
/* DS ProLiquidityHunter: every swing extreme price has moved away from and
   not traded back through is a pool — buy-side over a swing high, sell-side
   under a swing low. A swing here is a bar whose extreme stands beyond the
   bar either side of it; the product confirms a swing by a reversal sized in
   average true range, which a 32-bar drawing cannot show. A pool is TAKEN by
   the first later bar that trades through its level, and the NEXT close gives
   the verdict: back inside the level is SWEPT, still beyond it is RUN (the
   product's own rule). A pool taken on the last bar has no next close yet, so
   it carries no verdict. Two things keep the drawing readable, both the
   product's own ideas in small: an extreme within one unit of a pool that is
   still standing joins it (a stacked pool) rather than drawing a second band,
   and a pool taken within three bars of forming is left out. `heat` ranks the
   live pools by how near price is — nearest strongest. */
type LiqPool = { side: "buy" | "sell"; from: number; v: number; taken: number; verdict: "SWEPT" | "RUN" | null; heat: number };
const POOLS: LiqPool[] = (() => {
  const out: LiqPool[] = [];
  const K = 1;
  for (let i = K; i < N - K; i++) {
    const around = [...cand.slice(i - K, i), ...cand.slice(i + 1, i + K + 1)];
    for (const side of ["buy", "sell"] as const) {
      const v = side === "buy" ? cand[i].h : cand[i].l;
      const isSwing = side === "buy" ? around.every((b) => b.h < v) : around.every((b) => b.l > v);
      if (!isSwing) continue;
      let taken = -1;
      for (let j = i + 1; j < N; j++)
        if (side === "buy" ? cand[j].h > v : cand[j].l < v) {
          taken = j;
          break;
        }
      if (taken >= 0 && taken - i < 3) continue;
      if (out.some((q) => q.side === side && Math.abs(q.v - v) <= 1 && (q.taken < 0 || q.taken > i))) continue;
      const next = taken >= 0 && taken + 1 < N ? closes[taken + 1] : null;
      const verdict = next === null ? null : (side === "buy" ? next < v : next > v) ? "SWEPT" : "RUN";
      out.push({ side, from: i, v, taken, verdict, heat: 0.22 });
    }
  }
  const last = closes[N - 1];
  out
    .filter((q) => q.taken < 0)
    .sort((a, b) => Math.abs(a.v - last) - Math.abs(b.v - last))
    .forEach((q, k) => (q.heat = [0.92, 0.58, 0.34][k] ?? 0.26));
  return out;
})();

/* DS ProHeikinAshi: the classic Heikin-Ashi candle from the tape's own bars —
   close is the bar's average price, (O + H + L + C) / 4; open is the middle of
   the candle before it. The next candle opens at the middle of this one's
   body, so that price is the FLIP LEVEL: the next bar is the other colour
   exactly when its average finishes beyond it. A candle is FLIP PENDING —
   drawn hollow — when the real close is already through its own flip level.
   Two slower candles (three and six of the chart's bars here; the product
   ships five and fifteen) are built from the same bars and ride above as lanes. */
const HA = (() => {
  const out: { o: number; c: number; h: number; l: number; flip: number; pending: boolean }[] = [];
  cand.forEach((b, i) => {
    const c = (b.o + b.h + b.l + b.c) / 4;
    const o = i ? (out[i - 1].o + out[i - 1].c) / 2 : (b.o + b.c) / 2;
    const flip = (o + c) / 2;
    out.push({ o, c, h: Math.max(b.h, o, c), l: Math.min(b.l, o, c), flip, pending: c >= o ? b.c < flip : b.c > flip });
  });
  return out;
})();
/** The largest reach from an open, so every candle fits its half of the panel. */
const HA_REACH = Math.max(...HA.map((b) => Math.max(b.h - b.o, b.o - b.l)));
/** Is the slower Heikin-Ashi candle that holds bar i up? One value per bar. */
const haLane = (span: number) => {
  let o = 0, c = 0;
  const up: boolean[] = [];
  for (let g = 0; g * span < N; g++) {
    const bars = cand.slice(g * span, (g + 1) * span);
    const hi = Math.max(...bars.map((b) => b.h)), lo = Math.min(...bars.map((b) => b.l));
    const cc = (bars[0].o + hi + lo + bars[bars.length - 1].c) / 4;
    o = g ? (o + c) / 2 : (bars[0].o + bars[bars.length - 1].c) / 2;
    c = cc;
    bars.forEach(() => up.push(c >= o));
  }
  return up;
};
const HA_LANES = [haLane(3), haLane(6)];
/** The flip level of the last closed bar — where the rail is drawn on price. */
const HA_FLIP = HA[N - 1].flip;

/* ProRSI's level on price: the swing high whose RSI crossover made it, drawn
   right until price closes through it — and frozen there, as the product does. */
const RSI_HI = 2;
const RSI_LVL = Math.max(cand[RSI_HI].h, 64.6);
const RSI_FREEZE = closes.findIndex((c, i) => i > RSI_HI + 3 && c > RSI_LVL);
/** Two decimals: server and browser must print the same numbers (hydration). */
/** DS ProTrendRange's own reading, taken on the drawn tape: signed efficiency
 *  over n changes — EMA(d) / sqrt(EMA(d²)) — scaled by sqrt(n) so two lengths
 *  share one scale, then printed as 100 × Φ(z): 50 no drift, 84.1 / 15.9 one
 *  sigma (the product's formula; Φ by Abramowitz–Stegun 7.1.26). The lengths
 *  are shortened to suit a 32-bar drawing (the product ships 10 and 50). */
const phi = (z: number) => {
  const x = Math.abs(z) / Math.SQRT2;
  const k = 1 / (1 + 0.3275911 * x);
  const erf = 1 - ((((1.061405429 * k - 1.453152027) * k + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-x * x);
  return 0.5 * (1 + (z < 0 ? -erf : erf));
};
const phase = (n: number) => {
  let m = 0, v = 0;
  return closes.map((c, i) => {
    if (i === 0) return 50;
    const d = c - closes[i - 1];
    const a = i <= n ? 1 / i : 2 / (n + 1);
    m += a * (d - m);
    v += a * (d * d - v);
    return v > 0 ? 100 * phi((Math.sqrt(Math.min(i, n)) * m) / Math.sqrt(v)) : 50;
  });
};
const TR_TREND = phase(12);
const TR_SWING = phase(4);
const SIGMA_HI = 84.13, SIGMA_LO = 15.87;
/** The latch: a trend turns on at one sigma and stays on until the reading
 *  crosses the centre. +1 up, −1 down, 0 ranging. */
const TR_DIR = (() => {
  let dir = 0;
  return TR_TREND.map((p, i) => {
    if (i < 3) return 0; // three changes are not a reading yet
    if (dir > 0 && p < 50) dir = 0;
    if (dir < 0 && p > 50) dir = 0;
    if (dir === 0) dir = p >= SIGMA_HI ? 1 : p <= SIGMA_LO ? -1 : 0;
    return dir;
  });
})();
/** A pullback: the trend is on and the swing is on the other side of the centre. */
const TR_PULL = TR_DIR.map((d, i) => (d > 0 && TR_SWING[i] < 50) || (d < 0 && TR_SWING[i] > 50));

const r2 = (n: number) => Math.round(n * 100) / 100;
const pts = (a: number[], y: (v: number) => number, from = 0) => a.map((v, i) => `${r2(xAt(i + from))},${r2(y(v))}`).join(" ");
/** A rectangle as a path (dark modes treat <rect> as a background object). */
const box = (x: number, y: number, w: number, h: number) => `M${r2(x)} ${r2(y)}h${r2(w)}v${r2(h)}h${r2(-w)}Z`;
/** A small dot as a path, for the same reason. */
const dot = (cx: number, cy: number, r: number) => `M${r2(cx - r)} ${r2(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

const SERIES_OF = Object.fromEntries(COMPLETE_PRODUCTS.map((p) => [p.slug, p.series])) as Record<string, Series>;
const NAME_OF = Object.fromEntries(COMPLETE_PRODUCTS.map((p) => [p.slug, p.name])) as Record<string, string>;
const SERIES_NAME = Object.fromEntries(SERIES.map((s) => [s.key, s.name])) as Record<Series, string>;
/** The tabs' short words. The series that comes free with DS Complete (DS ASL,
 *  DS Toolkit) is named by the site's one label for it. */
const TAB: Partial<Record<Series, string>> = { flagship: "Flagship", pro: "Pro Series", utility: "Utility", exclusive: SERIES_NAME.exclusive };
/** Under 440px the four tabs do not fit one row in full, so "Pro Series"
 *  shortens to the word that names it on its own panel. */
const TAB_SHORT: Partial<Record<Series, string>> = { ...TAB, pro: "Pro" };
/** Series with a panel of their own below the chart (the store's shelves). */
const HAS_PANEL = new Set<Series>(STORE_SHELVES.map((s) => s.info.key));

/** How long the tour rests on each product, and on the whole chart between rounds. */
const DWELL = 3200;
const DWELL_ALL = 2200;

/** One product's drawing: shown once its series is built, dimmed while
 *  something else is being pointed at. */
function L({ p, also = [], children }: { p: string; also?: string[]; children: ReactNode }) {
  const { focus, step } = useCompleteStage();
  const s = SERIES_OF[p];
  const { shown } = built(s, step);
  // `also`: other products that draw this layer too.
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
  // Phones: the small tags (session names, a pool's verdict, the flip flag's
  // price) would crowd one another once the type is scaled up; the levels and
  // marks stay, the small tags go.
  const roomy = fs < 1.3;

  return (
    <div ref={card} className={`border border-line bg-[rgba(14,17,21,0.72)] ${className}`}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-mute min-[400px]:tracking-[0.16em]">
          One chart <span className="text-slate">·</span> every tool in it
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ONLINE }} aria-hidden="true" />
          NT8
        </span>
      </div>

      {/* touch screens: the series tabs, right above the drawing */}
      {/* The tabs take the width their words need (not equal columns) and
          share what is left. */}
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
              <span className="min-[440px]:hidden">{TAB_SHORT[s]}</span>
              <span className="hidden min-[440px]:inline">{TAB[s]}</span>
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
          <Drawing t={t} H={H} stripY={stripY} roomy={roomy} />
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
            COMPLETE_PRODUCTS.filter((p) => p.series === focus.series).map((p) => p.name).join(" · ")
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
            <span className="text-mute">Every tool in DS Complete, drawn on one chart. Tap a series, or step through them one by one.</span>
          ) : focus?.slug ? (
            DRAWS[focus.slug]
          ) : (
            COMPLETE_PRODUCTS.filter((p) => p.series === s).map((p) => p.name).join(" · ")
          )}
        </p>
        {s && (
          <p className="mt-auto pt-1.5">
            {focus?.slug ? (
              <Link
                href={productHref(focus.slug)}
                onClick={() => choose({ ...focus, source: "tap" })}
                className="inline-block py-1 text-[12.5px] text-ink underline decoration-line-strong underline-offset-4"
              >
                View {NAME_OF[focus.slug]} →
              </Link>
            ) : HAS_PANEL.has(s) ? (
              <a href={`#${s}`} onClick={() => choose({ ...focus, source: "tap" })} className="inline-block py-1 text-[12.5px] text-ink underline decoration-line-strong underline-offset-4">
                Go to the {SERIES_NAME[s]} ↓
              </a>
            ) : (
              // A series with no panel of its own (free with DS Complete): the
              // page of each product in it.
              <span className="flex flex-wrap gap-x-5">
                {inSeries.map((it) => (
                  <Link
                    key={it.slug}
                    href={productHref(it.slug)}
                    onClick={() => choose({ ...focus, source: "tap" })}
                    className="inline-block py-1 text-[12.5px] text-ink underline decoration-line-strong underline-offset-4"
                  >
                    View {NAME_OF[it.slug]} →
                  </Link>
                ))}
              </span>
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

function Drawing({ t, H, stripY, roomy }: { t: (n: number) => number; H: number; stripY: number; roomy: boolean }) {
  const bars = cand;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Every product in DS Complete drawn together on one NinjaTrader chart (illustration)">
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

      {/* ------------------------------------------------------- DS Toolkit */}
      {/* The rail in the left margin of the price pane: a faint frame, one
          filled switch for each indicator in DS Complete (all on — each is
          drawn on this chart), a hairline, then the drawing tools as outlines. */}
      <L p="toolkit">
        <g transform={`translate(${RAIL.x} ${RAIL.y})`}>
          <path d={box(0.5, 0.5, RAIL.w - 1, RAIL_H)} fill={INK} fillOpacity="0.03" stroke={INK} strokeOpacity={A.frame} />
          {RAIL_ROWS.map((slug, k) => (
            <path key={slug} d={box((RAIL.w - RAIL.sw) / 2, 8 + k * RAIL.pitch, RAIL.sw, RAIL.sw)} fill={TEAL} fillOpacity="0.7" />
          ))}
          <line x1="4" x2={RAIL.w - 4} y1={RAIL_RULE} y2={RAIL_RULE} stroke={INK} strokeOpacity={A.frame} />
          {Array.from({ length: RAIL.tools }).map((_, k) => (
            <path key={k} d={box((RAIL.w - 7) / 2, RAIL_RULE + 8.5 + k * RAIL.toolPitch, 7, 7)} fill="none" stroke={INK} strokeOpacity={A.mute} />
          ))}
        </g>
      </L>

      {/* ----------------------------------------------------------- DS ASL */}
      {/* DS ASL — Advanced Session Levels: the London bracket over exactly
          its own bars, a tick at each end; its high and low carried forward,
          dotted, fading from the bar that closed through them; named at the
          bracket's end and tagged at the right edge. */}
      <L p="asl">
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
        {/* The volume inside the bracket — thin bars against its first bar,
            the value area stronger, the POC the longest and carried forward
            as a level until price trades back at it. */}
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

      {/* ------------------------------------------------------ Pro Series */}
      {/* DS ProHeikinAshi on the price pane: the flip level as a real price —
          a dashed rail from the bar that set it to the axis, with its flag. */}
      <L p="proheikinashi">
        {(() => {
          const y = r2(yP(HA_FLIP));
          const x0 = r2(xAt(N - 1) + 5);
          const fsz = t(4.6);
          const label = roomy ? `FLIP ${tickPrice(HA_FLIP)}` : "FLIP";
          const fw = r2(fsz * 0.66 * label.length + 6), fh = r2(fsz + 4);
          return (
            <>
              <line x1={x0} x2={r2(W - 4 - fw)} y1={y} y2={y} stroke={VIOLET} strokeOpacity="0.9" strokeDasharray="2 2" />
              <path d={`M${r2(W - 4 - fw)} ${y}l2.5 ${r2(-fh / 2)}h${r2(fw - 2.5)}v${fh}h${r2(-(fw - 2.5))}Z`} fill="none" stroke={VIOLET} strokeOpacity="0.9" strokeWidth="0.8" />
              <text x={r2(W - 4 - fw / 2 + 1)} y={r2(y + fsz * 0.36)} textAnchor="middle" className="font-mono" fontSize={fsz} letterSpacing="0.4" fill={VIOLET}>
                {label}
              </text>
            </>
          );
        })()}
      </L>

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
              <polyline points={pts(smooth(rsi, 4), yr)} fill="none" stroke={AMBER} strokeOpacity="0.55" />
              <Segments values={rsi} y={yr} hi={70} lo={30} width={1.25} />
            </>
          );
        } else if (slug === "proliquidityhunter") {
          // DS ProLiquidityHunter: price as a line on close over its pools.
          // A live pool runs to the right edge, stronger the nearer price is
          // to it; a taken pool stops on a bright tick at the bar that took
          // it, named SWEPT or RUN by the next close.
          const top = y0 + 6 + t(6), bot = y0 + ph - 5;
          const yl = (v: number) => top + (1 - (v - LO) / (HI - LO)) * (bot - top);
          body = (
            <>
              {POOLS.map((pl, q) => {
                const c = pl.side === "buy" ? TEAL : VIOLET;
                const y = yl(pl.v);
                const live = pl.taken < 0;
                const xa = xAt(pl.from), xb = live ? PX1 - 1 : xAt(pl.taken);
                return (
                  <g key={q}>
                    <path d={box(xa, y - 1.5, xb - xa, 3)} fill={c} fillOpacity={pl.heat} />
                    {!live && <path d={box(xb - 0.6, y - 3.5, 1.2, 7)} fill={c} />}
                    {!live && roomy && pl.verdict && xb - xa > 22 && (
                      <text x={r2(xb - 3)} y={r2(pl.side === "buy" ? y - 3 : y + 2.5 + t(4))} textAnchor="end" className="font-mono" fontSize={t(4)} letterSpacing="0.5" fill={c}>
                        {pl.verdict}
                      </text>
                    )}
                  </g>
                );
              })}
              <polyline points={pts(closes, yl)} fill="none" stroke={INK} strokeOpacity="0.85" strokeWidth="1" strokeLinejoin="round" />
            </>
          );
        } else if (slug === "proheikinashi") {
          // DS ProHeikinAshi: two lanes for the slower candles, then every
          // Heikin-Ashi candle standing on its own open — the dashed line —
          // hollow where the real close is already through its flip level.
          const lanes = y0 + 5 + t(6);
          const top = lanes + 9, bot = y0 + ph - 4;
          const mid = (top + bot) / 2;
          const k = (bot - top) / 2 / HA_REACH;
          const yh = (d: number) => mid - d * k;
          body = (
            <>
              {HA_LANES.map((lane, j) =>
                lane.map((up, i) => (
                  <path key={`l${j}-${i}`} d={box(xAt(i) - DX / 2, lanes + j * 3.5, DX + 0.2, 2.2)} fill={up ? TEAL : VIOLET} fillOpacity={j ? 0.5 : 0.8} />
                )),
              )}
              <line x1={PX0} x2={PX1} y1={mid} y2={mid} stroke={INK} strokeOpacity={A.mark} strokeDasharray="2 3" />
              {HA.map((b, i) => {
                const up = b.c >= b.o;
                const c = up ? TEAL : VIOLET;
                const x = xAt(i);
                const y1 = yh(b.c - b.o), h = Math.max(1, Math.abs(y1 - mid));
                return (
                  <g key={i}>
                    <line x1={r2(x)} x2={r2(x)} y1={r2(yh(b.h - b.o))} y2={r2(yh(b.l - b.o))} stroke={c} strokeOpacity="0.55" strokeWidth="0.8" />
                    {b.pending ? (
                      <path d={box(x - 3, Math.min(y1, mid), 6, h)} fill="none" stroke={c} strokeWidth="0.9" />
                    ) : (
                      <path d={box(x - 3, Math.min(y1, mid), 6, h)} fill={c} fillOpacity="0.85" />
                    )}
                  </g>
                );
              })}
            </>
          );
        } else {
          // DS ProTrendRange: the thick TREND line over the thin SWING line on
          // one 0–100 scale; the two one-sigma lines and the dashed centre; a
          // POCKET, in the trend's own hue, wherever the swing runs against a
          // trend that is on; and the state ribbon along the foot — the side's
          // hue for a trend, the same hue ghosted while it pulls back, bare
          // while the market ranges.
          const yr = (v: number) => yy(v / 100);
          const hue = (d: number) => (d > 0 ? TEAL : VIOLET);
          body = (
            <>
              <line x1={PX0} x2={PX1} y1={yr(SIGMA_HI)} y2={yr(SIGMA_HI)} stroke={TEAL} strokeOpacity="0.28" />
              <line x1={PX0} x2={PX1} y1={yr(SIGMA_LO)} y2={yr(SIGMA_LO)} stroke={VIOLET} strokeOpacity="0.28" />
              <line x1={PX0} x2={PX1} y1={yr(50)} y2={yr(50)} stroke={INK} strokeOpacity={A.mark} strokeDasharray="2 3" />
              {TR_PULL.map((on, i) =>
                on ? (
                  <path
                    key={`p${i}`}
                    d={box(xAt(i) - DX / 2, Math.min(yr(50), yr(TR_SWING[i])), DX, Math.abs(yr(TR_SWING[i]) - yr(50)))}
                    fill={hue(TR_DIR[i])}
                    fillOpacity="0.34"
                  />
                ) : null,
              )}
              <polyline points={pts(TR_SWING, yr)} fill="none" stroke={INK} strokeOpacity="0.42" strokeWidth="0.8" />
              <g strokeWidth="1.5" strokeLinecap="round">
                {TR_TREND.slice(1).map((v, i) => (
                  <line
                    key={`t${i}`}
                    x1={r2(xAt(i))}
                    x2={r2(xAt(i + 1))}
                    y1={r2(yr(TR_TREND[i]))}
                    y2={r2(yr(v))}
                    stroke={TR_DIR[i + 1] ? hue(TR_DIR[i + 1]) : INK}
                    strokeOpacity={TR_DIR[i + 1] ? 1 : 0.8}
                  />
                ))}
              </g>
              {TR_DIR.map((d, i) => (
                <path
                  key={`s${i}`}
                  d={box(xAt(i) - DX / 2 + 0.3, y0 + ph - 4.5, DX - 0.6, 2.5)}
                  fill={d ? hue(d) : INK}
                  fillOpacity={d ? (TR_PULL[i] ? 0.38 : 0.9) : A.grid * 2}
                />
              ))}
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
