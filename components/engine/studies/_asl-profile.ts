/**
 * DS ASL — the volume-profile half: DsAslProfile + DsAslAnalysis.Analyse() from DSASL.cs,
 * ported line for line. Trades come from the replay's footprint (the real trades at each
 * price inside the bar); each minute's volume the trades do not account for is filled in
 * from the 1-minute bar exactly as the tool does it — spread over the bar's range with a
 * triangular weight peaking at its typical price (high + low + close) / 3.
 */
import type { Session } from "../types";

export const MIN_REL = 0.25, MAX_NODES = 4, VALUE_AREA = 0.70, MAX_BINS = 4000, RANGE_SIGMA = 0.0275;

export type Analysis = {
  empty: boolean;
  spanLo: number; spanHi: number;
  comb: Float64Array;
  total: number; fill: number; fillShare: number;
  levelTicks: number; levelBase: number; levelVol: Float64Array; levelMax: number; pocLevel: number;
  poc: number; vaLo: number; vaHi: number;
  hvn: number[]; lvn: number[];
};

const floorDiv = (a: number, b: number) => Math.floor(a / b);

/** LevelTicksFor(): 1 point on NQ (4 ticks) — from the price, nearest 1/2/2.5/5/10 step of price·0.00004. */
export function levelTicksFor(price: number, tick: number) {
  if (!(price > 0) || !(tick > 0) || !Number.isFinite(price)) return 1;
  const x = price * 0.00004;
  const e = Math.pow(10, Math.floor(Math.log10(x)));
  const mm = x / e;
  let best = 1, bd = Number.MAX_VALUE;
  for (const st of [1, 2, 2.5, 5, 10]) { const dd = Math.abs(Math.log(mm / st)); if (dd < bd - 1e-12) { bd = dd; best = st; } }
  const r = Math.round(best * e / tick);
  return r < 1 ? 1 : r > 1000 ? 1000 : r;
}

