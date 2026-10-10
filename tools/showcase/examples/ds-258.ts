import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Script, Touch, Wall } from "../design";
import { shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS 258 — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * The tool calculates nothing: it draws the 00 / 20 / 50 / 80 map of every
 * 100-point block, and the replay narrates the map being READ (the study's own
 * events): a close through a 00 or a 50, and a bar that reaches a 00 and closes
 * at least 5 points back. The map is a round-number grid, so the pattern is
 * written ON the grid (tools/showcase/design.ts): price turns at a gold 00,
 * closes through the platinum 50 and the next 00, and every level it closes
 * through holds on the way back — the 50 on the pullback, the 00 on the retest.
 * Every candle is a real recorded one-minute NQ bar.
 *
 * ZERO FLAWS on stage: nothing is closed through and given back, nothing is
 * narrated that the script did not write, every turn moves away.
 *
 *  (a) up the map: turn at a 00 below, above the 50, above the next 00, the 00 holds.
 *  (b) down the map: the mirror image.
 */

const PRE = 40;
const rnd = (seed: number) => (k: number) => (((seed * 7919 + k * 104729) % 1000) + 1000) % 1000 / 1000;
const fmt = (p: number) => p.toLocaleString("en-US");

// ------------------------------------------------------------------ the scenario
function scenario(seed: number, dir: 1 | -1): Script {
  const r = rnd(seed);
  const L = dir > 0 ? 26300 + 100 * (seed % 4) : 26700 - 100 * (seed % 4); // the 00 the story starts at
  const p = (x: number) => L + dir * x;
  const toward: "above" | "below" = dir > 0 ? "above" : "below"; // the side price holds on
  const against: "above" | "below" = dir > 0 ? "below" : "above";
  const beats: Beat[] = [], walls: Wall[] = [], touches: Touch[] = [];
  let i = 0;
  const go = (x: number, bars: number, o: Partial<Beat> = {}) => { beats.push({ to: p(x), bars, vol: 0.5, ...o }); i += bars; return i - 1; };
  const hold = (from: number, to: number, x: number) => walls.push({ from, to, level: p(x), side: toward, probe: 0 });
  const cap = (from: number, to: number, x: number) => walls.push({ from, to, level: p(x), side: against, probe: 0 });
  const v = (k: number, a: number, b: number) => a + (b - a) * r(k);
  const n = (k: number, a: number, b: number) => Math.round(v(k, a, b));

  // 1. into the 00: the turn
  go(v(1, 9, 14), n(2, 7, 10), { vol: 0.55 });
  const t1 = go(v(3, 6.5, 8.5), n(4, 3, 4), { vol: 0.4 });
  touches.push({ i: t1, level: L, from: toward, depth: [0, 4] });
  hold(-PRE, t1 - 1, 3);
  hold(t1 + 1, t1 + 2, 0.25);
  // 2. the rally through the 50
  go(v(5, 26, 34), n(6, 8, 11), { shape: "decel", vol: 0.55 });
  go(v(7, 20, 25), n(8, 3, 4), { vol: 0.4 });
  const a1 = go(v(9, 43.5, 46.5), n(10, 5, 7));
  const c1 = go(v(37, 53.5, 56.5), 1, { size: 1.4 }); // the close through: one decisive bar
  const x1 = go(v(11, 59, 64), n(12, 1, 2), { size: 1.2, vol: 0.2 });
  hold(t1 + 3, a1, 4);
  hold(c1 + 1, x1, 50.5); // the bars after the close through do not wick back
  cap(-PRE, a1, 49.75);
  // 3. the pullback holds at the 50
  go(v(13, 66, 72), n(14, 3, 5), { vol: 0.45 });
  const r1 = go(v(15, 53.5, 57), n(16, 6, 9), { vol: 0.5 });
  touches.push({ i: r1, level: p(51), from: toward, depth: [0, 3] });
  hold(x1 + 1, r1 + 30, 50.25);
  // 4. the rally through the next 00
  go(v(17, 80, 86), n(18, 7, 9), { shape: "decel", vol: 0.55 });
  go(v(19, 75, 79), n(20, 3, 4), { vol: 0.4 });
  const a2 = go(v(21, 93, 96), n(22, 5, 7));
  const c2 = go(v(38, 103.5, 106.5), 1, { size: 1.4 });
  const x2 = go(v(23, 109, 114), n(24, 1, 2), { size: 1.2, vol: 0.2 });
  cap(x1 + 1, a2, 99.75);
  hold(c2 + 1, x2, 100.5);
  // 5. the retest: the 00 it closed through holds
  go(v(25, 118, 124), n(26, 3, 5), { vol: 0.45 });
  const t2 = go(v(27, 106.5, 108.5), n(28, 6, 8), { vol: 0.5 });
  touches.push({ i: t2, level: p(100), from: toward, depth: [0, 4] });
  hold(x2 + 1, t2 - 1, 103);
  hold(t2 + 1, t2 + 2, 100.25);
  // 6. away from it
  go(v(29, 128, 138), n(30, 10, 13), { shape: "decel", vol: 0.55 });
  const end = go(v(31, 124, 131), n(32, 4, 6), { vol: 0.35, size: 0.8 });
  hold(t2 + 3, end + 2, 104);
  cap(x2 + 1, end + 2, 146);

  const start = p(v(33, 28, 36));
  const prelude: Beat[] = [
    { to: p(v(34, 20, 26)), bars: 15, vol: 0.45, size: 0.8 },
    { to: p(v(35, 34, 40)), bars: 13, vol: 0.45, size: 0.8 },
    { to: p(v(36, 24, 30)), bars: 12, vol: 0.45, size: 0.8 },
  ];
  walls.push({ from: -PRE, to: -1, level: p(12), side: toward, probe: 0 }, { from: -PRE, to: -1, level: p(44), side: against, probe: 0 });
  return { seed, start, clock: 11 * 60 + 31, prelude, beats, walls, touches };
}

// ------------------------------------------------------------------ moments
const P = "(\\d{1,3}(?:,\\d{3})*)";
function retell(e: StudyEvent, s: Session, prev?: StudyEvent): Chapter {
  let text = e.text.replace(/^\d\d:\d\d — /, "");
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (e.title === "TURNED AT THE 00" && prev && prev.price === e.price) {
    const up = s.c[e.i] > e.price!;
    text = `Back at ${fmt(e.price!)}, the gold 00 it closed ${up ? "above" : "below"} ${e.i - prev.i} bars earlier: the bar reaches it and closes back ${up ? "above" : "below"} it, ${Math.abs(s.c[e.i] - e.price!).toFixed(2)} points clear.`;
  } else if (e.title === "TURNED AT THE 00") {
    const up = s.c[e.i] > e.price!;
    const m = new RegExp(`reached ${P}`).exec(e.text);
    text = `The bar reached ${m ? m[1] : fmt(e.price!)}, the gold 00 that starts the block, and closed back ${up ? "above" : "below"} it, ${Math.abs(s.c[e.i] - e.price!).toFixed(2)} points clear.`;
  }
  if (text.length > 240) throw new Error(`moment too long (${text.length}): ${text}`);
  return { i: e.i, title: e.title, text, tone: e.tone, price: e.price };
}

// ------------------------------------------------------------------ the judge (ZERO FLAWS)
export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

function judge(run: StudyRun, s: Session, dir: 1 | -1): Judged | null {
  const a = s.replayFrom, z = s.n - 1;
  const ev = shown(run, s);
  const W = dir > 0 ? "ABOVE" : "BELOW";
  const want = ["TURNED AT THE 00", `${W} THE 50`, `${W} THE 00`, "TURNED AT THE 00"];
  if (ev.length !== 4 || ev.some((e, j) => e.title !== want[j])) return no(`not the story: ${ev.map((e) => e.title).join(" / ")}`);
  const [t1, x1, x2, t2] = ev;
  const L = t1.price!;
  if (x1.price !== L + dir * 50 || x2.price !== L + dir * 100 || t2.price !== L + dir * 100) return no("the levels are not one block walk");
  if (ev[0].i - a < 8) return no("a moment on the first bars");
  if (z - t2.i < 12) return no("last moment too close to the end");
  for (let j = 1; j < 4; j++) if (ev[j].i - ev[j - 1].i < 8) return no("moments crowded");
  const beyond = (i: number, lv: number) => dir * (s.c[i] - lv); // > 0: on the walk's side
  // every level the walk closes through is never closed back through, and no wick goes back past it
  // (except the 00 retest bar, at most a point)
  for (const [x, lv] of [[x1.i, x1.price!], [x2.i, x2.price!]] as [number, number][]) {
    let ext = 0;
    for (let i = x + 1; i <= z; i++) {
      if (beyond(i, lv) <= 0) return no("a cross given back");
      const wick = dir > 0 ? s.l[i] - lv : lv - s.h[i];
      if (wick < 0 && !(i === t2.i && lv === t2.price && wick >= -1)) return no("a wick back through a crossed level");
      if (i <= x + 15) ext = Math.max(ext, dir * ((dir > 0 ? s.h[i] : s.l[i]) - lv));
    }
    if (ext < 12) return no("a cross with no follow-through");
    if (beyond(x, lv) < 2) return no("a hairline close through");
  }
  // each turn: closes back at least 5 points clear (the tool's rule) and moves 18+ points away within 15 bars, never back
  let score = 0;
  for (const t of [t1, t2]) {
    let away = 0;
    for (let i = t.i + 1; i <= z; i++) {
      if (beyond(i, t.price!) <= 0) return no("a turn that did not hold");
      if (i <= t.i + 15) away = Math.max(away, dir * ((dir > 0 ? s.h[i] : s.l[i]) - t.price!));
    }
    if (away < 18) return no("a turn with no follow-through");
    const poke = dir > 0 ? t.price! - s.l[t.i] : s.h[t.i] - t.price!;
    if (poke > 1) return no("the turn's wick runs the 00");
    score += Math.min(30, away);
  }
  // nothing before the turn closes on the wrong side of the first 00; the visible warm-up stays clear
  for (let i = Math.max(0, a - 30); i < t1.i; i++) if (beyond(i, L) <= 3) return no("near the 00 before the turn");
  let wide = 0;
  for (let i = a; i <= z; i++) if (s.h[i] - s.l[i] > 30) wide++;
  if (wide > 2) return no("outsized bars");
  const net = dir * (s.c[z] - s.c[a]);
  score += Math.min(net, 130) * 0.3 - 8 * wide;
  const chapters = ev.map((e, j) => retell(e, s, j === 3 ? x2 : undefined));
  return { score, chapters, note: `00 ${fmt(L)} · net ${net.toFixed(2)} · wide ${wide}` };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Up the map",
    title: "Price turns at a 00 and climbs the map",
    premise:
      "Price turns at a gold 00, then closes above the platinum 50 and the next 00. Watch each level it closes above hold on the way back: the 50 on the pullback, the 00 on the retest.",
    design: (seed) => scenario(seed, 1),
    seeds: 250,
    judge: (run, s) => judge(run, s, 1),
  },
  {
    id: "b",
    tab: "Down the map",
    title: "Price turns at a 00 and walks down the map",
    premise:
      "Price turns at a gold 00, then closes below the platinum 50 and the next 00. Watch each level it closes below hold on the way back: the 50 on the bounce, the 00 on the retest.",
    design: (seed) => scenario(seed, -1),
    seeds: 250,
    judge: (run, s) => judge(run, s, -1),
  },
];
