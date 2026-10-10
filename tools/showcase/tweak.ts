/**
 * DS Replay showcase — the POLISH: small, bounded, logged edits to a recorded
 * stretch, made only where the tool's own output shows a flaw (a stray signal,
 * a level clipped by a single wick), and only inside the shown window.
 *
 * Every edit works on the bar as a whole — candle, footprint, buy/sell,
 * volume and intrabar path move together (volume is moved between prices,
 * never created or destroyed), so the bar still agrees with itself
 * (library.check) and the order-flow tools read the same bar the candle shows.
 *
 * The budget (Tom, 2026-10-09: "Light"):
 *   trimHigh / trimLow     a wick shortened by 1–2 ticks
 *   extendHigh / extendLow a wick lengthened by 1–2 ticks
 *   nudgeClose             a close moved 1–2 ticks inside its bar's range
 *   removeSpike            one isolated stray wick taken back to its
 *                          neighbours' extreme (at most 2 per example)
 *   at most 6 edits per example; the tool itself is never touched.
 */
import { TICK, type Cut } from "./library";

export type Edit = { op: "trimHigh" | "trimLow" | "extendHigh" | "extendLow" | "nudgeClose" | "removeSpike"; i: number; ticks: number };
export const BUDGET = { edits: 6, ticks: 2, spikes: 2 };

const T = (p: number) => Math.round(p / TICK);

/** tidy a path: no repeats, swings only, starts at 0, ends at `cl`, touches hi and lo */
function tidy(p: number[], hi: number, lo: number, cl: number): number[] {
  const q: number[] = [];
  for (const v of p) {
    const x = Math.max(lo, Math.min(hi, v));
    if (q.length && x === q[q.length - 1]) continue;
    if (q.length >= 2 && (q[q.length - 1] - q[q.length - 2]) * (x - q[q.length - 1]) > 0) q[q.length - 1] = x;
    else q.push(x);
  }
  if (q[0] !== 0) q.unshift(0);
  if (q[q.length - 1] !== cl) q.push(cl);
  const has = (v: number) => q.includes(v);
  if (!has(hi)) q.splice(Math.max(1, q.length - 1), 0, hi);
  if (!has(lo)) q.splice(Math.max(1, q.length - 1), 0, lo);
  // re-tidy after inserts
  const r: number[] = [];
  for (const x of q) {
    if (r.length && x === r[r.length - 1]) continue;
    if (r.length >= 2 && (r[r.length - 1] - r[r.length - 2]) * (x - r[r.length - 1]) > 0 && x !== cl) r[r.length - 1] = x;
    else r.push(x);
  }
  if (r[r.length - 1] !== cl) r.push(cl);
  return r;
}

/** move footprint volume from prices outside [lo, hi] (ticks, absolute) onto the nearest edge */
function foldFootprint(c: Cut, i: number, loT: number, hiT: number) {
  if (!c.pathReal[i]) return;
  const lo0 = c.fp.lo[i], bid = c.fp.bid[i], ask = c.fp.ask[i];
  const n = hiT - loT + 1;
  const nb = new Array(n).fill(0), na = new Array(n).fill(0);
  for (let j = 0; j < bid.length; j++) {
    const p = Math.max(loT, Math.min(hiT, lo0 + j)) - loT;
    nb[p] += bid[j]; na[p] += ask[j];
  }
  c.fp.lo[i] = loT; c.fp.bid[i] = nb; c.fp.ask[i] = na;
}

/** grow the footprint to [lo, hi]: the new outer prices take a third of the old edge's volume each */
function growFootprint(c: Cut, i: number, loT: number, hiT: number) {
  if (!c.pathReal[i]) return;
  const lo0 = c.fp.lo[i], bid = c.fp.bid[i].slice(), ask = c.fp.ask[i].slice();
  const hi0 = lo0 + bid.length - 1;
  const nb = new Array(hiT - loT + 1).fill(0), na = new Array(hiT - loT + 1).fill(0);
  for (let j = 0; j < bid.length; j++) { nb[lo0 + j - loT] = bid[j]; na[lo0 + j - loT] = ask[j]; }
  const spread = (edge: number, to: number[]) => {
    for (const arr of [nb, na]) {
      let pool = arr[edge - loT];
      for (const p of to) {
        const take = Math.floor(pool / 3);
        if (take > 0) { arr[edge - loT] -= take; arr[p - loT] += take; pool -= take; }
      }
    }
    // a printed price has at least one contract: borrow it from the edge if the thirds rounded to nothing
    for (const p of to) {
      if (nb[p - loT] + na[p - loT] > 0) continue;
      const arr = na[edge - loT] >= nb[edge - loT] ? na : nb;
      if (arr[edge - loT] > 1) { arr[edge - loT] -= 1; arr[p - loT] += 1; }
    }
  };
  if (hiT > hi0) spread(hi0, Array.from({ length: hiT - hi0 }, (_, j) => hi0 + 1 + j));
  if (loT < lo0) spread(lo0, Array.from({ length: lo0 - loT }, (_, j) => lo0 - 1 - j));
  c.fp.lo[i] = loT; c.fp.bid[i] = nb; c.fp.ask[i] = na;
}

