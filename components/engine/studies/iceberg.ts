import type { Draw, ReadItem, Session, StudyDef, StudyEvent, Theme, Tone } from "../types";
import { ATR, MAX, MIN, SMA, hhmm } from "../ta";

/**
 * DS Iceberg — web edition. Source: DSIceberg.cs (Build 2026-10-01), shipped
 * defaults from ApplyDefaults(). Calculate.OnBarClose: every decision is taken
 * on a closed bar and stamped with it.
 *
 * PORTED (line for line where it decides anything)
 *  · Bar engine (DetectPrimary): ATR(14), SMA(volume, 20), MAX(high, 5) /
 *    MIN(low, 5). A test candle has a rejecting wick > 0.75 × max(body, tick),
 *    its extreme in the outer quarter of the trailing 5-bar range, and volume
 *    >= 1.00 × average; both sides valid -> the longer wick decides. Every test
 *    joins a 40-bar test list. A test within 0.50 ATR of a live level of its
 *    side attaches to it (first match in list order) as a re-test. Otherwise,
 *    with >= 2 same-side tests clustered within 0.50 ATR of it, >= 50 % of them
 *    closed rejected, and the order-flow check passing, a level is born at the
 *    average test price, drawn back to its first test.
 *  · Order-flow engine (AccumulateFlow / OnMarketData / ComputeAbsorption):
 *    the tool's default footprint source is a 1-Minute series: each minute's
 *    volume is signed by the tick rule on its close and spread evenly over its
 *    high-low ticks (all at the close when the span is 1 tick or > 64 ticks).
 *    That is rebuilt here from the same 1-minute bars, exactly. The live
 *    bid/ask the tool records in OnMarketData comes from the session's real
 *    footprint (ask-aggressor = cell[2], bid-aggressor = cell[3]). A level is a
 *    node when its band average (±round(0.10 ATR) ticks) is >= mean + 1.50 sd
 *    of the footprint's non-empty prices AND its volume >= 0.35 × the heaviest
 *    price; its side reading uses the bid/ask split when that covers >= half
 *    the level's volume, else the tick-rule split; >= 0.55 on the correct side
 *    passes. No footprint volume in the band -> the bar engine alone decides
 *    (the documented fallback) and the level stays teal / violet. A node found
 *    at birth or at any later re-test makes it order-flow confirmed
 *    (cyan / magenta), permanently.
 *  · Rescore (strength / confidence), the 12-level cap that drops the weakest
 *    by strength, BREAK on a close >= 0.50 ATR through the level, the broken
 *    archive (8 kept, 150-bar fade, BROKEN caption for 10 bars), TESTING for
 *    6 bars after a test, the 24-mark fracture record.
 *  · Render: tolerance band (0.10 ATR capped at 6 ticks, 18 % × 0.40 wash),
 *    level line (52 % × 0.80 / 1.35 / 1.55 by tier, 1 / 1 / 2 px) with its
 *    birth post, fractures (length 6 + 1.5 × vol ratio, split when >= 2.5,
 *    bright when rejected, strong + ringed while TESTING), the keel iceberg
 *    emblem (size from absorbed tests, banded mass, snow cap), captions
 *    "ICE OFFER 30069.75 TESTING 4× 2.31K" with the tool's drop order,
 *    collision claims and far-side-first placement, the distance fade
 *    (6 ATR reach, 10 % floor), DsSignature colours, LineInk / Fit / Solve
 *    contrast maths for the light chart.
 *
 * DEVIATIONS
 *  1. Runway space. NinjaTrader's runway is 240 px of empty right margin;
 *     DS Replay keeps only 5 bars of air. The emblem shrinks to that air
 *     (compact waterline under 9 px, hidden under 12 px, as in the tool).
 *     A caption is first placed the tool's way, right of the emblem, keeping
 *     its name, price and state word. If it cannot fit there, it goes to the
 *     nearest spot clear of candles, fractures and other captions: slid left
 *     along its own level line, or lifted just past the candles beside the
 *     emblem. Only then does it drop tokens in the tool's order. The last
 *     resort is a right-aligned caption on the tool's pool backdrop.
 *  2. Bid/ask keying. Live, OnMarketData files a bar's trades under the last
 *     CLOSED bar (CurrentBar under OnBarClose), the 1-minute footprint bar
 *     under its own index after the primary bar is processed; both are
 *     reproduced (bar j's bid/ask in slice j-1; bar k's own minute not yet in
 *     the footprint when bar k is judged). Bars the tick database does not
 *     cover (most history, part of some replay days) carry no bid/ask, so the
 *     side reading falls back to the tick rule there — exactly what the tool
 *     does after a reload without Tick Replay.
 *  3. Warm-up. The run starts at the first bar of the file (about three prior
 *     sessions); a NinjaTrader chart with more days loaded may carry older
 *     levels into the first session.
 *  4. Captions use the site's type at the tool's 9 / 8 px sizes rather than
 *     Segoe UI; chart-background-image legibility reads the flat ground only
 *     (DS Replay has no background picture).
 *  5. Events: births (ICE BID / ICE OFFER), the start of each TESTING window
 *     and BROKEN. A re-test inside an open TESTING window only updates the
 *     count and fractures (not narrated); a level dropped at the 12-level cap
 *     disappears silently, as in the tool (it has no word for it).
 *  6. The "Engine source" layer (off by default) is a web-only explainer: it
 *     appends BAR + FLOW / BAR ONLY to a caption to say which engine
 *     confirmed the level. The tool has no such caption token; it shows the
 *     same fact only by colour (cyan / magenta vs teal / violet).
 *  7. Example hygiene (web showcase). A level whose first test lies before
 *     s.replayFrom (the hidden warm-up) is not drawn, narrated as an event,
 *     counted in the status (live levels, nearest, last break) or used to
 *     stretch the price scale. The calculation is identical: it stays in the
 *     active list, keeps its place under the 12-level cap and in the attach
 *     order, and breaks into the archive exactly as in NinjaTrader — only its
 *     display is withheld.
 */

// ---------------------------------------------------------------- shipped defaults
const MIN_TESTS = 2, WINDOW = 40, REJ_PCT = 50, TOL_ATR = 0.5, VOL_MULT = 1.0, WICK_BODY = 0.75;
const PIVOT = 5, ATR_LEN = 14, VOL_LEN = 20;
const ABS_Z = 1.5, PEAK_FRAC = 0.35, IMBAL = 0.55, FP_LOOK = 600;
const ZONE_PAD = 0.1, MAX_BAND_TICKS = 6, FILL_OP = 18, LINE_OP = 52, MAX_CONC = 12;
const FADE_REACH = 6.0, FADE_FLOOR = 10, RUNWAY = 240, BREAK_ATR = 0.5, BROKEN_STALE = 150, MAX_BROKEN = 8;
const TEST_PULSE = 6, BROKEN_LABEL = 10, MARK_CAP = 24, FAINT_BELOW = 0.4, CRACK_GAP = 3.5, CAP_GAP = 8, MUTED_K = 0.62;
const CAPTION = 9;
const WARM = Math.max(ATR_LEN, Math.max(VOL_LEN, PIVOT)) + 2;

const BERG_TIP = 0.56, BERG_UNDER = 1.11;
const BTX = [0.0, 0.09, 0.2, 0.24, 0.35, 0.5, 0.73, 0.78, 0.9, 1.0];
const BTY = [0.0, 0.1, 0.27, 0.31, 0.35, 0.56, 0.27, 0.25, 0.19, 0.0];
const BLX = [0.0, 0.09, 0.2, 0.24, 0.35, 0.5, 0.53, 0.37, 0.57, 0.76];
const BLY = [0.0, 0.1, 0.27, 0.31, 0.35, 0.56, 0.27, 0.08, 0.18, 0.0];
const BUX = [0.0, 0.13, 0.16, 0.21, 0.3, 0.41, 0.476, 0.485, 0.55, 0.573, 0.65, 0.68, 0.745, 0.786, 0.85, 0.93, 1.0];
const BUY = [0.0, 0.27, 0.42, 0.62, 0.655, 0.95, 1.11, 1.1, 0.93, 0.86, 0.95, 0.84, 0.62, 0.46, 0.42, 0.23, 0.0];
const CRACK_W = [1.8, 1.6, 1.3, 1.0];

