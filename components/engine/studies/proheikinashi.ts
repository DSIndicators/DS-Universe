import type { Draw, PaneView, ReadItem, Session, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm, wall } from "../ta";

/**
 * DS ProHeikinAshi — web edition. Source: DSProHeikinAshi.cs (Build 2026-10-05),
 * shipped defaults (ApplyDefaults): CloseBar, Middle x5, Slow x15, wicks, tide,
 * lanes, turn notches, ruler, readout, context chips, track record, flip rail,
 * timeframe rails, turn marks on price (Mark history 750), source tag "A",
 * theme DsSignature.
 *
 * PORTED EXACTLY (Step / LaneStep / OddsOf / CellOf of the .cs):
 *   · the classic candle, never rounded: HC = (O+H+L+C)/4, HO = mid of the
 *     previous candle (first bar: its open); HH = max(H, HO), HL = min(L, HO);
 *     UP when HC > HO, DOWN when below, unchanged when equal; run length.
 *   · the flip level = next candle's open = (HO + HC) / 2.
 *   · the unit: running mean (first 50 bars) then EMA(50) of (HC − previous
 *     close)², square-rooted, floored at one tick; cushion z = trend·(C − level)/unit,
 *     tiers FLIP PENDING (z < 0) / HOLDING / FIRM (z ≥ 2), from bar 20 on.
 *   · the odds: 32 cells of z, the shipped PRIOR table weighted 40, learned on
 *     this chart (each bar's cell scored one bar later), pooled monotone
 *     (pool-adjacent-violators) — the same book, the same order of updates.
 *   · the two higher timeframes (5m / 15m) built from the chart's own bars, cut
 *     on the session clock from the 18:00 ET session open (CME ETH template,
 *     session end 17:00), their forming colour as of every bar (AsOf), the colour
 *     settled at each candle's close (Final), turns, levels, bodies.
 *   · FLIP RATE (per-tier record to date, listed from 60 scored bars), CUSHION
 *     SAYS LITTLE, the 3-of-3 count, every chip and readout wording.
 *   · the panel: fixed ±5-unit frame with the .cs head/foot reserves (Reserves),
 *     dashed line at the open, tape candles standing on their own open (solid
 *     HOLDING, strong colour FIRM, hollow FLIP PENDING, 2 px notch when cut at
 *     the frame), shadows (body side 0.50, far side 0.92), the tide (slow body
 *     ÷ (unit·√15)), the two lanes with turn notches and the "A 15m"/"5m" tags,
 *     the ruler (scale ±4u, close marker, priced ticks, FLIP / CLOSE rows).
 *   · on price: the FLIP / 5m FLIP / 15m FLIP rails (dashed, from the bar the
 *     level belongs to, in the colour of that candle) with the .cs flag row
 *     layout (Layout, 15 px rows), and the chevron-with-A mark on every bar that
 *     closes the 15m candle in a new colour (under the low for UP, over the high
 *     for DOWN), with its ground bevel; colours re-valued for the ground exactly
 *     as ApplyPalette / DsHaInk.Lit do (dark: 12% to white, light: ×0.62).
 *
 * DEVIATIONS
 *   1. History length: the odds book and the unit learn from the first bar the
 *      replay file holds (about three sessions back), not from a whole
 *      NinjaTrader chart's history; both start from the same shipped prior.
 *   2. Rail flags: the rail's word (FLIP / 5m / 15m — the .cs short label) is
 *      set at the right edge of the plot, rows laid out by the .cs Layout(), and
 *      the price goes in the axis as a tag in the rail's colour, instead of the
 *      NinjaTrader flag plate carrying both.
 *   3. Ruler: the study asks DS Replay for a 320 px right margin (the runway a
 *      NinjaTrader chart keeps; the engine caps it at a third of the plot), so
 *      on a desktop-width chart the ruler is drawn whole, exactly as the .cs.
 *      Where the margin is too narrow for its labels (a phone), the .cs would
 *      draw nothing and show "RULER: WIDEN THE RIGHT MARGIN"; the web edition
 *      draws the ruler's post alone (scale, close marker, ticks) and leaves
 *      FLIP and ODDS to the header chip, without that chip.
 *   4. Mark history: superseded by 7 — marks are created for the first shown
 *      bar and every bar after it (the .cs keeps 750 bars of history).
 *   5. The engine's pane scale is replaced inside the study with the .cs frame
 *      (−5 − foot .. +5 + head from the pane's real height), so the axis
 *      numbers and the crosshair read in units exactly as NinjaTrader's do.
 *   6. Narration: the tool's own events are the 15m turns (the price marks,
 *      weight 3) and the 5m turns (weight 2). Chart-candle flips (about one bar
 *      in four) and 3-of-3 changes are drawn on the panel but not narrated.
 *   7. Example hygiene (web showcase): nothing born before the first shown bar
 *      (s.replayFrom) is drawn or counted — no A mark from the hidden warm-up,
 *      the FLIP RATE chip (and the CUSHION SAYS LITTLE test) counts the tier
 *      record from the first shown bar, so it appears once 60 shown bars of a
 *      tier are scored, and the readout's run ("UP · 11 bars") counts bars from
 *      the first shown bar. The candle, the unit, the odds book and the lanes
 *      are computed exactly as before, from the first bar the session holds.
 * Fonts: the house mono stands in for Segoe UI / Arial; chip widths are measured.
 */

// ---------------------------------------------------------------- constants (the .cs)
const N_UNIT = 50, WARM = 20, Z_FIRM = 2.0, NB = 32, W0 = 40.0;
const PRIOR = [
  0.9652, 0.9581, 0.9247, 0.9085, 0.8856, 0.8463, 0.8109, 0.7642, 0.6941, 0.6263, 0.5411, 0.4334, 0.347, 0.2737, 0.2073, 0.1557,
  0.1154, 0.0852, 0.0616, 0.0434, 0.034, 0.0243, 0.0182, 0.0124, 0.0106, 0.0106, 0.0097, 0.0097, 0.0097, 0.0097, 0.0043, 0.0043,
];
const TIER_PENDING = 0, TIER_HOLDING = 1, TIER_FIRM = 2;
const K_MID = 5, K_SLOW = 15, NAME_M = "5m", NAME_S = "15m";
// Mark history (750 in the .cs) is replaced by the first shown bar: DEVIATIONS 4 and 7
const FRAME = 5.0;
const HEAD_MIN = 15, HEAD_MAX = 30, RIB_H = 6, LANE_GAP = 2, RIB_GAP = 3, HEAD_AIR = 3, FOOT_AIR = 3;
const HEAD_T = 0.34, FOOT_T = 0.03, BODY_MIN = 64.0;
const FLAG_ROW = 15;
const SESSION_OPEN = 18 * 60, SESSION_LEN = 23 * 60;