/** a closing price that never printed borrows one contract from the nearest printed price */
function ensurePrinted(c: Cut, i: number, priceT: number) {
  if (!c.pathReal[i]) return;
  const j = priceT - c.fp.lo[i], b = c.fp.bid[i], a = c.fp.ask[i];
  if (j < 0 || j >= b.length || b[j] + a[j] > 0) return;
  for (let d = 1; d < b.length; d++) for (const k of [j - d, j + d]) {
    if (k < 0 || k >= b.length) continue;
    const arr = a[k] >= b[k] ? a : b;
    if (arr[k] > 1) { arr[k] -= 1; (arr === a ? a : b)[j] += 1; return; }
  }
}

function sync(c: Cut, i: number) {
  if (!c.pathReal[i]) return;
  c.sell[i] = c.fp.bid[i].reduce((x, y) => x + y, 0);
  c.buy[i] = c.fp.ask[i].reduce((x, y) => x + y, 0);
  c.vol[i] = c.sell[i] + c.buy[i];
}

/** apply one edit in place; returns false (and leaves the bar alone) if it is outside the budget or impossible */
export function apply(c: Cut, e: Edit): boolean {
  const i = e.i;
  if (i < c.replayFrom || i >= c.n) return false;
  const o = c.o[i], top = Math.max(o, c.c[i]), bot = Math.min(o, c.c[i]);
  const oT = T(o);
  let hiT = T(c.h[i]), loT = T(c.l[i]), clT = T(c.c[i]);
  if (e.op !== "removeSpike" && (e.ticks < 1 || e.ticks > BUDGET.ticks)) return false;
  switch (e.op) {
    case "trimHigh": { if (hiT - e.ticks < T(top)) return false; hiT -= e.ticks; break; }
    case "trimLow": { if (loT + e.ticks > T(bot)) return false; loT += e.ticks; break; }
    case "extendHigh": { hiT += e.ticks; break; }
    case "extendLow": { loT -= e.ticks; break; }
    case "nudgeClose": {
      const n = clT + e.ticks;
      if (n > hiT || n < loT || e.ticks === 0) return false;
      clT = n; break;
    }
    case "removeSpike": {
      // an ISOLATED stray wick: it sticks out 4+ ticks beyond both neighbours and is
      // twice the bar's body; it goes back to the neighbours' extreme (never inside the body)
      const up = e.ticks > 0;
      const nb = [i - 1, i + 1].filter((j) => j >= 0 && j < c.n);
      if (up) {
        const ref = Math.max(...nb.map((j) => T(c.h[j])), T(top));
        if (hiT - ref < 4 || hiT - T(top) < 2 * Math.max(1, T(top) - T(bot))) return false;
        hiT = ref;
      } else {
        const ref = Math.min(...nb.map((j) => T(c.l[j])), T(bot));
        if (ref - loT < 4 || T(bot) - loT < 2 * Math.max(1, T(top) - T(bot))) return false;
        loT = ref;
      }
      break;
    }
  }
  // the bar, rebuilt around its new extremes / close
  if (e.op === "extendHigh" || e.op === "extendLow") growFootprint(c, i, loT, hiT);
  else foldFootprint(c, i, loT, hiT);
  c.h[i] = hiT * TICK; c.l[i] = loT * TICK; c.c[i] = clT * TICK;
  let p = c.path[i].slice();
  if (e.op === "extendHigh") { const j = p.indexOf(Math.max(...p)); p[j] = hiT - oT; }
  if (e.op === "extendLow") { const j = p.indexOf(Math.min(...p)); p[j] = loT - oT; }
  if (e.op === "nudgeClose") p = p.slice(0, -1);
  c.path[i] = tidy(p, hiT - oT, loT - oT, clT - oT);
  ensurePrinted(c, i, clT);
  sync(c, i);
  return true;
}

/** the edits worth trying on bar i (cheapest first) */
export function candidates(c: Cut, i: number): Edit[] {
  const out: Edit[] = [];
  for (const ticks of [1, 2]) {
    out.push({ op: "trimHigh", i, ticks }, { op: "trimLow", i, ticks });
    out.push({ op: "nudgeClose", i, ticks }, { op: "nudgeClose", i, ticks: -ticks });
    out.push({ op: "extendHigh", i, ticks }, { op: "extendLow", i, ticks });
  }
  out.push({ op: "removeSpike", i, ticks: 1 }, { op: "removeSpike", i, ticks: -1 });
  return out;
}

export const describe = (e: Edit, c: Cut) => {
  const at = e.i - c.replayFrom;
  switch (e.op) {
    case "trimHigh": return `bar ${at}: high ${e.ticks} tick${e.ticks > 1 ? "s" : ""} lower`;
    case "trimLow": return `bar ${at}: low ${e.ticks} tick${e.ticks > 1 ? "s" : ""} higher`;
    case "extendHigh": return `bar ${at}: high ${e.ticks} tick${e.ticks > 1 ? "s" : ""} higher`;
    case "extendLow": return `bar ${at}: low ${e.ticks} tick${e.ticks > 1 ? "s" : ""} lower`;
    case "nudgeClose": return `bar ${at}: close ${Math.abs(e.ticks)} tick${Math.abs(e.ticks) > 1 ? "s" : ""} ${e.ticks > 0 ? "higher" : "lower"}`;
    case "removeSpike": return `bar ${at}: stray ${e.ticks > 0 ? "upper" : "lower"} wick taken back to its neighbours`;
  }
};
