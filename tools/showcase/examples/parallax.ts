import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Touch, Wall } from "../design";
import { shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";
import { buildHtf, computePools, windowAt, SWING, type Pool } from "../../../components/engine/studies/_parallax-engine";

/**
 * DS Parallax — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * Four live higher-timeframe mini-charts (15m / 1h / 4h / 1D) with the
 * liquidity pools on each, over one-minute bars from 10:31. The panels need
 * days of history, so the hidden warm-up is DESIGNED: three full sessions and
 * this morning (a cash-open drive to the day's high, a flush, a base). It is
 * laid out so every pool it leaves on the panels is either far from where the
 * example trades or dead before the example starts, and none sits in the part
 * of a panel that scrolls off while the example plays — so no line on any panel
 * vanishes on stage except by a sweep.
 *
 * On stage (both faces mirror each other):
 *   a dip, a one-bar-wide V to a fresh 15m swing high H (BUY-SIDE POOL), a pull
 *   back, a second push that runs H by more than the pool tolerance on wicks
 *   only — every one-minute close stays under H — so the pool turns into a ghost
 *   (BUY-SIDE SWEPT), the sweep's own high is marked as the next pool, and the
 *   drop away from it leaves a fresh sell-side pool that holds to the end.
 *
 * The judge recomputes every panel's pools at every closed minute with the
 * tool's own engine (_parallax-engine.ts) and rejects any pool that appears
 * without the tool's event or disappears without being swept (ZERO FLAWS,
 * Tom 2026-10-09).
 */

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };
const fmt = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PANELS: [number, string][] = [[15, "15m"], [60, "1h"], [240, "4h"], [0, "1D"]];
const panelsOf = (e: StudyEvent) => e.text.match(/on the ([0-9mhD, and]+?) panels?/)?.[1] ?? "";
const panelWord = (e: StudyEvent) => { const p = panelsOf(e); return p.includes(" and ") ? `${p} panels` : `${p} panel`; };

// ---------------------------------------------------------------- the judge
/** a ghost by identity: its side, its sweep bar and its swing bar on the panel (absolute), and whether it sits at the
 *  panel's left edge (the oldest EDGE bars of the 30, about to scroll off) */
type Ghost = { buy: boolean; lvl: number; sweep: number; swing: number; edge: boolean };
type St = { live: Pool[]; ghosts: Ghost[] };
const EDGE = 8;
/** every panel's pools at every closed minute from the bar before the first shown one, by the tool's own engine */
function states(s: Session) {
  const P = PANELS.map(([m, lb]) => buildHtf(s, m, lb));
  const out: St[][] = [];
  for (let k = s.replayFrom - 1; k < s.n; k++) out.push(P.map((H) => {
    const { w, atr, j0 } = windowAt(H, k, s.c[k], null);
    const ps = computePools(w, atr, s.tick);
    return {
      live: ps.filter((p) => !p.swept),
      ghosts: ps.filter((p) => p.swept).map((g) => ({ buy: g.buy, lvl: g.lvl, sweep: j0 - g.sweepIdx, swing: j0 - g.idx, edge: g.idx >= w.n - EDGE })),
    };
  }));
  return out;
}