// ---------------------------------------------------------------- colours (ApplyPalette)
type RGB = [number, number, number];
const BULL: RGB = [0, 153, 153], BEAR: RGB = [163, 61, 255], NEUTRAL: RGB = [85, 85, 85], SBULL: RGB = [0, 255, 255], SBEAR: RGB = [255, 0, 255];
type Pal = { light: boolean; bull: RGB; bear: RGB; sBull: RGB; sBear: RGB; neutral: RGB; ink: RGB; ground: RGB };
const hexRgb = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const palCache = new Map<string, Pal>();
function palette(bg: string): Pal {
  let p = palCache.get(bg);
  if (p) return p;
  const g = hexRgb(bg);
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const light = 0.2126 * lin(g[0]) + 0.7152 * lin(g[1]) + 0.0722 * lin(g[2]) > 0.45;
  const lit = (c: RGB): RGB => (light ? (c.map((v) => v * 0.62) as RGB) : (c.map((v) => v + (255 - v) * 0.12) as RGB));
  p = {
    light, bull: lit(BULL), bear: lit(BEAR), sBull: lit(SBULL), sBear: lit(SBEAR),
    neutral: light ? (NEUTRAL.map((v) => v * 0.9) as RGB) : (NEUTRAL.map((v) => v + (255 - v) * 0.25) as RGB),
    ink: light ? [0.16 * 255, 0.18 * 255, 0.22 * 255] : [0.84 * 255, 0.86 * 255, 0.9 * 255],
    ground: g,
  };
  palCache.set(bg, p);
  return p;
}
const A = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

// ---------------------------------------------------------------- helpers
const fmtP = (p: number, tick: number) => (isFinite(p) ? (Math.round(p / tick) * tick).toFixed(2) : "--");
const fmtC = (p: number, tick: number) => (Math.round(p / tick) * tick).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const oddsText = (o: number) => (isNaN(o) ? "" : `${Math.round(Math.max(1, Math.min(99, o)))}%`);
const pct = (hit: number, n: number) => (n <= 0 ? "--" : `${Math.round((100 * hit) / n)}%`);
const barsWord = (n: number) => `${n} ${n === 1 ? "bar" : "bars"}`;
const UPA = "▲", DNA = "▼", DOT = " · ";

function cellOf(z: number) {
  if (z < -2.0) return 0;
  if (z >= 4.0) return NB - 1;
  let i = Math.floor((z + 2.0) * 5.0);
  if (i < 0) i = 0; else if (i > 29) i = 29;
  return 1 + i;
}

type Lane = {
  K: number; On: boolean; Ho: number; Bo: number; Bh: number; Bl: number; Bc: number;
  KeySess: number; KeyBucket: number; Count: number; Final: number; AsOf: number; Declared: boolean; FromBar: number;
};
const newLane = (K: number): Lane => ({ K, On: false, Ho: 0, Bo: 0, Bh: 0, Bl: 0, Bc: 0, KeySess: 0, KeyBucket: 0, Count: 0, Final: 0, AsOf: 0, Declared: false, FromBar: -1 });
const laneClose = (s: Lane, hc: number) => { if (hc > s.Ho) s.Final = 1; else if (hc < s.Ho) s.Final = -1; };
const laneLevel = (s: Lane) => (!s.On ? NaN : s.Declared ? 0.5 * (s.Ho + (s.Bo + s.Bh + s.Bl + s.Bc) / 4.0) : s.Ho);

/** LaneStep of the .cs on minute bars (clock lanes, intraday, InSession). Times in minutes. */
function laneStep(s: Lane, bar: number, t: number, o: number, h: number, l: number, c: number): number {
  const was = s.Final;
  const sb = Math.floor((t - 1 - SESSION_OPEN) / 1440) * 1440 + SESSION_OPEN; // HostSession: (begin, end]
  const se = sb + SESSION_LEN;
  const w = s.K;
  const bucket = Math.floor((t - sb - 1) / w);
  const first = !s.On;
  let fresh: boolean;
  if (first) { s.On = true; fresh = true; } else fresh = sb !== s.KeySess || bucket !== s.KeyBucket;
  if (fresh) {
    if (first) s.Ho = o;
    else {
      const hc = (s.Bo + s.Bh + s.Bl + s.Bc) / 4.0;
      if (!s.Declared) laneClose(s, hc);
      s.Ho = 0.5 * (s.Ho + hc);
    }
    s.Bo = o; s.Bh = h; s.Bl = l;
    s.Count = 0; s.Declared = false;
    s.KeySess = sb; s.KeyBucket = bucket;
    s.FromBar = bar;
  } else {
    if (h > s.Bh) s.Bh = h;
    if (l < s.Bl) s.Bl = l;
  }
  s.Bc = c; s.Count++;
  const hcf = (s.Bo + s.Bh + s.Bl + s.Bc) / 4.0;
  if (hcf > s.Ho) s.AsOf = 1; else if (hcf < s.Ho) s.AsOf = -1;
  let ends = (((t - sb) % w) + w) % w === 0;
  if (t >= se) ends = true;
  if (ends && !s.Declared) { laneClose(s, hcf); s.Declared = true; }
  return was !== 0 && s.Final !== 0 && s.Final !== was ? s.Final : 0;
}

/** RailLayout.Layout of the .cs: flag rows at least FLAG_ROW apart, the chart's own flag weighted 4. */
function layoutRows(y: number[], lim0: number, lim1: number) {
  const ord: number[] = [], u: number[] = [], wt: number[] = [];
  if (!(lim1 >= lim0)) { y[0] = y[1] = y[2] = NaN; return; }
  let n = 0;
  for (let i = 0; i < 3; i++) if (!isNaN(y[i])) ord[n++] = i;
  while (n > 1 && lim1 - lim0 < FLAG_ROW * (n - 1) - 0.001) { y[ord[n - 1]] = NaN; n--; }
  if (n === 0) return;
  for (let i = 1; i < n; i++) {
    const v = ord[i]; let j = i - 1;
    while (j >= 0 && (y[ord[j]] > y[v] || (y[ord[j]] === y[v] && ord[j] > v))) { ord[j + 1] = ord[j]; j--; }
    ord[j + 1] = v;
  }
  let m = 0, c0 = 0, c1 = 0, c2 = 0;
  for (let k = 0; k < n; k++) {
    let yk = y[ord[k]];
    yk = yk < lim0 ? lim0 : yk > lim1 ? lim1 : yk;
    u[m] = yk - k * FLAG_ROW; wt[m] = ord[k] === 0 ? 4 : 1;
    if (m === 0) c0 = 1; else if (m === 1) c1 = 1; else c2 = 1;
    m++;
    while (m > 1 && u[m - 2] > u[m - 1]) {
      const ws = wt[m - 2] + wt[m - 1];
      u[m - 2] = (u[m - 2] * wt[m - 2] + u[m - 1] * wt[m - 1]) / ws; wt[m - 2] = ws;
      if (m === 2) { c0 += c1; c1 = 0; } else { c1 += c2; c2 = 0; }
      m--;
    }
  }
  let r0 = 0, r1 = 0, r2 = 0;
  for (let k = 0; k < n; k++) {
    const uv = k < c0 ? u[0] : k < c0 + c1 ? u[1] : u[2];
    const r = uv + k * FLAG_ROW;
    if (k === 0) r0 = r; else if (k === 1) r1 = r; else r2 = r;
  }
  if (r0 < lim0) r0 = lim0;
  if (n > 1 && r1 < r0 + FLAG_ROW) r1 = r0 + FLAG_ROW;
  if (n > 2 && r2 < r1 + FLAG_ROW) r2 = r1 + FLAG_ROW;
  if (n === 1) { if (r0 > lim1) r0 = lim1; }
  else if (n === 2) { if (r1 > lim1) r1 = lim1; if (r0 > r1 - FLAG_ROW) r0 = r1 - FLAG_ROW; }
  else { if (r2 > lim1) r2 = lim1; if (r1 > r2 - FLAG_ROW) r1 = r2 - FLAG_ROW; if (r0 > r1 - FLAG_ROW) r0 = r1 - FLAG_ROW; }
  y[ord[0]] = r0;
  if (n > 1) y[ord[1]] = r1;
  if (n > 2) y[ord[2]] = r2;
}

