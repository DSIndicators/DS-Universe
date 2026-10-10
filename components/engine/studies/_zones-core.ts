import type { Session } from "../types";
import { ATR, SMA } from "../ta";

/**
 * DS Zones — the calculation half of the web edition (DSZones.cs, Build 2026-10-03).
 * A line-for-line port of OnBarUpdate (pivots, supply/demand detection,
 * lifecycle, prune, flips, confluence, the order-flow footprint) and of the
 * render-side map build (SnapshotStructure → BuildLevels → UpdateLive) that
 * NinjaTrader runs once per closed bar. The drawing half is zones.ts.
 */

// ---------------------------------------------------------------- shipped defaults (ApplyDefaults)
export const P = {
  FillOpacity: 42, OutlineOpacity: 52, LabelOpacity: 90,
  DistanceFadeReachAtr: 8.0, DistanceOpacityFloor: 55,
  RunwayPixels: 120, OverCandleFill: 35, MaxLevels: 7,
  ZoneMinPx: 12, ZoneMaxPx: 50, HighVolMultiplier: 1.5, CaptionSize: 9,
  Lens: [5, 25, 50, 100],
  PivotBandAtrMult: 1.5,
  ImpulseCandles: 3, OriginLookback: 5, VolumeMultiplier: 1.0, ZoneHeightAtrMax: 0.55,
  MaxZonesPerType: 5, RemoveOverlap: true,
  StrongImbalance: 0.65, FootprintLookbackBars: 600,
  ConfluenceTolAtr: 0.25, ConfluenceBoost: 0.15, MergeTolAtr: 0.35,
  TestedAfterBars: 15, BreakDistAtr: 0.10,
  FlipArchiveBars: 120, MaxFlip: 6,
  ProximityAtr: 0.50, BreakNeedsDisplacement: true,
  AtrLength: 200, VolAvgLength: 20,
};

const MERGE_HOLD = 1.30, ANCHOR_HOLD = 0.25, SHOW_HOLD = 0.10, NEAR_HOLD = 1.25, TIER_HOLD = 0.02, KEY_HOLD = 0.70, SPOT_HOLD = 1.15;
const ADMIT_NEAR = 2, ADMIT_FAR = 12;
const PIVOT_KEY = 2 ** 40;
const MARK_CAP = 24;
export const PROF_MAX_ROWS = 48;
export const TIER_WEAK = 0, TIER_MOD = 1, TIER_STRONG = 2, TIER_KEY = 3;
export const LIVE_IDLE = 0, LIVE_APPROACHING = 1, LIVE_TESTING = 2, LIVE_BREAKING = 3;
const FRESH = 0, TESTED = 1, BROKEN = 2;

