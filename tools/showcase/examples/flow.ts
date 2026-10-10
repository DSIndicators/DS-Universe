import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Touch, Wall } from "../design";
import { chapter, shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS Flow — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * The tool's rare signal is a SWEEP REVERSAL read from the footprint: a group
 * of five candles trades through the extreme of the three groups before it,
 * closes back inside, its delta flips sign against the previous group, and its
 * point of control sits in the close-side 35% of its range where the new side
 * out-traded the old. (a) BUY ▲ after a slide runs the lows, (b) SELL ▼ after
 * a climb runs the highs — each the only arrow on stage, followed by a clean
 * move away that never trades back through the swept extreme, with the FIGHT
 * nodes the group profiles mark on the way.
 *
 * The pattern is written (tools/showcase/design.ts) on the tool's own group
 * grid (five candles, anchored at the first shown bar): a slide with a pause
 * group (a wide bar, then four tight ones), the signal group (a hammer through
 * the prior low, a drive back up, two tight bars near its high — aimed at the
 * swept level the stage reads off the bars), then a move away with a flag
 * group. Every candle is a real recorded one-minute bar with its real
 * at-ask / at-bid footprint, so every profile, delta and FIGHT node is real
 * order flow. A hidden warm-up feeds ATR(14) and the volume EMA.
 *
 * ZERO FLAWS on stage: one arrow, no opposite arrow, no trade back through the
 * swept extreme, a move that keeps what it made.
 */

/** the arrow's moment, shortened — every figure is lifted from the tool's own event text */
function arrowChapter(e: StudyEvent): Chapter {
  const up = e.title.startsWith("BUY");
  const m = e.text.match(/(below|above) ([\d,]+\.\d\d), .*delta flipped from ([+−][\d,]+) to ([+−][\d,]+), and the point of control \(([\d,.]+)–([\d,.]+)\)/);
  if (!m) return chapter(e);
  const [, , lvl, d0, d1, p0, p1] = m;
  return {
    ...chapter(e),
    text: up
      ? `The group dips under ${lvl}, the low of the three groups before it, and closes back above. Delta flips ${d0} → ${d1}; the POC (${p0}–${p1}) sits in the top 35%, where buyers out-traded sellers.`
      : `The group runs over ${lvl}, the high of the three groups before it, and closes back below. Delta flips ${d0} → ${d1}; the POC (${p0}–${p1}) sits in the bottom 35%, where sellers out-traded buyers.`,
  };
}

/** a FIGHT node's moment, shortened — figures lifted from the event text */
function fightChapter(e: StudyEvent): Chapter {
  const m = e.text.match(/FIGHT node at ([\d,.]+)–([\d,.]+): ([\d,]+) contracts, ([\d.]+)σ above its average row, ([\d,]+) bought against ([\d,]+) sold/);
  if (!m) return chapter(e);
  const [, p0, p1, vol, z, b, sd] = m;
  return { ...chapter(e), text: `A FIGHT node at ${p0}–${p1}: ${vol} contracts, ${z}σ above the group's average row, ${b} bought against ${sd} sold. Both sides committed at one price.` };
}

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

function judge(run: StudyRun, s: Session, side: 1 | -1): Judged | null {
  const ev = shown(run, s);
  const R = s.replayFrom, end = s.n - 1;
  const arrows = ev.filter((e) => e.weight === 3);
  if (arrows.length !== 1) return no(arrows.length ? "more than one arrow" : "no arrow");
  const a = arrows[0];
  if ((side > 0) !== a.title.startsWith("BUY")) return no("wrong side");
  if (a.i - R < 25) return no("signal too early");
  if (end - a.i < 30) return no("too little room after the signal");
  let rng = 0;
  for (let i = R; i <= end; i++) rng += s.h[i] - s.l[i];
  rng /= end - R + 1;
  const ext = a.price!;
  let adverse = 0, best = 0, breach = -Infinity;
  for (let i = a.i + 1; i <= end; i++) {
    adverse = Math.max(adverse, side > 0 ? s.c[a.i] - s.l[i] : s.h[i] - s.c[a.i]);
    best = Math.max(best, side > 0 ? s.h[i] - s.c[a.i] : s.c[a.i] - s.l[i]);
    breach = Math.max(breach, side > 0 ? ext - s.l[i] : s.h[i] - ext);
  }
  const follow = side > 0 ? s.c[end] - s.c[a.i] : s.c[a.i] - s.c[end];
  if (breach > -1 * rng) return no("price came back near the swept extreme");
  if (follow < 4.5 * rng) return no("no follow-through");
  if (follow < 0.8 * best) return no("the move gave back");
  if (adverse > 1.2 * rng) return no("heat after the signal");
  let leg = 0;
  for (let i = Math.max(R, a.i - 35); i < a.i - 4; i++) leg = Math.max(leg, side > 0 ? s.h[i] - ext : ext - s.l[i]);
  if (leg < 4 * rng) return no("no leg into the sweep");
  const dm = a.text.match(/delta flipped from ([+−][\d,]+) to ([+−][\d,]+)/);
  const dv = (t: string) => Math.abs(+t.slice(1).replace(/,/g, ""));
  const flip = dm ? Math.min(dv(dm[1]), dv(dm[2])) : 0;
  if (flip < 60) return no("a token delta flip");

  const fights = ev.filter((e) => e.weight === 2);
  if (fights.length > 6) return no("too many FIGHT nodes");
  const before = fights.filter((e) => e.i <= a.i - 8), after = fights.filter((e) => e.i >= a.i + 8);
  const picks: StudyEvent[] = [a];
  for (const e of [...before].reverse()) if (picks.every((p) => Math.abs(p.i - e.i) >= 8) && picks.length < 3) picks.push(e);
  for (const e of after) if (picks.every((p) => Math.abs(p.i - e.i) >= 8) && picks.length < 5) picks.push(e);
  picks.sort((x, y) => x.i - y.i);
  if (picks.length < 3) return no("fewer than three moments");
  const chapters = picks.map((e) => (e === a ? arrowChapter(e) : fightChapter(e)));
  for (const c of chapters) if (c.text.length > 240) return no("moment too long");
  // one monster group that fills most of the chart's height prints its full number ladder over its neighbours
  let wHi = -Infinity, wLo = Infinity, tall = 0;
  for (let i = R; i <= end; i++) { wHi = Math.max(wHi, s.h[i]); wLo = Math.min(wLo, s.l[i]); }
  for (let g = R; g + 4 <= end; g += 5) {
    let gh = -Infinity, gl = Infinity;
    for (let i = g; i < g + 5; i++) { gh = Math.max(gh, s.h[i]); gl = Math.min(gl, s.l[i]); }
    tall = Math.max(tall, (gh - gl) / (wHi - wLo));
  }
  if (tall > 0.45) return no("a monster group");
  const score = 10 * Math.min(follow / rng, 14) - 10 * adverse / rng + Math.min(25, flip / 8) + 8 * Math.min(picks.length, 5) - 3 * Math.max(0, fights.length - 4) + 2 * Math.min(leg / rng, 10);
  return {
    score, chapters,
    note: `follow ${(follow / rng).toFixed(1)}/${(best / rng).toFixed(1)} bar-ranges (${rng.toFixed(2)} pts) · leg in ${(leg / rng).toFixed(1)} · adverse ${(adverse / rng).toFixed(1)} · flip ${flip} · fights ${before.length}/${after.length}/${fights.length} · tallest ${(tall * 100).toFixed(0)}%`,
  };
}

// ---------------------------------------------------------------- the scenarios
/**
 * `dir` 1 = BUY ▲ (a slide runs the lows), -1 = SELL ▼ (a climb runs the highs).
 * q(x) = S - dir·x: x is distance travelled in the direction of the run INTO the sweep.
 * Shown bars sit on the tool's five-candle grid (group k = shown bars 5k..5k+4).
 */
export function scenario(seed: number, dir: 1 | -1): Script {
  const S = 26560 + (seed % 7) * 15;
  const q = (x: number) => S - dir * x;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  const into = dir > 0 ? "below" : "above", back = dir > 0 ? "above" : "below";
  const lowOf = (look: Look, a: number, b: number) => {
    let m = dir > 0 ? Infinity : -Infinity;
    for (let i = a; i <= b; i++) { const v = dir > 0 ? look.s.l[look.from + i] : look.s.h[look.from + i]; m = dir > 0 ? Math.min(m, v) : Math.max(m, v); }
    return m;
  };
  const G0 = 40; // the signal group: shown bars 40..44
  const x1 = 30 + 6 * r(1), x2 = 58 + 8 * r(2), x3 = 76 + 8 * r(3);
  /** the pause group: one wide bar (size PW), then PN small bars (size PT) held in a band PA behind / PB ahead of where it closed */
  const PW = 2.4, PT = 0.8, PA = 1.5, PB = 2.5, PN = 4;
  const pause = (at: number, lvl: number, k: number) => ({
    // a wide bar, then four tight bars around where it closed (the profile's heavy rows: a FIGHT node)
    beats: [{ to: lvl, bars: 5 - PN, size: PW, vol: 0.1 }, { to: lvl + dir * (1.5 + 2 * r(k)), bars: PN, vol: 0.2, size: PT }] as Beat[],
    walls: [{ from: at + 5 - PN, to: at + 4, level: lvl - dir * PA, side: back, probe: 0 }, { from: at + 5 - PN, to: at + 4, level: lvl + dir * PB, side: into, probe: 0 }] as Wall[],
  });
  const signal = (look: Look) => {
    // the low of the three groups before the signal group, as the bars made it
    const lo = lowOf(look, G0 - 15, G0 - 1);
    const top = lo + dir * (19 + 5 * r(10));
    const beats: Beat[] = [
      { to: lo + dir * (2.5 + 1.5 * r(11)), bars: 1, size: 1.6, vol: 0.1 },  // the sweep: a wick through the low, closed back above
      { to: top - dir * 2, bars: 1, size: 1.8, vol: 0.1 },                   // the drive back
      { to: top, bars: 3, size: 0.6, vol: 0.15 },                           // three tight bars near the high
    ];
    const touches: Touch[] = [{ i: G0, level: lo, from: back, depth: [6, 22] }];
    const walls: Wall[] = [{ from: G0 + 2, to: G0 + 4, level: top - dir * 5, side: back, probe: 0 }];
    return { beats, walls, touches };
  };
  const after = (look: Look) => {
    const ev = look.run.events.filter((e) => e.i >= look.from && e.weight === 3);
    if ((ev.length !== 1 || (dir > 0) !== ev[0].title.startsWith("BUY") || ev[0].i !== look.from + G0 + 4)) return null;
    const ext = ev[0].price!, c0 = look.last, at = look.at;
    const y = (x: number) => c0 + dir * x;
    const f1 = 25 + 6 * r(20);
    const fl = pause(at + 10, y(f1), 21);
    const beats: Beat[] = [
      { to: y(9 + 4 * r(22)), bars: 4, vol: 0.5, size: 1.0 },
      { to: y(5 + 2 * r(23)), bars: 2, vol: 0.4, size: 0.8 },
      { to: y(f1 - 6), bars: 4, vol: 0.5, size: 1.05, shape: "accel" },
      ...fl.beats,
      { to: y(f1 + 22 + 6 * r(24)), bars: 6 + Math.round(2 * r(25)), vol: 0.55, size: 1.1 },
      { to: y(f1 + 16 + 4 * r(26)), bars: 3, vol: 0.45, size: 0.85 },
      { to: y(f1 + 46 + 10 * r(27)), bars: 9 + Math.round(3 * r(28)), vol: 0.55, size: 1.05, shape: "decel" },
    ];
    // never back near the swept extreme
    const walls: Wall[] = [...fl.walls, { from: at, to: at + 60, level: ext + dir * 6, side: back, probe: 0 }];
    return { beats, walls };
  };
  const p1 = pause(15, q(x1), 30);
  return {
    seed, start: S + dir * 2, clock: 11 * 60 + 36 + 5 * Math.round(4 * r(31)),
    prelude: [
      { to: S + dir * 24, bars: 40, vol: 0.6, size: 0.9 }, { to: S - dir * 8, bars: 45, vol: 0.6, size: 0.9 },
      { to: S + dir * 16, bars: 35, vol: 0.55, size: 0.9 }, { to: S + dir * 2, bars: 30, vol: 0.5, size: 0.9 },
    ],
    beats: [
      { to: q(12 + 4 * r(4)), bars: 6, vol: 0.55, size: 0.95 },
      { to: q(5 + 3 * r(5)), bars: 4, vol: 0.45, size: 0.85 },
      { to: q(x1 - 8), bars: 5, vol: 0.55, size: 1.05, shape: "accel" },
      ...p1.beats,                                                               // group 3: the pause
      { to: q(x2), bars: 7, vol: 0.55, size: 1.05 },
      { to: q(x2 - 8 - 3 * r(6)), bars: 4, vol: 0.45, size: 0.85 },
      { to: q(x3), bars: 9, vol: 0.5, size: 1.0, shape: "accel" },              // groups 4..7: the run into the low
      signal,
      after,
    ],
    walls: [...p1.walls],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Sweep low",
    title: "Sellers run the lows, buyers take the group back",
    premise: "Watch the group profiles as the market slides. One group stabs under the low of the three before it, closes back above, and its heaviest row sits near the top where buyers out-traded sellers. That is the BUY ▲.",
    design: (seed) => scenario(seed, 1),
    seeds: Number(process.env.SEEDS ?? 400),
    judge: (run, s) => judge(run, s, 1),
  },
  {
    id: "b",
    tab: "Sweep high",
    title: "Buyers run the highs, sellers take the group back",
    premise: "Watch the group profiles as the market climbs. One group pokes over the high of the three before it, closes back below, and its heaviest row sits near the bottom where sellers out-traded buyers. That is the SELL ▼.",
    design: (seed) => scenario(seed, -1),
    seeds: Number(process.env.SEEDS ?? 400),
    judge: (run, s) => judge(run, s, -1),
  },
];
