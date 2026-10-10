import type { Session } from "../types";
import { minuteOfDay } from "../ta";

/**
 * DS ProLiquidityHunter — the closed-bar engine, ported line for line from
 * DSProLiquidityHunter.cs (Build 2026-10-09): ComputeBar(), Engine(c = 0),
 * Reach(), Latch(), RankOf(), Resolve(), AddRun(), NoteStack(), NoteTouch(),
 * MakePrior()/Erf(). Shipped defaults: Swing size 3.0, Horizon 60, Verdict on
 * the next close ON, Report major pools only ON.
 *
 * Every per-bar result is stored with the bar that produced it, and every pool
 * carries its own timeline (birth, stack history, tier runs, take, verdict), so
 * the study can show any bar k from bars <= k only.
 */

export const HZ = 60;            // Horizon (bars)
export const SZ = 3.0;           // Swing size (ATRs)
export const VL = 2 * HZ;        // warm-up / variance length
export const NB = 40;
const N0_TABLE = 200.0;
const SLOT_MIN = 15, NSLOT = 96;
const N0_RHO = 60.0;
const MERGE_TOL = 0.25;
const RANK_SWING_H = 1, RANK_MAJOR_H = 6;
const MAX_LIVE = 256;

export const RK_LOCAL = 1, RK_SWING = 2, RK_MAJOR = 3;
export const VD_LIVE = -1, VD_PENDING = 0, VD_SWEPT = 1, VD_RUN = 2;
export const TR_COLD = 0, TR_COOL = 1, TR_WARM = 2, TR_HOT = 3;
export const T_COOL = 0.05, T_WARM = 0.25, T_HOT = 0.60;
const X_COOL = 0.03, X_WARM = 0.18, X_HOT = 0.50;
export const MAJOR_ONLY = true;

export type Pool = {
  id: number;
  side: number;          // +1 buy-side (over a high), -1 sell-side (under a low)
  level: number;
  depth: number;
  born: number;          // bar on whose close the swing was confirmed
  anchor: number;        // bar of the extreme itself
  take: number;          // bar that traded through it (-1 resting)
  verdict: number;       // final verdict (VD_*)
  verdictBar: number;    // bar on whose close the verdict was given (-1 none)
  deadSeq: number;       // position in the tool's dead list
  dropped: number;       // bar on which MAX_LIVE overflow dropped it (-1 never)
  runs: number[];        // flattened (bar, tier) pairs — the tier timeline
  stBar: number[]; stNear: number[]; stDom: number[];   // stack history
  tBar: number[]; tPx: number[]; tAt: number[];         // stacked extremes (bar, price, confirm bar)
  bornRank: number;
  // live simulation state
  near: number; dom: number; touches: number; tier: number; odds: number;
  ring: Uint8Array | null; ringHead: number; ringCount: number;
};

export type HotNote = { bar: number; pool: Pool; pct: number };

export type LhRun = {
  n: number;
  pools: Pool[];
  atr: Float64Array;
  unit: Float64Array;
  oddsUp: Float64Array;   // plot OddsAbove (percent)
  oddsDn: Float64Array;
  poolUp: Float64Array;   // plot PoolAbove (NaN none)
  poolDn: Float64Array;
  hu: Int32Array;         // id of the hottest buy-side pool after bar b (-1)
  hd: Int32Array;
  ev: Int8Array;          // plot Event: ±1 sweep, ±2 run
  evRank: Int8Array;
  evPx: Float64Array;
  evPool: Int32Array;
  pend: Int32Array;       // pool taken on bar b whose verdict is pending (-1)
  survUp: Float64Array;   // n * (NB+1)
  survDn: Float64Array;
  expo: Float64Array;     // n * 4 track record
  hits: Float64Array;
  hot: HotNote[];
};

