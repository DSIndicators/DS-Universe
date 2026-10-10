import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Touch, Wall } from "../design";
import { shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS Iceberg — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * Each example follows ONE level the tool confirms on stage: a move runs into
 * a price, heavy bars with long rejecting wicks are turned away there twice,
 * the tool confirms the level (cyan / magenta once its own 1-minute footprint
 * finds a heavy node with the other side absorbed), and every return to it is
 * turned away again while the move leaves it behind.
 * (a) an ICE BID under a sell-off, (b) an ICE OFFER over a rally.
 *
 * The pattern is written (tools/showcase/design.ts): the second test is aimed
 * at the first test bar's own extreme, and each return is aimed at the level
 * price the TOOL printed (a stage reads the birth event before writing the
 * rally and the pullbacks). Every candle is a real recorded one-minute bar
 * with its real footprint and bid/ask split, so the tool's node and side
 * reading come from real order flow. A hidden warm-up above (a) / below (b)
 * the story feeds ATR(14) and the 20-bar volume average; a level whose first
 * test lies in it is never drawn (the study's display gate, DEVIATION 7).
 *
 * ZERO FLAWS on stage (Tom, 2026-10-09): exactly one level is drawn, it never
 * breaks, every re-test closes rejected, no other level appears.
 */

const num = (t: string, re: RegExp) => { const m = t.match(re); return m ? m[1] : null; };
const strip = (t: string) => t.replace(/^\d{1,2}:\d{2} — /, "");
const statusOf = (run: StudyRun, k: number) => Object.fromEntries((run.status?.(k, null) ?? []).map((r) => [r.label, r.value]));
const readOf = (run: StudyRun, k: number) => Object.fromEntries((run.readout?.(k) ?? []).map((r) => [r.label, r.value]));
const liveCount = (run: StudyRun, k: number) => +((/^(\d+)/.exec(statusOf(run, k)["Live levels"] ?? "") ?? [])[1] ?? 0);
const atrAt = (run: StudyRun, k: number) => Number(readOf(run, k)["ATR (14)"] ?? NaN);
const isBirth = (e: StudyEvent) => e.title === "ICE BID" || e.title === "ICE OFFER";

/** a moment's text, rewritten short from the event's own words and numbers (no clock time) */
function momentText(e: StudyEvent): string {
  const t = strip(e.text);
  const lvl = num(t, /at ([\d,]+\.\d\d)/) ?? "";
  if (isBirth(e)) {
    const bid = e.title === "ICE BID";
    const n = num(t, /: (\d+) test bars/), rej = num(t, /, (\d+) closed rejected/);
    const z = num(t, /\(z ([\d.]+),/), vol = num(t, /, ([\d.]+[KM]?) traded\)/), pct = num(t, /\((\d+)% of the side reading\)/);
    const wick = bid ? "lower" : "upper", who = bid ? "sellers" : "buyers";
    if (z) return `${n} ${wick}-wick test bars on at least average volume within half an ATR, ${rej} closed rejected. The footprint finds a heavy node at ${lvl} (z ${z}, ${vol} traded), ${who} absorbed: ${pct}% of the side reading.`;
    return `${n} ${wick}-wick test bars on at least average volume within half an ATR, ${rej} closed rejected. No footprint volume in the band yet, so the bar engine alone confirms ${lvl}.`;
  }
  if (e.title === "TESTING") {
    const bid = /ICE BID/.test(t);
    const vr = num(t, /on ([\d.]+)× average volume/), n = num(t, /Test (\d+)×/);
    const closed = /not a rejection/.test(t) ? `closed ${bid ? "down" : "up"}, not a rejection` : /flat at its open/.test(t) ? "closed flat at its open, a rejection" : `closed ${bid ? "up" : "down"}, a rejection`;
    const flow = /turns (cyan|magenta)/.test(t)
      ? ` The footprint now shows a heavy node here (z ${num(t, /\(z ([\d.]+)\)/)}): the level turns ${bid ? "cyan" : "magenta"}.`
      : "";
    return `Back at ${lvl}: a long ${bid ? "lower" : "upper"} wick on ${vr}× average volume, ${closed}. Test ${n}×.${flow}`;
  }
  return t.length > 240 ? t.slice(0, 237) + "…" : t;
}

// ---------------------------------------------------------------- the judge
export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

function judgeHold(run: StudyRun, s: Session, bid: boolean): Judged | null {
  const name = bid ? "ICE BID" : "ICE OFFER";
  const strong = bid ? "strongBull" : "strongBear";
  const sg = bid ? 1 : -1;
  const R = s.replayFrom, end = s.n - 1;
  const ev = shown(run, s);
  // ZERO FLAWS: one level, born on stage, never broken, nothing else drawn
  const births = ev.filter(isBirth);
  if (births.length !== 1) return no(births.length ? "more than one level drawn" : "no level drawn");
  const birth = births[0];
  if (birth.title !== name) return no("wrong side");
  if (ev.some((e) => e.title === "BROKEN")) return no("a level broke");
  if (birth.i - R < 12) return no("born too early");
  const level = birth.price!;
  const tests = ev.filter((e) => e.title === "TESTING");
  if (tests.some((e) => e.price !== level)) return no("a test of another level");
  if (tests.length < 2) return no("fewer than two returns");
  if (tests.some((e) => /not a rejection/.test(e.text))) return no("a return that did not reject");
  const keep = [birth, ...tests];
  let gap = 99;
  for (let q = 1; q < keep.length; q++) gap = Math.min(gap, keep[q].i - keep[q - 1].i);
  if (gap < 8) return no("moments crowded");
  const last = tests[tests.length - 1];
  if (end - last.i < 15) return no("too little room after the last return");
  const atr = atrAt(run, last.i);
  if (!(atr > 0)) return no("no ATR");
  // the level is never closed through at all, and price leaves it for good
  let worst = 0;
  for (let k = birth.i; k <= end; k++) worst = Math.max(worst, -sg * (s.c[k] - level));
  if (worst > 0) return no("a close beyond the level");
  let away0 = Infinity;
  for (let q = 1; q < keep.length; q++) {
    let m = 0;
    for (let k = keep[q - 1].i + 1; k < keep[q].i; k++) m = Math.max(m, sg * (s.c[k] - level));
    away0 = Math.min(away0, m / atr);
  }
  if (away0 < 1.5) return no("a return without a real move away");
  const away = sg * (s.c[end] - level);
  let ext = 0;
  for (let k = last.i; k <= end; k++) ext = Math.max(ext, sg * ((bid ? s.h[k] : s.l[k]) - level));
  if (away < 4 * atr) return no("price did not leave the level");
  if (away < 0.8 * ext) return no("the move gave back");
  let crowd = 0;
  for (let k = birth.i; k <= end; k++) crowd = Math.max(crowd, liveCount(run, k));
  if (crowd > 1) return no("other live levels");
  const cyan = birth.tone === strong || tests.some((e) => e.tone === strong);
  const cyanAtBirth = birth.tone === strong;
  if (ev.length !== keep.length) return no("other narration");

  const chapters: Chapter[] = keep.slice(0, 5).map((e) => ({ i: e.i, title: e.title, text: momentText(e), tone: e.tone, price: e.price }));
  for (const c of chapters) if (c.text.length > 240) return no("moment too long");
  const score = (cyanAtBirth ? 50 : cyan ? 30 : 0) + 20 * Math.min(tests.length, 3) + 8 * Math.min(away / atr, 8) + 4 * Math.min(away0, 4) + Math.min(gap, 20) - 0.8 * Math.max(0, birth.i - R - 30);
  return {
    score, chapters,
    note: `level ${level} ${birth.tone} · returns ${tests.length} · away ${(away / atr).toFixed(1)}/${(ext / atr).toFixed(1)} ATR · return ${away0.toFixed(1)} ATR`,
  };
}

// ---------------------------------------------------------------- the scenarios
/**
 * `dir` 1 = ICE BID (a sell-off runs into the level from above), -1 = ICE OFFER
 * (a rally runs into it from below). Prices are written as distance from the
 * level on the side price trades: p(x) = L + dir·x.
 */
export function scenario(seed: number, dir: 1 | -1): Script {
  const L = 26480 + (seed % 7) * 15;
  const p = (pts: number) => L + dir * pts;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  const from = dir > 0 ? "above" : "below";
  const side = from, beyond = dir > 0 ? "below" : "above";
  const TK = 0.25;
  /** OFF: where a test bar opens off the level (the first test OFF1); GAP: how close other bars may trade to it;
   *  SZ / SZ1: bar size preference of the test bars (bigger = busier); TRIES: tests written before the level must be born */
  const OFF = 9, OFF1 = 12, CAP = 99, SZ1 = 2.4, SZ = 1.8, GAP = 7.5, TRIES = 3;
  let level = NaN;          // the price the tool printed
  let phase = 0;            // extra tests written so far
  const ext = (look: Look, i: number) => (dir > 0 ? look.s.l[look.from + i] : look.s.h[look.from + i]);
  /** a heavy test bar at shown index i: it opens ~OFF points off the level e, its wick reaches e (within `depth`
   *  ticks), and it closes a little further off than it opened — a hammer under a bid, a shooting star over an offer */
  const shot = (i: number, e: number, depth: [number, number], k: number, size = SZ, off = OFF) => {
    const close = e + dir * (off + 1.25 + 0.25 * Math.round(3 * r(k)));
    return {
      beat: { to: close, bars: 1, size, vol: 0.1 } as Beat,
      touch: { i, level: e, from, depth } as Touch,
      wall: { from: i, to: i, level: close + dir * CAP, side: beyond, probe: 0 } as Wall,
    };
  };
  /** between two tests: a bounce off the level and back to ~OFF points off it, never trading within GAP of it */
  const bounce = (at: number, e: number, k: number) => {
    const u = 3 + Math.round(r(k)), d = 2 + Math.round(r(k + 1));
    return {
      beats: [{ to: e + dir * (20 + 6 * r(k + 2)), bars: u, vol: 0.4, size: 0.95 }, { to: e + dir * (OFF - 0.25 * Math.round(4 * r(k + 3))), bars: d, vol: 0.3, size: 1.0 }] as Beat[],
      walls: [{ from: at, to: at + u + d - 1, level: e + dir * GAP, side, probe: 0 }] as Wall[],
      n: u + d,
    };
  };
  const a1 = 7 + Math.round(3 * r(1)), a2 = 3 + Math.round(2 * r(2)), a3 = 7 + Math.round(3 * r(3)), a4 = 4 + Math.round(2 * r(4));
  const t1 = a1 + a2 + a3 + 2 + a4;
  const bornNow = (look: Look) => look.run.events.find((e) => e.i >= look.from + t1 && e.title === (dir > 0 ? "ICE BID" : "ICE OFFER") && Math.abs(e.price! - ext(look, t1)) <= 4);
  const nextTest = (look: Look, k: number) => {
    const e1 = ext(look, t1), b = bounce(look.at, e1, k), sh = shot(look.at + b.n, e1, [-4, 4], k + 5);
    return { beats: [...b.beats, sh.beat], walls: [...b.walls, sh.wall], touches: [sh.touch] };
  };
  /** after a test: either the level is confirmed (write the rest of the story) or one more test */
  const after = (look: Look) => {
    if (!Number.isNaN(level)) return { beats: [] };
    const born = bornNow(look);
    if (!born) {
      if (phase >= TRIES - 1) return null;
      phase++;
      return nextTest(look, 50 + 10 * phase);
    }
    level = Math.round(born.price! / TK) * TK;
    const at = look.at;
    const r1 = 8 + Math.round(3 * r(14)), q1 = 9 + Math.round(3 * r(15));
    const r2a = 6 + Math.round(2 * r(16)), r2b = 3, r2c = 4 + Math.round(2 * r(17)), q2 = 12 + Math.round(4 * r(18));
    const f1 = 6 + Math.round(2 * r(19)), f2 = 3, f3 = 9 + Math.round(3 * r(20));
    const T2 = at + r1 + q1, T3 = T2 + 1 + r2a + r2b + r2c + q2;
    const hi1 = level + dir * (26 + 8 * r(21));
    const hi2 = level + dir * (46 + 12 * r(22));
    const s2 = shot(T2, level, [-6, 4], 23), s3 = shot(T3, level, [-6, 4], 26);
    const beats: Beat[] = [
      { to: hi1, bars: r1, vol: 0.6, size: 1.0, shape: "decel" },
      { to: level + dir * (17 + 4 * r(40)), bars: q1 - 3, vol: 0.55, size: 0.85 },
      { to: level + dir * OFF, bars: 3, vol: 0.3, size: 1.0 },
      s2.beat,
      { to: level + dir * (32 + 6 * r(24)), bars: r2a, vol: 0.6, size: 1.0 },
      { to: level + dir * (26 + 4 * r(25)), bars: r2b, vol: 0.45, size: 0.85 },
      { to: hi2, bars: r2c, vol: 0.55, size: 1.0, shape: "decel" },
      { to: level + dir * (17 + 4 * r(41)), bars: q2 - 3, vol: 0.55, size: 0.85 },
      { to: level + dir * OFF, bars: 3, vol: 0.3, size: 1.0 },
      s3.beat,
      { to: level + dir * (32 + 6 * r(27)), bars: f1, vol: 0.55, size: 1.1, shape: "accel" },
      { to: level + dir * (26 + 4 * r(28)), bars: f2, vol: 0.45, size: 0.85 },
      { to: level + dir * (66 + 14 * r(29)), bars: f3, vol: 0.55, size: 1.05, shape: "decel" },
    ];
    const clear = (a: number, b: number): Wall => ({ from: a, to: b, level: level + dir * GAP, side, probe: 0 });
    const walls: Wall[] = [clear(at, T2 - 1), clear(T2 + 1, T3 - 1), clear(T3 + 1, T3 + f1 + f2 + f3 + 2), s2.wall, s3.wall];
    return { beats, walls, touches: [s2.touch, s3.touch] };
  };

  const s1 = shot(t1, L, [1, 10], 34, SZ1, OFF1);
  return {
    seed, start: p(108), clock: 11 * 60 + 41 + Math.round(20 * r(30)),
    // hidden warm-up on the far side of the story (feeds ATR(14) and the 20-bar volume average)
    prelude: [
      { to: p(120), bars: 24, vol: 0.55, size: 0.85 }, { to: p(98), bars: 26, vol: 0.55, size: 0.85 },
      { to: p(114), bars: 22, vol: 0.5, size: 0.85 }, { to: p(100), bars: 18, vol: 0.5, size: 0.85 },
    ],
    beats: [
      { to: p(72 + 8 * r(31)), bars: a1, vol: 0.55, size: 0.95 },
      { to: p(80 + 6 * r(32)), bars: a2, vol: 0.45, size: 0.85 },
      { to: p(30 + 6 * r(33)), bars: a3, vol: 0.55, size: 1.05, shape: "accel" },
      { to: p(36 + 4 * r(36)), bars: 2, vol: 0.4, size: 0.85 },
      { to: p(OFF1), bars: a4, vol: 0.45, size: 0.95, shape: "decel" },
      s1.beat,
      (look: Look) => nextTest(look, 40),
      after, after, after, after,
    ],
    walls: [{ from: 0, to: t1 - 1, level: p(GAP), side, probe: 0 }, s1.wall],
    touches: [s1.touch],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "ICE BID",
    title: "A sell-off meets an ICE BID, and every return to it is turned away",
    premise: "Watch the lower wicks where the selling stops. Two heavy test bars are turned away at one price, the tool confirms an ICE BID there, and each time price comes back the bar closes up off it.",
    design: (seed) => scenario(seed, 1),
    seeds: Number(process.env.SEEDS ?? 600),
    judge: (run, s) => judgeHold(run, s, true),
  },
  {
    id: "b",
    tab: "ICE OFFER",
    title: "A rally meets an ICE OFFER, and every return to it is turned away",
    premise: "Watch the upper wicks where the buying stalls. Two heavy test bars are turned away at one price, the tool confirms an ICE OFFER there, and each time price comes back the bar closes down off it.",
    design: (seed) => scenario(seed, -1),
    seeds: Number(process.env.SEEDS ?? 600),
    judge: (run, s) => judgeHold(run, s, false),
  },
];
