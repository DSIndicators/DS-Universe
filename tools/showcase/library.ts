/**
 * DS Replay showcase — the LIBRARY of recorded NQ sessions.
 *
 * Built by tools/library/build_library.py from Tom's NinjaTrader 8 database:
 * one file per CME session (18:00 the evening before -> 17:00), one-minute
 * bars stamped by their close, each bar's candle / footprint / buy-sell split /
 * volume / intrabar path made from the same trades (real[i] = 1). Bars from an
 * hour the database never recorded tick by tick carry the minute file's OHLCV
 * and no order flow (real[i] = 0).
 *
 * The library lives outside the website (it is ~0.5 GB and never shipped):
 * DS_LIB, default /home/claude/lib/nq.
 *
 * Bar = the unit everything here edits: o/h/l/c/v/buy/sell + footprint + path,
 * held so that they can be checked against each other (see check()).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const LIB = process.env.DS_LIB ?? "/home/claude/lib/nq";
export const TICK = 0.25;

export type Day = {
  day: string; contract: string; tick: number; tf: number; n: number;
  t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; vol: number[]; buy: number[]; sell: number[];
  fp: { lo: number[]; bid: number[][]; ask: number[][] }; path: number[][]; real: number[];
};

/** a cut of the library ready to become an example: bars [0, n), the example shown from replayFrom */
export type Cut = {
  n: number; replayFrom: number; tf: number;
  t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; vol: number[]; buy: number[]; sell: number[];
  fp: { lo: number[]; bid: number[][]; ask: number[][] }; path: number[][]; pathReal: number[];
  /** where it came from (kept in the build log, never in the published file) */
  src: { days: string[]; contract: string; from: string; to: string };
};

let index: Record<string, { vol: number; contract: string }> | null = null;
export function days(): string[] {
  index ??= JSON.parse(readFileSync(join(LIB, "index.json"), "utf8"));
  return Object.keys(index!).sort();
}
const cache = new Map<string, Day>();
export function loadDay(day: string): Day {
  let d = cache.get(day);
  if (!d) {
    d = JSON.parse(readFileSync(join(LIB, `${day}.json`), "utf8")) as Day;
    if (cache.size > 12) cache.delete(cache.keys().next().value!);
    cache.set(day, d);
  }
  return d;
}
/** the session before `day` in the library (same contract), or null */
export function prevDay(day: string): string | null {
  const ds = days(), j = ds.indexOf(day);
  if (j <= 0) return null;
  const p = ds[j - 1];
  return loadDay(p).contract === loadDay(day).contract ? p : null;
}

