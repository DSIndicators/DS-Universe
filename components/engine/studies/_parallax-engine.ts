import type { Session } from "../types";

/**
 * DS Parallax — the liquidity-pool engine and the higher-timeframe series,
 * ported line for line from DSParallax.cs (Build 2026-10-07):
 * ComputePools() / BuildSide() / AtrRef(), and the panel series NinjaTrader
 * builds with AddDataSeries() (minute bars aligned to the 18:00 ET session
 * open, daily bars per session). Bars are passed NEWEST FIRST, index 0 = the
 * developing higher-timeframe bar, exactly like NinjaScript's Highs[bip][k].
 */

export const SWING = 3;          // SwingLength
export const EQ_TOL_ATR = 0.25;  // EqualTolAtr
export const MAX_POOLS = 3;      // MaxPoolsPerSide
export const GHOSTS = 2;         // GhostsPerSide (SweptPools = Ghost)
export const BARS_SHOWN = 30;    // BarsShown
export const ATRLEN = 14;
const MAXBARS = 60, MAXPOOL = 24;

export type Pool = {
  lvl: number;
  inner: number;
  /** oldest member bar (index into the newest-first window) */
  idx: number;
  touches: number;
  buy: boolean;
  swept: boolean;
  sweepIdx: number;
  /** newest member bar (not used by the engine's rules; the replay narrates with it) */
  newest: number;
};

export type Win = { o: number[]; h: number[]; l: number[]; c: number[]; n: number };

const beyond = (a: number, b: number, buy: boolean) => (buy ? a > b : a < b);
const dist = (a: number, b: number, buy: boolean) => (buy ? a - b : b - a);

/** AtrRef(): the Wilder ATR when there is one, else the window's mean true range. */
export function atrRef(w: Win, atrVal: number, tick: number): number {
  if (atrVal > 0 && !Number.isNaN(atrVal)) return atrVal;
  const n = w.n;
  if (n >= 2) {
    let sum = 0, c = 0;
    for (let i = 0; i < n - 1; i++) {
      sum += Math.max(w.h[i] - w.l[i], Math.max(Math.abs(w.h[i] - w.c[i + 1]), Math.abs(w.l[i] - w.c[i + 1])));
      c++;
    }
    if (c > 0 && sum > 0) return sum / c;
  }
  const r = w.h[0] - w.l[0];
  return r > 0 ? r : tick * 100;
}

/** ComputePools(): live pools (nearest first, the window's extreme always kept), then ghosts — buy side, then sell side. */
export function computePools(w: Win, atrVal: number, tick: number): Pool[] {
  const n = w.n;
  const out: Pool[] = [];
  if (n < 3) return out;
  const atr = atrRef(w, atrVal, tick);
  const tol = Math.max(atr * Math.max(0, EQ_TOL_ATR), tick);
  const sw = Math.max(1, Math.min(20, SWING));
  const capL = Math.max(1, Math.min(6, MAX_POOLS));
  const capG = Math.max(0, Math.min(4, GHOSTS));
  buildSide(w, n, true, sw, tol, capL, capG, out);
  buildSide(w, n, false, sw, tol, capL, capG, out);
  return out;
}