function judge(run: StudyRun, s: Session, dir: 1 | -1): Judged | null {
  const f = s.replayFrom, end = s.n - 1;
  const ev = shown(run, s);
  const A = dir > 0 ? "BUY-SIDE" : "SELL-SIDE", Z = dir > 0 ? "SELL-SIDE" : "BUY-SIDE";
  // ZERO FLAWS: exactly the story's events — the pool, its sweep, the sweep's own extreme, the pool the move away leaves
  const titles = ev.map((e) => e.title.replace(/ ×\d\+?$/, ""));
  const want = [`${A} POOL`, `${A} SWEPT`, `${A} POOL`, `${Z} POOL`];
  if (titles.join("|") !== want.join("|")) return no(`events: ${titles.join(", ")}`);
  const [pool, sweep, next, opp] = ev;
  if (Math.abs(pool.price! - sweep.price!) > 0.01) return no("the sweep is not the story pool");
  if (!/^15m/.test(panelsOf(pool)) || !/^15m/.test(panelsOf(sweep))) return no("not on the 15m panel");
  if (dir * (next.price! - sweep.price!) <= 0) return no("the next pool is not beyond the swept one");
  // ... every pool on every panel appears with an event and disappears only by being swept
  const st = states(s);
  const key = (p: Pool) => `${p.buy}|${p.lvl}`;
  for (let j = 1; j < st.length; j++) {
    const k = f - 1 + j;
    for (let p = 0; p < 4; p++) {
      const a = st[j - 1][p], b = st[j][p];
      const bl = new Set(b.live.map(key)), al = new Set(a.live.map(key));
      for (const x of a.live) if (!bl.has(key(x))) {
        const ghosted = b.ghosts.some((g) => g.buy === x.buy && Math.abs(g.lvl - x.lvl) < 0.01);
        if (!ghosted) return no(`${PANELS[p][1]} pool vanished`);
        if (!ev.some((e) => e.i === k && /SWEPT/.test(e.title))) return no("a ghost with no sweep event");
      }
      for (const x of b.live) if (!al.has(key(x))) {
        if (x.newest > SWING || !ev.some((e) => e.i === k && /POOL/.test(e.title) && Math.abs(e.price! - x.lvl) < 0.01)) return no(`${PANELS[p][1]} pool appeared silently`);
      }
      // ghosts: the same ghost may shift a point as its merged swings change with the ATR (same sweep bar); a ghost
      // may scroll off the panel's left edge (or come in there as the window scrolls); the story's sweep may push the
      // oldest ghost on its side out of the tool's two. Anything else is a ghost blinking: a flaw.
      const same = (x: Ghost, y: Ghost) => x.buy === y.buy && x.sweep === y.sweep && Math.abs(x.lvl - y.lvl) <= 2;
      const sweptHere = (buy: boolean) => ev.some((e) => e.i === k && /SWEPT/.test(e.title) && /BUY/.test(e.title) === buy);
      for (const g of b.ghosts) if (!a.ghosts.some((x) => same(x, g)) && !g.edge && !sweptHere(g.buy)) return no(`${PANELS[p][1]} ghost appeared silently`);
      for (const g of a.ghosts) if (!b.ghosts.some((x) => same(x, g)) && !g.edge && !sweptHere(g.buy)) return no(`${PANELS[p][1]} ghost vanished`);
    }
  }
  // the sweep: wicks only (no one-minute close beyond the pool), and the move away carries on
  const H = pool.price!;
  for (let i = pool.i; i <= end; i++) if (dir * (s.c[i] - H) >= 0) return no("a close beyond the swept pool");
  let away = 0;
  for (let i = sweep.i; i <= end; i++) away = Math.max(away, dir * (H - (dir > 0 ? s.l[i] : s.h[i])));
  if (away < 45) return no("no follow-through");
  if (end - opp.i < 12) return no("too little after the last pool");

  const chapters: Chapter[] = [
    { i: pool.i, title: pool.title, tone: pool.tone, price: pool.price, text: `The ${dir > 0 ? "push" : "drop"} leaves a ${dir > 0 ? "high" : "low"} at ${fmt(H)} that no bar since has traded ${dir > 0 ? "above" : "below"}: DS Parallax marks ${dir > 0 ? "buy" : "sell"}-side liquidity there on the ${panelWord(pool)}, where ${dir > 0 ? "buy stops rest above an unswept high" : "sell stops rest below an unswept low"}.` },
    { i: sweep.i, title: sweep.title, tone: sweep.tone, price: sweep.price, text: `Price runs the ${dir > 0 ? "buy" : "sell"}-side pool at ${fmt(H)} on the ${panelWord(sweep)} and the bar closes back ${dir > 0 ? "below" : "above"} it at ${fmt(s.c[sweep.i])}, so DS Parallax ghosts the level: a dashed trace ending in an x at the sweep.` },
    { i: next.i, title: next.title, tone: next.tone, price: next.price, text: `The sweep's own ${dir > 0 ? "high" : "low"}, ${fmt(next.price!)}, is now the nearest unswept ${dir > 0 ? "high" : "low"}: the ${panelWord(next)} marks it as the next ${dir > 0 ? "buy" : "sell"}-side pool, above the ghost of the one just run.`.replace("above the ghost", dir > 0 ? "above the ghost" : "below the ghost") },
    { i: opp.i, title: opp.title, tone: opp.tone, price: opp.price, text: `The move away from the sweep leaves a ${dir > 0 ? "low" : "high"} at ${fmt(opp.price!)} that no bar since has traded ${dir > 0 ? "below" : "above"}: the ${panelWord(opp)} marks ${dir > 0 ? "sell" : "buy"}-side liquidity there, where ${dir > 0 ? "sell stops rest below an unswept low" : "buy stops rest above an unswept high"}.` },
  ];
  for (let j = 1; j < chapters.length; j++) if (chapters[j].i - chapters[j - 1].i < 8) return no("moments crowded");
  for (const c of chapters) if (c.text.length > 240) return no("a moment runs long");
  const depth = Math.abs(next.price! - H);
  const score = Math.min(away, 120) + 2 * Math.min(depth, 15) + (/1h/.test(panelsOf(pool)) ? 10 : 0);
  return { score, chapters, note: `away ${away.toFixed(1)} · sweep depth ${depth.toFixed(2)} · [${ev.map((e) => `${e.i - f}:${e.title} ${fmt(e.price!)} (${panelsOf(e)})`).join(", ")}]` };
}