/** DsHaMark: the chevron (FORM_TRIGGER) with its ground bevel and the rune. */
function drawChevronMark(d: Draw, ax: number, ay: number, up: boolean, hue: string, ground: string, rune: string | null, prime = false) {
  const ctx = d.ctx;
  const bodyW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
  const r = Math.max(5.5, Math.min(11, bodyW * 1.25));
  const GAP = 9;
  const w = Math.max(1.3, Math.min(2.2, r * 0.34));
  const rise = r * 0.62, pitch = r * 0.95;
  const n = prime ? 2 : 1;
  const span = rise + (n - 1) * pitch;
  const top = up ? ay + GAP : ay - GAP - span;
  const strokes = (col: string, lw: number) => {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let k = 0; k < n; k++) {
      const yb = up ? top + rise + k * pitch : top + k * pitch;
      const yt = up ? yb - rise : yb + rise;
      ctx.beginPath(); ctx.moveTo(ax - r, yb); ctx.lineTo(ax, yt); ctx.lineTo(ax + r, yb); ctx.stroke();
    }
    ctx.restore();
  };
  strokes(ground, w + 3);
  strokes(hue, w);
  const tail = up ? top + span : top;
  if (!rune || r < 4) return;
  let fs = r * 1.9; fs = Math.max(9, Math.min(20, fs)); fs = Math.floor(fs + 0.5);
  const rh = fs * 1.45;
  const ty = up ? tail + 2 : tail - rh - 2;
  const cy = ty + rh / 2;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) d.text(rune, ax + dx, cy + dy, { color: ground, size: fs * 0.82, weight: 700, align: "center", font: "sans" });
  d.text(rune, ax, cy, { color: d.alpha(hue, 0.92), size: fs * 0.82, weight: 700, align: "center", font: "sans" });
}

