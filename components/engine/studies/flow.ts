import type { Draw, ReadItem, StudyDef, StudyEvent } from "../types";
import { ATR, hhmm } from "../ta";

/**
 * DS Flow — web edition. Source: DSFlow.cs (Build 2026-09-30, v1.4), shipped
 * defaults (ApplyDefaults):
 *   Group candles 5 · Session volume profile OFF · Max profile rows 30 ·
 *   Lower timeframe 1 Minute · Volume fallback ON · Show data badge OFF ·
 *   Profile rows All · Price bars OverProfile · Profile opacity 100 ·
 *   Split buy/sell ON · Dim candle by volume ON · Mask behind OFF ·
 *   Summary box ON · Label font 11 · Show numbers ON · Profile max width 110 px ·
 *   Node highlighting HeavyAndFight · Node sensitivity 2.0 sigma (FIGHT = 3.0) ·
 *   Grouped candle ON (wick 3 px, body 16 px) · Signals ON, Require sweep ON,
 *   Sweep lookback 3 groups, Acceptance zone 35 %, Signal anatomy ON ·
 *   Bull #30F0A8 · Bear #A33DFF · Fight / anatomy (255,225,45).
 *
 * What is ported, line for line:
 *   · Flow per bar (flowByBar). A bar the tick database covers is built the way
 *     the tool's LIVE engine (OnMarketData) builds it: every trade at its own
 *     price, at-ask volume = buy, at-bid volume = sell — our footprint is exactly
 *     that split. A bar with no tick data gets the tool's HISTORICAL path for the
 *     default 1-Minute lower series: the bar's volume spread evenly over every
 *     tick from low to high, split by where it closed in its range
 *     (buyFrac = (close - low) / range, 0.5 on a one-price bar).
 *   · ComputeAgg: rows = clamp(round(range / (ATR(14) / 10)), 1, 30), equal
 *     slices of the group's high-low; POC = first heaviest row; row mean and
 *     population sigma over non-empty rows; the Volume-fallback estimate.
 *   · DrawProfileRows: backdrop to boxRight, faint heat track (bear at the top,
 *     bull at the bottom, Visible() floor 135), buy-then-sell split bars at
 *     alpha 195 + 55 t, HVN outline (>= 2 sigma), yellow FIGHT border (>= 3 sigma
 *     and the thinner side >= 35 % of the thicker).
 *   · Price bars OverProfile: the chart's candles over the profile with the
 *     one-pixel background keyline (drawn here as the keyline; the engine paints
 *     the candles themselves on top of it).
 *   · DrawCustomCandle (glass candle on the group's first bar, dimmed by volume
 *     against a 250-bar EMA of volume x 1.1), signal anatomy (dashed acceptance
 *     box, yellow POC row, dotted swept-liquidity line back to the bar that
 *     printed the extreme), the arrows (▲ under the low / ▼ over the high,
 *     1.6x ghost + solid), the buy | sell number column at boxRight - 46 with
 *     the row-height auto-hide (row >= font + 1 px), the summary box text
 *     "Σ: … / B: … (…%) / S: … (…%)", FormatVol (K / M with up to 3 decimals).
 *   · EvaluateSignal on closed groups only: sweep of the last 3 groups' extreme
 *     and close back inside, delta flipping sign against the previous group,
 *     POC in the close-side 35 % with the new side out-trading the old there.
 *   · Developing-group runway (number column anchored to the projected end).
 *
 * DEVIATIONS
 *   1. Tick data vs history: bars with real order flow are treated as live-built
 *      (the chart open through the session); bars without it use the tool's own
 *      1-Minute lower-timeframe history fill. On NinjaTrader the same bars would
 *      be one or the other depending on when the chart was loaded.
 *   2. The forming bar: NinjaTrader adds each trade of the forming candle to the
 *      developing group as it prints. The replay has only the forming candle's
 *      price path, not its trades, so the developing group is built from its
 *      CLOSED candles (its range and totals catch up at each close). Its ATR is
 *      read on the last closed bar.
 *   3. Group grid: NinjaTrader counts groups of 5 from the first loaded bar, so
 *      where the grid falls depends on Days to load. The replay anchors the grid
 *      so 09:31 opens a group (one possible Days-to-load setting).
 *   4. Summary box: the tool needs a group 120 px wide; five candles on the web
 *      chart never span that (4–11 px a bar), so the web edition draws the box
 *      for the NEWEST group (where the clearance runway gives it room) and for
 *      any group that does reach 120 px. Toggle: "Totals". A box that would run
 *      under the price axis slides left just enough to stay whole, and the price
 *      scale keeps room under the newest group for it.
 *   4b. Text is the house mono face (the tool prints Arial Bold 11).
 *   5. Flow pruning (flow older than 5,000 bars dropped) is not modelled; the
 *      replay keeps flow for every loaded bar.
 *   6. Session volume profile is OFF as shipped, so the session clock is not
 *      ported. Light theme: the tool's own Light mode chrome is used (darker
 *      numbers x0.6, light backdrop and summary box, dark HVN outline).
 *   7. Example hygiene (web showcase): the status line's "Last arrow" ignores an
 *      arrow printed before the first shown bar (s.replayFrom), so it never
 *      reports warm-up history. Display only; signals and computation unchanged.
 *
 * Events: the tool marks two things on a closed group — an arrow (BUY ▲ /
 * SELL ▼, weight 3) and a FIGHT node (yellow border, weight 2). Every arrow is
 * an event; FIGHT nodes are events in the RTH replay (one per group, its
 * heaviest fight row). HVN outlines are far more common and are left to the
 * chart and the readout.
 */

