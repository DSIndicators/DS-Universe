import type { Draw, PaneView, ReadItem, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm } from "../ta";

/**
 * DS Squeeze — web edition. Source: DSSqueeze.cs (Build 2026-10-05), shipped
 * defaults from ApplyDefaults(): Normalized scale, Length 20, Bollinger 2.0,
 * channels 1.5 / 1.0 / 2.0 ATR, ADX 14 (quiet <= 20), waves 8 / 34 / 89 / 233,
 * RSI 9 (65 / 35), reversion band EMA 25 ± 2.5 x ATR(25), Minimum squeeze bars 6,
 * Release margin 0.10, momentum must be growing, Minimum fire grade 1, early
 * entries on, run ends after 2 fading bars, reversion on (ADX ceiling 30, one
 * setup per excursion, 1.0 R, 40-bar life). Calculate = OnBarClose.
 *
 * PORTED (line for line from ComputeBar / SetupEngine / the render passes):
 *  · compression = Bollinger half-width / mean true range over the same 20 bars,
 *    the tier (DEEP <= 1.0, SQUEEZE <= 1.5, COILING <= 2.0), the latched squeeze
 *    with its 0.10 release margin;
 *  · TTM momentum (linear regression of close - mean(midrange, EMA)) x 100 / ATR;
 *  · the three waves, Wilder ADX seeded as NinjaTrader seeds it, Wilder RSI(9),
 *    the EMA(25) reversion mean and its ±2.5 ATR band;
 *  · the engine: fire (grade PRIME / GOOD / FAIR / BARE / AGAINST FLOW, reported
 *    at grade >= 1), the run and its end (side change, new squeeze, two fading
 *    bars), the EARLY mark (A wave hooking back, once per squeeze), the reversion
 *    setup and its lifecycle (HIT THE MEAN / STOPPED / CANCELED / EXPIRED);
 *  · the panel: momentum field, coil on the centerline with release ticks, the
 *    momentum line with its ground bevel, the overflow rule, value chip, state
 *    ribbon with event chevrons, the A / B / C wave rows, the readout and the
 *    ADX / WAVES / RSI / last-fire / last-reversion chips; the latched frame
 *    (99th percentile of the last 1,500 bars, ladder 100 / 150 / 200 / 300 …,
 *    stepped out only by a new extreme);
 *  · on price: the chevron at the wick (doubled at PRIME), the reversion chevron
 *    with its bar, the Q source letter, and the dashed MEAN rail while a setup
 *    is live. The tool's own light-chart palette (Deepen 0.62 / Mix 0.12).
 *
 * DEVIATIONS
 *  · Frame fit: NinjaTrader fits the frame once from the history it has loaded
 *    when the panel first renders. Here that moment is the bar before the replay
 *    starts; from then on the frame steps out bar by bar exactly as FitTo() does.
 *  · Mark history (750 bars) is counted back from the replay start for history
 *    bars, because in a live chart it is counted from the newest bar.
 *  · DS LABEL BUS: only one DS panel is on this chart, so no mark is ever moved
 *    aside for another panel's mark.
 *  · Panel text uses the site's mono face instead of Segoe UI; widths are
 *    measured rather than estimated per character.
 *  · Alerts and the DS Toolkit master switch have no web equivalent.
 *  · Narration: every reported fire, early entry and reversion setup, each setup's
 *    end, the end of each reported run, every squeeze start, and every release
 *    of a squeeze that ran the 6-bar minimum (tracked fires below the minimum
 *    grade included). The tool marks the first three; the rest are the state
 *    changes its ribbon and readout show. A squeeze shorter than the minimum
 *    simply ends on the ribbon, unnarrated — the tool never weighs it.
 *  · Example hygiene (web showcase): the LAST FIRE / LAST REVERSION chips in the
 *    header and the status line only report a fire or reversion setup born at
 *    or after the first shown bar, so a chart never opens describing warm-up
 *    history ("FIRE ▲ PRIME · 40 bars ago" from before the stage). Computation
 *    is unchanged; in NinjaTrader the chip reports any fire in the last 120 bars.
 */

// ------------------------------------------------------------------ shipped defaults
const L = 20, BB = 2.0, KC_SQZ = 1.5, KC_DEEP = 1.0, KC_OUTER = 2.0;
const ADX_P = 14, ADX_QUIET = 20, WAVE_FAST = 8, WAVE_A = 34, WAVE_B = 89, WAVE_C = 233;
const RSI_P = 9, RSI_OB = 65, RSI_OS = 35, BAND_L = 25, BAND_ATR = 25, BAND_MULT = 2.5;
const MIN_SQZ = 6, REL_MARGIN = 0.1, MIN_GRADE = 1, FADE = 2;
const REV_ADX = 30, REV_RISK = 1.0, REV_LIFE = 40, MARK_HISTORY = 750, LINE_W = 2;
const FIT_BARS = 1500, PQ_MAX = 2000;
const PQ_LADDER = [100, 150, 200, 300, 450, 650, 1000, 1500, 2500, 5000];

const ST_QUIET = 0, ST_COIL = 1, ST_SQZ = 2, ST_DEEP = 3, ST_FIRE_L = 4, ST_FIRE_S = 5, ST_REV_L = 6, ST_REV_S = 7;
const STATE_WORD = ["QUIET", "COILING", "SQUEEZE", "SQUEEZE DEEP", "FIRED", "FIRED", "REVERSION", "REVERSION"];
const LIFE_WORD = ["", "HIT THE MEAN", "STOPPED", "CANCELED", "EXPIRED"];
const UP = "▲", DN = "▼";

// panel layout (px), as the .cs reserves it
const RIB_H = 6, RIB_GAP = 2, HEAD_ROW = 15, HEAD_AIR = 3, WAVE_H = 3, WAVE_GAP = 1, WAVE_PAD = 2, FOOT_AIR = 2;
const HEAD_T = 0.22, FOOT_T = 0.13;
const HEAD_PX = HEAD_ROW + RIB_GAP + RIB_H + HEAD_AIR;
const FOOT_PX = WAVE_PAD + 3 * WAVE_H + 2 * WAVE_GAP + FOOT_AIR;

