import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Stage, Wall } from "../design";
import { shown } from "../build";
import type { ReadItem, Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS ProHeikinAshi — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * The face of the tool: three timeframes of Heikin-Ashi on one chart. In each
 * example a move runs out, the 5-minute lane turns first, the 15-minute candle
 * follows and closes in the new colour (the A mark on price, the 15m FLIP rail),
 * the chart's candles go FIRM in the panel, and the move runs with both lanes
 * holding the new colour to the end.
 *  a  the turn up      b  the turn down
 *
 * The pattern is written (tools/showcase/design.ts); every candle is a real
 * recorded one-minute NQ bar. Stages read the tool's own lanes as the turn is
 * written, three bars at a time: once the 5m lane turns, price never trades
 * back under that bar; once the 15m candle closes in the new colour (the A
 * mark), the run is written with every bar kept clear of the A bar. A hidden
 * warm-up feeds the unit, the odds book and the lanes (never drawn, never
 * narrated — the study's hygiene).
 *
 * ZERO FLAWS on stage (Tom, 2026-10-09): one 5m turn and one 15m turn, both
 * the story's way, nothing turning back, no price back beyond either.
 */

// ------------------------------------------------------------------ reading the study's output
const val = (items: ReadItem[] | undefined, label: string) => String(items?.find((r) => r.label === label)?.value ?? "");
const memo = new WeakMap<StudyRun, Map<number, ReadItem[] | undefined>>();
const readout = (run: StudyRun, i: number) => { let m = memo.get(run); if (!m) { m = new Map(); memo.set(run, m); } if (!m.has(i)) m.set(i, run.readout?.(i)); return m.get(i); };
const tier = (run: StudyRun, i: number) => val(readout(run, i), "Tier");
const candle = (run: StudyRun, i: number) => val(readout(run, i), "Candle");
const lanes = (run: StudyRun, i: number) => val(readout(run, i), "5m / 15m").replace(/ \(turned\)/g, "").split(" / ");
const money = /([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/;
const railOf = (e: StudyEvent) => (e.text.match(new RegExp(`(?:steps to|rail, is) ${money.source}`)) ?? [])[1] ?? "";
const atr = (s: Session, i: number) => {
  let a = 0, k = 0;
  for (let j = Math.max(1, i - 19); j <= i; j++, k++) a += Math.max(s.h[j] - s.l[j], Math.abs(s.h[j] - s.c[j - 1]), Math.abs(s.l[j] - s.c[j - 1]));
  return a / Math.max(1, k);
};
const is15 = (e: StudyEvent) => e.title.startsWith("15m CLOSED");
const is5 = (e: StudyEvent) => e.title.startsWith("5m CLOSED");

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

function judgeTurn(run: StudyRun, s: Session, dir: 1 | -1): Judged | null {
  const from = s.replayFrom, end = s.n - 1;
  const want = dir > 0 ? "UP" : "DOWN", other = dir > 0 ? "DOWN" : "UP";
  const ev = shown(run, s);
  const t15 = ev.filter(is15), t5 = ev.filter(is5);
  if (t15.length !== 1) return no("not exactly one 15m turn");
  if (t5.length !== 1) return no("not exactly one 5m turn");
  if (ev.length !== 2) return no("other narration");
  const turn = t15[0], lead = t5[0];
  if (!turn.title.endsWith(want) || !lead.title.endsWith(want)) return no("a turn on the other side");
  if (lead.i - from < 18) return no("5m lead too close to the first bar");
  if (turn.i - lead.i < 8) return no("5m lead too close to the 15m turn");
  if (end - turn.i < 30) return no("too little after the turn");
  const lw = lanes(run, from);
  if (lw[0] !== other || lw[1] !== other) return no("lanes not both against the turn at the first bar");
  for (let i = lead.i; i <= end; i++) if (lanes(run, i)[0] !== want) return no("5m lane not held");
  for (let i = turn.i; i <= end; i++) if (lanes(run, i)[1] !== want) return no("15m lane not held");
  // both turns are signals: price never trades back beyond the bar that printed them
  const A = atr(s, turn.i);
  const leadEx = dir > 0 ? s.l[lead.i] : s.h[lead.i], turnEx = dir > 0 ? s.l[turn.i] : s.h[turn.i];
  for (let i = lead.i + 1; i <= end; i++) if (dir * ((dir > 0 ? s.l[i] : s.h[i]) - leadEx) < 0) return no("price back beyond the 5m turn bar");
  for (let i = turn.i + 1; i <= end; i++) if (dir * ((dir > 0 ? s.l[i] : s.h[i]) - turnEx) < 0.3 * A) return no("price back toward the A bar");
  const c0 = s.c[turn.i];
  let best = -Infinity, bestAt = turn.i;
  for (let i = turn.i + 1; i <= end; i++) { const f = dir * ((dir > 0 ? s.h[i] : s.l[i]) - c0); if (f > best) { best = f; bestAt = i; } }
  const follow = dir * (s.c[end] - c0);
  if (best < 5 * A) return no("move after the turn under 5 ATR");
  if (follow < 0.85 * best) return no("window end gave back the move");
  if (end - bestAt > 14) return no("window runs on long after the move");
  for (let i = end - 2; i <= end; i++) if (!candle(run, i).startsWith(want) || tier(run, i) === "FLIP PENDING") return no("ends on a flipped or pending chart candle");
  let firm = 0, flips = 0;
  for (let i = turn.i; i <= end; i++) {
    if (tier(run, i) === "FIRM" && candle(run, i).startsWith(want)) firm++;
    if (candle(run, i).startsWith(other)) flips++;
  }
  if (firm < 8) return no("few FIRM candles after the turn");

  // ---- moments
  const chapters: Chapter[] = [];
  const fit = (i: number) => chapters.every((c) => Math.abs(c.i - i) >= 8);
  const r = (e: StudyEvent) => railOf(e);
  chapters.push({ i: lead.i, title: lead.title, tone: lead.tone, price: lead.price,
    text: `The 5-minute candle closes ${want} after ${want === "UP" ? "a DOWN" : "an UP"} one: the middle timeframe turns first, a notch on the 5m lane. The 15m lane still reads ${other}. 5m FLIP rail: ${r(lead)}.` });
  chapters.push({ i: turn.i, title: turn.title, tone: turn.tone, price: turn.price,
    text: `The 15-minute Heikin-Ashi candle closes ${want} after ${want === "UP" ? "a DOWN" : "an UP"} one: the slow timeframe turns. The A mark goes ${dir > 0 ? "under the low" : "over the high"}; the 15m FLIP rail steps to ${r(turn)}.` });
  for (let i = turn.i + 6; i <= end - 4; i++) {
    if (tier(run, i) !== "FIRM" || !candle(run, i).startsWith(want) || !fit(i) || lanes(run, i).join() !== `${want},${want}`) continue;
    const cu = val(readout(run, i), "Cushion").split(" · ")[0];
    chapters.push({ i, title: "FIRM", tone: dir > 0 ? "strongBull" : "strongBear", price: s.c[i],
      text: `The chart's candle closes ${cu} past its flip level, two units or more: the tier reads FIRM and the panel candle takes the strong colour. 5m and 15m both read ${want}: 3 OF 3 ${want}.` });
    break;
  }
  chapters.sort((a, b) => a.i - b.i);
  if (chapters.length < 3) return no("fewer than three moments");
  for (const c of chapters) if (c.text.length > 240) throw new Error(`moment too long (${c.text.length}): ${c.text}`);
  const score = 8 * Math.min(best / A, 12) + 1.0 * Math.min(firm, 30) - 3 * flips + 6 * chapters.length + 10 * (follow / best);
  return { score, chapters, note: `lead@${lead.i - from} turn@${turn.i - from} · best ${best.toFixed(2)} (${(best / A).toFixed(1)} ATR) · firm ${firm} · chart flips after the turn ${flips}` };
}

// ------------------------------------------------------------------ the scenarios
const rnd = (seed: number) => (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
/**
 * The turn. A move the other way (the lanes read the old colour), its last
 * push, then the turn written three bars at a time while the stages read the
 * tool's lanes: phase 0 waits for the 5m notch, phase 1 waits for the 15m close
 * (the A mark) with price kept above the 5m turn bar, phase 2 writes the run
 * with price kept clear of the A bar.
 */
function turnScenario(seed: number, dir: 1 | -1): Script {
  const S = 26440 + (seed % 9) * 13;
  const r = rnd(seed);
  const od = -dir;
  let phase = 0, floor = NaN;
  const keep = (from: number, n: number): Wall[] => isNaN(floor) ? [] : [{ from, to: from + n - 1, level: floor, side: dir > 0 ? "above" : "below", probe: 0 }];
  const step = (j: number): Stage => (look: Look) => {
    const ev = look.run.events.filter((e) => e.i >= look.from);
    const lead = ev.find(is5), turn = ev.find(is15);
    if (phase === 2) return { beats: [] };
    if (turn) {
      if (!lead || lead.i > turn.i) return no("stage: the 15m turned before the 5m");
      phase = 2;
      const A = atr(look.s, turn.i);
      floor = (dir > 0 ? look.s.l[turn.i] : look.s.h[turn.i]) + dir * 0.5 * A;
      if (dir * (look.last - floor) < 2) return no("stage: price too near the A bar");
      const run = 62 + 22 * r(40), n1 = 11 + Math.round(4 * r(41)), n2 = 10 + Math.round(4 * r(42));
      const beats: Beat[] = [
        { to: look.last + dir * run * 0.5, bars: n1, vol: 0.6, size: 1.1 },
        { to: look.last + dir * run * 0.39, bars: 4, vol: 0.4, size: 0.85 },
        { to: look.last + dir * run, bars: n2, vol: 0.6, size: 1.05 },
        { to: look.last + dir * (run + 5 + 5 * r(43)), bars: 4 + Math.round(3 * r(44)), vol: 0.4, size: 0.8 },
      ];
      return { beats, walls: keep(look.at, n1 + 3 + n2 + 12) };
    }
    if (lead && phase === 0) { phase = 1; floor = (dir > 0 ? look.s.l[lead.i] : look.s.h[lead.i]) + dir * 0.25; }
    // phases 0 and 1: the turn builds, three bars at a time
    const up = phase === 0 ? 5 + 5 * r(60 + j) : 4 + 5 * r(60 + j);
    return { beats: [{ to: look.last + dir * up, bars: 3, vol: 0.55, size: 0.9 }], walls: keep(look.at, 3) };
  };
  return {
    seed, start: S - od * 0, clock: 11 * 60 + 26 + Math.round(30 * r(1)),
    prelude: [{ to: S - od * 50, bars: 60, vol: 0.8 }, { to: S - od * 80, bars: 40, vol: 0.8 }, { to: S - od * 40, bars: 40, vol: 0.8 },
      { to: S - od * 70, bars: 30, vol: 0.8 }, { to: S - od * 22, bars: 26, vol: 0.7 }, { to: S - od * 30, bars: 6, vol: 0.6 }, { to: S, bars: 14, vol: 0.6 }],
    beats: [
      // the move the other way: two legs and a bounce, the lanes reading the old colour
      { to: S + od * (30 + 10 * r(2)), bars: 12 + Math.round(4 * r(3)), vol: 0.5, size: 0.95 },
      { to: S + od * (20 + 6 * r(4)), bars: 4 + Math.round(2 * r(5)), vol: 0.4, size: 0.8 },
      { to: S + od * (58 + 14 * r(6)), bars: 12 + Math.round(4 * r(7)), vol: 0.5, size: 0.95, shape: "decel" },
      ...Array.from({ length: 14 }, (_, j) => step(j)),
      (look: Look) => (phase === 2 ? { beats: [] } : no("stage: the turn never completed")),
    ],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "The turn up",
    title: "The 5m turns up first, the 15m follows, and the move runs",
    premise: "Watch the 5m lane turn first and the 15m candle follow with its A mark under the low. The panel's candles go FIRM, the tide fills above the open, and the dashed flip rails trail the move up.",
    design: (seed) => turnScenario(seed, 1),
    seeds: 250,
    judge: (run, s) => judgeTurn(run, s, 1),
  },
  {
    id: "b",
    tab: "The turn down",
    title: "The 5m turns down first, the 15m follows, and the decline runs",
    premise: "The bearish mirror: the 5m lane turns first, the 15m candle follows with its A mark over the high, the candles go FIRM on the down side and the flip rails step lower.",
    design: (seed) => turnScenario(seed, -1),
    seeds: 250,
    judge: (run, s) => judgeTurn(run, s, -1),
  },
];
