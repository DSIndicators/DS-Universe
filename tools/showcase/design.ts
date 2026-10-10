/**
 * DS Replay showcase — the DESIGNER: optimal scenarios built from real candles.
 *
 * Tom (2026-10-09): "i want to show the users OPTIMAL SCENARIOS. IT DOES NOT
 * HAVE TO BE REAL, THE CANDLES JUST MUST LOOK REAL. the patterns and price
 * action are all up to us."
 *
 * So the PATTERN is written (a Script: legs to price targets, levels price
 * must respect, touches where a wick must reach a level and turn), and every
 * CANDLE is a real one: each bar is a recorded one-minute NQ bar from the
 * library (tools/showcase/library.ts) whose body is exactly the move the
 * script needs at that bar and whose wicks fit the script's levels. The bar
 * keeps its real wick shape, volume, buy/sell split, footprint and intrabar
 * path; it is only moved in price so that it opens where the previous bar
 * closed. Donor bars come from the same time of day (the cash open's big
 * bars at the open, midday's small ones at midday), so the tape's rhythm is
 * real too. A donor may be mirrored (a down bar turned up, its bid/ask
 * aggression swapped with it) to widen the choice.
 *
 * The tool that draws on top is still the shipped study, unchanged, and the
 * example's judge still reads only the tool's own output.
 */
import { days, loadDay, resampleDay, TICK, type Cut } from "./library";

export type Beat = {
  /** price the leg ends at (absolute) */
  to: number;
  bars: number;
  /** wiggle around the path, 1 = the time of day's normal one-minute noise */
  vol?: number;
  /** how the leg gets there: steady, speeding up, slowing down */
  shape?: "linear" | "accel" | "decel";
  /** bar size preference: >1 picks bigger (busier) candles, <1 quieter ones */
  size?: number;
};
/** price must stay on one side of a level between two shown bars */
export type Wall = { from: number; to: number; level: number; side: "above" | "below"; probe?: number };
/** at shown bar i a wick must reach into a level (by `depth` ticks) and the bar close back on its side */
export type Touch = { i: number; level: number; from: "above" | "below"; depth?: [number, number] };
/** what a stage sees: the bars composed so far, the tool's own output on them, and where it stands */
export type Look = {
  s: import("../../components/engine/types").Session;
  run: import("../../components/engine/types").StudyRun;
  /** shown index the next bar will have */
  at: number;
  /** last close */
  last: number;
  /** first shown bar's index in s */
  from: number;
};
/** a stage writes the next part of the pattern after looking at what the tool drew so far
 *  (e.g. a pullback aimed at the zone the impulse just created) */
export type Stage = (look: Look) => { beats: Beat[]; walls?: Wall[]; touches?: Touch[] } | null;
export type Script = {
  seed: number;
  /** first price of the warm-up */
  start: number;
  /** close time (minute of the day) of the first SHOWN bar */
  clock: number;
  tf?: number;
  /** hidden warm-up legs (only as long as the tool needs) */
  prelude: Beat[];
  /** the shown legs, and stages that look at the tool before writing what comes next */
  beats: (Beat | Stage)[];
  /** walls / touches in SHOWN bar indices */
  walls?: Wall[];
  touches?: Touch[];
};

// ------------------------------------------------------------------ donor pool
type Donor = { day: number; i: number; body: number; up: number; dn: number; range: number; tod: number; vol: number };
/** a stretch of consecutive real bars in one session (segment donors are cut from these) */
type Run = { day: number; a: number; b: number };
type Pool = { tf: number; srcs: ReturnType<typeof resampleDay>[]; byBody: Map<number, Donor[]>; medRange: number[]; runs: Run[]; runW: number[] };
const pools = new Map<number, Pool>();

