/**
 * DS Oracle — the calculation half of the web edition, a line-for-line port of
 * DSOracle.cs (Build 2026-09-26) at its shipped ApplyDefaults() values:
 *   ComputeCheap()      Wilder RSI, SMA deviation, RSI-vs-signal, Choppiness,
 *                       rolling z-scores, ATR SuperTrend, settled-trend label,
 *                       Magnet (volume-weighted value, retest rail, volume node),
 *                       Neural Engine score, the Neural Line and its bias.
 *   TrainNeural()       online 12-6-1 MLP (xorshift seed, RMSprop, weight decay,
 *                       error audit against the structural baseline).
 *   ComputeHeavy()      Dropship AI vote: Fixed 4-component projection,
 *                       Minkowski p=2, K=10, kernel exp(-d^w / 2 sigma^w),
 *                       comparability gate ZWIN_RATIO 0.5, SIGMA_REL_FLOOR 0.05,
 *                       threshold 0.9, trend confirmation, then the three card
 *                       filters (line agreement, alternate sides, 6-bar dwell).
 *   UpdateLineWeight()  the Neural Line colour weight.
 *   ComputeSpectrum()   four SuperTrend timeframes (14/42/70/140), efficiency,
 *                       momentum, participation z, ignition, hold, cooldown,
 *                       dwell, counter-bar rule and the hollow (unbacked) candle.
 * Historical path without Tick Replay (off = 0, every bar heavy) — which the
 * .cs makes identical to the live CloseBar path for everything closed-bar.
 * Unset NinjaTrader Series<double> slots read as 0 here (Float64Array zero fill),
 * exactly as the .cs reads them at CurrentBar 2 (it returns while CurrentBar < 2).
 */
import type { Session } from "../types";

export const P = {
  atr: 10, factor: 2.0, K: 10, LW: 1000, stride: 10, thr: 0.9,
  rsiP: 20, maP: 20, sigP: 10, chopP: 14, NW: 1000, mink: 2.0, shapeW: 2.0,
  linePeriod: 34, waveSmooth: 2, neuralShift: 0.5, flipBuf: 0.25, blendBand: 2.0, blendSmooth: 8,
  railStrength: 1.0, touchLen: 10, depthSmooth: 30, vpLookback: 120, vpBuckets: 64, nodeRadius: 1.5,
  nodePull: 0.5, magnet: 0.35, horizon: 8, lr: 0.003, warm: 150,
  requireLine: true, dwell: 6, alternate: true,
  specPeriod: 14, chopFloor: 0.10, ignite: 0.30, igniteVol: 0.20, brightHold: 4, brightCool: 5,
  counterTol: 0.0, volMinutes: 5.0, showHollow: true, specDwell: 2 /* Responsive */,
};

const NFEAT = 12, EPS = 1e-9, ZMINSAMPLE = 30, ZWIN_RATIO = 0.5, SIGMA_REL_FLOOR = 0.05;
const LINE_POLES = 3, PRE = 4;
const NN_HID = 6, NN_RMSDECAY = 0.985, NN_RMSEPS = 1e-6, NN_WDECAY = 1e-4, NN_ERRCLIP = 0.5, NN_AUDIT_A = 0.02, NN_SMOOTH_A = 2.0 / 7.0, NN_SEED = 0x9e3779b1;
const SPEC_VOTES = 4, SPEC_VOLWIN = 100, SPEC_MULT = [1, 3, 5, 10];

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const sig = (x: number, k: number, x0: number) => {
  const z = -k * (x - x0);
  if (z > 40) return 0;
  if (z < -40) return 1;
  return 1 / (1 + Math.exp(z));
};
const sgn = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);
const F = (n: number) => new Float64Array(n);

export type SpecPrev = {
  vAtr: number[]; vUp: number[]; vDn: number[]; vLine: number[];
  z: number; er: number; mom: number; hd: number; hold: number; lock: number; lockN: number; state: number; held: number;
};

export type OracleOut = ReturnType<typeof computeOracle>;