// ---------------------------------------------------------------- the scenarios
class Plan {
  beats: Beat[] = []; walls: Wall[] = []; touches: Touch[] = [];
  constructor(public at: number, private S: number, private dir: 1 | -1) {}
  /** a leg to x points from S on the story's side (price S + dir·x) */
  leg(x: number, bars: number, o: Partial<Beat> = {}): [number, number] { const a = this.at; this.beats.push({ to: this.S + this.dir * x, bars, vol: 0.55, ...o }); this.at += bars; return [a, this.at - 1]; }
  /** price stays beyond level (absolute) on side `toward` (+1 = the story's up side) */
  wall(from: number, to: number, level: number, toward: 1 | -1) {
    if (to < from) return;
    const up = this.dir * toward > 0;
    this.walls.push({ from, to, level, side: up ? "above" : "below", probe: 0 });
  }
  out() { return { beats: this.beats, walls: this.walls, touches: this.touches }; }
}

/** the designed warm-up: three sessions and this morning, in points from S on the story's side */
function warmup(S: number, dir: 1 | -1, r: (k: number) => number): Beat[] {
  const b = (x: number, bars: number, o: Partial<Beat> = {}): Beat => ({ to: S + dir * x, bars, vol: 0.55, ...o });
  const j = (k: number, a: number) => a * (r(k) - 0.5); // per-seed jitter
  return [
    // session D-3 (18:00 -> 18:00, the 17:00 hour included)
    b(330 + j(1, 30), 500), b(290 + j(2, 30), 300), b(320 + j(3, 30), 300), b(200, 340),
    // D-2: a down day
    b(250 + j(4, 30), 400), b(170 + j(5, 30), 300), b(40, 500), b(25, 240),
    // D-1: overnight up to a high under today's, an afternoon sell-off
    b(40 + j(6, 10), 600, { vol: 0.35 }), b(84 + j(7, 6), 300, { vol: 0.3 }), b(-55, 400), b(-50, 140),
    // today overnight: a bounce, a slide, a quiet rise, then a decisive break lower into the 09:15 low
    b(-22 + j(8, 8), 200, { vol: 0.35 }), b(-45 + j(9, 4), 340, { vol: 0.3 }), b(-26, 150, { vol: 0.2 }),
    b(-62, 30, { vol: 0.2, size: 1.2 }), b(-88, 195, { vol: 0.3 }),
    b(-80, 15, { vol: 0.4 }),                                 // 09:16–09:30
    b(104, 15, { shape: "accel", size: 1.6, vol: 0.4 }),      // 09:31–09:45: the cash-open drive, the day's high
    b(-33, 15, { size: 1.5, vol: 0.4 }),                      // 09:46–10:00: the flush
    b(-10, 12, { vol: 0.45 }), b(-27, 10, { vol: 0.45 }), b(-19, 8, { vol: 0.45 }), // 10:01–10:30: the base, a higher low
  ];
}
const WARM_BARS = 3 * 1440 + 990; // 18:00 three sessions back -> 10:30

