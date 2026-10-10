import type { Draw, PaneView, ReadItem, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm, minuteOfDay, sessionNum, wall } from "../ta";

/**
 * DS VWAP — web edition. Source: DSVWAP.cs (DS ProVWAP build, shipped 2026-10-05
 * as DS VWAP), shipped defaults (ApplyDefaults): CloseBar, SessionAndCashOpen
 * anchor, cash open 09:30 New York, OneMinute resolution, bar price Midrange,
 * Horizon 60, Live memory 20, Confirm on the next close ON, Contours band style,
 * PremiumDiscount zones, session VWAP + edges, strips, tags, readouts, track
 * records ON, levels on price VwapAndEdges, theme DsSignature.
 *
 * PORTED EXACTLY (Engine(), Fold(), FoldLive(), Quants(), QuantsLive(),
 * Multipliers()/AgePos(), BuildReturnTable()/OddsOf(), BuildReach()):
 *   · SESSION VWAP — volume-weighted mean of the bar MIDRANGE (h+l)/2 (the
 *     shipped Bar price), anchored at the CME session open (18:00 NY) and again
 *     at the cash open (first bar stamped after 09:30 NY). Its sigma is the
 *     weighted variance of the midranges PLUS each bar's own range spread as a
 *     uniform distribution (w·range²/12) — Welford-style, as the .cs does.
 *   · Its 50% core / 90% edge are LEARNED sigma multiples: the empirical
 *     distribution of |close − VWAP|/σ per anchor kind (session / cash) and per
 *     anchor-age bin (powers of two), blended with the shipped prior
 *     (P50/P90 tables, N0S·2^bin pseudo-counts), interpolated across age bins.
 *   · LIVE VWAP — never resets; a volume-clock exponential memory whose
 *     half-life is 20 × the running average bar volume (60-bar seeding, then
 *     EMA); its own learned band (prior 0.71σ / 1.38σ, N0L 400).
 *   · SESSION STATE (latched): EXTENDED when a close beyond the session's 90%
 *     edge is confirmed by the next close (anchor formed = 15 bars); BACK IN
 *     VALUE on a close back inside the 50% core; AT VWAP on the first bar to
 *     trade at/through the session VWAP since the extension (it pre-empts BACK
 *     on the same bar, as in the .cs).
 *   · LIVE zone: PREMIUM / DISCOUNT / ABOVE THE BAND / BELOW THE BAND, and the
 *     live STRETCHED state (two closes beyond the live edge).
 *   · RETURN odds (session VWAP traded within 60 bars), learned per z-bucket
 *     with the erf prior, monotone table; tiers HOT ≥60 / WARM ≥25 / COOL ≥5 /
 *     COLD; REACH 60/25/5% contours from the learned excursion distribution in
 *     units of sqrt(evVar·hz·rho[15-min slot]); the HELD and RETURNED track
 *     records counted exactly as the .cs counts them.
 *   · Drawing: the panel (live band as 9+9 contour hairlines with stacked 4.5%
 *     fills, core 0.78, edge 2 px; dashed session VWAP and edges broken at each
 *     new anchor; strong-colour islands beyond the live edge; live VWAP with a
 *     ground halo; the close line coloured by live zone; SESSION and RETURN
 *     strips with the chevron / dot / ring event marks; header readouts and
 *     chips), the three dashed rails on the price panel, LitOf() colours
 *     (deepen ×0.62 on a light ground, 12% toward white on dark), the panel's
 *     FrameRange()/HoldRange() grid-rounded scale with its header/foot reserves.
 *
 * DEVIATIONS
 *   1. Learned tables start from the replay file's history (about three sessions
 *      before the replay day) instead of the full chart history NinjaTrader
 *      would load; the shipped priors carry the early bars, exactly as they do
 *      on a freshly loaded short chart.
 *   2. The study asks DS Replay for a 220 px right margin (capped by the engine
 *      at a third of the plot), and the forward view (reach contours, "if price
 *      holds" band, odds ruler) is laid out in it by the tool's own geometry test
 *      (ForwardGeom) — whole on a desktop chart, contours only on a phone. The
 *      margin labels (LIVE, SESSION, 90% / 50%, SESSION 90%) are drawn as tags in
 *      the panel's axis with the tool's priority and 13 px collision rule, price
 *      only (no word), so the forward view does not reserve the tool's label
 *      column; the leads to them are drawn as in the tool. The price-panel flags
 *      (VWAP / UPPER / LOWER) likewise sit in the price axis, price only. Ruler
 *      entries that fall above or below the panel body are left out (the tool
 *      pins them to the edge with an arrow), and a ruler entry that collides is
 *      dropped rather than moved one row.
 *   3. Chart time = New York time (the tool's sameZone path), so the 15-minute
 *      slots and the cash open read the bar stamp directly.
 *   4. The panel's scale is the tool's grid-rounded frame recomputed each paint
 *      (HoldRange without its hysteresis memory, which is UI state).
 *   5. Events are the tool's EXTENDED / BACK IN VALUE / AT VWAP (EventCode) and
 *      the live STRETCHED (LiveEvent), plus FORMING at the cash-open anchor; the
 *      live band's own back-inside code is not narrated (the tool has no word
 *      for it).
 *   6. Example hygiene (web showcase): the HELD (share of closes inside the 90% / 50%
 *      bands) and RETURNED (track record per odds tier) chips count only bars from the
 *      first shown bar on, so the header never reports warm-up history. The learned
 *      band, return and reach tables still learn from every bar — computation is
 *      unchanged; only those two display counters are gated.
 */

// ------------------------------------------------------------------ shipped constants
const NQ = 9, Q_CORE = 4, Q_EDGE = 8;
const FORM_BARS = 15;
const LATE_SEC = 300;
const NKIND = 2, NAGE = 12, NBZ = 120;
const ZW = 0.05, KTOP = 4.0, N0S = 20.0;
const QS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const P50 = [0.65, 0.85, 1.00, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05];
const P90 = [1.00, 1.50, 1.75, 1.90, 1.90, 1.90, 1.90, 1.90, 1.90, 1.90, 1.90, 1.90];
const NB = 40, N0_TABLE = 200.0;
const SLOT_MIN = 15, NSLOT = 96, N0_RHO = 60.0;
const T_COOL = 0.05, T_WARM = 0.25, T_HOT = 0.60;
const LIVE_K50 = 0.71, LIVE_K90 = 1.38, N0L = 400.0;
const NBR = 120, NREACH = 3, RW = 0.05, N0_REACH = 400.0;
const RQ = [0.40, 0.75, 0.95];
const LN2 = Math.log(2);
const TR_COLD = 0, TR_COOL = 1, TR_WARM = 2, TR_HOT = 3;
const F_FORMED = 1, F_ANCHOR = 2, F_PEND_UP = 4, F_PEND_DN = 8, F_LATE = 16, F_NOVOL = 32, F_LFORMED = 64;
const EV_EXT = 1, EV_BACK = 2, EV_VWAP = 3;
const HZ = 60, MEM = 20, CASH_SEC = 34200;
const Z_NONE = 0, Z_UP1 = 1, Z_UP2 = 2, Z_UP3 = 3, Z_DN1 = 4, Z_DN2 = 5, Z_DN3 = 6;

// panel geometry (px), as in the .cs
const HEAD_MIN = 15, HEAD_ROW = 16, RIB_H = 6, RIB_GAP = 2, HEAD_AIR = 3, FOOT_AIR = 2;
const HEAD_T = 0.24, FOOT_T = 0.10, HOLD_MARGIN = 0.08, HOLD_STEPS = 24.0, FWD_CAP = 0.60;
const RUL_LEAD = 11, RUL_CH = 4.9;
const HEAD_PX = HEAD_ROW + HEAD_AIR + RIB_H + RIB_GAP;
const FOOT_PX = RIB_GAP + RIB_H + FOOT_AIR;
const HEADT = HEAD_T * HEAD_PX / (HEAD_PX - HEAD_ROW + HEAD_MIN);

// ------------------------------------------------------------------ helpers
const fin = (x: number) => Number.isFinite(x);
function erf(x: number) {
  const sign = x < 0 ? -1 : 1, ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}
const R_PRIOR = Array.from({ length: NB + 1 }, (_, k) => 1 - erf((k + 0.5) * 0.1 / Math.SQRT2));
function priorCdf(x: number, k50: number, k90: number) {
  if (x <= 0) return 0;
  if (x < k50) return 0.5 * x / k50;
  if (x < k90) return 0.5 + 0.4 * (x - k50) / (k90 - k50);
  if (x < KTOP) return 0.9 + 0.1 * (x - k90) / (KTOP - k90);
  return 1;
}
const tierOf = (p: number) => (p >= T_HOT ? TR_HOT : p >= T_WARM ? TR_WARM : p >= T_COOL ? TR_COOL : TR_COLD);
function gridStep(span: number, tick: number) {
  const raw = span / HOLD_STEPS;
  if (!(raw > 0) || !fin(raw)) return tick > 0 ? tick : 1;
  const k = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / k;
  const g = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * k;
  const t = Math.ceil(g / tick - 1e-9);
  return (t < 1 ? 1 : t) * tick;
}

