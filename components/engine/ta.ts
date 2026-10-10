/**
 * NinjaTrader 8's own built-in indicators, written to give the SAME numbers
 * NinjaTrader gives (same seeding, same warm-up), so a study that calls
 * EMA()/SMA()/ATR()/MAX()/MIN()/LinReg() in its .cs gets identical values here.
 *
 *  SMA     average of the bars available while CurrentBar < Period
 *  EMA     seeded with the first input; k = 2 / (1 + Period)
 *  ATR     bar 0 = High - Low; then ((min(n,P) - 1) * prev + TR) / min(n,P)
 *  MAX/MIN over the bars available
 *  LinReg  least squares over min(CurrentBar + 1, Period) bars, value at the newest
 *
 * Plus the time helpers every study needs: the bar's New York wall-clock
 * minute of the day, its calendar day, and its trading session (18:00 roll).
 */

import type { Session } from "./types";

export type Arr = Float64Array;
export const nan = () => Number.NaN;
export const series = (n: number, fill = Number.NaN) => new Float64Array(n).fill(fill);

export function SMA(x: ArrayLike<number>, p: number): Arr {
  const n = x.length, out = series(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += x[i];
    if (i >= p) sum -= x[i - p];
    out[i] = sum / Math.min(i + 1, p);
  }
  return out;
}

export function EMA(x: ArrayLike<number>, p: number): Arr {
  const n = x.length, out = series(n), k = 2 / (1 + p);
  for (let i = 0; i < n; i++) out[i] = i === 0 ? x[0] : x[i] * k + (1 - k) * out[i - 1];
  return out;
}

/** Wilder's smoothing (RMA), seeded with the first value. */
export function RMA(x: ArrayLike<number>, p: number): Arr {
  const n = x.length, out = series(n);
  for (let i = 0; i < n; i++) out[i] = i === 0 ? x[0] : (out[i - 1] * (p - 1) + x[i]) / p;
  return out;
}

export function WMA(x: ArrayLike<number>, p: number): Arr {
  const n = x.length, out = series(n);
  for (let i = 0; i < n; i++) {
    const m = Math.min(i + 1, p);
    let s = 0, w = 0;
    for (let j = 0; j < m; j++) { s += x[i - j] * (m - j); w += m - j; }
    out[i] = s / w;
  }
  return out;
}

export function TR(s: { h: ArrayLike<number>; l: ArrayLike<number>; c: ArrayLike<number> }, i: number): number {
  if (i === 0) return s.h[0] - s.l[0];
  const pc = s.c[i - 1];
  return Math.max(s.h[i] - s.l[i], Math.abs(s.l[i] - pc), Math.abs(s.h[i] - pc));
}

export function ATR(s: { h: ArrayLike<number>; l: ArrayLike<number>; c: ArrayLike<number> }, p: number): Arr {
  const n = s.h.length, out = series(n);
  for (let i = 0; i < n; i++) {
    if (i === 0) { out[0] = s.h[0] - s.l[0]; continue; }
    const m = Math.min(i + 1, p);
    out[i] = ((m - 1) * out[i - 1] + TR(s, i)) / m;
  }
  return out;
}

export function MAX(x: ArrayLike<number>, p: number): Arr {
  const n = x.length, out = series(n);
  for (let i = 0; i < n; i++) {
    let m = -Infinity;
    for (let j = Math.max(0, i - p + 1); j <= i; j++) if (x[j] > m) m = x[j];
    out[i] = m;
  }
  return out;
}

export function MIN(x: ArrayLike<number>, p: number): Arr {
  const n = x.length, out = series(n);
  for (let i = 0; i < n; i++) {
    let m = Infinity;
    for (let j = Math.max(0, i - p + 1); j <= i; j++) if (x[j] < m) m = x[j];
    out[i] = m;
  }
  return out;
}

