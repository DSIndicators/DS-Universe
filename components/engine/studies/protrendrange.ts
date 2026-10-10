import type { Draw, PaneView, ReadItem, Session, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm } from "../ta";

/**
 * DS ProTrendRange — web edition. Source: DSProTrendRange.cs (shipped build,
 * comments stripped), shipped defaults (ApplyDefaults): CloseBar, Swing 10,
 * Trend 50, Confirm on the next close ON, One resume per leg ON, Prime only OFF,
 * ribbon, range row, trend field, pockets, swing line, zones, readout, context,
 * value chip, ribbon events, marks on price (Mark history 750), HOLD rail, range
 * rails, line width 2, source tag "T", theme DsSignature.
 *
 * PORTED EXACTLY (ComputeBar / SetupEngine / Stamp / EndSetup of the .cs):
 *   · one measurement over two lengths: d = close − previous close; mean and
 *     mean square by running average up to the length, then EMA(2/(n+1));
 *     z = √min(bar, n) · mean / √meansquare; each z put on the 0..100 scale by
 *     Phase(z) = 50·(1 + erf(z/√2)) with the .cs Abramowitz–Stegun erf.
 *     TREND = Phase(z over 50), SWING = Phase(z over 10).
 *   · range position: close between the highest high and lowest low of the
 *     last 50 bars (100·(C − LL)/(HH − LL), 50 when flat).
 *   · the latched trend (from bar 50): on at ±1σ, off when the trend z crosses
 *     back through 0, straight to the other side at ∓1σ; STRONG past 2σ; the
 *     leg extreme seeded over the last 10 bars; the range (high/low, anchor)
 *     seeded from the leg when a trend ends and widened while RANGING.
 *   · the pullback: armed when the swing z turns against the trend, the
 *     pullback extreme and the swing minimum tracked; the swing closing back
 *     through the center sets "pending"; the next bar confirms when its close
 *     holds (≥ / ≤ the previous close) — the RESUME, stamped on that bar —
 *     graded PRIME (trend ≥ 1σ and the leg's peak reached 2σ), STANDARD (≥ 1σ)
 *     or MINOR (< 1σ, ribbon only); one per leg (the trend must make a new
 *     extreme before another); its HOLD = the pullback extreme, its target = the
 *     leg extreme; its life ends NEW HIGH/LOW, FAILED, TREND LOST, EXPIRED
 *     (50 bars) or SUPERSEDED, exactly as the .cs orders those tests.
 *   · the panel: 0..100 frame with the .cs head/foot reserves, zones (5.5%),
 *     ±1σ hairlines (84.13 / 15.87), dashed center, the wave body (swing vs 50,
 *     ink 6%), the trend field past ±1σ (24% / strong 34% past 2σ), the
 *     pockets (34%, 58% past ∓1σ), the swing line (ink 30% ranging / 58%), the
 *     TREND line 2.4 px coloured by tier over a ground shadow, the value chip,
 *     the STATE ribbon (66% / strong 95% / pullback 28% / bare) with a dot at
 *     each trend start and chevrons at each resume (strong hue for PRIME), the
 *     RANGE row (5 codes), the readout and chips in the .cs wording.
 *   · on price: each reported resume as a shelf at its HOLD price from the
 *     pullback's bar to the confirming bar, with the chevron (doubled and in the
 *     strong colour when PRIME) and the letter T; the live HOLD rail; the RANGE
 *     HIGH / RANGE LOW rails while ranging; colours re-valued for the ground
 *     exactly as ApplyPalette / DsPtInk.Lit do.
 *
 * DEVIATIONS
 *   1. History length: the readings warm up from the first bar the replay file
 *      holds (about three sessions back) rather than a whole NinjaTrader chart;
 *      by the replay day both 10- and 50-bar averages are fully settled.
 *   2. Rail flags: the web chart keeps only five bars of right margin, so the
 *      rail's word (HOLD / RANGE HIGH / RANGE LOW) is set at the right edge of
 *      the plot and its price goes in the axis as a tag in the rail's colour,
 *      instead of the NinjaTrader flag plate carrying both.
 *   3. Mark history: superseded by 6 — marks are created for the first shown
 *      bar and every bar after it (the .cs keeps 750 bars of history).
 *   4. The engine's pane scale is replaced inside the study with the .cs frame
 *      (0 − foot .. 100 + head from the pane's real height), so the axis reads
 *      0..100 exactly where NinjaTrader puts it.
 *   5. Narration: every RESUME (PRIME / STANDARD weight 3, MINOR weight 1),
 *      every trend start and end (weight 2), and how each reported resume ended
 *      (the header's NEW HIGH / FAILED / TREND LOST / EXPIRED). The pullback's
 *      start is drawn (pocket, ghosted ribbon) but not narrated.
 *   6. Example hygiene (web showcase): nothing born before the first shown bar
 *      (s.replayFrom) is drawn, narrated or counted — no shelf or T mark from
 *      the hidden warm-up; no HOLD rail, HOLD chip or "how it ended" chip/event
 *      for a resume stamped before it; no RANGE HIGH / LOW rails (nor their
 *      price room or status line) for a range anchored before it; and the
 *      readout's ages ("TREND ▲ · 37 bars", "PULLBACK ▲ · 4 bars") are left off
 *      while the trend or pullback began before it. Every reading, state, leg,
 *      range and resume is computed exactly as before.
 * Fonts: the house mono stands in for Segoe UI / Arial; chip widths are measured.
 */

// ---------------------------------------------------------------- constants (the .cs)
const NF = 10, NS = 50;
const SIGMA_TREND = 1.0, SIGMA_STRONG = 2.0;
const PHASE_P1 = 84.1345, PHASE_M1 = 15.8655, PHASE_MID = 50;
const POS_HI = 66.667, POS_LO = 33.333, POS_EDGE_HI = 90, POS_EDGE_LO = 10;
const ST_RANGE = 0, ST_UP = 1, ST_STRONG_UP = 2, ST_PULL_UP = 3, ST_DN = 4, ST_STRONG_DN = 5, ST_PULL_DN = 6;
const Q_MINOR = 1, Q_STANDARD = 2, Q_PRIME = 3;
const LIFE_LIVE = 0, LIFE_RESUMED = 1, LIFE_FAILED = 2, LIFE_LOST = 3, LIFE_EXPIRED = 4, LIFE_SUPERSEDED = 5;
const LINE_WIDTH = 2; // Mark history (750 in the .cs): DEVIATIONS 3 and 6
const HEAD_ROW = 15, RIB_H = 6, RIB_GAP = 2, HEAD_AIR = 3, RNG_H = 5, RNG_PAD = 2, FOOT_AIR = 2;
const HEAD_T = 0.24, FOOT_T = 0.085;

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
const barsWord = (n: number) => `${n} ${n === 1 ? "bar" : "bars"}`;
const UPA = "▲", DNA = "▼", DOT = " · ";

