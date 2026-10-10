import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Script, Touch, Wall } from "../design";
import type { Cut } from "../library";
import { shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS GEX — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * DS GEX does not compute its levels from price: they are an INPUT, the option
 * map it loads. So each example designs the MAP and the PRICE together (Tom,
 * 2026-10-09: "it shows the levels getting busted really fast or not
 * respected"): a Day set in the exact shape the study reads (the rows
 * tools/gex_map_to_json.py writes, locked at the 08:30 morning capture and
 * standing all session — strikes on the NDX 25-point grid, price = strike x
 * basis, the basis chosen once per map so the featured wall lands on a tick;
 * the Gamma Flip is a computed value, not a strike), and a tape that trades the
 * range between the featured wall and the Gamma Flip: every rally/drop is aimed
 * at a level, reaches it with a wick and closes back, and nothing is ever
 * closed through. Default Session mode draws no separate HGEX line (it is
 * always the Call Wall or the Put Wall — README), so the map carries none.
 *
 *  (a) positive gamma: above the flip, the Call Wall caps every rally and the
 *      flip holds every dip.
 *  (b) negative gamma: below the flip, the Put Wall holds every drop and the
 *      flip caps every bounce.
 *
 * Every candle is a real recorded one-minute NQ bar (tools/showcase/design.ts);
 * the shipped study draws and narrates everything unchanged.
 */

const GRID = 25, TICK = 0.25, PRE = 170;
type Row = { kind: number; label: string; price: number; strike: number; net?: number; share?: number; rank?: number };
type Plan = { rows: Row[]; basis: number; top: number; bot: number; call: boolean };

/** the map of the seed being composed and judged (build.ts composes and judges one seed at a time) */
let PLAN: Plan | null = null;

const q = (p: number) => Math.round(p / TICK) * TICK;
const rnd = (seed: number) => (k: number) => (((seed * 7919 + k * 104729) % 1000) + 1000) % 1000 / 1000;

// ------------------------------------------------------------------ the map
function makePlan(seed: number, call: boolean): Plan {
  const r = rnd(seed);
  const b0 = 1.0061 + 0.0022 * r(1);
  const center = 26380 + (seed % 11) * 17;
  const R = 64 + 18 * r(2);
  const rows: Row[] = [];
  let top: number, bot: number, basis: number;
  if (call) {
    const kc = Math.round((center + R / 2) / b0 / GRID) * GRID;
    top = q(kc * b0); basis = top / kc; bot = q(top - R);
    const px = (k: number) => k * basis;
    const mp = Math.floor((bot - 22) / basis / GRID) * GRID, pw0 = mp - GRID, pw = mp - 3 * GRID;
    rows.push(
      { kind: 0, label: "Call Wall", price: top, strike: kc, net: 6.1e8, share: 0.13 },
      { kind: 2, label: "CW 0DTE", price: px(kc + GRID), strike: kc + GRID, net: 1.4e8, share: 0.19 },
      { kind: 11, label: "G+", price: px(kc + 4 * GRID), strike: kc + 4 * GRID, net: 3.8e8, share: 0.08, rank: 1 },
      { kind: 11, label: "G+", price: px(kc + 8 * GRID), strike: kc + 8 * GRID, net: 2.6e8, share: 0.06, rank: 2 },
      { kind: 4, label: "Gamma Flip", price: bot, strike: bot / basis },
      { kind: 10, label: "Max Pain", price: px(mp), strike: mp },
      { kind: 3, label: "PW 0DTE", price: px(pw0), strike: pw0, net: -0.9e8, share: 0.12 },
      { kind: 1, label: "Put Wall", price: px(pw), strike: pw, net: -6.6e8, share: 0.15 },
      { kind: 12, label: "G-", price: px(pw - 2 * GRID), strike: pw - 2 * GRID, net: -2.2e8, share: 0.05, rank: 1 },
      { kind: 12, label: "G-", price: px(pw - 4 * GRID), strike: pw - 4 * GRID, net: -1.5e8, share: 0.03, rank: 2 },
    );
  } else {
    const kp = Math.round((center - R / 2) / b0 / GRID) * GRID;
    bot = q(kp * b0); basis = bot / kp; top = q(bot + R);
    const px = (k: number) => k * basis;
    const mp = Math.ceil((top + 22) / basis / GRID) * GRID, cw0 = mp + GRID, cw = mp + 3 * GRID;
    rows.push(
      { kind: 1, label: "Put Wall", price: bot, strike: kp, net: -6.3e8, share: 0.14 },
      { kind: 3, label: "PW 0DTE", price: px(kp - GRID), strike: kp - GRID, net: -1.8e8, share: 0.22 },
      { kind: 12, label: "G-", price: px(kp - 4 * GRID), strike: kp - 4 * GRID, net: -3.4e8, share: 0.07, rank: 1 },
      { kind: 12, label: "G-", price: px(kp - 8 * GRID), strike: kp - 8 * GRID, net: -2.3e8, share: 0.05, rank: 2 },
      { kind: 4, label: "Gamma Flip", price: top, strike: top / basis },
      { kind: 10, label: "Max Pain", price: px(mp), strike: mp },
      { kind: 2, label: "CW 0DTE", price: px(cw0), strike: cw0, net: 0.8e8, share: 0.1 },
      { kind: 0, label: "Call Wall", price: px(cw), strike: cw, net: 6.8e8, share: 0.16 },
      { kind: 11, label: "G+", price: px(cw + 2 * GRID), strike: cw + 2 * GRID, net: 2.4e8, share: 0.05, rank: 1 },
      { kind: 11, label: "G+", price: px(cw + 4 * GRID), strike: cw + 4 * GRID, net: 1.7e8, share: 0.04, rank: 2 },
    );
  }
  // the Expected Move around the spot at the morning capture (the warm-up's first price), about 0.58%,
  // kept clear of the other lines so it never merges into a confluence with them
  const mid = q((top + bot) / 2);
  let half = q(mid * 0.0058);
  for (let it = 0; it < 30 && rows.some((x) => Math.abs(x.price - (mid + half)) < 15 || Math.abs(x.price - (mid - half)) < 15); it++) half += 5;
  rows.push({ kind: 5, label: "EM High", price: mid + half, strike: (mid + half) / basis }, { kind: 6, label: "EM Low", price: mid - half, strike: (mid - half) / basis });
  return { rows, basis, top, bot, call };
}

/** the Day set in the shape the study reads: locked at 08:30, standing all session */
function daySet(s: Session, p: Plan) {
  const day = Math.floor(s.t[s.replayFrom] / 1440) * 1440;
  const since = day + 8 * 60 + 30;
  return {
    tool: "DS GEX", market: "NQ", underlying: "NDX",
    sets: [{ lock: "D", name: "Day set", sinceMin: since, untilMin: null, basis: p.basis }],
    levels: p.rows.map((r) => ({
      kind: r.kind, label: r.label, price: r.price, strike: r.strike, mag: r.net ? Math.abs(r.net) : 0, net: r.net ?? null,
      share: r.share ?? null, vol: null, rank: r.rank ?? 0, flag: 0, sinceMin: since, untilMin: null, set: "D", setName: "Day set",
    })),
  };
}
const extra = (_c: Cut, s: Session) => (PLAN ? daySet(s, PLAN) : {});

// ------------------------------------------------------------------ the scenario
/**
 * The range between the featured wall and the Gamma Flip: four tests that alternate
 * (wall, flip, wall, flip), each leg aimed at the level, its last bar wicking onto it
 * and closing back; walls keep every other bar (warm-up included) inside the range.
 */
function scenario(seed: number, call: boolean): Script {
  const p = makePlan(seed, call);
  PLAN = p;
  const r = rnd(seed + 17);
  const R = p.top - p.bot;
  const at = (f: number) => p.bot + f * R;
  // the warm-up: a quiet drift well inside the range, from the 08:26 bar to the first shown bar
  const prelude: Beat[] = [
    { to: at(0.42 + 0.1 * r(1)), bars: 45, vol: 0.45, size: 0.8 },
    { to: at(0.62 - 0.08 * r(2)), bars: 40, vol: 0.45, size: 0.8 },
    { to: at(0.36 + 0.08 * r(3)), bars: 45, vol: 0.45, size: 0.8 },
    { to: at(call ? 0.42 : 0.58), bars: 40, vol: 0.45, size: 0.8 },
  ];
  // tests: the featured wall first (top for the Call Wall, bottom for the Put Wall), then alternating
  const order: ("top" | "bot")[] = call ? ["top", "bot", "top", "bot"] : ["bot", "top", "bot", "top"];
  const beats: Beat[] = [];
  const touches: Touch[] = [];
  let i = 0;
  let cur = at(call ? 0.42 : 0.58);
  order.forEach((side, j) => {
    const lv = side === "top" ? p.top : p.bot, dir = side === "top" ? 1 : -1;
    const target = lv - dir * (1.25 + 2.25 * r(10 + j));
    const n = (j === 0 ? 13 : 16) + Math.round(7 * r(20 + j));
    const dist = target - cur;
    if (r(30 + j) > 0.35 && n >= 15) {
      // a pullback inside the move
      const n1 = Math.round(n * (0.5 + 0.15 * r(40 + j))), n2 = 3 + Math.round(2 * r(50 + j)), n3 = n - n1 - n2;
      const a = cur + dist * (0.55 + 0.15 * r(60 + j));
      const b = a - dist * (0.16 + 0.1 * r(70 + j));
      beats.push({ to: a, bars: n1, vol: 0.55, shape: j === 0 ? "linear" : "decel" }, { to: b, bars: n2, vol: 0.4, size: 0.85 }, { to: target, bars: n3, vol: 0.5 });
    } else if (j > 0) {
      // the rejection leaves fast, the approach to the other level is steady (no slow grind into it)
      const n1 = Math.round(n * (0.4 + 0.1 * r(90 + j)));
      beats.push({ to: cur + dist * (0.5 + 0.12 * r(95 + j)), bars: n1, vol: 0.55, shape: "decel" }, { to: target, bars: n - n1, vol: 0.5 });
    } else beats.push({ to: target, bars: n, vol: 0.55 });
    i += n;
    touches.push({ i: i - 1, level: lv, from: side === "top" ? "below" : "above", depth: [0, 3] });
    cur = target;
  });
  // after the last test: away from it, back into the middle of the range
  const endF = call ? 0.5 + 0.12 * r(80) : 0.5 - 0.12 * r(80);
  const nEnd = 11 + Math.round(4 * r(81));
  beats.push({ to: at(endF), bars: nEnd, vol: 0.5, shape: "decel" }, { to: at(endF + (call ? -0.05 : 0.05)), bars: 5, vol: 0.35, size: 0.8 });
  const N = i + nEnd + 5;
  // walls: inside the range on every bar but the test bars (a test bar touches only its own level)
  const walls: Wall[] = [];
  const seg = (lv: number, side: "above" | "below", idx: number[]) => {
    let a = -PRE;
    for (const t of [...idx, N + 2]) { if (t - 1 >= a) walls.push({ from: a, to: t - 1, level: lv, side, probe: 0 }); a = t + 1; }
  };
  seg(p.top - TICK, "below", touches.filter((t) => t.level === p.top).map((t) => t.i));
  seg(p.bot + TICK, "above", touches.filter((t) => t.level === p.bot).map((t) => t.i));
  // and 4.5 points of air under/over each level except on a test bar and the two bars after it (no bars hugging a level)
  const air = (lv: number, side: "above" | "below", idx: number[]) => {
    let a = -PRE;
    for (const t of [...idx, N + 2]) { if (t - 1 >= a) walls.push({ from: a, to: t - 1, level: lv, side, probe: 0 }); a = t + 3; }
  };
  air(p.top - 4.5, "below", touches.filter((t) => t.level === p.top).map((t) => t.i));
  air(p.bot + 4.5, "above", touches.filter((t) => t.level === p.bot).map((t) => t.i));
  // the warm-up keeps well clear of both levels (its last bars are visible left of the story)
  walls.push({ from: -PRE, to: -1, level: p.top - 9, side: "below", probe: 0 }, { from: -PRE, to: -1, level: p.bot + 9, side: "above", probe: 0 });
  return { seed, start: at(0.5), clock: 11 * 60 + 16, prelude, beats, walls, touches };
}

// ------------------------------------------------------------------ moments
const f2 = (v: number) => v.toFixed(2);
const MEAN: Record<string, string> = {
  "Call Wall": "the strike with the largest positive net gamma",
  "Put Wall": "the strike with the most negative net gamma",
  "Gamma Flip": "the net-gamma sign change nearest spot",
};
const ORD = ["", "", "Second", "Third", "Fourth", "Fifth"];
function moment(e: StudyEvent, s: Session, nth: number, call: boolean): Chapter {
  const name = e.text.match(/ to (.+?) \d+\.\d\d/)?.[1] ?? "";
  const rose = e.text.includes(" rose ");
  const head = nth >= 2 ? `${ORD[nth] ?? `Test ${nth}`} test: the bar` : "The bar";
  let text = `${head} ${rose ? "rose" : "fell"} to ${name} ${f2(e.price!)} and closed back ${rose ? "below" : "above"} it at ${f2(s.c[e.i])}.`;
  if (nth === 1) {
    text += ` ${name} is ${MEAN[name] ?? "a DS GEX level"}.`;
    if (name === "Gamma Flip") text += call
      ? " Its caption reads price above: positive gamma, where by convention hedging works against moves."
      : " Its caption reads price below: negative gamma, where by convention hedging amplifies moves.";
  }
  if (text.length > 240) throw new Error(`moment too long (${text.length}): ${text}`);
  return { i: e.i, title: e.title, text, tone: e.tone, price: e.price };
}

// ------------------------------------------------------------------ the judge (ZERO FLAWS)
export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

function judge(run: StudyRun, s: Session, call: boolean): Judged | null {
  const a = s.replayFrom, z = s.n - 1;
  const ev = shown(run, s);
  const wallT = call ? "AT THE CALL WALL" : "AT THE PUT WALL", flipT = "AT THE GAMMA FLIP";
  const story = ev.filter((e) => e.title === wallT || e.title === flipT);
  // nothing else may happen: no level crossed, no other level reached
  if (ev.length !== story.length) return no(`other event: ${ev.find((e) => !story.includes(e))!.title}`);
  const walls = story.filter((e) => e.title === wallT), flips = story.filter((e) => e.title === flipT);
  if (walls.length < 2 || flips.length < 2) return no("fewer than two tests of each level");
  for (let j = 1; j < story.length; j++) if (story[j].title === story[j - 1].title) return no("tests do not alternate");
  if (story[0].title !== wallT) return no("the flip is tested first");
  if (story[0].i - a < 8) return no("a test on the first bars");
  if (z - story[story.length - 1].i < 12) return no("last test too close to the end");
  for (let j = 1; j < story.length; j++) if (story[j].i - story[j - 1].i < 10) return no("tests closer than 10 bars");
  const top = call ? walls[0].price! : flips[0].price!, bot = call ? flips[0].price! : walls[0].price!;
  const R = top - bot;
  // every shown close inside the range, every wick at most a tick past a level (only on a test bar), and the
  // visible end of the warm-up well clear of both
  let poke = 0;
  for (let i = a; i <= z; i++) {
    if (s.c[i] >= top || s.c[i] <= bot) return no("a close outside the range");
    poke = Math.max(poke, s.h[i] - top, bot - s.l[i]);
  }
  if (poke > 0.75) return no("a wick runs a level");
  for (let i = Math.max(0, a - 30); i < a; i++) if (s.h[i] >= top - 6 || s.l[i] <= bot + 6) return no("the visible warm-up near a level");
  // each test is a rejection: the bar closes back off the line and price leaves by a third of the range within 20 bars
  let score = 0;
  for (const e of story) {
    const up = e.title === (call ? wallT : flipT); // a test of the top level
    const back = up ? e.price! - s.c[e.i] : s.c[e.i] - e.price!;
    if (back < 1) return no("a close right on the line");
    let away = 0;
    for (let i = e.i + 1; i <= Math.min(z, e.i + 20); i++) away = Math.max(away, up ? e.price! - s.l[i] : s.h[i] - e.price!);
    if (away < Math.max(18, 0.35 * R)) return no("a test that is not rejected");
    // price does not linger at the level: two bars after the test it closes a tenth of the range away
    if ((up ? e.price! - s.c[e.i + 2] : s.c[e.i + 2] - e.price!) < Math.max(6, 0.1 * R)) return no("price lingers at a level after the test");
    score += Math.min(40, away) + Math.min(4, back);
  }
  let wide = 0;
  for (let i = a; i <= z; i++) if (s.h[i] - s.l[i] > 28) wide++;
  if (wide > 2) return no("outsized bars");
  score += 6 * story.length - 6 * wide - 10 * poke;
  const seen: Record<string, number> = {};
  const chapters = story.map((e) => moment(e, s, (seen[e.title] = (seen[e.title] ?? 0) + 1), call));
  return { score, chapters, note: `range ${bot.toFixed(2)}–${top.toFixed(2)} (${R.toFixed(2)} pts) · tests ${story.length} · poke ${poke.toFixed(2)} · wide ${wide}` };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Call Wall caps",
    title: "Above the Gamma Flip, the Call Wall caps each rally",
    premise:
      "Price trades above the Gamma Flip, in positive gamma, under the Call Wall. Watch each rally stall at the Call Wall and each dip hold at the flip: the range between them is tested and respected.",
    design: (seed) => scenario(seed, true),
    seeds: 200,
    extra,
    judge: (run, s) => judge(run, s, true),
  },
  {
    id: "b",
    tab: "Put Wall holds",
    title: "Below the Gamma Flip, the Put Wall holds each drop",
    premise:
      "Price trades below the Gamma Flip, in negative gamma, above the Put Wall. Watch each drop stop at the Put Wall and each bounce stall at the flip: both levels are tested and respected.",
    design: (seed) => scenario(seed, false),
    seeds: 200,
    extra,
    judge: (run, s) => judge(run, s, false),
  },
];