// DsSignature + LitOf()
type RGB = [number, number, number];
const C_BULL: RGB = [0, 153, 153], C_BEAR: RGB = [163, 61, 255], C_NEU: RGB = [85, 85, 85], C_SBULL: RGB = [0, 255, 255], C_SBEAR: RGB = [255, 0, 255];
const deepen = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
const mixW = (c: RGB, m: number): RGB => [c[0] + (255 - c[0]) * m, c[1] + (255 - c[1]) * m, c[2] + (255 - c[2]) * m];
const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
type Pal = { light: boolean; ground: RGB; ink: RGB; bull: RGB; bear: RGB; sbull: RGB; sbear: RGB; neu: RGB };
function palette(bg: string): Pal {
  const n = parseInt(bg.slice(1), 16);
  const g: RGB = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const light = 0.2126 * lin(g[0]) + 0.7152 * lin(g[1]) + 0.0722 * lin(g[2]) > 0.45;
  const lit = (c: RGB) => (light ? deepen(c, 0.62) : mixW(c, 0.12));
  return {
    light, ground: g,
    ink: light ? [0.16 * 255, 0.18 * 255, 0.22 * 255] : [0.84 * 255, 0.86 * 255, 0.90 * 255],
    bull: lit(C_BULL), bear: lit(C_BEAR), sbull: lit(C_SBULL), sbear: lit(C_SBEAR),
    neu: light ? deepen(C_NEU, 0.9) : mixW(C_NEU, 0.25),
  };
}

const UP = "▲", DN = "▼", DOT = "  ·  ", SG = "σ";
const fp = (p: number) => (fin(p) ? (Math.round(p / 0.25) * 0.25).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "--");
/** chart text: NinjaTrader FormatPrice, no thousands separators */
const fpc = (p: number) => (Number.isFinite(p) ? (Math.round(p / 0.25) * 0.25).toFixed(2) : "-");
const fdist = (d: number) => (fin(d) ? (d < 0 ? "-" : "+") + fp(Math.abs(d)) : "--");
const pct = (h: number, e: number) => (e <= 0 ? "--" : `${Math.round((100 * h) / e)}%`);

