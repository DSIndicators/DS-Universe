import type { Draw, PaneView, ReadItem, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm } from "../ta";

/**
 * DS MACD — web edition. Source: DSMACD.cs (shipped build, DS MACD v2.5 rules),
 * shipped defaults from ApplyDefaults(): MacdV scale, 12 / 26 / 9, ATR 26,
 * Risk level 150, Range level 50, Cross armed within 0.35 ATR, rail shown within
 * 1.5 ATR, turns on (strength 1.0), centerline crosses on, grade down in the
 * range on; divergence on the MACD line, pivots 5 left / 3 right, span 5–60,
 * Zone gate Extreme, hidden off, separate legs on, relative depth 0.75, minimum
 * price move 0.25 ATR, exaggerated on (equal within 0.15 ATR), Smart anchor,
 * lifetime 80, cross-source grading on (cluster 3), 200 kept. OnBarClose.
 *
 * PORTED (from ComputeBar / Project / SetupEngine / Scan / Born / Lifecycle and
 * the render passes):
 *  · MACD-V = 100 x (EMA12 - EMA26) / ATR(26) (the .cs's own ATR seeding), the
 *    signal EMA(9) seeded at 0, the histogram, the seven-regime lifecycle;
 *  · the exact cross price: the close that puts next bar's MACD on this bar's
 *    signal, (sig x ATR / 100 - B) / A, shown within 1.5 ATR, ARMED within 0.35;
 *  · events in the tool's order, one per bar: signal cross, SETUP (a cross whose
 *    ended leg took MACD-V past ±50, confirmed by the histogram growing on the
 *    next bar, marked on that bar), centerline cross, histogram turn (material
 *    against its own 20-bar average move); low grade inside ±50;
 *  · divergence: confirmed pivots, Smart price anchor, minimum price move,
 *    Elder's relative depth and separate-legs gates, the Extreme zone gate,
 *    exaggerated (equal-extreme) patterns, chain and cross-source grading (×2,
 *    ×3, the grade can rise up to 3 bars after birth), the trigger swing, and
 *    the PENDING → CONFIRMED / BROKEN / EXPIRED lifecycle (expired patterns are
 *    removed, as RemoveDrawObject does);
 *  · the panel: risk / ranging bands, two-weight histogram with turn caps, the
 *    heat-coloured MACD-V line with its bevel, amber signal, overflow rule,
 *    divergence lines with confirmation chevrons, target dash, value chip, the
 *    regime ribbon with its glyphs, the readout and the CROSS and DIV chips; the
 *    latched frame (min / max of the last 1,500 bars, ladder 50 / 75 / 100 / 150
 *    …, stepped out only by a new extreme);
 *  · on price: SETUP marks at the wick of the confirmation bar with the M letter,
 *    divergence lines from price extreme to price extreme, the cross rail and
 *    its price flag. The tool's own light-chart palette (Deepen 0.62 / Mix 0.12).
 *
 * DEVIATIONS
 *  · Frame fit: NinjaTrader fits the frame once from the history it has loaded
 *    when the panel first renders; here that moment is the bar before the replay
 *    starts, and the frame steps out bar by bar exactly as FitTo() does after it.
 *  · Mark history (750 bars) is counted back from the replay start for history
 *    bars, because in a live chart it is counted from the newest bar.
 *  · DS LABEL BUS: one DS panel on this chart, so no mark is moved aside; the
 *    divergence line's letter is skipped where a setup mark already says M on
 *    that bar, as RuneTaken() does.
 *  · Panel text uses the site's mono face instead of Segoe UI.
 *  · Alerts and the DS Toolkit master switch have no web equivalent.
 *  · Narration: every SETUP, every divergence and what became of it, and the
 *    centerline crosses that are NOT graded down in the ranging band. Signal
 *    crosses and histogram turns stay on the ribbon and in the read, unnarrated:
 *    on a 1-minute chart they come every few bars, and the tool itself calls the
 *    raw cross a log entry, not a signal.
 *  · Example hygiene (web showcase): a divergence confirmed before the first shown
 *    bar is not drawn (panel or price), not reported in the DIV chip / status line,
 *    and its later lifecycle (CONFIRMED / BROKEN / EXPIRED) is not narrated, so a
 *    chart never opens on a line or a "DIV ▲ · 30 bars ago" left by the warm-up.
 *    Computation (chain and cross-source grading included) is unchanged.
 */

// ------------------------------------------------------------------ shipped defaults
const FAST = 12, SLOW = 26, SMOOTH = 9, ATR_P = 26, RISK = 150, RANGE = 50;
const PRE_CROSS = 0.35, RAIL_MAX = 1.5, TURN_STRENGTH = 1.0;
const PIV_L = 5, PIV_R = 3, MIN_SPAN = 5, MAX_SPAN = 60, DEPTH = 0.75, MIN_PX_ATR = 0.25, EQUAL_ATR = 0.15;
const LIFETIME = 80, CLUSTER = 3, MAX_DIV = 200, MARK_HISTORY = 750, LINE_W = 2, DIV_W = 2;
const FIT_BARS = 1500, PM_MAX = 1000;
const PM_LADDER = [50, 75, 100, 150, 200, 300, 450, 650, 1000, 1500, 2500, 5000];
const KF = 2 / (1 + FAST), KS = 2 / (1 + SLOW), KG = 2 / (1 + SMOOTH);

const ST_NONE = 0, ST_RISKHI = 1, ST_RALLY = 2, ST_RETRACE = 3, ST_RANGE = 4, ST_REBOUND = 5, ST_REVERSE = 6, ST_RISKLO = 7;
const STATE_WORD = ["", "RISK HIGH", "RALLYING", "RETRACING", "RANGING", "REBOUNDING", "REVERSING", "RISK LOW"];
const LF_PENDING = 0, LF_CONFIRMED = 1, LF_INVALID = 2, LF_EXPIRED = 3;
const UP = "▲", DN = "▼";

const RIB_H = 6, RIB_GAP = 2, HEAD_ROW = 15, HEAD_AIR = 3, FOOT_PX = 6;
const HEAD_T = 0.195, FOOT_T = 0.015, HEAD_PX = HEAD_ROW + RIB_GAP + RIB_H + HEAD_AIR;