export function computeOracle(s: Session) {
  const n = s.n, C = s.c, H = s.h, L = s.l, O = s.o, V = s.v;
  const mw = Math.max(1, P.stride);

  // ---- per-bar series
  const avgGain = F(n), avgLoss = F(n), rsiRaw = F(n), maClose = F(n), maDevRaw = F(n), rsiSigRaw = F(n), chopRaw = F(n);
  const zRsi = F(n), zMaDev = F(n), zRsiSig = F(n), zChop = F(n);
  const atr = F(n), upper = F(n), lower = F(n), stLine = F(n), stDir = F(n), target = F(n);
  const vwNum = F(n), vwDen = F(n), vwS = F(n), depthUp = F(n), depthDn = F(n), rail = F(n), mag = F(n);
  const nnBase = F(n), nnScore = F(n), nnSm = F(n);
  const pre = Array.from({ length: PRE }, () => F(n));
  const nl = Array.from({ length: LINE_POLES }, () => F(n));
  const bias = F(n), w1 = F(n), wS = F(n);
  const lineValid = new Uint8Array(n);
  // engine outputs
  const probUp = F(n), probDn = F(n), lastDirA = F(n), trendConf = F(n), sigA = F(n), sigAt = F(n).fill(-1), sigSide = F(n);
  const heavy = new Uint8Array(n);
  // spectrum
  const vLen = SPEC_MULT.map((m) => Math.max(2, Math.max(2, P.specPeriod) * m));
  const vAtr = vLen.map(() => F(n)), vUp = vLen.map(() => F(n)), vDn = vLen.map(() => F(n)), vLine = vLen.map(() => F(n)), vDir = vLen.map(() => F(n));
  const specZ = F(n), specEr = F(n), specMom = F(n), specHd = F(n), specHold = F(n), specLock = F(n), specLockN = F(n), specState = F(n), specHollow = F(n), specHeld = F(n);
  /** ring statistics the Spectrum used AT bar i (bars <= i-2 committed) — kept so the forming bar can be judged live */
  const ringCnt = F(n), ringMean = F(n), ringStd = F(n);
  const specValid = new Uint8Array(n);

  // ---- scratch
  const nbrCap = Math.max(8, Math.floor(P.LW / Math.max(1, P.stride)) + 4);
  const kEff = Math.max(1, Math.min(P.K, nbrCap));
  const nbrLbl = new Float64Array(nbrCap), nbrDist = new Float64Array(nbrCap), nbrBar = new Int32Array(nbrCap), order = new Int32Array(Math.max(1, Math.min(P.K, nbrCap)));
  const proj0 = F(n), proj1 = F(n), proj2 = F(n), proj3 = F(n);
  const pool = F(n), voteK = F(n), voteUpN = F(n), voteDnN = F(n);
  const nnVec = new Array<number>(NFEAT).fill(0), nnHid = new Array<number>(NN_HID).fill(0);

  const lp = Math.max(2, P.linePeriod);
  const nlAlpha = 2 / ((lp - 1) / LINE_POLES + 1 + 1);
  const preAlpha = 2 / (Math.max(2, lp * 0.25) + 1);
  const aVw = 2 / (Math.max(2, P.linePeriod) + 1), aDepth = 2 / (Math.max(2, P.depthSmooth) + 1), aRail = aDepth;
  const vpBins = new Float64Array(Math.max(8, P.vpBuckets));
  let nodePrice = 0, nodeStr = 0;

  // ---- neural engine state
  let nnWi = F(NN_HID * NFEAT), nnMi = F(NN_HID * NFEAT), nnBi = F(NN_HID), nnMbi = F(NN_HID), nnWo = F(NN_HID), nnMo = F(NN_HID);
  let nnBo = 0, nnMbo = 0, nnErrM = -1, nnErrB = -1, nnResolved = 0, nnInfl = 0, nnLastTrain = -1;
  const xorshift = (x: number) => { x = (x ^ (x << 13)) >>> 0; x = (x ^ (x >>> 17)) >>> 0; x = (x ^ (x << 5)) >>> 0; return x; };
  const resetNeural = () => {
    nnWi = F(NN_HID * NFEAT); nnMi = F(NN_HID * NFEAT); nnBi = F(NN_HID); nnMbi = F(NN_HID); nnWo = F(NN_HID); nnMo = F(NN_HID);
    nnBo = 0; nnMbo = 0;
    let x = NN_SEED >>> 0;
    for (let q = 0; q < nnWi.length; q++) { x = xorshift(x); nnWi[q] = (x / 4294967296 * 2 - 1) * 0.08; }
    for (let q = 0; q < nnWo.length; q++) { x = xorshift(x); nnWo[q] = (x / 4294967296 * 2 - 1) * 0.08; }
    nnErrM = -1; nnErrB = -1; nnResolved = 0; nnInfl = 0;
  };
  resetNeural();
  let nnResets = 0;

  const buildVector = (i: number, p: number, v: number[]) => {
    const b = i - p, bm = b - mw, bl = b - 2 * mw;
    v[0] = zRsi[b]; v[1] = zRsi[bm]; v[2] = zRsi[bl];
    v[3] = zMaDev[b]; v[4] = zMaDev[bm]; v[5] = zMaDev[bl];
    v[6] = zRsiSig[b]; v[7] = zRsiSig[bm]; v[8] = zRsiSig[bl];
    v[9] = zChop[b]; v[10] = zChop[bm]; v[11] = zChop[bl];
  };
  const squash = (v: number[]) => { for (let q = 0; q < v.length; q++) v[q] = Math.tanh(v[q] * 0.5); };
  const structuralBaseline = (x: number[]) => {
    const trend = 0.5 * x[3] + 0.35 * x[4] + 0.25 * x[5] + 0.2 * x[0] + 0.1 * x[1];
    const chop = 1 / (1 + Math.exp(-0.5 * (x[9] + x[10])));
    return Math.tanh(trend) * (1 - 0.35 * chop);
  };
  const forward = (x: number[], hid: number[]) => {
    for (let h = 0; h < NN_HID; h++) {
      let a = nnBi[h]; const b = h * NFEAT;
      for (let f = 0; f < NFEAT; f++) a += nnWi[b + f] * x[f];
      hid[h] = Math.tanh(a);
    }
    let o = nnBo;
    for (let h = 0; h < NN_HID; h++) o += nnWo[h] * hid[h];
    return Math.tanh(o);
  };
  const chop = (i: number, len: number) => {
    if (len < 2 || i < len) return 0;
    let sumTr = 0;
    for (let q = 0; q < len; q++) {
      const hi = H[i - q], lo = L[i - q], cp = i - q >= 1 ? C[i - q - 1] : C[i - q];
      sumTr += Math.max(hi - lo, Math.max(Math.abs(hi - cp), Math.abs(lo - cp)));
    }
    let hh = -Infinity, ll = Infinity;
    for (let q = 0; q < len; q++) { if (H[i - q] > hh) hh = H[i - q]; if (L[i - q] < ll) ll = L[i - q]; }
    const c1 = C[i - 1];
    const rng = Math.max(hh, c1) - Math.min(ll, c1);
    if (rng <= EPS || sumTr <= EPS) return 0;
    return 100 * Math.log10(sumTr / rng) / Math.log10(len);
  };
  const rebuildProfile = (i: number, anchor: number, a: number) => {
    nodeStr = 0; nodePrice = anchor;
    let N = Math.max(20, P.vpLookback);
    if (N > i) N = i;
    if (N < 5) return;
    let hi = -Infinity, lo = Infinity;
    for (let q = 0; q < N; q++) { if (H[i - q] > hi) hi = H[i - q]; if (L[i - q] < lo) lo = L[i - q]; }
    const rng = hi - lo;
    if (rng <= EPS) return;
    const NB = vpBins.length;
    vpBins.fill(0);
    const bw = rng / NB;
    if (bw <= EPS) return;
    let total = 0;
    for (let q = 0; q < N; q++) {
      let v = V[i - q]; if (v <= 0) v = 1;
      let b0 = Math.trunc((L[i - q] - lo) / bw), b1 = Math.trunc((H[i - q] - lo) / bw);
      b0 = b0 < 0 ? 0 : b0 > NB - 1 ? NB - 1 : b0;
      b1 = b1 < 0 ? 0 : b1 > NB - 1 ? NB - 1 : b1;
      if (b1 < b0) b1 = b0;
      const per = v / (b1 - b0 + 1);
      for (let b = b0; b <= b1; b++) vpBins[b] += per;
      total += v;
    }
    if (total <= EPS) return;
    const radius = Math.max(a * Math.max(0.1, P.nodeRadius), bw * 2);
    let c0 = Math.trunc((anchor - radius - lo) / bw), c1 = Math.trunc((anchor + radius - lo) / bw);
    c0 = c0 < 0 ? 0 : c0 > NB - 1 ? NB - 1 : c0;
    c1 = c1 < 0 ? 0 : c1 > NB - 1 ? NB - 1 : c1;
    if (c1 < c0) return;
    let best = c0, bv = -1;
    for (let b = c0; b <= c1; b++) if (vpBins[b] > bv) { bv = vpBins[b]; best = b; }
    const avg = total / NB;
    if (avg <= EPS) return;
    nodePrice = lo + (best + 0.5) * bw;
    nodeStr = clamp((bv / avg - 1) * 0.5, 0, 1);
  };

  const trainNeural = (i: number) => {
    const Hh = Math.max(2, P.horizon), fb = 1 + Hh;
    if (i - (fb + 2 * mw) < ZMINSAMPLE + 2) return;
    if (i === nnLastTrain) return;
    nnLastTrain = i;
    const aRef = Math.max(atr[i - fb] * Math.sqrt(Hh), s.tick * 4);
    const tgt = clamp((C[i - 1] - C[i - fb]) / aRef, -1, 1);
    const peN = Math.abs(tgt - nnScore[i - fb]), peB = Math.abs(tgt - nnBase[i - fb]);
    nnErrM = nnErrM < 0 ? peN : nnErrM * (1 - NN_AUDIT_A) + peN * NN_AUDIT_A;
    nnErrB = nnErrB < 0 ? peB : nnErrB * (1 - NN_AUDIT_A) + peB * NN_AUDIT_A;
    nnResolved++;
    const warm = Math.max(50, P.warm);
    if (nnResolved < warm) nnInfl = Math.min(0.30, nnResolved * 0.30 / warm);
    else {
      const skill = nnErrB > EPS ? 1 - nnErrM / nnErrB : 0;
      nnInfl = skill > 0 ? clamp(0.45 + 0.5 * skill, 0.35, 0.75) : 0.20;
    }
    buildVector(i, fb, nnVec); squash(nnVec);
    const y = forward(nnVec, nnHid);
    const e = clamp(tgt - y, -NN_ERRCLIP, NN_ERRCLIP);
    const go = e * (1 - y * y);
    const lr = clamp(P.lr, 0.0001, 0.02);
    let finite = true;
    for (let h = 0; h < NN_HID; h++) {
      const gh = go * nnWo[h] * (1 - nnHid[h] * nnHid[h]);
      const gw = go * nnHid[h];
      nnMo[h] = NN_RMSDECAY * nnMo[h] + (1 - NN_RMSDECAY) * gw * gw;
      nnWo[h] += lr * gw / Math.sqrt(nnMo[h] + NN_RMSEPS) - lr * NN_WDECAY * nnWo[h];
      const b = h * NFEAT;
      for (let f = 0; f < NFEAT; f++) {
        const g = gh * nnVec[f], idx = b + f;
        nnMi[idx] = NN_RMSDECAY * nnMi[idx] + (1 - NN_RMSDECAY) * g * g;
        nnWi[idx] += lr * g / Math.sqrt(nnMi[idx] + NN_RMSEPS) - lr * NN_WDECAY * nnWi[idx];
        if (!isFinite(nnWi[idx])) finite = false;
      }
      nnMbi[h] = NN_RMSDECAY * nnMbi[h] + (1 - NN_RMSDECAY) * gh * gh;
      nnBi[h] += lr * gh / Math.sqrt(nnMbi[h] + NN_RMSEPS);
      if (!isFinite(nnWo[h])) finite = false;
    }
    nnMbo = NN_RMSDECAY * nnMbo + (1 - NN_RMSDECAY) * go * go;
    nnBo += lr * go / Math.sqrt(nnMbo + NN_RMSEPS);
    if (!isFinite(nnBo)) finite = false;
    if (!finite) { resetNeural(); nnResets++; }
  };

  // ---- spectrum ring (participation)
  const ring = new Float64Array(SPEC_VOLWIN);
  let rPos = 0, rCnt = 0, rSum = 0, rSum2 = 0, rMean = 0, rStd = 0, pendBar = -1, pendLv = 0;
  const commit = (lv: number) => {
    if (rCnt === ring.length) { const old = ring[rPos]; rSum -= old; rSum2 -= old * old; } else rCnt++;
    ring[rPos] = lv; rSum += lv; rSum2 += lv * lv;
    rPos = (rPos + 1) % ring.length;
    rMean = rSum / rCnt;
    const varv = rSum2 / rCnt - rMean * rMean;
    rStd = varv > 0 ? Math.sqrt(varv) : 0;
  };
  const specW = Math.trunc(clamp(Math.round(clamp(P.volMinutes, 0.5, 240) / 1), 1, 20)); // 1-minute bars
  const specNeed = vLen[SPEC_VOTES - 1] + 2;
  const erN = Math.max(2, P.specPeriod);

  const lineSeedBar = 2;

  for (let i = 2; i < n; i++) {
    // ---------------- OnBarUpdate (historical, no Tick Replay)
    trainNeural(i);

    // ---------------- ComputeCheap
    const c0 = C[i], c1 = C[i - 1], h0 = H[i], l0 = L[i];
    const chg = c0 - c1, gain = chg > 0 ? chg : 0, loss = chg < 0 ? -chg : 0;
    avgGain[i] = (avgGain[i - 1] * (P.rsiP - 1) + gain) / P.rsiP;
    avgLoss[i] = (avgLoss[i - 1] * (P.rsiP - 1) + loss) / P.rsiP;
    const rs = avgLoss[i] <= EPS ? 100 : avgGain[i] / avgLoss[i];
    const rsi = avgLoss[i] <= EPS ? 100 : 100 - 100 / (1 + rs);
    rsiRaw[i] = rsi;
    { // UpdateFeatureMA: SMA (shipped Feature MA type)
      const m = Math.min(Math.max(1, P.maP), i + 1);
      let sum = 0; for (let q = 0; q < m; q++) sum += C[i - q];
      maClose[i] = sum / Math.max(1, m);
    }
    const maPrev = maClose[i - 1];
    maDevRaw[i] = Math.abs(maPrev) > EPS ? (c0 - maPrev) / maPrev : 0;
    { // SmaPrev(rsiRaw, SignalPeriod)
      const m = Math.min(P.sigP, i);
      let sum = 0; for (let q = 1; q <= m; q++) sum += rsiRaw[i - q];
      const pv = sum / Math.max(1, m);
      rsiSigRaw[i] = Math.abs(pv) > EPS ? (rsi - pv) / pv : 0;
    }
    chopRaw[i] = chop(i, P.chopP);
    { // ZStats on the four raw features (fused loops; each sum runs in the .cs order)
      const w = Math.min(P.NW, i);
      if (w < ZMINSAMPLE) { zRsi[i] = 0; zMaDev[i] = 0; zRsiSig[i] = 0; zChop[i] = 0; }
      else {
        let m0 = 0, m1 = 0, m2 = 0, m3 = 0;
        for (let q = 1; q <= w; q++) { const b = i - q; m0 += rsiRaw[b]; m1 += maDevRaw[b]; m2 += rsiSigRaw[b]; m3 += chopRaw[b]; }
        m0 /= w; m1 /= w; m2 /= w; m3 /= w;
        let v0 = 0, v1 = 0, v2 = 0, v3 = 0;
        for (let q = 1; q <= w; q++) {
          const b = i - q;
          const d0 = rsiRaw[b] - m0, d1 = maDevRaw[b] - m1, d2 = rsiSigRaw[b] - m2, d3 = chopRaw[b] - m3;
          v0 += d0 * d0; v1 += d1 * d1; v2 += d2 * d2; v3 += d3 * d3;
        }
        v0 /= w; v1 /= w; v2 /= w; v3 /= w;
        zRsi[i] = (rsiRaw[i] - m0) / Math.max(Math.sqrt(Math.max(v0, 0)), 1e-5);
        zMaDev[i] = (maDevRaw[i] - m1) / Math.max(Math.sqrt(Math.max(v1, 0)), 1e-5);
        zRsiSig[i] = (rsiSigRaw[i] - m2) / Math.max(Math.sqrt(Math.max(v2, 0)), 1e-5);
        zChop[i] = (chopRaw[i] - m3) / Math.max(Math.sqrt(Math.max(v3, 0)), 1e-5);
      }
    }
    if (i >= 2 * mw) {
      const b = i, bm = i - mw, bl = i - 2 * mw;
      proj0[i] = zRsi[b] + zMaDev[b] + 0.5 * zRsiSig[b];
      proj1[i] = (zRsi[bm] + zMaDev[bm] + 0.5 * zRsiSig[bm]) * 0.9;
      proj2[i] = (zRsi[bl] + zMaDev[bl] + 0.5 * zRsiSig[bl]) * 0.8;
      proj3[i] = (zChop[b] + 0.9 * zChop[bm] + 0.8 * zChop[bl]) * 0.8;
    }

    const tr = Math.max(h0 - l0, Math.max(Math.abs(h0 - c1), Math.abs(l0 - c1)));
    atr[i] = (atr[i - 1] * (P.atr - 1) + tr) / P.atr;
    const hl2 = (h0 + l0) / 2, upBasic = hl2 + P.factor * atr[i], dnBasic = hl2 - P.factor * atr[i];
    {
      const prevUp = upper[i - 1], prevDn = lower[i - 1], prevST = stLine[i - 1];
      lower[i] = dnBasic > prevDn || c1 < prevDn ? dnBasic : prevDn;
      upper[i] = upBasic < prevUp || c1 > prevUp ? upBasic : prevUp;
      const dir = prevST === prevUp ? (c0 > upper[i] ? -1 : 1) : c0 < lower[i] ? 1 : -1;
      stDir[i] = dir;
      stLine[i] = dir === -1 ? lower[i] : upper[i];
    }
    {
      const d0 = stDir[i];
      let tgt = -d0;
      for (let q = 1; q <= 5; q++) { if (i - q < 0) break; if (stDir[i - q] !== d0) { tgt = 0; break; } }
      target[i] = tgt;
    }

    // Neural Line + Magnet
    {
      const seed = i === lineSeedBar;
      const tp = (h0 + l0 + c0) / 3;
      if (seed) {
        vwNum[i] = tp * Math.max(0, V[i]); vwDen[i] = Math.max(0, V[i]);
        depthUp[i] = 0; depthDn[i] = 0; rail[i] = 0; mag[i] = 0;
      } else {
        vwNum[i] = vwNum[i - 1]; vwDen[i] = vwDen[i - 1];
        depthUp[i] = depthUp[i - 1]; depthDn[i] = depthDn[i - 1];
        rail[i] = rail[i - 1]; mag[i] = mag[i - 1];
      }
      let vw = tp;
      const atrNow = Math.max(atr[i], EPS);
      let vraw = V[i]; if (vraw < 0 || isNaN(vraw)) vraw = 0;
      if (!seed) {
        vwNum[i] = vwNum[i - 1] + aVw * (tp * vraw - vwNum[i - 1]);
        vwDen[i] = vwDen[i - 1] + aVw * (vraw - vwDen[i - 1]);
      }
      vw = vwDen[i] > EPS ? vwNum[i] / vwDen[i] : tp; // VolumeAnchor on
      if (!isFinite(vw)) vw = tp;
      vwS[i] = vw;
      const tcNow = seed ? 0 : sgn(bias[i - 1]);
      rebuildProfile(i, vw, atrNow);
      if (!seed) {
        const K = Math.max(2, P.touchLen);
        if (tcNow > 0) {
          let mn = Infinity;
          for (let q = 0; q < K && i - q > lineSeedBar; q++) { const d = (L[i - q] - vwS[i - q]) / atrNow; if (d < mn) mn = d; }
          if (mn < Infinity) depthUp[i] = clamp(depthUp[i - 1] + aDepth * (mn - depthUp[i - 1]), -4, 0.5);
        } else if (tcNow < 0) {
          let mx = -Infinity;
          for (let q = 0; q < K && i - q > lineSeedBar; q++) { const d = (H[i - q] - vwS[i - q]) / atrNow; if (d > mx) mx = d; }
          if (mx > -Infinity) depthDn[i] = clamp(depthDn[i - 1] + aDepth * (mx - depthDn[i - 1]), -0.5, 4);
        }
        let railTgt = tcNow > 0 ? depthUp[i] * atrNow : tcNow < 0 ? depthDn[i] * atrNow : 0;
        railTgt *= clamp(P.railStrength, 0, 2);
        let railRaw = vw + railTgt;
        if (nodeStr > EPS && P.nodePull > 0 && tcNow !== 0) railRaw += clamp(P.nodePull, 0, 1) * nodeStr * (nodePrice - railRaw);
        const railVal = rail[i - 1] + aRail * ((railRaw - vw) - rail[i - 1]);
        if (isFinite(railVal)) rail[i] = railVal;
        mag[i] = mag[i - 1] + aDepth * (clamp(nodeStr, 0, 1) - mag[i - 1]);
      }

      let baseScore = 0, nnOut = 0;
      if (i - 2 * mw >= ZMINSAMPLE) {
        buildVector(i, 0, nnVec); squash(nnVec);
        baseScore = structuralBaseline(nnVec);
        nnOut = forward(nnVec, nnHid);
      }
      nnBase[i] = baseScore; nnScore[i] = nnOut;
      const combined = clamp(nnOut * nnInfl + baseScore * (1 - nnInfl), -1, 1);
      nnSm[i] = seed ? 0 : nnSm[i - 1] + NN_SMOOTH_A * (combined - nnSm[i - 1]);
      const shift = seed ? 0 : -clamp(P.neuralShift, 0, 2) * atrNow * nnSm[i - 1];
      let anchor = vw + rail[i] + shift;
      if (!isFinite(anchor)) anchor = c0;
      let src = anchor;
      const poles = Math.max(0, Math.min(PRE, P.waveSmooth));
      for (let q = 0; q < poles; q++) { pre[q][i] = seed ? anchor : pre[q][i - 1] + preAlpha * (src - pre[q][i - 1]); src = pre[q][i]; }
      if (seed) for (let j = 0; j < LINE_POLES; j++) nl[j][i] = anchor;
      else {
        nl[0][i] = nl[0][i - 1] + nlAlpha * (src - nl[0][i - 1]);
        for (let j = 1; j < LINE_POLES; j++) nl[j][i] = nl[j][i - 1] + nlAlpha * (nl[j - 1][i] - nl[j][i - 1]);
      }
      const lineV = nl[LINE_POLES - 1][i];
      const hbuf = clamp(P.flipBuf, 0, 2) * atrNow;
      const bPrev = seed ? 0 : bias[i - 1];
      bias[i] = c0 > lineV + hbuf ? 1 : c0 < lineV - hbuf ? -1 : bPrev;
      lineValid[i] = 1;
    }

    // ---------------- ComputeSpectrum
    if (i < specNeed) {
      for (let j = 0; j < SPEC_VOTES; j++) { vAtr[j][i] = H[i] - L[i]; vUp[j][i] = H[i]; vDn[j][i] = L[i]; vDir[j][i] = 1; vLine[j][i] = H[i]; }
    } else {
      const seed = i === specNeed;
      ringCnt[i] = rCnt; ringMean[i] = rMean; ringStd[i] = rStd;
      let vs = 0;
      for (let q = 0; q < specW; q++) { if (i - q < 0) break; const vv = V[i - q]; if (vv > 0 && !isNaN(vv)) vs += vv; }
      const lv = Math.log(Math.max(vs, 1));
      const prev: SpecPrev | null = seed ? null : prevSpec(i - 1);
      const r = specStep(i, O[i], H[i], L[i], C[i], lv, prev, rCnt, rMean, rStd);
      for (let j = 0; j < SPEC_VOTES; j++) { vAtr[j][i] = r.vAtr[j]; vUp[j][i] = r.vUp[j]; vDn[j][i] = r.vDn[j]; vLine[j][i] = r.vLine[j]; vDir[j][i] = r.vDir[j]; }
      specZ[i] = r.z; specEr[i] = r.er; specMom[i] = r.mom; specHd[i] = r.hd; specHold[i] = r.hold;
      specLock[i] = r.lock; specLockN[i] = r.lockN; specState[i] = r.state; specHeld[i] = r.held; specHollow[i] = r.hollow;
      specValid[i] = 1;
      if (pendBar >= 0 && i > pendBar) { commit(pendLv); pendBar = -1; }
      pendBar = i; pendLv = lv;
    }

    // ---------------- ComputeHeavy (off = 0)
    const needZ = Math.ceil(mw * ((kEff + 2) - 2 * ZWIN_RATIO) / (1 - ZWIN_RATIO));
    let need = Math.max((kEff + 3) * mw, needZ);
    if (need < ZMINSAMPLE + 2) need = ZMINSAMPLE + 2;
    if (i >= need) {
      heavy[i] = 1;
      // Fixed projection of bar b's feature vector depends on bar b alone, so it is
      // computed once per bar (proj*) — the same arithmetic as ProjectFixed/FixedBlend.
      const zQuery = Math.min(P.NW, Math.max(0, i - 2 * mw));
      const zFloor = Math.max(ZMINSAMPLE, Math.ceil(ZWIN_RATIO * zQuery));
      let m = 0;
      for (let q = mw; q <= P.LW + mw; q += mw) {
        const aDeep = i - (q + 2 * mw);
        if (aDeep < 0) break;
        if (Math.min(P.NW, aDeep) < zFloor) break;
        const lbl = target[i - q];
        if (lbl === 0) continue;
        if (m >= nbrCap) break;
        nbrBar[m] = i - q;
        nbrLbl[m] = lbl;
        m++;
      }
      let pu = 0, pd = 0;
      if (m >= kEff) {
        // Minkowski p = 2 on the 4 projected components (Math.Pow(d, 2), Math.Pow(s, 1/2))
        const q0 = proj0[i], q1 = proj1[i], q2 = proj2[i], q3 = proj3[i];
        for (let j = 0; j < m; j++) {
          const b = nbrBar[j];
          const d0 = q0 - proj0[b], d1 = q1 - proj1[b], d2 = q2 - proj2[b], d3 = q3 - proj3[b];
          nbrDist[j] = Math.sqrt(d0 * d0 + d1 * d1 + d2 * d2 + d3 * d3);
        }
        // the kEff nearest in ascending distance (all the vote and sigma read)
        let top = 0;
        for (let j = 0; j < m; j++) {
          const dj = nbrDist[j];
          if (top === kEff && dj >= nbrDist[order[top - 1]]) continue;
          let pos = top < kEff ? top++ : kEff - 1;
          while (pos > 0 && nbrDist[order[pos - 1]] > dj) { order[pos] = order[pos - 1]; pos--; }
          order[pos] = j;
        }
        const sigK = nbrDist[order[Math.min(Math.floor(kEff / 2), m - 1)]];
        const dFar = nbrDist[order[Math.min(kEff - 1, m - 1)]];
        const sigma = Math.max(sigK, Math.max(SIGMA_REL_FLOOR * dFar, 1e-4));
        let twoSigW = 2 * Math.pow(sigma, P.shapeW);
        if (!(twoSigW > 1e-300)) twoSigW = 1e-300;
        let sU = 0, sD = 0, sT = 0, cU = 0, cD = 0;
        for (let j = 0; j < kEff; j++) {
          const idx = order[j];
          const wgt = Math.exp(-Math.pow(nbrDist[idx], P.shapeW) / twoSigW);
          if (nbrLbl[idx] > 0) { sU += wgt; cU++; } else if (nbrLbl[idx] < 0) { sD += wgt; cD++; }
          sT += wgt;
        }
        if (sT > 0) { pu = sU / sT; pd = sD / sT; }
        else if (cU + cD > 0) { pu = cU / (cU + cD); pd = cD / (cU + cD); }
        voteK[i] = kEff; voteUpN[i] = cU; voteDnN[i] = cD;
      }
      pool[i] = m;
      probUp[i] = pu; probDn[i] = pd;
      const thr = P.thr;
      const rawLong = pu > thr && probUp[i - 1] <= thr;
      const rawShort = pd > thr && probDn[i - 1] <= thr;
      let lastDir = lastDirA[i - 1];
      if (rawLong && lastDir <= 0) lastDir = 1;
      if (rawShort && lastDir >= 0) lastDir = -1;
      lastDirA[i] = lastDir;
      let tc = trendConf[i - 1];
      const dir = stDir[i], dirPrev = stDir[i - 1];
      if (dir !== dirPrev || rawLong || rawShort) {
        if (dir < 0 && lastDir === 1 && pu > thr) tc = 1;
        if (dir > 0 && lastDir === -1 && pd > thr) tc = -1;
      }
      trendConf[i] = tc;
      const tcPrv = trendConf[i - 1];
      const evUp = tc > 0 && tcPrv <= 0, evDn = tc < 0 && tcPrv >= 0;
      const b = P.requireLine ? bias[i] : 0;
      let ev = 0;
      if (evUp && b >= 0) ev = 1;
      if (evDn && b <= 0) ev = -1;
      const lastSide = sigSide[i - 1];
      if (P.alternate && ev !== 0 && ev === lastSide) ev = 0;
      const lastAt = sigAt[i - 1];
      const cand = ev;
      if (ev !== 0 && lastAt >= 0 && i - lastAt < Math.max(0, P.dwell)) ev = 0;
      sigA[i] = ev;
      sigAt[i] = cand !== 0 ? i : lastAt;
      sigSide[i] = ev !== 0 ? ev : lastSide;
    }

    // ---------------- UpdateLineWeight(0)
    if (i === lineSeedBar) { w1[i] = 0.5; wS[i] = 0.5; }
    else {
      const lineV = nl[LINE_POLES - 1][i];
      const a = Math.max(atr[i], EPS);
      let dist = Math.abs(C[i] - lineV) / Math.max(EPS, P.blendBand * a);
      if (dist > 1) dist = 1;
      let conv = dist * dist * (3 - 2 * dist);
      const mg = P.magnet > 0 ? clamp(mag[i], 0, 1) : 0;
      const mi = clamp(P.magnet, 0, 1);
      conv *= (1 - mi) + mi * mg;
      const pol = sgn(bias[i]);
      let wRaw = 0.5 + 0.5 * pol * conv;
      wRaw = clamp(wRaw, 0, 1);
      const kk = 2 / (Math.max(1, P.blendSmooth) + 1);
      w1[i] = w1[i - 1] + kk * (wRaw - w1[i - 1]);
      wS[i] = wS[i - 1] + kk * (w1[i] - wS[i - 1]);
    }
  }

  function prevSpec(j: number): SpecPrev {
    return {
      vAtr: vAtr.map((a) => a[j]), vUp: vUp.map((a) => a[j]), vDn: vDn.map((a) => a[j]), vLine: vLine.map((a) => a[j]),
      z: specZ[j], er: specEr[j], mom: specMom[j], hd: specHd[j], hold: specHold[j], lock: specLock[j], lockN: specLockN[j], state: specState[j], held: specHeld[j],
    };
  }

  /** ComputeSpectrum for bar i from bar i-1's state (prev null = the seed bar) */
  function specStep(i: number, o0: number, h0: number, l0: number, c0: number, lv: number, prev: SpecPrev | null, cnt: number, mean: number, std: number) {
    const seed = prev === null;
    const c1 = C[i - 1];
    const hl2 = (h0 + l0) / 2;
    const tr = Math.max(h0 - l0, Math.max(Math.abs(h0 - c1), Math.abs(l0 - c1)));
    let up = 0, dn = 0;
    const oA: number[] = [], oU: number[] = [], oD: number[] = [], oL: number[] = [], oDir: number[] = [];
    for (let j = 0; j < SPEC_VOTES; j++) {
      const nn = vLen[j];
      const a = seed ? tr : (prev!.vAtr[j] * (nn - 1) + tr) / nn;
      const ub = hl2 + 2 * a, db = hl2 - 2 * a;
      let U: number, D: number, Dir: number, Ln: number;
      if (seed) { U = ub; D = db; Dir = 1; Ln = ub; }
      else {
        const pU = prev!.vUp[j], pL = prev!.vDn[j], pST = prev!.vLine[j];
        D = db > pL || c1 < pL ? db : pL;
        U = ub < pU || c1 > pU ? ub : pU;
        Dir = pST === pU ? (c0 > U ? -1 : 1) : c0 < D ? 1 : -1;
        Ln = Dir === -1 ? D : U;
      }
      oA.push(a); oU.push(U); oD.push(D); oL.push(Ln); oDir.push(Dir);
      if (Dir < 0) up++; else dn++;
    }
    const volUsable = cnt >= 30 && std > 1e-9;
    const zRaw = volUsable ? (lv - mean) / std : 0;
    const z = seed ? zRaw : prev!.z + (2 / 5) * (zRaw - prev!.z);
    let tail = 0;
    for (let q = 1; q < erN; q++) tail += Math.abs(C[i - q] - C[i - q - 1]);
    const gross = Math.abs(c0 - c1) + tail;
    const erRaw = gross > EPS ? Math.abs(c0 - C[i - erN]) / gross : 0;
    const atrPrev = Math.max(atr[i - 1], EPS);
    const momRaw = Math.abs(c0 - C[i - erN]) / (atrPrev * Math.sqrt(erN));
    const smA = 2 / 6;
    const er = seed ? erRaw : prev!.er + smA * (erRaw - prev!.er);
    const mom = seed ? momRaw : prev!.mom + smA * (momRaw - prev!.mom);
    const sE = clamp((er - 0.2) / 0.4, 0, 1);
    const sM = sig(mom, 3, 0.55);
    const sP = volUsable ? sig(z, 1.2, 0) : 1;
    let str = Math.pow(Math.max(sE, 1e-9) * Math.max(sM, 1e-9) * Math.max(sP, 1e-9), 1 / 3);
    if (!isFinite(str)) str = 0;
    const body = c0 - o0, bsgn = sgn(body), rngB = Math.max(h0 - l0, EPS);
    let push = sig(Math.abs(body) / atrPrev, 2, 0.85)
      * clamp((Math.abs(body) / rngB - 0.4) / 0.35, 0, 1)
      * clamp((Math.abs((2 * c0 - h0 - l0) / rngB) - 0.2) / 0.5, 0, 1)
      * (volUsable ? sig(z, 1.6, P.igniteVol) : 1);
    if (!isFinite(push)) push = 0;
    const k = SPEC_VOTES;
    const align = up === k ? 1 : dn === k ? -1 : 0;
    const near = up === k - 1 ? 1 : dn === k - 1 ? -1 : 0;
    const side = align !== 0 ? align : near;
    let hd = seed ? 0 : prev!.hd, hb = seed ? 0 : prev!.hold;
    let lkS = seed ? 0 : prev!.lock, lkN = seed ? 0 : prev!.lockN;
    if (hd !== 0 && (align !== hd || hb <= 0)) { hd = 0; hb = 0; }
    const lockedOut = lkN > 0 && align === lkS;
    let ignited = false;
    if (align !== 0 && bsgn === align && push >= P.ignite && !lockedOut) { hd = align; hb = P.brightHold; ignited = true; }
    else if (hd !== 0) hb--;
    let s2 = hd !== 0 ? 2 * hd : side !== 0 && str >= P.chopFloor ? side : 0;
    const pv = seed ? 0 : prev!.state, held0 = seed ? 0 : prev!.held;
    let dwellHeld = false;
    if (s2 !== pv && pv !== 0 && held0 < P.specDwell && Math.abs(s2) < Math.abs(pv)) { s2 = pv; dwellHeld = true; }
    const held = s2 === pv ? held0 + 1 : 1;
    let counter = false;
    if (Math.abs(s2) === 2 && bsgn !== 0 && bsgn !== Math.sign(s2) && Math.abs(body) / atrPrev >= P.counterTol) { s2 = Math.sign(s2); counter = true; }
    if (Math.abs(s2) === 2) { lkS = -Math.sign(s2); lkN = P.brightCool; } else if (lkN > 0) lkN--;
    const disp = Math.abs(body) / atrPrev, bodyF = Math.abs(body) / rngB, clv = (2 * c0 - h0 - l0) / rngB;
    const shape = clamp((bodyF - 0.45) / 0.35, 0, 1) * clamp((Math.abs(clv) - 0.25) / 0.45, 0, 1);
    let hollow = 0;
    if (P.showHollow && volUsable && bsgn !== 0 && disp >= 1.8 && shape >= 0.35 && z <= 0) hollow = bsgn;
    return { vAtr: oA, vUp: oU, vDn: oD, vLine: oL, vDir: oDir, z, er, mom, hd, hold: hb, lock: lkS, lockN: lkN, state: s2, held, hollow,
      up, dn, str, push, ignited, dwellHeld, counter, volUsable };
  }

  /** the Spectrum judged on a FORMING bar (OnEachTick), from bar i-1's closed state */
  const specLive = (i: number, o: number, h: number, l: number, c: number, vol: number) => {
    if (i < specNeed || i >= n) return null;
    if (i > specNeed && !specValid[i - 1]) return null;
    let vs = vol > 0 ? vol : 0;
    for (let q = 1; q < specW; q++) { if (i - q < 0) break; const vv = V[i - q]; if (vv > 0) vs += vv; }
    const lv = Math.log(Math.max(vs, 1));
    return specStep(i, o, h, l, c, lv, i === specNeed ? null : prevSpec(i - 1), ringCnt[i], ringMean[i], ringStd[i]);
  };

  return {
    n, stDir, stLine, atr, target, probUp, probDn, lastDir: lastDirA, trendConf, sig: sigA, sigAt, sigSide, heavy,
    nl: nl[LINE_POLES - 1], bias, wS, lineValid, vw: vwS, rail, nnSm,
    specState, specHollow, specValid, specZ, specEr, specMom, vDir, specHd, specLockN,
    specStep, specLive, nnResets, kEff, pool, voteK, voteUpN, voteDnN,
  };
}