export const study: StudyDef = {
  slug: "vwap", rightMargin: 220,
  name: "DS VWAP",
  about: "Value on two clocks: the live VWAP on a volume clock with its learned 50% / 90% band, the session VWAP anchored at the open and again at 09:30, and the tool's EXTENDED / BACK IN VALUE / AT VWAP state.",
  panes: [{ id: "vwap", title: "DS VWAP", weight: 0.95, digits: 0 }],
  layers: [
    { id: "rails", label: "Tags on price", on: true, hint: "The session VWAP and its UPPER / LOWER edges led to the price axis from the newest bar (Levels on price: VwapAndEdges)." },
    { id: "strips", label: "Strips", on: true, hint: "SESSION (where the close stood in the session's envelope, with the event marks) over the map, RETURN (the return-odds tier) under it." },
  ],
  run(s) {
    const n = s.n;
    // ---------------------------------------------------------------- per-bar book
    const P = {
      vw: new Float64Array(n).fill(NaN), sig: new Float64Array(n).fill(NaN), z: new Float64Array(n).fill(NaN),
      up: new Float64Array(n).fill(NaN), dn: new Float64Array(n).fill(NaN), cup: new Float64Array(n).fill(NaN), cdn: new Float64Array(n).fill(NaN),
      odds: new Float64Array(n).fill(NaN),
      lv: new Float64Array(n).fill(NaN), lup: new Float64Array(n).fill(NaN), ldn: new Float64Array(n).fill(NaN),
      lcup: new Float64Array(n).fill(NaN), lcdn: new Float64Array(n).fill(NaN), lz: new Float64Array(n).fill(NaN),
      lzone: new Int8Array(n), lev: new Int8Array(n), state: new Int8Array(n), ev: new Int8Array(n),
      flag: new Uint8Array(n), seq: new Int32Array(n), cnt: new Int32Array(n),
      K: new Float32Array(n * NQ).fill(NaN), KL: new Float32Array(n * NQ).fill(NaN),
      reach: new Float32Array(n * NREACH).fill(NaN), rate: new Float32Array(n).fill(NaN),
      held: new Float64Array(n * 6), track: new Float64Array(n * 8),
      zone: new Uint8Array(n), tier: new Uint8Array(n), runLen: new Int32Array(n),
    };
    const seqT0: number[] = [];
    // example hygiene (DEVIATIONS 6): the HELD / RETURNED track records count from the first shown bar
    const shownFrom = Math.max(0, s.replayFrom);

    // ---------------------------------------------------------------- engine state
    const acc = { W: 0, M: 0, T: 0, Seq: 0, Kind: 0, Count: 0, Late: false, HasVol: false, First: true, Sess: 0, SessBeginSec: 0, PrevT: 0, T0: 0, LW: 0, LM: 0, LT: 0, LY: 0, LN: 0, LC: 0 };
    let evVar = 0, volBar = 0, prevW = 0, prevSeqW = 0;
    let stState = 0, stPend = 0, stOwed = 0, stPrevSeq = 0, stAge = 0;
    let heldAll = 0, heldCore = 0, heldEdge = 0, heldLAll = 0, heldLCore = 0, heldLEdge = 0, stL = 0, pendL = 0;
    const trackExpo = [0, 0, 0, 0], trackHits = [0, 0, 0, 0];
    const zCnt = Array.from({ length: NKIND }, () => Array.from({ length: NAGE }, () => new Float64Array(NBZ)));
    const zTot = Array.from({ length: NKIND }, () => new Float64Array(NAGE));
    const qVal = Array.from({ length: NKIND }, () => Array.from({ length: NAGE }, () => new Float64Array(NQ)));
    const qOk = Array.from({ length: NKIND }, () => new Array<boolean>(NAGE).fill(false));
    const rCnt = new Float64Array(NB + 1), rHit = new Float64Array(NB + 1), rTab = new Float64Array(NB + 1);
    const rhoSum = new Float64Array(NSLOT), rhoCnt = new Float64Array(NSLOT), rvSum = new Float64Array(NSLOT), rvCnt = new Float64Array(NSLOT);
    const kq = new Float64Array(NQ);
    const zCntL = new Float64Array(NBZ), qValL = new Float64Array(NQ);
    let zTotL = 0, qOkL = false;
    const reachCnt = new Float64Array(NBR), reachQ = new Float64Array(NREACH);
    let reachTot = 0;
    const wn = HZ + 1, vl = 2 * HZ;
    const winC = new Float64Array(wn), winH = new Float64Array(wn), winL = new Float64Array(wn), winV = new Float64Array(wn);
    const winEv = new Float64Array(wn), winVb = new Float64Array(wn), winZr = new Float64Array(wn).fill(NaN), winOd = new Float64Array(wn).fill(NaN);
    const winDd = new Float64Array(wn), winDw = new Float64Array(wn), winUnit = new Float64Array(wn).fill(NaN);
    const winSlot = new Int32Array(wn), winSeq = new Int32Array(wn), winSb = new Float64Array(wn);

    const buildReturnTable = () => {
      let m = 1;
      for (let k = 0; k <= NB; k++) { const x = (rHit[k] + N0_TABLE * R_PRIOR[k]) / (rCnt[k] + N0_TABLE); if (x < m) m = x; rTab[k] = m; }
    };
    const oddsOf = (z: number) => {
      if (!fin(z)) return 0;
      if (z <= 0) return 1;
      let x = z * 10;
      if (x >= NB + 0.5) return rTab[NB];
      x -= 0.5;
      if (x <= 0) return rTab[0] + (1 - rTab[0]) * (-x) / 0.5;
      const k = Math.trunc(x);
      if (k >= NB) return rTab[NB];
      return rTab[k] + (rTab[k + 1] - rTab[k]) * (x - k);
    };
    const buildReach = () => {
      const tot = reachTot + N0_REACH;
      let a = 0, prev = 0, qi = 0;
      for (let i = 0; i < NREACH; i++) reachQ[i] = NBR * RW;
      for (let i = 0; i < NBR && qi < NREACH; i++) {
        const f = (a + reachCnt[i] + N0_REACH * erf((i + 1) * RW / Math.SQRT2)) / tot;
        while (qi < NREACH && f >= RQ[qi]) { reachQ[qi] = (i + (f > prev ? (RQ[qi] - prev) / (f - prev) : 1)) * RW; qi++; }
        a += reachCnt[i]; prev = f;
      }
    };
    const quants = (kd: number, b: number) => {
      const o = qVal[kd][b];
      if (qOk[kd][b]) return o;
      const cnt = zCnt[kd][b], n0 = N0S * (1 << b), tot = zTot[kd][b] + n0, k50 = P50[b], k90 = P90[b];
      let a = 0, prev = 0, qi = 0;
      for (let i = 0; i < NQ; i++) o[i] = NBZ * ZW;
      for (let i = 0; i < NBZ && qi < NQ; i++) {
        const f = (a + cnt[i] + n0 * priorCdf((i + 1) * ZW, k50, k90)) / tot;
        while (qi < NQ && f >= QS[qi]) { o[qi] = (i + (f > prev ? (QS[qi] - prev) / (f - prev) : 1)) * ZW; qi++; }
        a += cnt[i]; prev = f;
      }
      qOk[kd][b] = true;
      return o;
    };
    const quantsLive = () => {
      if (qOkL) return qValL;
      const tot = zTotL + N0L;
      let a = 0, prev = 0, qi = 0;
      for (let i = 0; i < NQ; i++) qValL[i] = NBZ * ZW;
      for (let i = 0; i < NBZ && qi < NQ; i++) {
        const f = (a + zCntL[i] + N0L * priorCdf((i + 1) * ZW, LIVE_K50, LIVE_K90)) / tot;
        while (qi < NQ && f >= QS[qi]) { qValL[qi] = (i + (f > prev ? (QS[qi] - prev) / (f - prev) : 1)) * ZW; qi++; }
        a += zCntL[i]; prev = f;
      }
      qOkL = true;
      return qValL;
    };
    const multipliers = (kd: number, age: number, o: Float64Array) => {
      let b = 0, p = 1;
      while (p * 2 <= age && b < NAGE - 1) { p *= 2; b++; }
      let frac = age / p - 1; if (frac > 1) frac = 1;
      let u = b + frac - 0.5; if (u < 0) u = 0; if (u > NAGE - 1) u = NAGE - 1;
      let b0 = Math.trunc(u); if (b0 > NAGE - 2) b0 = NAGE - 2;
      const f = u - b0;
      const q0 = quants(kd, b0), q1 = quants(kd, b0 + 1);
      for (let i = 0; i < NQ; i++) o[i] = q0[i] + (q1[i] - q0[i]) * f;
      return b;
    };
    buildReach(); buildReturnTable();

    const foldLive = (src: number, rg: number, w: number) => {
      const yn = 3 * MEM;
      acc.LN++;
      if (acc.LN <= yn) acc.LY = acc.LY + (w - acc.LY) / acc.LN;
      else acc.LY = acc.LY + (2 / (yn + 1)) * (w - acc.LY);
      const hv = MEM * acc.LY;
      if (w > 0 && hv > 0) {
        const d = Math.exp(-LN2 * w / hv), we = hv / LN2 * (1 - d), lw = acc.LW * d;
        const q = src - acc.LM, wnn = lw + we, r = q * we / wnn;
        acc.LM = acc.LM + r;
        acc.LT = acc.LT * d + r * lw * q + we * rg * rg / 12;
        acc.LW = wnn; acc.LC++;
      }
    };
    // Fold(): the 1-minute bar into the session accumulator (chart = 1-minute → own bars, end-stamped)
    const fold = (i: number) => {
      const h = s.h[i], l = s.l[i], c = s.c[i];
      let v = s.v[i];
      if (!fin(h) || !fin(l) || !fin(c)) return;
      if (!fin(v)) v = 0;
      const tSec = s.t[i] * 60;
      const wasFirst = acc.First;
      let newSess = false;
      const sn = sessionNum(s, i);
      if (acc.First || sn !== acc.Sess) {
        newSess = acc.First || sn !== acc.Sess;
        acc.Sess = sn;
        acc.SessBeginSec = ((sn - 1) * 1440 + 1080) * 60; // CME session begins 18:00 NY
      }
      let kind = newSess ? 0 : -1;
      let boundary = acc.SessBeginSec;
      { // SessionAndCashOpen
        const sod = minuteOfDay(s, i) * 60;
        const past = sod > CASH_SEC;
        const opn = tSec - (sod - CASH_SEC);
        const prev = acc.First ? acc.SessBeginSec - 1e-7 : acc.PrevT;
        if (past && opn >= acc.SessBeginSec && prev <= opn) { kind = 1; boundary = opn; }
      }
      const src = (h + l) * 0.5; // Midrange
      if (kind >= 0) {
        acc.Seq++; acc.Kind = kind; acc.Count = 0; acc.W = 0; acc.T = 0; acc.M = src; acc.T0 = i;
        acc.Late = wasFirst && tSec - boundary > LATE_SEC;
      }
      if (v > 0 && !acc.HasVol) {
        acc.HasVol = true; acc.W = 0; acc.T = 0; acc.M = src;
        acc.LW = 0; acc.LT = 0; acc.LM = src; acc.LY = 0; acc.LN = 0; acc.LC = 0;
      }
      const w = acc.HasVol ? (v > 0 ? v : 0) : 1;
      if (w > 0) {
        const q = src - acc.M, wnn = acc.W + w, r = q * w / wnn, rg = h - l;
        acc.M = acc.M + r;
        acc.T = acc.T + r * acc.W * q + w * rg * rg / 12;
        acc.W = wnn;
      }
      foldLive(src, h - l, w);
      acc.Count++; acc.PrevT = tSec; acc.First = false;
    };

    // ---------------------------------------------------------------- Engine(), bar by bar
    for (let b = 0; b < n; b++) {
      const hi = s.h[b], lo = s.l[b], cl = s.c[b];
      let evc = 0, evL = 0;
      const sb0 = acc.Sess, first0 = acc.First;
      fold(b);
      const good = fin(cl) && fin(hi) && fin(lo);
      const aseq = acc.Seq;
      let dd = 0;
      if (b > 0) { const pc = s.c[b - 1]; dd = (cl - pc) * (cl - pc); }
      if (b > 0 && ((!first0 && acc.Sess !== sb0) || !fin(dd))) dd = evVar;
      let dw = acc.Seq !== prevSeqW ? acc.W : acc.W - prevW;
      if (dw < 0) dw = 0;
      prevW = acc.W; prevSeqW = acc.Seq;
      if (b === 0) { evVar = 0; volBar = dw; }
      else if (b <= vl) { evVar = evVar + (dd - evVar) / b; volBar = volBar + (dw - volBar) / (b + 1); }
      else { const al = 2 / (vl + 1); evVar = evVar + al * (dd - evVar); volBar = volBar + al * (dw - volBar); }
      let slot = Math.trunc(minuteOfDay(s, b) / SLOT_MIN); if (slot < 0) slot = 0; if (slot >= NSLOT) slot = NSLOT - 1;
      const wb = b % wn;
      const have = aseq > 0 && acc.W > 0 && good;
      const vw = have ? acc.M : NaN;
      let sig = have && acc.T > 0 ? Math.sqrt(acc.T / acc.W) : 0;
      if (!fin(sig)) sig = 0;
      const haveL = acc.LW > 0 && good;
      const lv = haveL ? acc.LM : NaN;
      let ls = haveL && acc.LT > 0 ? Math.sqrt(acc.LT / acc.LW) : 0;
      if (!fin(ls)) ls = 0;

      winC[wb] = cl; winH[wb] = hi; winL[wb] = lo; winV[wb] = vw; winEv[wb] = evVar; winVb[wb] = volBar;
      winSlot[wb] = slot; winSeq[wb] = aseq; winDd[wb] = dd; winDw[wb] = dw; winSb[wb] = acc.Sess;
      const j = b - HZ;
      if (j >= vl) {
        const wj = j % wn, aj = winSeq[wj], sbj = winSb[wj];
        let sameA = aj > 0, sameS = true, fw = 0, fv = 0, touch = false;
        const up = winC[wj] >= winV[wj];
        let mx = -Infinity, mn = Infinity;
        for (let k = j + 1; k <= b; k++) {
          const w = k % wn;
          if (winSb[w] !== sbj) sameS = false;
          if (winSeq[w] !== aj) sameA = false;
          fw += winDd[w]; fv += winDw[w];
          if (sameA && (up ? winL[w] <= winV[w] : winH[w] >= winV[w])) touch = true;
          if (winH[w] > mx) mx = winH[w];
          if (winL[w] < mn) mn = winL[w];
        }
        if (sameS || sameA) {
          const sj = winSlot[wj];
          if (fw > 0 && winEv[wj] > 0) { rhoSum[sj] += Math.log(fw / (winEv[wj] * HZ)); rhoCnt[sj] += 1; }
          if (fv > 0 && winVb[wj] > 0) { rvSum[sj] += Math.log(fv / (winVb[wj] * HZ)); rvCnt[sj] += 1; }
          const zrj = winZr[wj];
          if (sameA && !Number.isNaN(zrj)) {
            const q = Math.floor(zrj * 10);
            const k2 = q >= NB ? NB : Math.trunc(q);
            rCnt[k2] += 1;
            if (touch) rHit[k2] += 1;
            buildReturnTable();
            const tr = tierOf(winOd[wj]);
            if (j >= shownFrom) { trackExpo[tr]++; if (touch) trackHits[tr]++; } // example hygiene: count only the shown window
          }
        }
        if (sameS) {
          const uj = winUnit[wj], cj = winC[wj];
          if (!Number.isNaN(uj) && fin(cj) && mx >= mn) {
            for (let s2 = 0; s2 < 2; s2++) {
              let x = (s2 === 0 ? mx - cj : cj - mn) / uj;
              if (!fin(x)) continue;
              if (x < 0) x = 0;
              const q = Math.floor(x / RW);
              reachCnt[q >= NBR - 1 ? NBR - 1 : Math.trunc(q)] += 1;
              reachTot += 1;
            }
            buildReach();
          }
        }
      }
      let unit = NaN;
      if (b >= vl && evVar > 0) {
        const rho = Math.exp(rhoSum[slot] / (rhoCnt[slot] + N0_RHO));
        const u2 = evVar * HZ * rho;
        unit = u2 > 0 ? Math.sqrt(u2) : 0;
        if (!(unit > 0) || !fin(unit)) unit = NaN;
      }
      winUnit[wb] = unit;

      const newAnchor = aseq !== stPrevSeq;
      if (newAnchor) { stState = 0; stPend = 0; stOwed = 0; stAge = 1; } else stAge++;
      stPrevSeq = aseq;
      if (!good) { stState = 0; stPend = 0; stOwed = 0; }
      let flags = 0, odds = NaN;
      if (have) {
        const formed = acc.Count >= FORM_BARS && sig > 0;
        const z = sig > 0 ? (cl - vw) / sig : 0;
        const bin = multipliers(acc.Kind, stAge, kq);
        const k50 = kq[Q_CORE], k90 = kq[Q_EDGE];
        const az = Math.abs(z);
        if (sig > 0) {
          const cq = Math.floor(az / ZW);
          const ci = cq >= NBZ - 1 ? NBZ - 1 : Math.trunc(cq);
          zCnt[acc.Kind][bin][ci] += 1; zTot[acc.Kind][bin] += 1; qOk[acc.Kind][bin] = false;
          if (b >= shownFrom) { // example hygiene: count only the shown window
            heldAll++;
            if (az <= k50) heldCore++;
            if (az <= k90) heldEdge++;
          }
        }
        const side = formed ? (z > k90 ? 1 : z < -k90 ? -1 : 0) : 0;
        if (stState === 0) {
          if (side !== 0 && stPend === side) { stState = side; evc = side; stOwed = side; }
          stPend = side;
        } else {
          if (stState * z <= k50) { evc = EV_BACK * stState; stState = 0; }
          stPend = side;
        }
        if (stOwed !== 0 && evc !== stOwed && (stOwed > 0 ? lo <= vw : hi >= vw)) { evc = EV_VWAP * stOwed; stOwed = 0; stState = 0; }
        if (!Number.isNaN(unit)) {
          const rv = Math.exp(rvSum[slot] / (rvCnt[slot] + N0_RHO));
          const den = acc.W + HZ * volBar * rv;
          const decay = den > 0 ? acc.W / den : 1;
          const zr = (cl >= vw ? cl - vw : vw - cl) * decay / unit;
          winZr[wb] = zr;
          odds = oddsOf(zr);
          winOd[wb] = odds;
        } else winZr[wb] = NaN;
        P.vw[b] = vw; P.sig[b] = sig; P.z[b] = z;
        P.up[b] = vw + k90 * sig; P.dn[b] = vw - k90 * sig; P.cup[b] = vw + k50 * sig; P.cdn[b] = vw - k50 * sig;
        P.odds[b] = Number.isNaN(odds) ? NaN : 100 * odds;
        if (formed) flags |= F_FORMED;
        if (stState === 0 && stPend > 0) flags |= F_PEND_UP;
        if (stState === 0 && stPend < 0) flags |= F_PEND_DN;
        for (let q = 0; q < NQ; q++) P.K[b * NQ + q] = kq[q];
      } else winZr[wb] = NaN;

      let zone = 0;
      if (haveL) {
        const formedL = acc.LC >= FORM_BARS && ls > 0;
        const zl = ls > 0 ? (cl - lv) / ls : 0;
        const kl = quantsLive();
        const l50 = kl[Q_CORE], l90 = kl[Q_EDGE];
        for (let q = 0; q < NQ; q++) P.KL[b * NQ + q] = kl[q];
        const azl = Math.abs(zl);
        if (formedL) {
          const cq = Math.floor(azl / ZW);
          const ci = cq >= NBZ - 1 ? NBZ - 1 : Math.trunc(cq);
          zCntL[ci] += 1; zTotL += 1; qOkL = false;
          if (b >= shownFrom) { // example hygiene: count only the shown window
            heldLAll++;
            if (azl <= l50) heldLCore++;
            if (azl <= l90) heldLEdge++;
          }
          zone = zl > l90 ? 2 : zl < -l90 ? -2 : cl >= lv ? 1 : -1;
          flags |= F_LFORMED;
        }
        const sideL = zone === 2 ? 1 : zone === -2 ? -1 : 0;
        if (!formedL) stL = 0;
        if (stL === 0) { if (sideL !== 0 && pendL === sideL) { stL = sideL; evL = sideL; } }
        else if (stL * zl <= l50) { evL = EV_BACK * stL; stL = 0; }
        pendL = sideL;
        P.lv[b] = lv; P.lz[b] = zl;
        P.lup[b] = lv + l90 * ls; P.ldn[b] = lv - l90 * ls; P.lcup[b] = lv + l50 * ls; P.lcdn[b] = lv - l50 * ls;
        if (!Number.isNaN(unit)) for (let q = 0; q < NREACH; q++) P.reach[b * NREACH + q] = reachQ[q] * unit;
        P.rate[b] = acc.LY > 0 ? volBar / (MEM * acc.LY) : NaN;
      } else { stL = 0; pendL = 0; }
      P.lzone[b] = zone; P.lev[b] = evL;
      if (newAnchor) flags |= F_ANCHOR;
      if (acc.Late) flags |= F_LATE;
      if (!acc.HasVol) flags |= F_NOVOL;
      P.state[b] = stState; P.ev[b] = evc; P.flag[b] = flags; P.seq[b] = aseq;
      P.cnt[b] = aseq === 0 ? 0 : Math.min(255, acc.Count);
      if (newAnchor && aseq > 0) seqT0[aseq] = acc.T0;
      const hb = b * 6;
      P.held[hb] = heldAll; P.held[hb + 1] = heldCore; P.held[hb + 2] = heldEdge; P.held[hb + 3] = heldLAll; P.held[hb + 4] = heldLCore; P.held[hb + 5] = heldLEdge;
      for (let t = 0; t < 4; t++) { P.track[b * 8 + t] = trackExpo[t]; P.track[b * 8 + 4 + t] = trackHits[t]; }

      // BuildSnapshot's per-bar codes
      let zc = Z_NONE;
      const up = P.up[b], dn = P.dn[b], vwb = P.vw[b];
      if (!Number.isNaN(vwb) && fin(cl) && (flags & F_FORMED)) {
        const k50 = P.K[b * NQ + Q_CORE], k90 = P.K[b * NQ + Q_EDGE];
        let cu = vwb, cd = vwb;
        if (k90 > 0 && !Number.isNaN(k50)) { cu = vwb + (up - vwb) * k50 / k90; cd = vwb + (dn - vwb) * k50 / k90; }
        if (cl > up) zc = Z_UP3; else if (cl < dn) zc = Z_DN3;
        else if (stState > 0) zc = Z_UP2; else if (stState < 0) zc = Z_DN2;
        else if (cl > cu) zc = Z_UP1; else if (cl < cd) zc = Z_DN1;
      }
      P.zone[b] = zc;
      P.tier[b] = Number.isNaN(P.odds[b]) ? 0 : tierOf(P.odds[b] / 100);
      P.runLen[b] = b > 0 && P.state[b - 1] === stState ? P.runLen[b - 1] + 1 : 1;
    }

    // ---------------------------------------------------------------- the header's words at a bar
    const sessionRead = (k: number): { txt: string; tone: Tone; word: string } => {
      const c = s.c[k], vw = Number.isNaN(P.up[k]) || Number.isNaN(P.dn[k]) ? NaN : P.vw[k];
      const have = !Number.isNaN(vw) && fin(c);
      const az = Number.isNaN(P.z[k]) ? 0 : Math.abs(P.z[k]);
      const dist = have ? c - vw : 0;
      const where = fdist(dist) + DOT + az.toFixed(1) + SG;
      const ev = P.ev[k], st = P.state[k], fl = P.flag[k];
      if (!have) return { txt: "WAITING FOR THE FIRST BAR", tone: "neutral", word: "WAITING" };
      if (ev === EV_EXT || ev === -EV_EXT) return { txt: `EXTENDED  ${ev > 0 ? UP : DN} ${where}`, tone: ev > 0 ? "strongBull" : "strongBear", word: "EXTENDED" };
      if (ev === EV_BACK || ev === -EV_BACK) return { txt: `BACK IN VALUE${DOT}${where}`, tone: "neutral", word: "BACK IN VALUE" };
      if (ev === EV_VWAP || ev === -EV_VWAP) return { txt: `AT VWAP${DOT}${fp(vw)}`, tone: "neutral", word: "AT VWAP" };
      if (!(fl & F_FORMED)) {
        const cnt = P.cnt[k];
        return { txt: "FORMING" + (cnt > 0 && cnt < FORM_BARS ? `${DOT}${cnt} of ${FORM_BARS} bars` : ""), tone: "neutral", word: "FORMING" };
      }
      if (st !== 0) {
        const len = P.runLen[k];
        const beyond = P.zone[k] === Z_UP3 || P.zone[k] === Z_DN3;
        return { txt: `EXTENDED  ${st > 0 ? UP : DN} ${where}${DOT}${len} ${len === 1 ? "bar" : "bars"}`, tone: st > 0 ? (beyond ? "strongBull" : "bull") : (beyond ? "strongBear" : "bear"), word: "EXTENDED" };
      }
      if (fl & (F_PEND_UP | F_PEND_DN)) {
        const pu = (fl & F_PEND_UP) !== 0;
        return { txt: `OUTSIDE  ${pu ? UP : DN} ${where}${DOT}PENDING`, tone: pu ? "strongBull" : "strongBear", word: "OUTSIDE" };
      }
      return { txt: `IN VALUE  ${dist >= 0 ? UP : DN} ${where}`, tone: "neutral", word: "IN VALUE" };
    };
    const lineTier = (k: number) => {
      const z = P.lzone[k];
      if (z === 2) return 4; if (z === -2) return 5; if (z === 1) return 2; if (z === -1) return 3;
      return Number.isNaN(P.lv[k]) ? 1 : 0;
    };
    const nowRead = (k: number): { txt: string; tone: Tone } | null => {
      const lvN = P.lv[k], c = s.c[k];
      if (Number.isNaN(lvN) || !fin(c) || Number.isNaN(P.lup[k])) return null;
      const lz = P.lzone[k], ld = c - lvN;
      const w2 = lz === 2 ? "ABOVE THE BAND" : lz === -2 ? "BELOW THE BAND" : lz === 1 ? "PREMIUM" : lz === -1 ? "DISCOUNT" : "FORMING";
      const t = lineTier(k);
      const tone: Tone = lz === 0 ? "neutral" : t === 4 ? "strongBull" : t === 5 ? "strongBear" : t === 2 ? "bull" : t === 3 ? "bear" : "neutral";
      return { txt: `NOW  ${w2}  ${ld >= 0 ? UP : DN} ${fdist(ld)}`, tone };
    };

    // ---------------------------------------------------------------- events
    const events: StudyEvent[] = [];
    const from = Math.max(1, s.replayFrom - 1);
    for (let b = from; b < n; b++) {
      const ev = P.ev[b], c = s.c[b];
      if (ev !== 0) {
        const kind = Math.abs(ev), up = ev > 0, vw = P.vw[b];
        if (kind === EV_EXT) {
          const edge = up ? P.up[b] : P.dn[b];
          events.push({
            i: b, price: c, title: "EXTENDED", tone: up ? "strongBull" : "strongBear", weight: 3,
            text: `${hhmm(s, b)} — EXTENDED ${up ? "above" : "below"}: a second close beyond the session's 90% edge (${fp(edge)}) confirmed it. The close ${fp(c)} is ${fdist(c - vw)} from the session VWAP ${fp(vw)}, ${Math.abs(P.z[b]).toFixed(1)}${SG}; the state now holds through dips back inside the edge.`,
          });
        } else if (kind === EV_BACK) {
          const core = up ? P.cup[b] : P.cdn[b];
          events.push({
            i: b, price: c, title: "BACK IN VALUE", tone: "neutral", weight: 2,
            text: `${hhmm(s, b)} — the close ${fp(c)} came back inside the session's 50% core (${fp(core)}), which ends the extension ${up ? "above" : "below"}. The session VWAP stands at ${fp(vw)}.`,
          });
        } else {
          events.push({
            i: b, price: vw, title: "AT VWAP", tone: "neutral", weight: 2,
            text: `${hhmm(s, b)} — the first bar since the extension ${up ? "above" : "below"} to trade at the session VWAP ${fp(vw)}${up ? ` (low ${fp(s.l[b])})` : ` (high ${fp(s.h[b])})`}. The tool rings it on the SESSION strip and clears the extension.`,
          });
        }
      }
      if (P.lev[b] === 1 || P.lev[b] === -1) {
        const up = P.lev[b] > 0, edge = up ? P.lup[b] : P.ldn[b];
        events.push({
          i: b, price: c, title: "STRETCHED", tone: up ? "strongBull" : "strongBear", weight: 1,
          text: `${hhmm(s, b)} — STRETCHED ${up ? "above" : "below"} the live band: a second close beyond its 90% edge (${fp(edge)}). Close ${fp(c)}, ${fdist(c - P.lv[b])} from the live VWAP ${fp(P.lv[b])}.`,
        });
      }
      if ((P.flag[b] & F_ANCHOR) && P.seq[b] > 0 && minuteOfDay(s, b) > 570 && minuteOfDay(s, b) <= 600) {
        events.push({
          i: b, price: (s.h[b] + s.l[b]) / 2, title: "FORMING", tone: "neutral", weight: 1,
          text: `${hhmm(s, b)} — the cash open starts a fresh session VWAP at ${fp(P.vw[b])}. It raises no state and no event for its first ${FORM_BARS} one-minute bars while the anchor forms; the live VWAP (${fp(P.lv[b])}) carries on unbroken.`,
        });
      }
    }
    events.sort((a, b) => a.i - b.i);

    // ---------------------------------------------------------------- panel frame (FrameRange + HoldRange + Reserves)
    let lastPh = 200; // the tool also scales from the last painted height (lastPh)
    const frame = (i0: number, to: number): [number, number] | null => {
      if (to < i0) return null;
      let mn = Infinity, mx = -Infinity;
      if (!Number.isNaN(P.lup[to]) && P.lup[to] > mx) mx = P.lup[to];
      if (!Number.isNaN(P.ldn[to]) && P.ldn[to] < mn) mn = P.ldn[to];
      for (let i = i0; i <= to; i++) { const c = s.c[i]; if (c > mx) mx = c; if (c < mn) mn = c; }
      if (mx < mn) return null;
      let span = mx - mn;
      if (!(span > 4 * s.tick)) { mx += 2 * s.tick; mn -= 2 * s.tick; span = mx - mn; }
      if (fwdGeo && fwdGeo.k === to) {
        const room = FWD_CAP * span;
        if (fwdGeo.hi > mx) mx = fwdGeo.hi < mx + room ? fwdGeo.hi : mx + room;
        if (fwdGeo.lo < mn) mn = fwdGeo.lo > mn - room ? fwdGeo.lo : mn - room;
      }
      const sp = mx - mn;
      const g = gridStep(sp * (1 + 2 * HOLD_MARGIN), s.tick);
      const lo = Math.floor((mn - HOLD_MARGIN * sp) / g) * g, hi = Math.ceil((mx + HOLD_MARGIN * sp) / g) * g;
      // Reserves(): head and foot bands in value terms
      const ph = lastPh, tot = 1 + HEADT + FOOT_T;
      const hPx = Math.min(HEAD_PX, ph * HEADT / tot), fPx = Math.min(FOOT_PX, ph * FOOT_T / tot);
      const body = ph - hPx - fPx, perPx = (hi - lo) / body;
      return body > 1 ? [lo - fPx * perPx, hi + hPx * perPx] : [lo - (hi - lo) * FOOT_T, hi + (hi - lo) * HEADT];
    };
    let fwdGeo: { k: number; lo: number; hi: number } | null = null;

    // ---------------------------------------------------------------- drawing
    const drawPanel = (d: Draw) => {
      const pv = d.pane("vwap");
      if (!pv) return;
      const P0 = pv.top, P1 = pv.bottom, ph = P1 - P0;
      lastPh = ph;
      const pal = palette(d.th.bg);
      const ink = (a: number) => rgba(pal.ink, a), ground = (a: number) => rgba(pal.ground, a);
      const zoneHue = (side: number) => (side > 0 ? pal.bear : pal.bull);
      const ctx = d.ctx;
      const bFrom = d.i0, bTo = Math.min(d.i1, d.k);
      if (bTo < bFrom || ph < 14) return;
      const kq2 = (b: number, q: number) => P.KL[b * NQ + q];
      const tot = 1 + HEADT + FOOT_T;
      const hPx = Math.min(HEAD_PX, ph * HEADT / tot), fPx = Math.min(FOOT_PX, ph * FOOT_T / tot);
      const bodyTop = P0 + hPx, bodyBot = P1 - fPx;
      const slotW = d.bw, x1 = 2, x2 = d.plotRight - 2;
      const Y = (v: number) => pv.y(v);
      const stripsOn = d.on("strips") && hPx >= HEAD_ROW + HEAD_AIR + RIB_H + RIB_GAP - 0.5 && fPx >= RIB_GAP + RIB_H + FOOT_AIR - 0.5;
      const fits = bodyBot - bodyTop >= 24;
      const k = bTo;

      ctx.save();
      ctx.beginPath(); ctx.rect(0, bodyTop, d.plotRight, Math.max(0, bodyBot - bodyTop)); ctx.clip();
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      const path = (pts: [number, number][]) => { ctx.beginPath(); pts.forEach((p, q) => (q ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); };
      const stroke = (pts: [number, number][], col: string, w: number, dash?: number[]) => {
        if (pts.length < 2) return;
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash ?? []);
        if (dash) ctx.lineCap = "butt";
        path(pts); ctx.stroke(); ctx.restore();
      };
      const fillBetween = (outer: [number, number][], inner: [number, number][], col: string) => {
        if (outer.length < 2) return;
        ctx.beginPath();
        outer.forEach((p, q) => (q ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        for (let q = inner.length - 1; q >= 0; q--) ctx.lineTo(inner[q][0], inner[q][1]);
        ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      };

      if (fits) {
        // ---- RenderTerrain: the live band, 9 contours a side
        for (let strength = 0; strength < 2; strength++) for (const side of [1, -1]) {
          const segs: { x: number[]; y: number[][] }[] = [];
          let i = bFrom;
          while (i <= bTo) {
            if (Number.isNaN(P.lv[i])) { i++; continue; }
            const formed = (P.flag[i] & F_LFORMED) !== 0;
            const a = i;
            while (i <= bTo && !Number.isNaN(P.lv[i]) && ((P.flag[i] & F_LFORMED) !== 0) === formed) i++;
            const b = i - 1;
            if (formed !== (strength === 0)) continue;
            const joinLeft = a > bFrom && !Number.isNaN(P.lv[a - 1]);
            const joinRight = i <= bTo && !Number.isNaN(P.lv[i]);
            const aa = joinLeft ? a - 1 : a;
            const sg = { x: [] as number[], y: Array.from({ length: NQ + 1 }, () => [] as number[]) };
            for (let q = aa; q <= b; q++) {
              const v0 = P.lv[q], e = side > 0 ? P.lup[q] : P.ldn[q], k90 = kq2(q, Q_EDGE);
              let x = d.x(q);
              if (q === aa && !joinLeft) x -= slotW / 2;
              if (q === b && !joinRight) x += slotW / 2;
              x = Math.max(x1, Math.min(x2, x));
              sg.x.push(x); sg.y[0].push(Y(v0));
              for (let jj = 1; jj <= NQ; jj++) {
                const kj = kq2(q, jj - 1);
                const v = k90 > 0 && !Number.isNaN(kj) ? v0 + (e - v0) * kj / k90 : jj === NQ ? e : v0;
                sg.y[jj].push(Y(v));
              }
            }
            if (sg.x.length >= 2) segs.push(sg);
          }
          if (!segs.length) continue;
          const mul = strength === 0 ? 1 : 0.5, hue = zoneHue(side);
          const P2 = segs.map((sg) => sg.y.map((ys) => sg.x.map((x, q) => [x, ys[q]] as [number, number])));
          for (let jj = 0; jj < NQ; jj++) for (const pp of P2) fillBetween(pp[NQ], pp[jj], rgba(hue, 0.045 * mul));
          for (let jj = 1; jj < NQ; jj++) for (const pp of P2) stroke(pp[jj], rgba(hue, (jj === Q_CORE + 1 ? 0.78 : 0.30) * mul), 1);
          for (const pp of P2) stroke(pp[NQ], rgba(hue, mul), 2);
        }

        // ---- RenderSession: dashed session VWAP and its edges, broken at each anchor
        for (let pass = 0; pass < 3; pass++) {
          const src = pass === 0 ? P.vw : pass === 1 ? P.up : P.dn;
          let run: [number, number][] = [], seq = 0;
          const flush = () => { if (run.length > 1) stroke(run, pass === 0 ? ink(0.95) : ink(0.55), pass === 0 ? 1.6 : 1, pass === 0 ? [6.4, 4.8] : [4, 3]); run = []; };
          for (let q = bFrom; q <= bTo; q++) {
            const ok = !Number.isNaN(src[q]) && !Number.isNaN(P.up[q]) && (pass === 0 || (P.flag[q] & F_FORMED) !== 0);
            if (!ok || (run.length && P.seq[q] !== seq)) { flush(); if (!ok) continue; }
            if (!run.length) seq = P.seq[q];
            run.push([d.x(q), Y(src[q])]);
          }
          flush();
        }

        // ---- RenderIslands: beyond the live edge, filled in the strong colour
        for (const up of [true, false]) {
          const want = up ? 2 : -2;
          let i = bFrom;
          while (i <= bTo) {
            if (P.lzone[i] !== want) { i++; continue; }
            const a = i;
            while (i <= bTo && P.lzone[i] === want) i++;
            const b = i - 1;
            const a0 = a > bFrom && !Number.isNaN(P.lv[a - 1]) ? a - 1 : a;
            const b0 = i <= bTo && !Number.isNaN(P.lv[i]) ? i : b;
            if (b0 <= a0) continue;
            const top: [number, number][] = [], base: [number, number][] = [];
            for (let q = a0; q <= b0; q++) {
              const e = up ? P.lup[q] : P.ldn[q], c = s.c[q];
              top.push([d.x(q), Y(up ? Math.max(c, e) : Math.min(c, e))]);
              base.push([d.x(q), Y(e)]);
            }
            fillBetween(top, base, rgba(up ? pal.sbull : pal.sbear, 0.52));
          }
        }

        // ---- RenderVwap: the live VWAP, ground halo then ink
        {
          const runs: [number, number][][] = [];
          let run: [number, number][] = [];
          for (let q = bFrom; q <= bTo; q++) {
            if (Number.isNaN(P.lv[q])) { if (run.length) runs.push(run); run = []; continue; }
            run.push([d.x(q), Y(P.lv[q])]);
          }
          if (run.length) runs.push(run);
          for (const r of runs) stroke(r, ground(0.7), 3.8);
          for (const r of runs) stroke(r, ink(0.95), 1.8);
        }

        // ---- RenderTrace: the close as a line, coloured by the live zone
        {
          const w = Math.max(1, 2) * 0.8 + 0.2;
          const pts: [number, number][] = [], tiers: number[] = [];
          for (let q = bFrom; q <= bTo; q++) { pts.push([d.x(q), Y(s.c[q])]); tiers.push(lineTier(q)); }
          stroke(pts, ground(0.7), w + 2.2);
          const tierCol = (t: number) => (t === 0 ? ink(0.55) : t === 2 ? rgba(pal.bull, 1) : t === 3 ? rgba(pal.bear, 1) : t === 4 ? rgba(pal.sbull, 1) : t === 5 ? rgba(pal.sbear, 1) : ink(0.92));
          for (let t = 0; t < 6; t++) {
            let seg: [number, number][] = [];
            for (let q = 1; q < pts.length; q++) {
              if (tiers[q] !== t) { if (seg.length > 1) stroke(seg, tierCol(t), t >= 4 ? w + 0.7 : w); seg = []; continue; }
              if (!seg.length) seg.push(pts[q - 1]);
              seg.push(pts[q]);
            }
            if (seg.length > 1) stroke(seg, tierCol(t), t >= 4 ? w + 0.7 : w);
          }
        }
      }

      // ---- RenderForward (only when the replay leaves room for it — see DEVIATIONS 2)
      let fwdOn = false;
      const c = s.c[k], lvK = P.lv[k];
      const xBar = d.x(k);
      const r60 = P.reach[k * NREACH], r25 = P.reach[k * NREACH + 1], r05 = P.reach[k * NREACH + 2], rate = P.rate[k];
      const haveReach = fin(r60) && fin(r25) && fin(r05) && r60 > 0;
      const haveBand = !Number.isNaN(lvK) && (P.flag[k] & F_LFORMED) !== 0 && fin(rate) && rate > 0;
      let geoLo = c, geoHi = c;
      if (fits && slotW >= 1.5 && (haveReach || haveBand) && k === d.k) {
        const pxS = fpc(c);
        const xEnd = x2 - 4; // labels live in the axis here, so no label column is reserved
        const fwdBars = (w: number) => { if (!(w >= 50)) return 0; let K = Math.floor(w / slotW); if (K > HZ) K = HZ; return K < 2 || K * slotW < 30 ? 0 : K; };
        let rul = 0, K = 0;
        if (haveReach) {
          const plain = xEnd - xBar, full = RUL_LEAD + (5 + Math.max(pxS.length + 2, 8)) * RUL_CH + 6, odds = RUL_LEAD + 5 * RUL_CH + 6;
          if (plain - full >= plain * 0.5) { K = fwdBars(plain - full); if (K > 0) rul = 2; }
          if (K === 0 && plain - odds >= plain * 0.5) { K = fwdBars(plain - odds); if (K > 0) rul = 1; }
        }
        if (K === 0) K = fwdBars(xEnd - xBar);
        if (K >= 2) {
          fwdOn = true;
          const xK = xBar + K * slotW;
          const N = Math.max(8, Math.min(160, Math.round((xK - xBar) / 6)));
          const yC = Y(c);
          if (yC >= bodyTop && yC <= bodyBot) d.rect(xBar, Math.floor(yC), xK, Math.floor(yC) + 1, ink(0.28));
          const sK = Math.sqrt(K / HZ);
          if (haveReach) {
            for (let t = 0; t < 3; t++) {
              const r = t === 0 ? r05 : t === 1 ? r25 : r60;
              const A: [number, number][] = [], B: [number, number][] = [];
              for (let q = 0; q <= N; q++) { const jj = (K * q) / N, dv = r * Math.sqrt(jj / HZ); A.push([xBar + jj * slotW, Y(c + dv)]); B.push([xBar + jj * slotW, Y(c - dv)]); }
              fillBetween(A, B, ink(t === 0 ? 0.022 : t === 1 ? 0.03 : 0.048));
              stroke(A, ink(t === 2 ? 0.55 : 0.32), 1); stroke(B, ink(t === 2 ? 0.55 : 0.32), 1);
            }
            geoHi = c + r05 * sK; geoLo = c - r05 * sK;
          }
          if (haveBand) {
            const k90 = kq2(k, Q_EDGE), hw0 = P.lup[k] - lvK, gap = lvK - c, kg = Number.isNaN(k90) ? 0 : k90 * gap;
            for (let line = 0; line < 3; line++) {
              const A: [number, number][] = [];
              for (let q = 0; q <= N; q++) {
                const jj = (K * q) / N, g = Math.exp(-LN2 * rate * jj), m = c + gap * g, hw = Math.sqrt(g * hw0 * hw0 + g * (1 - g) * kg * kg);
                const v = line === 0 ? m : line === 1 ? m + hw : m - hw;
                A.push([xBar + jj * slotW, Y(v)]);
                if (v > geoHi) geoHi = v; if (v < geoLo) geoLo = v;
              }
              stroke(A, line === 0 ? ink(0.9) : rgba(zoneHue(line === 1 ? 1 : -1), 0.95), 1.4, [5.6, 4.2]);
            }
          }
          const cap = (haveReach ? (rul === 0 ? "REACH  60 · 25 · 5%  ·  " : "REACH  ·  ") : "IF PRICE HOLDS  ·  ") + `${K} bars`;
          const cw = d.measure(cap, { size: 8 }) + 6;
          if (xK - 6 - cw > xBar + 40) {
            d.rect(xK - 6 - cw, bodyBot - 12, xK - 6, bodyBot - 1, ground(0.8));
            d.text(cap, xK - 6 - cw + 3, bodyBot - 6.5, { size: 8, color: ink(0.6) });
          }
          // the ruler at the horizon
          const rulX = Math.floor(xK);
          const seg = (ya: number, yb: number, a: number) => { ya = Math.max(ya, bodyTop); yb = Math.min(yb, bodyBot); if (yb - ya >= 1) d.rect(rulX, ya, rulX + 3, yb, ink(a)); };
          if (haveReach) {
            seg(Y(c + r05 * sK), Y(c - r05 * sK), 0.2); seg(Y(c + r25 * sK), Y(c - r25 * sK), 0.24); seg(Y(c + r60 * sK), Y(c - r60 * sK), 0.4);
            if (rul > 0) {
              const used: number[] = [];
              const entry = (y: number, pc: string, word: string, bold: boolean) => {
                if (y < bodyTop + 1 || y > bodyBot - 1) return;
                const fy = Math.floor(y);
                if (bold) d.rect(rulX - 3, fy - 1, rulX + 6, fy + 2, ink(0.95)); else d.rect(rulX + 3, fy, rulX + 7, fy + 1, ink(0.8));
                let ty = Math.max(bodyTop + 1, Math.min(bodyBot - 12, fy - 6));
                if (used.some((u) => Math.abs(u - ty) < 10.5)) return;
                used.push(ty);
                const t2 = word ? `${pc}  ${word}` : pc;
                const tw = d.measure(t2, { size: 8 }) + 6;
                d.rect(rulX + RUL_LEAD - 2, ty, rulX + RUL_LEAD - 2 + tw, ty + 11, ground(0.84));
                d.text(t2, rulX + RUL_LEAD + 1, ty + 5.5, { size: 8, color: ink(bold ? 0.9 : 0.75) });
              };
              const od = P.odds[k];
              if (rul > 1 && K === HZ && !Number.isNaN(P.vw[k]) && !Number.isNaN(od)) entry(Y(P.vw[k]), `${Math.round(Math.max(1, Math.min(99, od)))}%`, "RETURN", true);
              for (let t = 0; t < 3; t++) {
                const dv = (t === 0 ? r05 : t === 1 ? r25 : r60) * sK, pc = t === 0 ? "5%" : t === 1 ? "25%" : "60%";
                entry(Y(c + dv), pc, rul > 1 ? fpc(c + dv) : "", false);
                entry(Y(c - dv), pc, rul > 1 ? fpc(c - dv) : "", false);
              }
            }
          }
        }
      }
      fwdGeo = fwdOn ? { k, lo: geoLo, hi: geoHi } : null;
      ctx.restore();

      // ---- RenderMargin: leads in the plot, labels as axis tags (DEVIATIONS 2)
      if (fits) {
        const xLast = Math.min(d.x(k) + slotW / 2, x2), leads = xLast < x2 - 4 && k === d.k;
        const taken: number[] = [];
        const free = (y: number) => y >= bodyTop && y <= bodyBot && taken.every((t) => Math.abs(t - y) >= 13);
        const tagAt = (y: number, v: number, text: string, col: string, inkC?: string) => { taken.push(y); d.tag(pv, v, text, col, inkC); };
        const tagInk = d.th.name === "dark" ? "#000" : "#fff";
        const lead = (y: number, col: string) => { if (leads) d.rect(xLast, y, x2, y + 1, col); };
        if (!Number.isNaN(lvK)) {
          const y = Math.floor(Y(lvK));
          if (y >= bodyTop && y <= bodyBot) { if (!fwdOn) lead(y, ink(0.55)); if (free(y)) tagAt(y, lvK, fpc(lvK), ink(0.95), tagInk); }
        }
        const vwK = Number.isNaN(P.up[k]) ? NaN : P.vw[k];
        if (!Number.isNaN(vwK)) {
          const y = Math.floor(Y(vwK));
          if (y >= bodyTop + 1 && y <= bodyBot - 1) { lead(y, ink(0.4)); if (free(y)) tagAt(y, vwK, fpc(vwK), ink(0.75), tagInk); }
          else {
            const below = y > bodyBot - 1, yPin = below ? bodyBot - 6 : bodyTop + 7;
            const far = `${fpc(vwK)}${below ? DN : UP}`;
            if (free(yPin)) tagAt(yPin, pv.v(yPin), far, ink(0.75), tagInk);
          }
        }
        const k50 = kq2(k, Q_CORE), k90 = kq2(k, Q_EDGE);
        if (!Number.isNaN(lvK) && k90 > 0 && !Number.isNaN(k50)) {
          const up = P.lup[k], dn = P.ldn[k];
          const cu = lvK + (up - lvK) * k50 / k90, cd = lvK + (dn - lvK) * k50 / k90;
          for (let pass = 0; pass < 2; pass++) for (const side of [1, -1]) {
            const v = pass === 0 ? (side > 0 ? up : dn) : (side > 0 ? cu : cd);
            const y = Math.floor(Y(v));
            if (y < bodyTop + 1 || y > bodyBot - 1) continue;
            const al = pass === 0 ? 0.98 : 0.7, hue = zoneHue(side);
            if (!fwdOn) lead(y, rgba(hue, al * 0.5));
            if (free(y)) tagAt(y, v, fpc(v), rgba(hue, al), "#fff");
          }
        }
        if (!Number.isNaN(vwK) && (P.flag[k] & F_FORMED)) for (const side of [1, -1]) {
          const v = side > 0 ? P.up[k] : P.dn[k];
          const y = Math.floor(Y(v));
          if (y < bodyTop + 1 || y > bodyBot - 1) continue;
          lead(y, ink(0.25));
          if (free(y)) tagAt(y, v, fpc(v), ink(0.45), tagInk);
        }
      }

      // ---- RenderStrip: SESSION over the map, RETURN under it
      if (stripsOn) {
        const strip = (y: number, value: boolean) => {
          d.rect(x1, y, x2, y + RIB_H, rgba(pal.neu, 0.14));
          const col = (code: number) => {
            if (value) switch (code) {
              case Z_UP1: return rgba(pal.bull, 0.26); case Z_UP2: return rgba(pal.bull, 0.66); case Z_UP3: return rgba(pal.sbull, 0.95);
              case Z_DN1: return rgba(pal.bear, 0.26); case Z_DN2: return rgba(pal.bear, 0.66); case Z_DN3: return rgba(pal.sbear, 0.95);
            }
            else switch (code) { case TR_HOT: return ink(0.8); case TR_WARM: return ink(0.38); case TR_COOL: return ink(0.16); }
            return null;
          };
          const codes = value ? P.zone : P.tier;
          let runSt = -1, runA = 0, runB = 0;
          for (let q = bFrom; q <= bTo + 1; q++) {
            let st = -1, xa = 0, xb = 0;
            if (q <= bTo) { st = codes[q]; xa = d.x(q) - slotW / 2; xb = xa + slotW; }
            if (st >= 0 && st === runSt && xa <= runB + 0.51) { runB = xb; continue; }
            if (runSt > 0) { const cc = col(runSt); const ra = Math.max(runA, x1), rb = Math.min(runB, x2); if (cc && rb > ra) d.rect(ra, y, rb, y + RIB_H, cc); }
            runSt = st; runA = xa; runB = xb;
          }
          if (value) { // RenderStripEvents
            const cy = y + RIB_H / 2, r = Math.max(2.2, Math.min(4.2, Math.min(slotW * 0.33 + 1.6, RIB_H * 0.44 + 1.2)));
            for (let q = bFrom; q <= bTo; q++) {
              const e = P.ev[q];
              if (!e) continue;
              const x = d.x(q), kind = Math.abs(e);
              if (kind === EV_EXT) {
                const rise = r * 0.62, yb = e > 0 ? cy + rise / 2 : cy - rise / 2, yt = e > 0 ? cy - rise / 2 : cy + rise / 2;
                stroke([[x - r, yb], [x, yt], [x + r, yb]], ground(1), 3.5);
                stroke([[x - r, yb], [x, yt], [x + r, yb]], ink(0.98), 1.5);
                continue;
              }
              const rr = Math.max(1.6, r * 0.52);
              ctx.beginPath(); ctx.arc(x, cy, rr + 1.2, 0, Math.PI * 2); ctx.fillStyle = ground(1); ctx.fill();
              ctx.beginPath(); ctx.arc(x, cy, rr, 0, Math.PI * 2);
              if (kind === EV_BACK) { ctx.fillStyle = ink(0.95); ctx.fill(); } else { ctx.strokeStyle = ink(0.95); ctx.lineWidth = 1.2; ctx.stroke(); }
            }
          }
          if (x2 - x1 > 200) {
            const word = value ? "SESSION" : "RETURN";
            const lw = d.measure(word, { size: 8 }) + (value ? 16 : 7);
            if (!(x2 - lw < d.x(bTo) + slotW)) {
              d.rect(x2 - lw, y, x2, y + RIB_H, ground(0.88));
              let lx = x2 - lw + 3;
              if (value) { d.text("V", lx, y + RIB_H / 2, { size: 8, color: ink(0.9), weight: 600 }); lx += 9; }
              d.text(word, lx, y + RIB_H / 2, { size: 8, color: ink(0.5), weight: 600 });
            }
          }
        };
        strip(bodyTop - RIB_GAP - RIB_H, true);
        strip(bodyBot + RIB_GAP, false);
      }

      // ---- RenderHeader: the two readouts, then chips right to left
      {
        const headH = Math.min(HEAD_ROW, Math.max(1, ph - 1)), chipY = P0;
        const toneCol = (t: Tone) => (t === "strongBull" ? rgba(pal.sbull, 0.95) : t === "strongBear" ? rgba(pal.sbear, 0.95) : t === "bull" ? rgba(pal.bull, 0.95) : t === "bear" ? rgba(pal.bear, 0.95) : ink(0.95));
        const xChips = x1 + 14 + d.measure("DS VWAP", { size: 10.5 }) + 4;
        let right = x2 - 2, stop = false;
        const RO = { size: 10.5, weight: 700 } as const, CH = { size: 9, weight: 600 } as const;
        const sr = sessionRead(k);
        const readout = (txt: string, col: string) => {
          let t = txt, rw = d.measure(t, RO) + 10;
          if (right - rw < xChips) { const cut = t.indexOf(DOT); if (cut > 0) { t = t.slice(0, cut); rw = d.measure(t, RO) + 10; } }
          if (right - rw < xChips) return;
          d.rect(right - rw, P0 + 0.5, right, P0 + 0.5 + headH, ground(0.78));
          d.text(t, right - rw + 5, chipY + headH / 2 + 0.5, { ...RO, color: col });
          right -= rw + 6;
        };
        readout(sr.word === "WAITING" ? sr.txt : `SESSION  ${sr.txt}`, toneCol(sr.tone));
        const nr = nowRead(k);
        if (nr) readout(nr.txt, toneCol(nr.tone));
        const chip = (txt: string, col: string) => {
          if (stop) return;
          const w = d.measure(txt, CH) + 10;
          if (right - w < xChips) { stop = true; return; }
          const hh = Math.max(1, Math.min(14, headH - 1));
          d.rect(right - w, chipY + 1, right, chipY + 1 + hh, ground(0.78));
          d.rect(right - w, chipY + 1, right - w + 2, chipY + 1 + hh, col);
          d.text(txt, right - w + 6, chipY + 1 + hh / 2 + 0.5, { ...CH, color: col });
          right -= w + 6;
        };
        const vwK = Number.isNaN(P.up[k]) ? NaN : P.vw[k];
        const have = !Number.isNaN(vwK) && fin(c);
        if (have) {
          const od = P.odds[k];
          chip(Number.isNaN(od) ? "RETURN  --" : `RETURN ${Math.round(Math.max(1, Math.min(99, od)))}%${DOT}${HZ} bars`, Number.isNaN(od) ? ink(0.55) : od >= T_HOT * 100 ? ink(0.95) : ink(od >= T_WARM * 100 ? 0.85 : 0.65));
          if (fin(r60) && r60 > 0) chip(`REACH ±${fpc(r60)}`, ink(0.9));
          if (!Number.isNaN(lvK)) chip(`LIVE ${fpc(lvK)}`, ink(0.95));
          chip(`VWAP ${fpc(vwK)}`, ink(0.95));
          if (fin(P.sig[k]) && P.sig[k] > 0) chip(`SIGMA ${fpc(P.sig[k])}`, ink(0.8));
        } else if (!Number.isNaN(lvK)) {
          if (fin(r60) && r60 > 0) chip(`REACH ±${fpc(r60)}`, ink(0.9));
          chip(`LIVE ${fpc(lvK)}`, ink(0.95));
        }
        const hb = k * 6, aAll = P.held[hb], aCore = P.held[hb + 1], aEdge = P.held[hb + 2], lAll = P.held[hb + 3], lCore = P.held[hb + 4], lEdge = P.held[hb + 5];
        if (aAll >= 200 || lAll >= 200) {
          let t = "HELD";
          if (lAll >= 200) t += `  LIVE ${pct(lEdge, lAll)} / ${pct(lCore, lAll)}`;
          if (aAll >= 200) t += `  SESSION ${pct(aEdge, aAll)} / ${pct(aCore, aAll)}`;
          chip(t, ink(0.8));
        }
        {
          const tb = k * 8;
          let t = "";
          if (P.track[tb + TR_HOT] >= 60) t += `  HOT ${pct(P.track[tb + 4 + TR_HOT], P.track[tb + TR_HOT])}`;
          if (P.track[tb + TR_WARM] >= 60) t += `  WARM ${pct(P.track[tb + 4 + TR_WARM], P.track[tb + TR_WARM])}`;
          if (P.track[tb + TR_COOL] >= 60) t += `  COOL ${pct(P.track[tb + 4 + TR_COOL], P.track[tb + TR_COOL])}`;
          if (t) chip("RETURNED" + t, ink(0.8));
        }
        stop = false;
        if (have && (P.flag[k] & F_NOVOL)) chip(`NO VOLUME${DOT}time-weighted`, ink(0.8));
        else if (have && (P.flag[k] & F_LATE)) { const t0 = seqT0[P.seq[k]]; chip(`PARTIAL ANCHOR${t0 !== undefined ? `${DOT}from ${hhmm(s, t0)}` : ""}`, ink(0.8)); }
        if (bTo < d.k) {
          const w = wall(s, bTo), mon = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][w.getUTCMonth()];
          const hh = w.getUTCHours(), h12 = hh % 12 === 0 ? 12 : hh % 12;
          chip(`AS OF  ${mon} ${w.getUTCDate()}  ${h12}:${String(w.getUTCMinutes()).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`, ink(0.95));
        }
        if (!fits) chip("panel too short for the map", ink(0.95));
      }
    };

    // the three rails on the price panel (DsVwRail), at the newest bar
    const drawRails = (d: Draw) => {
      if (!d.on("rails")) return;
      const k = d.k, pv: PaneView = d.price;
      const pal = palette(d.th.bg);
      const vw = P.vw[k], up = P.up[k], dn = P.dn[k];
      const formed = (P.flag[k] & F_FORMED) !== 0;
      const x0 = Math.max(0, d.x(k));
      const yV = Math.floor(pv.y(vw)) + 0.5;
      const items: { v: number; side: number; col: string }[] = [];
      if (fin(vw)) items.push({ v: vw, side: 0, col: rgba(pal.ink, 0.92) });
      if (formed && fin(up)) items.push({ v: up, side: 1, col: rgba(pal.bear, 0.92) });
      if (formed && fin(dn)) items.push({ v: dn, side: -1, col: rgba(pal.bull, 0.92) });
      for (const it of items) {
        const shown = Math.round(it.v / d.tick) * d.tick;
        const y = Math.floor(pv.y(shown)) + 0.5;
        if (y < pv.top - 2 || y > pv.bottom + 2) continue;
        if (d.plotRight > x0 + 2) d.line([[x0, y], [d.plotRight, y]], it.col, 1, [4, 4]);
        // PeerPrice: an edge's flag keeps a 15 px row clear of the VWAP's
        let yf = y;
        if (it.side !== 0 && fin(vw) && yV >= pv.top - 2 && yV <= pv.bottom + 2) {
          if (it.side > 0 && yf > yV - 15) yf = yV - 15;
          if (it.side < 0 && yf < yV + 15) yf = yV + 15;
        }
        d.tag(pv, pv.v(yf), fpc(shown), it.col, it.side === 0 ? (d.th.name === "dark" ? "#000" : "#fff") : "#fff");
      }
    };

    // ---------------------------------------------------------------- run result
    const tierWord = (t: number) => (t === TR_HOT ? "HOT" : t === TR_WARM ? "WARM" : t === TR_COOL ? "COOL" : "COLD");
    return {
      events,
      paneExtent: (pane, i0, i1, k) => {
        if (pane !== "vwap") return null;
        const fr = frame(i0, Math.min(i1, k));
        if (!fr) return null;
        // the engine maps [lo,hi] onto the pane less 6 px each side and pads 8%: invert both so the
        // tool's frame (with its head and foot reserves) fills the pane top to bottom
        const [A, B] = fr, ppx = (B - A) / Math.max(1, lastPh);
        const a2 = A + 6 * ppx, b2 = B - 6 * ppx, sp = (b2 - a2) / 1.16;
        return [a2 + 0.08 * sp, b2 - 0.08 * sp];
      },
      under: () => {},
      draw: (d) => { drawPanel(d); drawRails(d); },
      status: (k) => {
        const sr = sessionRead(k), nr = nowRead(k);
        const vw = P.vw[k], od = P.odds[k];
        const out: ReadItem[] = [{ label: "Session", value: sr.txt.replace(/ {2}/g, " "), tone: sr.tone }];
        if (nr) out.push({ label: "Now", value: nr.txt.replace(/^NOW {2}/, "").replace(/ {2}/g, " "), tone: nr.tone });
        if (fin(vw)) out.push({ label: "Session VWAP", value: fp(vw) });
        if (fin(P.lv[k])) out.push({ label: "Live VWAP", value: fp(P.lv[k]) });
        if (fin(od)) out.push({ label: "Return", value: `${Math.round(Math.max(1, Math.min(99, od)))}% · ${HZ} bars · ${tierWord(tierOf(od / 100))}` });
        const r60 = P.reach[k * NREACH];
        if (fin(r60) && r60 > 0) out.push({ label: "Reach", value: `±${fp(r60)}` });
        return out.slice(0, 6);
      },
      readout: (i) => {
        const out: ReadItem[] = [];
        if (fin(P.vw[i])) {
          out.push({ label: "Session VWAP", value: fp(P.vw[i]) });
          if (P.flag[i] & F_FORMED) out.push({ label: "Upper / Lower 90%", value: `${fp(P.up[i])} / ${fp(P.dn[i])}` });
          out.push({ label: "Sigma", value: `${fp(P.sig[i])} · z ${fin(P.z[i]) ? P.z[i].toFixed(2) : "--"}` });
          const sr = sessionRead(i);
          out.push({ label: "State", value: sr.word, tone: sr.tone });
        }
        if (fin(P.lv[i])) {
          out.push({ label: "Live VWAP", value: fp(P.lv[i]) });
          out.push({ label: "Live 90%", value: `${fp(P.lup[i])} / ${fp(P.ldn[i])}` });
          const nr = nowRead(i);
          if (nr) out.push({ label: "Now", value: nr.txt.replace(/^NOW {2}/, "").replace(/ {2}/g, " "), tone: nr.tone });
        }
        if (fin(P.odds[i])) out.push({ label: "Return odds", value: `${Math.round(P.odds[i])}% · ${tierWord(P.tier[i])}` });
        return out;
      },
      legend: [
        { label: "Live VWAP", color: "rgb(214,219,230)", shape: "line" },
        { label: "Live band · premium", color: "#A33DFF", shape: "box" },
        { label: "Live band · discount", color: "#009999", shape: "box" },
        { label: "Session VWAP / 90% edges", color: "rgb(214,219,230)", shape: "dash" },
        { label: "Close beyond the live edge", color: "#00FFFF", shape: "line" },
      ],
    };
  },
};