function pool(tf: number): Pool {
  let p = pools.get(tf);
  if (p) return p;
  const srcs: ReturnType<typeof resampleDay>[] = [];
  const byBody = new Map<number, Donor[]>();
  const rangesByTod: number[][] = Array.from({ length: 48 }, () => []);
  for (const day of days()) {
    const d = resampleDay(loadDay(day), tf);
    const di = srcs.length;
    srcs.push(d);
    for (let i = 0; i < d.n; i++) {
      if (!d.real[i]) continue;
      const o = d.o[i], body = Math.round((d.c[i] - o) / TICK);
      const up = Math.round((d.h[i] - Math.max(o, d.c[i])) / TICK), dn = Math.round((Math.min(o, d.c[i]) - d.l[i]) / TICK);
      const tod = Math.floor((((d.t[i] % 1440) + 1440) % 1440) / 30);
      const r = Math.round((d.h[i] - d.l[i]) / TICK);
      const dn_: Donor = { day: di, i, body, up, dn, range: r, tod, vol: d.vol[i] };
      // a bar and its mirror image are both donors (body sign flips, wicks swap)
      for (const [b, rec] of [[body, dn_], [-body, { ...dn_, body: -body, up: dn, dn: up, i: -(i + 1) }]] as [number, Donor][]) {
        let l = byBody.get(b); if (!l) { l = []; byBody.set(b, l); }
        l.push(rec);
      }
      rangesByTod[tod].push(r);
    }
  }
  const medRange = rangesByTod.map((a) => { if (!a.length) return 8; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; });
  const runs: Run[] = [];
  srcs.forEach((d, di) => {
    let a = -1;
    for (let i = 0; i <= d.n; i++) {
      const ok = i < d.n && d.real[i] && (i === 0 || a < 0 || d.t[i] - d.t[i - 1] === tf);
      if (ok && a < 0) a = i;
      else if (!ok && a >= 0) { if (i - a >= 8) runs.push({ day: di, a, b: i - 1 }); a = i < d.n && d.real[i] ? i : -1; }
    }
  });
  const runW: number[] = []; let acc = 0;
  for (const r of runs) { acc += r.b - r.a + 1; runW.push(acc); }
  p = { tf, srcs, byBody, medRange, runs, runW };
  pools.set(tf, p);
  return p;
}

// ------------------------------------------------------------------ randomness
function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  const next = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const gauss = () => { const u = Math.max(1e-12, next()), v = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  return { next, gauss };
}

// ------------------------------------------------------------------ the composer
/**
 * Compose a script into a Cut (the same shape a recorded window has), ready
 * for the study, the judge and the published file. `look` runs the study on
 * the bars composed so far (needed only by scripts with stages).
 */