function buildSide(w: Win, n: number, buy: boolean, sw: number, tol: number, capL: number, capG: number, out: Pool[]) {
  const ext = (k: number) => (buy ? w.h[k] : w.l[k]);
  const candIdx: number[] = [], candLvl: number[] = [];
  for (let q = 1; q < n; q++) {
    const e = ext(q);
    let ok = true;
    for (let k = 1; k <= sw && ok; k++) {
      if (q + k < n && beyond(ext(q + k), e, buy)) ok = false;
      if (q - k >= 0 && beyond(ext(q - k), e, buy)) ok = false;
    }
    if (!ok) continue;
    for (let k = 0; k < q - sw; k++) if (dist(ext(k), e, buy) > tol) { ok = false; break; }
    if (!ok) continue;
    candIdx.push(q); candLvl.push(e);
  }
  const nc = candIdx.length;
  // insertion sort, most extreme first
  const ord: number[] = [];
  for (let i = 0; i < nc; i++) ord[i] = i;
  for (let i = 1; i < nc; i++) {
    const v = ord[i]; let j = i - 1;
    while (j >= 0 && beyond(candLvl[v], candLvl[ord[j]], buy)) { ord[j + 1] = ord[j]; j--; }
    ord[j + 1] = v;
  }
  const side: Pool[] = [];
  const used: boolean[] = [];
  let i0 = 0;
  while (i0 < nc && side.length < MAXBARS) {
    const outer = candLvl[ord[i0]];
    let j = i0;
    while (j + 1 < nc && dist(outer, candLvl[ord[j + 1]], buy) <= tol) j++;
    let oldest = -1, newest = 1 << 30;
    for (let m = i0; m <= j; m++) { const idx = candIdx[ord[m]]; if (idx > oldest) oldest = idx; if (idx < newest) newest = idx; }
    let touches = 0;
    for (let m = i0; m <= j; m++) used[m] = false;
    for (let m = i0; m <= j; m++) {
      const idx = candIdx[ord[m]];
      let near = false;
      for (let r = i0; r < m && !near; r++) if (used[r] && Math.abs(candIdx[ord[r]] - idx) < sw) near = true;
      if (!near) { used[m] = true; touches++; }
    }
    const pl: Pool = { buy, swept: false, sweepIdx: -1, lvl: outer, inner: candLvl[ord[j]], idx: oldest, touches: touches < 1 ? 1 : touches, newest };
    let live = true;
    for (let k = 0; k < oldest && live; k++) if (beyond(ext(k), pl.lvl, buy)) live = false;
    if (live) side.push(pl);
    i0 = j + 1;
  }
  const ns = side.length;
  // nearest to price first
  const so: number[] = [];
  for (let i = 0; i < ns; i++) so[i] = i;
  for (let i = 1; i < ns; i++) {
    const v = so[i]; let j = i - 1;
    while (j >= 0 && beyond(side[so[j]].lvl, side[v].lvl, buy)) { so[j + 1] = so[j]; j--; }
    so[j + 1] = v;
  }
  if (ns <= capL) { for (let i = 0; i < ns && out.length < MAXPOOL; i++) out.push(side[so[i]]); }
  else {
    for (let i = 0; i < capL - 1 && out.length < MAXPOOL; i++) out.push(side[so[i]]);
    if (out.length < MAXPOOL) out.push(side[so[ns - 1]]);
  }
  const liveStart = out.length - Math.min(ns, capL);

  // ghosts: genuine sweeps only — traded through, closed back inside on that bar or the next
  if (capG <= 0) return;
  const gh: Pool[] = [];
  for (let q = sw; q < n && gh.length < MAXBARS; q++) {
    const e = ext(q);
    let ok = true;
    for (let k = 1; k <= sw && ok; k++) {
      if (q + k < n && beyond(ext(q + k), e, buy)) ok = false;
      if (beyond(ext(q - k), e, buy)) ok = false;
    }
    if (!ok) continue;
    let member = false;
    for (let i = liveStart; i < out.length && !member; i++)
      if (dist(e, out[i].inner, buy) >= 0 && dist(out[i].lvl, e, buy) >= 0) member = true;
    if (member) continue;
    let k1 = -1;
    for (let k = q - sw - 1; k >= 0; k--) if (beyond(ext(k), e, buy)) { k1 = k; break; }
    if (k1 < 0) continue;
    const sweep = !beyond(w.c[k1], e, buy) || (k1 >= 1 && !beyond(w.c[k1 - 1], e, buy));
    if (!sweep) continue;
    let merged = false;
    for (let g = 0; g < gh.length && !merged; g++) {
      const G = gh[g];
      if (G.sweepIdx !== k1) continue;
      if (Math.abs(dist(e, G.inner, buy)) > tol && Math.abs(dist(e, G.lvl, buy)) > tol) continue;
      if (Math.abs(q - G.idx) >= sw) G.touches++;
      if (beyond(e, G.lvl, buy)) G.lvl = e;
      if (beyond(G.inner, e, buy)) G.inner = e;
      if (q > G.idx) G.idx = q;
      if (q < G.newest) G.newest = q;
      merged = true;
    }
    if (merged) continue;
    gh.push({ buy, swept: true, sweepIdx: k1, lvl: e, inner: e, idx: q, touches: 1, newest: q });
  }
  const go: number[] = [];
  for (let i = 0; i < gh.length; i++) go[i] = i;
  for (let i = 1; i < gh.length; i++) {
    const v = go[i]; let j = i - 1;
    while (j >= 0 && gh[go[j]].sweepIdx > gh[v].sweepIdx) { go[j + 1] = go[j]; j--; }
    go[j + 1] = v;
  }
  const takeG = Math.min(capG, gh.length);
  for (let i = 0; i < takeG && out.length < MAXPOOL; i++) out.push(gh[go[i]]);
}

// ------------------------------------------------------------------ HTF series