export function STDDEV(x: ArrayLike<number>, p: number): Arr {
  // NinjaTrader StdDev: population standard deviation over min(n, P) bars
  const n = x.length, out = series(n), avg = SMA(x, p);
  for (let i = 0; i < n; i++) {
    const m = Math.min(i + 1, p);
    let s = 0;
    for (let j = 0; j < m; j++) { const d = x[i - j] - avg[i]; s += d * d; }
    out[i] = Math.sqrt(s / m);
  }
  return out;
}

export function LinReg(x: ArrayLike<number>, p: number): Arr {
  const n = x.length, out = series(n);
  for (let i = 0; i < n; i++) {
    const m = Math.min(i + 1, p);
    if (m < 2) { out[i] = x[i]; continue; }
    // x-axis: 0 = oldest .. m-1 = newest
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (let j = 0; j < m; j++) {
      const xx = j, yy = x[i - (m - 1) + j];
      sx += xx; sy += yy; sxy += xx * yy; sxx += xx * xx;
    }
    const slope = (m * sxy - sx * sy) / (m * sxx - sx * sx);
    const icpt = (sy - slope * sx) / m;
    out[i] = icpt + slope * (m - 1);
  }
  return out;
}

export const typical = (s: Session, i: number) => (s.h[i] + s.l[i] + s.c[i]) / 3;

// ------------------------------------------------------------------ time

const BASE_UTC = Date.UTC(2026, 0, 1); // naive New York wall clock, carried as UTC fields

/** wall-clock Date (read with getUTC*) of bar i's close */
export const wall = (s: Session, i: number) => new Date(BASE_UTC + s.t[i] * 60000);
/** minute of the New York day, 0..1439, of bar i's close */
export const minuteOfDay = (s: Session, i: number) => ((s.t[i] % 1440) + 1440) % 1440;
/** calendar day number (days since 2026-01-01) of bar i's close */
export const dayNum = (s: Session, i: number) => Math.floor(s.t[i] / 1440);
/** trading session number: CME Globex rolls at 18:00 New York */
export const sessionNum = (s: Session, i: number) => Math.floor((s.t[i] - 1 - 18 * 60) / 1440) + 1;
/** true for bars inside 09:30-16:00 (bar closes 09:31 .. 16:00) */
export const isRTH = (s: Session, i: number) => {
  const m = minuteOfDay(s, i);
  return m > 570 && m <= 960;
};
export const hhmm = (s: Session, i: number) => {
  const m = minuteOfDay(s, i);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
export const weekday = (s: Session, i: number) => wall(s, i).getUTCDay();

/** Round to the instrument tick. */
export const toTick = (p: number, tick: number) => Math.round(p / tick) * tick;

/**
 * Bars of a higher timeframe built from the 1-minute session, NinjaTrader
 * style: a bar of N minutes closes on the minute boundary of the session clock
 * (minutes since midnight divisible by N), and is stamped with its close time.
 * `of[i]` = index of the HTF bar the 1-minute bar i belongs to; `last[j]` = the
 * 1-minute index that closes HTF bar j (a HTF bar is CLOSED from that index on).
 */
export function resample(s: Session, minutes: number) {
  const o: number[] = [], h: number[] = [], l: number[] = [], c: number[] = [], v: number[] = [], t: number[] = [], first: number[] = [], last: number[] = [];
  const of = new Int32Array(s.n);
  let cur = -1, key = NaN;
  for (let i = 0; i < s.n; i++) {
    const k = Math.ceil(s.t[i] / minutes);
    if (k !== key || (i > 0 && s.t[i] - s.t[i - 1] > minutes)) {
      key = k; cur++;
      o.push(s.o[i]); h.push(s.h[i]); l.push(s.l[i]); c.push(s.c[i]); v.push(s.v[i]); t.push(k * minutes); first.push(i); last.push(i);
    } else {
      if (s.h[i] > h[cur]) h[cur] = s.h[i];
      if (s.l[i] < l[cur]) l[cur] = s.l[i];
      c[cur] = s.c[i]; v[cur] += s.v[i]; last[cur] = i;
    }
    of[i] = cur;
  }
  return { n: o.length, o, h, l, c, v, t, first, last, of };
}