export function compose(sc: Script, look?: (c: Cut) => { s: Look["s"]; run: Look["run"] }): Cut {
  const tf = sc.tf ?? 1;
  const P = pool(tf);
  const R = rng(sc.seed);
  const pre = sc.prelude.reduce((a, b) => a + b.bars, 0);
  const toT = (p: number) => Math.round(p / TICK);
  const REF = 61 * 1440; // 2026-03-03 00:00 in minutes since 2026-01-01
  const t0 = REF + sc.clock - pre * tf;
  const todOf = (i: number) => Math.floor(((((t0 + i * tf) % 1440) + 1440) % 1440) / 30);

  const out: Cut = {
    n: 0, replayFrom: pre, tf, t: [], o: [], h: [], l: [], c: [], vol: [], buy: [], sell: [],
    fp: { lo: [], bid: [], ask: [] }, path: [], pathReal: [],
    src: { days: [], contract: "designed", from: "designed", to: "" },
  };
  type W = Wall & { lv: number };
  const walls: W[] = [];
  const touches = new Map<number, Touch & { lv: number }>();
  const addWalls = (ws?: Wall[]) => { for (const w of ws ?? []) walls.push({ ...w, from: w.from + pre, to: w.to + pre, lv: toT(w.level) }); };
  const addTouches = (ts?: Touch[]) => { for (const t of ts ?? []) touches.set(t.i + pre, { ...t, lv: toT(t.level) }); };
  addWalls(sc.walls); addTouches(sc.touches);
  let open = toT(sc.start);

  /** one bar: a real candle with exactly this body, wicks that respect the levels */
  const bar = (i: number, close: number, size: number) => {
    let body = close - open;
    let hiMax = Infinity, loMin = -Infinity;
    for (const w of walls) if (i >= w.from && i <= w.to) {
      if (w.side === "below") hiMax = Math.min(hiMax, w.lv + (w.probe ?? 0));
      if (w.side === "above") loMin = Math.max(loMin, w.lv - (w.probe ?? 0));
    }
    const tc = touches.get(i);
    const want = P.medRange[todOf(i)] * size;
    const pick = (b: number, strict: boolean): Donor | null => {
      const list = P.byBody.get(b) ?? [];
      const tod = todOf(i);
      let best: Donor | null = null, bestScore = Infinity;
      for (let tries = 0; tries < 500 && list.length; tries++) {
        const d = list[Math.floor(R.next() * list.length)];
        if (strict && Math.abs(d.tod - tod) > 1) continue;
        const hi = Math.max(open, open + b) + d.up, lo = Math.min(open, open + b) - d.dn;
        if (hi > hiMax || lo < loMin) continue;
        if (tc) {
          const [dmin, dmax] = tc.depth ?? [1, 6];
          if (tc.from === "above" && !(lo <= tc.lv - dmin && lo >= tc.lv - dmax)) continue;
          if (tc.from === "below" && !(hi >= tc.lv + dmin && hi <= tc.lv + dmax)) continue;
        }
        const score = Math.abs(Math.log((d.range + 1) / (want + 1))) + R.next() * 0.35;
        if (score < bestScore) { bestScore = score; best = d; if (score < 0.12) break; }
      }
      return best;
    };
    const closeOk = (c2: number) => !walls.some((w) => i >= w.from && i <= w.to && ((w.side === "above" && c2 <= w.lv) || (w.side === "below" && c2 >= w.lv)));
    let d = closeOk(open + body) ? (pick(body, true) ?? pick(body, false)) : null;
    // no donor fits exactly: let the close give a few ticks (staying on the right side of every level)
    for (let k = 1; !d && k <= 8; k++) for (const sgn of [k, -k]) {
      if (d) break;
      const b2 = body + sgn;
      if (!closeOk(open + b2)) continue;
      d = pick(b2, k > 3 ? false : true) ?? (k > 3 ? null : pick(b2, false));
      if (d) body = b2;
    }
    if (!d) throw new Error(`no real candle fits bar ${i - pre} (body ${body} ticks)`);
    const src = P.srcs[d.day], mirror = d.i < 0, si = mirror ? -d.i - 1 : d.i;
    const flip = mirror ? -1 : 1;
    const path = src.path[si].map((q) => q * flip);
    out.t.push(t0 + i * tf);
    out.o.push(open * TICK); out.h.push((open + Math.max(...path)) * TICK); out.l.push((open + Math.min(...path)) * TICK);
    out.c.push((open + path[path.length - 1]) * TICK);
    out.vol.push(src.vol[si]);
    out.buy.push(mirror ? src.sell[si] : src.buy[si]); out.sell.push(mirror ? src.buy[si] : src.sell[si]);
    const bid = src.fp.bid[si], ask = src.fp.ask[si], srcOpen = toT(src.o[si]);
    if (!mirror) { out.fp.lo.push(src.fp.lo[si] - srcOpen + open); out.fp.bid.push(bid.slice()); out.fp.ask.push(ask.slice()); }
    else {
      const srcHi = src.fp.lo[si] + bid.length - 1;
      out.fp.lo.push(open - (srcHi - srcOpen));
      out.fp.bid.push(ask.slice().reverse()); out.fp.ask.push(bid.slice().reverse());
    }
    out.path.push(path); out.pathReal.push(1);
    open = open + path[path.length - 1];
    out.n++;
  };

  /** append real bar `si` of source `src` (mirrored if asked), opening at the current price */
  const emit = (src: Pool["srcs"][number], si: number, mirror: boolean, keepGap: number) => {
    open += keepGap;
    const flip = mirror ? -1 : 1;
    const path = src.path[si].map((q) => q * flip);
    const i = out.n;
    out.t.push(t0 + i * tf);
    out.o.push(open * TICK); out.h.push((open + Math.max(...path)) * TICK); out.l.push((open + Math.min(...path)) * TICK);
    out.c.push((open + path[path.length - 1]) * TICK);
    out.vol.push(src.vol[si]);
    out.buy.push(mirror ? src.sell[si] : src.buy[si]); out.sell.push(mirror ? src.buy[si] : src.sell[si]);
    const bid = src.fp.bid[si], ask = src.fp.ask[si], srcOpen = toT(src.o[si]);
    if (!mirror) { out.fp.lo.push(src.fp.lo[si] - srcOpen + open); out.fp.bid.push(bid.slice()); out.fp.ask.push(ask.slice()); }
    else {
      const srcHi = src.fp.lo[si] + bid.length - 1;
      out.fp.lo.push(open - (srcHi - srcOpen));
      out.fp.bid.push(ask.slice().reverse()); out.fp.ask.push(bid.slice().reverse());
    }
    out.path.push(path); out.pathReal.push(1);
    open = open + path[path.length - 1];
    out.n++;
  };

  /**
   * A REAL STRETCH for a leg: n consecutive recorded bars (same time of day)
   * whose net move is the leg's move, whose every bar respects the walls and
   * touches — so the leg carries real overlap, counter-candles, wick clusters
   * and volume rhythm, not a staircase. Returns false when none fits.
   */
  const segment = (n: number, delta: number, size: number, shape: Beat["shape"]): boolean => {
    if (n < 2) return false;
    const i0 = out.n, tod0 = todOf(i0);
    const tol = Math.max(4, Math.round(Math.abs(delta) * 0.07));
    const want = P.medRange[tod0] * size;
    const gHalf = shape === "accel" ? Math.pow(0.5, 1.7) : shape === "decel" ? 1 - Math.pow(0.5, 1.7) : 0.5;
    let best: { run: Run; st: number; flip: number; score: number } | null = null;
    const total = P.runW[P.runW.length - 1];
    for (let tries = 0; tries < 9000; tries++) {
      // a random start, weighted by stretch length
      const x = Math.floor(R.next() * total);
      let lo = 0, hi = P.runW.length - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (P.runW[m] > x) hi = m; else lo = m + 1; }
      const run = P.runs[lo];
      if (run.b - run.a + 1 < n) continue;
      const st = run.a + Math.floor(R.next() * (run.b - run.a + 2 - n));
      const src = P.srcs[run.day];
      const td = Math.floor((((src.t[st] % 1440) + 1440) % 1440) / 30);
      if (Math.abs(td - tod0) > (Math.abs(delta) > 6 * n * 4 ? 4 : 2)) continue;
      const o0 = toT(src.o[st]);
      const raw = toT(src.c[st + n - 1]) - o0;
      for (const flip of [1, -1]) {
        const net = raw * flip;
        if (Math.abs(net - delta) > tol) continue;
        // every bar on the right side of the walls, the touches met
        let ok = true, rsum = 0;
        for (let k = 0; k < n && ok; k++) {
          const i = i0 + k, si = st + k;
          let bh = (toT(src.h[si]) - o0) * flip, bl = (toT(src.l[si]) - o0) * flip, bc = (toT(src.c[si]) - o0) * flip;
          if (flip < 0) { const t = bh; bh = bl; bl = t; }
          bh += open; bl += open; bc += open;
          rsum += bh - bl;
          for (const w of walls) if (i >= w.from && i <= w.to) {
            if (w.side === "below" && (bh > w.lv + (w.probe ?? 0) || bc >= w.lv)) { ok = false; break; }
            if (w.side === "above" && (bl < w.lv - (w.probe ?? 0) || bc <= w.lv)) { ok = false; break; }
          }
          const tc = touches.get(i);
          if (ok && tc) {
            const [dmin, dmax] = tc.depth ?? [1, 6];
            if (tc.from === "above" && !(bl <= tc.lv - dmin && bl >= tc.lv - dmax && bc > tc.lv)) ok = false;
            if (tc.from === "below" && !(bh >= tc.lv + dmin && bh <= tc.lv + dmax && bc < tc.lv)) ok = false;
          }
        }
        if (!ok) continue;
        const mid = ((toT(src.c[st + Math.floor(n / 2) - 1]) - o0) * flip) / (net || 1);
        const score = Math.abs(net - delta) / tol + 1.2 * Math.abs(Math.log((rsum / n + 1) / (want + 1))) + (delta ? 0.8 * Math.abs(mid - gHalf) : 0) + 0.25 * R.next();
        if (!best || score < best.score) best = { run, st, flip, score };
      }
      if (best && best.score < 0.45 && tries > 800) break;
    }
    if (!best) return false;
    const src = P.srcs[best.run.day];
    for (let k = 0; k < n; k++) {
      const si = best.st + k;
      // keep the stretch's own small gaps between a close and the next open (real tape), first bar opens on the close
      const gap = k === 0 ? 0 : (toT(src.o[si]) - toT(src.c[si - 1])) * best.flip;
      emit(src, si, best.flip < 0, gap);
    }
    return true;
  };

  /** one leg: a bridge from the last close to the target, kept on the right side of every wall */
  const leg = (lg: Beat) => {
    const target0 = toT(lg.to), n0 = lg.bars, i00 = out.n;
    // a touch on the leg's last bar: the stretch ends just short of the level, one real candle makes the touch
    const tcEnd = touches.get(i00 + n0 - 1);
    const segN = tcEnd ? n0 - 1 : n0;
    const segTarget = tcEnd ? tcEnd.lv + (tcEnd.from === "above" ? 1 : -1) * (4 + Math.floor(R.next() * 10)) : target0;
    // the whole leg as one real stretch; failing that, two to four real stretches laid end to end
    const want = segTarget - open;
    let okSeg = false;
    if (lg.vol !== 0) {
      const mark = out.n, open0 = open;
      for (const parts of [1, 2, 3, 4]) {
        if (segN < parts * 3) break;
        let done = 0, ok = true;
        for (let k = 0; k < parts && ok; k++) {
          const nk = k === parts - 1 ? segN - done : Math.round(segN / parts);
          const g = (x: number) => lg.shape === "accel" ? Math.pow(x, 1.7) : lg.shape === "decel" ? 1 - Math.pow(1 - x, 1.7) : x;
          const aim = open0 + Math.round(want * g((done + nk) / segN));
          ok = segment(nk, aim - open, lg.size ?? 1, parts === 1 ? lg.shape : undefined);
          done += nk;
        }
        if (ok) { okSeg = true; break; }
        // roll back the partial attempt
        for (const k of ["t", "o", "h", "l", "c", "vol", "buy", "sell", "path", "pathReal"] as const) (out[k] as unknown[]).length = mark;
        out.fp.lo.length = mark; out.fp.bid.length = mark; out.fp.ask.length = mark;
        out.n = mark; open = open0;
      }
    }
    if (process.env.SEGLOG) console.error(`leg ${i00 - pre} n=${segN} move=${want} ticks ${okSeg ? "REAL STRETCH" : "fallback"}`);
    if (okSeg) {
      if (tcEnd) bar(out.n, tcEnd.lv + (tcEnd.from === "above" ? 1 : -1) * (2 + Math.floor(R.next() * 6)), lg.size ?? 1);
      return;
    }
    const target = target0, n = n0, i0 = i00;
    const steps: number[] = [];
    let walk = 0;
    for (let j = 0; j < n; j++) { walk += R.gauss() * 0.6 * P.medRange[todOf(i0 + j)] * Math.max(0.8, lg.vol ?? 1); steps.push(walk); }
    const start = open;
    for (let j = 1; j <= n; j++) {
      const f = j / n, g = lg.shape === "accel" ? Math.pow(f, 1.7) : lg.shape === "decel" ? 1 - Math.pow(1 - f, 1.7) : f;
      // aim from where the bars actually are, so a close that had to give a tick is made up later
      const planned = start + (target - start) * g + steps[j - 1] - f * steps[n - 1];
      let c = Math.round(planned);
      const i = out.n;
      for (const w of walls) if (i >= w.from && i <= w.to) {
        if (w.side === "above" && c <= w.lv) c = w.lv + 1 + Math.floor(R.next() * 3);
        if (w.side === "below" && c >= w.lv) c = w.lv - 1 - Math.floor(R.next() * 3);
      }
      const tc = touches.get(i);
      if (tc) {
        if (tc.from === "above" && c <= tc.lv) c = tc.lv + 2 + Math.floor(R.next() * 4);
        if (tc.from === "below" && c >= tc.lv) c = tc.lv - 2 - Math.floor(R.next() * 4);
      }
      if (j === n) c = target === c ? c : c; // the leg's last close is wherever the bars landed near the target
      bar(i, c, lg.size ?? 1);
    }
  };

  for (const lg of sc.prelude) leg(lg);
  for (const item of sc.beats) {
    if (typeof item === "function") {
      if (!look) throw new Error("a script with stages needs the study to look at");
      const seen = look(out);
      const next = item({ s: seen.s, run: seen.run, at: out.n - pre, last: open * TICK, from: pre });
      if (!next) throw new Error("stage declined");
      addWalls(next.walls); addTouches(next.touches);
      for (const lg of next.beats) leg(lg);
    } else leg(item);
  }
  return out;
}
