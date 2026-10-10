import type { ExampleDef, Judged } from "../build";
import type { Beat, Script, Wall } from "../design";
import { shown } from "../build";
import type { Session, StudyRun } from "../../../components/engine/types";

/**
 * DS Adaptive Price Line — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * The tool has no events: it draws the last-price line from the newest candle
 * to the axis (bead, fade, countdown chip) and nothing a bar changes. So the
 * examples have no moments (the side panel shows the premise) and the pattern
 * is written for the read (tools/showcase/design.ts): an orderly trend in
 * measured steps — impulse, shallow pullback, impulse — that settles inside
 * its range, so the line, its bead and the chip sit in open chart at the right
 * edge while the replay plays and every candle is clear of them. Every candle
 * is a real recorded one-minute NQ bar.
 *
 *  (a) an advance; (b) a decline — the line seated on the newest candle either way.
 */

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

const rnd = (seed: number) => (k: number) => (((seed * 7919 + k * 104729) % 1000) + 1000) % 1000 / 1000;

// ------------------------------------------------------------------ the scenario
function scenario(seed: number, dir: 1 | -1): Script {
  const r = rnd(seed);
  const v = (k: number, a: number, b: number) => a + (b - a) * r(k);
  const n = (k: number, a: number, b: number) => Math.round(v(k, a, b));
  const S = 26440 + (seed % 9) * 15;
  let p = S;
  const beats: Beat[] = [];
  const go = (dx: number, bars: number, o: Partial<Beat> = {}) => { p += dir * dx; beats.push({ to: p, bars, vol: 0.55, ...o }); };
  go(v(1, 1, 5), n(2, 7, 10), { vol: 0.35, size: 0.8 });                          // a quiet start
  go(v(3, 30, 40), n(4, 10, 13), { shape: "accel" });                               // step 1
  go(-v(5, 11, 17), n(6, 7, 10), { vol: 0.5, size: 0.9 });                          // a measured pullback
  go(v(7, 30, 42), n(8, 11, 15));                                                   // step 2
  go(-v(9, 9, 15), n(10, 6, 9), { vol: 0.5, size: 0.9 });
  go(v(11, 24, 34), n(12, 11, 15), { shape: "decel" });                             // step 3
  go(-v(13, 15, 22), n(14, 9, 12), { vol: 0.45, size: 0.85 });                      // settles under the extreme
  go(v(15, -2, 4), n(16, 5, 8), { vol: 0.35, size: 0.8 });
  const prelude: Beat[] = [
    { to: S - dir * 8, bars: 14, vol: 0.45, size: 0.8 },
    { to: S + dir * 3, bars: 12, vol: 0.45, size: 0.8 },
    { to: S, bars: 10, vol: 0.4, size: 0.8 },
  ];
  // the start stays quiet: nothing trades back below where the story starts
  const walls: Wall[] = [{ from: -12, to: 12, level: S - dir * 5, side: dir > 0 ? "above" : "below", probe: 0 }];
  return { seed, start: S, clock: 11 * 60 + 36, prelude, beats, walls };
}

// ------------------------------------------------------------------ the judge
function judgeTrend(run: StudyRun, s: Session, dir: 1 | -1): Judged | null {
  if (shown(run, s).length) return no("the tool emitted an event"); // it has none; anything else would be a bug
  const a = s.replayFrom, z = s.n - 1;
  let hi = -Infinity, lo = Infinity, peak = -Infinity, dd = 0, big = 0, rngSum = 0;
  for (let i = a; i <= z; i++) {
    hi = Math.max(hi, s.h[i]); lo = Math.min(lo, s.l[i]);
    const c = dir * s.c[i];
    peak = Math.max(peak, c); dd = Math.max(dd, peak - c);
    rngSum += s.h[i] - s.l[i];
  }
  const avg = rngSum / (z - a + 1);
  for (let i = a; i <= z; i++) if (s.h[i] - s.l[i] > Math.max(24, 3.2 * avg)) big++;
  const span = hi - lo;
  if (span < 60) return no("too little travel");
  // the last candle settles inside the stage, short of the extreme, clear of the frame's edge
  const at = dir > 0 ? (s.c[z] - lo) / span : (hi - s.c[z]) / span;
  if (at < 0.6 || at > 0.82) return no("last close not settled inside the range");
  const early = dir > 0 ? s.c[a] - lo : hi - s.c[a];
  if (early > 0.1 * span) return no("an early move against the trend");
  if (big > 0) return no("outsized bars");
  if (dd > 0.32 * span) return no("pullback too deep");
  // orderly: the extreme is made late, and the last bars do not lean against it
  let exBar = a;
  for (let i = a; i <= z; i++) if ((dir > 0 ? s.h[i] >= hi : s.l[i] <= lo)) { exBar = i; break; }
  if (exBar - a < 0.6 * (z - a)) return no("the extreme comes too early");
  if (z - exBar < 10) return no("ends on the extreme");
  const net = dir * (s.c[z] - s.c[a]);
  const score = (net / span) * 100 - 60 * (dd / span) - Math.abs(at - 0.7) * 60 - Math.max(0, avg - 9) * 3;
  return { score, chapters: [], note: `span ${span.toFixed(2)} net ${net.toFixed(2)} dd ${dd.toFixed(2)} at ${at.toFixed(2)} avg ${avg.toFixed(2)}` };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "On the candle",
    title: "The price line stays seated on the newest candle",
    premise:
      "Watch the amber line start at the forming candle's bead and fade toward the price axis as each bar builds, with the chip beside it counting down to the bar's close: amber at 10 to 8 seconds, red at 3 to 1.",
    design: (seed) => scenario(seed, 1),
    seeds: 200,
    judge: (run, s) => judgeTrend(run, s, 1),
  },
  {
    id: "b",
    tab: "Stepping down",
    title: "Down the steps, the line rides the live price",
    premise:
      "As the market steps lower, the line moves with every price change, seated on the newest candle and running clear to the axis. The chip counts each bar down to its close: amber at 10 to 8 seconds, red at 3 to 1.",
    design: (seed) => scenario(seed, -1),
    seeds: 200,
    judge: (run, s) => judgeTrend(run, s, -1),
  },
];