function erf(x: number) {
  const sign = x < 0 ? -1.0 : 1.0;
  const ax = x < 0 ? -x : x;
  const t = 1.0 / (1.0 + 0.3275911 * ax);
  const y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

export const SURV0: Float64Array = (() => {
  const s = new Float64Array(NB + 1);
  for (let k = 0; k <= NB; k++) s[k] = 1.0 - erf((k * 0.1) / Math.sqrt(2.0));
  return s;
})();

/** Reach(s, z) over a table stored at offset `o` of `s`. */
export function reach(s: ArrayLike<number>, o: number, z: number) {
  if (Number.isNaN(z) || !Number.isFinite(z)) return 0.0;
  if (z <= 0.0) return 1.0;
  if (z >= NB * 0.1) return s[o + NB] * Math.exp(-(z - NB * 0.1));
  let k = Math.floor(z * 10.0);
  if (k >= NB) k = NB - 1;
  const f = z * 10.0 - k;
  return s[o + k] + (s[o + k + 1] - s[o + k]) * f;
}

export function invReach(s: ArrayLike<number>, o: number, p: number) {
  if (!(p > 0.0)) return Number.NaN;
  if (p >= s[o]) return 0.0;
  for (let k = 0; k < NB; k++)
    if (s[o + k] >= p && p >= s[o + k + 1]) {
      const dd = s[o + k] - s[o + k + 1];
      return (k + (dd > 0.0 ? (s[o + k] - p) / dd : 0.0)) * 0.1;
    }
  return s[o + NB] > 0.0 ? NB * 0.1 + Math.log(s[o + NB] / p) : Number.NaN;
}

export function latch(t: number, p: number) {
  while (t < TR_HOT && p >= (t === TR_COLD ? T_COOL : t === TR_COOL ? T_WARM : T_HOT)) t++;
  while (t > TR_COLD && p < (t === TR_COOL ? X_COOL : t === TR_WARM ? X_WARM : X_HOT)) t--;
  return t;
}

export const rankOf = (dom: number) => (dom >= RANK_MAJOR_H * HZ ? RK_MAJOR : dom >= RANK_SWING_H * HZ ? RK_SWING : RK_LOCAL);
export const reported = (rank: number) => (MAJOR_ONLY ? rank >= RK_MAJOR : rank >= RK_SWING);
export const rankWord = (rank: number) => (rank >= RK_MAJOR ? "MAJOR" : rank === RK_SWING ? "SWING" : "LOCAL");

/** C# Math.Round (banker's rounding, MidpointRounding.ToEven). */
export function cround(x: number) {
  const f = Math.floor(x), d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

export function runEngine(s: Session): LhRun {
  const n = s.n, H = s.h, L = s.l, C = s.c;
  const W = NB + 1;
  const ev = new Float64Array(n), atr = new Float64Array(n), unit = new Float64Array(n);
  const slot = new Int32Array(n);
  const out: LhRun = {
    n, pools: [], atr, unit,
    oddsUp: new Float64Array(n), oddsDn: new Float64Array(n),
    poolUp: new Float64Array(n).fill(NaN), poolDn: new Float64Array(n).fill(NaN),
    hu: new Int32Array(n).fill(-1), hd: new Int32Array(n).fill(-1),
    ev: new Int8Array(n), evRank: new Int8Array(n), evPx: new Float64Array(n).fill(NaN), evPool: new Int32Array(n).fill(-1),
    pend: new Int32Array(n).fill(-1),
    survUp: new Float64Array(n * W), survDn: new Float64Array(n * W),
    expo: new Float64Array(n * 4), hits: new Float64Array(n * 4),
    hot: [],
  };
  const rhoSum = new Float64Array(NSLOT), rhoCnt = new Float64Array(NSLOT);
  const cntUp = new Float64Array(W), cntDn = new Float64Array(W);
  const survUp = Float64Array.from(SURV0), survDn = Float64Array.from(SURV0);
  let tableN = 0;
  const trackExpo = [0, 0, 0, 0], trackHits = [0, 0, 0, 0];
  const live: Pool[] = [];
  let pend: Pool | null = null;
  let zdir = 0, zext = 0, zbar = 0;
  let deadSeq = 0, nextId = 0;

  const resolve = (p: Pool, hit: boolean) => {
    if (!p.ring) return;
    const m = p.ring.length;
    for (let i = 0; i < p.ringCount; i++) {
      const t = p.ring[(p.ringHead + i) % m];
      trackExpo[t]++;
      if (hit) trackHits[t]++;
    }
    p.ringCount = 0; p.ringHead = 0;
    if (hit) p.ring = null;
  };
  const noteStack = (p: Pool, bar: number) => { p.stBar.push(bar); p.stNear.push(p.near); p.stDom.push(p.dom); };
  const noteTouch = (p: Pool, bar: number, px: number, at: number) => { if (p.tBar.length >= 16) return; p.tBar.push(bar); p.tPx.push(px); p.tAt.push(at); };

  for (let b = 0; b < n; b++) {
    // ---- ComputeBar()
    if (b === 0) { ev[0] = 0.0; atr[0] = H[0] - L[0]; }
    else {
      const d = C[b] - C[b - 1], dd = d * d;
      const tr = Math.max(H[b] - L[b], Math.max(Math.abs(H[b] - C[b - 1]), Math.abs(L[b] - C[b - 1])));
      let e = ev[b - 1], at = atr[b - 1];
      if (b <= VL) { e = e + (dd - e) / b; at = at + (tr - at) / (b + 1); }
      else { const a = 2.0 / (VL + 1.0); e = e + a * (dd - e); at = at + a * (tr - at); }
      ev[b] = e; atr[b] = at;
    }
    slot[b] = Math.min(NSLOT - 1, Math.max(0, Math.floor(minuteOfDay(s, b) / SLOT_MIN)));

    // ---- Engine(0)
    const hi = H[b], lo = L[b], cl = C[b];
    let evCode = 0, evRank = 0, evPx = NaN;
    let evPool: Pool | null = null;
    let hotDone = false;

    const j = b - HZ;
    if (j >= VL) {
      const cj = C[j];
      let prev = cj, fw = 0.0, mx = H[j + 1], mn = L[j + 1];
      for (let k = j + 1; k <= b; k++) {
        const dk = C[k] - prev;
        fw += dk * dk; prev = C[k];
        if (H[k] > mx) mx = H[k];
        if (L[k] < mn) mn = L[k];
      }
      const sj = slot[j], basE = ev[j] * HZ;
      if (fw > 0.0 && basE > 0.0) { rhoSum[sj] += Math.log(fw / basE); rhoCnt[sj] += 1.0; }
      const uj = unit[j];
      if (uj > 0.0) {
        const mp = (mx - cj) / uj, mm = (cj - mn) / uj;
        if (mp >= 0.0) { const q = Math.floor(mp * 10.0); cntUp[q >= NB ? NB : q] += 1.0; }
        if (mm >= 0.0) { const q = Math.floor(mm * 10.0); cntDn[q >= NB ? NB : q] += 1.0; }
        tableN++;
        let au = 0.0, ad = 0.0;
        for (let k = NB; k >= 0; k--) {
          au += cntUp[k]; ad += cntDn[k];
          survUp[k] = (au + N0_TABLE * SURV0[k]) / (tableN + N0_TABLE);
          survDn[k] = (ad + N0_TABLE * SURV0[k]) / (tableN + N0_TABLE);
        }
      }
    }

    const sb = slot[b];
    const rho = Math.exp(rhoSum[sb] / (rhoCnt[sb] + N0_RHO));
    const u2 = ev[b] * HZ * rho;
    let u = u2 > 0.0 ? Math.sqrt(u2) : 0.0;
    if (!Number.isFinite(u)) u = 0.0;
    unit[b] = u;
    const warm = b >= VL;

    // verdict on the next close
    if (pend) {
      const p = pend; pend = null;
      const beyond = p.side > 0 ? cl > p.level : cl < p.level;
      p.verdict = beyond ? VD_RUN : VD_SWEPT;
      p.verdictBar = b;
      evCode = beyond ? 2 * p.side : -p.side;
      evRank = rankOf(p.dom); evPx = p.level; evPool = p;
    }

    // takes
    let best: Pool | null = null;
    for (let i = 0; i < live.length; i++) {
      const p = live[i];
      if (!((p.side > 0 && hi > p.level) || (p.side < 0 && lo < p.level))) continue;
      p.take = b; p.verdict = VD_PENDING;
      resolve(p, true);
      p.deadSeq = deadSeq++;
      if (best === null || rankOf(p.dom) > rankOf(best.dom) || (rankOf(p.dom) === rankOf(best.dom) && p.dom > best.dom)) best = p;
      live.splice(i, 1); i--;
    }
    if (best) pend = best; // ConfirmVerdict = true

    // swing confirmation
    const thr = SZ * atr[b];
    let nSide = 0, nPrice = 0.0, nBar = 0;
    if (zdir === 0) { zdir = 1; zext = hi; zbar = b; }
    else if (zdir === 1) {
      if (hi > zext) { zext = hi; zbar = b; }
      else if (thr > 0.0 && zext - lo >= thr) { nSide = 1; nPrice = zext; nBar = zbar; zdir = -1; zext = lo; zbar = b; }
    } else {
      if (lo < zext) { zext = lo; zbar = b; }
      else if (thr > 0.0 && hi - zext >= thr) { nSide = -1; nPrice = zext; nBar = zbar; zdir = 1; zext = hi; zbar = b; }
    }

    if (nSide !== 0 && warm) {
      const lim = Math.max(-1, nBar - RANK_MAJOR_H * HZ - 1);
      let jx = nBar - 1;
      if (nSide > 0) { while (jx > lim && H[jx] <= nPrice) jx--; }
      else { while (jx > lim && L[jx] >= nPrice) jx--; }
      const dom = nBar - jx;
      const tol = MERGE_TOL * atr[b];
      let hit: Pool | null = null;
      for (const p of live) {
        if (p.side !== nSide || Math.abs(p.level - nPrice) > tol) continue;
        if (hit === null || Math.abs(p.level - nPrice) < Math.abs(hit.level - nPrice)) hit = p;
      }
      if (hit) {
        hit.touches++;
        if (nSide > 0) { if (nPrice < hit.near) hit.near = nPrice; }
        else { if (nPrice > hit.near) hit.near = nPrice; }
        if (dom > hit.dom) hit.dom = dom;
        noteStack(hit, b);
        noteTouch(hit, nBar, nPrice, b);
      } else {
        const p: Pool = {
          id: nextId++, side: nSide, level: nPrice, depth: tol, born: b, anchor: nBar,
          take: -1, verdict: VD_LIVE, verdictBar: -1, deadSeq: -1, dropped: -1,
          runs: [], stBar: [], stNear: [], stDom: [], tBar: [], tPx: [], tAt: [],
          bornRank: rankOf(dom),
          near: nPrice, dom, touches: 1, tier: TR_COLD, odds: 0,
          ring: new Uint8Array(HZ), ringHead: 0, ringCount: 0,
        };
        noteStack(p, b);
        live.push(p);
        out.pools.push(p);
        if (live.length > MAX_LIVE) {
          let far = 0;
          for (let q = 1; q < live.length; q++) if (Math.abs(live[q].level - cl) > Math.abs(live[far].level - cl)) far = q;
          live[far].dropped = b;
          live.splice(far, 1);
        }
      }
    }

    // odds, tiers, track record, hottest per side
    let bu = 0.0, bd = 0.0, pu = NaN, pd = NaN, du = 0.0, dn = 0.0;
    let hu: Pool | null = null, hd: Pool | null = null;
    for (const p of live) {
      const dist = p.side > 0 ? p.level - cl : cl - p.level;
      const z = u > 0.0 ? dist / u : Number.POSITIVE_INFINITY;
      const od = reach(p.side > 0 ? survUp : survDn, 0, z);
      p.odds = od;
      const t = latch(p.tier, od);
      if (t !== p.tier || p.runs.length === 0) p.runs.push(b, t);
      if (t === TR_HOT && p.tier !== TR_HOT && p.runs.length > 2 && reported(rankOf(p.dom)) && !hotDone) {
        hotDone = true;
        out.hot.push({ bar: b, pool: p, pct: cround(od * 100.0) });
      }
      p.tier = t;
      const m = p.ring!.length;
      if (p.ringCount >= m) {
        trackExpo[p.ring![p.ringHead]]++;
        p.ringHead = (p.ringHead + 1) % m;
        p.ringCount--;
      }
      p.ring![(p.ringHead + p.ringCount) % m] = t;
      p.ringCount++;
      if (p.side > 0) {
        if (Number.isNaN(pu) || od > bu || (od === bu && dist < du)) { bu = od; pu = p.level; du = dist; hu = p; }
      } else {
        if (Number.isNaN(pd) || od > bd || (od === bd && dist < dn)) { bd = od; pd = p.level; dn = dist; hd = p; }
      }
    }

    out.oddsUp[b] = 100.0 * bu; out.oddsDn[b] = 100.0 * bd;
    out.poolUp[b] = pu; out.poolDn[b] = pd;
    out.hu[b] = hu ? hu.id : -1; out.hd[b] = hd ? hd.id : -1;
    out.ev[b] = evCode; out.evRank[b] = evRank; out.evPx[b] = evPx; out.evPool[b] = evPool ? evPool.id : -1;
    out.pend[b] = pend ? pend.id : -1;
    out.survUp.set(survUp, b * W); out.survDn.set(survDn, b * W);
    for (let t = 0; t < 4; t++) { out.expo[b * 4 + t] = trackExpo[t]; out.hits[b * 4 + t] = trackHits[t]; }
  }
  return out;
}

/** The pool's stack state (near, dom, touches) as it stood on bar `at`. */
export function stackAt(p: Pool, at: number) {
  let st = -1;
  for (let k = 0; k < p.stBar.length; k++) { if (p.stBar[k] <= at) st = k; else break; }
  if (st < 0) return { near: p.near, dom: p.dom, touch: p.touches };
  return { near: p.stNear[st], dom: p.stDom[st], touch: st + 1 };
}

/** The pool's latched tier on bar `at` (-1 before its first run). */
export function tierAt(p: Pool, at: number) {
  let t = -1;
  for (let r = 0; r < p.runs.length; r += 2) { if (p.runs[r] <= at) t = p.runs[r + 1]; else break; }
  return t;
}

export const restingAt = (p: Pool, at: number) => p.born <= at && (p.take < 0 || p.take > at) && (p.dropped < 0 || p.dropped > at);