function scenario(seed: number, dir: 1 | -1): Script {
  const S = 25900 + (seed % 9) * 20;
  const r = (k: number) => ((seed * 7919 + k * 104729 + (dir < 0 ? k * k * 3571 : 0)) % 1000) / 1000;
  const ext = (s: Session, i: number) => (dir > 0 ? s.h[i] : s.l[i]);   // the story side's extreme
  const opp = (s: Session, i: number) => (dir > 0 ? s.l[i] : s.h[i]);
  const best = (a: number, b: number) => (dir > 0 ? Math.max(a, b) : Math.min(a, b));
  const worst = (a: number, b: number) => (dir > 0 ? Math.min(a, b) : Math.max(a, b));
  const X = (price: number) => dir * (price - S);                      // price -> points from S
  return {
    seed, start: S + dir * 250, clock: 10 * 60 + 31, tf: 1, prelude: warmup(S, dir, r),
    walls: [
      { from: -24, to: -1, level: S - dir * 31, side: dir > 0 ? "above" : "below", probe: 0 },  // the base holds above the flush
      { from: 0, to: 14, level: S - dir * 29, side: dir > 0 ? "above" : "below", probe: 0 },    // the dip holds above the base
      { from: 0, to: 14, level: S - dir * 13, side: dir > 0 ? "below" : "above", probe: 0 },    // and stays under the base's high
    ],
    beats: [
      // 10:31–10:45: a higher low above the base
      { to: S + dir * (-22 - 3 * r(10)), bars: 8, vol: 0.45 }, { to: S + dir * (-17 - 3 * r(11)), bars: 7, vol: 0.45 },
      // 10:46–11:00: the V — a fresh 15m swing extreme
      { to: S + dir * (66 + 8 * r(12)), bars: 12, vol: 0.45, size: 1.25 }, { to: S + dir * (56 + 6 * r(13)), bars: 3, vol: 0.4 },
      (look: Look) => {
        const s = look.s, f = look.from;
        let H = dir > 0 ? -Infinity : Infinity, pre = H;
        for (let i = 15; i <= 29; i++) H = best(H, ext(s, f + i));
        for (let i = 0; i <= 14; i++) pre = best(pre, ext(s, f + i));
        let H0 = dir > 0 ? -Infinity : Infinity; // the day's high (low): the drive
        for (let i = f - 60; i < f - 45; i++) H0 = best(H0, ext(s, i));
        if (dir * (H - pre) < 30 || dir * (H0 - H) < 28) return null;
        const p = new Plan(30, S, dir);
        // 11:01–11:30: the pull back; 11:31–11:45: the second push begins, under the pool
        const k = 21 + Math.round(4 * r(14));
        p.leg(X(H) - 50 - 8 * r(16), k, { vol: 0.55, shape: "decel" });
        p.leg(X(H) - 22 - 6 * r(17), 45 - k, { vol: 0.55 });
        p.wall(30, 74, H - dir * 6, -1);
        return p.out();
      },
      (look: Look) => {
        const s = look.s, f = look.from;
        let H = dir > 0 ? -Infinity : Infinity, bottom = -H;
        for (let i = 15; i <= 29; i++) H = best(H, ext(s, f + i));
        for (let i = 30; i <= 74; i++) bottom = worst(bottom, opp(s, f + i));
        // the 15m panel's pool tolerance during the sweep bar: 0.25 x its Wilder ATR after the last closed 15m bar
        const H15 = buildHtf(s, 15, "15m");
        const atr = H15.atrAfter[H15.of[f + 74]];
        const tol = Math.max(0.25 * atr, s.tick);
        const p = new Plan(75, S, dir);
        const k1 = 3 + Math.round(3 * r(18));
        const [, u1] = p.leg(X(H) - 2.5, k1, { vol: 0.45 });
        p.wall(75, u1, H - dir * 1, -1);
        // the sweep: wicks run the pool by more than its tolerance, every close stays on this side
        const [t1] = p.leg(X(H) - 4 - 2 * r(19), 1, { vol: 0.1 });
        const d = (pts: number) => Math.round(pts / s.tick);
        p.touches.push({ i: t1, level: H, from: dir > 0 ? "below" : "above", depth: [d(tol + 1.5), d(tol + 8)] });
        p.wall(t1 + 1, 200, H - dir * 0.5, -1);
        // 11:5x–12:00: back off; 12:01–12:15: the drop to a fresh low (high) under the pull-back's
        p.leg(X(H) - 18 - 6 * r(20), 89 - t1, { vol: 0.5 });
        p.wall(t1 + 1, 89, bottom + dir * 5, 1);
        p.leg(X(bottom) - 14 - 10 * r(21), 9, { vol: 0.5, size: 1.1 });
        p.leg(X(bottom) - 6 - 4 * r(22), 6, { vol: 0.45 });
        return p.out();
      },
      (look: Look) => {
        const s = look.s, f = look.from;
        let B = Infinity * dir;
        for (let i = 90; i <= 104; i++) B = worst(B, opp(s, f + i));
        const p = new Plan(105, S, dir);
        p.leg(X(B) + 12 + 6 * r(23), 8, { vol: 0.45 });
        p.leg(X(B) + 5 + 4 * r(24), 7, { vol: 0.4 });
        p.leg(X(B) + 10 + 6 * r(25), 6, { vol: 0.4 });
        p.wall(105, 125, B + dir * 1.5, 1);
        return p.out();
      },
    ],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Buy-side sweep",
    title: "A buy-side pool forms over a fresh high; price runs it on wicks and turns down",
    premise: "Watch the 15m mini-panel: the push leaves an unswept high marked as buy-side liquidity, the next push runs it on wicks only and closes back under, DS Parallax ghosts the level, and the drop away leaves a fresh sell-side pool.",
    design: (seed) => scenario(seed, 1),
    seeds: Number(process.env.SEEDS ?? 150),
    judge: (run, s) => judge(run, s, 1),
  },
  {
    id: "b",
    tab: "Sell-side sweep",
    title: "A sell-side pool forms under a fresh low; price runs it on wicks and turns up",
    premise: "The same read on the other side: the drop leaves an unswept low marked as sell-side liquidity, the next flush runs it on wicks only and closes back above, the level is ghosted, and the rally away leaves a fresh buy-side pool.",
    design: (seed) => scenario(seed, -1),
    seeds: Number(process.env.SEEDS ?? 150),
    judge: (run, s) => judge(run, s, -1),
  },
];