export const clamp = (v: number, lo: number, hi: number) => (v !== v ? lo : v < lo ? lo : v > hi ? hi : v);
/** C# Math.Round (banker's rounding) */
export function rne(x: number) {
  const f = Math.floor(x), d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

// ---------------------------------------------------------------- types
type Zone = {
  id: number; supply: boolean; state: number; top: number; bottom: number;
  createdBar: number; originBar: number;
  delta: number; volAbs: number; impulseVol: number; impulseBars: number; range: number;
  baseStrength: number; health: number; testCount: number; defendCount: number;
  lastTouchBar: number; enteredThisBar: boolean;
  brokenBar: number; marks: number[];
  flowReady: boolean; flowTotal: number; flowBuy: number; flowSell: number; buyPct: number; flowClass: number;
  flowB0: number; flowB1: number;
};
type Slot = {
  len: number;
  hp: number; hBar: number; hVol: number; hScore: number;
  lp: number; lBar: number; lVol: number; lScore: number;
  hf: Flow | null; lf: Flow | null; half: number; fb0: number; fb1: number;
};
type Flow = { buy: number; sell: number; tot: number };
export type Band = { kLo: number; kHi: number; b0: number; b1: number };

type Cand = {
  key: number; lo: number; hi: number; mid: number; score: number; vol: number; delta: number; volProxy: number;
  isZone: boolean; supply: boolean; tested: boolean; zState: number; defendCount: number; health: number; t: number;
  flowReady: boolean; flowTotal: number; flowBuy: number; flowSell: number;
  marks: number[] | null; prof: Band | null; zoneId: number;
};
type Memo = { seen: number; anchor: number; lvl: number; tier: number; key: boolean; near: boolean; spot: boolean; shown: number; wait: number };

/** one ranked level of the map, as the tool holds it after a build */
export type Level = {
  id: number; zoneId: number; old: boolean; waiting: boolean; pinned: boolean;
  top: number; bottom: number; mid: number; isBand: boolean; conf: boolean; tested: boolean;
  score: number; rankKey: number; createdBar: number;
  domState: number; defendCount: number; live: number; penetration: number; health: number;
  flowReady: boolean; flowTotal: number; flowBuy: number; flowSell: number; buyPct: number; flowClass: number;
  dispVol: number; dispDelta: number; relVol: number; tierV: number; key: boolean;
  supply: boolean; prox: number; marks: number[] | null; prof: Band | null;
  /** memo Near after this bar's frame (for the live re-read in draw) */
  nearMemo: boolean;
};
export type Flip = { id: number; supply: boolean; top: number; bottom: number; level: number; createdBar: number; brokenBar: number };
export type Snap = {
  k: number; price: number; atr: number; shown: Level[]; hidden: Level[]; flips: Flip[]; nSupply: number; nDemand: number; build: number;
  /** display only (example hygiene): live zones whose origin bar is on the replayed stage (>= replayFrom) */
  nSupplyShown: number; nDemandShown: number;
};
export type Action = { kind: "new" | "defended" | "tested" | "broken"; id: number; supply: boolean; top: number; bottom: number; count: number; tests: number; age: number; originBar?: number; absorb?: number };

// ---------------------------------------------------------------- footprint store
/**
 * NinjaTrader keeps, per primary bar index, a slice of volume-at-price cells:
 * [0]/[1] the 1-minute series' tick-rule estimate (AccumulateFlow), [2]/[3]
 * the real aggressor split from OnMarketData. In real time (and Tick Replay)
 * with Calculate.OnBarClose the ticks of a forming bar are filed under the
 * last CLOSED bar's index, and the 1-minute estimate of bar j is written just
 * after bar j's own OnBarUpdate. So, evaluated on the close of bar k:
 *   slice b (b <= k-1) = real ticks of bar b+1  +  estimate of bar b
 *   slice k            = empty (its estimate arrives after this update)
 */
export class Footprint {
  s: Session;
  n: number;
  // estimate
  eLo: Int32Array; eHi: Int32Array; ePer: Float64Array; eSign: Int8Array;
  // real ticks of bar b+1, prefix sums
  tLo: Int32Array; tAsk: Float64Array[]; tBid: Float64Array[];
  constructor(s: Session) {
    this.s = s;
    const n = (this.n = s.n);
    this.eLo = new Int32Array(n); this.eHi = new Int32Array(n); this.ePer = new Float64Array(n); this.eSign = new Int8Array(n);
    this.tLo = new Int32Array(n); this.tAsk = new Array(n); this.tBid = new Array(n);
    let last = NaN, lastSign = 0;
    const tk = s.tick;
    for (let b = 0; b < n; b++) {
      const c = s.c[b], vol = s.v[b];
      if (vol > 0) {
        let sign: number;
        if (Number.isNaN(last) || c === last) sign = lastSign === 0 ? 1 : lastSign;
        else if (c > last) sign = 1;
        else sign = -1;
        last = c; lastSign = sign;
        const kLo = rne(s.l[b] / tk), kHi = rne(s.h[b] / tk), span = kHi - kLo + 1;
        if (span <= 1 || span > 64) { const kc = rne(c / tk); this.eLo[b] = kc; this.eHi[b] = kc; this.ePer[b] = vol; }
        else { this.eLo[b] = kLo; this.eHi[b] = kHi; this.ePer[b] = vol / span; }
        this.eSign[b] = sign;
      } else { this.eSign[b] = 0; }
      // real ticks of bar b+1
      const j = b + 1;
      if (j < n) {
        const bid = s.fp.bid[j], ask = s.fp.ask[j];
        let tot = 0;
        if (bid && ask) for (let q = 0; q < bid.length; q++) tot += bid[q] + ask[q];
        if (tot > 0) {
          const A = new Float64Array(bid.length + 1), B = new Float64Array(bid.length + 1);
          for (let q = 0; q < bid.length; q++) { A[q + 1] = A[q] + ask[q]; B[q + 1] = B[q] + bid[q]; }
          this.tLo[b] = s.fp.lo[j]; this.tAsk[b] = A; this.tBid[b] = B;
        }
      }
    }
  }
  /** cells of slice b inside [kLo,kHi] → [estBuy, estSell, ask, bid] */
  band(b: number, kLo: number, kHi: number, out: Float64Array) {
    out[0] = out[1] = out[2] = out[3] = 0;
    const sg = this.eSign[b];
    if (sg !== 0) {
      const a = Math.max(kLo, this.eLo[b]), z = Math.min(kHi, this.eHi[b]);
      if (z >= a) { const v = (z - a + 1) * this.ePer[b]; if (sg > 0) out[0] = v; else out[1] = v; }
    }
    const A = this.tAsk[b];
    if (A) {
      const B = this.tBid[b], lo = this.tLo[b], len = A.length - 1;
      const a = Math.max(0, kLo - lo), z = Math.min(len - 1, kHi - lo);
      if (z >= a) { out[2] = A[z + 1] - A[a]; out[3] = B[z + 1] - B[a]; }
    }
  }
}

const scratch4 = new Float64Array(4);

/** per-slice BandFlow contributions of one price band, as prefix sums (a slice
 *  never changes once complete, so the window sums are exact and cheap) */
type BandSums = { base: number; upto: number; cb: Float64Array; cs: Float64Array };
export class FlowCache {
  private m = new Map<number, BandSums>();
  constructor(private fp: Footprint) {}
  flow(kLo: number, kHi: number, b0: number, end: number): Flow | null {
    if (b0 < 0) b0 = 0;
    if (end < b0) return null;
    const key = kLo * 1048576 + (kHi - kLo);
    let e = this.m.get(key);
    if (!e || b0 < e.base) {
      const len = this.fp.n - b0 + 1;
      e = { base: b0, upto: b0, cb: new Float64Array(len), cs: new Float64Array(len) };
      this.m.set(key, e);
    }
    while (e.upto <= end) {
      const b = e.upto, j = b - e.base;
      this.fp.band(b, kLo, kHi, scratch4);
      const tickTot = scratch4[0] + scratch4[1], trueTot = scratch4[2] + scratch4[3];
      const real = trueTot > 0 && trueTot >= 0.5 * tickTot;
      e.cb[j + 1] = e.cb[j] + (real ? scratch4[2] : scratch4[0]);
      e.cs[j + 1] = e.cs[j] + (real ? scratch4[3] : scratch4[1]);
      e.upto++;
    }
    const buy = e.cb[end - e.base + 1] - e.cb[b0 - e.base], sell = e.cs[end - e.base + 1] - e.cs[b0 - e.base];
    return buy + sell > 0 ? { buy, sell, tot: buy + sell } : null;
  }
}

/** BandFlow(), evaluated on the close of bar `at` */
export function bandFlow(fp: Footprint, tick: number, pLo: number, pHi: number, b0: number, b1: number, at: number, cache?: FlowCache): Flow | null {
  const kLo = rne(Math.min(pLo, pHi) / tick), kHi = rne(Math.max(pLo, pHi) / tick);
  if (b0 < 0) b0 = 0;
  if (cache) return cache.flow(kLo, kHi, b0, Math.min(b1, at - 1));
  const end = Math.min(b1, at - 1);
  let buy = 0, sell = 0;
  for (let b = b0; b <= end; b++) {
    fp.band(b, kLo, kHi, scratch4);
    const tickTot = scratch4[0] + scratch4[1], trueTot = scratch4[2] + scratch4[3];
    if (trueTot > 0 && trueTot >= 0.5 * tickTot) { buy += scratch4[2]; sell += scratch4[3]; }
    else { buy += scratch4[0]; sell += scratch4[1]; }
  }
  return buy + sell > 0 ? { buy, sell, tot: buy + sell } : null;
}

/** BandProfile(): rows of buy / sell volume (≤ 48 rows) inside the band, evaluated on the close of bar `at` */
export function bandProfile(fp: Footprint, band: Band, at: number): { buy: Float64Array; sell: Float64Array } | null {
  const { kLo, kHi } = band;
  const nT = kHi - kLo + 1;
  if (nT < 1 || nT > 100000) return null;
  const per = Math.max(1, Math.floor((nT + PROF_MAX_ROWS - 1) / PROF_MAX_ROWS));
  const rows = Math.floor((nT + per - 1) / per);
  const rb = new Float64Array(rows), rs = new Float64Array(rows);
  let total = 0;
  const end = Math.min(band.b1, at - 1);
  for (let b = Math.max(0, band.b0); b <= end; b++) {
    fp.band(b, kLo, kHi, scratch4);
    const tickTot = scratch4[0] + scratch4[1], trueTot = scratch4[2] + scratch4[3];
    if (tickTot <= 0 && trueTot <= 0) continue;
    const real = trueTot > 0 && trueTot >= 0.5 * tickTot;
    if (real) {
      const A = fp.tAsk[b], B = fp.tBid[b], lo = fp.tLo[b], len = A.length - 1;
      for (let q = Math.max(0, kLo - lo); q <= Math.min(len - 1, kHi - lo); q++) {
        const key = lo + q, r = Math.floor((key - kLo) / per);
        const a = A[q + 1] - A[q], d = B[q + 1] - B[q];
        rb[r] += a; rs[r] += d; total += a + d;
      }
    } else {
      const sg = fp.eSign[b];
      if (sg === 0) continue;
      for (let key = Math.max(kLo, fp.eLo[b]); key <= Math.min(kHi, fp.eHi[b]); key++) {
        const r = Math.floor((key - kLo) / per);
        if (sg > 0) rb[r] += fp.ePer[b]; else rs[r] += fp.ePer[b];
        total += fp.ePer[b];
      }
    }
  }
  return total > 0 ? { buy: rb, sell: rs } : null;
}

// ---------------------------------------------------------------- the run
export type Core = {
  fp: Footprint;
  atr: Float64Array;
  start: number;
  snaps: (Snap | undefined)[];
  actions: (Action[] | undefined)[];
  /** live zone count per bar (readout) */
  counts: Int16Array;
};

export function runCore(s: Session): Core {
  const n = s.n, tick = s.tick;
  const H = s.h, L = s.l, C = s.c, O = s.o, V = s.v;
  const atr = ATR(s, Math.max(2, P.AtrLength));
  const volSma = SMA(V, Math.max(1, P.VolAvgLength));
  const fp = new Footprint(s);
  const fc = new FlowCache(fp);
  const start = Math.max(0, s.replayFrom - 1);
  const lookback = Math.max(50, P.FootprintLookbackBars);

  const slots: Slot[] = P.Lens.map((len) => ({ len: Math.max(1, len), hp: NaN, hBar: -1, hVol: 0, hScore: 0, lp: NaN, lBar: -1, lVol: 0, lScore: 0, hf: null, lf: null, half: 0, fb0: 0, fb1: 0 }));
  let zones: Zone[] = [];
  const flips: Zone[] = [];
  let supplyCooldown = 0, demandCooldown = 0, zoneSeq = 0;

  const snaps: (Snap | undefined)[] = new Array(n);
  const actions: (Action[] | undefined)[] = new Array(n);
  const counts = new Int16Array(n);

  // render-side state (memos survive between builds)
  const memos = new Map<number, Memo>();
  const memoOf = (key: number) => { let m = memos.get(key); if (!m) { m = { seen: -9, anchor: 0, lvl: -9, tier: -1, key: false, near: false, spot: false, shown: -9, wait: 0 }; memos.set(key, m); } return m; };
  let buildStamp = 0;

  const maxLen = Math.max(1, ...slots.map((x) => x.len));
  const warm = Math.max(2 * maxLen + 1, Math.max(P.AtrLength, P.VolAvgLength)) + 2;


  function sumVol(k: number, Ln: number) { let v = 0; const m = Math.min(2 * Ln, k); for (let q = 0; q <= m; q++) v += V[k - q]; return v; }
  function scorePivot(k: number, Ln: number, vol: number) {
    const lenF = clamp(Ln / 100, 0, 1);
    const refV = volSma[k];
    const perBar = Ln > 0 ? vol / (2 * Ln) : 0;
    const volF = refV > 0 ? clamp((perBar / refV - 1) / 2, 0, 1) : 0.5;
    return clamp(0.58 * lenF + 0.42 * volF, 0, 1);
  }
  function consec(k: number, need: number, bear: boolean) { for (let q = 0; q < need; q++) { const b = k - q; if (bear ? !(C[b] < O[b]) : !(C[b] > O[b])) return false; } return true; }
  function hasVol(k: number, need: number, volAvg: number) { if (volAvg <= 0) return true; let sm = 0; for (let q = 0; q < need; q++) sm += V[k - q]; return sm / need >= volAvg * P.VolumeMultiplier; }
  function create(k: number, atrV: number, need: number, acts: Action[], supply: boolean, off: number) {
    const ob = k - off;
    let top: number, bottom: number;
    if (supply) { top = H[ob]; bottom = Math.min(O[ob], C[ob]); } else { bottom = L[ob]; top = Math.max(O[ob], C[ob]); }
    const minH = Math.max(tick * 3, 0.22 * atrV), maxH = Math.max(minH, P.ZoneHeightAtrMax * atrV), h = top - bottom;
    if (h < minH) { if (supply) bottom = top - minH; else top = bottom + minH; }
    else if (h > maxH) { if (supply) bottom = top - maxH; else top = bottom + maxH; }
    let delta = 0, volTot = 0;
    for (let q = 0; q <= off && q <= k; q++) { const vk = V[k - q]; delta += C[k - q] > O[k - q] ? vk : -vk; volTot += vk; }
    const range = supply ? Math.abs(H[ob] - L[k]) : Math.abs(H[k] - L[ob]);
    const z: Zone = {
      id: ++zoneSeq, supply, state: FRESH, top, bottom, createdBar: k, originBar: ob,
      delta, volAbs: Math.abs(delta), impulseVol: volTot, impulseBars: off + 1, range,
      baseStrength: 0, health: 0, testCount: 0, defendCount: 0, lastTouchBar: -1, enteredThisBar: false,
      brokenBar: -1, marks: [], flowReady: false, flowTotal: 0, flowBuy: 0, flowSell: 0, buyPct: 0.5, flowClass: 0, flowB0: 0, flowB1: 0,
    };
    // ScoreZone
    const avgV = z.impulseBars > 0 ? z.impulseVol / z.impulseBars : 0;
    const refV = volSma[k];
    const volF = refV > 0 ? clamp((avgV / refV - 1) / 3, 0, 1) : 0.5;
    const speedF = atrV > 0 ? clamp(z.range / (atrV * 2), 0, 1) : 0.5;
    const freshF = z.state === FRESH ? 1 : 0.45;
    const deltaF = z.impulseVol > 0 ? clamp(z.volAbs / z.impulseVol, 0, 1) : 0.5;
    z.baseStrength = clamp(0.30 * volF + 0.26 * speedF + 0.24 * freshF + 0.20 * deltaF, 0, 1);
    z.health = z.baseStrength;
    zones.push(z);
    acts.push({ kind: "new", id: z.id, supply, top, bottom, count: need, tests: 0, age: 0, originBar: ob });
      }

  for (let k = 0; k < n; k++) {
    if (k < warm) continue;
    const atrV = atr[k], volAvg = volSma[k];
    if (atrV <= 0) continue;
    const acts: Action[] = [];

    // ---------------- UpdatePivots
    for (const sl of slots) {
      const Ln = sl.len;
      if (k < 2 * Ln) continue;
      const pb = k - Ln;
      let isH = true, isL = true;
      const ph = H[pb], pl = L[pb];
      for (let q = k - 2 * Ln; q <= k; q++) {
        if (q === pb) continue;
        if (H[q] >= ph) isH = false;
        if (L[q] <= pl) isL = false;
        if (!isH && !isL) break;
      }
      if (isH) { sl.hp = ph; sl.hBar = pb; sl.hVol = sumVol(k, Ln); sl.hScore = scorePivot(k, Ln, sl.hVol); }
      if (isL) { sl.lp = pl; sl.lBar = pb; sl.lVol = sumVol(k, Ln); sl.lScore = scorePivot(k, Ln, sl.lVol); }
    }

    // ---------------- DetectZones
    {
      const need = Math.max(1, P.ImpulseCandles);
      const search = need + Math.max(1, P.OriginLookback);
      if (supplyCooldown === 0 && consec(k, need, true) && hasVol(k, need, volAvg)) {
        for (let q = 0; q < search && q <= k; q++) if (C[k - q] > O[k - q]) { create(k, atrV, need, acts, true, q); supplyCooldown = search + 2; break; }
      } else if (supplyCooldown > 0) supplyCooldown--;
      if (demandCooldown === 0 && consec(k, need, false) && hasVol(k, need, volAvg)) {
        for (let q = 0; q < search && q <= k; q++) if (C[k - q] < O[k - q]) { create(k, atrV, need, acts, false, q); demandCooldown = search + 2; break; }
      } else if (demandCooldown > 0) demandCooldown--;
    }

    // ---------------- UpdateLifecycle
    {
      const brk = P.BreakDistAtr * atrV, disp = 0.5 * atrV, body = Math.abs(C[k] - O[k]);
      const volNow = V[k], volRef = volSma[k];
      const hasDisp = !P.BreakNeedsDisplacement || body >= disp || (volRef > 0 && volNow >= volRef * 1.3);
      for (let q = zones.length - 1; q >= 0; q--) {
        const z = zones[q];
        const age = k - z.createdBar;
        const through = z.supply ? C[k] > z.top + brk : C[k] < z.bottom - brk;
        if (through && hasDisp) {
          z.state = BROKEN; z.brokenBar = k;
          zones.splice(q, 1);
          if (P.MaxFlip > 0) { flips.push(z); while (flips.length > P.MaxFlip) flips.shift(); }
          acts.push({ kind: "broken", id: z.id, supply: z.supply, top: z.top, bottom: z.bottom, count: z.defendCount, tests: z.testCount, age });
          continue;
        }
        const touched = H[k] >= z.bottom && L[k] <= z.top;
        if (!touched) { z.enteredThisBar = false; continue; }
        z.lastTouchBar = k; z.enteredThisBar = true;
        if (age < Math.max(1, P.TestedAfterBars) && z.testCount === 0) continue;
        const rejected = !z.supply ? C[k] >= z.bottom : C[k] <= z.top;
        // RejectionQuality
        const hz = Math.max(z.top - z.bottom, tick); void hz;
        let priceRej: number;
        if (!z.supply) { const dip = z.top - L[k], rec = C[k] - L[k]; priceRej = dip > 0 ? clamp(rec / dip, 0, 1) : 0.6; }
        else { const poke = H[k] - z.bottom, rec = H[k] - C[k]; priceRej = poke > 0 ? clamp(rec / poke, 0, 1) : 0.6; }
        let absorb = 0.5;
        if (k > 0) {
          const f = bandFlow(fp, tick, z.bottom, z.top, k - 1, k, k);
          if (f && f.tot > 0) absorb = clamp(!z.supply ? f.sell / f.tot : f.buy / f.tot, 0, 1);
        }
        const rq = clamp(0.6 * priceRej + 0.4 * absorb, 0, 1);
        if (rejected) {
          z.testCount++; z.defendCount++;
          z.marks.push(k); if (z.marks.length > MARK_CAP) z.marks.shift();
          z.health = clamp(z.health * 0.94 + 0.30 * rq, 0, 1);
          acts.push({ kind: "defended", id: z.id, supply: z.supply, top: z.top, bottom: z.bottom, count: z.defendCount, tests: z.testCount, age, absorb });
        } else {
          z.testCount++;
          z.marks.push(-(k + 1)); if (z.marks.length > MARK_CAP) z.marks.shift();
          z.health = clamp(z.health * 0.80, 0, 1);
          if (z.state === FRESH) z.state = TESTED;
          acts.push({ kind: "tested", id: z.id, supply: z.supply, top: z.top, bottom: z.bottom, count: z.testCount, tests: z.testCount, age, absorb });
        }
        if (z.state === FRESH && z.testCount >= 2) z.state = TESTED;
      }
    }

    // ---------------- PruneZones
    if (P.RemoveOverlap) {
      for (let i = zones.length - 1; i >= 0; i--) {
        const a = zones[i];
        for (let j = 0; j < zones.length; j++) {
          if (i === j) continue;
          const b = zones[j];
          if (a.supply !== b.supply) continue;
          if (!(a.bottom <= b.top && a.top >= b.bottom)) continue;
          const weaker = a.baseStrength < b.baseStrength || (a.baseStrength === b.baseStrength && a.createdBar < b.createdBar);
          if (weaker) { zones.splice(i, 1); break; }
        }
      }
    }
    for (let side = 0; side < 2; side++) {
      const supply = side === 0;
      const max = Math.max(1, P.MaxZonesPerType);
      let count = 0;
      for (const z of zones) if (z.supply === supply) count++;
      while (count > max) {
        let oldest = -1, ob = Infinity;
        for (let i = 0; i < zones.length; i++) if (zones[i].supply === supply && zones[i].createdBar < ob) { ob = zones[i].createdBar; oldest = i; }
        if (oldest < 0) break;
        zones.splice(oldest, 1); count--;
      }
    }
    // ---------------- AgeFlips
    for (let q = flips.length - 1; q >= 0; q--) if (k - flips[q].brokenBar > P.FlipArchiveBars) flips.splice(q, 1);
    // CalcConfluence only raises the (off-by-default) confluence alert; the map's own
    // confluence (a pivot merged with a zone) is scored in MergeCluster.

    // ---------------- order flow: NinjaTrader computes it in real time (and on the last historical bars)
    if (k >= start) {
      for (const z of zones) {
        z.flowReady = false; z.flowTotal = 0; z.flowBuy = 0; z.flowSell = 0; z.buyPct = 0.5; z.flowClass = 0;
        let b0 = z.createdBar - Math.max(1, z.impulseBars) - 2;
        const floor = k - lookback;
        if (b0 < floor) b0 = floor;
        z.flowB0 = b0; z.flowB1 = k;
        const f = bandFlow(fp, tick, z.bottom, z.top, b0, k, k, fc);
        if (!f) continue;
        z.flowReady = true; z.flowTotal = f.tot; z.flowBuy = f.buy; z.flowSell = f.sell; z.buyPct = f.buy / f.tot;
        z.flowClass = Math.max(z.buyPct, 1 - z.buyPct) >= P.StrongImbalance ? 2 : 1;
      }
      for (const sl of slots) {
        sl.hf = sl.lf = null;
        const half = Math.max(tick * 2, 0.12 * atrV);
        sl.half = half; sl.fb0 = k - lookback; sl.fb1 = k;
        if (!Number.isNaN(sl.hp)) sl.hf = bandFlow(fp, tick, sl.hp - half, sl.hp + half, k - lookback, k, k, fc);
        if (!Number.isNaN(sl.lp)) sl.lf = bandFlow(fp, tick, sl.lp - half, sl.lp + half, k - lookback, k, k, fc);
      }
    }

    actions[k] = acts.length ? acts : undefined;
    let ns = 0, nd = 0, nsS = 0, ndS = 0;
    for (const z of zones) { if (z.supply) ns++; else nd++; if (z.originBar >= s.replayFrom) { if (z.supply) nsS++; else ndS++; } }
    counts[k] = ns * 100 + nd;

    // ---------------- the frame NinjaTrader paints after this bar closes
    if (k >= start) {
      const price = C[k];
      buildStamp++;
      const res = buildLevels(k, price, atrV);
      snaps[k] = { k, price, atr: atrV, shown: res.shown, hidden: res.hidden, flips: flips.map((z) => ({ id: z.id, supply: z.supply, top: z.top, bottom: z.bottom, level: (z.top + z.bottom) * 0.5, createdBar: z.originBar, brokenBar: z.brokenBar })), nSupply: ns, nDemand: nd, build: buildStamp, nSupplyShown: nsS, nDemandShown: ndS };
    }
  }

  // ======================================================== render-side map build
  function buildLevels(k: number, rDimPrice: number, rDimAtr: number): { shown: Level[]; hidden: Level[] } {
    // SnapshotStructure
    const cands: Cand[] = [];
    for (const sl of slots) {
      const mk = (hi: boolean): Band | null => {
        const p = hi ? sl.hp : sl.lp;
        return { kLo: rne((p - sl.half) / tick), kHi: rne((p + sl.half) / tick), b0: sl.fb0, b1: sl.fb1 };
      };
      if (!Number.isNaN(sl.hp)) {
        const f = sl.hf;
        cands.push({ key: PIVOT_KEY + rne(sl.hp / tick) * 2 + 1, lo: sl.hp, hi: sl.hp, mid: sl.hp, score: sl.hScore, vol: sl.hVol, delta: 0, volProxy: sl.hVol,
          isZone: false, supply: true, tested: false, zState: 0, defendCount: 0, health: 0, t: sl.hBar,
          flowReady: !!f, flowTotal: f ? f.tot : 0, flowBuy: f ? f.buy : 0, flowSell: f ? f.sell : 0, marks: null, prof: f ? mk(true) : null, zoneId: -1 });
      }
      if (!Number.isNaN(sl.lp)) {
        const f = sl.lf;
        cands.push({ key: PIVOT_KEY + rne(sl.lp / tick) * 2, lo: sl.lp, hi: sl.lp, mid: sl.lp, score: sl.lScore, vol: sl.lVol, delta: 0, volProxy: sl.lVol,
          isZone: false, supply: false, tested: false, zState: 0, defendCount: 0, health: 0, t: sl.lBar,
          flowReady: !!f, flowTotal: f ? f.tot : 0, flowBuy: f ? f.buy : 0, flowSell: f ? f.sell : 0, marks: null, prof: f ? mk(false) : null, zoneId: -1 });
      }
    }
    for (const z of zones) {
      cands.push({ key: z.id, lo: z.bottom, hi: z.top, mid: (z.top + z.bottom) * 0.5, isZone: true, supply: z.supply, score: z.health,
        zState: z.state, defendCount: z.defendCount, health: z.health, delta: z.delta, vol: 0, volProxy: z.impulseVol, tested: z.state === TESTED, t: z.originBar,
        flowReady: z.flowReady, flowTotal: z.flowTotal, flowBuy: z.flowBuy, flowSell: z.flowSell,
        marks: z.marks.length ? z.marks.slice() : null,
        prof: z.flowReady ? { kLo: rne(z.bottom / tick), kHi: rne(z.top / tick), b0: z.flowB0, b1: z.flowB1 } : null, zoneId: z.id });
    }
    const nC = cands.length;
    if (nC === 0) { purgeMemos(); return { shown: [], hidden: [] }; }
    const atrV = rDimAtr > 0 ? rDimAtr : tick * 4;
    const tol = Math.max(tick, P.MergeTolAtr * atrV);

    const prio = new Float64Array(nC);
    const order: number[] = [];
    for (let i = 0; i < nC; i++) {
      const c = cands[i], m = memoOf(c.key);
      const led = m.seen === buildStamp - 1 && m.anchor === c.key;
      prio[i] = c.score + (c.isZone ? 10 : 0) + (led ? ANCHOR_HOLD : 0);
      order.push(i);
    }
    order.sort((a, b) => (prio[b] !== prio[a] ? prio[b] - prio[a] : cands[a].key !== cands[b].key ? cands[a].key - cands[b].key : a - b));

    const anchors: number[] = [];
    const grpOf = new Int32Array(nC);
    for (const i of order) {
      const c = cands[i], m = memoOf(c.key);
      const had = m.seen === buildStamp - 1;
      let bestG = -1, bestGap = Infinity;
      for (let g = 0; g < anchors.length; g++) {
        const a = cands[anchors[g]];
        const gap = Math.max(0, Math.max(c.lo - a.hi, a.lo - c.hi));
        const lim = had && m.anchor === a.key ? tol * MERGE_HOLD : tol;
        if (gap <= lim && gap < bestGap) { bestGap = gap; bestG = g; }
      }
      if (bestG < 0) { anchors.push(i); bestG = anchors.length - 1; }
      grpOf[i] = bestG;
    }
    for (let i = 0; i < nC; i++) { const m = memoOf(cands[i].key); m.anchor = cands[anchors[grpOf[i]]].key; m.seen = buildStamp; }

    let rL: Level[] = [];
    for (let g = 0; g < anchors.length; g++) {
      const grp: Cand[] = [cands[anchors[g]]];
      for (const i of order) if (grpOf[i] === g && i !== anchors[g]) grp.push(cands[i]);
      rL.push(mergeCluster(grp));
    }

    // ComputeRelVol
    for (let cl = 0; cl < 3; cl++) {
      const xs: number[] = [];
      for (const lv of rL) if (volClass(lv) === cl && lv.dispVol > 0) xs.push(lv.dispVol);
      const m = xs.length;
      if (m === 0) continue;
      xs.sort((a, b) => a - b);
      const median = m % 2 === 1 ? xs[m >> 1] : 0.5 * (xs[m / 2 - 1] + xs[m / 2]);
      if (median <= 0) continue;
      for (const lv of rL) if (volClass(lv) === cl && lv.dispVol > 0) lv.relVol = lv.dispVol / median;
    }
    const mult = Math.max(1.05, P.HighVolMultiplier);
    for (const lv of rL) {
      const m = memoOf(lv.id);
      const was = m.lvl === buildStamp - 1;
      lv.old = was;
      lv.tierV = holdTier(lv.score, was ? m.tier : -1);
      lv.key = lv.tierV === TIER_STRONG && lv.relVol >= (was && m.key ? Math.max(1.05, mult * KEY_HOLD) : mult);
      if (!was) { m.near = false; m.spot = false; }
      m.tier = lv.tierV; m.key = lv.key; m.lvl = buildStamp;
      readLive(lv, rDimPrice, rDimAtr, tick);
    }
    markApproaching(rL, rDimPrice, rDimAtr);

    const spot = P.DistanceOpacityFloor < 100 && rDimAtr > 0 && rDimPrice > 0;
    const spotReach = P.DistanceFadeReachAtr * rDimAtr;
    for (const lv of rL) {
      const m = memoOf(lv.id);
      const dist = Math.abs(rDimPrice - lv.mid);
      m.spot = spot && dist <= (m.spot ? spotReach * SPOT_HOLD : spotReach);
      lv.pinned = lv.live === LIVE_TESTING || lv.live === LIVE_BREAKING;
      lv.rankKey = lv.score * (distanceDim(lv.mid, rDimPrice, rDimAtr) + (m.spot ? 1 : 0))
        + (m.shown === buildStamp - 1 ? SHOW_HOLD : 0)
        + (lv.pinned ? 10 : lv.live === LIVE_APPROACHING ? 0.20 : 0)
        + (lv.isBand && lv.defendCount > 0 ? 0.10 : 0);
    }
    rL.sort((a, b) => (b.rankKey !== a.rankKey ? b.rankKey - a.rankKey : a.id - b.id));

    const cap = Math.max(1, P.MaxLevels);
    for (let i = 0; i < rL.length; i++) {
      const lv = rL[i], m = memoOf(lv.id);
      lv.waiting = false;
      if (lv.pinned || !lv.old || m.shown === buildStamp - 1) { m.wait = 0; continue; }
      if (i >= cap) { m.wait = 0; lv.waiting = true; continue; }
      m.wait++;
      lv.waiting = m.wait < (m.spot ? ADMIT_NEAR : ADMIT_FAR);
    }
    let used = 0;
    for (const lv of rL) { if (!lv.waiting && used < cap) { used++; continue; } lv.waiting = true; }
    const hidden: Level[] = [];
    for (let i = rL.length - 1; i >= 0; i--) {
      const lv = rL[i];
      if (lv.waiting) { hidden.push(lv); rL.splice(i, 1); }
      else { const m = memoOf(lv.id); m.shown = buildStamp; m.wait = 0; }
    }
    sortForDisplay(rL);
    purgeMemos();

    // ---- UpdateLive(liveEdge = true) — the same frame, at the bar's close
    for (const lv of rL) readLive(lv, rDimPrice, rDimAtr, tick);
    if (hidden.length > 0) {
      let moved = false;
      for (let i = hidden.length - 1; i >= 0; i--) {
        const lv = hidden[i];
        readLive(lv, rDimPrice, rDimAtr, tick);
        if (lv.live !== LIVE_TESTING && lv.live !== LIVE_BREAKING) continue;
        if (rL.length >= cap) {
          let drop = -1;
          for (let q = 0; q < rL.length; q++) {
            const x = rL[q];
            if (x.live === LIVE_TESTING || x.live === LIVE_BREAKING) continue;
            if (drop < 0 || x.rankKey < rL[drop].rankKey) drop = q;
          }
          if (drop < 0) continue;
          memoOf(rL[drop].id).shown = -9;
          hidden.push(rL[drop]);
          rL.splice(drop, 1);
        }
        hidden.splice(hidden.indexOf(lv), 1);
        rL.push(lv);
        lv.pinned = true;
        memoOf(lv.id).shown = buildStamp;
        moved = true;
      }
      if (moved) sortForDisplay(rL);
    }
    markApproaching(rL, rDimPrice, rDimAtr);
    for (const lv of rL) lv.nearMemo = memoOf(lv.id).near;
    for (const lv of hidden) lv.nearMemo = memoOf(lv.id).near;
    return { shown: rL, hidden };
  }

  function markApproaching(list: Level[], price: number, atrR: number) {
    if (price <= 0) return;
    const atrLive = atrR > 0 ? atrR : tick * 4;
    const reach = Math.max(P.ProximityAtr * atrLive, tick);
    let aboveIdx = -1, belowIdx = -1, aboveD = Number.MAX_VALUE, belowD = Number.MAX_VALUE;
    for (let i = 0; i < list.length; i++) {
      const lv = list[i];
      if (!lv.isBand) continue;
      if (lv.live === LIVE_TESTING || lv.live === LIVE_BREAKING) continue;
      if (lv.bottom > price) { const d = lv.bottom - price; if (d >= 0 && d < aboveD) { aboveD = d; aboveIdx = i; } }
      else if (lv.top < price) { const d = price - lv.top; if (d >= 0 && d < belowD) { belowD = d; belowIdx = i; } }
    }
    for (let i = 0; i < list.length; i++) {
      const lv = list[i];
      if (!lv.isBand) continue;
      const m = memoOf(lv.id);
      let near = false;
      if (i === aboveIdx) near = aboveD <= (m.near ? reach * NEAR_HOLD : reach);
      else if (i === belowIdx) near = belowD <= (m.near ? reach * NEAR_HOLD : reach);
      m.near = near;
      if (near) lv.live = LIVE_APPROACHING;
    }
  }

  function purgeMemos() {
    if (memos.size < 96) return;
    const dead: number[] = [];
    memos.forEach((m, key) => { if (m.seen < buildStamp - 40) dead.push(key); });
    for (const d of dead) memos.delete(d);
  }

  function mergeCluster(cand: Cand[]): Level {
    let hasZone = false, hasPivot = false, tested = false;
    let best = -1, deltaSum = 0, volMax = 0, zBest = -1;
    const bestMid = cand[0].mid;
    let zLo = 0, zHi = 0, zT = cand[0].t, earliest = cand[0].t;
    let zf = { r: false, b: 0, s: 0, t: 0 }, zVolProxy = 0;
    let pf = { r: false, b: 0, s: 0, t: 0 }, pBest = -1;
    let zSupply = true, pSupply = true, zState = 0, zDefend = 0, zHealth = 0, zId = -1;
    let zMarks: number[] | null = null, zProf: Band | null = null, pProf: Band | null = null;
    for (const c of cand) {
      if (c.isZone) {
        hasZone = true;
        deltaSum += c.delta;
        if (c.tested) tested = true;
        if (zBest < 0) {
          zBest = c.score; zLo = c.lo; zHi = c.hi; zT = c.t; zVolProxy = c.volProxy;
          zSupply = c.supply; zState = c.zState; zDefend = c.defendCount; zHealth = c.health; zId = c.zoneId;
          zf = { r: c.flowReady, b: c.flowBuy, s: c.flowSell, t: c.flowTotal };
          zMarks = c.marks; zProf = c.prof;
        }
      } else {
        hasPivot = true;
        if (c.vol > volMax) volMax = c.vol;
        if (pBest < 0) {
          pBest = c.score; pSupply = c.supply;
          pf = { r: c.flowReady, b: c.flowBuy, s: c.flowSell, t: c.flowTotal };
          pProf = c.prof;
        }
      }
      if (c.score > best) best = c.score;
      if (c.t < earliest) earliest = c.t;
    }
    const sources = cand.length;
    const conf = hasZone && hasPivot;
    const supply = hasZone ? zSupply : pSupply;
    const lv: Level = {
      id: cand[0].key, zoneId: hasZone ? zId : -1, old: false, waiting: false, pinned: false,
      top: hasZone ? zHi : bestMid, bottom: hasZone ? zLo : bestMid, mid: hasZone ? (zHi + zLo) * 0.5 : bestMid,
      isBand: hasZone, conf, tested, score: 0, rankKey: 0, createdBar: hasZone ? zT : earliest,
      domState: hasZone ? zState : 0, defendCount: hasZone ? zDefend : 0, live: LIVE_IDLE, penetration: 0, health: hasZone ? zHealth : best,
      flowReady: false, flowTotal: 0, flowBuy: 0, flowSell: 0, buyPct: 0, flowClass: 0,
      dispVol: 0, dispDelta: 0, relVol: 0, tierV: 0, key: false,
      supply, prox: 0, marks: hasZone ? zMarks : null, prof: hasZone ? zProf : pProf, nearMemo: false,
    };
    lv.prox = hasZone ? (supply ? lv.bottom : lv.top) : lv.mid;
    const f = hasZone ? zf : pf;
    if (f.r && f.t > 0) {
      lv.flowReady = true; lv.flowTotal = f.t; lv.flowBuy = f.b; lv.flowSell = f.s; lv.buyPct = f.b / f.t;
      lv.flowClass = Math.max(lv.buyPct, 1 - lv.buyPct) >= P.StrongImbalance ? 2 : 1;
    }
    lv.dispVol = lv.flowReady ? lv.flowTotal : hasZone ? zVolProxy : volMax;
    lv.dispDelta = lv.flowReady ? lv.flowBuy - lv.flowSell : hasZone ? deltaSum : 0;
    let sc = best + Math.min(0.18, 0.06 * (sources - 1));
    if (conf) sc += P.ConfluenceBoost;
    if (lv.flowReady) {
      const dom = Math.max(lv.buyPct, 1 - lv.buyPct);
      const denom = Math.max(0.05, P.StrongImbalance - 0.5);
      const imb = clamp((dom - 0.5) / denom, 0, 1);
      sc = 0.62 * sc + 0.38 * imb;
    }
    lv.score = clamp(sc, 0, 1);
    lv.rankKey = lv.score;
    return lv;
  }

  return { fp, atr, start, snaps, actions, counts };
}

export const volClass = (lv: Level) => (lv.flowReady ? 0 : lv.isBand ? 1 : 2);

function sortForDisplay(rL: Level[]) {
  rL.sort((a, b) => (b.prox !== a.prox ? b.prox - a.prox : a.id - b.id));
}

function holdTier(score: number, prev: number) {
  if (prev < TIER_WEAK || prev > TIER_STRONG) return score >= 0.60 ? TIER_STRONG : score >= 0.38 ? TIER_MOD : TIER_WEAK;
  let t = prev;
  while (t < TIER_STRONG && score >= (t === TIER_WEAK ? 0.38 : 0.60) + TIER_HOLD) t++;
  while (t > TIER_WEAK && score < (t === TIER_STRONG ? 0.60 : 0.38) - TIER_HOLD) t--;
  return t;
}

/** ReadLive(): what price is doing to a band right now */
export function readLive(lv: { isBand: boolean; top: number; bottom: number; supply: boolean; live: number; penetration: number }, price: number, atrR: number, tick = 0.25) {
  lv.live = LIVE_IDLE; lv.penetration = 0;
  if (!lv.isBand || price <= 0) return;
  const lo = lv.bottom, hi = lv.top, band = Math.max(hi - lo, tick);
  const atrLive = atrR > 0 ? atrR : tick * 4;
  const brk = P.BreakDistAtr * atrLive;
  if (price >= lo && price <= hi) {
    lv.live = LIVE_TESTING;
    lv.penetration = lv.supply ? clamp((price - lo) / band, 0, 1) : clamp((hi - price) / band, 0, 1);
  } else {
    const beyond = lv.supply ? price > hi : price < lo;
    const past = lv.supply ? price - hi : lo - price;
    if (beyond && past >= 0) {
      lv.live = past >= brk ? LIVE_BREAKING : LIVE_TESTING;
      lv.penetration = clamp(past / Math.max(brk, tick), 0, 1);
    }
  }
}

/** DistanceDim(): smoothstep fade to the 55% floor over 8 ATR */
export function distanceDim(level: number, price: number, atrR: number) {
  if (P.DistanceOpacityFloor >= 100 || atrR <= 0 || price <= 0) return 1;
  const dist = Math.abs(price - level);
  const d = clamp(dist / (P.DistanceFadeReachAtr * atrR), 0, 1);
  const sm = d * d * (3 - 2 * d);
  const floorMult = clamp(P.DistanceOpacityFloor / 100, 0, 1);
  return clamp(floorMult + (1 - floorMult) * (1 - sm), 0, 1);
}

export function stateWord(lv: Level): string {
  if (lv.live === LIVE_BREAKING) return "BREAKING";
  if (lv.live === LIVE_TESTING) return "TESTING";
  if (lv.live === LIVE_APPROACHING) return "APPROACHING";
  if (!lv.isBand) return "PIVOT";
  if (lv.defendCount > 0) return lv.defendCount > 1 ? `DEFENDED ${lv.defendCount}×` : "DEFENDED";
  if (lv.domState === 1) return "TESTED";
  return "FRESH";
}

/** FlowVerdict(): what the aggressor effort achieved at the level */
export function flowVerdict(lv: Level): string | null {
  if (!lv.flowReady || !lv.isBand) return null;
  const dom = Math.max(lv.buyPct, 1 - lv.buyPct);
  if (dom < P.StrongImbalance) return "BALANCED";
  const buyDom = lv.buyPct >= 0.5;
  const challenger = lv.supply ? buyDom : !buyDom;
  if (!challenger) return "PRESSING";
  if (lv.live === LIVE_BREAKING) return "OVERRUN";
  return "ABSORBED";
}

/** FormatVol(): .NET "0.##" with K / M / B */
export function formatVol(v: number): string {
  const a = Math.abs(v);
  const f2 = (x: number) => { const r = Math.round(x * 100) / 100; return String(r); };
  if (a <= 0) return "0";
  if (a >= 1e9) return f2(v / 1e9) + "B";
  if (a >= 1e6) return f2(v / 1e6) + "M";
  if (a >= 1e3) return f2(v / 1e3) + "K";
  return String(Math.round(v));
}
export const pctInt = (frac: number) => `${rne(clamp(frac, 0, 1) * 100)}%`;