export type Htf = {
  label: string;
  /** nominal period in seconds (countdown) */
  per: number;
  n: number;
  o: number[]; h: number[]; l: number[]; c: number[];
  /** bar close (and open) in session minutes */
  tClose: number[]; tOpen: number[];
  /** 1-minute bar -> HTF bar; running high/low of its HTF bar through that minute */
  of: Int32Array; runH: Float64Array; runL: Float64Array;
  /** Wilder ATR after the TR of HTF bars 0..j (NaN-free; 0 = none yet) */
  atrAfter: Float64Array;
};

const SESSION_LEN = 1380; // 18:00 -> 17:00 ET

/**
 * A NinjaTrader minute series of `minutes` (0 = daily) on the CME US Index
 * Futures ETH session: bars start at the 18:00 ET session open, the last bar of
 * a session is cut at 17:00, daily = one bar per session closing 17:00.
 */
export function buildHtf(s: Session, minutes: number, label: string): Htf {
  const o: number[] = [], h: number[] = [], l: number[] = [], c: number[] = [], tClose: number[] = [], tOpen: number[] = [];
  const of = new Int32Array(s.n), runH = new Float64Array(s.n), runL = new Float64Array(s.n);
  let cur = -1, key = NaN;
  for (let i = 0; i < s.n; i++) {
    const openMin = s.t[i] - 1;
    const sess = Math.floor((openMin - 1080) / 1440);
    const sStart = sess * 1440 + 1080;
    const off = openMin - sStart;
    const bucket = minutes > 0 ? Math.floor(off / minutes) : 0;
    const k = sess * 10000 + bucket;
    if (k !== key) {
      key = k; cur++;
      o.push(s.o[i]); h.push(s.h[i]); l.push(s.l[i]); c.push(s.c[i]);
      tOpen.push(minutes > 0 ? sStart + bucket * minutes : sStart);
      tClose.push(minutes > 0 ? sStart + Math.min((bucket + 1) * minutes, SESSION_LEN) : sStart + SESSION_LEN);
    } else {
      if (s.h[i] > h[cur]) h[cur] = s.h[i];
      if (s.l[i] < l[cur]) l[cur] = s.l[i];
      c[cur] = s.c[i];
    }
    of[i] = cur; runH[i] = h[cur]; runL[i] = l[cur];
  }
  const n = o.length;
  // Wilder ATR exactly as OnBarUpdate: seed = mean of the first 14 TRs, then (a*13 + tr)/14
  const atrAfter = new Float64Array(n);
  let seed = 0, cnt = 0, ready = false, val = 0;
  for (let j = 0; j < n; j++) {
    const pc = j >= 1 ? c[j - 1] : c[j];
    const tr = Math.max(h[j] - l[j], Math.max(Math.abs(h[j] - pc), Math.abs(l[j] - pc)));
    if (!ready) { seed += tr; cnt++; val = seed / cnt; if (cnt >= ATRLEN) ready = true; }
    else val = (val * (ATRLEN - 1) + tr) / ATRLEN;
    atrAfter[j] = val;
  }
  return { label, per: minutes > 0 ? minutes * 60 : 86400, n, o, h, l, c, tClose, tOpen, of, runH, runL, atrAfter };
}

/** The panel's window as of 1-minute bar k closed (closeK = that minute's close), optionally with the forming 1-minute bar merged in. */
export function windowAt(H: Htf, k: number, closeK: number, live?: { i: number; o: number; h: number; l: number; c: number } | null): { w: Win; j0: number; atr: number } {
  let j0 = H.of[k];
  let o0 = H.o[j0], h0 = H.runH[k], l0 = H.runL[k], c0 = closeK;
  if (live && live.i < H.of.length) {
    const jl = H.of[live.i];
    if (jl === j0) { h0 = Math.max(h0, live.h); l0 = Math.min(l0, live.l); c0 = live.c; }
    else { j0 = jl; o0 = live.o; h0 = live.h; l0 = live.l; c0 = live.c; }
  }
  const want = Math.max(5, Math.min(MAXBARS, BARS_SHOWN));
  const w: Win = { o: [], h: [], l: [], c: [], n: 0 };
  for (let m = 0; m < want; m++) {
    const j = j0 - m;
    if (j < 0) break;
    if (m === 0) { w.o.push(o0); w.h.push(h0); w.l.push(l0); w.c.push(c0); }
    else { w.o.push(H.o[j]); w.h.push(H.h[j]); w.l.push(H.l[j]); w.c.push(H.c[j]); }
    w.n++;
  }
  return { w, j0, atr: j0 >= 1 ? H.atrAfter[j0 - 1] : 0 };
}