// ---------------------------------------------------------------- the study
export const study: StudyDef = {
  slug: "proheikinashi", rightMargin: 320,
  name: "DS ProHeikinAshi",
  about: "The Heikin-Ashi candle in a panel under real candles, each standing on its own open; its flip level and the 5m / 15m levels drawn on price as real prices.",
  panes: [{ id: "ha", title: "DS ProHeikinAshi", weight: 0.62, digits: 1 }],
  layers: [
    { id: "rails", label: "Flip rails on price", on: true, hint: "The dashed FLIP, 5m FLIP and 15m FLIP levels: the price the next bar's average, (O+H+L+C)/4, must finish beyond." },
    { id: "tide", label: "Tide", on: true, hint: "The 15-minute candle's own body behind the chart's candles, scaled by the square root of 15." },
  ],
  run(s: Session) {
    const n = s.n, tick = s.tick;
    const f64 = () => new Float64Array(n).fill(NaN);
    const HO = f64(), HH = f64(), HL = f64(), HC = f64(), LVL = f64(), Z = f64(), ODDS = f64(), UNIT = f64();
    const MLVL = f64(), MBODY = f64(), SLVL = f64(), SBODY = f64();
    const TREND = new Int8Array(n), RUN = new Int32Array(n), TIER = new Int8Array(n).fill(TIER_HOLDING), MDIR = new Int8Array(n), SDIR = new Int8Array(n);
    const FLIP = new Int8Array(n), MTURN = new Int8Array(n), STURN = new Int8Array(n);
    const MFROM = new Int32Array(n), SFROM = new Int32Array(n);
    const TRC = [new Int32Array(n), new Int32Array(n), new Int32Array(n)], TRH = [new Int32Array(n), new Int32Array(n), new Int32Array(n)];

    // engine state (Core)
    let seen = 0, kHo = 0, kHc = 0, kTrend = 0, kRun = 0, kV = 0, kKs = 0, kPc = NaN, kPCell = -1, kPTier = TIER_HOLDING;
    const bkCnt = new Float64Array(NB), bkHit = new Float64Array(NB), trCnt = [0, 0, 0], trHit = [0, 0, 0];
    const qV = new Float64Array(NB), qW = new Float64Array(NB), qN = new Int32Array(NB);
    const oddsOf = (z: number) => {
      let m = 0;
      for (let i = 0; i < NB; i++) {
        const wi = bkCnt[i] + W0;
        qV[m] = (bkHit[i] + W0 * PRIOR[i]) / wi; qW[m] = wi; qN[m] = 1; m++;
        while (m > 1 && qV[m - 2] < qV[m - 1]) {
          const a = qW[m - 2] + qW[m - 1];
          qV[m - 2] = (qV[m - 2] * qW[m - 2] + qV[m - 1] * qW[m - 1]) / a; qW[m - 2] = a; qN[m - 2] += qN[m - 1]; m--;
        }
      }
      const cell = cellOf(z);
      let at = 0;
      for (let b = 0; b < m; b++) { at += qN[b]; if (cell < at) return qV[b]; }
      return qV[m - 1];
    };
    const laneM = newLane(K_MID), laneS = newLane(K_SLOW);
    const unitFloor = tick;

    for (let i = 0; i < n; i++) {
      const O = s.o[i], H = s.h[i], L = s.l[i], C = s.c[i];
      const hc = (O + H + L + C) / 4.0;
      const ho = seen === 0 ? O : 0.5 * (kHo + kHc);
      const was = kTrend;
      const nt = hc > ho ? 1 : hc < ho ? -1 : was;
      const flip = nt !== 0 && was !== 0 && nt !== was;
      if (nt !== was || kRun === 0) kRun = nt !== 0 ? 1 : 0; else kRun++;
      kTrend = nt; kHo = ho; kHc = hc;
      if (seen > 0 && isFinite(kPc)) {
        const u = hc - kPc; kKs++;
        if (kKs <= N_UNIT) kV = kV + (u * u - kV) / kKs;
        else kV = kV + (2.0 / (N_UNIT + 1.0)) * (u * u - kV);
      }
      let sd = kV > 0 ? Math.sqrt(kV) : 0;
      if (sd < unitFloor) sd = unitFloor;
      if (kPCell >= 0) {
        bkCnt[kPCell]++; trCnt[kPTier]++;
        if (flip) { bkHit[kPCell]++; trHit[kPTier]++; }
      }
      const level = 0.5 * (ho + hc);
      let z = NaN, od = NaN, tier = TIER_HOLDING, cell = -1;
      if (seen >= WARM && sd > 0 && nt !== 0) {
        z = (nt * (C - level)) / sd;
        od = 100.0 * oddsOf(z);
        tier = z < 0 ? TIER_PENDING : z >= Z_FIRM ? TIER_FIRM : TIER_HOLDING;
        cell = cellOf(z);
      }
      kPCell = cell; kPTier = tier;
      const t2 = laneStep(laneM, i, s.t[i], O, H, L, C);
      const t3 = laneStep(laneS, i, s.t[i], O, H, L, C);

      HO[i] = ho; HH[i] = Math.max(H, ho); HL[i] = Math.min(L, ho); HC[i] = hc;
      TREND[i] = nt; RUN[i] = kRun; LVL[i] = level; Z[i] = z; ODDS[i] = od; TIER[i] = tier; UNIT[i] = sd;
      MDIR[i] = laneM.AsOf; MLVL[i] = laneLevel(laneM); MBODY[i] = (laneM.Bo + laneM.Bh + laneM.Bl + laneM.Bc) / 4.0 - laneM.Ho;
      SDIR[i] = laneS.AsOf; SLVL[i] = laneLevel(laneS); SBODY[i] = (laneS.Bo + laneS.Bh + laneS.Bl + laneS.Bc) / 4.0 - laneS.Ho;
      FLIP[i] = flip ? nt : 0; MTURN[i] = t2; STURN[i] = t3;
      MFROM[i] = laneM.Declared ? i : laneM.FromBar;
      SFROM[i] = laneS.Declared ? i : laneS.FromBar;
      for (let q = 0; q < 3; q++) { TRC[q][i] = trCnt[q]; TRH[q][i] = trHit[q]; }
      kPc = C; seen++;
    }

    // ---- marks on price (slow turns) and events
    // example hygiene (DEVIATIONS 7): no mark is born before the first shown bar
    const markFrom = s.replayFrom;
    const marks: { i: number; up: boolean; p: number }[] = [];
    for (let i = 0; i < n; i++) if (STURN[i] !== 0 && i >= markFrom) marks.push({ i, up: STURN[i] > 0, p: STURN[i] > 0 ? s.l[i] : s.h[i] });

    const events: StudyEvent[] = [];
    for (let i = 0; i < n; i++) {
      const st = STURN[i], mt = MTURN[i];
      if (st !== 0) {
        const up = st > 0;
        events.push({
          i, price: up ? s.l[i] : s.h[i], tone: up ? "bull" : "bear", weight: 3,
          title: `${NAME_S} CLOSED ${up ? "UP" : "DOWN"}`,
          text: `${hhmm(s, i)} — the 15-minute Heikin-Ashi candle closed ${up ? "UP" : "DOWN"} after ${up ? "a DOWN" : "an UP"} one: its average price, (O+H+L+C)/4 of the 15-minute bar, finished ${up ? "above" : "below"} the candle's open. The slow timeframe turned — the A mark goes ${up ? "under the low" : "over the high"} of this bar, and the 15m FLIP rail steps to ${fmtC(SLVL[i], tick)}.`,
        });
      }
      if (mt !== 0) {
        const up = mt > 0;
        events.push({
          i, price: MLVL[i], tone: up ? "bull" : "bear", weight: 2, pane: "ha",
          title: `${NAME_M} CLOSED ${up ? "UP" : "DOWN"}`,
          text: `${hhmm(s, i)} — the 5-minute candle closed ${up ? "UP" : "DOWN"} after ${up ? "a DOWN" : "an UP"} one, a notch on the 5m lane: the middle timeframe turned. Its next flip level, the 5m FLIP rail, is ${fmtC(MLVL[i], tick)}.`,
        });
      }
    }
    events.sort((a, b) => a.i - b.i || (b.weight ?? 0) - (a.weight ?? 0));

    // ---- shared pieces
    /** example hygiene (DEVIATIONS 7): a run is counted from the first shown bar */
    const runShown = (i: number) => (i >= s.replayFrom ? Math.min(RUN[i], i - s.replayFrom + 1) : RUN[i]);
    /** example hygiene (DEVIATIONS 7): the track record counts from the first shown bar */
    const base = (a: Int32Array) => (s.replayFrom > 0 ? a[s.replayFrom - 1] : 0);
    const tierWord = (i: number) => (isNaN(Z[i]) ? "NO ODDS YET" : TIER[i] === TIER_FIRM ? "FIRM" : TIER[i] === TIER_PENDING ? "FLIP PENDING" : "HOLDING");
    const tierTone = (i: number): Tone => (TREND[i] > 0 ? (TIER[i] === TIER_FIRM ? "strongBull" : "bull") : TREND[i] < 0 ? (TIER[i] === TIER_FIRM ? "strongBear" : "bear") : "neutral");
    const tapeColor = (P: Pal, trend: number, tier: number): RGB => (trend > 0 ? (tier === TIER_FIRM ? P.sBull : P.bull) : trend < 0 ? (tier === TIER_FIRM ? P.sBear : P.bear) : P.neutral);
    const stackOf = (i: number) => TREND[i] + MDIR[i] + SDIR[i];
    const stackText = (i: number) => {
      if (MDIR[i] === 0 || SDIR[i] === 0) return "";
      const st = stackOf(i);
      return `${st === 3 || st === -3 ? "3" : "2"} OF 3 ${st > 0 ? "UP" : "DOWN"}`;
    };

    // ---- panel frame: .cs Reserves() on the pane's real height (overrides the engine scale)
    const headPx = (headRow: number) => headRow + HEAD_AIR + RIB_H + LANE_GAP + RIB_H + RIB_GAP;
    const frame = (d: Draw) => {
      const pv = d.pane("ha") as (PaneView & { _ha?: { bodyTop: number; bodyBot: number; headRow: number } }) | undefined;
      if (!pv) return null;
      if (pv._ha) return pv;
      const ph = pv.bottom - pv.top;
      const headRow = Math.max(HEAD_MIN, Math.min(HEAD_MAX, Math.ceil(10.5 * 1.25) + 7));
      const tot = 1.0 + HEAD_T + FOOT_T;
      const fPx = Math.min(FOOT_AIR, (ph * FOOT_T) / tot);
      const hPx = Math.min(headPx(headRow), Math.max((ph * HEAD_T) / tot, ph - fPx - BODY_MIN));
      const body = ph - hPx - fPx;
      let headV = 2 * FRAME * HEAD_T, footV = 2 * FRAME * FOOT_T;
      if (body > 1) { const per = (2 * FRAME) / body; headV = hPx * per; footV = fPx * per; }
      const lo = -FRAME - footV, hi = FRAME + headV, top = pv.top;
      pv.lo = lo; pv.hi = hi;
      pv.y = (v: number) => top + ((hi - v) / (hi - lo)) * ph;
      pv.v = (y: number) => hi - ((y - top) / ph) * (hi - lo);
      pv._ha = { bodyTop: Math.max(pv.top, pv.y(FRAME)), bodyBot: Math.min(pv.bottom, pv.y(-FRAME)), headRow };
      return pv;
    };

    // ---- price pane: rails + marks
    const drawPrice = (d: Draw, P: Pal) => {
      const pv = d.price, k = d.k, ground = A(P.ground, 1);
      // marks (persist; drawn as of k)
      for (const m of marks) {
        if (m.i > k) break;
        if (m.i < d.i0 - 1 || m.i > d.i1 + 1) continue;
        const ax = d.x(m.i), ay = pv.y(m.p);
        if (ay < pv.top - 40 || ay > pv.bottom + 40) continue;
        drawChevronMark(d, ax, ay, m.up, A(m.up ? P.bull : P.bear, 1), ground, "A");
      }
      // rails: the market's levels now — drawn only at the live edge
      if (!d.on("rails") || d.i1 < k || k < 1) return;
      const p0 = TREND[k] !== 0 ? LVL[k] : NaN;
      const p1 = MDIR[k] !== 0 ? MLVL[k] : NaN;
      const p2 = SDIR[k] !== 0 ? SLVL[k] : NaN;
      const ps = [p0, p1, p2], sides = [TREND[k], MDIR[k], SDIR[k]], froms = [k, MFROM[k], SFROM[k]];
      const words = ["FLIP", NAME_M, NAME_S];
      const yPix = (p: number) => {
        if (!isFinite(p)) return NaN;
        const y = pv.y(p);
        if (y < pv.top - 2 || y > pv.bottom + 2) return NaN;
        return Math.floor(y) + 0.5;
      };
      const rows = ps.map(yPix);
      const h2 = 7;
      layoutRows(rows, pv.top + h2 + 1, pv.bottom - h2 - 1);
      const xR = d.plotRight - 2;
      for (let j = 0; j < 3; j++) {
        const p = ps[j];
        const y = yPix(p);
        if (isNaN(y) || froms[j] < 0) continue;
        const hue = A(sides[j] > 0 ? P.bull : sides[j] < 0 ? P.bear : P.neutral, 0.92);
        const x0 = Math.max(0, d.x(froms[j]));
        const word = words[j];
        const tw = d.measure(word, { size: 9, weight: 700 }) + 8;
        const yf = rows[j];
        const lineEnd = isNaN(yf) ? xR : xR - tw - 3;
        if (lineEnd > x0) d.line([[x0, y], [lineEnd, y]], hue, 1, [2, 2]);
        if (!isNaN(yf)) {
          // the flag word (the .cs short label), in the air right of the newest bar
          const top = Math.floor(yf - h2) + 0.5;
          d.rect(xR - tw, top, xR, top + h2 * 2, A(P.ground, 0.88), hue);
          if (Math.abs(yf - y) > 1) d.line([[xR - tw - 3, y], [xR - tw, yf]], hue, 1);
          d.text(word, xR - tw + 4, yf + 0.5, { color: hue, size: 9, weight: 700 });
          d.tag(pv, pv.v(yf), fmtP(p, tick), A(sides[j] > 0 ? P.bull : sides[j] < 0 ? P.bear : P.neutral, 1), P.light ? "#fff" : "#000");
        }
      }
    };

    // ---- the panel
    const drawPanel = (d: Draw, P: Pal) => {
      const pv = frame(d);
      if (!pv || !pv._ha) return;
      const { bodyTop, bodyBot, headRow } = pv._ha;
      const ctx = d.ctx;
      const k = d.k;
      const bFrom = d.i0, bTo = Math.min(d.i1, k);
      if (bTo < bFrom) return;
      const x1 = 2, x2 = d.plotRight - 2;
      const BY = (v: number) => Math.max(bodyTop, Math.min(bodyBot, pv.y(v)));
      const ink = (a: number) => A(P.ink, a);
      const slotW = d.bw;
      const paintW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      ctx.save(); ctx.beginPath(); ctx.rect(0, pv.top, d.plotRight, pv.bottom - pv.top); ctx.clip();

      const lanesOn = bodyTop - pv.top >= headRow + HEAD_AIR + RIB_H + LANE_GAP + RIB_H + RIB_GAP - 0.5;
      const fits = bodyBot - bodyTop >= 24;
      let rulerShort = false;
      if (fits) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, bodyTop - 1, d.plotRight, bodyBot - bodyTop + 2); ctx.clip();
        // tide
        if (d.on("tide")) {
          const hs = Math.max(0.5, slotW * 0.5), y0 = BY(0), rk = Math.sqrt(K_SLOW);
          for (const side of [1, -1]) {
            const hue = side > 0 ? P.bull : P.bear;
            let a0 = -1;
            const flush = (a: number, b: number) => {
              const xs: number[] = [], ys: number[] = [];
              for (let j = a; j <= b; j++) {
                let v = SBODY[j] / (UNIT[j] * rk);
                v = Math.max(-FRAME, Math.min(FRAME, v));
                const y = Math.floor(BY(v)) + 0.5;
                xs.push(d.x(j) - hs, d.x(j) + hs); ys.push(y, y);
              }
              ctx.beginPath(); ctx.moveTo(xs[0], y0);
              for (let q = 0; q < xs.length; q++) ctx.lineTo(xs[q], ys[q]);
              ctx.lineTo(xs[xs.length - 1], y0); ctx.closePath();
              ctx.fillStyle = A(hue, 0.15); ctx.fill();
              ctx.beginPath(); ctx.moveTo(xs[0], y0);
              for (let q = 0; q < xs.length; q++) ctx.lineTo(xs[q], ys[q]);
              ctx.lineTo(xs[xs.length - 1], y0);
              ctx.strokeStyle = A(hue, 0.44); ctx.lineWidth = 1; ctx.stroke();
            };
            for (let j = bFrom; j <= bTo + 1; j++) {
              let inRun = false;
              if (j <= bTo) { const v = SBODY[j] / (UNIT[j] * rk); inRun = isFinite(v) && (side > 0 ? v > 0 : v < 0); }
              if (inRun) { if (a0 < 0) a0 = j; continue; }
              if (a0 >= 0) { flush(a0, j - 1); a0 = -1; }
            }
          }
        }
        // the line at the open
        { const y = Math.floor(BY(0)) + 0.5; d.line([[x1, y], [x2, y]], ink(0.34), 1, [3, 3]); }
        // tape
        const y0 = Math.floor(BY(0)), F = FRAME;
        if (slotW < 3) {
          for (let i = bFrom; i <= bTo; i++) {
            const u = UNIT[i]; if (!(u > 0)) continue;
            let v = (HC[i] - HO[i]) / u; v = Math.max(-F, Math.min(F, v));
            const tr = TREND[i], tier = TIER[i];
            const t = tier + 1;
            const x = Math.floor(d.x(i)), w = Math.max(1, Math.ceil(slotW));
            const strong = t >= 3;
            if (v >= 0) {
              let y = Math.floor(BY(v)), h = y0 - y; if (h < 1) { h = 1; y = y0 - 1; }
              ctx.fillStyle = A(strong ? P.sBull : P.bull, t === 1 ? 0.48 : 0.96); ctx.fillRect(x, y, w, h);
            } else {
              const y = Math.floor(BY(v)); let h = y - y0; if (h < 1) h = 1;
              ctx.fillStyle = A(strong ? P.sBear : P.bear, t === 1 ? 0.48 : 0.96); ctx.fillRect(x, y0, w, h);
            }
            void tr;
          }
        } else {
          const bw = Math.max(1, Math.floor(paintW)), half = bw * 0.5, canHollow = bw >= 3;
          for (let i = bFrom; i <= bTo; i++) {
            const u = UNIT[i]; if (!(u > 0)) continue;
            const v = (HC[i] - HO[i]) / u;
            const tr = TREND[i], tier = TIER[i];
            const xc = d.x(i), xl = Math.floor(xc - half + 0.5), xw = Math.floor(xc);
            const col = tapeColor(P, tr, tier);
            const cut = v > F || v < -F;
            const vb = v > F ? F : v < -F ? -F : v;
            const yb = Math.floor(BY(vb));
            const top = Math.min(yb, y0);
            let hgt = Math.abs(yb - y0); if (hgt < 1) hgt = 1;
            let hi = (HH[i] - HO[i]) / u, lo = (HL[i] - HO[i]) / u;
            if (hi > F) hi = F; if (lo < -F) lo = -F;
            const yh = Math.floor(BY(hi)), yl = Math.floor(BY(lo));
            if (yh < top) { ctx.fillStyle = A(col, v >= 0 ? 0.5 : 0.92); ctx.fillRect(xw, yh, 1, top - yh); }
            if (yl > top + hgt) { ctx.fillStyle = A(col, v >= 0 ? 0.92 : 0.5); ctx.fillRect(xw, top + hgt, 1, yl - (top + hgt)); }
            const notch = cut && hgt >= 8;
            const yn = v > 0 ? top + 3 : top + hgt - 5;
            const hollow = tier === TIER_PENDING && tr !== 0;
            if (hollow && canHollow && hgt >= 3) {
              ctx.fillStyle = A(col, 0.96);
              ctx.fillRect(xl, top, bw, 1); ctx.fillRect(xl, top + hgt - 1, bw, 1);
              if (!notch) { ctx.fillRect(xl, top + 1, 1, hgt - 2); ctx.fillRect(xl + bw - 1, top + 1, 1, hgt - 2); }
              else {
                ctx.fillRect(xl, top + 1, 1, yn - top - 1); ctx.fillRect(xl + bw - 1, top + 1, 1, yn - top - 1);
                ctx.fillRect(xl, yn + 2, 1, top + hgt - 1 - (yn + 2)); ctx.fillRect(xl + bw - 1, yn + 2, 1, top + hgt - 1 - (yn + 2));
              }
            } else {
              ctx.fillStyle = A(col, hollow ? 0.48 : 0.96);
              if (!notch) ctx.fillRect(xl, top, bw, hgt);
              else { ctx.fillRect(xl, top, bw, yn - top); ctx.fillRect(xl, yn + 2, bw, top + hgt - (yn + 2)); }
            }
          }
        }
        ctx.restore();
        // ruler (the next bar's), only at the live edge
        if (bTo === k) rulerShort = !drawRuler(d, P, BY, bodyTop, bodyBot, x2, paintW, k);
      }
      void rulerShort;
      // lanes
      if (lanesOn) {
        const laneM_y = bodyTop - RIB_GAP - RIB_H, laneS_y = laneM_y - LANE_GAP - RIB_H;
        for (const slow of [true, false]) {
          const yT = Math.floor(slow ? laneS_y : laneM_y), h = RIB_H;
          ctx.fillStyle = A(P.neutral, 0.14); ctx.fillRect(x1, yT, x2 - x1, h);
          const dir = slow ? SDIR : MDIR, turn = slow ? STURN : MTURN;
          const cellW = Math.max(slotW, paintW);
          let runSt = 0, runA = 0, runB = 0;
          const flushRun = () => {
            if (runSt !== 0) {
              const ra = Math.max(x1, runA), rb = Math.min(x2, runB);
              if (rb > ra) { ctx.fillStyle = A(runSt > 0 ? P.bull : P.bear, 0.8); ctx.fillRect(ra, yT, rb - ra, h); }
            }
          };
          for (let i = bFrom; i <= bTo; i++) {
            const st = dir[i];
            const xk = d.x(i);
            const xa = i > bFrom ? 0.5 * (d.x(i - 1) + xk) : xk - cellW * 0.5;
            const xb = i < bTo ? 0.5 * (xk + d.x(i + 1)) : xk + cellW * 0.5;
            if (st === runSt && xa <= runB + 0.51) { runB = xb; continue; }
            flushRun();
            runSt = st; runA = xa; runB = xb;
          }
          flushRun();
          // turn notches
          const thin = slotW < 3;
          let lastX = -Infinity;
          for (let i = bFrom; i <= bTo; i++) {
            if (turn[i] === 0) continue;
            const x = Math.floor(d.x(i));
            if (thin) {
              if (x - lastX < 6 || x < x1 || x + 1 > x2) continue;
              ctx.fillStyle = ink(0.6); ctx.fillRect(x, yT, 1, h); lastX = x; continue;
            }
            if (x - 2 < x1 || x + 3 > x2) continue;
            ctx.fillStyle = A(P.ground, 1); ctx.fillRect(x - 2, yT, 5, h);
            ctx.fillStyle = ink(0.96); ctx.fillRect(x - 1, yT, 3, h);
          }
          // the lane's name at its right end
          if (x2 - x1 > 200) {
            const nm = slow ? NAME_S : NAME_M;
            const rune = slow;
            const lw = 8 + d.measure(nm, { size: 8, weight: 600 }) + (rune ? 10 : 0);
            if (!(x2 - lw < d.x(bTo) + cellW)) {
              ctx.fillStyle = A(P.ground, 0.92); ctx.fillRect(x2 - lw, yT - 1, lw, h + 2);
              let lx = x2 - lw + 3;
              if (rune) { d.text("A", lx, yT + h / 2 + 0.5, { color: ink(0.92), size: 8, weight: 700, font: "sans" }); lx += 10; }
              d.text(nm, lx, yT + h / 2 + 0.5, { color: ink(0.62), size: 8, weight: 600 });
            }
          }
        }
      }
      drawHeader(d, P, pv, headRow, x1, x2, bTo, !fits);
      ctx.restore();
    };

    /** RenderRuler of the .cs. Returns false when the margin has no room at all. */
    const drawRuler = (d: Draw, P: Pal, BY: (v: number) => number, bodyTop: number, bodyBot: number, x2: number, paintW: number, b: number): boolean => {
      const level = LVL[b], z = Z[b], unit = UNIT[b], trend = TREND[b];
      if (isNaN(level) || isNaN(z) || !(unit > 0) || trend === 0) return true;
      const ctx = d.ctx, ink = (a: number) => A(P.ink, a);
      const cell = Math.max(d.bw, paintW);
      const xLast = d.x(b) + cell * 0.5;
      const room = x2 - xLast - 4;
      const odds = oddsText(ODDS[b]);
      const tLvl = `FLIP  ${fmtP(level, tick)}`;
      const tOdds = odds ? `${tLvl}  ·  ODDS ${odds}` : tLvl;
      const rowO = { size: 9, weight: 600 } as const, tinyO = { size: 8, weight: 600 } as const;
      const wLvl = 8 + d.measure(tLvl, rowO), wOdds = 8 + d.measure(tOdds, rowO);
      const whole = room >= 250 && room >= 40 + 14 + wLvl + 4;
      const labels = whole || room >= 12 + 14 + wLvl + 4;
      if (!labels && room < 24) return false; // web margin: not even the post fits
      const xs = Math.floor(xLast + (whole ? 40 : 12));
      const F4 = 4;
      const yT = Math.floor(BY(F4)), yB = Math.floor(BY(-F4)), y0 = Math.floor(BY(0));
      if (yB - yT < 30) return true;
      ctx.fillStyle = ink(0.28); ctx.fillRect(xs, yT, 3, yB - yT + 1);
      const zc = trend * z;
      const vz = zc > F4 ? F4 : zc < -F4 ? -F4 : zc;
      const yc = Math.floor(BY(vz));
      const hue = tapeColor(P, trend, TIER[b]);
      const fa = Math.min(yc, y0), fh = Math.abs(yc - y0);
      if (fh >= 1) { ctx.fillStyle = A(hue, 0.85); ctx.fillRect(xs, fa, 3, fh); }
      ctx.fillStyle = A(hue, 1); ctx.fillRect(xs - 4, yc - 1, 11, 3);
      for (let v = -4; v <= 4; v += 2) {
        const y = Math.floor(BY(v));
        ctx.fillStyle = ink(v === 0 ? 0.85 : 0.45); ctx.fillRect(xs + 3, y, v === 0 ? 7 : 4, 1);
      }
      if (!labels) return true;
      if (whole) {
        let ySlowLab = NaN;
        for (let pass = 0; pass < 2; pass++) {
          const lv = pass === 0 ? SLVL[b] : MLVL[b];
          const dr = pass === 0 ? SDIR[b] : MDIR[b];
          if (isNaN(lv) || dr === 0) continue;
          const dv = (lv - level) / unit;
          if (dv > F4 || dv < -F4) continue;
          const y = Math.floor(BY(dv));
          if (pass === 1 && !isNaN(ySlowLab) && Math.abs(y - ySlowLab) < 10) continue;
          const lc = dr > 0 ? P.bull : P.bear;
          ctx.fillStyle = A(lc, 0.95); ctx.fillRect(xs - 6, y, 6, 1);
          const nm = pass === 0 ? NAME_S : NAME_M;
          let ty = y - 6;
          if (ty < bodyTop) ty = bodyTop; if (ty + 12 > bodyBot) ty = bodyBot - 12;
          d.text(nm, xs - 8, ty + 6, { ...tinyO, color: A(lc, 0.95), align: "right" });
          if (pass === 0) ySlowLab = y;
        }
      }
      const xt = xs + 14;
      if (whole) {
        const cpx = level + zc * unit;
        const tc = `CLOSE  ${fmtP(cpx, tick)}${odds ? `  ·  ODDS ${odds}` : ""}`;
        const wc = 8 + d.measure(tc, rowO);
        let t0 = tLvl, w0 = wLvl;
        const xc = xt + w0 + 12;
        const two = xc + wc <= x2;
        if (!two && xt + wOdds <= x2) { t0 = tOdds; w0 = wOdds; }
        if (two) { ctx.fillStyle = A(hue, 0.5); ctx.fillRect(xs + 7, yc, xc - 2 - (xs + 7), 1); }
        const everyTick = yB - yT >= 4 * 13;
        for (let v = -4; v <= 4; v += 2) {
          if (v === 0 || (!everyTick && v !== -4 && v !== 4)) continue;
          const y = Math.floor(BY(v));
          const t = fmtP(level + v * unit, tick);
          const tw = 8 + d.measure(t, tinyO);
          ctx.fillStyle = A(P.ground, 0.86); ctx.fillRect(xt - 2, y - 6, tw, 12);
          d.text(t, xt, y, { ...tinyO, color: ink(0.58) });
        }
        ctx.fillStyle = A(P.ground, 0.86); ctx.fillRect(xt - 2, y0 - 7, w0, 14);
        d.text(t0, xt + 1, y0, { ...rowO, color: ink(0.96) });
        if (two) {
          let ty = yc - 7;
          if (ty < bodyTop) ty = bodyTop; if (ty + 14 > bodyBot) ty = bodyBot - 14;
          ctx.fillStyle = A(P.ground, 0.86); ctx.fillRect(xc - 2, ty, wc, 14);
          ctx.fillStyle = A(hue, 0.95); ctx.fillRect(xc - 2, ty, 2, 14);
          d.text(tc, xc + 4, ty + 7, { ...rowO, color: A(hue, 0.96) });
        }
      } else {
        const full = xt + wOdds <= x2;
        const t0 = full ? tOdds : tLvl, w0 = full ? wOdds : wLvl;
        ctx.fillStyle = A(P.ground, 0.86); ctx.fillRect(xt - 2, y0 - 7, w0, 14);
        d.text(t0, xt + 1, y0, { ...rowO, color: ink(0.96) });
      }
      return true;
    };

    /** RenderHeader of the .cs: readout at the right, chips leftward. */
    const drawHeader = (d: Draw, P: Pal, pv: PaneView, headRow: number, x1: number, x2: number, b: number, tooShort: boolean) => {
      if (d.plotRight < 200) return;
      const ctx = d.ctx, ink = (a: number) => A(P.ink, a), k = d.k;
      const headH = Math.min(headRow, Math.max(1, pv.bottom - pv.top - 1));
      const chipY = pv.top + Math.floor(Math.max(0, headH - HEAD_MIN) * 0.5);
      const xChips = x1 + 14 + d.measure("DS ProHeikinAshi", { size: 10.5 }) + 10;
      const trend = TREND[b], have = trend !== 0, bull = trend > 0;
      const hue = tapeColor(P, trend, TIER[b]);
      const pxS = fmtP(LVL[b], tick);
      const rowO = { size: 9, weight: 600 } as const;
      const cw = d.measure("0", rowO);
      let right = x2 - 2, stop = false;
      const chip = (txt: string, col: string, minChars: number) => {
        if (stop) return;
        let w = 9 + Math.max(d.measure(txt, rowO), minChars * cw);
        if (right - w < xChips) w = 9 + d.measure(txt, rowO);
        if (right - w < xChips) { stop = true; return; }
        const hh = Math.max(1, Math.min(14, headH - 1));
        ctx.fillStyle = A(P.ground, 0.78); ctx.fillRect(right - w, chipY + 1, w, hh);
        ctx.fillStyle = d.alpha(col, 0.9); ctx.fillRect(right - w, chipY + 1, 2, hh);
        d.text(txt, right - w + 5, chipY + 1 + hh / 2 + 0.5, { ...rowO, color: col });
        right -= w + 6;
      };
      // readout
      {
        let txt: string, col: string;
        if (!have) { txt = "WAITING FOR THE FIRST CANDLE"; col = ink(0.95); }
        else { txt = `${bull ? `UP ${UPA}` : `DOWN ${DNA}`}${DOT}${barsWord(runShown(b))}${DOT}${tierWord(b)}`; col = A(hue, 0.95); }
        const ro = { size: 10.5, weight: 700 } as const;
        let rw = 8 + d.measure(txt, ro);
        if (right - rw < xChips) { const cut = txt.indexOf(DOT); if (cut > 0) { txt = txt.slice(0, cut); rw = 8 + d.measure(txt, ro); } }
        if (right - rw >= xChips) {
          ctx.fillStyle = A(P.ground, 0.78); ctx.fillRect(right - rw, pv.top + 0.5, rw, headH);
          d.text(txt, right - rw + 4, chipY + 1.5 + HEAD_MIN / 2, { ...ro, color: col });
          right -= rw + 6;
        }
      }
      if (b < k) {
        const w = wall(s, b);
        const mon = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][w.getUTCMonth()];
        const hr = w.getUTCHours(), mi = w.getUTCMinutes();
        chip(`AS OF  ${mon} ${w.getUTCDate()}  ${((hr + 11) % 12) + 1}:${String(mi).padStart(2, "0")} ${hr < 12 ? "AM" : "PM"}`, ink(1), 0);
      }
      if (tooShort) chip("PANEL TOO SHORT", ink(1), 0);
      stop = false;
      if (have) {
        if (!isNaN(LVL[b])) {
          const od = oddsText(ODDS[b]);
          chip(`FLIP ${pxS}${od ? `  ·  ODDS ${od}` : ""}`, A(hue, 0.92), 5 + pxS.length + 13);
        }
        if (!isNaN(Z[b])) chip(`CUSHION ${Z[b].toFixed(1)}u`, ink(0.8), 13);
        if (SDIR[b] !== 0) chip(`${NAME_S} ${SDIR[b] > 0 ? UPA : DNA}`, A(SDIR[b] > 0 ? P.bull : P.bear, 0.92), NAME_S.length + 2);
        if (MDIR[b] !== 0) chip(`${NAME_M} ${MDIR[b] > 0 ? UPA : DNA}`, A(MDIR[b] > 0 ? P.bull : P.bear, 0.92), NAME_M.length + 2);
        const stx = stackText(b);
        if (stx) chip(stx, ink(0.8), 11);
        // FLIP RATE: the record to date (as of the replay cursor, wherever scrolled),
        // counted from the first shown bar (example hygiene, DEVIATIONS 7)
        const cnt = (q: number) => TRC[q][k] - base(TRC[q]), hit = (q: number) => TRH[q][k] - base(TRH[q]);
        let t = "";
        if (cnt(0) >= 60) t += `  PENDING ${pct(hit(0), cnt(0))}`;
        if (cnt(1) >= 60) t += `  HOLDING ${pct(hit(1), cnt(1))}`;
        if (cnt(2) >= 60) t += `  FIRM ${pct(hit(2), cnt(2))}`;
        if (t) chip(`FLIP RATE${t}`, ink(0.8), 0);
        stop = false;
        const hN = cnt(1), fN = cnt(2);
        if (hN >= 200 && fN >= 200 && hit(2) / fN > (0.5 * hit(1)) / hN) chip("CUSHION SAYS LITTLE ON THIS CHART", ink(1), 0);
      }
    };

    return {
      events,
      priceExtent: (_i0, i1, k) => {
        if (i1 < k) return null;
        const v = [TREND[k] !== 0 ? LVL[k] : NaN, MDIR[k] !== 0 ? MLVL[k] : NaN, SDIR[k] !== 0 ? SLVL[k] : NaN].filter((x) => isFinite(x));
        if (!v.length) return null;
        // only levels within reach of price (a far rail must not flatten the candles)
        const c = s.c[k], reach = 60;
        const near = v.filter((x) => Math.abs(x - c) <= reach);
        return near.length ? [Math.min(...near), Math.max(...near)] : null;
      },
      paneExtent: () => [-FRAME, FRAME],
      under: (d) => { frame(d); },
      draw: (d) => {
        const P = palette(d.th.bg);
        drawPrice(d, P);
        drawPanel(d, P);
      },
      status: (k) => {
        const out: ReadItem[] = [];
        if (TREND[k] === 0) return [{ label: "Candle", value: "WAITING FOR THE FIRST CANDLE" }];
        out.push({ label: "Candle", value: `${TREND[k] > 0 ? `UP ${UPA}` : `DOWN ${DNA}`} · ${barsWord(runShown(k))}`, tone: TREND[k] > 0 ? "bull" : "bear" });
        out.push({ label: "Tier", value: tierWord(k), tone: tierTone(k) });
        const od = oddsText(ODDS[k]);
        out.push({ label: "Flip", value: `${fmtP(LVL[k], tick)}${od ? ` · odds ${od}` : ""}`, tone: TREND[k] > 0 ? "bull" : "bear" });
        if (!isNaN(Z[k])) out.push({ label: "Cushion", value: `${Z[k].toFixed(1)}u` });
        out.push({ label: `${NAME_M} / ${NAME_S}`, value: `${MDIR[k] > 0 ? UPA : MDIR[k] < 0 ? DNA : "–"} / ${SDIR[k] > 0 ? UPA : SDIR[k] < 0 ? DNA : "–"}${stackText(k) ? ` · ${stackText(k)}` : ""}` });
        return out;
      },
      readout: (i) => {
        const r: ReadItem[] = [
          { label: "HA open", value: fmtP(HO[i], tick) },
          { label: "HA close", value: fmtP(HC[i], tick) },
          { label: "Candle", value: TREND[i] === 0 ? "—" : `${TREND[i] > 0 ? "UP" : "DOWN"} · ${barsWord(runShown(i))}${FLIP[i] ? " · flipped" : ""}`, tone: TREND[i] > 0 ? "bull" : TREND[i] < 0 ? "bear" : "neutral" },
          { label: "Tier", value: tierWord(i), tone: tierTone(i) },
          { label: "Flip level", value: `${fmtP(LVL[i], tick)}${oddsText(ODDS[i]) ? ` · odds ${oddsText(ODDS[i])}` : ""}` },
        ];
        if (!isNaN(Z[i])) r.push({ label: "Cushion", value: `${Z[i].toFixed(1)}u · unit ${UNIT[i].toFixed(2)}` });
        r.push({ label: `${NAME_M} / ${NAME_S}`, value: `${MDIR[i] > 0 ? "UP" : MDIR[i] < 0 ? "DOWN" : "–"}${MTURN[i] ? " (turned)" : ""} / ${SDIR[i] > 0 ? "UP" : SDIR[i] < 0 ? "DOWN" : "–"}${STURN[i] ? " (turned)" : ""}` });
        return r;
      },
      legend: [
        { label: "UP · HOLDING", color: "#009999", shape: "box" },
        { label: "UP · FIRM", color: "#00FFFF", shape: "box" },
        { label: "DOWN · HOLDING", color: "#A33DFF", shape: "box" },
        { label: "DOWN · FIRM", color: "#FF00FF", shape: "box" },
        { label: "FLIP PENDING (hollow)", color: "#7C848D", shape: "box" },
        { label: "Flip rails (FLIP · 5m · 15m)", color: "#009999", shape: "dash" },
        { label: "15m turn mark (A)", color: "#009999", shape: "dot" },
      ],
    };
  },
};