// ------------------------------------------------------------------ colours (the .cs palette)
type C3 = [number, number, number];
const C = (r: number, g: number, b: number): C3 => [r / 255, g / 255, b / 255];
const BULL = C(0, 153, 153), BEAR = C(163, 61, 255), SIGNAL = C(240, 163, 92);
const S_BULL = C(0, 255, 255), S_BEAR = C(255, 0, 255), NEUTRAL = C(128, 136, 148);
const css = (c: C3, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
const srgb = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (c: C3) => 0.2126 * srgb(c[0]) + 0.7152 * srgb(c[1]) + 0.0722 * srgb(c[2]);
const lerp = (a: C3, b: C3, t: number): C3 => { t = Math.max(0, Math.min(1, t)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
const hexC = (h: string): C3 => { const n = parseInt(h.slice(1, 7), 16); return C((n >> 16) & 255, (n >> 8) & 255, n & 255); };

type Pal = { ground: C3; bull: C3; bear: C3; sig: C3; sBull: C3; sBear: C3; neutral: C3; ink: C3 };
const palCache = new Map<string, Pal>();
function palette(bgHex: string): Pal {
  let p = palCache.get(bgHex);
  if (p) return p;
  const ground = hexC(bgHex), light = lum(ground) > 0.45;
  const lit = (c: C3): C3 => (light ? [c[0] * 0.62, c[1] * 0.62, c[2] * 0.62] : [c[0] + (1 - c[0]) * 0.12, c[1] + (1 - c[1]) * 0.12, c[2] + (1 - c[2]) * 0.12]);
  p = { ground, bull: lit(BULL), bear: lit(BEAR), sig: lit(SIGNAL), sBull: lit(S_BULL), sBear: lit(S_BEAR), neutral: NEUTRAL, ink: light ? [0.16, 0.18, 0.22] : [0.84, 0.86, 0.9] };
  palCache.set(bgHex, p);
  return p;
}
function heat(P: Pal, mv: number): C3 {
  const rg = RANGE, rk = Math.max(RANGE + 1, RISK);
  if (isNaN(mv)) return P.ink;
  if (mv >= rk) return P.sBull;
  if (mv <= -rk) return P.sBear;
  if (mv >= rg) return lerp(P.bull, P.sBull, (mv - rg) / Math.max(1, rk - rg));
  if (mv <= -rg) return lerp(P.bear, P.sBear, (-mv - rg) / Math.max(1, rk - rg));
  if (mv >= 0) return lerp(P.ink, P.bull, mv / Math.max(1, rg));
  return lerp(P.ink, P.bear, -mv / Math.max(1, rg));
}

const rung = (need: number) => { for (const r of PM_LADDER) if (r >= need - 1e-9) return r; return need; };
const f2 = (v: number) => (Math.round(v / 0.25) * 0.25).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ------------------------------------------------------------------ DS mark (DsMcMark.DrawDsMark)
const GAP = 9;
function roundLine(d: Draw, pts: [number, number][], col: string, w: number, dash?: number[]) {
  const ctx = d.ctx;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round"; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
  ctx.stroke(); ctx.restore();
}
function chevron(d: Draw, cx: number, cy: number, r: number, w: number, col: string, up: boolean) {
  const rise = r * 0.62;
  const yb = up ? cy + rise * 0.5 : cy - rise * 0.5, yt = up ? cy - rise * 0.5 : cy + rise * 0.5;
  roundLine(d, [[cx - r, yb], [cx, yt], [cx + r, yb]], col, w);
}
const runeFs = (r: number) => Math.floor(Math.max(7, Math.min(30, Math.max(9, Math.min(20, r * 1.9)))) + 0.5);
function rune(d: Draw, ch: string, cx: number, cy: number, fs: number, hue: string, ground: string) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) d.text(ch, cx + dx, cy + dy, { color: ground, size: fs, weight: 700, align: "center", font: "sans" });
  d.text(ch, cx, cy, { color: hue, size: fs, weight: 700, align: "center", font: "sans" });
}
function dsTrigger(d: Draw, ax: number, ay: number, up: boolean, thin: boolean, r: number, hue: string, ground: string, ch: string | null) {
  const w = Math.max(1.3, Math.min(2.2, r * 0.34)) * (thin ? 0.65 : 1);
  const rise = r * 0.62, top = up ? ay + GAP : ay - GAP - rise;
  const yb = up ? top + rise : top, yt = up ? yb - rise : yb + rise;
  roundLine(d, [[ax - r, yb], [ax, yt], [ax + r, yb]], hue, w);
  if (r < 4 || !ch) return;
  const tail = up ? top + rise : top, fs = runeFs(r), h = fs * 1.45;
  const ty = up ? tail + 2 : tail - h - 2;
  rune(d, ch, ax, ty + h / 2, fs, hue, ground);
}

type Div = {
  bull: boolean; hidden: boolean; exagg: boolean;
  bar0: number; val0: number; bar1: number; val1: number; pbar0: number; px0: number; pbar1: number; px1: number;
  confirm: number; crossOk: boolean; chainOk: boolean; trigger: number;
  /** grade timeline: [bar, grade] */
  grades: [number, number][];
  life: number; resolved: number; removedAt: number; onPrice: boolean;
};
const gradeAt = (dv: Div, k: number) => { let g = dv.grades[0][1]; for (const [b, gg] of dv.grades) if (b <= k) g = gg; return g; };
const lifeAt = (dv: Div, k: number) => (dv.resolved >= 0 && dv.resolved <= k ? dv.life : LF_PENDING);

export const study: StudyDef = {
  slug: "macd",
  name: "DS MACD",
  about: "MACD-V — the MACD in ATRs, with real zones — its regime ribbon, the exact close that crosses the signal next bar, setups out of an extreme and Elder-gated divergence with its lifecycle. Closed bars, shipped defaults.",
  panes: [{ id: "mc", title: "DS MACD", weight: 0.5, digits: 0 }],
  layers: [
    { id: "rail", label: "Cross rail", on: true, hint: "The dashed rail at the close that would cross the MACD over its signal on the bar now forming (Cross rail on price, on by default)." },
    { id: "div", label: "Divergence on price", on: true, hint: "Divergence lines between the two price extremes a pattern was built from (on by default)." },
  ],
  run(s) {
    const n = s.n, H = s.h, Lo = s.l, Cl = s.c;
    const F = () => new Float64Array(n).fill(NaN);
    const fe = F(), se = F(), atr = F(), osc = F(), sig = F(), hist = F(), mv = F(), cross = F(), reach = F();
    const state = new Int8Array(n), event = new Int8Array(n), qual = new Uint8Array(n);
    const events: StudyEvent[] = [];
    const evFrom = Math.max(1, s.replayFrom - 1);
    const markFrom = s.replayFrom - 1 - MARK_HISTORY;
    const marks: { i: number; bull: boolean; y: number }[] = [];
    const markAt = new Map<number, boolean>();

    const regime = (m: number, h: number) => isNaN(m) ? ST_NONE : m > RISK ? ST_RISKHI : m < -RISK ? ST_RISKLO : m > RANGE ? (h > 0 ? ST_RALLY : ST_RETRACE) : m < -RANGE ? (h > 0 ? ST_REBOUND : ST_REVERSE) : ST_RANGE;
    const project = (f: number, sl: number, sg: number, at: number) => {
      const A = KF - KS;
      if (A === 0 || isNaN(sg) || !(at > 0)) return NaN;
      const B = (1 - KF) * f - (1 - KS) * sl;
      return ((sg * at) / 100 - B) / A;
    };

    // divergence state
    const pvBar = [-1, -1, -1, -1], pvVal = [0, 0, 0, 0], pvPBar = [0, 0, 0, 0], pvPx = [0, 0, 0, 0];
    const cfBar: number[] = [], cfBull: boolean[] = [];
    const divs: Div[] = [], all: Div[] = [];
    let live: Div[] = [];

    const histDir = (c: number) => {
      for (let k = 0; k < 8; k++) {
        const a = c - k, b = a - 1;
        if (b < 0) return 0;
        const x = hist[a], y = hist[b];
        if (isNaN(x) || isNaN(y)) return 0;
        if (x > y) return 1;
        if (x < y) return -1;
      }
      return 0;
    };
    const turnMaterial = (c: number) => {
      if (TURN_STRENGTH <= 0) return true;
      const x = hist[c], y = hist[c - 1];
      if (isNaN(x) || isNaN(y)) return false;
      const dd = Math.abs(x - y);
      let sum = 0, cnt = 0;
      for (let k = 0; k < 20; k++) {
        const a = c - k, b = a - 1;
        if (b < 0) break;
        const u = hist[a], v = hist[b];
        if (isNaN(u) || isNaN(v)) break;
        sum += Math.abs(u - v); cnt++;
      }
      if (cnt < 5) return true;
      const m = sum / cnt;
      return m <= 0 || dd >= TURN_STRENGTH * m;
    };
    const legStart = (arr: Float64Array, c: number) => {
      const h = arr[c];
      if (isNaN(h) || h === 0) return c;
      const pos = h > 0;
      let st = c;
      for (let k = 1; k <= 500; k++) {
        const b = c - k;
        if (b < 0) break;
        const v = arr[b];
        if (isNaN(v) || v === 0 || v > 0 !== pos) break;
        st = b;
      }
      return st;
    };
    const legPeak = (arr: Float64Array, c: number, st: number) => { let m = 0; for (let b = st; b <= c; b++) { const v = arr[b]; if (isNaN(v)) continue; if (Math.abs(v) > m) m = Math.abs(v); } return m; };
    const legExtreme = (arr: Float64Array, c: number, st: number, low: boolean) => { let m = low ? Infinity : -Infinity; for (let b = st; b <= c; b++) { const v = arr[b]; if (isNaN(v)) continue; if (low ? v < m : v > m) m = v; } return m; };
    const setup = (c: number) => {
      if (c < 2) return 0;
      const h0 = hist[c], h1 = hist[c - 1], h2 = hist[c - 2];
      if (isNaN(h0) || isNaN(h1) || isNaN(h2)) return 0;
      const up = h2 <= 0 && h1 > 0 && h0 > h1, dn = h2 >= 0 && h1 < 0 && h0 < h1;
      if (!up && !dn) return 0;
      const st = legStart(hist, c - 2);
      if (up) return legExtreme(mv, c - 2, st, true) <= -RANGE ? 1 : 0;
      return legExtreme(mv, c - 2, st, false) >= RANGE ? -1 : 0;
    };
    const crossedZero = (from: number, to: number) => {
      if (to < from) return false;
      let sign = 0;
      for (let b = from; b <= to; b++) {
        if (b < 0) continue;
        const v = hist[b];
        if (isNaN(v) || v === 0) continue;
        const sg = v > 0 ? 1 : -1;
        if (sign === 0) sign = sg; else if (sg !== sign) return true;
      }
      return false;
    };
    const pivotKind = (arr: Float64Array, p: number) => {
      if (p - PIV_L < 0) return 0;
      const v = arr[p];
      if (isNaN(v)) return 0;
      let lo = true, hi = true;
      for (let k = 1; k <= PIV_L; k++) { const u = arr[p - k]; if (isNaN(u)) return 0; if (!(v < u)) lo = false; if (!(v > u)) hi = false; if (!lo && !hi) return 0; }
      for (let k = 1; k <= PIV_R; k++) { const u = arr[p + k]; if (isNaN(u)) return 0; if (!(v <= u)) lo = false; if (!(v >= u)) hi = false; if (!lo && !hi) return 0; }
      return (lo ? 1 : 0) | (hi ? 2 : 0);
    };
    const gatesOk = (isLow: boolean, v0: number, v1: number, b0: number, b1: number) => {
      if (isLow) { if (v0 < 0 && !(v1 > DEPTH * v0)) return false; } else { if (v0 > 0 && !(v1 < DEPTH * v0)) return false; }
      if (!crossedZero(b0 + 1, b1 - 1)) return false;
      const a = mv[b0], b = mv[b1];
      if (isNaN(a) || isNaN(b)) return false;
      return isLow ? Math.min(a, b) <= -RANGE : Math.max(a, b) >= RANGE;
    };

    const born = (b: number, keep: boolean, isLow: boolean, exagg: boolean, bar0: number, v0: number, pb0: number, px0: number, bar1: number, v1: number, pb1: number, px1: number) => {
      const bull = isLow;
      if (!keep) {
        cfBar.push(b); cfBull.push(bull);
        while (cfBar.length > 512) { cfBar.shift(); cfBull.shift(); }
        for (let k = divs.length - 1; k >= 0; k--) {
          const e = divs[k];
          if (b - e.confirm > CLUSTER) break;
          if (e.bull === bull && !e.crossOk) { e.crossOk = true; e.grades.push([b, 2 + (e.chainOk ? 1 : 0)]); }
        }
        return null;
      }
      const dv: Div = { bull, hidden: false, exagg, bar0, val0: v0, bar1, val1: v1, pbar0: pb0, px0, pbar1: pb1, px1, confirm: b, crossOk: false, chainOk: false, trigger: NaN, grades: [], life: LF_PENDING, resolved: -1, removedAt: -1, onPrice: true };
      for (let k = cfBar.length - 1; k >= 0; k--) { if (b - cfBar[k] > CLUSTER) break; if (cfBull[k] === bull) { dv.crossOk = true; break; } }
      for (let k = divs.length - 1; k >= 0; k--) {
        const e = divs[k];
        if (e.bull === bull && e.bar1 === bar0) { dv.chainOk = true; break; }
        if (b - e.confirm > MAX_SPAN + PIV_R + 2) break;
      }
      dv.grades.push([b, 1 + (dv.crossOk ? 1 : 0) + (dv.chainOk ? 1 : 0)]);
      let sw = isLow ? -Infinity : Infinity;
      for (let j = bar0; j <= bar1; j++) { const v = isLow ? H[j] : Lo[j]; if (isLow ? v > sw : v < sw) sw = v; }
      dv.trigger = sw;
      divs.push(dv); all.push(dv); live.push(dv);
      while (divs.length > MAX_DIV) { const old = divs.shift()!; old.removedAt = b; live = live.filter((x) => x !== old); }
      return dv;
    };

    const scan = (slot: number, arr: Float64Array, b: number, keep: boolean, out: Div[]) => {
      const p = b - PIV_R;
      const kind = pivotKind(arr, p);
      if (kind === 0) return;
      const v1 = arr[p];
      let at = atr[b];
      if (isNaN(at) || at <= 0) at = 1;
      for (let side = 0; side < 2; side++) {
        const isLow = side === 0;
        if ((kind & (isLow ? 1 : 2)) === 0) continue;
        const idx = slot * 2 + side;
        // Smart anchor: from PIV_L bars before the pivot to the confirmation bar; the first extreme wins ties
        const oldest = Math.max(0, p - PIV_L), newest = b;
        let best = oldest, ext = isLow ? Lo[oldest] : H[oldest];
        for (let j = oldest + 1; j <= newest; j++) { const v = isLow ? Lo[j] : H[j]; if (isLow ? v < ext : v > ext) { ext = v; best = j; } }
        const pb1 = best, px1 = ext;
        if (pvBar[idx] >= 0) {
          const span = p - pvBar[idx];
          if (span >= MIN_SPAN && span <= MAX_SPAN) {
            const v0 = pvVal[idx], px0 = pvPx[idx], dd = px1 - px0, floorPx = MIN_PX_ATR * at;
            const equal = Math.abs(dd) <= EQUAL_ATR * at;
            const reg = isLow ? dd < -floorPx && v1 > v0 : dd > floorPx && v1 < v0;
            const exa = equal && (isLow ? v1 > v0 : v1 < v0);
            if ((reg || exa) && gatesOk(isLow, v0, v1, pvBar[idx], p)) {
              const dv = born(b, keep, isLow, exa && !reg, pvBar[idx], v0, pvPBar[idx], px0, p, v1, pb1, px1);
              if (dv) out.push(dv);
            }
          }
        }
        pvBar[idx] = p; pvVal[idx] = v1; pvPBar[idx] = pb1; pvPx[idx] = px1;
      }
    };

    for (let b = 0; b < n; b++) {
      // ------------------------------------------------ ComputeBar
      const inp = Cl[b];
      if (b === 0) { fe[0] = inp; se[0] = inp; atr[0] = H[0] - Lo[0]; }
      else {
        fe[b] = KF * inp + (1 - KF) * fe[b - 1];
        se[b] = KS * inp + (1 - KS) * se[b - 1];
        let tr = H[b] - Lo[b];
        const d1 = Math.abs(H[b] - Cl[b - 1]), d2 = Math.abs(Lo[b] - Cl[b - 1]);
        if (d1 > tr) tr = d1; if (d2 > tr) tr = d2;
        const m = Math.min(b + 1, ATR_P);
        atr[b] = ((m - 1) * atr[b - 1] + tr) / m;
      }
      const raw = fe[b] - se[b];
      mv[b] = atr[b] > 0 ? (100 * raw) / atr[b] : 0;
      osc[b] = mv[b];
      sig[b] = b === 0 ? 0 : KG * osc[b] + (1 - KG) * sig[b - 1];
      hist[b] = osc[b] - sig[b];
      state[b] = regime(mv[b], hist[b]);
      qual[b] = Math.abs(mv[b]) <= RANGE ? 0 : 1;
      cross[b] = project(fe[b], se[b], sig[b], atr[b]);
      reach[b] = atr[b] > 0 && !isNaN(cross[b]) ? (cross[b] - Cl[b]) / atr[b] : NaN;

      // ------------------------------------------------ SetupEngine (c = 0)
      if (b === 0) continue;
      const narrate = b >= evFrom;
      let ev = 0;
      const h0 = hist[b], h1 = hist[b - 1], o0 = osc[b], o1 = osc[b - 1];
      if (!isNaN(h0) && !isNaN(h1) && !isNaN(o0) && !isNaN(o1)) {
        if (h1 <= 0 && h0 > 0) ev = 1; else if (h1 >= 0 && h0 < 0) ev = -1;
        if (ev === 0) { const su = setup(b); if (su !== 0) ev = su * 4; }
        if (ev === 0) { if (o1 <= 0 && o0 > 0) ev = 2; else if (o1 >= 0 && o0 < 0) ev = -2; }
        if (ev === 0) {
          const d0 = histDir(b), d1 = histDir(b - 1);
          if (d0 !== 0 && d1 !== 0 && d0 !== d1 && ((d0 > 0 && h0 < 0) || (d0 < 0 && h0 > 0)) && turnMaterial(b)) ev = d0 > 0 ? 3 : -3;
        }
      }
      event[b] = ev;

      const newDivs: Div[] = [];
      scan(1, hist, b, false, newDivs); // cross-source grading reads the histogram
      scan(0, osc, b, true, newDivs); // patterns on the MACD line
      for (const dv of newDivs) {
        if (!narrate) continue;
        const g = dv.grades[0][1];
        events.push({ i: b, price: dv.px1, tone: dv.bull ? "bull" : "bear", weight: 2,
          title: `${dv.bull ? "BULLISH" : "BEARISH"} DIVERGENCE${g > 1 ? " ×" + g : ""}`,
          text: `${hhmm(s, b)} — price made ${dv.exagg ? (dv.bull ? "an equal low" : "an equal high") : dv.bull ? "a lower low" : "a higher high"} (${f2(dv.px0)} at ${hhmm(s, dv.pbar0)}, ${f2(dv.px1)} at ${hhmm(s, dv.pbar1)}) while MACD-V made a shallower ${dv.bull ? "low" : "high"} (${Math.round(dv.val0)} → ${Math.round(dv.val1)}), the MACD crossed its signal between the two, and the deeper pivot sits outside ±${RANGE}. It confirms on a close ${dv.bull ? "above" : "below"} ${f2(dv.trigger)}.` });
      }

      // Lifecycle
      {
        const src = osc[b], hi = H[b], lo = Lo[b], cl = Cl[b];
        for (let i = live.length - 1; i >= 0; i--) {
          const dv = live[i];
          let lf = LF_PENDING;
          if (dv.bull) { if (lo < dv.px1 && !isNaN(src) && src < dv.val1) lf = LF_INVALID; else if (cl > dv.trigger) lf = LF_CONFIRMED; }
          else { if (hi > dv.px1 && !isNaN(src) && src > dv.val1) lf = LF_INVALID; else if (cl < dv.trigger) lf = LF_CONFIRMED; }
          if (lf === LF_PENDING && LIFETIME > 0 && b - dv.confirm > LIFETIME) lf = LF_EXPIRED;
          if (lf === LF_PENDING) continue;
          dv.life = lf; dv.resolved = b;
          live.splice(i, 1);
          if (narrate && dv.confirm >= s.replayFrom) {
            const arrow = dv.bull ? UP : DN;
            const word = lf === LF_CONFIRMED ? "CONFIRMED" : lf === LF_INVALID ? "BROKEN" : "EXPIRED";
            const why = lf === LF_CONFIRMED ? `the bar closed ${dv.bull ? "above" : "below"} ${f2(dv.trigger)}, the swing between the two pivots`
              : lf === LF_INVALID ? `price and MACD-V made a new ${dv.bull ? "low" : "high"} together (past ${f2(dv.px1)} and ${Math.round(dv.val1)}), so the disagreement is gone`
              : `${LIFETIME} bars passed without a confirmation or a break; the line is removed`;
            events.push({ i: b, price: lf === LF_CONFIRMED ? dv.trigger : dv.px1, tone: lf === LF_CONFIRMED ? (dv.bull ? "bull" : "bear") : "neutral", weight: lf === LF_CONFIRMED ? 3 : lf === LF_INVALID ? 2 : 1,
              title: `DIV ${arrow} ${word}`, text: `${hhmm(s, b)} — the ${dv.bull ? "bullish" : "bearish"} divergence from ${hhmm(s, dv.confirm)} is ${word}: ${why}.` });
          }
        }
      }

      let lowGrade = Math.abs(mv[b]) <= RANGE;
      if (ev === 2 || ev === -2) lowGrade = legPeak(mv, b - 1, legStart(mv, b - 1)) <= RANGE;
      if (ev === 4 || ev === -4) lowGrade = false;
      qual[b] = lowGrade ? 0 : 1;
      if (ev !== 0) {
        const bull = ev > 0, kind = Math.abs(ev);
        if (kind === 4 && b >= markFrom) { marks.push({ i: b, bull, y: bull ? Lo[b] : H[b] }); markAt.set(b * 2 + (bull ? 1 : 0), true); }
        if (narrate) {
          const t = hhmm(s, b);
          if (kind === 4) {
            const st = legStart(hist, b - 2), ext = legExtreme(mv, b - 2, st, bull);
            events.push({ i: b, price: bull ? Lo[b] : H[b], tone: bull ? "bull" : "bear", weight: 3, title: bull ? "BULL SETUP" : "BEAR SETUP",
              text: `${t} — the MACD crossed ${bull ? "above" : "below"} its signal on ${hhmm(s, b - 1)} out of a leg that took MACD-V to ${Math.round(ext)}, beyond ${bull ? "-" : "+"}${RANGE}, and the histogram grew on this bar: the setup, marked here at the ${bull ? "low" : "high"}.` });
          } else if (kind === 2 && !lowGrade) {
            events.push({ i: b, price: Cl[b], tone: bull ? "bull" : "bear", weight: 1, pane: "mc", title: bull ? "CENTERLINE UP" : "CENTERLINE DOWN",
              text: `${t} — the MACD went through zero ${bull ? "upward" : "downward"}: the fast EMA crossed the slow one. Graded by the leg it left, which reached beyond ±${RANGE}.` });
          }
        }
      }
    }
    events.sort((a, b) => a.i - b.i);

    // ------------------------------------------------ the latched frame
    const frHi = new Float64Array(n), frLo = new Float64Array(n);
    {
      const fitAt = Math.max(0, Math.min(s.replayFrom - 1, n - 1));
      const want = (lo: number, hi: number) => {
        const ph = hi < RANGE ? RANGE : hi, pl = lo > -RANGE ? -RANGE : lo;
        return [Math.max(-PM_MAX, -rung(Math.abs(pl) * 1.06)), Math.min(PM_MAX, rung(ph * 1.06))];
      };
      let lo = Infinity, hi = -Infinity;
      for (let i = Math.max(0, fitAt - FIT_BARS + 1); i <= fitAt; i++) for (const a of [osc, sig, hist]) { const v = a[i]; if (!isFinite(v)) continue; if (v < lo) lo = v; if (v > hi) hi = v; }
      let fh = 200, fl = -200;
      if (lo <= hi) [fl, fh] = want(lo, hi);
      for (let i = 0; i <= fitAt; i++) { frHi[i] = fh; frLo[i] = fl; }
      for (let i = fitAt + 1; i < n; i++) {
        const l2 = Math.min(osc[i], sig[i], hist[i]), h2 = Math.max(osc[i], sig[i], hist[i]);
        if (isFinite(l2) && isFinite(h2)) { const [wl, wh] = want(l2, h2); if (h2 > fh && wh > fh) fh = wh; if (l2 < fl && wl < fl) fl = wl; }
        frHi[i] = fh; frLo[i] = fl;
      }
    }
    let lastPh = 200;

    // ------------------------------------------------ reads
    const headline = (k: number): { txt: string; tone: Tone } => {
      const o = osc[k], hi = hist[k], st = state[k], ev = event[k];
      let txt = `MACD-V ${Math.round(o)}`;
      let tone: Tone = "neutral";
      const w: Record<number, [string, Tone]> = { 1: [`${UP} BULL CROSS`, "bull"], [-1]: [`${DN} BEAR CROSS`, "bear"], 2: [`${UP} CENTERLINE UP`, "bull"], [-2]: [`${DN} CENTERLINE DOWN`, "bear"], 3: [`${UP} TURNED UP`, "bull"], [-3]: [`${DN} TURNED DOWN`, "bear"], 4: [`${UP} BULL SETUP`, "bull"], [-4]: [`${DN} BEAR SETUP`, "bear"] };
      if (ev !== 0) { txt += `  ${w[ev][0]}`; tone = w[ev][1]; }
      else if (st > 0) {
        const up = st === ST_RALLY || st === ST_RETRACE || st === ST_RISKHI;
        txt += `${hi > 0 ? `  ${UP} ` : `  ${DN} `}${STATE_WORD[st]}`;
        tone = st === ST_RISKHI ? "strongBull" : st === ST_RISKLO ? "strongBear" : st === ST_RANGE ? "neutral" : up ? "bull" : "bear";
      } else txt += hi > 0 ? `  ${UP}` : `  ${DN}`;
      if (qual[k] === 0 && Math.abs(ev) === 1) txt += "  · low grade";
      return { txt, tone };
    };
    const railAt = (k: number) => {
      const cp = cross[k], at = atr[k];
      let ok = k >= 2 && isFinite(cp) && at > 0 && !isNaN(hist[k]);
      const r = ok ? (cp - Cl[k]) / at : NaN;
      if (ok && Math.abs(r) > Math.max(0.05, RAIL_MAX)) ok = false;
      if (ok && cp <= 0) ok = false;
      return { ok, cp, r, bull: hist[k] < 0, armed: ok && Math.abs(r) <= PRE_CROSS };
    };
    const crossChip = (k: number) => {
      const rl = railAt(k);
      if (!rl.ok) return null;
      return { t: `CROSS ${(Math.round(rl.cp / 0.25) * 0.25).toFixed(2)}  · ${rl.r >= 0 ? "+" : "-"}${Math.abs(rl.r).toFixed(2)}R${rl.armed ? "  · ARMED" : ""}`, tone: (rl.armed ? (rl.bull ? "bull" : "bear") : "neutral") as Tone, armed: rl.armed };
    };
    const divChip = (k: number) => {
      let last: Div | null = null;
      for (let j = all.length - 1; j >= 0; j--) if (all[j].confirm <= k) { last = all[j]; break; }
      if (last && last.confirm < s.replayFrom) return null; // example hygiene: born in the warm-up
      if (!last) return null;
      const age = k - last.confirm;
      if (age < 0 || age > 120) return null;
      const lf = lifeAt(last, k), g = gradeAt(last, k);
      const t = `DIV ${last.bull ? UP : DN}${last.exagg ? " EQUAL" : ""}${g > 1 ? "  ×" + g : ""}${lf === LF_CONFIRMED ? " CONFIRMED" : lf === LF_INVALID ? " BROKEN" : lf === LF_EXPIRED ? " EXPIRED" : ""}  · ${age === 0 ? "now" : `${age} ${age === 1 ? "bar ago" : "bars ago"}`}`;
      return { t, tone: (lf === LF_INVALID || lf === LF_EXPIRED ? "neutral" : last.bull ? "bull" : "bear") as Tone };
    };
    const visibleDiv = (dv: Div, k: number) => dv.confirm >= s.replayFrom && dv.confirm <= k && !(dv.removedAt >= 0 && dv.removedAt <= k) && lifeAt(dv, k) !== LF_EXPIRED;

    // ------------------------------------------------ drawing
    const drawPane = (d: Draw, pv: PaneView) => {
      const P = palette(d.th.bg), ctx = d.ctx;
      lastPh = pv.bottom - pv.top;
      const kk = d.k, last = Math.min(d.i1, kk), first = Math.max(0, d.i0);
      if (last < first) return;
      const fh = frHi[kk], fl = frLo[kk];
      const bodyTop = Math.max(pv.top, pv.y(fh)), bodyBot = Math.min(pv.bottom, pv.y(fl));
      const BY = (v: number) => Math.max(bodyTop, Math.min(bodyBot, pv.y(v)));
      const x1 = 2, x2 = d.plotRight - 2, w = x2 - x1;
      const paintW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      ctx.save(); ctx.beginPath(); ctx.rect(0, pv.top, d.plotRight, pv.bottom - pv.top); ctx.clip();
      const fits = bodyBot - bodyTop >= 12;
      if (fits) {
        // zones
        const yRiskHi = BY(RISK), yRiskLo = BY(-RISK), yRngHi = BY(RANGE), yRngLo = BY(-RANGE);
        if (yRiskHi > bodyTop + 0.5) {
          const h = (yRiskHi - bodyTop) / 5;
          for (let st = 0; st < 5; st++) { ctx.fillStyle = css(P.sBull, 0.045 + 0.115 * (1 - st / 5)); ctx.fillRect(x1, bodyTop + st * h, w, h + 0.6); }
        }
        if (bodyBot > yRiskLo + 0.5) {
          const h = (bodyBot - yRiskLo) / 5;
          for (let st = 0; st < 5; st++) { ctx.fillStyle = css(P.sBear, 0.045 + 0.115 * ((st + 1) / 5)); ctx.fillRect(x1, yRiskLo + st * h, w, h + 0.6); }
        }
        if (yRngLo > yRngHi + 0.5) { ctx.fillStyle = css(P.neutral, 0.055); ctx.fillRect(x1, yRngHi, w, yRngLo - yRngHi); }
        ctx.fillStyle = css(P.sBull, 0.34); ctx.fillRect(x1, Math.floor(yRiskHi), w, 1);
        ctx.fillStyle = css(P.sBear, 0.34); ctx.fillRect(x1, Math.floor(yRiskLo), w, 1);
        ctx.fillStyle = css(P.neutral, 0.2); ctx.fillRect(x1, Math.floor(yRngHi), w, 1); ctx.fillRect(x1, Math.floor(yRngLo), w, 1);
        const yz = BY(0);
        ctx.fillStyle = css(P.ink, 0.34); ctx.fillRect(x1, Math.floor(yz), w, 1);
        // histogram
        const hw = Math.max(2, paintW - 1.6);
        for (let i = first; i <= last; i++) {
          const v = hist[i];
          if (isNaN(v)) continue;
          const p = i > 0 ? hist[i - 1] : NaN;
          const bucket = v >= 0 ? (!isNaN(p) && v > p ? 0 : 1) : !isNaN(p) && v < p ? 2 : 3;
          const xc = d.x(i), xa = Math.floor(xc - hw * 0.5) + 0.5, xb = xa + Math.floor(hw);
          const y = BY(v), ya = Math.min(y, yz);
          let yb2 = Math.max(y, yz);
          if (yb2 - ya < 1) yb2 = ya + 1;
          ctx.fillStyle = css(bucket < 2 ? P.bull : P.bear, bucket === 0 || bucket === 2 ? 0.8 : 0.34);
          ctx.fillRect(xa, ya, xb - xa, Math.max(1.5, yb2 - ya));
          if (Math.abs(event[i]) === 3 && xb - xa >= 2) { ctx.fillStyle = css(P.ink, 0.72); ctx.fillRect(xa, v >= 0 ? ya - 1.5 : yb2, xb - xa, 1.5); }
        }
        ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
        // signal
        ctx.strokeStyle = css(P.sig, 0.85); ctx.lineWidth = Math.max(1, LINE_W - 0.6); ctx.beginPath();
        let pen = false;
        for (let i = first; i <= last; i++) { const v = sig[i]; if (isNaN(v)) { pen = false; continue; } if (pen) ctx.lineTo(d.x(i), BY(v)); else ctx.moveTo(d.x(i), BY(v)); pen = true; }
        ctx.stroke();
        // MACD-V line: bevel, then heat-coloured segments
        const lw = Math.max(1, LINE_W) + 0.4;
        ctx.strokeStyle = css(P.ground, 0.55); ctx.lineWidth = lw * 0.85; ctx.beginPath(); pen = false;
        for (let i = first; i <= last; i++) { const v = osc[i]; if (isNaN(v)) { pen = false; continue; } if (pen) ctx.lineTo(d.x(i), BY(v) + 1.7); else ctx.moveTo(d.x(i), BY(v) + 1.7); pen = true; }
        ctx.stroke();
        ctx.lineWidth = lw;
        for (let i = first + 1; i <= last; i++) {
          const v = osc[i], p = osc[i - 1];
          if (isNaN(v) || isNaN(p)) continue;
          ctx.strokeStyle = css(heat(P, (mv[i] + (isNaN(mv[i - 1]) ? 0 : mv[i - 1])) * 0.5), 0.96);
          ctx.beginPath(); ctx.moveTo(d.x(i - 1), BY(p)); ctx.lineTo(d.x(i), BY(v)); ctx.stroke();
        }
        ctx.restore();
        // overflow
        const half = Math.max(0.5, paintW * 0.5);
        for (let i = first; i <= last; i++) {
          const v = osc[i];
          if (isNaN(v) || (v <= fh && v >= fl)) continue;
          ctx.fillStyle = css(v > fh ? P.sBull : P.sBear, 0.95);
          ctx.fillRect(d.x(i) - half, v > fh ? bodyTop : bodyBot - 2, half * 2 + 0.6, 2);
        }
        // divergence lines in the panel
        const dw = Math.max(1, DIV_W) * 0.8;
        for (const dv of all) {
          if (dv.confirm > kk) break;
          if (!visibleDiv(dv, kk)) continue;
          if (dv.bar1 < first || dv.bar0 > last) continue;
          const lf = lifeAt(dv, kk), g = gradeAt(dv, kk);
          const xa = d.x(dv.bar0), xb = d.x(dv.bar1), ya = BY(dv.val0), yb = BY(dv.val1);
          let hue = dv.bull ? P.bull : P.bear, a = g >= 2 ? 0.9 : 0.72, wd = dw;
          if (lf === LF_INVALID) { hue = P.neutral; a = 0.4; wd = 1; } else if (lf === LF_CONFIRMED) a = 1;
          const dashed = dv.hidden || dv.exagg || lf === LF_INVALID;
          roundLine(d, [[xa, ya], [xb, yb]], css(hue, a), wd, dashed ? [wd * 2, wd * 2] : undefined);
          if (lf !== LF_INVALID) {
            ctx.fillStyle = css(hue, 0.95);
            ctx.beginPath(); ctx.arc(xa, ya, 2.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(xb, yb, 2.2, 0, Math.PI * 2); ctx.fill();
          }
          if (lf === LF_CONFIRMED && dv.resolved >= first && dv.resolved <= last) {
            const xr = d.x(dv.resolved);
            chevron(d, xr, BY(dv.val1), 4, 3.2, css(P.ground, 1), dv.bull);
            chevron(d, xr, BY(dv.val1), 4, 1.5, css(hue, 0.98), dv.bull);
          }
        }
        // target dash (live edge only)
        if (last === kk && last >= 1) {
          const target = sig[last], now = osc[last];
          if (!isNaN(target) && !isNaN(now)) {
            const y = BY(target);
            let xa = d.x(last);
            if (x2 - xa < 4) xa = x2 - 26;
            const hue = now < target ? P.bull : P.bear;
            d.line([[xa, y], [x2, y]], css(hue, 0.55), 1, [3, 3]);
            ctx.fillStyle = css(hue, 0.9); ctx.fillRect(x2 - 3, y - 1.5, 3, 3);
          }
        }
        // value chip
        const v = osc[last];
        if (!isNaN(v)) {
          const cy = Math.max(bodyTop + 6.5, Math.min(bodyBot - 6.5, BY(v)));
          const tx = String(Math.round(v));
          const cw = d.measure(tx, { size: 9.5, weight: 600 }) + 9;
          d.rect(x2 - cw - 1, cy - 6.5, x2 - 1, cy + 6.5, css(heat(P, mv[last]), 0.92), null);
          d.text(tx, x2 - cw + 3.5, cy + 0.5, { color: css(P.ground, 1), size: 9.5, weight: 600 });
        }
      }
      // regime ribbon
      const ribY = bodyTop - RIB_GAP - RIB_H;
      if (bodyTop - pv.top >= HEAD_ROW + RIB_GAP + RIB_H + 0.5) {
        ctx.fillStyle = css(P.neutral, 0.1); ctx.fillRect(x1, ribY, w, RIB_H);
        const stCol = (st: number) => st === ST_RISKHI ? css(P.sBull, 0.92) : st === ST_RALLY ? css(P.bull, 0.88) : st === ST_RETRACE ? css(P.bull, 0.3)
          : st === ST_RANGE ? css(P.neutral, 0.24) : st === ST_REBOUND ? css(P.bear, 0.3) : st === ST_REVERSE ? css(P.bear, 0.88) : css(P.sBear, 0.92);
        let runS = -1, rA = 0, rB = 0;
        for (let i = first; i <= last + 1; i++) {
          let st = -1, xa = 0, xb = 0;
          if (i <= last) { st = state[i]; xa = d.x(i) - paintW * 0.5; xb = xa + paintW; }
          if (st >= 0 && st === runS && xa <= rB + 0.51) { rB = xb; continue; }
          if (runS > 0) { const ra = Math.max(rA, x1), rb = Math.min(rB, x2); if (rb > ra) { ctx.fillStyle = stCol(runS); ctx.fillRect(ra, ribY, rb - ra, RIB_H); } }
          runS = st; rA = xa; rB = xb;
        }
        const cy = ribY + RIB_H * 0.5, r = Math.max(2.2, Math.min(4.2, Math.min(paintW * 0.5 + 1.6, RIB_H * 0.44)));
        for (let i = first; i <= last; i++) {
          const e = event[i];
          if (e === 0) continue;
          const kind = Math.abs(e);
          if (kind === 3) continue; // Histogram turns on the ribbon: off by default
          const x = d.x(i), up = e > 0, low = qual[i] === 0, hue = up ? P.bull : P.bear;
          if (kind === 4) {
            const rs = r * 1.25;
            chevron(d, x, cy, rs, 4.2, css(P.ground, 1), up);
            chevron(d, x, cy, rs, 2.4, css(hue, 1), up);
            continue;
          }
          chevron(d, x, cy, r, 3, css(P.ground, 1), up);
          chevron(d, x, cy, r, low ? 0.9 : 1.1, css(hue, low ? 0.6 : 0.85), up);
          if (kind === 2) {
            const yb = up ? cy + r * 0.52 : cy - r * 0.52;
            roundLine(d, [[x - r * 0.8, yb], [x + r * 0.8, yb]], css(P.ground, 1), 3);
            roundLine(d, [[x - r * 0.8, yb], [x + r * 0.8, yb]], css(hue, 0.95), 1.3);
          }
        }
        if (w > 200) {
          ctx.fillStyle = css(P.ground, 0.88); ctx.fillRect(x1, ribY, 36, RIB_H);
          d.text("M", x1 + 3, cy, { color: css(P.ink, 0.9), size: 8, weight: 600, font: "sans" });
          d.text("STATE", x1 + 12, cy, { color: css(P.ink, 0.5), size: 8, weight: 600, font: "sans" });
        }
      }
      ctx.restore();
      // header
      if (d.plotRight < 200) return;
      const toneC = (t: Tone): C3 => t === "bull" ? P.bull : t === "bear" ? P.bear : t === "strongBull" ? P.sBull : t === "strongBear" ? P.sBear : P.ink;
      let right = x2 - 2;
      const hl = headline(last);
      const rw = d.measure(hl.txt, { size: 10.5, weight: 700 }) + 10;
      d.rect(right - rw, pv.top + 0.5, right, pv.top + 0.5 + HEAD_ROW, css(P.ground, 0.78), null);
      d.text(hl.txt, right - rw + 5, pv.top + 8.5, { color: css(toneC(hl.tone), 0.95), size: 10.5, weight: 700 });
      right -= rw + 6;
      const chip = (txt: string, col: C3) => {
        const cw = d.measure(txt, { size: 9, weight: 600 }) + 10;
        if (right - cw < 120) return;
        d.rect(right - cw, pv.top + 1, right, pv.top + 15, css(P.ground, 0.78), null);
        d.rect(right - cw, pv.top + 1, right - cw + 2, pv.top + 15, css(col, 0.9), null);
        d.text(txt, right - cw + 5, pv.top + 8.5, { color: css(col, 0.92), size: 9, weight: 600 });
        right -= cw + 6;
      };
      if (d.plotRight >= 700) {
        if (last === kk) { const cc = crossChip(last); if (cc) chip(cc.t, cc.armed ? toneC(cc.tone) : P.ink); }
        const dc = divChip(last);
        if (dc) chip(dc.t, dc.tone === "neutral" ? P.neutral : toneC(dc.tone));
      }
    };

    const drawPrice = (d: Draw) => {
      const P = palette(d.th.bg), pv = d.price, kk = d.k, ground = css(P.ground, 1);
      // divergence lines (DsMcDivLine)
      if (d.on("div")) {
        for (const dv of all) {
          if (dv.confirm > kk) break;
          if (!visibleDiv(dv, kk)) continue;
          if (dv.pbar1 < d.i0 || dv.pbar0 > d.i1) continue;
          const lf = lifeAt(dv, kk), g = gradeAt(dv, kk);
          let hue = dv.bull ? BULL : BEAR, a = lf === LF_CONFIRMED ? 1 : g >= 2 ? 0.95 : 0.8, wd = DIV_W, dashed = dv.hidden || dv.exagg;
          if (lf === LF_INVALID) { hue = NEUTRAL; a = 0.42; dashed = true; wd = 1; }
          const xa = d.x(dv.pbar0), xb = d.x(dv.pbar1), ya = pv.y(dv.px0), yb = pv.y(dv.px1);
          roundLine(d, [[xa, ya], [xb, yb]], css(hue, a), wd, dashed ? [wd * 2, wd * 2] : undefined);
          if (!markAt.has(dv.pbar1 * 2 + (dv.bull ? 1 : 0)) || dv.pbar1 > kk) rune(d, "M", xb + 9, yb, runeFs(5), css(hue, a), ground);
        }
      }
      // setup marks
      const bodyW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      const r = Math.max(3, Math.min(6.5, bodyW * 0.9));
      for (const m of marks) {
        if (m.i > kk) break;
        if (m.i < d.i0 || m.i > d.i1) continue;
        dsTrigger(d, d.x(m.i), pv.y(m.y), m.bull, false, r, css(m.bull ? BULL : BEAR, 1), ground, "M");
      }
      // cross rail
      if (d.on("rail")) {
        const rl = railAt(kk);
        if (rl.ok) {
          const hue = rl.bull ? BULL : BEAR, a = rl.armed ? 1 : 0.62, y = Math.floor(pv.y(rl.cp)) + 0.5;
          if (y >= pv.top - 2 && y <= pv.bottom + 2) {
            const txt = (Math.round(rl.cp / 0.25) * 0.25).toFixed(2);
            const tw = d.measure(txt, { size: 9.5, weight: 700 }) + 10, tagR = d.plotRight - 1, tagL = tagR - tw;
            const x0 = Math.max(0, d.x(kk)), lineEnd = tagL - 6 - 2;
            if (lineEnd > x0) d.line([[x0, y], [lineEnd, y]], css(hue, a), rl.armed ? 2 : 1, [4, 3]);
            const top = Math.floor(y - 7) + 0.5, bot = top + 14, tip = tagL - 6, ctx = d.ctx;
            ctx.save();
            ctx.fillStyle = css(P.ground, rl.armed ? 0.92 : 0.8);
            ctx.fillRect(tagL, top, tw, bot - top);
            ctx.beginPath(); ctx.moveTo(tagL, top); ctx.lineTo(tip, y); ctx.lineTo(tagL, bot); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = css(hue, a); ctx.lineWidth = 1; ctx.stroke(); ctx.strokeRect(tagL, top, tw, bot - top);
            ctx.restore();
            d.text(txt, tagL + 5, y + 0.5, { color: css(hue, a), size: 9.5, weight: 700 });
          }
        }
      }
    };

    return {
      events,
      paneExtent: (pane, _i0, _i1, k) => {
        if (pane !== "mc") return null;
        const kk = Math.max(0, Math.min(n - 1, k));
        const fh = frHi[kk], fl = frLo[kk], span = fh - fl || 1;
        const ph = lastPh > 40 ? lastPh : 200, tot = 1 + HEAD_T + FOOT_T;
        const hPx = Math.min(HEAD_PX, (ph * HEAD_T) / tot), fPx = Math.min(FOOT_PX, (ph * FOOT_T) / tot);
        const ppu = Math.max(10, ph - hPx - fPx) / span;
        const hiP = fh + hPx / ppu - 6 / ppu, loP = fl - fPx / ppu + 6 / ppu;
        const S = (hiP - loP) / 1.16;
        return [loP + 0.08 * S, hiP - 0.08 * S];
      },
      priceExtent: (_i0, _i1, k) => {
        const rl = railAt(k);
        return rl.ok ? [rl.cp, rl.cp] : null;
      },
      draw: (d) => {
        const pv = d.pane("mc");
        if (pv) drawPane(d, pv);
        drawPrice(d);
      },
      status: (k) => {
        const hl = headline(k);
        const out: ReadItem[] = [
          { label: "DS MACD", value: hl.txt.replace(/\s{2,}/g, " "), tone: hl.tone },
          { label: "Signal · Histogram", value: `${Math.round(sig[k])} · ${hist[k] >= 0 ? "+" : ""}${hist[k].toFixed(1)}`, tone: hist[k] >= 0 ? "bull" : "bear" },
        ];
        const cc = crossChip(k);
        out.push({ label: "Cross", value: cc ? cc.t.replace(/^CROSS /, "").replace(/\s{2,}/g, " ") : "rail hidden (beyond 1.5 ATR)", tone: cc ? cc.tone : "neutral" });
        const dc = divChip(k);
        if (dc) out.push({ label: "Divergence", value: dc.t.replace(/^DIV /, "").replace(/\s{2,}/g, " "), tone: dc.tone });
        return out;
      },
      readout: (i) => {
        const hl = headline(i);
        return [
          { label: "Read", value: hl.txt.replace(/\s{2,}/g, " "), tone: hl.tone },
          { label: "MACD-V", value: String(Math.round(osc[i])), tone: osc[i] >= 0 ? "bull" : "bear" },
          { label: "Signal", value: String(Math.round(sig[i])) },
          { label: "Histogram", value: `${hist[i] >= 0 ? "+" : ""}${hist[i].toFixed(1)}`, tone: hist[i] >= 0 ? "bull" : "bear" },
          { label: "Regime", value: STATE_WORD[state[i]] || "--" },
          { label: "Cross price", value: isFinite(cross[i]) ? f2(cross[i]) : "--" },
        ];
      },
      legend: [
        { label: "MACD-V", color: "#1FA5A5", shape: "line" },
        { label: "Signal", color: "rgb(240,163,92)", shape: "line" },
        { label: "Setup / divergence long", color: "#009999", shape: "dot" },
        { label: "Setup / divergence short", color: "#A33DFF", shape: "dot" },
        { label: "Cross rail", color: "#009999", shape: "dash" },
        { label: "Ranging band ±50", color: "rgb(128,136,148)", shape: "box" },
      ],
    };
  },
};