function erf(x: number) {
  const sign = x < 0 ? -1.0 : 1.0, ax = x < 0 ? -x : x;
  const t = 1.0 / (1.0 + 0.3275911 * ax);
  const y = 1.0 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}
const phase = (z: number) => (isNaN(z) ? NaN : 50.0 * (1.0 + erf(z / Math.SQRT2)));

const lifeWord = (life: number, bull: boolean) =>
  life === LIFE_RESUMED ? (bull ? "NEW HIGH" : "NEW LOW") : life === LIFE_FAILED ? "FAILED" : life === LIFE_LOST ? "TREND LOST" : life === LIFE_EXPIRED ? "EXPIRED" : life === LIFE_SUPERSEDED ? "SUPERSEDED" : "LIVE";
const reported = (g: number) => g === Q_PRIME || g === Q_STANDARD; // PrimeOnly off
const isBullSt = (st: number) => st === ST_UP || st === ST_STRONG_UP || st === ST_PULL_UP;

/** DsPtMark chevron: FORM_TRIGGER or FORM_PRIME (two chevrons), ground bevel, rune. */
function drawMark(d: Draw, ax: number, ay: number, up: boolean, hue: string, ground: string, rune: string | null, prime: boolean) {
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

type Mark = { bar: number; from: number; up: boolean; prime: boolean; hold: number };

// ---------------------------------------------------------------- the study
export const study: StudyDef = {
  slug: "protrendrange",
  name: "DS ProTrendRange",
  about: "Trend and swing on one 0–100 scale: the pullback filled as a pocket, the RESUME stamped on the bar that confirms it, the range drawn when there is no trend.",
  panes: [{ id: "tr", title: "DS ProTrendRange", weight: 0.62, digits: 0 }],
  layers: [
    { id: "rails", label: "Rails on price", on: true, hint: "The live HOLD level of a resume, and RANGE HIGH / RANGE LOW while ranging." },
    { id: "swing", label: "Swing line", on: true, hint: "The thin SWING line (10 bars), its body and the pockets — the wave against the tide." },
  ],
  run(s: Session) {
    const n = s.n, tick = s.tick;
    const f64 = () => new Float64Array(n).fill(NaN);
    const TRD = f64(), SWG = f64(), TZ = f64(), SZ = f64(), RPOS = f64(), RHI = f64(), RLO = f64(), HOLD = f64(), TARGET = f64();
    const STATE = new Int8Array(n), EVENT = new Int8Array(n), QUAL = new Int8Array(n), BIAS = new Int8Array(n);
    const REGBAR = new Int32Array(n), ARMED = new Uint8Array(n), ARMBAR = new Int32Array(n);
    const LIVE = new Uint8Array(n), LDIR = new Int8Array(n), LGRADE = new Int8Array(n), LPB = new Int32Array(n);
    const RANCHOR = new Int32Array(n);
    const SETBAR = new Int32Array(n), SETDIR = new Int8Array(n), SETLIFE = new Int8Array(n), SETGRADE = new Int8Array(n);
    const ENDED: { bar: number; life: number; dir: number; grade: number; stop: number; target: number; setBar: number }[] = [];
    const TRENDEND: { bar: number; was: number; lo: number; hi: number }[] = [];
    const marks: Mark[] = [];
    const markFrom = s.replayFrom; // example hygiene (DEVIATIONS 6); the .cs keeps 750 bars

    // ComputeBar state
    let mf = 0, vf = 0, ms = 0, vs = 0;
    // SetupEngine state
    let reg = 0, regBar = -1, armed = false, pend = false, can = true;
    let legExt = 0, legBar = 0, legPeak = 0, minW = 0, pb = 0, pbBar = 0, armBar = 0;
    let rangeInit = false, rangeHi = 0, rangeLo = 0, rangeAnchor = 0;
    let live = false, liveBar = -1, liveDir = 0, liveGrade = 0, livePbBar = 0, liveStop = 0, liveTarget = 0;
    let lastSetBar = -1, lastSetDir = 0, lastSetLife = 0, lastSetGrade = 0;

    const endSetup = (life: number, b: number) => {
      live = false;
      if (lastSetBar === liveBar) lastSetLife = life;
      ENDED.push({ bar: b, life, dir: liveDir, grade: liveGrade, stop: liveStop, target: liveTarget, setBar: liveBar });
    };

    let b = 0, sg = 0, ev = 0, q = 0;
    const stamp = (dr: number) => {
      const sd = sg * dr;
      q = sd < SIGMA_TREND ? Q_MINOR : legPeak >= SIGMA_STRONG ? Q_PRIME : Q_STANDARD;
      ev = dr;
      armed = false; pend = false;
      if (q === Q_MINOR) return;
      can = false; // OnePerLeg
      if (live) endSetup(LIFE_SUPERSEDED, b);
      live = true; liveBar = b; liveDir = dr; liveGrade = q; livePbBar = pbBar;
      liveStop = pb; liveTarget = legExt;
      lastSetBar = b; lastSetDir = dr; lastSetLife = LIFE_LIVE; lastSetGrade = q;
      if (!reported(q)) return;
      if (b >= markFrom) marks.push({ bar: b, from: pbBar >= 0 && pbBar <= b ? pbBar : b, up: dr > 0, prime: q === Q_PRIME, hold: pb });
    };
    for (b = 0; b < n; b++) {
      // ---- ComputeBar
      let zf = 0, zs = 0;
      if (b > 0) {
        const dlt = s.c[b] - s.c[b - 1], dd = dlt * dlt;
        if (b <= NF) { mf = mf + (dlt - mf) / b; vf = vf + (dd - vf) / b; }
        else { const af = 2.0 / (NF + 1.0); mf = mf + af * (dlt - mf); vf = vf + af * (dd - vf); }
        if (b <= NS) { ms = ms + (dlt - ms) / b; vs = vs + (dd - vs) / b; }
        else { const a2 = 2.0 / (NS + 1.0); ms = ms + a2 * (dlt - ms); vs = vs + a2 * (dd - vs); }
        const kf = Math.min(b, NF), ks = Math.min(b, NS);
        zf = vf > 0 ? (Math.sqrt(kf) * mf) / Math.sqrt(vf) : 0.0;
        zs = vs > 0 ? (Math.sqrt(ks) * ms) / Math.sqrt(vs) : 0.0;
      }
      const m = Math.min(b + 1, NS);
      let hh = s.h[b], ll = s.l[b];
      for (let i = 1; i < m; i++) { if (s.h[b - i] > hh) hh = s.h[b - i]; if (s.l[b - i] < ll) ll = s.l[b - i]; }
      TRD[b] = phase(zs); SWG[b] = phase(zf); TZ[b] = zs; SZ[b] = zf;
      RPOS[b] = hh > ll ? (100.0 * (s.c[b] - ll)) / (hh - ll) : 50.0;

      // ---- SetupEngine (c = 0)
      sg = zs; ev = 0; q = 0;
      const w = zf, hi = s.h[b], lo = s.l[b], cl = s.c[b];
      const warm = b >= NS;
      let nr = reg;
      if (warm) {
        if (reg === 0) { if (sg >= SIGMA_TREND) nr = 1; else if (sg <= -SIGMA_TREND) nr = -1; }
        else if (reg === 1) { if (sg <= -SIGMA_TREND) nr = -1; else if (sg <= 0) nr = 0; }
        else { if (sg >= SIGMA_TREND) nr = 1; else if (sg >= 0) nr = 0; }
      }
      if (nr !== reg) {
        if (live) endSetup(LIFE_LOST, b);
        const was = reg;
        if (reg !== 0 && nr === 0) {
          const a = Math.max(0, Math.min(legBar, b));
          if (reg === 1) {
            let mn = s.l[b];
            for (let j = a; j < b; j++) if (s.l[j] < mn) mn = s.l[j];
            rangeHi = legExt; rangeLo = mn;
            if (rangeHi < hi) rangeHi = hi;
          } else {
            let mx = s.h[b];
            for (let j = a; j < b; j++) if (s.h[j] > mx) mx = s.h[j];
            rangeLo = legExt; rangeHi = mx;
            if (rangeLo > lo) rangeLo = lo;
          }
          rangeAnchor = a;
          rangeInit = true;
          TRENDEND.push({ bar: b, was, lo: rangeLo, hi: rangeHi });
        }
        reg = nr; regBar = b;
        armed = false; pend = false; can = true; legPeak = 0.0;
        if (reg !== 0) {
          const a = Math.max(0, b - NF + 1);
          if (reg === 1) {
            let best = -Infinity, at = b;
            for (let k = a; k <= b; k++) { const v = s.h[k]; if (v >= best) { best = v; at = k; } }
            legExt = best; legBar = at;
          } else {
            let best = Infinity, at = b;
            for (let k = a; k <= b; k++) { const v = s.l[k]; if (v <= best) { best = v; at = k; } }
            legExt = best; legBar = at;
          }
          ev = 2 * reg;
        }
      }
      if (reg === 0) {
        if (!rangeInit) { rangeHi = hi; rangeLo = lo; rangeAnchor = b; rangeInit = true; }
        else { if (hi > rangeHi) rangeHi = hi; if (lo < rangeLo) rangeLo = lo; }
      }
      if (live && b > liveBar) {
        let done = 0;
        if (liveDir === 1) { if (lo < liveStop) done = LIFE_FAILED; else if (hi > liveTarget) done = LIFE_RESUMED; }
        else { if (hi > liveStop) done = LIFE_FAILED; else if (lo < liveTarget) done = LIFE_RESUMED; }
        if (done === 0 && b - liveBar > NS) done = LIFE_EXPIRED;
        if (done !== 0) endSetup(done, b);
      }
      let st = ST_RANGE;
      if (reg !== 0) {
        const dr = reg;
        const wasArmed = armed;
        if (sg * dr > legPeak) legPeak = sg * dr;
        if ((dr === 1 && hi > legExt) || (dr === -1 && lo < legExt)) {
          legExt = dr === 1 ? hi : lo;
          legBar = b;
          if (!armed) can = true;
        }
        const wasPend = pend;
        if (pend) {
          if ((dr === 1 && lo < pb) || (dr === -1 && hi > pb)) { pb = dr === 1 ? lo : hi; pbBar = b; }
          if (w * dr < minW) minW = w * dr;
          pend = false;
          if (w * dr > 0) {
            if ((cl - s.c[b - 1]) * dr >= 0) stamp(dr);
            else armed = false;
          }
        }
        if (!wasPend) {
          if (!armed) {
            if (w * dr < 0) { armed = true; minW = w * dr; pb = dr === 1 ? lo : hi; pbBar = b; armBar = b; }
          } else {
            if ((dr === 1 && lo < pb) || (dr === -1 && hi > pb)) { pb = dr === 1 ? lo : hi; pbBar = b; }
            if (w * dr < minW) minW = w * dr;
            if (w * dr > 0) {
              if (can) pend = true; // ConfirmSetup on
              else armed = false;
            }
          }
        }
        if (wasArmed && !armed) legPeak = sg * dr > 0 ? sg * dr : 0.0;
        if (armed) st = dr === 1 ? ST_PULL_UP : ST_PULL_DN;
        else if (sg * dr >= SIGMA_STRONG) st = dr === 1 ? ST_STRONG_UP : ST_STRONG_DN;
        else st = dr === 1 ? ST_UP : ST_DN;
      }
      STATE[b] = st; EVENT[b] = ev; QUAL[b] = q; BIAS[b] = reg;
      RHI[b] = reg === 0 && rangeInit ? rangeHi : NaN;
      RLO[b] = reg === 0 && rangeInit ? rangeLo : NaN;
      HOLD[b] = live ? liveStop : NaN;
      TARGET[b] = live ? liveTarget : NaN;
      REGBAR[b] = regBar; ARMED[b] = armed ? 1 : 0; ARMBAR[b] = armBar;
      LIVE[b] = live ? 1 : 0; LDIR[b] = liveDir; LGRADE[b] = liveGrade; LPB[b] = livePbBar;
      RANCHOR[b] = rangeAnchor;
      SETBAR[b] = lastSetBar; SETDIR[b] = lastSetDir; SETLIFE[b] = lastSetLife; SETGRADE[b] = lastSetGrade;
    }

    // ---------------------------------------------------------------- events
    const events: StudyEvent[] = [];
    const t2 = (v: number) => Math.round(v).toString();
    for (let b = 0; b < n; b++) {
      const ev = EVENT[b];
      if (ev === 2 || ev === -2) {
        const up = ev > 0;
        events.push({
          i: b, price: up ? s.l[b] : s.h[b], tone: up ? "bull" : "bear", weight: 2, pane: "tr",
          title: `TREND ${up ? "UP" : "DOWN"} STARTED`,
          text: `${hhmm(s, b)} — the TREND reading (50 bars) reached one sigma ${up ? "up" : "down"}: it reads ${t2(TRD[b])} on the 0–100 scale (${up ? "84" : "16"} is one sigma). The trend is latched on until the reading crosses back through 50.`,
        });
      } else if (ev === 1 || ev === -1) {
        const up = ev > 0, q = QUAL[b];
        const grade = q === Q_PRIME ? "PRIME" : q === Q_STANDARD ? "STANDARD" : "MINOR";
        const why = q === Q_PRIME ? "the trend still reads one sigma or better and the leg it interrupted reached two sigma" : q === Q_STANDARD ? "the trend still reads one sigma or better" : "the trend is back inside one sigma, so it is marked on the ribbon only";
        events.push({
          i: b, price: q === Q_MINOR ? s.c[b] : HOLD[b], tone: up ? (q === Q_PRIME ? "strongBull" : "bull") : q === Q_PRIME ? "strongBear" : "bear", weight: q === Q_MINOR ? 1 : 3, pane: q === Q_MINOR ? "tr" : undefined,
          title: `RESUME ${up ? "LONG" : "SHORT"}${q === Q_PRIME ? " · PRIME" : q === Q_MINOR ? " · MINOR" : ""}`,
          text: `${hhmm(s, b)} — the pullback closed: the SWING line crossed back through 50 and this bar's close held ${up ? "at or above" : "at or below"} the one before. ${grade}: ${why}.${q !== Q_MINOR ? ` HOLD ${fmtC(HOLD[b], tick)} — the pullback's ${up ? "low" : "high"}.` : ""}`,
        });
      }
    }
    for (const e of TRENDEND) {
      events.push({
        i: e.bar, price: s.c[e.bar], tone: "neutral", weight: 2, pane: "tr",
        title: `TREND ${e.was > 0 ? "UP" : "DOWN"} ENDED`,
        text: `${hhmm(s, e.bar)} — the TREND reading crossed back through 50, so the trend is off and the market is RANGING between ${fmtC(e.lo, tick)} and ${fmtC(e.hi, tick)} (the leg's extreme and the far side since).`,
      });
    }
    for (const e of ENDED) {
      if (!reported(e.grade) || e.life === LIFE_SUPERSEDED) continue;
      if (e.setBar < s.replayFrom) continue; // example hygiene (DEVIATIONS 6)
      const up = e.dir > 0, word = lifeWord(e.life, up);
      const why = e.life === LIFE_RESUMED ? `price traded beyond the leg's extreme ${fmtC(e.target, tick)}`
        : e.life === LIFE_FAILED ? `price traded through the HOLD level ${fmtC(e.stop, tick)}`
        : e.life === LIFE_LOST ? "the trend it belonged to ended"
        : `${NS} bars passed with neither the HOLD level nor the leg's extreme reached`;
      events.push({
        i: e.bar, price: e.life === LIFE_RESUMED ? e.target : e.stop, tone: e.life === LIFE_RESUMED ? (up ? "bull" : "bear") : "neutral", weight: e.life === LIFE_RESUMED || e.life === LIFE_FAILED ? 2 : 1,
        title: `RESUME ${up ? "LONG" : "SHORT"} · ${word}`,
        text: `${hhmm(s, e.bar)} — the ${hhmm(s, e.setBar)} resume ended ${word}: ${why}. The HOLD rail is taken down; the shelf stays.`,
      });
    }
    events.sort((a, b) => a.i - b.i || (b.weight ?? 0) - (a.weight ?? 0));

    // ---- example hygiene (DEVIATIONS 6): what was born before the first shown bar is not drawn
    const R0 = s.replayFrom;
    /** a reported resume is live at k, and it was stamped on a shown bar */
    const liveShown = (k: number) => LIVE[k] === 1 && reported(LGRADE[k]) && SETBAR[k] >= R0;
    /** ranging at k, on a range anchored on a shown bar */
    const rangeShown = (k: number) => BIAS[k] === 0 && isFinite(RHI[k]) && RANCHOR[k] >= R0;

    // ---------------------------------------------------------------- panel frame (.cs Reserves)
    const frame = (d: Draw) => {
      const pv = d.pane("tr") as (PaneView & { _tr?: { bodyTop: number; bodyBot: number } }) | undefined;
      if (!pv) return null;
      if (pv._tr) return pv;
      const ph = pv.bottom - pv.top;
      const tot = 1.0 + HEAD_T + FOOT_T;
      const hPx = Math.min(HEAD_ROW + HEAD_AIR + RIB_H + RIB_GAP, (ph * HEAD_T) / tot);
      const fPx = Math.min(RNG_PAD + RNG_H + FOOT_AIR, (ph * FOOT_T) / tot);
      const body = ph - hPx - fPx;
      let headV = 100 * HEAD_T, footV = 100 * FOOT_T;
      if (body > 1) { const per = 100 / body; headV = hPx * per; footV = fPx * per; }
      const lo = 0 - footV, hi = 100 + headV, top = pv.top;
      pv.lo = lo; pv.hi = hi;
      pv.y = (v: number) => top + ((hi - v) / (hi - lo)) * ph;
      pv.v = (y: number) => hi - ((y - top) / ph) * (hi - lo);
      pv._tr = { bodyTop: Math.max(pv.top, pv.y(100)), bodyBot: Math.min(pv.bottom, pv.y(0)) };
      return pv;
    };

    const tierColor = (P: Pal, st: number): RGB =>
      st === ST_UP || st === ST_PULL_UP ? P.bull : st === ST_STRONG_UP ? P.sBull : st === ST_DN || st === ST_PULL_DN ? P.bear : st === ST_STRONG_DN ? P.sBear : P.neutral;
    const tierCode = (st: number) => (st === ST_UP || st === ST_PULL_UP ? 2 : st === ST_STRONG_UP ? 3 : st === ST_DN || st === ST_PULL_DN ? 4 : st === ST_STRONG_DN ? 5 : 1);
    const stateColor = (P: Pal, st: number) => {
      switch (st) {
        case ST_UP: return A(P.bull, 0.66);
        case ST_STRONG_UP: return A(P.sBull, 0.95);
        case ST_PULL_UP: return A(P.bull, 0.28);
        case ST_DN: return A(P.bear, 0.66);
        case ST_STRONG_DN: return A(P.sBear, 0.95);
        case ST_PULL_DN: return A(P.bear, 0.28);
      }
      return null;
    };
    const rangeCode = (p: number) => (isNaN(p) ? 0 : p >= POS_EDGE_HI ? 5 : p >= POS_HI ? 4 : p <= POS_EDGE_LO ? 1 : p <= POS_LO ? 2 : 3);

    /** readout text + colour as the .cs header builds it, for bar b (live edge = the cursor). */
    const readoutOf = (P: Pal | null, b: number, liveEdge: boolean): { txt: string; tone: Tone; col: RGB | null } => {
      const st = STATE[b], ev = EVENT[b], q = QUAL[b], bullSt = isBullSt(st);
      if (ev === 1 || ev === -1) {
        const bb = ev > 0;
        return { txt: `RESUME ${bb ? `${UPA} LONG` : `${DNA} SHORT`}${q >= Q_PRIME ? `${DOT}PRIME` : q < Q_STANDARD ? `${DOT}MINOR` : ""}`, tone: q >= Q_PRIME ? (bb ? "strongBull" : "strongBear") : bb ? "bull" : "bear", col: P ? (q >= Q_PRIME ? (bb ? P.sBull : P.sBear) : bb ? P.bull : P.bear) : null };
      }
      if (ev === 2 || ev === -2) {
        const bb = ev > 0;
        return { txt: `TREND ${bb ? UPA : DNA}${DOT}STARTED`, tone: bb ? "bull" : "bear", col: P ? (bb ? P.bull : P.bear) : null };
      }
      if (st === ST_RANGE) {
        const age = liveEdge && REGBAR[b] >= R0 ? b - REGBAR[b] : -1;
        return { txt: `RANGING${age > 0 ? `${DOT}${barsWord(age)}` : ""}`, tone: "neutral", col: P ? P.ink : null };
      }
      if (st === ST_PULL_UP || st === ST_PULL_DN) {
        const age = liveEdge && ARMED[b] && ARMBAR[b] >= R0 ? b - ARMBAR[b] + 1 : -1;
        return { txt: `PULLBACK ${bullSt ? UPA : DNA}${age > 0 ? `${DOT}${barsWord(age)}` : ""}`, tone: bullSt ? "bull" : "bear", col: P ? (bullSt ? P.bull : P.bear) : null };
      }
      const strong = st === ST_STRONG_UP || st === ST_STRONG_DN;
      const age = liveEdge && REGBAR[b] >= R0 ? b - REGBAR[b] : -1;
      return { txt: `${strong ? "STRONG" : "TREND"} ${bullSt ? UPA : DNA}${age > 0 ? `${DOT}${barsWord(age)}` : ""}`, tone: strong ? (bullSt ? "strongBull" : "strongBear") : bullSt ? "bull" : "bear", col: P ? (strong ? (bullSt ? P.sBull : P.sBear) : bullSt ? P.bull : P.bear) : null };
    };
    /** the HOLD chip, or how the last reported resume ended (within 120 bars). */
    const holdChip = (b: number): { txt: string; tone: Tone; kind: "hold" | "life" } | null => {
      if (liveShown(b)) return { txt: `HOLD ${fmtP(HOLD[b], tick)}`, tone: LGRADE[b] >= Q_PRIME ? (LDIR[b] > 0 ? "strongBull" : "strongBear") : LDIR[b] > 0 ? "bull" : "bear", kind: "hold" };
      if (SETBAR[b] >= R0 && SETLIFE[b] !== LIFE_LIVE && reported(SETGRADE[b])) {
        const age = b - SETBAR[b];
        if (age > 0 && age <= 120) {
          const bb = SETDIR[b] > 0;
          return { txt: `RESUME ${bb ? UPA : DNA} ${lifeWord(SETLIFE[b], bb)}${DOT}${barsWord(age)} ago`, tone: SETLIFE[b] === LIFE_RESUMED ? (bb ? "bull" : "bear") : "neutral", kind: "life" };
        }
      }
      return null;
    };

    // ---------------------------------------------------------------- price pane
    const drawPrice = (d: Draw, P: Pal) => {
      const pv = d.price, k = d.k, ground = A(P.ground, 1);
      // shelves + chevrons (persist)
      for (const m of marks) {
        if (m.bar > k) break;
        if (m.bar < d.i0 - 1 || m.from > d.i1 + 1) continue;
        const ax = d.x(m.bar), ay = pv.y(m.hold);
        if (ay < pv.top - 40 || ay > pv.bottom + 40) continue;
        const hue = A(m.prime ? (m.up ? P.sBull : P.sBear) : m.up ? P.bull : P.bear, 1);
        const bodyW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
        const r = Math.max(5.5, Math.min(11, bodyW * 1.25));
        const half = Math.max(2, bodyW + 1.5);
        const xFrom = d.x(m.from);
        const xa = Math.min(xFrom - half, ax - r - 2), xb = ax + Math.max(half, r + 2);
        const ys = Math.round(ay);
        if (xb - xa >= 2 && ys >= pv.top && ys <= pv.bottom) {
          d.line([[xa - 1, ys], [xb + 1, ys]], ground, 4);
          d.line([[xa, ys], [xb, ys]], hue, 2);
        }
        drawMark(d, ax, ay, m.up, hue, ground, "T", m.prime);
      }
      // rails — live levels at the cursor
      if (!d.on("rails") || d.i1 < k || k < 1) return;
      const rails: { from: number; p: number; word: string; col: RGB }[] = [];
      if (liveShown(k)) rails.push({ from: LPB[k], p: HOLD[k], word: "HOLD", col: LGRADE[k] >= Q_PRIME ? (LDIR[k] > 0 ? P.sBull : P.sBear) : LDIR[k] > 0 ? P.bull : P.bear });
      if (rangeShown(k) && k >= NS) {
        rails.push({ from: RANCHOR[k], p: RHI[k], word: "RANGE HIGH", col: P.neutral });
        rails.push({ from: RANCHOR[k], p: RLO[k], word: "RANGE LOW", col: P.neutral });
      }
      const xR = d.plotRight - 2;
      for (const r of rails) {
        const y0 = pv.y(r.p);
        if (y0 < pv.top - 2 || y0 > pv.bottom + 2) continue;
        const y = Math.floor(y0) + 0.5;
        const hue = A(r.col, 0.92);
        const tw = d.measure(r.word, { size: 9, weight: 700 }) + 8;
        const x0 = Math.max(0, d.x(r.from));
        if (xR - tw - 3 > x0) d.line([[x0, y], [xR - tw - 3, y]], hue, 1, [2, 2]);
        const top = Math.floor(y - 7) + 0.5;
        d.rect(xR - tw, top, xR, top + 14, A(P.ground, 0.88), hue);
        d.text(r.word, xR - tw + 4, y + 0.5, { color: hue, size: 9, weight: 700 });
        d.tag(pv, r.p, fmtP(r.p, tick), A(r.col, 1), P.light ? "#fff" : "#000");
      }
    };

    // ---------------------------------------------------------------- the panel
    const drawPanel = (d: Draw, P: Pal) => {
      const pv = frame(d);
      if (!pv || !pv._tr) return;
      const { bodyTop, bodyBot } = pv._tr;
      const ctx = d.ctx, k = d.k;
      const bFrom = Math.max(0, d.i0), bTo = Math.min(d.i1, k);
      if (bTo < bFrom) return;
      const x1 = 2, x2 = d.plotRight - 2;
      const BY = (v: number) => Math.max(bodyTop, Math.min(bodyBot, pv.y(v)));
      const ink = (a: number) => A(P.ink, a);
      const paintW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      ctx.save(); ctx.beginPath(); ctx.rect(0, pv.top, d.plotRight, pv.bottom - pv.top); ctx.clip();

      const band = bodyTop - pv.top, foot = pv.bottom - bodyBot;
      const ribOn = band >= HEAD_ROW + RIB_GAP + RIB_H + 0.5;
      const ribY = bodyTop - RIB_GAP - RIB_H;
      const rngOn = foot >= RNG_PAD + RNG_H + 0.5;
      const rngY = bodyBot + RNG_PAD;
      const fits = bodyBot - bodyTop >= 12;

      /** FillTier: the area between vals and level over runs of `code`, crossings interpolated. */
      const fillTier = (vals: Float64Array, level: number, codeOf: (i: number) => number, code: number, col: string) => {
        const yL = BY(level);
        ctx.beginPath();
        let a0 = -1, figs = 0;
        for (let i = bFrom; i <= bTo + 1; i++) {
          const inRun = i <= bTo && codeOf(i) === code;
          if (inRun) { if (a0 < 0) a0 = i; continue; }
          if (a0 < 0) continue;
          const a = a0, b = i - 1;
          a0 = -1;
          const xa = d.x(a), ya = BY(vals[a]);
          const p = a - 1;
          if (p < bFrom || isNaN(vals[p])) { ctx.moveTo(xa, yL); ctx.lineTo(xa, ya); }
          else {
            const xp = d.x(p);
            if ((vals[p] - level) * (vals[a] - level) <= 0) {
              const den = vals[a] - vals[p];
              let t = den !== 0 ? (level - vals[p]) / den : 0; t = Math.max(0, Math.min(1, t));
              ctx.moveTo(xp + (xa - xp) * t, yL); ctx.lineTo(xa, ya);
            } else {
              const xm = (xp + xa) * 0.5, ym = (BY(vals[p]) + ya) * 0.5;
              ctx.moveTo(xm, yL); ctx.lineTo(xm, ym); ctx.lineTo(xa, ya);
            }
          }
          for (let j = a + 1; j < b; j++) ctx.lineTo(d.x(j), BY(vals[j]));
          const xb = d.x(b), yb = BY(vals[b]);
          if (b > a) ctx.lineTo(xb, yb);
          const q = b + 1;
          if (q > bTo || isNaN(vals[q])) ctx.lineTo(xb, yL);
          else {
            const xq = d.x(q);
            if ((vals[q] - level) * (vals[b] - level) <= 0) {
              const den = vals[q] - vals[b];
              let t = den !== 0 ? (level - vals[b]) / den : 1; t = Math.max(0, Math.min(1, t));
              ctx.lineTo(xb + (xq - xb) * t, yL);
            } else {
              const xm = (xb + xq) * 0.5, ym = (yb + BY(vals[q])) * 0.5;
              ctx.lineTo(xm, ym); ctx.lineTo(xm, yL);
            }
          }
          ctx.closePath(); figs++;
        }
        if (figs) { ctx.fillStyle = col; ctx.fill(); }
      };
      /** StrokeTier: the segment into bar i takes bar i's code. */
      const strokeTier = (vals: Float64Array, codeOf: (i: number) => number, code: number, col: string, width: number) => {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath();
        let open = false, segs = 0, prev = -1;
        for (let i = Math.max(0, bFrom - 1); i <= bTo; i++) {
          const v = vals[i], ok = !isNaN(v);
          const mine = ok && prev >= 0 && codeOf(i) === code;
          if (mine) {
            if (!open) { ctx.moveTo(d.x(prev), BY(vals[prev])); open = true; }
            ctx.lineTo(d.x(i), BY(v)); segs++;
          } else open = false;
          prev = ok ? i : -1;
        }
        if (segs) ctx.stroke();
        ctx.restore();
      };

      if (fits) {
        // guides
        const yP = Math.floor(BY(PHASE_P1)), yM = Math.floor(BY(PHASE_M1)), yC = Math.floor(BY(PHASE_MID));
        if (yP > bodyTop) { ctx.fillStyle = A(P.bull, 0.055); ctx.fillRect(x1, bodyTop, x2 - x1, yP - bodyTop); }
        if (bodyBot > yM) { ctx.fillStyle = A(P.bear, 0.055); ctx.fillRect(x1, yM, x2 - x1, bodyBot - yM); }
        ctx.fillStyle = ink(0.2); ctx.fillRect(x1, yP, x2 - x1, 1); ctx.fillRect(x1, yM, x2 - x1, 1);
        d.line([[x1, yC + 0.5], [x2, yC + 0.5]], ink(0.3), 1, [3, 3]);
        const showSwing = d.on("swing");
        // wave body
        if (showSwing) {
          const cd = (i: number) => (isNaN(SWG[i]) ? 0 : SWG[i] > PHASE_MID ? 1 : SWG[i] < PHASE_MID ? 2 : 0);
          fillTier(SWG, PHASE_MID, cd, 1, ink(0.06));
          fillTier(SWG, PHASE_MID, cd, 2, ink(0.06));
        }
        // trend field
        {
          const up = (i: number) => (!isNaN(TRD[i]) && TRD[i] > PHASE_P1 ? (TZ[i] >= SIGMA_STRONG ? 2 : 1) : 0);
          fillTier(TRD, PHASE_P1, up, 1, A(P.bull, 0.24));
          fillTier(TRD, PHASE_P1, up, 2, A(P.sBull, 0.34));
          const dn = (i: number) => (!isNaN(TRD[i]) && TRD[i] < PHASE_M1 ? (TZ[i] <= -SIGMA_STRONG ? 2 : 1) : 0);
          fillTier(TRD, PHASE_M1, dn, 1, A(P.bear, 0.24));
          fillTier(TRD, PHASE_M1, dn, 2, A(P.sBear, 0.34));
        }
        // pockets
        if (showSwing) {
          const pu = (i: number) => (STATE[i] === ST_PULL_UP && SWG[i] < PHASE_MID ? (SWG[i] <= PHASE_M1 ? 2 : 1) : 0);
          fillTier(SWG, PHASE_MID, pu, 1, A(P.bull, 0.34));
          fillTier(SWG, PHASE_MID, pu, 2, A(P.bull, 0.58));
          const pd = (i: number) => (STATE[i] === ST_PULL_DN && SWG[i] > PHASE_MID ? (SWG[i] >= PHASE_P1 ? 2 : 1) : 0);
          fillTier(SWG, PHASE_MID, pd, 1, A(P.bear, 0.34));
          fillTier(SWG, PHASE_MID, pd, 2, A(P.bear, 0.58));
          // swing line
          const sc = (i: number) => (STATE[i] === ST_RANGE ? 1 : 2);
          strokeTier(SWG, sc, 1, ink(0.3), 1);
          strokeTier(SWG, sc, 2, ink(0.58), 1);
        }
        // trend line: ground shadow, then tiers
        const w = Math.max(1, LINE_WIDTH) + 0.4;
        {
          ctx.save(); ctx.strokeStyle = A(P.ground, 0.55); ctx.lineWidth = w * 0.85; ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.beginPath();
          for (let i = bFrom; i <= bTo; i++) { const y = BY(TRD[i]) + 1.7; if (i === bFrom) ctx.moveTo(d.x(i), y); else ctx.lineTo(d.x(i), y); }
          ctx.stroke(); ctx.restore();
          const tc = (i: number) => tierCode(STATE[i]);
          strokeTier(TRD, tc, 1, A(P.neutral, 0.96), w);
          strokeTier(TRD, tc, 2, A(P.bull, 0.96), w);
          strokeTier(TRD, tc, 4, A(P.bear, 0.96), w);
          strokeTier(TRD, tc, 3, A(P.sBull, 0.96), w);
          strokeTier(TRD, tc, 5, A(P.sBear, 0.96), w);
        }
        // value chip at the right edge
        {
          const v = TRD[bTo];
          if (!isNaN(v)) {
            let cy = BY(v);
            cy = Math.max(bodyTop + 6.5, Math.min(bodyBot - 6.5, cy));
            const tx = String(Math.round(v));
            const cw = 9 + d.measure(tx, { size: 9, weight: 600 });
            ctx.fillStyle = A(tierColor(P, STATE[bTo]), 0.92); ctx.fillRect(x2 - cw - 1, cy - 6.5, cw, 13);
            d.text(tx, x2 - cw + 3, cy + 0.5, { size: 9, weight: 600, color: A(P.ground, 1) });
          }
        }
      }
      // ribbon
      if (ribOn) {
        const yT = ribY, h = RIB_H;
        ctx.fillStyle = A(P.neutral, 0.14); ctx.fillRect(x1, yT, x2 - x1, h);
        const cellW = Math.max(d.bw, paintW);
        let runSt = -1, runA = 0, runB = 0;
        const flush = () => {
          const col = runSt > 0 ? stateColor(P, runSt) : null;
          if (col) { const ra = Math.max(x1, runA), rb = Math.min(x2, runB); if (rb > ra) { ctx.fillStyle = col; ctx.fillRect(ra, yT, rb - ra, h); } }
        };
        for (let i = bFrom; i <= bTo; i++) {
          const st = STATE[i], xa = d.x(i) - cellW * 0.5, xb = xa + cellW;
          if (st === runSt && xa <= runB + 0.51) { runB = xb; continue; }
          flush(); runSt = st; runA = xa; runB = xb;
        }
        flush();
        // events on the ribbon
        const cy = yT + h * 0.5;
        const r = Math.max(2.2, Math.min(4.2, Math.min(paintW * 0.5 + 1.6, h * 0.44 + 1.2)));
        for (let i = bFrom; i <= bTo; i++) {
          const e = EVENT[i];
          if (e === 0) continue;
          const x = d.x(i), up = e > 0;
          if (e === 2 || e === -2) {
            const rr = Math.max(1.5, r * 0.5);
            ctx.fillStyle = A(P.ground, 1); ctx.beginPath(); ctx.arc(x, cy, rr + 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = ink(0.92); ctx.beginPath(); ctx.arc(x, cy, rr, 0, Math.PI * 2); ctx.fill();
            continue;
          }
          const q = QUAL[i];
          const hue = q >= Q_PRIME ? (up ? P.sBull : P.sBear) : P.ink;
          const lw = q >= Q_PRIME ? 1.8 : q >= Q_STANDARD ? 1.5 : 1.0;
          const a = q >= Q_STANDARD ? 0.98 : 0.66;
          const chev = (col: string, width: number) => {
            const rise = r * 0.62, yb = up ? cy + rise * 0.5 : cy - rise * 0.5, yt = up ? cy - rise * 0.5 : cy + rise * 0.5;
            ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
            ctx.beginPath(); ctx.moveTo(x - r, yb); ctx.lineTo(x, yt); ctx.lineTo(x + r, yb); ctx.stroke(); ctx.restore();
          };
          chev(A(P.ground, 1), lw + 2.0);
          chev(A(hue, a), lw);
        }
        if (x2 - x1 > 200) {
          ctx.fillStyle = A(P.ground, 0.88); ctx.fillRect(x1, yT, 36, h);
          d.text("T", x1 + 3, yT + h / 2 + 0.5, { size: 7.5, weight: 700, color: ink(0.9), font: "sans" });
          d.text("STATE", x1 + 12, yT + h / 2 + 0.5, { size: 7, weight: 600, color: ink(0.5) });
        }
      }
      // range row
      if (rngOn) {
        const yT = rngY;
        ctx.fillStyle = A(P.neutral, 0.1); ctx.fillRect(x1, yT, x2 - x1, RNG_H);
        const cellW = Math.max(d.bw, paintW);
        let runC = -1, runA = 0, runB = 0;
        const flush = () => {
          if (runC > 0) {
            const ra = Math.max(x1, runA), rb = Math.min(x2, runB);
            if (rb > ra) {
              ctx.fillStyle = runC === 5 ? A(P.sBull, 0.95) : runC === 4 ? A(P.bull, 0.62) : runC === 2 ? A(P.bear, 0.62) : runC === 1 ? A(P.sBear, 0.95) : A(P.neutral, 0.34);
              ctx.fillRect(ra, yT, rb - ra, RNG_H);
            }
          }
        };
        for (let i = bFrom; i <= bTo; i++) {
          const c = rangeCode(RPOS[i]), xa = d.x(i) - cellW * 0.5, xb = xa + cellW;
          if (c === runC && xa <= runB + 0.51) { runB = xb; continue; }
          flush(); runC = c; runA = xa; runB = xb;
        }
        flush();
        if (x2 - x1 > 200) {
          ctx.fillStyle = A(P.ground, 0.88); ctx.fillRect(x1, yT - 1, 38, RNG_H + 2);
          d.text("RANGE", x1 + 3, yT + RNG_H / 2 + 0.5, { size: 7, weight: 600, color: ink(0.5) });
        }
      }
      // header
      if (d.plotRight >= 200) {
        const headH = Math.min(HEAD_ROW, Math.max(1, pv.bottom - pv.top - 1));
        const xMin = x1 + 14 + d.measure("DS ProTrendRange", { size: 10.5 }) + 10;
        let right = x2 - 2;
        const rowO = { size: 9, weight: 600 } as const;
        const chip = (txt: string, col: RGB) => {
          const w = 9 + d.measure(txt, rowO);
          if (right - w < xMin) return;
          const hh = Math.max(1, Math.min(14, headH - 1));
          ctx.fillStyle = A(P.ground, 0.78); ctx.fillRect(right - w, pv.top + 1, w, hh);
          ctx.fillStyle = A(col, 0.9); ctx.fillRect(right - w, pv.top + 1, 2, hh);
          d.text(txt, right - w + 5, pv.top + 1 + hh / 2 + 0.5, { ...rowO, color: A(col, 0.92) });
          right -= w + 6;
        };
        const liveEdge = bTo === k;
        const ro = readoutOf(P, bTo, liveEdge);
        let txt = ro.txt;
        const rO = { size: 10.5, weight: 700 } as const;
        let rw = 8 + d.measure(txt, rO);
        if (right - rw < xMin) { const cut = txt.indexOf(DOT); if (cut > 0) { txt = txt.slice(0, cut); rw = 8 + d.measure(txt, rO); } }
        if (right - rw >= xMin) {
          ctx.fillStyle = A(P.ground, 0.78); ctx.fillRect(right - rw, pv.top + 0.5, rw, headH);
          d.text(txt, right - rw + 4, pv.top + 1.5 + HEAD_ROW / 2, { ...rO, color: A(ro.col!, 0.95) });
          right -= rw + 6;
        }
        if (d.plotRight >= 700) {
          const tr = TRD[bTo], sw = SWG[bTo], rp = RPOS[bTo];
          if (!isNaN(tr)) chip(`TREND ${Math.round(tr)}`, tierColor(P, STATE[bTo]));
          if (!isNaN(sw)) chip(`SWING ${Math.round(sw)}`, P.ink);
          if (!isNaN(rp)) chip(`RANGE ${Math.round(rp)}%`, rp >= POS_HI ? P.bull : rp <= POS_LO ? P.bear : P.ink);
          if (liveEdge && d.plotRight >= 900) {
            const hc = holdChip(bTo);
            if (hc) {
              const col = hc.kind === "hold" ? (hc.tone === "strongBull" ? P.sBull : hc.tone === "strongBear" ? P.sBear : hc.tone === "bull" ? P.bull : P.bear) : hc.tone === "bull" ? P.bull : hc.tone === "bear" ? P.bear : P.neutral;
              chip(hc.txt, col);
            }
          }
        }
        if (!fits && d.plotRight > 300) chip("panel too short for the trend line", P.ink);
      }
      ctx.restore();
    };

    return {
      events,
      priceExtent: (_i0, i1, k) => {
        if (i1 < k) return null;
        const v: number[] = [];
        if (liveShown(k)) v.push(HOLD[k]);
        if (rangeShown(k)) v.push(RHI[k], RLO[k]);
        const c = s.c[k];
        const near = v.filter((x) => isFinite(x) && Math.abs(x - c) <= 80);
        return near.length ? [Math.min(...near), Math.max(...near)] : null;
      },
      paneExtent: () => [0, 100],
      under: (d) => { frame(d); },
      draw: (d) => {
        const P = palette(d.th.bg);
        drawPrice(d, P);
        drawPanel(d, P);
      },
      status: (k) => {
        const ro = readoutOf(null, k, true);
        const out: ReadItem[] = [
          { label: "State", value: ro.txt, tone: ro.tone },
          { label: "Trend", value: `${Math.round(TRD[k])}`, tone: STATE[k] === ST_RANGE ? "neutral" : isBullSt(STATE[k]) ? (STATE[k] === ST_STRONG_UP ? "strongBull" : "bull") : STATE[k] === ST_STRONG_DN ? "strongBear" : "bear" },
          { label: "Swing", value: `${Math.round(SWG[k])}` },
          { label: "Range", value: `${Math.round(RPOS[k])}%`, tone: RPOS[k] >= POS_HI ? "bull" : RPOS[k] <= POS_LO ? "bear" : undefined },
        ];
        const hc = holdChip(k);
        if (hc) out.push({ label: hc.kind === "hold" ? "Hold" : "Last resume", value: hc.kind === "hold" ? hc.txt.replace("HOLD ", "") : hc.txt.replace(/^RESUME /, ""), tone: hc.tone });
        else if (rangeShown(k)) out.push({ label: "Range rails", value: `${fmtP(RLO[k], tick)} – ${fmtP(RHI[k], tick)}` });
        return out;
      },
      readout: (i) => {
        const ro = readoutOf(null, i, false);
        const r: ReadItem[] = [
          { label: "State", value: ro.txt, tone: ro.tone },
          { label: "Trend", value: `${TRD[i].toFixed(1)} · ${TZ[i] >= 0 ? "+" : ""}${TZ[i].toFixed(2)}σ` },
          { label: "Swing", value: `${SWG[i].toFixed(1)} · ${SZ[i] >= 0 ? "+" : ""}${SZ[i].toFixed(2)}σ` },
          { label: "Range position", value: `${Math.round(RPOS[i])}%` },
        ];
        if (isFinite(HOLD[i]) && SETBAR[i] >= R0) r.push({ label: "Hold", value: fmtP(HOLD[i], tick) });
        if (isFinite(RHI[i]) && RANCHOR[i] >= R0) r.push({ label: "Range rails", value: `${fmtP(RLO[i], tick)} – ${fmtP(RHI[i], tick)}` });
        return r;
      },
      legend: [
        { label: "TREND (50)", color: "#009999", shape: "line" },
        { label: "STRONG", color: "#00FFFF", shape: "line" },
        { label: "SWING (10)", color: "#7C848D", shape: "line" },
        { label: "Pocket (pullback)", color: "#009999", shape: "box" },
        { label: "RESUME shelf + T", color: "#009999", shape: "dash" },
        { label: "RANGE HIGH / LOW", color: "#7A7A7A", shape: "dash" },
      ],
    };
  },
};
