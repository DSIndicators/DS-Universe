import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Touch, Wall } from "../design";
import { shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS ProLiquidityHunter — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * Each example follows ONE MAJOR pool the tool maps on stage: price makes an
 * extreme that stands above (a) / below (b) every bar of the last six 60-bar
 * horizons, reverses three average ranges off it, the pool is mapped MAJOR,
 * its odds heat as price works back toward it, and then the tool gives its
 * verdict on the close after the bar that takes it — (a) SWEPT, back inside,
 * the chevron and H on price, and price turns away; (b) RUN, the close holds
 * beyond it, and price keeps going.
 *
 * The pattern is written (tools/showcase/design.ts): a varied hidden prelude
 * (~480 bars, kept below the high / above the low so the extreme is MAJOR, and
 * long enough for the odds' record and reach to learn), the run to the
 * extreme, the reversal, and the return — aimed at the level the TOOL printed
 * (a stage reads the pool's birth event before writing the climb back, the
 * take and the move after it). Every candle is a real recorded one-minute bar.
 * Pools born in the warm-up are never drawn or narrated (DEVIATION 8).
 *
 * ZERO FLAWS on stage: every verdict the tool prints holds for the rest of the
 * window (a sweep is never taken back, a run never comes back inside), no
 * other MAJOR verdict, and the move after the story verdict keeps what it made.
 */

const num = (t: string, re: RegExp) => (t.match(re)?.[1] ?? "");
const fmt = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hhmm = (s: Session, i: number) => { const m = ((s.t[i] % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
const statusOf = (run: StudyRun, k: number) => Object.fromEntries((run.status?.(k, null) ?? []).map((r) => [r.label, r.value]));
const reachAt = (run: StudyRun, k: number) => Number((/±([\d,]+\.\d+)/.exec(statusOf(run, k)["Reach"] ?? "")?.[1] ?? "NaN").replace(/,/g, ""));
const ch = (e: StudyEvent, text: string): Chapter => ({ i: e.i, title: e.title, text, tone: e.tone, price: e.price });
const anchorOf = (e: StudyEvent) => num(e.text, /off the (\d\d:\d\d) (?:high|low)/);

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

/** a verdict holds when no close after it goes back the wrong way through its level */
function holds(e: StudyEvent, s: Session): boolean {
  const lv = e.price!, swept = e.title.startsWith("SWEPT"), upArrow = e.title.includes("▲");
  // SWEPT ▼ (a high) / RUN ▼ (a low): price must stay under the level; SWEPT ▲ / RUN ▲: over it
  const under = !upArrow;
  void swept;
  for (let k = e.i + 1; k < s.n; k++) if (under ? s.c[k] > lv : s.c[k] < lv) return false;
  return true;
}

/**
 * side +1: a buy-side pool over a high; -1: a sell-side pool under a low.
 * verdict SWEPT: taken and the next close is back inside, price turns away.
 * verdict RUN:   taken and the next close holds beyond, price keeps going.
 */
function judge(run: StudyRun, s: Session, side: 1 | -1, verdict: "SWEPT" | "RUN"): Judged | null {
  const R = s.replayFrom, end = s.n - 1;
  const ev = shown(run, s);
  const SIDE = side > 0 ? "BUY-SIDE" : "SELL-SIDE";
  const word = side > 0 ? "high" : "low";
  const arrow = verdict === "SWEPT" ? (side > 0 ? "▼" : "▲") : side > 0 ? "▲" : "▼";
  const vT = `${verdict} ${arrow} · MAJOR`;
  const vs = ev.filter((e) => e.title === vT);
  if (vs.length !== 1) return no(vs.length ? "more than one story verdict" : "no story verdict");
  const v = vs[0];
  const level = v.price!;
  const birth = ev.find((e) => e.title === `${SIDE} POOL · MAJOR` && e.price === level && e.i < v.i);
  if (!birth) return no("verdict on a pool not born on stage as MAJOR");
  const an = anchorOf(birth);
  let anchorBar = -1;
  for (let k = R; k <= birth.i; k++) if (hhmm(s, k) === an) { anchorBar = k; break; }
  if (anchorBar < R + 12) return no("the pool's extreme is not on stage");
  if (v.i - birth.i < 20) return no("verdict too soon after the birth");
  if (end - v.i < 20) return no("too little room after the verdict");
  // ZERO FLAWS: every verdict on stage holds; no other MAJOR verdict
  const verdicts = ev.filter((e) => /^(SWEPT|RUN) /.test(e.title));
  if (verdicts.some((e) => e !== v && / · MAJOR$/.test(e.title))) return no("another MAJOR verdict");
  if (verdicts.some((e) => !holds(e, s))) return no("a verdict taken back");
  if (verdicts.length > 5) return no("too many verdicts");
  const hots = ev.filter((e) => e.title === "POOL TURNS HOT");
  const hot = hots.find((e) => e.price === level && e.i > birth.i && e.i < v.i);
  if (!hot) return no("the pool never turned hot");
  if (hots.length > 2) return no("other hot pools");
  const reach = reachAt(run, v.i);
  if (!(reach > 0)) return no("no reach");
  const away = verdict === "SWEPT" ? -side : side;
  let far = 0;
  for (let k = v.i; k <= end; k++) far = Math.max(far, away * ((away > 0 ? s.h[k] : s.l[k]) - level));
  const fin = away * (s.c[end] - level);
  if (far < 1.0 * reach) return no("no follow-through after the verdict");
  if (fin < 0.8 * far) return no("the move gave back");

  // ---- moments
  const cs: Chapter[] = [];
  const fit = (i: number) => cs.every((c) => Math.abs(c.i - i) >= 8);
  cs.push(ch(birth, `Price reverses three average ranges off the ${word} at ${fmt(level)}, and the tool maps a ${SIDE.toLowerCase()} pool there, ranked MAJOR (its top rank for how long an extreme stood). Odds of a trade there within 60 bars: ${num(birth.text, /within 60 bars: ([<\d]+%)/)}.`));
  if (fit(hot.i)) cs.push(ch(hot, `Price works back toward the ${word}. The pool now reads ${num(hot.text, /reads (\d+%)/)} to be reached within 60 bars: ${num(hot.text, /distance, ([\d.,]+) pts/)} pts away against a one-hour reach of ±${num(hot.text, /±([\d,]+\.\d+)/)}. It turns HOT.`));
  if (!fit(v.i)) return no("verdict crowded");
  cs.push(ch(v, verdict === "SWEPT"
    ? `A bar trades through ${fmt(level)} and the next close is back ${side > 0 ? "below" : "above"} it: SWEPT. The double chevron and H mark the hunt on price, and the pool's band ends on a bright stop.`
    : `A bar trades through ${fmt(level)} and the next close holds ${side > 0 ? "above" : "below"} it: RUN, the other verdict. The band ends on a quiet stop, a dot on the strip, no chevron.`));
  const after = ev.find((e) => e.i >= v.i + 8 && fit(e.i) && (
    (verdict === "SWEPT" && e.title === `${SIDE} POOL · MAJOR` && e.price !== level) ||
    (/^RUN . · (SWING|LOCAL)$/.test(e.title) && e.title.includes(away > 0 ? "▲" : "▼"))));
  if (after) {
    const own = verdict === "SWEPT" && anchorOf(after) === hhmm(s, v.i - 1);
    if (/POOL/.test(after.title)) cs.push(ch(after, `${own ? `The sweep's own ${word}` : `A new ${word}`}, ${fmt(after.price!)}, is mapped as the next MAJOR ${SIDE.toLowerCase()} pool as price moves away from it.`));
    else cs.push(ch(after, `The move carries on through the ${num(after.text, /the (MAJOR|SWING|LOCAL) /)} ${num(after.text, /(buy-side|sell-side) pool/)} pool at ${fmt(after.price!)}: the next close holds beyond it, RUN.`));
  }
  cs.sort((a, b) => a.i - b.i);
  if (cs.length < 3) return no("fewer than three moments");
  for (const c of cs) if (c.text.length > 240) return no("moment too long");
  const score = 30 * Math.min(far / reach, 4) + 20 * fin / reach + (after ? 10 : 0) - 4 * (verdicts.length - 1) + 5 * cs.length - 0.1 * (birth.i - R);
  return {
    score, chapters: cs,
    note: `${SIDE} ${fmt(level)} · ${verdict} · far ${(far / reach).toFixed(2)} reach (±${reach}) · end ${(fin / reach).toFixed(2)} · verdicts ${verdicts.length} · hot ${hots.length}`,
  };
}

// ---------------------------------------------------------------- the scenarios
/**
 * side +1: the story pool sits over a high H; -1: under a low.
 * p(x) = H - side·x: x is distance from the extreme back into the range.
 */
export function scenario(seed: number, side: 1 | -1, verdict: "SWEPT" | "RUN"): Script {
  const H = 26560 + (seed % 7) * 15;
  const p = (x: number) => H - side * x;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  const sw = (k: number, lo: number, hi: number) => lo + (hi - lo) * r(k);
  const inside = side > 0 ? "below" : "above", beyond = side > 0 ? "above" : "below";
  // hidden prelude: ~480 varied bars, all of them inside the extreme-to-be (so it stands six horizons: MAJOR)
  const pre: Beat[] = [];
  let x = 90, tot = 0, k = 100;
  while (tot < 440) {
    const kind = r(k++);
    let bars: number, move: number;
    if (kind < 0.35) { bars = 22 + Math.round(30 * r(k++)); move = (r(k++) < 0.5 ? -1 : 1) * (30 + 40 * r(k++)); }
    else if (kind < 0.7) { bars = 8 + Math.round(12 * r(k++)); move = (r(k++) < 0.5 ? -1 : 1) * (10 + 18 * r(k++)); }
    else { bars = 14 + Math.round(18 * r(k++)); move = (r(k++) - 0.5) * 10; }
    x += move;
    if (x > 200) x -= 2 * Math.abs(move);
    if (x < 35) x += 2 * Math.abs(move);
    pre.push({ to: p(x), bars, vol: 0.6, size: 0.9 });
    tot += bars;
  }
  pre.push({ to: p(sw(1, 75, 90)), bars: 30, vol: 0.55, size: 0.9 });
  const preN = pre.reduce((a, b) => a + b.bars, 0);
  const TK = 0.25;
  let level = NaN;
  const c1 = 8 + Math.round(3 * r(2)), c2 = 4, c3 = 9 + Math.round(3 * r(3)), c4 = 3, d1 = 12 + Math.round(3 * r(4));
  const stage = (look: Look) => {
    const born = look.run.events.find((e) => e.i >= look.from && e.title === `${side > 0 ? "BUY-SIDE" : "SELL-SIDE"} POOL · MAJOR`);
    if (!born) return null;
    level = Math.round(born.price! / TK) * TK;
    const q = (xx: number) => level - side * xx;
    const at = look.at;
    const b1 = 5 + Math.round(2 * r(10)), b2 = 4, b3 = 9 + Math.round(3 * r(11)), b4 = 4, b5 = 8 + Math.round(3 * r(12));
    const T = at + b1 + b2 + b3 + b4 + b5;
    const beats: Beat[] = [
      { to: q(sw(13, 50, 58)), bars: b1, vol: 0.5, size: 0.95 },
      { to: q(sw(14, 38, 44)), bars: b2, vol: 0.45, size: 0.85 },
      { to: q(sw(15, 15, 19)), bars: b3, vol: 0.55, size: 1.0 },
      { to: q(sw(16, 22, 26)), bars: b4, vol: 0.45, size: 0.85 },
      { to: q(sw(17, 4, 6)), bars: b5, vol: 0.45, size: 0.9, shape: "decel" },
    ];
    const walls: Wall[] = [{ from: at, to: T - 1, level: q(1), side: inside, probe: 0 }];
    const touches: Touch[] = [];
    if (verdict === "SWEPT") {
      beats.push(
        { to: q(sw(18, 1.5, 2.5)), bars: 1, size: 1.5, vol: 0.1 },                       // the take: a wick through, closed back inside
        { to: q(sw(19, 5, 7)), bars: 1, size: 1.1, vol: 0.1 },                           // the close after it, back inside: SWEPT
        { to: q(sw(20, 28, 34)), bars: 8 + Math.round(2 * r(21)), vol: 0.55, size: 1.15, shape: "accel" },
        { to: q(sw(22, 21, 25)), bars: 3, vol: 0.45, size: 0.85 },
        { to: q(sw(23, 62, 74)), bars: 12 + Math.round(3 * r(24)), vol: 0.55, size: 1.1, shape: "decel" },
      );
      touches.push({ i: T, level, from: inside, depth: [4, 14] });
      walls.push({ from: T + 1, to: T + 40, level: q(0.75), side: inside, probe: 0 });
    } else {
      beats.push(
        { to: q(-sw(18, 3, 5)), bars: 1, size: 1.5, vol: 0.1 },                          // the take: through and closed beyond
        { to: q(-sw(19, 9, 12)), bars: 1, size: 1.3, vol: 0.1 },                         // the close after it, still beyond: RUN
        { to: q(-sw(20, 30, 36)), bars: 8 + Math.round(2 * r(21)), vol: 0.55, size: 1.15, shape: "accel" },
        { to: q(-sw(22, 23, 27)), bars: 3, vol: 0.45, size: 0.85 },
        { to: q(-sw(23, 60, 72)), bars: 12 + Math.round(3 * r(24)), vol: 0.55, size: 1.1, shape: "decel" },
      );
      walls.push({ from: T + 2, to: T + 40, level: q(-2), side: beyond, probe: 0 });
    }
    return { beats, walls, touches };
  };
  return {
    seed, start: p(90), clock: 11 * 60 + 21 + Math.round(20 * r(30)), prelude: pre,
    beats: [
      // the run to the extreme
      { to: p(sw(5, 42, 50)), bars: c1, vol: 0.55, size: 1.0 },
      { to: p(sw(6, 52, 58)), bars: c2, vol: 0.45, size: 0.85 },
      { to: p(sw(7, 9, 13)), bars: c3, vol: 0.55, size: 1.1, shape: "accel" },
      { to: p(2), bars: c4, vol: 0.35, size: 0.9, shape: "decel" },
      // the reversal off it (three average ranges or more: the pool is mapped)
      { to: p(sw(8, 42, 50)), bars: d1, vol: 0.5, size: 1.1 },
      stage,
    ],
    // the prelude never reaches the extreme
    walls: [{ from: -preN, to: -1, level: p(14), side: inside, probe: 0 }, { from: c1 + c2 + c3 + c4, to: c1 + c2 + c3 + c4 + d1 - 1, level: p(0.5), side: inside, probe: 0 }],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Swept high",
    title: "A major high is hunted, swept, and price turns away",
    premise: "Watch the buy-side pool over the high heat as price climbs back to it, until one bar trades through and the next close is back below: SWEPT, marked on price with the chevron and H.",
    design: (seed) => scenario(seed, 1, "SWEPT"),
    seeds: Number(process.env.SEEDS ?? 300),
    judge: (run, s) => judge(run, s, 1, "SWEPT"),
  },
  {
    id: "b",
    tab: "Low run",
    title: "A major low gives way, and the tool calls it a RUN",
    premise: "Watch the sell-side pool under the low heat as price sinks back to it. This time the close after the take holds below it: RUN, the other verdict, and price keeps going.",
    design: (seed) => scenario(seed, -1, "RUN"),
    seeds: Number(process.env.SEEDS ?? 300),
    judge: (run, s) => judge(run, s, -1, "RUN"),
  },
];