export const mod = (m: number) => ((m % 1440) + 1440) % 1440;
export const clock = (t: number) => { const m = mod(t); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

/** Join whole sessions (oldest first) into one bar series. */
export function joinDays(list: Day[]): Day {
  const out: Day = { day: list[list.length - 1].day, contract: list[list.length - 1].contract, tick: TICK, tf: 1, n: 0, t: [], o: [], h: [], l: [], c: [], vol: [], buy: [], sell: [], fp: { lo: [], bid: [], ask: [] }, path: [], real: [] };
  for (const d of list) {
    for (const k of ["t", "o", "h", "l", "c", "vol", "buy", "sell", "path", "real"] as const) (out[k] as unknown[]).push(...(d[k] as unknown[]));
    out.fp.lo.push(...d.fp.lo); out.fp.bid.push(...d.fp.bid); out.fp.ask.push(...d.fp.ask);
  }
  out.n = out.t.length;
  return out;
}

/**
 * Bars of `tf` minutes from one-minute bars, NinjaTrader style (a bar closes on
 * the clock minute divisible by tf and is stamped with that close). The
 * footprint is summed price by price, the path is the minutes' paths laid end
 * to end (then thinned to its swings), so a resampled bar still agrees with
 * itself everywhere. real = every minute in it was real.
 */
export function resampleDay(d: Day, tf: number): Day {
  if (tf === 1) return d;
  const out: Day = { day: d.day, contract: d.contract, tick: d.tick, tf, n: 0, t: [], o: [], h: [], l: [], c: [], vol: [], buy: [], sell: [], fp: { lo: [], bid: [], ask: [] }, path: [], real: [] };
  let key = NaN, cur = -1;
  let fpMap: Map<number, [number, number]> = new Map();
  let raw: number[] = [];
  const flush = () => {
    if (cur < 0) return;
    const keys = [...fpMap.keys()];
    if (keys.length && out.real[cur]) {
      const lo = Math.min(...keys), hi = Math.max(...keys);
      const bid = new Array(hi - lo + 1).fill(0), ask = new Array(hi - lo + 1).fill(0);
      for (const [p, [b, a]] of fpMap) { bid[p - lo] = b; ask[p - lo] = a; }
      out.fp.lo.push(lo); out.fp.bid.push(bid); out.fp.ask.push(ask);
    } else { out.fp.lo.push(0); out.fp.bid.push([]); out.fp.ask.push([]); }
    out.path.push(thin(raw, Math.round((out.h[cur] - out.o[cur]) / TICK), Math.round((out.l[cur] - out.o[cur]) / TICK)));
  };
  for (let i = 0; i < d.n; i++) {
    const k = Math.ceil(d.t[i] / tf);
    if (k !== key || (i > 0 && d.t[i] - d.t[i - 1] > tf)) {
      flush();
      key = k; cur++; fpMap = new Map(); raw = [];
      out.t.push(k * tf); out.o.push(d.o[i]); out.h.push(d.h[i]); out.l.push(d.l[i]); out.c.push(d.c[i]);
      out.vol.push(d.vol[i]); out.buy.push(d.buy[i]); out.sell.push(d.sell[i]); out.real.push(d.real[i]);
    } else {
      if (d.h[i] > out.h[cur]) out.h[cur] = d.h[i];
      if (d.l[i] < out.l[cur]) out.l[cur] = d.l[i];
      out.c[cur] = d.c[i]; out.vol[cur] += d.vol[i];
      if (out.buy[cur] >= 0 && d.buy[i] >= 0) { out.buy[cur] += d.buy[i]; out.sell[cur] += d.sell[i]; } else { out.buy[cur] = -1; out.sell[cur] = -1; }
      if (!d.real[i]) out.real[cur] = 0;
    }
    const off = Math.round((d.o[i] - out.o[cur]) / TICK);
    for (const q of d.path[i]) raw.push(q + off);
    if (d.real[i]) d.fp.bid[i].forEach((b, j) => {
      const p = d.fp.lo[i] + j, e = fpMap.get(p) ?? [0, 0];
      e[0] += b; e[1] += d.fp.ask[i][j]; fpMap.set(p, e);
    });
  }
  flush();
  out.n = out.t.length;
  return out;
}

/** swing path (ticks from the open) thinned to <= 24 points, its high, low and close kept */
export function thin(raw: number[], hi: number, lo: number, max = 24): number[] {
  const z: number[] = [];
  for (const q of raw) {
    if (z.length && q === z[z.length - 1]) continue;
    if (z.length >= 2 && (z[z.length - 1] - z[z.length - 2]) * (q - z[z.length - 1]) > 0) z[z.length - 1] = q;
    else z.push(q);
  }
  if (!z.length || z[0] !== 0) z.unshift(0);
  const cl = raw[raw.length - 1] ?? 0;
  while (z.length > max) {
    let best = -1, amp = Infinity;
    for (let j = 1; j < z.length - 1; j++) {
      if (z[j] === hi || z[j] === lo) continue;
      const a = Math.min(Math.abs(z[j] - z[j - 1]), Math.abs(z[j + 1] - z[j]));
      if (a < amp) { amp = a; best = j; }
    }
    if (best < 0) break;
    z.splice(best, 1);
    let k = Math.max(1, best - 1);
    while (k > 0 && k < z.length - 1 && (z[k] - z[k - 1]) * (z[k + 1] - z[k]) >= 0) z.splice(k, 1);
  }
  if (z[z.length - 1] !== cl) z.push(cl);
  return z;
}

/**
 * Cut [from, to] (inclusive, indices into `d`) as an example shown from `show`.
 * Bars before `show` are the warm-up the tool reads but never draws.
 * Times are moved by whole weeks to one reference week, so a published file
 * carries the clock and the weekday of every bar but not its date.
 */
export const REF_DAY = 20514; // days since 1970-01-01 of Monday 2026-03-02 (any Monday works)
export function cut(d: Day, from: number, show: number, to: number): Cut {
  const sl = <T,>(a: T[]) => a.slice(from, to + 1);
  // whole weeks only: the weekday and the clock of every bar stay as recorded
  const dayOf = (t: number) => Math.floor(t / 1440) + 20454; // 2026-01-01 = day 20454 since 1970
  const shiftWeeks = Math.round((REF_DAY - dayOf(d.t[show])) / 7);
  const dt = shiftWeeks * 7 * 1440;
  return {
    n: to - from + 1, replayFrom: show - from, tf: d.tf,
    t: sl(d.t).map((x) => x + dt), o: sl(d.o), h: sl(d.h), l: sl(d.l), c: sl(d.c), vol: sl(d.vol), buy: sl(d.buy), sell: sl(d.sell),
    fp: { lo: sl(d.fp.lo), bid: sl(d.fp.bid).map((a) => a.slice()), ask: sl(d.fp.ask).map((a) => a.slice()) },
    path: sl(d.path).map((a) => a.slice()), pathReal: sl(d.real),
    src: { days: [d.day], contract: d.contract, from: clock(d.t[show]), to: clock(d.t[to]) },
  };
}

/** a deep copy (tweaks edit in place) */
export function clone(c: Cut): Cut {
  return {
    ...c, t: c.t.slice(), o: c.o.slice(), h: c.h.slice(), l: c.l.slice(), c: c.c.slice(), vol: c.vol.slice(), buy: c.buy.slice(), sell: c.sell.slice(),
    fp: { lo: c.fp.lo.slice(), bid: c.fp.bid.map((a) => a.slice()), ask: c.fp.ask.map((a) => a.slice()) },
    path: c.path.map((a) => a.slice()), pathReal: c.pathReal.slice(), src: { ...c.src },
  };
}

/**
 * Every bar agrees with itself: the path starts at the open, ends at the
 * close and touches the high and the low; where the bar is real, the footprint
 * spans exactly high..low and its volumes add up to the bar's volume, buys and
 * sells. Returns the bars that do not (empty = all good).
 */
export function check(c: Cut, from = 0): string[] {
  const bad: string[] = [];
  for (let i = from; i < c.n; i++) {
    const p = c.path[i], o = c.o[i];
    const hi = Math.round((c.h[i] - o) / TICK), lo = Math.round((c.l[i] - o) / TICK), cl = Math.round((c.c[i] - o) / TICK);
    if (p[0] !== 0 || p[p.length - 1] !== cl || Math.max(...p) !== hi || Math.min(...p) !== lo) bad.push(`${i} path`);
    if (c.l[i] > Math.min(c.o[i], c.c[i]) || c.h[i] < Math.max(c.o[i], c.c[i])) bad.push(`${i} ohlc`);
    if (c.pathReal[i]) {
      const n = c.fp.bid[i].length;
      if (c.fp.lo[i] !== Math.round(c.l[i] / TICK) || c.fp.lo[i] + n - 1 !== Math.round(c.h[i] / TICK)) bad.push(`${i} fp range`);
      const sb = c.fp.bid[i].reduce((a, b) => a + b, 0), sa = c.fp.ask[i].reduce((a, b) => a + b, 0);
      if (sb !== c.sell[i] || sa !== c.buy[i] || sb + sa !== c.vol[i]) bad.push(`${i} fp volume`);
    }
  }
  return bad;
}