/** Analyse the profile of bars a..b (inclusive). */
export function analyse(s: Session, a: number, b: number, levelTicks: number, major: boolean): Analysis {
  const tk = s.tick;
  // --- trades (footprint) and per-minute references (the 1-minute bars)
  let tLo = Infinity, tHi = -Infinity, total = 0, trades = 0;
  const mLo: number[] = [], mHi: number[] = [], mVol: number[] = [];
  const rLo: number[] = [], rHi: number[] = [], rTp3: number[] = [], rVol: number[] = [];
  for (let i = a; i <= b; i++) {
    const bid = s.fp.bid[i], ask = s.fp.ask[i], lo0 = s.fp.lo[i];
    let ml = Infinity, mh = -Infinity, mv = 0;
    for (let j = 0; j < bid.length; j++) {
      const v = bid[j] + ask[j];
      if (!(v > 0)) continue;
      const k = lo0 + j;
      if (k < ml) ml = k; if (k > mh) mh = k;
      mv += v; total += v; trades++;
    }
    if (mv > 0) { if (ml < tLo) tLo = ml; if (mh > tHi) tHi = mh; }
    mLo.push(ml); mHi.push(mh); mVol.push(mv);
    // Reference(): skipped when the bar has no volume
    const v = s.v[i];
    let kh = Math.round(s.h[i] / tk), kl = Math.round(s.l[i] / tk), kc = Math.round(s.c[i] / tk);
    if (kh < kl) { const z = kh; kh = kl; kl = z; }
    if (!(v > 0)) { rVol.push(0); rLo.push(0); rHi.push(-1); rTp3.push(0); continue; }
    if (kc < kl) kc = kl; if (kc > kh) kc = kh;
    rLo.push(kl); rHi.push(kh); rTp3.push(kh + kl + kc); rVol.push(v);
  }
  const nb = b - a + 1;
  let lo = trades > 0 ? tLo : Infinity, hi = trades > 0 ? tHi : -Infinity;
  for (let q = 0; q < nb; q++) {
    if (!(rVol[q] > 0)) continue;
    if (!(rVol[q] - mVol[q] > 0)) continue;
    if (rLo[q] < lo) lo = rLo[q];
    if (rHi[q] > hi) hi = rHi[q];
  }
  const EMPTY: Analysis = { empty: true, spanLo: 0, spanHi: -1, comb: new Float64Array(0), total: 0, fill: 0, fillShare: 0, levelTicks, levelBase: 0, levelVol: new Float64Array(0), levelMax: 0, pocLevel: 0, poc: NaN, vaLo: 0, vaHi: 0, hvn: [], lvn: [] };
  if (lo > hi) return EMPTY;
  const span = hi - lo + 1;
  const cv = new Float64Array(span);
  if (trades > 0) for (let i = a; i <= b; i++) {
    const bid = s.fp.bid[i], ask = s.fp.ask[i], lo0 = s.fp.lo[i];
    for (let j = 0; j < bid.length; j++) { const v = bid[j] + ask[j]; if (v > 0) cv[lo0 + j - lo] += v; }
  }
  let fill = 0;
  for (let q = 0; q < nb; q++) {
    if (!(rVol[q] > 0)) continue;
    const miss = rVol[q] - mVol[q];
    if (!(miss > 0)) continue;
    fill += miss;
    if (rHi[q] === rLo[q]) { cv[rLo[q] - lo] += miss; continue; }
    const wTop = 3 * (rHi[q] - rLo[q] + 1);
    let wsum = 0;
    for (let k = rLo[q]; k <= rHi[q]; k++) wsum += wTop - Math.abs(3 * k - rTp3[q]);
    for (let k = rLo[q]; k <= rHi[q]; k++) cv[k - lo] += miss * (wTop - Math.abs(3 * k - rTp3[q])) / wsum;
  }
  const fillShare = total + fill > 0 ? fill / (total + fill) : 0;

  const g = Math.max(1, Math.floor((span + MAX_BINS - 1) / MAX_BINS));
  const n = Math.floor((span + g - 1) / g);
  const v = new Float64Array(n);
  for (let k = lo; k <= hi; k++) v[Math.floor((k - lo) / g)] += cv[k - lo];

  // the median minute range
  const r: number[] = [];
  for (let q = 0; q < nb; q++) {
    const hasT = mVol[q] > 0, hasR = rVol[q] > 0;
    if (hasT) r.push(hasR ? Math.max(rHi[q], mHi[q]) - Math.min(rLo[q], mLo[q]) : mHi[q] - mLo[q]);
  }
  for (let q = 0; q < nb; q++) if (rVol[q] > 0 && !(mVol[q] > 0)) r.push(rHi[q] - rLo[q]);
  r.sort((x, y) => x - y);
  const med = r.length === 0 ? 0 : r.length % 2 === 1 ? r[(r.length - 1) / 2] : (r[r.length / 2 - 1] + r[r.length / 2]) / 2;
  let sigma = Math.max(1, med / 2 / g);
  if (major) sigma = Math.max(sigma, RANGE_SIGMA * span / g);

  const rad = Math.ceil(3 * sigma);
  const ker = new Float64Array(2 * rad + 1);
  let ks = 0;
  for (let j = -rad; j <= rad; j++) { const x = j / sigma; ker[j + rad] = Math.exp(-0.5 * x * x); ks += ker[j + rad]; }
  for (let j = 0; j < ker.length; j++) ker[j] /= ks;
  const sm = new Float64Array(n);
  let smax = 0;
  for (let i = 0; i < n; i++) {
    let acc = 0;
    const j0 = Math.max(-rad, -i), j1 = Math.min(rad, n - 1 - i);
    for (let j = j0; j <= j1; j++) acc += v[i + j] * ker[j + rad];
    sm[i] = acc;
    if (acc > smax) smax = acc;
  }

  type Node = { peak: number; height: number; base: number; rel: number; from: number; to: number };
  const cand: Node[] = [];
  for (let i = 0; i < n; i++) {
    if (!(sm[i] > 0)) continue;
    if (i > 0 && !(sm[i] > sm[i - 1])) continue;
    if (i < n - 1 && !(sm[i] >= sm[i + 1])) continue;
    let lmin = sm[i], rmin = sm[i], lh = false, rh = false;
    for (let j = i - 1; j >= 0; j--) { if (sm[j] < lmin) lmin = sm[j]; if (sm[j] > sm[i]) { lh = true; break; } }
    for (let j = i + 1; j < n; j++) { if (sm[j] < rmin) rmin = sm[j]; if (sm[j] > sm[i]) { rh = true; break; } }
    const bas = lh && rh ? Math.max(lmin, rmin) : lh ? lmin : rh ? rmin : Math.max(lmin, rmin);
    cand.push({ peak: i, height: sm[i], base: bas, rel: smax > 0 ? (sm[i] - bas) / smax : 0, from: i, to: i });
  }
  for (let x = 1; x < cand.length; x++) { // insertion sort by prominence, ties by lower peak
    const key = cand[x];
    let y = x - 1;
    while (y >= 0 && ((cand[y].height - cand[y].base) < (key.height - key.base) || ((cand[y].height - cand[y].base) === (key.height - key.base) && cand[y].peak > key.peak))) { cand[y + 1] = cand[y]; y--; }
    cand[y + 1] = key;
  }
  let top = -1;
  for (let c = 0; c < cand.length; c++) if (top < 0 || cand[c].height > cand[top].height || (cand[c].height === cand[top].height && cand[c].peak < cand[top].peak)) top = c;
  const nodes: Node[] = [];
  if (top >= 0) nodes.push(cand[top]);
  for (let c = 0; c < cand.length && nodes.length < MAX_NODES; c++) { if (c === top || cand[c].rel < MIN_REL) continue; nodes.push(cand[c]); }
  for (const nd of nodes) {
    let f = nd.peak, t = nd.peak;
    while (f > 0 && sm[f - 1] >= nd.base && sm[f - 1] <= sm[f]) f--;
    while (t < n - 1 && sm[t + 1] >= nd.base && sm[t + 1] <= sm[t]) t++;
    nd.from = f; nd.to = t;
  }

  const lt = levelTicks < 1 ? 1 : levelTicks;
  const jb = floorDiv(lo, lt), je = floorDiv(hi, lt), m = je - jb + 1;
  const lv = new Float64Array(m);
  for (let k = lo; k <= hi; k++) lv[floorDiv(k, lt) - jb] += cv[k - lo];
  let pj = 0;
  for (let i = 1; i < m; i++) if (lv[i] > lv[pj]) pj = i;
  const busiest = (k0: number, k1: number) => {
    if (k0 < lo) k0 = lo; if (k1 > hi) k1 = hi;
    let best = k0, bv = -1;
    for (let k = k0; k <= k1; k++) { const x = cv[k - lo]; if (x > bv) { bv = x; best = k; } }
    return best;
  };
  const pk = busiest((jb + pj) * lt, (jb + pj) * lt + lt - 1);
  let tot = 0;
  for (let i = 0; i < m; i++) tot += lv[i];
  let va0 = pj, va1 = pj, inside = lv[pj];
  const target = VALUE_AREA * tot;
  while (inside < target && (va0 > 0 || va1 < m - 1)) {
    let up = 0, dn = 0, upN = 0, dnN = 0;
    if (va1 + 1 <= m - 1) { up += lv[va1 + 1]; upN = 1; if (va1 + 2 <= m - 1) { up += lv[va1 + 2]; upN = 2; } }
    if (va0 - 1 >= 0) { dn += lv[va0 - 1]; dnN = 1; if (va0 - 2 >= 0) { dn += lv[va0 - 2]; dnN = 2; } }
    if (upN > 0 && (dnN === 0 || up >= dn)) { va1 += upN; inside += up; } else { va0 -= dnN; inside += dn; }
  }
  let pocNode = -1;
  for (let c = 0; c < nodes.length; c++) {
    const f = lo + nodes[c].from * g, t = Math.min(hi, lo + nodes[c].to * g + g - 1);
    if (pocNode < 0 && pk >= f && pk <= t) pocNode = c;
  }
  const hvn: number[] = [];
  for (let c = 0; c < nodes.length; c++) {
    if (c === pocNode) continue;
    const f = lo + nodes[c].from * g, t = Math.min(hi, lo + nodes[c].to * g + g - 1);
    const x0 = floorDiv(f, lt) - jb, x1 = floorDiv(t, lt) - jb;
    let best = x0;
    for (let i = x0 + 1; i <= x1; i++) if (lv[i] > lv[best]) best = i;
    if (best === pj) continue;
    const hk = busiest(Math.max(f, (jb + best) * lt), Math.min(t, (jb + best) * lt + lt - 1));
    if (!hvn.includes(hk)) hvn.push(hk);
  }
  hvn.sort((x, y) => x - y);
  const pk2 = nodes.map((nd) => nd.peak).sort((x, y) => x - y);
  const lvn: number[] = [];
  for (let c = 0; c + 1 < pk2.length; c++) {
    let best = pk2[c];
    for (let i = pk2[c] + 1; i <= pk2[c + 1]; i++) if (sm[i] < sm[best]) best = i;
    lvn.push(Math.min(hi, lo + best * g + Math.floor((g - 1) / 2)));
  }
  return {
    empty: false, spanLo: lo, spanHi: hi, comb: cv, total, fill, fillShare,
    levelTicks: lt, levelBase: jb, levelVol: lv, levelMax: lv[pj], pocLevel: jb + pj,
    poc: pk, vaLo: Math.max(lo, (jb + va0) * lt), vaHi: Math.min(hi, (jb + va1) * lt + lt - 1), hvn, lvn,
  };
}