const G = 5;                // GroupCandles
const MAX_ROWS = 30;        // MaxProfileBoxes
const HVN = 2.0;            // HvnThreshold
const FIGHT_SIG = HVN + 1;  // FightSigma
const PROFILE_MAX_W = 110;  // ProfileMaxWidth
const FONT = 11;            // LabelFontSize
const LIVE_CLEAR = 3;       // LiveRunwayClearance
const SWEEP_LOOK = 3;       // SignalSweepLookback
const ZONE = 0.35;          // SignalZonePct / 100
const VOL_K = 2 / (250 + 1);

type RGB = [number, number, number];
const BULL: RGB = [48, 240, 168];
const BEAR: RGB = [163, 61, 255];
const FIGHT: RGB = [255, 225, 45];
const rgba = (c: RGB | number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${+(a / 255).toFixed(4)})`;

const lerp = (a: RGB, b: RGB, t: number): RGB => {
  t = Math.max(0, Math.min(1, t));
  return [Math.trunc(a[0] + (b[0] - a[0]) * t), Math.trunc(a[1] + (b[1] - a[1]) * t), Math.trunc(a[2] + (b[2] - a[2]) * t)];
};
const HEAT_LO = BEAR, HEAT_HI = BULL;
const HEAT_MID: RGB = [Math.trunc((BEAR[0] + BULL[0]) / 2), Math.trunc((BEAR[1] + BULL[1]) / 2), Math.trunc((BEAR[2] + BULL[2]) / 2)];
const resolve = (t: number) => (t < 0.5 ? lerp(HEAT_LO, HEAT_MID, t / 0.5) : lerp(HEAT_MID, HEAT_HI, (t - 0.5) / 0.5));
function visible(c: RGB, floor: number): RGB {
  const m = Math.max(c[0], c[1], c[2]);
  if (m >= floor) return c;
  if (m === 0) return [floor, floor, floor];
  const k = floor / m;
  return [Math.min(255, Math.trunc(c[0] * k)), Math.min(255, Math.trunc(c[1] * k)), Math.min(255, Math.trunc(c[2] * k))];
}

// C# Math.Round (banker's) and ToString("0.###") (half away from zero)
const roundEven = (v: number) => {
  const f = Math.floor(v), r = v - f;
  if (Math.abs(r - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(v);
};
const trim3 = (v: number) => {
  const s = (Math.round(v * 1000 + 1e-9) / 1000).toFixed(3);
  return s.replace(/\.?0+$/, "");
};
export function formatVol(v: number) {
  if (v >= 1_000_000) return trim3(v / 1_000_000) + "M";
  if (v >= 1000) return trim3(v / 1000) + "K";
  return String(roundEven(v));
}
const pct = (v: number) => v.toFixed(2);
const fmtP = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (v: number) => Math.round(v).toLocaleString("en-US");

type Agg = {
  gs: number; ge: number;
  binBuy: Float64Array; binSell: Float64Array;
  maxBinVol: number; totalBuy: number; totalSell: number; totalVol: number;
  binMean: number; binSd: number;
  groupHigh: number; groupLow: number; groupOpen: number; groupClose: number;
  boxHeight: number; boxCount: number; pocBin: number; estimated: boolean;
};
type Sig = { dir: number; pocBin: number; zoneLo: number; zoneHi: number; sweptLevel: number; sweepBarIdx: number; dNow: number; dPrev: number; lookHi: number; lookLo: number };

export const study: StudyDef = {
  slug: "flow", rightMargin: 130,
  name: "DS Flow",
  about: "Every five candles x-rayed into a volume-by-price profile: buying vs selling at each price, heavy and FIGHT nodes, the grouped candle and the reversal arrows.",
  needs: { flow: true },
  layers: [
    { id: "nums", label: "Ladder (numbers)", on: true, hint: "Each row's buy | sell volume. As in NinjaTrader, numbers print only where a row is at least 12 px tall — zoom in to read them." },
    { id: "totals", label: "Totals", on: true, hint: "The Σ / B / S summary box. Drawn for the newest group (and any group wide enough for it)." },
    { id: "gcandle", label: "Grouped candle", on: true, hint: "The glass candle that sums up each group of five, dimmed when the group traded below its expected volume." },
  ],
  run(s) {
    const n = s.n, tick = s.tick;
    const off = ((s.replayFrom % G) + G) % G;
    const gStart = (i: number) => (i < off ? 0 : off + Math.floor((i - off) / G) * G);
    const gEnd = (gs: number) => (gs === 0 && off > 0 ? off - 1 : gs + G - 1);

    // ---- flowByBar: per bar, lowest tick key and buy/sell per tick
    const fLo = new Int32Array(n);
    const fBuy: Float64Array[] = new Array(n);
    const fSell: Float64Array[] = new Array(n);
    const measured = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const bid = s.fp.bid[i], ask = s.fp.ask[i];
      if (s.buy[i] >= 0 && bid && bid.length > 0) {
        measured[i] = 1;
        fLo[i] = s.fp.lo[i];
        const m = bid.length, b = new Float64Array(m), se = new Float64Array(m);
        for (let j = 0; j < m; j++) { b[j] = ask[j]; se[j] = bid[j]; }
        fBuy[i] = b; fSell[i] = se;
        continue;
      }
      const vol = s.v[i];
      if (!(vol > 0)) { fLo[i] = 0; fBuy[i] = new Float64Array(0); fSell[i] = new Float64Array(0); continue; }
      let subHigh = s.h[i], subLow = s.l[i];
      const subClose = s.c[i];
      let kLo = Math.round(subLow / tick), kHi = Math.round(subHigh / tick);
      if (kHi < kLo) { const t = kHi; kHi = kLo; kLo = t; }
      if (kHi - kLo >= 2000) { kLo = kHi = Math.round(subClose / tick); subLow = subHigh = subClose; }
      const cnt = kHi - kLo + 1, per = vol / cnt, range = subHigh - subLow;
      let bf = range > 0 ? (subClose - subLow) / range : 0.5;
      bf = Math.max(0, Math.min(1, bf));
      const b = new Float64Array(cnt), se = new Float64Array(cnt);
      for (let j = 0; j < cnt; j++) { b[j] = per * bf; se[j] = per * (1 - bf); }
      fLo[i] = kLo; fBuy[i] = b; fSell[i] = se;
    }

    // ---- primary-series state: ATR(14), volume EMA(250)
    const atr = ATR(s, 14);
    const volAvg = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const v = s.v[i], prev = i > 0 ? volAvg[i - 1] : 0;
      volAvg[i] = prev <= 0 ? v : prev + VOL_K * (v - prev);
    }

    function computeAgg(gs: number, ge: number, atrIdx: number): Agg | null {
      if (gs < 0) gs = 0;
      if (ge > n - 1) ge = n - 1;
      if (ge < gs) return null;
      let groupHigh = -Infinity, groupLow = Infinity;
      for (let i = gs; i <= ge; i++) { if (s.h[i] > groupHigh) groupHigh = s.h[i]; if (s.l[i] < groupLow) groupLow = s.l[i]; }
      const groupOpen = s.o[gs], groupClose = s.c[ge];
      const priceRange = groupHigh - groupLow;
      let atrVal = atr[atrIdx];
      if (!isFinite(atrVal) || atrVal < 0) atrVal = 0;
      const atrCount = priceRange <= 0 || atrVal <= 0 ? MAX_ROWS : Math.round(priceRange / (atrVal / 10));
      const boxCount = Math.max(1, Math.min(MAX_ROWS, atrCount));
      const boxHeight = priceRange > 0 ? priceRange / boxCount : tick;
      const binBuy = new Float64Array(boxCount), binSell = new Float64Array(boxCount);
      let totalBuy = 0, totalSell = 0;
      for (let i = gs; i <= ge; i++) {
        const lo = fLo[i], bb = fBuy[i], ss = fSell[i];
        for (let j = 0; j < bb.length; j++) {
          if (bb[j] === 0 && ss[j] === 0) continue;
          const price = (lo + j) * tick;
          let b = priceRange <= 0 ? 0 : Math.floor((price - groupLow) / boxHeight);
          if (b < 0) b = 0; if (b > boxCount - 1) b = boxCount - 1;
          binBuy[b] += bb[j]; binSell[b] += ss[j];
          totalBuy += bb[j]; totalSell += ss[j];
        }
      }
      let maxBinVol = 0;
      for (let b = 0; b < boxCount; b++) maxBinVol = Math.max(maxBinVol, binBuy[b] + binSell[b]);
      let totalVol = totalBuy + totalSell;
      let estimated = false;
      if (totalVol <= 0 || maxBinVol <= 0) {
        estimated = true;
        for (let i = gs; i <= ge; i++) {
          const bv = s.v[i];
          if (bv <= 0) continue;
          const up = s.c[i] >= s.o[i];
          const typical = (s.h[i] + s.l[i] + s.c[i]) / 3;
          let tb = priceRange <= 0 ? 0 : Math.floor((typical - groupLow) / boxHeight);
          if (tb < 0) tb = 0; if (tb > boxCount - 1) tb = boxCount - 1;
          if (up) { binBuy[tb] += bv; totalBuy += bv; } else { binSell[tb] += bv; totalSell += bv; }
          maxBinVol = Math.max(maxBinVol, binBuy[tb] + binSell[tb]);
        }
        totalVol = totalBuy + totalSell;
      }
      if (totalVol <= 0 || maxBinVol <= 0) return null;
      let binSum = 0, binCnt = 0;
      for (let b = 0; b < boxCount; b++) { const tt = binBuy[b] + binSell[b]; if (tt > 0) { binSum += tt; binCnt++; } }
      const binMean = binCnt > 0 ? binSum / binCnt : 0;
      let binVar = 0;
      for (let b = 0; b < boxCount; b++) { const tt = binBuy[b] + binSell[b]; if (tt > 0) { const d = tt - binMean; binVar += d * d; } }
      const binSd = binCnt > 1 ? Math.sqrt(binVar / binCnt) : 0;
      let pocBin = 0, pocVol = -1;
      for (let b = 0; b < boxCount; b++) { const tt = binBuy[b] + binSell[b]; if (tt > pocVol) { pocVol = tt; pocBin = b; } }
      return { gs, ge, binBuy, binSell, maxBinVol, totalBuy, totalSell, totalVol, binMean, binSd, groupHigh, groupLow, groupOpen, groupClose, boxHeight, boxCount, pocBin, estimated };
    }

    // ---- closed groups (precomputed), keyed by group start
    const closed = new Map<number, Agg | null>();
    const closedAgg = (gs: number) => {
      if (closed.has(gs)) return closed.get(gs)!;
      const ge = gEnd(gs);
      const a = ge <= n - 1 ? computeAgg(gs, ge, ge) : null;
      closed.set(gs, a);
      return a;
    };
    const fightRows = (a: Agg) => {
      const rows: number[] = [];
      if (a.estimated || a.binSd <= 0) return rows;
      for (let b = 0; b < a.boxCount; b++) {
        const vol = a.binBuy[b] + a.binSell[b];
        if (vol <= 0) continue;
        const lo = Math.min(a.binBuy[b], a.binSell[b]), hi = Math.max(a.binBuy[b], a.binSell[b]);
        if (vol - a.binMean >= FIGHT_SIG * a.binSd && hi > 0 && lo / hi >= 0.35) rows.push(b);
      }
      return rows;
    };

    function evaluateSignal(gs: number, a: Agg): Sig | null {
      if (a.boxCount < 3 || a.groupHigh <= a.groupLow) return null;
      const prevGe = gs - 1;
      if (prevGe < 0) return null;
      const prevGs = gStart(prevGe);
      if (prevGs < 0) return null;
      const p = closedAgg(prevGs);
      if (!p || p.estimated) return null;
      let lookGs = prevGs;
      for (let q = 1; q < Math.max(1, SWEEP_LOOK); q++) {
        const pe = lookGs - 1;
        if (pe < 0) break;
        lookGs = gStart(pe);
      }
      let lookHi = -Infinity, lookLo = Infinity, hiIdx = prevGe, loIdx = prevGe;
      for (let i = lookGs; i <= prevGe; i++) {
        if (s.h[i] > lookHi) { lookHi = s.h[i]; hiIdx = i; }
        if (s.l[i] < lookLo) { lookLo = s.l[i]; loIdx = i; }
      }
      if (lookHi === -Infinity) return null;
      const dNow = a.totalBuy - a.totalSell, dPrev = p.totalBuy - p.totalSell;
      const range = a.groupHigh - a.groupLow;
      let poc = 0, pv = -1;
      for (let b = 0; b < a.boxCount; b++) { const tv = a.binBuy[b] + a.binSell[b]; if (tv > pv) { pv = tv; poc = b; } }
      const pocMid = a.groupLow + (poc + 0.5) * a.boxHeight;
      const sweepSell = a.groupHigh > lookHi && a.groupClose < lookHi;
      if (sweepSell && dPrev > 0 && dNow < 0) {
        const zHi = a.groupLow + range * ZONE;
        if (pocMid <= zHi) {
          let zb = 0, zs = 0;
          for (let b = 0; b < a.boxCount; b++) if (a.groupLow + (b + 0.5) * a.boxHeight <= zHi) { zb += a.binBuy[b]; zs += a.binSell[b]; }
          if (zs > zb) return { dir: -1, pocBin: poc, zoneLo: a.groupLow, zoneHi: zHi, sweptLevel: lookHi, sweepBarIdx: hiIdx, dNow, dPrev, lookHi, lookLo };
        }
      }
      const sweepBuy = a.groupLow < lookLo && a.groupClose > lookLo;
      if (sweepBuy && dPrev < 0 && dNow > 0) {
        const zLo = a.groupHigh - range * ZONE;
        if (pocMid >= zLo) {
          let zb = 0, zs = 0;
          for (let b = 0; b < a.boxCount; b++) if (a.groupLow + (b + 0.5) * a.boxHeight >= zLo) { zb += a.binBuy[b]; zs += a.binSell[b]; }
          if (zb > zs) return { dir: 1, pocBin: poc, zoneLo: zLo, zoneHi: a.groupHigh, sweptLevel: lookLo, sweepBarIdx: loIdx, dNow, dPrev, lookHi, lookLo };
        }
      }
      return null;
    }

    // ---- walk every closed group once: signals + events
    const sigs = new Map<number, Sig>();          // gs -> signal (stamped at ge)
    const sigList: { i: number; gs: number; dir: number }[] = [];
    const events: StudyEvent[] = [];
    const rowSpan = (a: Agg, b: number) => [a.groupLow + b * a.boxHeight, a.groupLow + (b + 1) * a.boxHeight];
    // group span as the tool's clock shows it: first bar's stamp to the projected last bar's stamp
    // (never reads a bar after the cursor)
    const clock = (m: number) => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
    const gLabel = (gs: number, ge: number) => `${hhmm(s, gs)}–${clock(s.t[gs] + (ge - gs))}`;
    for (let gs = 0; gs < n; gs = gEnd(gs) + 1) {
      const ge = gEnd(gs);
      if (ge > n - 1) break;
      const a = closedAgg(gs);
      if (!a || a.estimated) continue;
      const sg = evaluateSignal(gs, a);
      if (sg) {
        sigs.set(gs, sg);
        sigList.push({ i: ge, gs, dir: sg.dir });
      }
      if (ge < s.replayFrom - 1) continue;
      const buyPct = (100 * a.totalBuy) / a.totalVol;
      if (sg) {
        const up = sg.dir > 0;
        const [pl, ph] = rowSpan(a, sg.pocBin);
        events.push({
          i: ge, price: up ? a.groupLow : a.groupHigh, tone: up ? "bull" : "bear", weight: 3,
          title: up ? "BUY ▲" : "SELL ▼",
          text: `${hhmm(s, ge)} — the ${gLabel(gs, ge)} group traded ${up ? "below" : "above"} ${fmtP(sg.sweptLevel)}, the ${up ? "low" : "high"} of the three groups before it, and closed back ${up ? "above" : "below"} it; delta flipped from ${dSign(sg.dPrev)} to ${dSign(sg.dNow)}, and the point of control (${fmtP(pl)}–${fmtP(ph)}) sits in the ${up ? "top" : "bottom"} 35% of the range, where ${up ? "buyers" : "sellers"} out-traded ${up ? "sellers" : "buyers"}.`,
        });
      }
      const fr = fightRows(a);
      if (fr.length) {
        let best = fr[0];
        for (const b of fr) if (a.binBuy[b] + a.binSell[b] > a.binBuy[best] + a.binSell[best]) best = b;
        const [pl, ph] = rowSpan(a, best);
        const vol = a.binBuy[best] + a.binSell[best];
        const z = (vol - a.binMean) / a.binSd;
        events.push({
          i: ge, price: (pl + ph) / 2, tone: "gold", weight: 2,
          title: "FIGHT NODE",
          text: `${hhmm(s, ge)} — the ${gLabel(gs, ge)} group closed with a FIGHT node at ${fmtP(pl)}–${fmtP(ph)}: ${fmtInt(vol)} contracts, ${z.toFixed(1)}σ above its average row, ${fmtInt(a.binBuy[best])} bought against ${fmtInt(a.binSell[best])} sold — both sides committed at one price (group ${buyPct.toFixed(0)}% buy).`,
        });
      }
    }
    events.sort((x, y) => x.i - y.i);
    function dSign(v: number) { return `${v >= 0 ? "+" : "−"}${fmtInt(Math.abs(v))}`; }

    // ---- the group as it stands at bar k (closed, or developing from closed bars)
    const devCache = new Map<number, Agg | null>();
    function aggAt(k: number): Agg | null {
      const gs = gStart(k), ge = gEnd(gs);
      if (k === ge) return closedAgg(gs);
      if (devCache.has(k)) return devCache.get(k)!;
      const a = computeAgg(gs, k, k);
      if (devCache.size > 400) devCache.clear();
      devCache.set(k, a);
      return a;
    }

    // ---- drawing
    type GD = { a: Agg; gs: number; ge: number; live: boolean; xLeft: number; xRight: number; yHigh: number; yLow: number; groupPxH: number; regionW: number; maxBarLen: number; boxRight: number; volFactor: number; drawNums: boolean; sig: Sig | null };
    let frame: GD[] = [];

    function layout(d: Draw): GD[] {
      const out: GD[] = [];
      const k = d.k;
      const barPx = Math.max(4, Math.max(1, Math.min(d.bw * 0.66, d.bw - 1)));
      const barDist = Math.max(barPx, d.bw);
      const i0 = Math.max(0, d.i0), i1 = Math.min(d.i1, k);
      for (let gs = gStart(i0); gs <= i1; gs = gEnd(gs) + 1) {
        const geFull = gEnd(gs);
        const live = k < geFull;               // NinjaTrader: the group holding the forming bar
        const a = live ? aggAt(k) : closedAgg(gs);
        if (!a || a.totalVol <= 0 || a.maxBinVol <= 0) continue;
        const geNT = live ? k + 1 : geFull;    // the forming bar sits at k + 1
        const yHigh = d.price.y(a.groupHigh), yLow = d.price.y(a.groupLow);
        const xLeft = d.x(gs), xRight = d.x(geNT);
        const groupPxH = Math.abs(yLow - yHigh);
        const regionW = Math.max(barPx, xRight - xLeft);
        if (regionW < 14) continue;
        const maxBarLen = Math.max(16, Math.min(PROFILE_MAX_W, regionW * 0.9));
        let runwayPx = 0;
        if (live) {
          const minClear = 62 + 5 * FONT + barPx;
          runwayPx = Math.max(0, geFull - geNT) * barDist + Math.max(LIVE_CLEAR * barDist, minClear);
          const panelRight = d.plotRight - 26;
          if (runwayPx > 0 && xRight + runwayPx > panelRight) runwayPx = Math.max(panelRight - xRight, minClear);
        }
        const boxRight = xRight + runwayPx;
        const drawNums = !a.estimated && groupPxH / Math.max(1, a.boxCount) >= FONT + 1;
        let volFactor = 1;
        if (!live) { const ref = volAvg[geFull] * (geFull - gs + 1); volFactor = ref > 0 ? a.totalVol / (ref * 1.1) : 1; }
        const sig = !live && !a.estimated ? sigs.get(gs) ?? null : null;
        out.push({ a, gs, ge: geFull, live, xLeft, xRight, yHigh, yLow, groupPxH, regionW, maxBarLen, boxRight, volFactor, drawNums, sig });
      }
      return out;
    }

    function under(d: Draw) {
      const lightMode = d.th.name === "light";
      frame = layout(d);
      const ctx = d.ctx;
      for (const g of frame) {
        const a = g.a;
        // backdrop
        const top = Math.min(g.yHigh, g.yLow), bkH = Math.max(2, Math.abs(g.yLow - g.yHigh));
        ctx.fillStyle = lightMode ? rgba([232, 234, 240], 70) : rgba([16, 18, 24], 42);
        ctx.fillRect(g.xLeft - 1, top, g.boxRight - g.xLeft + 2, bkH);
        for (let b = 0; b < a.boxCount; b++) {
          const vol = a.binBuy[b] + a.binSell[b];
          if (vol <= 0) continue;
          const binLow = a.groupLow + b * a.boxHeight;
          const yT = d.price.y(binLow + a.boxHeight), yB = d.price.y(binLow);
          const h = Math.max(2, yB - yT);
          const gap = h > 7 ? 1.5 : 0.5;
          const rowTop = yT + gap, rowH = Math.max(1, h - 2 * gap);
          const t = vol / a.maxBinVol;
          const len = Math.max(3, t * g.maxBarLen);
          const al = a.estimated ? 70 : Math.min(255, 195 + Math.trunc(55 * t));
          const colorT = a.boxCount > 1 ? 1 - b / (a.boxCount - 1) : t;
          const heat = visible(resolve(colorT), 135);
          ctx.fillStyle = rgba(heat, 40);
          ctx.fillRect(g.xLeft, rowTop, g.maxBarLen, rowH);
          const buyLen = len * (a.binBuy[b] / vol), sellLen = len - buyLen;
          if (buyLen > 0.5) { ctx.fillStyle = rgba(BULL, al); ctx.fillRect(g.xLeft, rowTop, buyLen, rowH); }
          if (sellLen > 0.5) { ctx.fillStyle = rgba(BEAR, al); ctx.fillRect(g.xLeft + buyLen, rowTop, sellLen, rowH); }
          if (a.estimated || a.binSd <= 0) continue;
          const lo = Math.min(a.binBuy[b], a.binSell[b]), hi = Math.max(a.binBuy[b], a.binSell[b]);
          const z = vol - a.binMean;
          if (z >= FIGHT_SIG * a.binSd && hi > 0 && lo / hi >= 0.35) {
            const fw = Math.max(len, 12);
            ctx.strokeStyle = rgba(FIGHT, 255); ctx.lineWidth = 2.2;
            ctx.strokeRect(g.xLeft - 1.5, rowTop - 1.5, fw + 3, rowH + 3);
          } else if (z >= HVN * a.binSd) {
            const hvA = Math.max(40, al);
            ctx.strokeStyle = lightMode ? rgba([45, 50, 62], hvA) : rgba([225, 232, 245], hvA); ctx.lineWidth = 1.1;
            ctx.strokeRect(g.xLeft, rowTop, len, rowH);
          }
        }
      }
      // Price bars OverProfile: the one-pixel keyline in the chart background under each candle
      if (!frame.length) return;
      const bodyW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      ctx.fillStyle = d.th.bg;
      const keyline = (i: number, o: number, h: number, l: number, c: number) => {
        const x = Math.round(d.x(i));
        const yh = d.price.y(h), yl = d.price.y(l), yo = d.price.y(o), yc = d.price.y(c);
        ctx.fillRect(x - 1, Math.round(yh) - 1, 3, Math.max(1, Math.round(yl - yh)) + 2);
        const tp = Math.round(Math.min(yo, yc)), bh = Math.max(1, Math.round(Math.abs(yc - yo)));
        const bx = bodyW <= 2 ? x - Math.floor(bodyW / 2) : Math.round(x - bodyW / 2 + 0.5);
        ctx.fillRect(bx - 1, tp - 1, Math.max(1, Math.round(bodyW)) + 2, bh + 2);
      };
      for (const g of frame) {
        const last = Math.min(g.live ? d.k : g.ge, d.i1);
        for (let i = Math.max(g.gs, d.i0); i <= last; i++) keyline(i, s.o[i], s.h[i], s.l[i], s.c[i]);
        if (g.live && d.live && d.live.i <= g.ge) keyline(d.live.i, d.live.o, d.live.h, d.live.l, d.live.c);
      }
    }

    function glassCandle(d: Draw, g: GD) {
      const a = g.a, ctx = d.ctx;
      const base = a.groupClose >= a.groupOpen ? BULL : BEAR;
      const vf = Math.max(0.35, Math.min(1, g.volFactor));
      const col: RGB = [Math.trunc(base[0] * vf), Math.trunc(base[1] * vf), Math.trunc(base[2] * vf)];
      const fillA = Math.trunc(165 * vf + 25), sheenA = Math.trunc(70 * vf);
      const light: RGB = [Math.min(255, col[0] + 95), Math.min(255, col[1] + 95), Math.min(255, col[2] + 95)];
      const x = d.x(g.gs);
      const yH = d.price.y(a.groupHigh), yL = d.price.y(a.groupLow), yO = d.price.y(a.groupOpen), yC = d.price.y(a.groupClose);
      const bodyW = 16, halfW = 8;
      ctx.fillStyle = rgba(col, 255);
      ctx.fillRect(x - 1.5, yH, 3, yL - yH);
      const top = Math.min(yO, yC);
      let bot = Math.max(yO, yC); if (bot - top < 3) bot = top + 3;
      ctx.fillStyle = rgba(col, fillA); ctx.fillRect(x - halfW, top, bodyW, bot - top);
      const sheenH = Math.max(2, (bot - top) * 0.32);
      ctx.fillStyle = rgba([255, 255, 255], sheenA); ctx.fillRect(x - halfW + 1, top + 1, bodyW - 2, sheenH);
      ctx.fillStyle = rgba([255, 255, 255], 45); ctx.fillRect(x - halfW + 1, top + 1, Math.max(1.5, bodyW * 0.2), bot - top - 2);
      ctx.strokeStyle = rgba(light, 255); ctx.lineWidth = 1.6; ctx.strokeRect(x - halfW, top, bodyW, bot - top);
    }

    function anatomy(d: Draw, g: GD, sg: Sig) {
      const a = g.a, ctx = d.ctx;
      const col = sg.dir > 0 ? BULL : BEAR;
      const yT = d.price.y(sg.zoneHi), yB = d.price.y(sg.zoneLo);
      const bx = g.xLeft - 2.5, by = Math.min(yT, yB) - 1.5, bw = g.maxBarLen + 5, bh = Math.abs(yB - yT) + 3;
      ctx.save();
      ctx.strokeStyle = rgba(col, 225); ctx.lineWidth = 1.6; ctx.setLineDash([4.8, 1.6]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);
      const pLow = a.groupLow + sg.pocBin * a.boxHeight;
      const pT = d.price.y(pLow + a.boxHeight), pB = d.price.y(pLow);
      ctx.strokeStyle = rgba(FIGHT, 255); ctx.lineWidth = 1.4;
      ctx.strokeRect(bx + 2, Math.min(pT, pB), bw - 4, Math.max(3, Math.abs(pB - pT)));
      const ySw = d.price.y(sg.sweptLevel);
      ctx.strokeStyle = rgba(FIGHT, 185); ctx.lineWidth = 1.3; ctx.setLineDash([1.3, 2.6]);
      ctx.beginPath(); ctx.moveTo(d.x(sg.sweepBarIdx), ySw); ctx.lineTo(d.x(g.gs), ySw); ctx.stroke();
      ctx.restore();
    }

    function arrow(d: Draw, g: GD, sg: Sig) {
      const a = g.a, ctx = d.ctx;
      const col = sg.dir > 0 ? BULL : BEAR;
      const xC = d.x(g.gs);
      const half = 7, triH = 10, gap = 8;
      const yEdge = d.price.y(sg.dir > 0 ? a.groupLow : a.groupHigh);
      const yTip = sg.dir > 0 ? yEdge + gap : yEdge - gap;
      const yBase = sg.dir > 0 ? yTip + triH : yTip - triH;
      const cy = (yTip + yBase) / 2;
      for (let pass = 0; pass < 2; pass++) {
        const sc = pass === 0 ? 1.6 : 1;
        const tipY = cy + (yTip - cy) * sc, baseY = cy + (yBase - cy) * sc, hw = half * sc;
        ctx.beginPath(); ctx.moveTo(xC, tipY); ctx.lineTo(xC - hw, baseY); ctx.lineTo(xC + hw, baseY); ctx.closePath();
        if (pass === 0) { ctx.fillStyle = rgba(col, 55); ctx.fill(); }
        else {
          ctx.fillStyle = rgba(col, 255); ctx.fill();
          ctx.strokeStyle = rgba([Math.min(255, col[0] + 90), Math.min(255, col[1] + 90), Math.min(255, col[2] + 90)], 230); ctx.lineWidth = 1.1; ctx.stroke();
        }
      }
    }

    function numbers(d: Draw, g: GD) {
      const a = g.a, lightMode = d.th.name === "light";
      const buyC = lightMode ? rgba([Math.trunc(BULL[0] * 0.6), Math.trunc(BULL[1] * 0.6), Math.trunc(BULL[2] * 0.6)], 245) : rgba(BULL, 245);
      const sellC = lightMode ? rgba([Math.trunc(BEAR[0] * 0.6), Math.trunc(BEAR[1] * 0.6), Math.trunc(BEAR[2] * 0.6)], 245) : rgba(BEAR, 245);
      const sepC = lightMode ? rgba([95, 100, 110], 235) : rgba([150, 156, 168], 210);
      const div = g.boxRight - 46;
      const o = { size: 10.5, weight: 600 };
      for (let b = 0; b < a.boxCount; b++) {
        const vol = a.binBuy[b] + a.binSell[b];
        if (vol <= 0) continue;
        const binLow = a.groupLow + b * a.boxHeight;
        const yT = d.price.y(binLow + a.boxHeight), yB = d.price.y(binLow);
        const h = Math.max(2, yB - yT), ym = yT + h / 2;
        d.text(formatVol(a.binBuy[b]), div - 5, ym, { ...o, color: buyC, align: "right" });
        d.text("|", div + 3, ym, { ...o, color: sepC, align: "right" });
        d.text(formatVol(a.binSell[b]), div + 6, ym, { ...o, color: sellC, align: "left" });
      }
    }

    function summary(d: Draw, g: GD) {
      const a = g.a, lightMode = d.th.name === "light";
      const bP = (100 * a.totalBuy) / a.totalVol, sP = (100 * a.totalSell) / a.totalVol;
      const ink = lightMode ? rgba([35, 30, 55], 255) : "#FFFFFF";
      const lines = [
        { t: `Σ: ${formatVol(a.totalVol)}`, color: ink, size: 10.5, weight: 600 },
        { t: `B: ${formatVol(a.totalBuy)} (${pct(bP)}%)`, color: ink, size: 10.5, weight: 600 },
        { t: `S: ${formatVol(a.totalSell)} (${pct(sP)}%)`, color: ink, size: 10.5, weight: 600 },
      ];
      // anchored at the group's left edge as in the tool; on the narrow web chart a box that would run
      // under the price axis is slid left just enough to stay whole
      const w = Math.max(...lines.map((l) => d.measure(l.t, { size: 10.5, weight: 600 }))) + 10;
      const x = Math.min(g.xLeft, d.plotRight - 4 - w);
      d.plate(x, d.price.y(a.groupLow) + 6, lines, { bg: lightMode ? rgba([238, 236, 248], 232) : rgba([40, 32, 64], 225), border: rgba([150, 120, 220], 255), pad: 5 });
    }

    function draw(d: Draw) {
      if (!frame.length) return;
      const newest = frame.reduce((m, g) => (g.gs > m.gs ? g : m), frame[0]);
      const isNewest = (g: GD) => g === newest && gStart(d.k) === g.gs;
      // front: signal anatomy, grouped candle
      for (const g of frame) {
        if (g.sig) anatomy(d, g, g.sig);
        if (d.on("gcandle")) glassCandle(d, g);
      }
      // labels: arrows, numbers, summary box
      for (const g of frame) {
        if (g.sig) arrow(d, g, g.sig);
        if (g.drawNums && d.on("nums")) numbers(d, g);
        if (d.on("totals") && !g.a.estimated && g.groupPxH >= 50 && (g.regionW >= 120 || isNewest(g))) summary(d, g);
      }
    }

    // ---- status / readout
    const lastSigAt = (k: number) => {
      let r: { i: number; gs: number; dir: number } | null = null;
      // example hygiene (web showcase): an arrow printed in the hidden warm-up is never reported
      for (const x of sigList) { if (x.i > k) break; if (x.i >= s.replayFrom) r = x; }
      return r;
    };
    const pocText = (a: Agg) => {
      const lo = a.groupLow + a.pocBin * a.boxHeight;
      return `${fmtP(lo)}–${fmtP(lo + a.boxHeight)}`;
    };
    function groupItems(k: number): ReadItem[] {
      const a = aggAt(k);
      const gs = gStart(k), ge = gEnd(gs);
      if (!a) return [{ label: "Group", value: "no flow" }];
      const bP = (100 * a.totalBuy) / a.totalVol, sP = 100 - bP;
      return [
        { label: "Group", value: `${gLabel(gs, ge)} · ${k === ge ? "closed" : `${k - gs + 1} of ${ge - gs + 1}`}` },
        { label: "Σ", value: formatVol(a.totalVol) },
        { label: "B / S", value: `${pct(bP)}% / ${pct(sP)}%`, tone: bP > sP ? "bull" : bP < sP ? "bear" : "neutral" },
        { label: "POC row", value: pocText(a) },
      ];
    }

    return {
      events,
      under,
      draw,
      // room under the newest group for its summary box (the tool's box hangs 6 px under the group low)
      priceExtent: (i0, i1, k) => {
        const a = aggAt(k);
        if (!a || a.estimated) return null;
        let hi = -Infinity, lo = Infinity;
        for (let i = Math.max(0, i0); i <= Math.min(i1, k); i++) { if (s.h[i] > hi) hi = s.h[i]; if (s.l[i] < lo) lo = s.l[i]; }
        if (!isFinite(hi)) return null;
        return [a.groupLow - (hi - lo) * 0.09, a.groupHigh];
      },
      status: (k) => {
        const items = groupItems(k);
        const ls = lastSigAt(k);
        items.push({ label: "Last arrow", value: ls ? `${ls.dir > 0 ? "BUY ▲" : "SELL ▼"} ${hhmm(s, ls.i)}` : "none yet", tone: ls ? (ls.dir > 0 ? "bull" : "bear") : undefined });
        items.push({ label: "Flow", value: measured[k] ? "live trades" : "1-min estimate" });
        return items;
      },
      readout: (i) => {
        const bb = fBuy[i], ss = fSell[i];
        let b = 0, se = 0;
        for (let j = 0; j < bb.length; j++) { b += bb[j]; se += ss[j]; }
        const items: ReadItem[] = [
          { label: "Bar B | S", value: `${formatVol(b)} | ${formatVol(se)}` },
          { label: "Bar Δ", value: dSign(b - se), tone: b > se ? "bull" : b < se ? "bear" : "neutral" },
          { label: "Flow", value: measured[i] ? "live trades" : "1-min estimate" },
        ];
        return items.concat(groupItems(i).slice(0, 3));
      },
      legend: [
        { label: "Buy volume", color: rgba(BULL, 255), shape: "box" },
        { label: "Sell volume", color: rgba(BEAR, 255), shape: "box" },
        { label: "Heavy node", color: "rgb(225,232,245)", shape: "line" },
        { label: "FIGHT node", color: rgba(FIGHT, 255), shape: "line" },
        { label: "▲ / ▼ arrows", color: rgba(BULL, 255), shape: "dot" },
      ],
    };
  },
};