// ---------------------------------------------------------------- helpers
const clamp = (v: number, lo: number, hi: number) => (v !== v ? lo : v < lo ? lo : v > hi ? hi : v);
const clamp01 = (v: number) => clamp(v, 0, 1);
/** .NET Math.Round (banker's rounding) */
function roundEven(x: number) {
  const r = Math.round(x);
  if (Math.abs(x % 1) === 0.5 && r % 2 !== 0) return r - 1;
  return r;
}
function fmt2(x: number) {
  const r = Math.round(x * 100) / 100;
  return String(r);
}
/** FormatVol */
function formatVol(v: number) {
  if (v <= 0) return "0";
  if (v >= 1e9) return fmt2(v / 1e9) + "B";
  if (v >= 1e6) return fmt2(v / 1e6) + "M";
  if (v >= 1e3) return fmt2(v / 1e3) + "K";
  return String(Math.round(v));
}

type RGB = [number, number, number];
const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const css = (c: RGB, a: number) => `rgba(${Math.round(clamp01(c[0]) * 255)},${Math.round(clamp01(c[1]) * 255)},${Math.round(clamp01(c[2]) * 255)},${clamp01(a)})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// DsLegibility (flat ground)
const lin1 = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const relLum = (r: number, g: number, b: number) => 0.2126 * lin1(r) + 0.7152 * lin1(g) + 0.0722 * lin1(b);
const lumToSrgb = (l: number) => (l <= 0 ? 0 : l >= 1 ? 1 : l <= 0.0030402 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055);
function fitOk(c: RGB, t: number, an: number, v: number, lb: number, labA: number, target: number) {
  const cr = c[0] + (an - c[0]) * t, cg = c[1] + (an - c[1]) * t, cb = c[2] + (an - c[2]) * t;
  const lt = relLum(v + (cr - v) * labA, v + (cg - v) * labA, v + (cb - v) * labA);
  return (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05) >= target;
}
function fit(c: RGB, worstLum: number, labA: number, darkInk: boolean, target: number): RGB {
  const v = lumToSrgb(worstLum), lb = relLum(v, v, v), an = darkInk ? 0 : 1;
  if (fitOk(c, 0, an, v, lb, labA, target)) return c;
  let lo = 0, hi = 0.55;
  if (fitOk(c, hi, an, v, lb, labA, target))
    for (let it = 0; it < 8; it++) { const m = 0.5 * (lo + hi); if (fitOk(c, m, an, v, lb, labA, target)) hi = m; else lo = m; }
  return [c[0] + (an - c[0]) * hi, c[1] + (an - c[1]) * hi, c[2] + (an - c[2]) * hi];
}
function glassOk(a: number, worstLum: number, glass: RGB, labA: number, inks: RGB[], targets: number[]) {
  const v = lumToSrgb(worstLum);
  const r = v + (glass[0] - v) * a, g = v + (glass[1] - v) * a, b = v + (glass[2] - v) * a;
  const lb = relLum(r, g, b);
  for (let i = 0; i < inks.length; i++) {
    const c = inks[i];
    const lt = relLum(r + (c[0] - r) * labA, g + (c[1] - g) * labA, b + (c[2] - b) * labA);
    if ((Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05) < targets[i]) return false;
  }
  return true;
}
function solve(worstLum: number, glass: RGB, labA: number, inks: RGB[], targets: number[], floor: number, max: number) {
  if (floor >= max) return max;
  if (glassOk(floor, worstLum, glass, labA, inks, targets)) return floor;
  if (!glassOk(max, worstLum, glass, labA, inks, targets)) return max;
  let lo = floor, hi = max;
  for (let it = 0; it < 9; it++) { const m = 0.5 * (lo + hi); if (glassOk(m, worstLum, glass, labA, inks, targets)) hi = m; else lo = m; }
  return hi;
}
const POOL_DARK: RGB = [0.03, 0.035, 0.05], POOL_LIGHT: RGB = [0.97, 0.975, 0.985], SLATE: RGB = [0.086, 0.125, 0.18];
const TEXT_C: RGB = [0xe6 / 255, 0xea / 255, 0xf2 / 255], WHITE: RGB = [1, 1, 1];

type Pal = { light: boolean; lum: number; sup: RGB; res: RGB; sSup: RGB; sRes: RGB; brk: RGB };
const palCache = new Map<string, Pal>();
function palette(th: Theme): Pal {
  const hit = palCache.get(th.bg);
  if (hit) return hit;
  const g = hex(th.bg);
  const lum = relLum(g[0], g[1], g[2]);
  const light = lum > 0.179; // GlobalLight
  const ink = (c: RGB) => (light ? fit(c, lum, 1, true, 3.0) : c); // LineInk
  const p: Pal = { light, lum, sup: ink(hex("#009999")), res: ink(hex("#A33DFF")), sSup: ink(hex("#00FFFF")), sRes: ink(hex("#FF00FF")), brk: ink(hex("#7E7E88")) };
  palCache.set(th.bg, p);
  return p;
}

// ---------------------------------------------------------------- engine records
type Mark = { bar: number; volR: number; rej: boolean };
type Snap = {
  bar: number; tests: number; volSum: number; rejected: number; vb: boolean;
  absVol: number; absBuy: number; z: number; dom: number; strength: number; conf: number; lastTest: number;
};
type Ice = {
  id: number; firstBar: number; born: number; level: number; isRes: boolean;
  marks0: Mark[]; marks: Mark[]; snaps: Snap[];
  died: number; dropped: number; archEnd: number;
  createdByFlow: boolean;
};
type TestEv = { bar: number; price: number; isRes: boolean; rej: boolean; volR: number; wick: number };
type BarInfo = { test: 0 | 1 | -1; rej: boolean; up: number; dn: number; body: number; volR: number };

type AbsRes = { avail: boolean; node: boolean; imbOK: boolean; levelVol: number; dom: number; buy: number; z: number };

function snapAt(ic: Ice, k: number): Snap {
  const a = ic.snaps;
  let lo = 0, hi = a.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m].bar <= k) lo = m; else hi = m - 1; }
  return a[lo];
}
function marksAt(ic: Ice, k: number): Mark[] {
  let n = ic.marks.length;
  while (n > 0 && ic.marks[n - 1].bar > k) n--;
  const all = n === ic.marks.length ? ic.marks : ic.marks.slice(0, n);
  return all.length > MARK_CAP ? all.slice(all.length - MARK_CAP) : all;
}

function commas(p: number) { return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// ---------------------------------------------------------------- the study
export const study: StudyDef = {
  slug: "iceberg", rightMargin: 240,
  name: "DS Iceberg",
  about: "Prices tested and rejected again and again on closed bars, checked against a 1-minute volume-at-price footprint — each drawn as a level with a fracture at every test and an iceberg in the runway.",
  needs: { flow: true },
  layers: [
    { id: "band", label: "Runway zones", on: true, hint: "The tolerance band either side of each level, from its first test to the runway (the tool's Show tolerance band, on by default)." },
    { id: "marks", label: "Fracture marks", on: true, hint: "A crack on every bar that tested a level: longer for a heavier test bar, bright when the bar closed rejected (the tool's Show test marks)." },
    { id: "source", label: "Engine source", on: false, hint: "Adds which engine confirmed each level to its caption: BAR + FLOW (the footprint found a heavy node — the cyan / magenta levels) or BAR ONLY (the bar engine alone — teal / violet)." },
  ],
  run(s: Session) {
    const n = s.n, tick = s.tick;
    const atr = ATR(s, ATR_LEN), volS = SMA(s.v, VOL_LEN), rHi = MAX(s.h, PIVOT), rLo = MIN(s.l, PIVOT);
    const key = (p: number) => roundEven(p / tick);

    // ---- 1-minute footprint series (AccumulateFlow), signed by the tick rule
    const fLo = new Int32Array(n), fHi = new Int32Array(n), fPer = new Float64Array(n), fBuy = new Uint8Array(n);
    let minK = Infinity, maxK = -Infinity;
    {
      let lastSub = NaN, lastSign = 0;
      for (let i = 0; i < n; i++) {
        const vol = s.v[i];
        if (!(vol > 0)) continue;
        const c = s.c[i];
        let sign: number;
        if (Number.isNaN(lastSub) || c === lastSub) sign = lastSign === 0 ? 1 : lastSign;
        else if (c > lastSub) sign = 1;
        else sign = -1;
        lastSub = c; lastSign = sign;
        const kLo = key(s.l[i]), kHi = key(s.h[i]), span = kHi - kLo + 1;
        if (span <= 1 || span > 64) { fLo[i] = fHi[i] = key(c); fPer[i] = vol; }
        else { fLo[i] = kLo; fHi[i] = kHi; fPer[i] = vol / span; }
        fBuy[i] = sign > 0 ? 1 : 0;
        if (fLo[i] < minK) minK = fLo[i];
        if (fHi[i] > maxK) maxK = fHi[i];
      }
      for (let i = 0; i < n; i++) {
        const len = s.fp.ask[i]?.length ?? 0;
        if (!len) continue;
        if (s.fp.lo[i] < minK) minK = s.fp.lo[i];
        if (s.fp.lo[i] + len - 1 > maxK) maxK = s.fp.lo[i] + len - 1;
      }
      if (!isFinite(minK)) { minK = 0; maxK = 0; }
    }
    const G = maxK - minK + 1;
    const g0 = new Float64Array(G), g1 = new Float64Array(G), g2 = new Float64Array(G), g3 = new Float64Array(G);

    /** ComputeAbsorption over primary slices b0..b1, judged on the close of bar b1 */
    const absorption = (level: number, isRes: boolean, b0: number, b1: number, halfBand: number): AbsRes => {
      const r: AbsRes = { avail: false, node: false, imbOK: false, levelVol: 0, dom: 0, buy: 0.5, z: 0 };
      const keyL = key(level);
      const bandTicks = Math.max(1, roundEven(halfBand / tick));
      let lo = Infinity, hi = -Infinity;
      // slices b0..b1 hold the 1-minute bars b0..b1-1 (bar b1's own minute is filed after it is judged)
      for (let j = Math.max(0, b0); j <= b1 - 1; j++) {
        const per = fPer[j];
        if (!(per > 0)) continue;
        const arr = fBuy[j] ? g0 : g1;
        for (let q = fLo[j]; q <= fHi[j]; q++) arr[q - minK] += per;
        if (fLo[j] < lo) lo = fLo[j];
        if (fHi[j] > hi) hi = fHi[j];
      }
      // ... and the live bid/ask of bars b0+1..b1 (OnMarketData files them under the last closed bar)
      for (let m = Math.max(1, b0 + 1); m <= b1; m++) {
        const ask = s.fp.ask[m], bid = s.fp.bid[m];
        if (!ask || !ask.length) continue;
        const base = s.fp.lo[m] - minK;
        for (let j = 0; j < ask.length; j++) { g2[base + j] += ask[j]; g3[base + j] += bid[j]; }
        if (s.fp.lo[m] < lo) lo = s.fp.lo[m];
        if (s.fp.lo[m] + ask.length - 1 > hi) hi = s.fp.lo[m] + ask.length - 1;
      }
      if (!isFinite(lo)) return r;
      let sum = 0, sumSq = 0, maxBin = 0, cnt = 0, lBuy = 0, lSell = 0, lAsk = 0, lBid = 0;
      for (let q = lo; q <= hi; q++) {
        const ix = q - minK;
        const v = g0[ix] + g1[ix];
        if (v > 0) { sum += v; sumSq += v * v; cnt++; if (v > maxBin) maxBin = v; }
        if (Math.abs(q - keyL) <= bandTicks) { lBuy += g0[ix]; lSell += g1[ix]; lAsk += g2[ix]; lBid += g3[ix]; }
        g0[ix] = g1[ix] = g2[ix] = g3[ix] = 0;
      }
      const levelVol = lBuy + lSell;
      if (cnt === 0 || levelVol <= 0) return r;
      const mean = sum / cnt;
      const sd = Math.sqrt(Math.max(0, sumSq / cnt - mean * mean));
      const levelAvg = levelVol / (2 * bandTicks + 1);
      r.avail = true;
      r.levelVol = levelVol;
      r.z = sd > 0 ? (levelAvg - mean) / sd : levelAvg > mean ? 4.0 : 0.0;
      r.node = (sd > 0 ? levelAvg >= mean + ABS_Z * sd : levelAvg > mean) && levelVol >= PEAK_FRAC * maxBin;
      let buyPart: number, tot: number;
      if (lAsk + lBid >= 0.5 * levelVol) { buyPart = lAsk; tot = lAsk + lBid; } else { buyPart = lBuy; tot = levelVol; }
      const buyRatio = tot > 0 ? buyPart / tot : 0.5;
      r.buy = buyRatio;
      r.dom = isRes ? buyRatio : 1 - buyRatio;
      r.imbOK = r.dom >= IMBAL;
      return r;
    };

    const rescore = (t: { tests: number; volSum: number; rejected: number; z: number; dom: number }) => {
      const testF = clamp(t.tests / 6.0, 0, 1);
      const avgV = t.tests > 0 ? t.volSum / t.tests : 0;
      const volF = clamp((avgV - 1.0) / 4.0, 0, 1);
      const rejF = t.tests > 0 ? t.rejected / t.tests : 0;
      const absF = clamp(t.z / 4.0, 0, 1);
      const deltF = clamp((t.dom - 0.5) / 0.4, 0, 1);
      const strength = clamp(0.3 * testF + 0.24 * volF + 0.2 * rejF + 0.16 * absF + 0.1 * deltF, 0, 1);
      const maturity = clamp(t.tests / 3.0, 0, 1);
      const raw = 0.45 + 0.55 * (0.5 * rejF + 0.3 * absF + 0.2 * deltF);
      const conf = clamp(0.45 + maturity * (raw - 0.45), 0, 1);
      return { strength, conf };
    };

    const all: Ice[] = [];
    // Example hygiene (DEVIATION 7, display only): a level whose first test lies before the
    // first replayed bar (the hidden warm-up) is not drawn, narrated or counted. The
    // calculation is untouched — it stays in the active list, the 12-level cap, the attach
    // order and the archive exactly as in NinjaTrader.
    const onStage = (ic: Ice) => ic.firstBar >= (s.replayFrom ?? 0);
    const owner = new Map<StudyEvent, Ice>();
    const active: Ice[] = [];
    const archive: Ice[] = [];
    const tests: TestEv[] = [];
    const info: (BarInfo | null)[] = new Array(n).fill(null);
    const events: StudyEvent[] = [];
    let nextId = 1;
    const side = (r: boolean) => (r ? "ICE OFFER" : "ICE BID");
    const tone = (ic: Ice, vb: boolean): Tone => (ic.isRes ? (vb ? "strongBear" : "bear") : vb ? "strongBull" : "bull");
    const cur = new Map<number, Snap>();

    for (let i = 0; i < n; i++) {
      if (i < WARM) continue;
      const atrV = atr[i], volAvg = volS[i];
      const t = hhmm(s, i);
      // ---------------- DetectPrimary
      if (atrV > 0 && volAvg > 0) {
        const o = s.o[i], h = s.h[i], l = s.l[i], c = s.c[i];
        const body = Math.abs(c - o);
        const upWick = h - Math.max(c, o), dnWick = Math.min(c, o) - l;
        const band = rHi[i] - rLo[i];
        const nearHi = rHi[i] - band * 0.25, nearLo = rLo[i] + band * 0.25;
        const bodySafe = Math.max(body, tick);
        const upValid = upWick > bodySafe * WICK_BODY && h >= nearHi;
        const dnValid = dnWick > bodySafe * WICK_BODY && l <= nearLo;
        const volRatio = volAvg > 0 ? s.v[i] / volAvg : 0;
        const volAbsorb = volRatio >= VOL_MULT;
        const upRej = c <= o, dnRej = c >= o;
        let isRes = upValid && volAbsorb, isSup = dnValid && volAbsorb;
        if (isRes && isSup) { const domUp = upWick >= dnWick; isRes = domUp; isSup = !domUp; }
        info[i] = { test: isRes ? 1 : isSup ? -1 : 0, rej: isRes ? upRej : isSup ? dnRej : false, up: upWick, dn: dnWick, body, volR: volRatio };

        if (isRes || isSup) {
          const testLevel = isRes ? h : l;
          const halfBand = atrV * ZONE_PAD;
          const tol = atrV * TOL_ATR;
          const rejected = isRes ? upRej : dnRej;
          tests.push({ bar: i, price: testLevel, isRes, rej: rejected, volR: volRatio, wick: isRes ? upWick : dnWick });
          while (tests.length > 0 && i - tests[0].bar > WINDOW) tests.shift();

          let attached = false;
          for (const ic of active) {
            if (ic.isRes !== isRes) continue;
            if (Math.abs(ic.level - testLevel) > tol) continue;
            const prev = cur.get(ic.id)!;
            const nx: Snap = { ...prev, bar: i, tests: prev.tests + 1, lastTest: i, volSum: prev.volSum + volRatio, rejected: prev.rejected + (rejected ? 1 : 0) };
            ic.marks.push({ bar: i, volR: volRatio, rej: rejected });
            const rb0 = Math.max(ic.firstBar, i - FP_LOOK + 1);
            const ab = absorption(ic.level, ic.isRes, rb0, i, halfBand);
            const wasVb = prev.vb;
            if (ab.avail) {
              nx.absVol = ab.levelVol; nx.absBuy = ab.buy; nx.z = ab.z; nx.dom = ab.dom;
              if (ab.node) nx.vb = true;
            }
            const sc = rescore(nx);
            nx.strength = sc.strength; nx.conf = sc.conf;
            ic.snaps.push(nx); cur.set(ic.id, nx);
            attached = true;
            if (i - prev.lastTest > TEST_PULSE) {
              const lvl = commas(Math.round(ic.level / tick) * tick);
              const flowTxt = nx.vb && !wasVb
                ? ` The footprint now shows a heavy node there (z ${nx.z.toFixed(1)}), so the level turns ${ic.isRes ? "magenta" : "cyan"}: order-flow confirmed.`
                : ab.avail ? ` ${formatVol(nx.absVol)} contracts have traded in its band since the first test.` : "";
              events.push({
                i, price: ic.level, tone: tone(ic, nx.vb), weight: 2, title: "TESTING",
                text: `${t} — price came back to the ${side(ic.isRes)} at ${lvl}: a ${ic.isRes ? "long upper" : "long lower"} wick on ${volRatio.toFixed(1)}× average volume that closed ${s.c[i] === s.o[i] ? "flat at its open, a rejection" : rejected ? (ic.isRes ? "down, a rejection" : "up, a rejection") : ic.isRes ? "up, not a rejection" : "down, not a rejection"}. Test ${nx.tests}×.${flowTxt}`,
              });
              owner.set(events[events.length - 1], ic);
            }
            break;
          }

          if (!attached && tests.length >= MIN_TESTS) {
            let matchCount = 0, firstBar = i, rej = 0, levelSum = 0, volSumM = 0;
            for (const te of tests) {
              if (te.isRes !== isRes || Math.abs(te.price - testLevel) > tol) continue;
              matchCount++; levelSum += te.price; volSumM += te.volR;
              if (te.rej) rej++;
              if (te.bar < firstBar) firstBar = te.bar;
            }
            const rejectPct = matchCount > 0 ? (rej * 100) / matchCount : 0;
            if (matchCount >= MIN_TESTS && rejectPct >= REJ_PCT) {
              const avgLevel = levelSum / matchCount;
              const ab = absorption(avgLevel, isRes, firstBar, i, halfBand);
              const absorbOk = !ab.avail || (ab.node && ab.imbOK);
              if (absorbOk) {
                // CollectMarks: tests within tol of THIS test's price, newest 24
                const mk: Mark[] = [];
                for (const te of tests) if (te.isRes === isRes && Math.abs(te.price - testLevel) <= tol) mk.push({ bar: te.bar, volR: te.volR, rej: te.rej });
                const marks0 = mk.length > MARK_CAP ? mk.slice(mk.length - MARK_CAP) : mk;
                const sn: Snap = {
                  bar: i, tests: matchCount, volSum: volSumM, rejected: rej, vb: ab.avail && ab.node,
                  absVol: ab.avail ? ab.levelVol : 0, absBuy: ab.avail ? ab.buy : 0.5, z: ab.avail ? ab.z : 0,
                  dom: ab.avail ? ab.dom : rejectPct / 100, strength: 0, conf: 0, lastTest: i,
                };
                const sc = rescore(sn); sn.strength = sc.strength; sn.conf = sc.conf;
                const nu: Ice = {
                  id: nextId++, firstBar, born: i, level: avgLevel, isRes, marks0, marks: marks0.slice(), snaps: [sn],
                  died: Infinity, dropped: Infinity, archEnd: Infinity, createdByFlow: ab.avail,
                };
                all.push(nu); active.push(nu); cur.set(nu.id, sn);
                while (active.length > Math.max(1, MAX_CONC)) {
                  let worst = 0, ws = Number.MAX_VALUE;
                  for (let q = 0; q < active.length; q++) { const st = cur.get(active[q].id)!.strength; if (st < ws) { ws = st; worst = q; } }
                  const gone = active.splice(worst, 1)[0];
                  gone.dropped = i;
                }
                if (active.includes(nu)) {
                  const lvl = commas(Math.round(avgLevel / tick) * tick);
                  const why = ab.avail
                    ? `and the 1-minute footprint shows a heavy volume node there (z ${ab.z.toFixed(1)}, ${formatVol(ab.levelVol)} traded) with ${isRes ? "buyers" : "sellers"} absorbed (${Math.round(ab.dom * 100)}% of the side reading)`
                    : `and with no footprint volume in its band the bar engine alone confirms it, so it stays ${isRes ? "violet" : "teal"}`;
                  events.push({
                    i, price: avgLevel, tone: tone(nu, sn.vb), weight: 3, title: side(isRes),
                    text: `${t} — ${side(isRes)} confirmed at ${lvl}: ${matchCount} test bars with ${isRes ? "upper" : "lower"} wicks clustered within half an ATR in the last 40 bars, ${rej} closed rejected, ${why}.`,
                  });
                  owner.set(events[events.length - 1], nu);
                }
              }
            }
          }
        }
      }
      // ---------------- HandleBreaks
      const breakDist = atrV * BREAK_ATR;
      for (let q = active.length - 1; q >= 0; q--) {
        const ic = active[q];
        const broke = (ic.isRes && s.c[i] >= ic.level + breakDist) || (!ic.isRes && s.c[i] <= ic.level - breakDist);
        if (!broke) continue;
        ic.died = i;
        active.splice(q, 1);
        archive.push(ic);
        while (archive.length > MAX_BROKEN) { const old = archive.shift()!; old.archEnd = i; }
        const sn = cur.get(ic.id)!;
        events.push({
          i, price: ic.level, tone: "neutral", weight: 3, title: "BROKEN",
          text: `${t} — a bar closed at ${commas(s.c[i])}, at least half an ATR (${breakDist.toFixed(2)} pts) ${ic.isRes ? "above" : "below"} the ${side(ic.isRes)} at ${commas(Math.round(ic.level / tick) * tick)}, after ${sn.tests} tests. The level is retired to the dotted steel archive.`,
        });
        owner.set(events[events.length - 1], ic);
      }
      // ---------------- AgeBroken
      for (let q = archive.length - 1; q >= 0; q--) if (i - archive[q].died > BROKEN_STALE) { archive[q].archEnd = i; archive.splice(q, 1); }
    }
    events.sort((a, b) => a.i - b.i);
    { const kept = events.filter((e) => { const ic = owner.get(e); return !ic || onStage(ic); }); events.length = 0; events.push(...kept); }

    // ---------------------------------------------------------------- views at k
    const liveAt = (k: number) => all.filter((ic) => ic.born <= k && k < ic.died && k < ic.dropped && onStage(ic));
    const brokenAt = (k: number) => all.filter((ic) => ic.died <= k && k < ic.archEnd && onStage(ic));

    const priceExtent = (i0: number, i1: number, k: number): [number, number] | null => {
      let lo = Infinity, hi = -Infinity;
      for (let i = i0; i <= Math.min(i1, k); i++) { if (s.h[i] > hi) hi = s.h[i]; if (s.l[i] < lo) lo = s.l[i]; }
      if (!isFinite(lo)) return null;
      const reach = Math.max(2 * (atr[k] || 0), (hi - lo) * 0.25);
      let a = lo, b = hi;
      for (const ic of liveAt(k)) if (ic.level >= lo - reach && ic.level <= hi + reach) { if (ic.level < a) a = ic.level; if (ic.level > b) b = ic.level; }
      return [a, b];
    };

    // ---------------------------------------------------------------- render
    type Item = {
      ic: Ice; sn: Snap; tier: number; base: RGB; strong: RGB; hue: RGB; F: number; Lf: number; La: number; wpx: number;
      testing: boolean; sgn: number; ly: number; lineTop: number; lineBot: number; x0: number; dist: number;
      capX: number; edge: number; shelf: boolean; marks: Mark[];
    };
    type Rect = { l: number; t: number; r: number; b: number; o: Ice | null };

    const frame = (d: Draw) => {
      const k = d.k;
      const toIdx = d.live && d.live.i <= d.i1 ? d.live.i : Math.min(d.i1, k);
      const xR = d.x(toIdx) + 8;
      const xEnd = Math.min(xR + RUNWAY, d.plotRight - 4);
      const atrV = atr[k] > 0 ? atr[k] : tick * 4;
      const dimPrice = d.live && toIdx === d.live.i ? d.live.c : s.c[toIdx];
      let halfH = atrV * ZONE_PAD;
      const capH = Math.max(tick, MAX_BAND_TICKS * tick);
      if (halfH > capH) halfH = capH; else if (halfH < tick) halfH = tick;
      const dim = (level: number) => {
        const half = atrV * ZONE_PAD;
        const lo = level - half, hi = level + half;
        const dist = dimPrice >= lo && dimPrice <= hi ? 0 : dimPrice > hi ? dimPrice - hi : lo - dimPrice;
        const dd = clamp(dist / (FADE_REACH * atrV), 0, 1);
        const sm = dd * dd * (3 - 2 * dd);
        const fl = clamp(FADE_FLOOR / 100, 0, 1);
        return clamp(fl + (1 - fl) * (1 - sm), 0, 1);
      };
      const pal = palette(d.th);
      const lineK = LINE_OP / 100;
      const items: Item[] = [];
      for (const ic of liveAt(k)) {
        const sn = snapAt(ic, k);
        const tier = sn.vb ? 2 : sn.strength < FAINT_BELOW ? 0 : 1;
        const base = ic.isRes ? pal.res : pal.sup, strong = ic.isRes ? pal.sRes : pal.sSup;
        const F = dim(ic.level), Lf = 0.5 + 0.5 * F;
        const ta = tier === 0 ? lineK * 0.8 : tier === 1 ? lineK * 1.35 : lineK * 1.55;
        const wpx = tier === 2 ? 2 : 1;
        const ly = d.price.y(ic.level);
        const top = Math.round(ly - wpx * 0.5);
        const x0 = Math.max(d.plotLeft, d.x(Math.max(0, ic.firstBar)));
        items.push({
          ic, sn, tier, base, strong, hue: tier === 2 ? strong : base, F, Lf, La: clamp01(ta) * Lf, wpx,
          testing: sn.lastTest >= 0 && k - sn.lastTest <= TEST_PULSE, sgn: ic.isRes ? -1 : 1, ly, lineTop: top, lineBot: top + wpx,
          x0, dist: Math.abs(ic.level - dimPrice), capX: xR, edge: ly, shelf: false, marks: marksAt(ic, k),
        });
      }
      return { k, toIdx, xR, xEnd, atrV, halfH, dim, pal, items };
    };

    const under = (d: Draw) => {
      if (!d.on("band")) return;
      const f = frame(d);
      const bandK = (FILL_OP / 100) * 0.4;
      for (let t = 0; t <= 2; t++) for (const it of f.items) {
        if (it.tier !== t || it.x0 >= f.xR) continue;
        const yA = d.price.y(it.ic.level + f.halfH), yB = d.price.y(it.ic.level - f.halfH);
        const tk = t === 0 ? 0.6 : t === 1 ? 1 : 1.15;
        let t0 = Math.round(Math.min(yA, yB)), t1 = Math.round(Math.max(yA, yB));
        if (t1 - t0 < 1) t1 = t0 + 1;
        d.rect(Math.round(it.x0), t0, Math.round(f.xR), t1, css(it.base, bandK * tk * it.F), null);
      }
    };

    const draw = (d: Draw) => {
      const f = frame(d);
      const { ctx } = d;
      const pal = f.pal;
      const pv = d.price;
      const claims: Rect[] = [];
      // visible candles (the forming one included), for DEVIATION 1's clear-space search
      const cLast = Math.min(d.i1, d.live ? d.live.i : d.k);
      const xLast = d.x(cLast);
      const claim = (r: Rect) => claims.push(r);
      const collides = (r: Rect, o: Ice | null) => {
        for (const c of claims) {
          if (o && c.o === o) continue;
          if (r.r <= c.l || r.l >= c.r || r.b <= c.t || r.t >= c.b) continue;
          return true;
        }
        return false;
      };
      const hRule = (x0: number, x1: number, y: number, c: string, w: number) => {
        if (x1 < x0) [x0, x1] = [x1, x0];
        const a = Math.round(x0), b = Math.round(x1);
        if (b - a < 0.5) return;
        ctx.fillStyle = c; ctx.fillRect(a, Math.round(y - w * 0.5), b - a, w);
      };
      const vRule = (x: number, y0: number, y1: number, c: string) => {
        if (y1 < y0) [y0, y1] = [y1, y0];
        const a = Math.round(y0); let b = Math.round(y1);
        if (b - a < 1) b = a + 1;
        ctx.fillStyle = c; ctx.fillRect(Math.round(x - 0.5), a, 1, b - a);
      };
      const poly = (px: number[], py: number[], cnt: number, x0: number, ly: number, wb: number, ys: number, fill: string | null, stroke?: string) => {
        if (cnt < 3) return;
        ctx.beginPath();
        ctx.moveTo(x0 + px[0] * wb, ly + ys * py[0] * wb);
        for (let q = 1; q < cnt; q++) ctx.lineTo(x0 + px[q] * wb, ly + ys * py[q] * wb);
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.lineJoin = "miter"; ctx.stroke(); }
      };
      const font = (kind: number) => (kind === 0 ? { size: CAPTION + 0.5, weight: 600, font: "sans" as const } : kind === 1 ? { size: CAPTION + 0.5, weight: 400, font: "sans" as const } : { size: CAPTION - 0.5, weight: 600, font: "sans" as const });

      // ---- broken archive lines (drawn first, under the live levels)
      const broken = brokenAt(f.k);
      for (const ic of broken) {
        const age = f.k - ic.died;
        const fade = clamp01(1 - age / Math.max(1, BROKEN_STALE)) * f.dim(ic.level);
        if (fade <= 0.02) continue;
        const ly = pv.y(ic.level);
        const yc = Math.floor(ly) + 0.5;
        const x0 = Math.max(d.plotLeft, d.x(Math.max(0, ic.firstBar)));
        const db = Math.min(Math.max(ic.died, ic.firstBar), f.toIdx);
        const xb = d.x(db);
        if (xb > x0) d.line([[Math.round(x0), yc], [Math.round(xb), yc]], css(pal.brk, 0.6 * fade), 1, [2, 3]);
        if (ic.died <= f.toIdx) {
          if (f.xR > xb + 2) d.line([[Math.round(xb), yc], [Math.round(f.xR), yc]], css(pal.brk, 0.32 * fade), 1, [1, 4]);
          vRule(xb, ly - 4, ly + 4, css(pal.brk, 0.75 * fade));
        }
      }

      // ---- live levels: line, birth post, fractures — faint, solid, then order-flow tiers
      for (let t = 0; t <= 2; t++) for (const it of f.items) {
        if (it.tier !== t) continue;
        if (it.x0 < f.xR) {
          hRule(it.x0, f.xR, it.ly, css(it.base, it.La), it.wpx);
          vRule(it.x0, it.ly - 3.5, it.ly + 3.5, css(it.base, it.La));
        }
        if (d.on("marks")) drawMarks(it);
      }

      function drawMarks(it: Item) {
        const mk = it.marks;
        if (!mk.length) return;
        const last = mk.length - 1, sgn = it.sgn;
        const edge = sgn > 0 ? it.lineBot : it.lineTop;
        let xPrev = NaN;
        let xCur = d.x(Math.min(mk[0].bar, Math.max(0, f.toIdx)));
        for (let q = 0; q < mk.length; q++) {
          const b = mk[q].bar;
          const xNext = q < last ? d.x(Math.min(mk[q + 1].bar, Math.max(0, f.toIdx))) : NaN;
          const x = xCur;
          let gap = 99;
          if (!Number.isNaN(xPrev)) gap = Math.min(gap, Math.abs(x - xPrev));
          if (!Number.isNaN(xNext)) gap = Math.min(gap, Math.abs(xNext - x));
          xPrev = xCur; xCur = xNext;
          if (b > f.toIdx || b < d.i0 - 1) continue;
          if (x < d.plotLeft - 12 || x > d.plotRight + 12) continue;
          const m = mk[q];
          const live = it.testing && q === last;
          const c = live ? it.strong : it.hue;
          const a = live ? 1 : m.rej ? clamp01(it.La + 0.25) : it.La * 0.55;
          const yw = pv.y(it.ic.isRes ? s.h[b] : s.l[b]);
          const y0 = (sgn > 0 ? Math.max(edge, yw) : Math.min(edge, yw)) + sgn * CRACK_GAP;
          const xc = Math.round(x - 0.5) + 0.5;
          const L = crack(xc, y0, sgn, m.volR, q, gap, c, a);
          // DEVIATION 1: captions may sit among the bars here, so they keep clear of the fractures and ring
          const rr0 = live ? L * 0.5 + 3.2 : 2;
          claim({ l: xc - rr0, t: Math.min(y0, y0 + sgn * L) - (live ? 3.2 : 1), r: xc + rr0, b: Math.max(y0, y0 + sgn * L) + (live ? 3.2 : 1), o: null });
          if (live) {
            const yc = Math.round(y0 + sgn * L * 0.5 - 0.5) + 0.5, rr = Math.round(L * 0.5 + 2.2);
            ctx.save(); ctx.strokeStyle = css(it.strong, clamp01(0.95 * Math.max(0.75, it.Lf))); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(xc, yc, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          }
        }
      }

      function crack(xc: number, y0: number, sgn: number, vr: number, q: number, gap: number, c: RGB, a: number) {
        const L = 6 + 1.5 * clamp(vr, 1, 4);
        const sd = (q & 1) === 0 ? 1 : -1;
        const z = clamp(0.5 * gap - 1.2, 0.9, 1.7);
        const p: [number, number][] = [
          [xc, y0], [xc + sd * z, y0 + sgn * L * 0.28], [xc - sd * z * 0.7, y0 + sgn * L * 0.52], [xc + sd * z * 0.9, y0 + sgn * L * 0.78], [xc, y0 + sgn * L],
        ];
        ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = css(c, a);
        for (let j = 0; j < 4; j++) { ctx.lineWidth = CRACK_W[j]; ctx.beginPath(); ctx.moveTo(p[j][0], p[j][1]); ctx.lineTo(p[j + 1][0], p[j + 1][1]); ctx.stroke(); }
        if (vr >= 2.5) {
          const bl = Math.min(L * 0.24, Math.max(1.5, 0.5 * gap - 1));
          ctx.strokeStyle = css(c, a * 0.8); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p[1][0], p[1][1]); ctx.lineTo(p[1][0] + sd * bl, p[1][1] + sgn * L * 0.3); ctx.stroke();
        }
        ctx.restore();
        return L;
      }

      // ---- emblems and captions, testing first, then tier, then nearest
      const order = f.items.slice().sort((a, b) => (a.testing !== b.testing ? (a.testing ? -1 : 1) : a.tier !== b.tier ? b.tier - a.tier : a.dist - b.dist));
      const room = f.xEnd - f.xR;
      if (room > 12) for (const it of order) emblem(it);
      for (const it of order) caption(it);
      for (const ic of broken) {
        const age = f.k - ic.died;
        if (age < 0 || age > BROKEN_LABEL) continue;
        const fade = clamp01(1 - age / Math.max(1, BROKEN_STALE)) * f.dim(ic.level);
        if (fade <= 0.02) continue;
        const ly = pv.y(ic.level);
        const toks: Tok[] = [
          { kind: 0, pri: 2, text: side(ic.isRes), ink: 4 },
          { kind: 1, pri: 1, text: priceText(ic), ink: 4 },
          { kind: 0, pri: 3, text: "BROKEN", ink: 4 },
        ];
        place(toks, ic, f.xR, ly, ic.isRes ? -1 : 1, ly, ly, Math.max(0.5, fade), pal.brk, pal.brk, false, pal.brk, 1, 0, Math.max(d.plotLeft, d.x(Math.max(0, ic.firstBar))));
      }

      function emblem(it: Item) {
        const ic = it.ic, live = it.testing;
        const lit = live ? it.strong : it.hue;
        const ly = it.ly, xR = f.xR;
        const mk = it.marks;
        let sv = 0;
        for (const m of mk) sv += clamp(m.volR, 0, 8);
        let wb = clamp(12 + 3 * Math.log2(1 + sv), 16, 28);
        let availD = 999, availT = 999;
        for (const ot of f.items) {
          if (ot === it) continue;
          const gl = ot.ly - ly;
          if (gl > 0) { if (gl - 6 < availD) availD = gl - 6; }
          else if (gl < 0) { if (-gl - 6 < availT) availT = -gl - 6; }
        }
        for (const r of claims) {
          if (r.r <= xR || r.l >= xR + wb) continue;
          if (r.t >= ly) { const gg = r.t - ly - 2; if (gg < availD) availD = gg; }
          if (r.b <= ly) { const gg = ly - r.b - 2; if (gg < availT) availT = gg; }
        }
        const k1 = Math.min(1, Math.min(availD / (BERG_UNDER * wb), availT / (BERG_TIP * wb)));
        wb *= Math.max(0, k1);
        wb = Math.min(wb, room / 1.12); // DEVIATION 1: the emblem fits the air DS Replay leaves
        const compact = wb < 9;
        const fF = Math.max(0.6, it.F) * (it.tier === 0 ? 0.78 : 1);
        const fill = FILL_OP / 18;
        const snow = pal.light ? lit : mix(lit, WHITE, 0.55);
        if (!compact) {
          poly(BUX, BUY, BUX.length, xR, ly, wb, 1, css(lit, Math.min(0.9, 0.3 * (live ? 1.25 : 1) * fF * fill)));
          const nb = Math.min(mk.length, 4);
          if (nb > 0) {
            let tot = 0;
            for (let q = 0; q < Math.min(mk.length, 10); q++) tot += clamp(mk[mk.length - 1 - q].volR, 0.25, 8);
            let acc = 0, prev = 0;
            for (let q = 0; q < nb; q++) {
              acc += clamp(mk[mk.length - 1 - q].volR, 0.25, 8);
              const y1 = (acc / tot) * BERG_UNDER;
              if ((q & 1) === 0) {
                const ba = 0.07 * fF * fill * (live && q === 0 ? 1.6 : 1);
                const sl = clipSlab(prev, y1);
                if (sl[0].length >= 3) poly(sl[0], sl[1], sl[0].length, xR, ly, wb, 1, css(lit, ba));
              }
              prev = y1;
            }
          }
          poly(BTX, BTY, BTX.length, xR, ly, wb, -1, css(lit, (pal.light ? 0.55 : 0.85) * fF));
          poly(BLX, BLY, BLX.length, xR, ly, wb, -1, css(snow, (pal.light ? 0.22 : 0.97) * fF));
          if (pal.light) poly(BTX, BTY, BTX.length, xR, ly, wb, -1, null, css(lit, 0.9 * fF));
        }
        const wl = compact ? Math.min(6, Math.max(0, room - 2)) : wb;
        hRule(xR - 0.1 * wl, xR + 1.1 * wl, ly, css(snow, Math.min(1, 0.95 * fF)), it.wpx);
        if (compact) claim({ l: xR - 1, t: ly - 2, r: xR - 1 + wl * 1.2 + 2, b: ly + 2, o: ic });
        else claim({ l: xR - 1, t: ly - BERG_TIP * wb - 1, r: xR + wb + 1, b: ly + BERG_UNDER * wb + 1, o: ic });
        it.capX = xR + (compact ? wl * 1.2 : wb) + 7; it.edge = ly; it.shelf = true;
      }

      type Tok = { kind: number; pri: number; text: string; ink: number };
      function caption(it: Item) {
        const ic = it.ic, sn = it.sn;
        const toks: Tok[] = [
          { kind: 0, pri: 2, text: side(ic.isRes), ink: 0 },
          { kind: 1, pri: 1, text: priceText(ic), ink: 1 },
        ];
        if (it.testing) toks.push({ kind: 0, pri: 3, text: "TESTING", ink: 3 });
        toks.push({ kind: 2, pri: 4, text: `${sn.tests}×`, ink: 2 });
        if (sn.absVol > 0) toks.push({ kind: 2, pri: 5, text: formatVol(sn.absVol), ink: 2 });
        if (d.on("source")) toks.push({ kind: 2, pri: 6, text: sn.vb ? "BAR + FLOW" : "BAR ONLY", ink: 2 });
        const ta = Math.max(0.62, it.F);
        place(toks, ic, it.capX, it.ly, it.sgn, it.edge, it.edge, ta, it.hue, it.strong, it.shelf, it.hue, it.wpx, clamp01(it.La + 0.12), it.x0);
      }

      function candleHit(l: number, r: number, t: number, b: number) {
        const a = Math.max(d.i0, Math.ceil(cLast - (xLast - (l - 2)) / d.bw)), z = Math.min(cLast, Math.floor(cLast - (xLast - (r + 2)) / d.bw));
        for (let i = a; i <= z; i++) {
          const hh = d.live && i === d.live.i ? d.live.h : s.h[i], ll = d.live && i === d.live.i ? d.live.l : s.l[i];
          if (pv.y(hh) - 1 <= b && pv.y(ll) + 1 >= t) return true;
        }
        return false;
      }

      /**
       * PlaceCaption. Pass 0 is the tool's own: right of the emblem inside the
       * runway, far side of the level first, dropping the least important
       * tokens until it fits. DS Replay's runway is only 5 bars wide (DEVIATION
       * 1), so pass 1 slides the caption left along its own level line to the
       * nearest spot clear of candles and other captions, and pass 2, the last
       * resort, right-aligns it to the plot edge on a backdrop.
       */
      function place(toks: Tok[], owner: Ice, x: number, ly: number, sgn: number, edge: number, edge2: number, ta: number,
        hue: RGB, strong: RGB, shelf: boolean, shelfC: RGB, shelfW: number, shelfA: number, xMin = d.plotLeft) {
        if (!toks.length) return false;
        const ws = toks.map((tk) => d.measure(tk.text, font(tk.kind)));
        const h = CAPTION + 4;
        const masks: { mask: number; w: number; level: number }[] = [];
        let prevMask = -1;
        for (let level = 6; level >= 1; level--) {
          let mask = 0, w = 0, cnt = 0;
          toks.forEach((tk, j) => { if (tk.pri <= level) { mask |= 1 << j; w += ws[j]; cnt++; } });
          if (cnt === 0 || mask === prevMask) continue;
          prevMask = mask;
          masks.push({ mask, w: w + CAP_GAP * (cnt - 1), level });
        }
        const put = (xx: number, cy: number, m: { mask: number; w: number }, backdrop: boolean) => {
          const r: Rect = { l: xx - 2, t: cy - h * 0.5, r: xx + m.w + 2, b: cy + h * 0.5, o: owner };
          claim(r);
          if (shelf) hRule(xx - 6, xx + m.w + 4, ly, css(shelfC, shelfA), shelfW);
          tokens(toks, ws, m.mask, xx, cy, r, ta, hue, strong, backdrop);
          return true;
        };
        const rectAt = (xx: number, cy: number, w: number): Rect => ({ l: xx - 2, t: cy - h * 0.5, r: xx + w + 2, b: cy + h * 0.5, o: owner });
        const inPane = (r: Rect) => r.t >= pv.top && r.b <= pv.bottom;
        const pass0 = (group: typeof masks) => {
          for (let sideN = 0; sideN < 2; sideN++) {
            const sd = sideN === 0 ? sgn : -sgn, e = sideN === 0 ? edge : edge2;
            const cy = e + sd * (h * 0.5 + 2.5);
            for (const m of group) {
              if (x + m.w > f.xEnd) continue;
              const r = rectAt(x, cy, m.w);
              if (!inPane(r) || collides(r, owner)) continue;
              return put(x, cy, m, false);
            }
          }
          return false;
        };
        // DEVIATION 1 — no runway margin: pick the cheapest spot clear of candles and other captions,
        // either slid left along the level line or lifted just past the candles beside the emblem.
        const lo = Math.max(d.plotLeft + 4, xMin);
        const search = (group: typeof masks) => {
          let best: { xx: number; cy: number; m: (typeof masks)[number]; cost: number } | null = null;
          for (const m of group) {
            const xr = Math.min(x, d.plotRight - 6 - m.w);
            if (xr < d.plotLeft + 4) continue;
            for (let sideN = 0; sideN < 2; sideN++) {
              const sd = sideN === 0 ? sgn : -sgn, e = sideN === 0 ? edge : edge2;
              const cy0 = e + sd * (h * 0.5 + 2.5);
              const pen = sideN * 40;
              for (let xx = xr; xx >= lo; xx -= 6) {
                const cost = (xr - xx) + pen;
                if (best && cost >= best.cost) break;
                const r = rectAt(xx, cy0, m.w);
                if (!inPane(r)) break;
                if (collides(r, owner) || candleHit(r.l, r.r, r.t, r.b)) continue;
                best = { xx, cy: cy0, m, cost };
                break;
              }
              let cy = cy0;
              for (let step = 0; step < 24; step++) {
                const r = rectAt(xr, cy, m.w);
                if (!inPane(r)) break;
                const cost = Math.abs(cy - cy0) * 3 + pen;
                if (best && cost >= best.cost) break;
                if (!collides(r, owner) && !candleHit(r.l, r.r, r.t, r.b)) { best = { xx: xr, cy, m, cost }; break; }
                cy += sd * 4;
              }
            }
            if (best) break; // the fullest caption that fits anywhere wins
          }
          return best ? put(best.xx, best.cy, best.m, false) : false;
        };
        const backdrop = (group: typeof masks) => {
          for (let sideN = 0; sideN < 2; sideN++) {
            const sd = sideN === 0 ? sgn : -sgn, e = sideN === 0 ? edge : edge2;
            const cy = e + sd * (h * 0.5 + 2.5);
            for (const m of group) {
              const xx = Math.min(x, d.plotRight - 6 - m.w);
              if (xx < d.plotLeft + 4) continue;
              const r = rectAt(xx, cy, m.w);
              if (!inPane(r) || collides(r, owner)) continue;
              return put(xx, cy, m, true);
            }
          }
          return false;
        };
        // the name, price and state word (TESTING / BROKEN) are kept as long as any placement allows
        const core = masks.filter((m) => m.level >= 3);
        if (pass0(core) || search(core) || pass0(masks) || search(masks) || backdrop(core) || backdrop(masks)) return true;
        return false;
      }

      function tokens(toks: Tok[], ws: number[], mask: number, x: number, cy: number, r: Rect, ta: number, hue: RGB, strong: RGB, backdrop: boolean) {
        const light = pal.light, lum = pal.lum;
        const ink = light ? SLATE : TEXT_C;
        const hueInk = fit(hue, lum, ta, light, 4.5);
        const liveInk = fit(strong, lum, ta, light, 4.5);
        const pool = light ? POOL_LIGHT : POOL_DARK;
        let pa = solve(lum, pool, ta, [ink, hueInk], [4.5, 3.0], 0, 0.85);
        if (backdrop) pa = Math.max(pa, 0.85);
        if (pa > 0.02) d.rect(r.l, r.t, r.r, r.b, css(pool, pa), null);
        let cx = x, first = true;
        toks.forEach((tk, j) => {
          if ((mask & (1 << j)) === 0) return;
          if (!first) cx += CAP_GAP;
          first = false;
          let c: RGB, a = ta;
          switch (tk.ink) {
            case 0: c = hueInk; break;
            case 3: c = liveInk; break;
            case 2: c = ink; a = ta * MUTED_K; break;
            case 4: c = fit(pal.brk, lum, ta, light, 3.0); break;
            default: c = ink;
          }
          d.text(tk.text, Math.round(cx), Math.round(cy) + 0.5, { ...font(tk.kind), color: css(c, a) });
          cx += ws[j];
        });
      }
    };

    function priceText(ic: Ice) {
      const p = Math.round(ic.level / tick) * tick;
      return p.toFixed(2);
    }

    function clipHalf(ix: number[], iy: number[], lim: number, keepAbove: boolean): [number[], number[]] {
      const ox: number[] = [], oy: number[] = [];
      const n2 = ix.length;
      for (let q = 0; q < n2 && ox.length < 62; q++) {
        const ax = ix[q], ay = iy[q], bx = ix[(q + 1) % n2], by = iy[(q + 1) % n2];
        const ina = keepAbove ? ay >= lim : ay <= lim;
        const inb = keepAbove ? by >= lim : by <= lim;
        if (ina) { ox.push(ax); oy.push(ay); }
        if (ina !== inb && by !== ay) { const tt = (lim - ay) / (by - ay); ox.push(ax + (bx - ax) * tt); oy.push(lim); }
      }
      return [ox, oy];
    }
    function clipSlab(a: number, b: number): [number[], number[]] {
      const [x1, y1] = clipHalf(BUX, BUY, a, true);
      return clipHalf(x1, y1, b, false);
    }

    // ---------------------------------------------------------------- read-outs
    const nearest = (k: number) => {
      const p = s.c[k];
      let off: Ice | null = null, bid: Ice | null = null;
      for (const ic of liveAt(k)) {
        if (ic.isRes) { if (!off || Math.abs(ic.level - p) < Math.abs(off.level - p)) off = ic; }
        else if (!bid || Math.abs(ic.level - p) < Math.abs(bid.level - p)) bid = ic;
      }
      return { off, bid };
    };
    const levelLine = (ic: Ice, k: number) => {
      const sn = snapAt(ic, k);
      const parts = [priceText(ic), `${sn.tests}×`];
      if (k - sn.lastTest <= TEST_PULSE) parts.push("TESTING");
      return parts.join(" · ");
    };

    const status = (k: number): ReadItem[] => {
      const live = liveAt(k);
      const vb = live.filter((ic) => snapAt(ic, k).vb).length;
      const { off, bid } = nearest(k);
      const out: ReadItem[] = [
        { label: "Live levels", value: live.length ? `${live.length} · ${vb} order-flow` : "none" },
        { label: "Nearest ICE OFFER", value: off ? levelLine(off, k) : "—", tone: off ? (snapAt(off, k).vb ? "strongBear" : "bear") : undefined },
        { label: "Nearest ICE BID", value: bid ? levelLine(bid, k) : "—", tone: bid ? (snapAt(bid, k).vb ? "strongBull" : "bull") : undefined },
      ];
      const near = off && bid ? (Math.abs(off.level - s.c[k]) < Math.abs(bid.level - s.c[k]) ? off : bid) : off ?? bid;
      if (near) {
        const sn = snapAt(near, k);
        out.push({ label: "Absorbed at nearest", value: sn.absVol > 0 ? `${formatVol(sn.absVol)} · ${sn.vb ? "bar + flow" : "bar only"}` : sn.vb ? "bar + flow" : "bar only" });
      }
      let lastBreak: Ice | null = null;
      for (const ic of all) if (ic.died <= k && onStage(ic) && (!lastBreak || ic.died > lastBreak.died)) lastBreak = ic;
      if (lastBreak && k - lastBreak.died <= BROKEN_STALE) out.push({ label: "Last break", value: `${side(lastBreak.isRes)} ${priceText(lastBreak)} · ${hhmm(s, lastBreak.died)}`, tone: "neutral" });
      return out;
    };

    const readout = (i: number): ReadItem[] => {
      const inf = info[i];
      const out: ReadItem[] = [];
      if (!inf) return [{ label: "Bar engine", value: "warming up" }];
      out.push({
        label: "Bar engine",
        value: inf.test === 1 ? `test · ${inf.rej ? "rejected" : "not rejected"}` : inf.test === -1 ? `test · ${inf.rej ? "rejected" : "not rejected"}` : "no test",
        tone: inf.test === 1 ? "bear" : inf.test === -1 ? "bull" : undefined,
      });
      if (inf.test !== 0) out.push({ label: "Side", value: inf.test === 1 ? "ICE OFFER (upper wick)" : "ICE BID (lower wick)", tone: inf.test === 1 ? "bear" : "bull" });
      const wick = inf.test === -1 ? inf.dn : inf.up;
      out.push({ label: inf.test === -1 ? "Lower wick / body" : "Upper wick / body", value: `${(wick / Math.max(inf.body, tick)).toFixed(2)}` });
      out.push({ label: "Vol / avg (20)", value: `${inf.volR.toFixed(2)}×` });
      out.push({ label: "ATR (14)", value: atr[i].toFixed(2) });
      return out;
    };

    return {
      events,
      priceExtent,
      under,
      draw,
      status: (k) => status(k),
      readout,
      legend: [
        { label: "ICE BID", color: "#009999", shape: "line" },
        { label: "ICE OFFER", color: "#A33DFF", shape: "line" },
        { label: "Order-flow confirmed bid", color: "#00FFFF", shape: "line" },
        { label: "Order-flow confirmed offer", color: "#FF00FF", shape: "line" },
        { label: "Broken (archive)", color: "#7E7E88", shape: "dash" },
      ],
    };
  },
};