// ------------------------------------------------------------------ colours (the .cs palette)
type C3 = [number, number, number];
const C = (r: number, g: number, b: number): C3 => [r / 255, g / 255, b / 255];
const BULL = C(0, 153, 153), BEAR = C(163, 61, 255), SQZ = C(240, 163, 92);
const S_BULL = C(0, 255, 255), S_BEAR = C(255, 0, 255), NEUTRAL = C(128, 136, 148);
const css = (c: C3, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
const srgb = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (c: C3) => 0.2126 * srgb(c[0]) + 0.7152 * srgb(c[1]) + 0.0722 * srgb(c[2]);
const lerp = (a: C3, b: C3, t: number): C3 => { t = Math.max(0, Math.min(1, t)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
const hexC = (h: string): C3 => { const n = parseInt(h.slice(1, 7), 16); return C((n >> 16) & 255, (n >> 8) & 255, n & 255); };

type Pal = { light: boolean; ground: C3; bull: C3; bear: C3; sqz: C3; sBull: C3; sBear: C3; neutral: C3; ink: C3 };
const palCache = new Map<string, Pal>();
function palette(bgHex: string): Pal {
  let p = palCache.get(bgHex);
  if (p) return p;
  const ground = hexC(bgHex), light = lum(ground) > 0.45;
  const lit = (c: C3): C3 => (light ? [c[0] * 0.62, c[1] * 0.62, c[2] * 0.62] : [c[0] + (1 - c[0]) * 0.12, c[1] + (1 - c[1]) * 0.12, c[2] + (1 - c[2]) * 0.12]);
  p = { light, ground, bull: lit(BULL), bear: lit(BEAR), sqz: lit(SQZ), sBull: lit(S_BULL), sBear: lit(S_BEAR), neutral: NEUTRAL, ink: light ? [0.16, 0.18, 0.22] : [0.84, 0.86, 0.9] };
  palCache.set(bgHex, p);
  return p;
}

const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const gradeWord = (q: number) => (q < 0 ? "AGAINST FLOW" : q >= 3 ? "PRIME" : q === 2 ? "GOOD" : q === 1 ? "FAIR" : "BARE");
const rung = (need: number) => { for (const r of PQ_LADDER) if (r >= need - 1e-9) return r; return need; };
const pct = (xs: number[], p: number) => { if (!xs.length) return 0; xs.sort((a, b) => a - b); const k = Math.max(0, Math.min(xs.length - 1, Math.floor(p * (xs.length - 1)))); return xs[k]; };
const f2 = (v: number) => (Math.round(v / 0.25) * 0.25).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ------------------------------------------------------------------ DS mark (DsSqMark.DrawDsMark)
const GAP = 9;
function chevron(d: Draw, cx: number, cy: number, r: number, w: number, col: string, up: boolean) {
  const rise = r * 0.62;
  const yb = up ? cy + rise * 0.5 : cy - rise * 0.5, yt = up ? cy - rise * 0.5 : cy + rise * 0.5;
  roundLine(d, [[cx - r, yb], [cx, yt], [cx + r, yb]], col, w);
}
function roundLine(d: Draw, pts: [number, number][], col: string, w: number) {
  const ctx = d.ctx;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
  ctx.stroke(); ctx.restore();
}
/** form 1 trigger, 2 prime (doubled), 3 level (chevron + bar) */
function dsMark(d: Draw, ax: number, ay: number, up: boolean, form: number, thin: boolean, r: number, hue: string, ground: string, rune: string | null) {
  const w = Math.max(1.3, Math.min(2.2, r * 0.34)) * (thin ? 0.65 : 1);
  const rise = r * 0.62, n = form === 2 ? 2 : 1, pitch = r * 0.95, span = rise + (n - 1) * pitch;
  const top = up ? ay + GAP : ay - GAP - span;
  for (let k = 0; k < n; k++) {
    const yb = up ? top + rise + k * pitch : top + k * pitch;
    const yt = up ? yb - rise : yb + rise;
    roundLine(d, [[ax - r, yb], [ax, yt], [ax + r, yb]], hue, w);
  }
  let tail = up ? top + span : top;
  if (form === 3) {
    const ybar = up ? tail + 3.5 : tail - 3.5;
    roundLine(d, [[ax - r * 0.8, ybar], [ax + r * 0.8, ybar]], hue, Math.max(1, w * 0.8));
    tail = ybar;
  }
  if (r < 4 || !rune) return;
  let fs = Math.max(9, Math.min(20, r * 1.9));
  fs = Math.floor(Math.max(7, Math.min(30, fs)) + 0.5);
  const h = fs * 1.45, ty = up ? tail + 2 : tail - h - 2, cy = ty + h / 2;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) d.text(rune, ax + dx, cy + dy, { color: ground, size: fs, weight: 700, align: "center", font: "sans" });
  d.text(rune, ax, cy, { color: hue, size: fs, weight: 700, align: "center", font: "sans" });
}

type Mark = { i: number; kind: number; bull: boolean; prime: boolean; low: boolean; y: number };

export const study: StudyDef = {
  slug: "squeeze",
  name: "DS Squeeze",
  about: "Compression in ATRs with the three Keltner tiers, the TTM momentum normalized by ATR, the waves and the ADX that grade each fire, and the reversion play — closed bars, shipped defaults.",
  panes: [{ id: "sq", title: "DS Squeeze", weight: 0.5, digits: 0 }],
  layers: [
    { id: "marks", label: "Marks on price", on: true, hint: "The fire and reversion chevrons and the MEAN rail on the price panel (Event marks on price, on by default)." },
    { id: "early", label: "Early marks on price", on: false, hint: "Also put the EARLY mark on price. Off by default in the tool; the ribbon carries every one of them." },
  ],
  run(s) {
    const n = s.n, H = s.h, Lo = s.l, Cl = s.c;
    const F = () => new Float64Array(n).fill(NaN);
    // plots
    const mom = F(), comp = F(), wa = F(), wb = F(), wc = F(), adx = F(), rsi = F(), mean = F(), upper = F(), lower = F(), atrA = F();
    const tier = new Int8Array(n), state = new Int8Array(n), event = new Int8Array(n), qual = new Int8Array(n);
    // recursive series
    const rEma = F(), rDev = F(), rE8 = F(), rEA = F(), rEB = F(), rEC = F(), rSA = F(), rSB = F(), rSC = F();
    const rDMP = F(), rDMM = F(), rTRS = F(), rUP = F(), rDN = F(), rBand = F();
    // engine snapshots (state after bar b's close)
    const sqOnA = new Uint8Array(n), sqBarsA = new Int32Array(n), runDirA = new Int8Array(n), runBarA = new Int32Array(n).fill(-1);
    const revDirA = new Int8Array(n), revBarA = new Int32Array(n).fill(-1), revStopA = F(), revRiskA = F(), reachA = F();
    const lfBarA = new Int32Array(n).fill(-1), lfDirA = new Int8Array(n), lfGradeA = new Int8Array(n);
    const lrBarA = new Int32Array(n).fill(-1), lrDirA = new Int8Array(n), lrLifeA = new Int8Array(n);
    const marks: Mark[] = [];
    const events: StudyEvent[] = [];
    const evFrom = Math.max(1, s.replayFrom - 1);
    const markFrom = s.replayFrom - 1 - MARK_HISTORY;

    const trAt = (j: number) => {
      let tr = H[j] - Lo[j];
      if (j >= 1) { const c1 = Cl[j - 1]; const d1 = Math.abs(H[j] - c1), d2 = Math.abs(Lo[j] - c1); if (d1 > tr) tr = d1; if (d2 > tr) tr = d2; }
      return tr;
    };
    const squeezeAt = (cp: number, wasOn: boolean) => !isNaN(cp) && cp <= (wasOn ? KC_SQZ * (1 + REL_MARGIN) : KC_SQZ);
    const wave = (b: number, inp: number, fast: number, slowP: number, rS: Float64Array, rG: Float64Array) => {
      const ks = 2 / (slowP + 1);
      const es = b === 0 ? inp : ks * inp + (1 - ks) * rS[b - 1];
      rS[b] = es;
      const macd = fast - es;
      const sig = b === 0 ? macd : ks * macd + (1 - ks) * rG[b - 1];
      rG[b] = sig;
      return macd - sig;
    };

    // engine fields
    let sqBars = 0, sqLatch = false, earlyDone = false, armLong = true, armShort = true;
    let runDir = 0, runBar = -1, revDir = 0, revBar = -1, revRisk = 0, revStop = 0;
    let lastFireBar = -1, lastFireDir = 0, lastFireGrade = 0, lastRevBar = -1, lastRevDir = 0, lastRevLife = 0;

    const provisional = (t: number, on: boolean) => on ? (t === 3 ? ST_DEEP : ST_SQZ) : runDir !== 0 ? (runDir > 0 ? ST_FIRE_L : ST_FIRE_S) : revDir !== 0 ? (revDir > 0 ? ST_REV_L : ST_REV_S) : t === 1 ? ST_COIL : ST_QUIET;

    for (let b = 0; b < n; b++) {
      // ------------------------------------------------ ComputeBar
      const inp = Cl[b], cnt = b + 1, m = Math.min(cnt, L), b0 = b === 0;
      let mu = 0;
      for (let i = 0; i < m; i++) mu += Cl[b - i];
      mu /= m;
      let ss = 0;
      for (let i = 0; i < m; i++) { const dd = Cl[b - i] - mu; ss += dd * dd; }
      const sd = Math.sqrt(ss / m);
      let atr = 0;
      for (let i = 0; i < m; i++) atr += trAt(b - i);
      atr /= m;
      const kL = 2 / (L + 1);
      const ema = b0 ? inp : kL * inp + (1 - kL) * rEma[b - 1];
      rEma[b] = ema;
      const cp = atr > 0 ? (BB * sd) / atr : NaN;
      const t = isNaN(cp) ? 0 : cp <= KC_DEEP ? 3 : cp <= KC_SQZ ? 2 : cp <= KC_OUTER ? 1 : 0;
      let hh = H[b], ll = Lo[b];
      for (let i = 1; i < m; i++) { if (H[b - i] > hh) hh = H[b - i]; if (Lo[b - i] < ll) ll = Lo[b - i]; }
      rDev[b] = inp - ((hh + ll) * 0.5 + ema) * 0.5;
      let mm = NaN;
      if (cnt >= L) {
        let sx = 0, sy = 0, sxy = 0, sxx = 0;
        for (let i = 0; i < L; i++) { const x = L - 1 - i, y = rDev[b - i]; sx += x; sy += y; sxy += x * y; sxx += x * x; }
        const den = L * sxx - sx * sx;
        if (den !== 0) { const slope = (L * sxy - sx * sy) / den; const ic = (sy - slope * sx) / L; mm = ic + slope * (L - 1); }
      }
      mom[b] = atr > 0 && !isNaN(mm) ? (100 * mm) / atr : NaN;
      const kf = 2 / (WAVE_FAST + 1);
      const e8 = b0 ? inp : kf * inp + (1 - kf) * rE8[b - 1];
      rE8[b] = e8;
      wa[b] = wave(b, inp, e8, WAVE_A, rEA, rSA);
      wb[b] = wave(b, inp, e8, WAVE_B, rEB, rSB);
      wc[b] = wave(b, inp, e8, WAVE_C, rEC, rSC);
      // ADX
      if (b0) { rDMP[0] = 0; rDMM[0] = 0; rTRS[0] = 0; adx[0] = 0; }
      else {
        const h0 = H[b], l0 = Lo[b], h1 = H[b - 1], l1 = Lo[b - 1];
        const dmP = h0 - h1 > l1 - l0 ? Math.max(h0 - h1, 0) : 0;
        const dmM = l1 - l0 > h0 - h1 ? Math.max(l1 - l0, 0) : 0;
        const tr = trAt(b);
        let sDP, sDM, sTR;
        if (b < ADX_P) { sDP = rDMP[b - 1] + dmP; sDM = rDMM[b - 1] + dmM; sTR = rTRS[b - 1] + tr; }
        else { sDP = rDMP[b - 1] - rDMP[b - 1] / ADX_P + dmP; sDM = rDMM[b - 1] - rDMM[b - 1] / ADX_P + dmM; sTR = rTRS[b - 1] - rTRS[b - 1] / ADX_P + tr; }
        rDMP[b] = sDP; rDMM[b] = sDM; rTRS[b] = sTR;
        const diP = 100 * (sTR === 0 ? 0 : sDP / sTR), diM = 100 * (sTR === 0 ? 0 : sDM / sTR);
        const sum = diP + diM, dx = sum === 0 ? 0 : (100 * Math.abs(diP - diM)) / sum;
        const a1 = adx[b - 1];
        adx[b] = b < ADX_P ? ((b - 1) * a1 + dx) / b : (a1 * (ADX_P - 1) + dx) / ADX_P;
      }
      // RSI
      if (b0) { rUP[0] = 0; rDN[0] = 0; }
      else {
        const ch = inp - Cl[b - 1], up = ch > 0 ? ch : 0, dn = ch < 0 ? -ch : 0;
        let au, ad;
        if (b < RSI_P) { au = rUP[b - 1] + up; ad = rDN[b - 1] + dn; }
        else if (b === RSI_P) { au = (rUP[b - 1] + up) / RSI_P; ad = (rDN[b - 1] + dn) / RSI_P; }
        else { au = (rUP[b - 1] * (RSI_P - 1) + up) / RSI_P; ad = (rDN[b - 1] * (RSI_P - 1) + dn) / RSI_P; }
        rUP[b] = au; rDN[b] = ad;
        if (b >= RSI_P) rsi[b] = au + ad <= 0 ? 50 : ad === 0 ? 100 : 100 - 100 / (1 + au / ad);
      }
      // reversion band
      const kb = 2 / (BAND_L + 1);
      const band = b0 ? inp : kb * inp + (1 - kb) * rBand[b - 1];
      rBand[b] = band;
      const mb = Math.min(cnt, BAND_ATR);
      let atrB = 0;
      for (let i = 0; i < mb; i++) atrB += trAt(b - i);
      atrB /= mb;
      mean[b] = band; upper[b] = band + BAND_MULT * atrB; lower[b] = band - BAND_MULT * atrB;
      comp[b] = cp; tier[b] = t; atrA[b] = atr;
      state[b] = provisional(t, squeezeAt(cp, sqLatch));

      // ------------------------------------------------ SetupEngine (c = 0)
      if (b > 0) {
        const narrate = b >= evFrom;
        const sqPrev = sqLatch, sqOn = squeezeAt(comp[b], sqPrev);
        sqLatch = sqOn;
        const mo = mom[b], mo1 = mom[b - 1];
        let ev = 0, q = 0;
        const sqLen = sqBars;
        if (sqOn) {
          sqBars = sqPrev ? sqBars + 1 : 1;
          if (!sqPrev) {
            earlyDone = false;
            if (narrate) events.push({ i: b, price: Cl[b], tone: "gold", weight: 1, pane: "sq", title: t === 3 ? "SQUEEZE DEEP" : "SQUEEZE",
              text: `${hhmm(s, b)} — compression fell to ${cp.toFixed(2)} ATR, inside the ${KC_SQZ} ATR squeeze channel${t === 3 ? " and the 1.0 deep channel" : ""}: the squeeze is on. A release can fire only once it has run ${MIN_SQZ} bars.` });
          }
        } else sqBars = 0;

        let fired = false;
        if (sqPrev && !sqOn && !isNaN(mo)) {
          let dir = sgn(mo);
          if (dir === 0 && !isNaN(mo1)) dir = sgn(mo - mo1);
          let ok = dir !== 0 && sqLen >= MIN_SQZ;
          const longEnough = ok;
          if (ok) ok = !isNaN(mo1) && (mo - mo1) * dir > 0;
          if (ok) {
            fired = true;
            const adxPrev = adx[b - 1];
            let pts = 0;
            if (!isNaN(adxPrev) && adxPrev <= ADX_QUIET) pts++;
            if (sgn(wc[b]) === dir) pts++;
            if (sgn(wb[b]) === dir) pts++;
            const grade = sgn(wc[b]) === -dir ? -1 : pts;
            runDir = dir; runBar = b; lastFireBar = b; lastFireDir = dir; lastFireGrade = grade;
            const why = `ADX ${Math.round(adxPrev)} ${adxPrev <= ADX_QUIET ? "was quiet" : "was not quiet"} on the last squeeze bar, the C wave ${sgn(wc[b]) === dir ? "is on its side" : sgn(wc[b]) === -dir ? "runs against it" : "is flat"} and the B wave ${sgn(wb[b]) === dir ? "is on its side" : "is not"}`;
            if (grade >= MIN_GRADE) {
              q = grade; ev = dir;
              if (narrate) events.push({ i: b, price: dir > 0 ? Lo[b] : H[b], tone: grade >= 3 ? (dir > 0 ? "strongBull" : "strongBear") : dir > 0 ? "bull" : "bear", weight: 3,
                title: `FIRED ${dir > 0 ? "LONG" : "SHORT"} · ${gradeWord(grade)}`,
                text: `${hhmm(s, b)} — the ${sqLen}-bar squeeze released (compression ${cp.toFixed(2)} ATR cleared the 1.65 release line) with momentum ${Math.round(mo)} growing ${dir > 0 ? "up" : "down"}: a fire, marked at the ${dir > 0 ? "low" : "high"}. Grade ${gradeWord(grade)}: ${why}.` });
            } else if (narrate) {
              events.push({ i: b, price: Cl[b], tone: "neutral", weight: 1,
                title: `FIRED ${dir > 0 ? "LONG" : "SHORT"} · ${gradeWord(grade)}`,
                text: `${hhmm(s, b)} — the ${sqLen}-bar squeeze released ${dir > 0 ? "up" : "down"}, graded ${gradeWord(grade)} (${why}). Below the minimum grade of ${MIN_GRADE}, so the run is tracked in the ribbon but nothing is marked on price.` });
            }
          } else if (narrate && longEnough) {
            events.push({ i: b, price: Cl[b], tone: "neutral", weight: 1, pane: "sq", title: t === 1 ? "COILING" : "QUIET",
              text: `${hhmm(s, b)} — the ${sqLen}-bar squeeze released without a fire: momentum was not growing in its own direction on the release bar.` });
          }
        }

        if (runDir !== 0 && !fired) {
          let end = sqOn || isNaN(mo) || sgn(mo) === -runDir;
          let why = sqOn ? "a new squeeze started" : isNaN(mo) ? "" : sgn(mo) === -runDir ? "momentum crossed zero" : "";
          if (!end && FADE > 0) {
            let fade = 0;
            for (let f = 0; f < FADE; f++) {
              if (b < f + 1) break;
              const x = mom[b - f], y = mom[b - f - 1];
              if (isNaN(x) || isNaN(y)) break;
              if (Math.abs(x) < Math.abs(y)) fade++; else break;
            }
            if (fade >= FADE) { end = true; why = "momentum faded toward zero for two bars in a row"; }
          }
          if (end) {
            if (narrate && lastFireGrade >= MIN_GRADE) {
              const st = sqOn ? (t === 3 ? ST_DEEP : ST_SQZ) : revDir !== 0 ? (revDir > 0 ? ST_REV_L : ST_REV_S) : t === 1 ? ST_COIL : ST_QUIET;
              events.push({ i: b, price: Cl[b], tone: "neutral", weight: 1, pane: "sq", title: STATE_WORD[st],
                text: `${hhmm(s, b)} — the ${runDir > 0 ? "long" : "short"} run from the ${hhmm(s, runBar)} fire ended after ${b - runBar} bars: ${why}.` });
            }
            runDir = 0; runBar = -1;
          }
        }

        if (sqOn && !earlyDone && sqBars >= MIN_SQZ && b >= 2) {
          const bias = sgn(wc[b]), wa1 = wa[b - 1], wa2 = wa[b - 2];
          if (bias !== 0 && sgn(wb[b]) === bias && sgn(wa1) === -bias) {
            const sNow = sgn(wa[b] - wa1), sPrev = sgn(wa1 - wa2);
            if (sNow === bias && sPrev !== bias) {
              earlyDone = true;
              if (ev === 0) {
                ev = 2 * bias;
                if (narrate) events.push({ i: b, price: bias > 0 ? Lo[b] : H[b], tone: bias > 0 ? "bull" : "bear", weight: 2, title: `EARLY ${bias > 0 ? "LONG" : "SHORT"}`,
                  text: `${hhmm(s, b)} — ${sqBars} bars into the squeeze the A wave hooked back ${bias > 0 ? "up" : "down"} while the B and C waves held ${bias > 0 ? "above" : "below"} zero: the early entry, once per squeeze, taken before any fire.` });
              }
            }
          }
        }

        const meanV = mean[b], upV = upper[b], loV = lower[b], hi = H[b], lo = Lo[b], cl = Cl[b];
        if (revDir !== 0) {
          let life = 0;
          const age = b - revBar;
          if (sqOn) life = 3;
          else if (revDir < 0) { if (lo <= meanV) life = 1; else if (hi >= revStop) life = 2; else if (REV_LIFE > 0 && age > REV_LIFE) life = 4; }
          else { if (hi >= meanV) life = 1; else if (lo <= revStop) life = 2; else if (REV_LIFE > 0 && age > REV_LIFE) life = 4; }
          if (life !== 0) {
            if (narrate) {
              const side = revDir > 0 ? "long" : "short";
              const txt = life === 1 ? `price reached its target, the mean ${f2(meanV)}`
                : life === 2 ? `price reached the 1R stop ${f2(revStop)} before the mean`
                : life === 3 ? "a squeeze started, and a squeeze has the power to push through the band"
                : `${REV_LIFE} bars passed without the mean or the stop being reached`;
              events.push({ i: b, price: life === 2 ? revStop : life === 1 ? meanV : cl, tone: life === 1 ? (revDir > 0 ? "bull" : "bear") : "neutral", weight: 2,
                title: LIFE_WORD[life], text: `${hhmm(s, b)} — ${LIFE_WORD[life]}: the ${side} reversion setup from ${hhmm(s, revBar)} ended because ${txt}.` });
            }
            lastRevLife = life; revDir = 0;
          }
        }
        if (!isNaN(meanV)) { if (cl < meanV) armShort = true; if (cl > meanV) armLong = true; }
        if (revDir === 0 && !sqOn && runDir === 0) {
          const r0 = rsi[b], adxNow = adx[b];
          const oscillating = isNaN(adxNow) || adxNow <= REV_ADX;
          const hi1 = H[b - 1], lo1 = Lo[b - 1], up1 = upper[b - 1], lo1V = lower[b - 1], rsi1 = rsi[b - 1];
          if (oscillating && !isNaN(r0) && !isNaN(meanV)) {
            const slamHi = (hi >= upV && r0 >= RSI_OB) || (!isNaN(rsi1) && !isNaN(up1) && hi1 >= up1 && rsi1 >= RSI_OB);
            const slamLo = (lo <= loV && r0 <= RSI_OS) || (!isNaN(rsi1) && !isNaN(lo1V) && lo1 <= lo1V && rsi1 <= RSI_OS);
            let dir = 0;
            if (slamHi && cl < upV && cl > meanV) dir = -1;
            else if (slamLo && cl > loV && cl < meanV) dir = 1;
            if (dir !== 0 && (dir < 0 ? !armShort : !armLong)) dir = 0;
            if (dir !== 0) {
              const reward = Math.abs(cl - meanV);
              if (reward > 0) {
                if (dir < 0) armShort = false; else armLong = false;
                revDir = dir; revBar = b; revRisk = reward * Math.max(0.05, REV_RISK);
                revStop = dir < 0 ? cl + revRisk : cl - revRisk;
                lastRevBar = b; lastRevDir = dir; lastRevLife = 0;
                if (ev === 0) {
                  ev = 3 * dir;
                  if (narrate) {
                    const r = (hi >= upV && r0 >= RSI_OB) || (lo <= loV && r0 <= RSI_OS) ? r0 : rsi1;
                    events.push({ i: b, price: dir > 0 ? lo : hi, tone: dir > 0 ? "bull" : "bear", weight: 3, title: `REVERSION ${dir > 0 ? "LONG" : "SHORT"}`,
                      text: `${hhmm(s, b)} — with no squeeze on and ADX ${Math.round(adxNow)} under ${REV_ADX}, RSI ${Math.round(r)} was ${dir > 0 ? `at or below ${RSI_OS}` : `at or above ${RSI_OB}`} as price reached the ${dir > 0 ? "lower" : "upper"} band, and this bar closed back inside at ${f2(cl)}. Target the mean ${f2(meanV)}, stop ${f2(revStop)} (1R).` });
                  }
                }
              }
            }
          }
        }

        state[b] = sqOn ? (t === 3 ? ST_DEEP : ST_SQZ) : runDir !== 0 ? (runDir > 0 ? ST_FIRE_L : ST_FIRE_S) : revDir !== 0 ? (revDir > 0 ? ST_REV_L : ST_REV_S) : t === 1 ? ST_COIL : ST_QUIET;
        event[b] = ev; qual[b] = q;
        if (ev !== 0 && b >= markFrom) {
          const kind = Math.abs(ev), bull = ev > 0;
          marks.push({ i: b, kind, bull, prime: kind === 1 && q >= 3, low: kind === 1 && q < 0, y: bull ? Lo[b] : H[b] });
        }
      }
      // snapshots + UpdateRail
      sqOnA[b] = sqLatch ? 1 : 0; sqBarsA[b] = sqBars; runDirA[b] = runDir; runBarA[b] = runBar;
      revDirA[b] = revDir; revBarA[b] = revBar; revStopA[b] = revStop; revRiskA[b] = revRisk;
      reachA[b] = revDir !== 0 && revRisk > 0 ? Math.abs(Cl[b] - mean[b]) / revRisk : NaN;
      lfBarA[b] = lastFireBar; lfDirA[b] = lastFireDir; lfGradeA[b] = lastFireGrade;
      lrBarA[b] = lastRevBar; lrDirA[b] = lastRevDir; lrLifeA[b] = lastRevLife;
    }
    events.sort((a, b) => a.i - b.i);

    // ------------------------------------------------ the latched frame (OnCalculateMinMax / FitTo)
    const frHi = new Float64Array(n), frLo = new Float64Array(n);
    const fitAt = Math.max(0, Math.min(s.replayFrom - 1, n - 1));
    {
      const ups: number[] = [], dns: number[] = [];
      for (let i = Math.max(0, fitAt - FIT_BARS + 1); i <= fitAt; i++) { const v = mom[i]; if (!isFinite(v)) continue; if (v >= 0) ups.push(v); else dns.push(-v); }
      let fh = 300, fl = -300;
      const want = (lo: number, hi: number) => {
        const ph = hi < 100 ? 100 : hi, pl = lo > -100 ? -100 : lo;
        return [Math.max(-PQ_MAX, -rung(Math.abs(pl) * 1.06)), Math.min(PQ_MAX, rung(ph * 1.06))];
      };
      if (ups.length + dns.length > 0) { const [wl, wh] = want(-pct(dns, 0.99), pct(ups, 0.99)); fh = wh; fl = wl; }
      for (let i = 0; i <= fitAt; i++) { frHi[i] = fh; frLo[i] = fl; }
      for (let i = fitAt + 1; i < n; i++) {
        const v = mom[i];
        if (isFinite(v)) { const [wl, wh] = want(v, v); if (v > fh && wh > fh) fh = wh; if (v < fl && wl < fl) fl = wl; }
        frHi[i] = fh; frLo[i] = fl;
      }
    }
    let lastPh = 200;
    const reserves = (ph: number) => {
      const tot = 1 + HEAD_T + FOOT_T;
      return [Math.min(HEAD_PX, (ph * HEAD_T) / tot), Math.min(FOOT_PX, (ph * FOOT_T) / tot)];
    };

    // ------------------------------------------------ reads
    const headline = (bar: number, liveEdge: boolean): { txt: string; tone: Tone } => {
      const st = state[bar], ev = event[bar], q = qual[bar], bias = sgn(wc[bar]), mo = mom[bar];
      if (ev === 1 || ev === -1) { const b = ev > 0; return { txt: `FIRED  ${b ? UP + " LONG" : DN + " SHORT"}  · ${gradeWord(q)}`, tone: q < 0 ? "neutral" : q >= 3 ? (b ? "strongBull" : "strongBear") : b ? "bull" : "bear" }; }
      if (ev === 2 || ev === -2) { const b = ev > 0; return { txt: `EARLY  ${b ? UP + " LONG" : DN + " SHORT"}  · inside the squeeze`, tone: b ? "bull" : "bear" }; }
      if (ev === 3 || ev === -3) { const b = ev > 0; return { txt: `REVERSION  ${b ? UP + " LONG" : DN + " SHORT"}  · target the mean`, tone: b ? "bull" : "bear" }; }
      if (st === ST_SQZ || st === ST_DEEP) {
        const nb = liveEdge ? sqBarsA[bar] : 0;
        let txt = STATE_WORD[st] + (nb > 0 ? `  ${nb}` : "");
        let tone: Tone = "gold";
        if (bias > 0) { txt += `  ${UP} FLOW`; tone = "bull"; } else if (bias < 0) { txt += `  ${DN} FLOW`; tone = "bear"; }
        return { txt, tone };
      }
      if (st === ST_FIRE_L || st === ST_FIRE_S) {
        const b = st === ST_FIRE_L, age = liveEdge && runBarA[bar] >= 0 ? bar - runBarA[bar] : -1;
        return { txt: `FIRED  ${b ? UP + " LONG" : DN + " SHORT"}` + (age >= 0 ? `  · ${age} ${age === 1 ? "bar" : "bars"}` : ""), tone: b ? "bull" : "bear" };
      }
      if (st === ST_REV_L || st === ST_REV_S) {
        const b = st === ST_REV_L;
        let txt = `REVERSION  ${b ? UP + " LONG" : DN + " SHORT"}`;
        if (liveEdge && isFinite(reachA[bar])) txt += `  · ${reachA[bar].toFixed(1)}R to the mean`;
        return { txt, tone: b ? "bull" : "bear" };
      }
      return { txt: STATE_WORD[st] + (isNaN(mo) ? "" : mo >= 0 ? `  ${UP}` : `  ${DN}`), tone: "neutral" };
    };
    const adxTxt = (i: number) => `${Math.round(adx[i])}${adx[i] <= ADX_QUIET ? "  · QUIET" : ""}`;
    const wavesTxt = (i: number) => `${wa[i] >= 0 ? UP : DN} ${wb[i] >= 0 ? UP : DN} ${wc[i] >= 0 ? UP : DN}`;
    const rsiTxt = (i: number) => isNaN(rsi[i]) ? "--" : `${Math.round(rsi[i])}${rsi[i] >= RSI_OB ? "  · OVERBOUGHT" : rsi[i] <= RSI_OS ? "  · OVERSOLD" : ""}`;
    const rsiTone = (i: number): Tone | undefined => rsi[i] >= RSI_OB ? "bear" : rsi[i] <= RSI_OS ? "bull" : undefined;
    /** the live-edge chips: the last fire / the last resolved reversion, within 120 bars
     *  (only those born inside the replay: example hygiene, see DEVIATIONS) */
    const lastChips = (bar: number): { t: string; tone: Tone }[] => {
      const out: { t: string; tone: Tone }[] = [];
      const st = state[bar];
      if (lfBarA[bar] >= s.replayFrom && st !== ST_FIRE_L && st !== ST_FIRE_S) {
        const age = bar - lfBarA[bar];
        if (age > 0 && age <= 120) { const b = lfDirA[bar] > 0; out.push({ t: `FIRE ${b ? UP : DN} ${gradeWord(lfGradeA[bar])}  · ${age} ${age === 1 ? "bar ago" : "bars ago"}`, tone: lfGradeA[bar] < 0 ? "neutral" : b ? "bull" : "bear" }); }
      }
      if (lrBarA[bar] >= s.replayFrom && lrLifeA[bar] !== 0) {
        const age = bar - lrBarA[bar];
        if (age >= 0 && age <= 120) { const b = lrDirA[bar] > 0; out.push({ t: `REVERSION ${b ? UP : DN} ${LIFE_WORD[lrLifeA[bar]]}  · ${age} ${age === 1 ? "bar ago" : "bars ago"}`, tone: lrLifeA[bar] === 1 ? (b ? "bull" : "bear") : "neutral" }); }
      }
      return out;
    };

    // ------------------------------------------------ drawing
    const drawPane = (d: Draw, pv: PaneView) => {
      const P = palette(d.th.bg), ctx = d.ctx;
      lastPh = pv.bottom - pv.top;
      const kk = d.k, last = Math.min(d.i1, kk), first = Math.max(0, d.i0);
      if (last < first) return;
      const fh = frHi[kk], fl = frLo[kk];
      let bodyTop = Math.max(pv.top, pv.y(fh)), bodyBot = Math.min(pv.bottom, pv.y(fl));
      const BY = (v: number) => Math.max(bodyTop, Math.min(bodyBot, pv.y(v)));
      const x1 = 2, x2 = d.plotRight - 2;
      const paintW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      ctx.save(); ctx.beginPath(); ctx.rect(0, pv.top, d.plotRight, pv.bottom - pv.top); ctx.clip();
      const fits = bodyBot - bodyTop >= 12;
      const yz = BY(0), yzi = Math.floor(yz);
      if (fits) {
        // momentum field
        const w = Math.max(2, paintW - 1.6);
        for (let i = first; i <= last; i++) {
          const v = mom[i];
          if (isNaN(v)) continue;
          const p = i > 0 ? mom[i - 1] : NaN;
          const str = !isNaN(p) && Math.abs(v) > Math.abs(p);
          const xc = d.x(i), xa = Math.floor(xc - w * 0.5) + 0.5, xb = xa + Math.floor(w);
          const y = BY(v);
          const ya = Math.min(y, yz);
          let yb2 = Math.max(y, yz);
          if (yb2 - ya < 1) yb2 = ya + 1;
          ctx.fillStyle = css(v >= 0 ? P.bull : P.bear, str ? 0.42 : 0.18);
          ctx.fillRect(xa, ya, xb - xa, Math.max(1.5, yb2 - ya));
        }
        // coil on the centerline
        ctx.fillStyle = css(P.ink, 0.3); ctx.fillRect(x1, yzi, x2 - x1, 1);
        let runT = -1, runA = 0, runB = 0;
        for (let i = first; i <= last + 1; i++) {
          let tt = -1, xa = 0, xb = 0;
          if (i <= last) { tt = tier[i]; xa = d.x(i) - paintW * 0.5; xb = xa + paintW; }
          if (tt >= 0 && tt === runT && xa <= runB + 0.51) { runB = xb; continue; }
          if (runT > 0) {
            const ra = Math.max(runA, x1), rb = Math.min(runB, x2);
            if (rb > ra) {
              const h = runT === 1 ? 2 : runT === 2 ? 3 : 4;
              ctx.fillStyle = runT === 1 ? css(P.neutral, 0.6) : css(P.sqz, runT === 2 ? 0.88 : 1);
              ctx.fillRect(ra, yzi - Math.floor(h * 0.5), rb - ra, h);
            }
          }
          runT = tt; runA = xa; runB = xb;
        }
        const tw = Math.max(2, Math.min(4, paintW * 0.5));
        for (let i = first; i <= last; i++) {
          const e = event[i];
          if (e !== 1 && e !== -1) continue;
          const up = e > 0, q = qual[i];
          const hue = q >= 3 ? (up ? P.sBull : P.sBear) : up ? P.bull : P.bear;
          ctx.fillStyle = css(hue, q < 0 ? 0.55 : 0.95);
          ctx.fillRect(Math.floor(d.x(i) - tw * 0.5) + 0.5, up ? yzi - 7 : yzi + 1, tw, 7);
        }
        // momentum line: ground bevel, then the strengthening / fading segments
        const lw = Math.max(1, LINE_W) + 0.4;
        ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
        if (lw >= 2) {
          ctx.strokeStyle = css(P.ground, 0.55); ctx.lineWidth = lw * 0.85; ctx.beginPath();
          let pen = false;
          for (let i = first; i <= last; i++) { const v = mom[i]; if (isNaN(v)) { pen = false; continue; } const x = d.x(i), y = BY(v) + 1.7; if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y); pen = true; }
          ctx.stroke();
        }
        ctx.lineWidth = lw;
        for (let i = Math.max(1, first); i <= last; i++) {
          const v = mom[i], p = mom[i - 1];
          if (isNaN(v) || isNaN(p) || i - 1 < first) continue;
          const hue = v >= 0 ? P.bull : P.bear;
          const col = Math.abs(v) > Math.abs(p) ? hue : lerp(hue, P.ink, 0.55);
          ctx.strokeStyle = css(col, 0.96);
          ctx.beginPath(); ctx.moveTo(d.x(i - 1), BY(p)); ctx.lineTo(d.x(i), BY(v)); ctx.stroke();
        }
        ctx.restore();
        // overflow rule
        const half = Math.max(0.5, paintW * 0.5);
        for (let i = first; i <= last; i++) {
          const v = mom[i];
          if (isNaN(v) || (v <= fh && v >= fl)) continue;
          ctx.fillStyle = css(v > fh ? P.sBull : P.sBear, 0.95);
          ctx.fillRect(d.x(i) - half, v > fh ? bodyTop : bodyBot - 2, half * 2 + 0.6, 2);
        }
        // value chip
        const v = mom[last];
        if (!isNaN(v)) {
          let cy = BY(v);
          cy = Math.max(bodyTop + 6.5, Math.min(bodyBot - 6.5, cy));
          const tx = String(Math.round(v)), p = last > 0 ? mom[last - 1] : NaN;
          const hue = v >= 0 ? P.bull : P.bear;
          const col = !isNaN(p) && Math.abs(v) > Math.abs(p) ? hue : lerp(hue, P.ink, 0.55);
          const cw = d.measure(tx, { size: 9.5, weight: 600 }) + 9;
          d.rect(x2 - cw - 1, cy - 6.5, x2 - 1, cy + 6.5, css(col, 0.92), null);
          d.text(tx, x2 - cw + 3.5, cy + 0.5, { color: css(P.ground, 1), size: 9.5, weight: 600 });
        }
      } else {
        ctx.fillStyle = css(P.ink, 0.34); ctx.fillRect(x1, yzi, x2 - x1, 1);
      }
      // state ribbon
      const ribY = bodyTop - RIB_GAP - RIB_H;
      if (bodyTop - pv.top >= HEAD_ROW + RIB_GAP + RIB_H + 0.5) {
        ctx.fillStyle = css(P.neutral, 0.1); ctx.fillRect(x1, ribY, x2 - x1, RIB_H);
        let runS = -1, rA = 0, rB = 0;
        for (let i = first; i <= last + 1; i++) {
          let st = -1, xa = 0, xb = 0;
          if (i <= last) { st = state[i]; xa = d.x(i) - paintW * 0.5; xb = xa + paintW; }
          if (st >= 0 && st === runS && xa <= rB + 0.51) { rB = xb; continue; }
          if (runS > 0) {
            const ra = Math.max(rA, x1), rb = Math.min(rB, x2);
            if (rb > ra) {
              const c = runS === ST_COIL ? css(P.neutral, 0.26) : runS === ST_SQZ ? css(P.sqz, 0.62) : runS === ST_DEEP ? css(P.sqz, 0.95)
                : runS === ST_FIRE_L ? css(P.bull, 0.9) : runS === ST_FIRE_S ? css(P.bear, 0.9) : runS === ST_REV_L ? css(P.bull, 0.34) : css(P.bear, 0.34);
              ctx.fillStyle = c; ctx.fillRect(ra, ribY, rb - ra, RIB_H);
            }
          }
          runS = st; rA = xa; rB = xb;
        }
        const cy = ribY + RIB_H * 0.5, r = Math.max(2.2, Math.min(4.2, Math.min(paintW * 0.5 + 1.6, RIB_H * 0.44)));
        for (let i = first; i <= last; i++) {
          const e = event[i];
          if (e === 0) continue;
          const kind = Math.abs(e), up = e > 0, q = qual[i], x = d.x(i);
          let hue = up ? P.bull : P.bear, w = 1.6, a = 0.98;
          if (kind === 1) { if (q >= 3) hue = up ? P.sBull : P.sBear; if (q < 0) { w = 1; a = 0.72; } }
          else if (kind === 2) { w = 1; a = 0.9; }
          chevron(d, x, cy, r, 3.4, css(P.ground, 1), up);
          chevron(d, x, cy, r, w, css(hue, a), up);
          if (kind === 3) {
            const yb = up ? cy + r * 0.52 : cy - r * 0.52;
            roundLine(d, [[x - r * 0.8, yb], [x + r * 0.8, yb]], css(P.ground, 1), 3);
            roundLine(d, [[x - r * 0.8, yb], [x + r * 0.8, yb]], css(hue, 0.95), 1.3);
          }
        }
        if (x2 - x1 > 200) {
          ctx.fillStyle = css(P.ground, 0.88); ctx.fillRect(x1, ribY, 36, RIB_H);
          d.text("Q", x1 + 3, cy, { color: css(P.ink, 0.9), size: 8, weight: 600, font: "sans" });
          d.text("STATE", x1 + 12, cy, { color: css(P.ink, 0.5), size: 8, weight: 600, font: "sans" });
        }
      }
      // wave rows
      const waveY = bodyBot + WAVE_PAD;
      if (pv.bottom - bodyBot >= WAVE_PAD + 3 * WAVE_H + 2 * WAVE_GAP + 0.5) {
        for (let row = 0; row < 3; row++) {
          const src = row === 0 ? wa : row === 1 ? wb : wc;
          const yT = waveY + row * (WAVE_H + WAVE_GAP);
          ctx.fillStyle = css(P.neutral, 0.08); ctx.fillRect(x1, yT, x2 - x1, WAVE_H);
          let runC = -1, rA = 0, rB = 0;
          for (let i = first; i <= last + 1; i++) {
            let code = -1, xa = 0, xb = 0;
            if (i <= last) {
              const v = src[i];
              if (!isNaN(v)) { const p = i > 0 ? src[i - 1] : NaN; code = (v >= 0 ? 0 : 2) + (!isNaN(p) && Math.abs(v) > Math.abs(p) ? 1 : 0); }
              xa = d.x(i) - paintW * 0.5; xb = xa + paintW;
            }
            if (code >= 0 && code === runC && xa <= rB + 0.51) { rB = xb; continue; }
            if (runC >= 0) {
              const ra = Math.max(rA, x1), rb = Math.min(rB, x2);
              if (rb > ra) { ctx.fillStyle = css(runC < 2 ? P.bull : P.bear, (runC & 1) === 1 ? 0.85 : 0.3); ctx.fillRect(ra, yT, rb - ra, WAVE_H); }
            }
            runC = code; rA = xa; rB = xb;
          }
        }
        if (x2 - x1 > 200) {
          const hAll = 3 * WAVE_H + 2 * WAVE_GAP;
          ctx.fillStyle = css(P.ground, 0.88); ctx.fillRect(x1, waveY, 40, hAll);
          d.text("WAVES", x1 + 3, waveY + hAll / 2, { color: css(P.ink, 0.5), size: 7, weight: 600, font: "sans" });
        }
      }
      ctx.restore();
      // header: readout + chips (top right of the panel)
      const pw = d.plotRight;
      if (pw < 200) return;
      const toneC = (t: Tone): C3 => t === "bull" ? P.bull : t === "bear" ? P.bear : t === "strongBull" ? P.sBull : t === "strongBear" ? P.sBear : t === "gold" ? P.sqz : t === "neutral" ? P.neutral : P.ink;
      let right = x2 - 2;
      const hl = headline(last, last === kk);
      const hc = hl.tone === "neutral" && state[last] !== ST_COIL ? P.ink : toneC(hl.tone);
      const rw = d.measure(hl.txt, { size: 10.5, weight: 700 }) + 10;
      d.rect(right - rw, pv.top + 0.5, right, pv.top + 0.5 + HEAD_ROW, css(P.ground, 0.78), null);
      d.text(hl.txt, right - rw + 5, pv.top + 8.5, { color: css(hc, 0.95), size: 10.5, weight: 700 });
      right -= rw + 6;
      const chip = (txt: string, col: C3) => {
        const w = d.measure(txt, { size: 9, weight: 600 }) + 10;
        if (right - w < 150) return;
        d.rect(right - w, pv.top + 1, right, pv.top + 15, css(P.ground, 0.78), null);
        d.rect(right - w, pv.top + 1, right - w + 2, pv.top + 15, css(col, 0.9), null);
        d.text(txt, right - w + 5, pv.top + 8.5, { color: css(col, 0.92), size: 9, weight: 600 });
        right -= w + 6;
      };
      if (pw >= 700) {
        if (!isNaN(adx[last])) chip(`ADX ${adxTxt(last)}`, adx[last] <= ADX_QUIET ? P.sqz : P.ink);
        if (!isNaN(wa[last])) chip(`WAVES ${wavesTxt(last)}`, wc[last] >= 0 ? P.bull : P.bear);
        if (!isNaN(rsi[last])) chip(`RSI ${rsiTxt(last)}`, rsi[last] >= RSI_OB ? P.bear : rsi[last] <= RSI_OS ? P.bull : P.ink);
        if (last === kk && pw >= 900) for (const c of lastChips(last)) chip(c.t, toneC(c.tone));
      }
    };

    const drawPrice = (d: Draw) => {
      if (!d.on("marks")) return;
      const P = palette(d.th.bg), pv = d.price, kk = d.k;
      const ground = css(P.ground, 1);
      const bodyW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      const r = Math.max(3, Math.min(6.5, bodyW * 0.9));
      for (const m of marks) {
        if (m.i > kk) break;
        if (m.i < d.i0 || m.i > d.i1) continue;
        if (m.kind === 2 && !d.on("early")) continue;
        const form = m.kind === 3 ? 3 : m.kind === 1 && m.prime ? 2 : 1;
        dsMark(d, d.x(m.i), pv.y(m.y), m.bull, form, m.low || m.kind === 2, r, css(m.bull ? BULL : BEAR, 1), ground, "Q");
      }
      // the MEAN rail while a reversion setup is live
      if (revDirA[kk] !== 0 && revBarA[kk] >= 0) {
        const mu = mean[kk], bull = revDirA[kk] > 0, hue = bull ? BULL : BEAR;
        const y = Math.floor(pv.y(mu)) + 0.5;
        if (y >= pv.top - 2 && y <= pv.bottom + 2) {
          const txt = `MEAN ${d.fmt(Math.round(mu / d.tick) * d.tick)}`;
          const tw = d.measure(txt, { size: 9.5, weight: 700 }) + 10;
          const tagR = d.plotRight - 1, tagL = tagR - tw;
          const x0 = Math.max(0, d.x(revBarA[kk]));
          const lineEnd = tagL - 6 - 2;
          if (lineEnd > x0) d.line([[x0, y], [lineEnd, y]], css(hue, 0.85), 1, [4, 3]);
          const top = Math.floor(y - 7) + 0.5, bot = top + 14, tip = tagL - 6;
          const ctx = d.ctx;
          ctx.save();
          ctx.fillStyle = css(P.ground, 0.88);
          ctx.fillRect(tagL, top, tw, bot - top);
          ctx.beginPath(); ctx.moveTo(tagL, top); ctx.lineTo(tip, y); ctx.lineTo(tagL, bot); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = css(hue, 0.85); ctx.lineWidth = 1; ctx.stroke();
          ctx.strokeRect(tagL, top, tw, bot - top);
          ctx.restore();
          d.text(txt, tagL + 5, y + 0.5, { color: css(hue, 0.85), size: 9.5, weight: 700 });
        }
      }
    };

    return {
      events,
      paneExtent: (pane, _i0, _i1, k) => {
        if (pane !== "sq") return null;
        const kk = Math.max(0, Math.min(n - 1, k));
        const fh = frHi[kk], fl = frLo[kk], span = fh - fl || 1;
        const ph = lastPh > 40 ? lastPh : 200;
        const [hPx, fPx] = reserves(ph);
        const body = Math.max(10, ph - hPx - fPx), ppu = body / span;
        // the engine pads 8 % each side and insets 6 px: invert that so the body sits where the .cs puts it
        const hiP = fh + hPx / ppu - 6 / ppu, loP = fl - fPx / ppu + 6 / ppu;
        const S = (hiP - loP) / 1.16;
        return [loP + 0.08 * S, hiP - 0.08 * S];
      },
      draw: (d) => {
        const pv = d.pane("sq");
        if (pv) drawPane(d, pv);
        drawPrice(d);
      },
      priceExtent: (_i0, _i1, k) => {
        if (revDirA[k] !== 0) return [mean[k], mean[k]];
        return null;
      },
      status: (k) => {
        const hl = headline(k, true);
        const out: ReadItem[] = [
          { label: "DS Squeeze", value: hl.txt.replace(/\s{2,}/g, " "), tone: hl.tone },
          { label: "Momentum", value: isNaN(mom[k]) ? "--" : String(Math.round(mom[k])), tone: mom[k] >= 0 ? "bull" : "bear" },
          { label: "ADX", value: isNaN(adx[k]) ? "--" : adxTxt(k).replace(/\s{2,}/g, " "), tone: adx[k] <= ADX_QUIET ? "gold" : undefined },
          { label: "Waves A B C", value: wavesTxt(k), tone: wc[k] >= 0 ? "bull" : "bear" },
          { label: "RSI", value: rsiTxt(k).replace(/\s{2,}/g, " "), tone: rsiTone(k) },
        ];
        const lc = lastChips(k);
        if (lc.length) out.push({ label: "Last", value: lc[lc.length - 1].t.replace(/\s{2,}/g, " "), tone: lc[lc.length - 1].tone });
        return out;
      },
      readout: (i) => {
        const hl = headline(i, false);
        return [
          { label: "State", value: hl.txt.replace(/\s{2,}/g, " "), tone: hl.tone },
          { label: "Momentum", value: isNaN(mom[i]) ? "--" : String(Math.round(mom[i])), tone: mom[i] >= 0 ? "bull" : "bear" },
          { label: "Compression", value: isNaN(comp[i]) ? "--" : `${comp[i].toFixed(2)} ATR`, tone: tier[i] >= 2 ? "gold" : undefined },
          { label: "ADX", value: isNaN(adx[i]) ? "--" : adxTxt(i).replace(/\s{2,}/g, " ") },
          { label: "RSI", value: rsiTxt(i).replace(/\s{2,}/g, " "), tone: rsiTone(i) },
          { label: "Waves A B C", value: wavesTxt(i), tone: wc[i] >= 0 ? "bull" : "bear" },
        ];
      },
      legend: [
        { label: "Momentum", color: "#1FA5A5", shape: "line" },
        { label: "Squeeze (coil / ribbon)", color: "rgb(240,163,92)", shape: "box" },
        { label: "Coiling", color: "rgb(128,136,148)", shape: "box" },
        { label: "Fire / setup long", color: "#009999", shape: "dot" },
        { label: "Fire / setup short", color: "#A33DFF", shape: "dot" },
        { label: "Mean rail", color: "#009999", shape: "dash" },
      ],
    };
  },
};
