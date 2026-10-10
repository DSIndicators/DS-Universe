/**
 * DS Replay — build a product's showcase examples from RECORDED NQ.
 *
 *     npx tsx tools/showcase/build.ts <slug> [exampleId]
 *
 * The workflow (Tom, 2026-10-09): a real chart first, slight polish second,
 * the tool always the shipped one.
 *
 *  1. FIND    every session of the library (tools/showcase/library.ts) is
 *             run through the SHIPPED study (components/engine/studies/<slug>.ts,
 *             unchanged) once, and every candidate window in it is scored by the
 *             example's judge — which reads only the study's own output.
 *  2. PROVE   the best windows are cut exactly as they will be published (the
 *             warm-up the tool reads, the window the visitor sees) and judged
 *             again on that exact cut.
 *  3. POLISH  where the judge points at a flaw (a stray signal, a level clipped
 *             by one wick), small bounded edits are tried on the bars around it
 *             (tools/showcase/tweak.ts) and kept only if they make the tool's
 *             own story cleaner. Every edit is logged.
 *  4. WRITE   public/engine/ex/<slug>-<id>.json (no instrument, no date — the
 *             clock and weekday stay, the date is moved by whole weeks) and the
 *             provenance + edit log to tools/showcase/log/<slug>-<id>.json.
 *
 * The no-repaint proof then runs on the published file:
 *     npx tsx tools/engine-check.ts <slug> public/engine/ex/<slug>-a.json …
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fromRaw } from "../../components/engine/data";
import type { Session, StudyDef, StudyEvent, StudyRun } from "../../components/engine/types";
import { check, clone, clock, cut, days, joinDays, loadDay, mod, prevDay, resampleDay, type Cut, type Day } from "./library";
import { apply, BUDGET, candidates, describe, type Edit } from "./tweak";
import { compose, type Script } from "./design";

export type Chapter = { i: number; title: string; text: string; tone: StudyEvent["tone"]; price?: number };
export type Judged = {
  score: number;
  chapters: Chapter[];
  note?: string;
  /** bars where the tool did something that muddies the story (a stray signal …) — the polish works around these */
  flaws?: number[];
};

export type Find = {
  /** bar size in minutes (default 1) */
  tf?: number;
  /** shown bars: [shortest, longest] */
  bars: [number, number];
  /** window starts are tried every `step` bars (default 10) */
  step?: number;
  /** window lengths tried, evenly spaced from shortest to longest (default 5) */
  lengths?: number;
  /** clock window the SHOWN bars must sit in, as minutes of the day of their close: [first, last] (default 09:31–16:00) */
  hours?: [number, number];
  /** only these first-bar closes (minutes of the day), e.g. [18 * 60 + 5] for a session that starts at the open */
  startAt?: number[];
  /** warm-up bars before the window (default: back to the session's 18:00 open) */
  prelude?: number;
  /** whole sessions joined before the window's session (default 0) */
  history?: number;
  /** the shown window must be real trade data (footprint) — on by default when the study needs order flow */
  flow?: boolean;
};

export type ExampleDef = {
  id: string;
  /** a few words, shown on the example's tab */
  tab: string;
  title: string;
  /** one or two sentences: what to watch for */
  premise: string;
  /** a recorded window: where to look in the library */
  find?: Find;
  /** OR a designed scenario: the pattern for one seed (tools/showcase/design.ts); real candles fill it */
  design?: (seed: number) => Script;
  /** seeds tried for a designed scenario (default 200) */
  seeds?: number;
  judge: (run: StudyRun, s: Session) => Judged | null;
  /** extra feed for studies that need one (e.g. DS GEX's level map), built from the cut */
  extra?: (c: Cut, s: Session) => Record<string, unknown>;
  /** set false to publish the best window untouched */
  polish?: boolean;
};

/** events of the example window */
export const shown = (run: StudyRun, s: Session) => run.events.filter((e) => e.i >= s.replayFrom && e.i < s.n);
export const chapter = (e: StudyEvent): Chapter => ({ i: e.i, title: e.title, text: e.text, tone: e.tone, price: e.price });

export const toSession = (c: Cut, extra?: Record<string, unknown>): Session =>
  ({ ...fromRaw({ day: "", sym: "", name: "", tick: 0.25, n: c.n, replayFrom: c.replayFrom, t: c.t, o: c.o, h: c.h, l: c.l, c: c.c, vol: c.vol, buy: c.buy, sell: c.sell, fp: c.fp, path: c.path, pathReal: c.pathReal } as never), extra });

/** the warm-up only feeds the tool: it keeps its OHLCV and buy/sell, and its footprint only when the tool reads order
 *  flow; its intrabar paths are kept for the last PATH_KEEP bars (a tool may read the recent paths, e.g. DS Chart
 *  Price's pre-roll) and reduced to open–extreme–extreme–close before that */
const PATH_KEEP = 120;
function slim(c: Cut, keepFlow: boolean): Cut {
  for (let i = 0; i < c.replayFrom; i++) {
    if (!keepFlow) { c.fp.lo[i] = 0; c.fp.bid[i] = []; c.fp.ask[i] = []; }
    if (i >= c.replayFrom - PATH_KEEP) continue;
    const o = c.o[i], q = (p: number) => Math.round((p - o) / 0.25);
    const hi = q(c.h[i]), lo = q(c.l[i]), cl = q(c.c[i]);
    c.path[i] = Math.abs(lo) < Math.abs(hi) ? [0, lo, hi, cl] : [0, hi, lo, cl];
    c.path[i] = c.path[i].filter((v, j, a) => j === 0 || v !== a[j - 1]);
    if (c.path[i][c.path[i].length - 1] !== cl) c.path[i].push(cl);
    if (!keepFlow) c.pathReal[i] = 0;
  }
  return c;
}

/**
 * REALISM GATE for designed scenarios (Tom: "these formations ... look like renko bars"). Measured on the shown
 * bars against 1,237 recorded 100-bar cash-session windows: real NQ's longest run of same-colour candles is
 * 6 at the median and 9 at the 90th percentile, its longest run of closes in one direction the same, and 60–67%
 * of its candle bodies overlap the body before them. A designed window must sit inside that: runs <= 9, bodies
 * overlapping >= 55%.
 */
export function realism(c: Cut): { ok: boolean; maxRun: number; maxMono: number; overlap: number } {
  let run = 0, maxRun = 0, prev = 0, mono = 0, maxMono = 0, ov = 0, n = 0;
  for (let i = c.replayFrom; i < c.n; i++) {
    const col = c.c[i] > c.o[i] ? 1 : c.c[i] < c.o[i] ? -1 : 0;
    run = col !== 0 && col === prev ? run + 1 : 1; prev = col; maxRun = Math.max(maxRun, run);
    if (i > c.replayFrom) {
      const d = Math.sign(c.c[i] - c.c[i - 1]);
      mono = d !== 0 && d === Math.sign(c.c[i - 1] - c.c[i - 2]) ? mono + 1 : 1; maxMono = Math.max(maxMono, mono);
      const t1 = Math.max(c.o[i], c.c[i]), b1 = Math.min(c.o[i], c.c[i]), t0 = Math.max(c.o[i - 1], c.c[i - 1]), b0 = Math.min(c.o[i - 1], c.c[i - 1]);
      if (Math.min(t1, t0) - Math.max(b1, b0) > 0) ov++;
      n++;
    }
  }
  const overlap = ov / Math.max(1, n);
  return { ok: maxRun <= 9 && maxMono <= 9 && overlap >= 0.55, maxRun, maxMono, overlap };
}

/** what the tool shows, bar by bar (events, status, readout) — to prove a lighter file draws the same */
function fingerprint(def: StudyDef, s: Session): string {
  const run = def.run(s);
  const parts: string[] = [JSON.stringify(run.events)];
  for (let k = s.replayFrom; k < s.n; k += 3) parts.push(JSON.stringify(run.status?.(k, null) ?? []), JSON.stringify(run.readout?.(k) ?? []), JSON.stringify(run.candle?.(k) ?? null));
  return parts.join("|");
}

/** a session truncated at bar `end` and shown from `from`, plus the run seen up to `end` — exact for a non-repainting study */
function view(s: Session, run: StudyRun, from: number, end: number): { s: Session; run: StudyRun } {
  const n = end + 1;
  const vs: Session = {
    ...s, n, replayFrom: from,
    t: s.t.subarray(0, n), o: s.o.subarray(0, n), h: s.h.subarray(0, n), l: s.l.subarray(0, n), c: s.c.subarray(0, n),
    v: s.v.subarray(0, n), buy: s.buy.subarray(0, n), sell: s.sell.subarray(0, n),
    fp: { lo: s.fp.lo.subarray(0, n), bid: s.fp.bid.slice(0, n), ask: s.fp.ask.slice(0, n) },
    path: s.path.slice(0, n), pathReal: s.pathReal.subarray(0, n),
  };
  return { s: vs, run: { ...run, events: run.events.filter((e) => e.i <= end) } };
}

type Cand = { day: string; a: number; b: number; score: number };

/** the bar series a day's windows are cut from: `history` earlier sessions + the day, at the example's bar size */
function series(day: string, f: Find): { d: Day; open: number } | null {
  const list: Day[] = [];
  let cur: string | null = day;
  for (let h = 0; h <= (f.history ?? 0); h++) {
    if (!cur) return null;
    list.unshift(loadDay(cur));
    cur = prevDay(cur);
  }
  const joined = resampleDay(list.length > 1 ? joinDays(list) : list[0], f.tf ?? 1);
  // index of the first bar of the window's own session (its 18:00 open)
  const lastDay = loadDay(day);
  const firstT = lastDay.t[0];
  const open = joined.t.findIndex((t) => t >= firstT);
  return { d: joined, open: Math.max(0, open) };
}

function windows(d: Day, open: number, f: Find, flow: boolean): [number, number][] {
  const [minB, maxB] = f.bars;
  const step = f.step ?? 10;
  const [h0, h1] = f.hours ?? [571, 960];
  const nL = f.lengths ?? 5;
  const lens = Array.from({ length: nL }, (_, j) => Math.round(minB + ((maxB - minB) * j) / Math.max(1, nL - 1))).filter((v, j, a) => a.indexOf(v) === j);
  const inHours = (t: number) => { const m = mod(t); return h0 <= h1 ? m >= h0 && m <= h1 : m >= h0 || m <= h1; };
  const out: [number, number][] = [];
  const pre = f.prelude ?? 0;
  for (let a = Math.max(open, pre); a < d.n; a++) {
    if (f.startAt ? !f.startAt.includes(mod(d.t[a])) : (a - open) % step !== 0) continue;
    if (!inHours(d.t[a])) continue;
    for (const L of lens) {
      const b = a + L - 1;
      if (b >= d.n) continue;
      // contiguous bars (no session break inside the window), all in hours, real where flow matters
      let ok = true;
      for (let i = a; i <= b && ok; i++) {
        if (i > a && d.t[i] - d.t[i - 1] > (f.tf ?? 1) * 3) ok = false;
        if (!inHours(d.t[i])) ok = false;
        if (flow && !d.real[i]) ok = false;
      }
      if (ok) out.push([a, b]);
    }
  }
  return out;
}

function exactCut(day: string, a: number, b: number, f: Find, keepFlow: boolean): Cut | null {
  const ser = series(day, f);
  if (!ser) return null;
  const from = f.prelude !== undefined ? Math.max(0, a - f.prelude) : f.history ? 0 : ser.open;
  return slim(cut(ser.d, from, a, b), keepFlow);
}

function judgeCut(def: StudyDef, ex: ExampleDef, c: Cut): { j: Judged | null; s: Session } {
  const s0 = toSession(c);
  const extra = ex.extra?.(c, s0);
  const s = extra ? toSession(c, extra) : s0;
  let j: Judged | null = null;
  try { j = ex.judge(def.run(s), s); } catch (e) { console.error("  judge error:", (e as Error).message); }
  return { j, s };
}

async function main() {
  const slug = process.argv[2], only = process.argv[3];
  const def: StudyDef = (await import(`../../components/engine/studies/${slug}.ts`)).study;
  const exs: ExampleDef[] = (await import(`./examples/${slug}.ts`)).examples;
  mkdirSync("public/engine/ex", { recursive: true });
  mkdirSync("tools/showcase/log", { recursive: true });
  const keepFlow = !!def.needs?.flow;
  const all = days();

  for (const ex of exs) {
    if (only && ex.id !== only) continue;
    const t0 = Date.now();
    let proven: { c: Cut; j: Judged; s: Session; cand: Cand }[] = [];
    if (ex.design) {
      // ---- DESIGN: the scenario composed from real candles for each seed, judged on the tool's own output
      const N = ex.seeds ?? 200;
      let ok = 0, failed = 0, unreal = 0;
      const whyFail: Record<string, number> = {};
      for (let seed = 1; seed <= N; seed++) {
        let c: Cut;
        const look = (cc: Cut) => { const s0 = toSession(cc); const x = ex.extra?.(cc, s0); const s = x ? toSession(cc, x) : s0; return { s, run: def.run(s) }; };
        // each example draws its own seeds (a mirrored scenario must never repeat its sibling's candles)
        const sd = seed + 100003 * exs.indexOf(ex);
        try { c = slim(compose(ex.design(sd), look), keepFlow); } catch (e) { failed++; if (process.env.WHY) { const m = (e as Error).message; whyFail[m.replace(/\d+/g, "#")] = (whyFail[m.replace(/\d+/g, "#")] ?? 0) + 1; } continue; }
        if (!realism(c).ok) { unreal++; continue; }
        const { j, s } = judgeCut(def, ex, c);
        if (j) { ok++; proven.push({ c, j, s, cand: { day: `seed ${sd}`, a: c.replayFrom, b: c.n - 1, score: j.score } }); }
      }
      proven.sort((x, y) => y.j.score - x.j.score);
      proven = proven.slice(0, 8);
      console.log(`${slug}-${ex.id}: ${N} designed seeds · ${ok} told the story${failed ? ` · ${failed} could not be filled with real candles` : ""}${unreal ? ` · ${unreal} failed the realism gate` : ""} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      const rj = (await import(`./examples/${slug}.ts`)).rejects as Record<string, number> | undefined;
      if (rj && process.env.WHY) { console.log("  rejects:", Object.entries(rj).sort((x, y) => y[1] - x[1]).slice(0, 12)); for (const k in rj) delete rj[k]; }
      if (process.env.WHY && failed) console.log("  composer:", whyFail);
      if (!proven.length) { console.log(`${slug}-${ex.id}: NO SEED QUALIFIED`); continue; }
    } else {
      const f = ex.find!;
      const flow = f.flow ?? keepFlow;

      // ---- 1. FIND: one run per session, every window in it judged on that run
      const found: Cand[] = [];
      let tried = 0;
      for (const day of all) {
        const ser = series(day, f);
        if (!ser) continue;
        const ws = windows(ser.d, ser.open, f, flow);
        if (!ws.length) continue;
        const first = ws[0][0];
        const from = f.prelude !== undefined ? Math.max(0, first - f.prelude) : f.history ? 0 : ser.open;
        const c = slim(cut(ser.d, from, first, ser.d.n - 1), keepFlow);
        const s0 = toSession(c);
        const extra = ex.extra?.(c, s0);
        const s = extra ? toSession(c, extra) : s0;
        let run: StudyRun;
        try { run = def.run(s); } catch (e) { console.error(`  ${day}: run failed`, (e as Error).message); continue; }
        for (const [a, b] of ws) {
          tried++;
          const v = view(s, run, a - from, b - from);
          let j: Judged | null = null;
          try { j = ex.judge(v.run, v.s); } catch { j = null; }
          if (j) found.push({ day, a, b, score: j.score });
        }
      }
      found.sort((x, y) => y.score - x.score);
      // one window per stretch of tape: drop windows overlapping a better one by more than a third
      const picks: Cand[] = [];
      for (const c of found) {
        if (picks.some((p) => p.day === c.day && Math.min(p.b, c.b) - Math.max(p.a, c.a) > (c.b - c.a) / 3)) continue;
        picks.push(c);
        if (picks.length >= 30) break;
      }
      console.log(`${slug}-${ex.id}: ${tried} windows in ${all.length} sessions · ${found.length} told the story · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      const rj = (await import(`./examples/${slug}.ts`)).rejects as Record<string, number> | undefined;
      if (rj && process.env.WHY) { console.log("  rejects:", Object.entries(rj).sort((x, y) => y[1] - x[1]).slice(0, 12)); for (const k in rj) delete rj[k]; }
      if (!picks.length) { console.log(`${slug}-${ex.id}: NO WINDOW QUALIFIED`); continue; }

      // ---- 2. PROVE: the exact cut, judged again
      for (const p of picks) {
        const c = exactCut(p.day, p.a, p.b, f, keepFlow);
        if (!c) continue;
        const { j, s } = judgeCut(def, ex, c);
        if (j) proven.push({ c, j, s, cand: p });
      }
      proven.sort((x, y) => y.j.score - x.j.score);
      if (process.env.TOP) for (const p of proven.slice(0, Number(process.env.TOP) || 5)) console.log(`   candidate ${p.cand.day} ${p.c.src.from}–${p.c.src.to} (${p.c.n - p.c.replayFrom} bars) score ${p.j.score.toFixed(2)}${p.j.note ? ` · ${p.j.note}` : ""}`);
      if (!proven.length) { console.log(`${slug}-${ex.id}: no window held up on its exact cut`); continue; }

    }
    let best: { c: Cut; j: Judged; s: Session; cand: Cand; edits: Edit[] } | null = null;

    // ---- 3. POLISH: bounded edits around the flaws the judge points at
    for (const pv of proven.slice(0, 5)) {
      let cur = { c: pv.c, j: pv.j, s: pv.s, edits: [] as Edit[] };
      if (ex.polish !== false && !ex.design) {
        for (let round = 0; round < BUDGET.edits; round++) {
          const flaws = (cur.j.flaws ?? []).filter((i) => i >= cur.c.replayFrom);
          if (!flaws.length) break;
          let bestTry: typeof cur | null = null;
          for (const fl of flaws.slice(0, 3)) for (let i = fl; i >= Math.max(cur.c.replayFrom, fl - 3); i--) {
            for (const e of candidates(cur.c, i)) {
              if (e.op === "removeSpike" && cur.edits.filter((x) => x.op === "removeSpike").length >= BUDGET.spikes) continue;
              if (cur.edits.some((x) => x.i === e.i)) continue; // one edit per bar
              const c2 = clone(cur.c);
              if (!apply(c2, e)) continue;
              if (check(c2, c2.replayFrom).length) continue;
              const { j, s } = judgeCut(def, ex, c2);
              if (!j) continue;
              const better = (j.flaws?.length ?? 0) < (cur.j.flaws?.length ?? 0) || ((j.flaws?.length ?? 0) === (cur.j.flaws?.length ?? 0) && j.score > cur.j.score + 1e-9);
              if (better && (!bestTry || j.score > bestTry.j.score || (j.flaws?.length ?? 0) < (bestTry.j.flaws?.length ?? 0))) bestTry = { c: c2, j, s, edits: [...cur.edits, e] };
            }
          }
          if (!bestTry) break;
          cur = bestTry;
        }
      }
      if (!best || cur.j.score > best.j.score) best = { ...cur, cand: pv.cand };
    }
    const { c, j, cand, edits, s } = best!;
    const bad = check(c, c.replayFrom);
    if (bad.length) { console.log(`${slug}-${ex.id}: BAR CHECK FAILED`, bad.slice(0, 5)); continue; }

    // ---- 4. WRITE — the shown window's footprint is dropped when the tool is not an order-flow tool and
    //      provably draws the same without it (events, status, readout, candle colours)
    if (!keepFlow) {
      const lite = clone(c);
      for (let i = lite.replayFrom; i < lite.n; i++) { lite.fp.lo[i] = 0; lite.fp.bid[i] = []; lite.fp.ask[i] = []; }
      const heavy = fingerprint(def, s), light = fingerprint(def, toSession(lite, s.extra));
      if (heavy === light) { c.fp.lo = lite.fp.lo; c.fp.bid = lite.fp.bid; c.fp.ask = lite.fp.ask; }
    }
    const file = {
      v: 3, kind: "example", slug, id: ex.id, tab: ex.tab, title: ex.title, premise: ex.premise,
      tick: 0.25, tf: c.tf, n: c.n, replayFrom: c.replayFrom,
      t: c.t, o: c.o, h: c.h, l: c.l, c: c.c, vol: c.vol, buy: c.buy, sell: c.sell, fp: c.fp, path: c.path, pathReal: c.pathReal,
      chapters: j.chapters, extra: s.extra, edits: edits.length,
      day: "", sym: "", name: "",
    };
    writeFileSync(`public/engine/ex/${slug}-${ex.id}.json`, JSON.stringify(file));
    const log = {
      slug, id: ex.id, built: new Date().toISOString(), score: j.score,
      source: { ...c.src, session: cand.day, windowBars: c.n - c.replayFrom, warmupBars: c.replayFrom },
      edits: edits.map((e) => ({ ...e, bar: e.i - c.replayFrom, at: clock(c.t[e.i]), what: describe(e, c) })),
      chapters: j.chapters.map((ch) => ({ bar: ch.i - c.replayFrom, at: clock(c.t[ch.i]), title: ch.title, text: ch.text })),
      note: j.note,
    };
    writeFileSync(`tools/showcase/log/${slug}-${ex.id}.json`, JSON.stringify(log, null, 1));
    console.log(`${slug}-${ex.id}: ${cand.day} ${c.src.from}–${c.src.to} (${c.n - c.replayFrom} bars, warm-up ${c.replayFrom}) · score ${j.score.toFixed(2)} · ${edits.length} edit${edits.length === 1 ? "" : "s"} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    for (const e of log.edits) console.log(`   edit  ${e.what}`);
    for (const ch of j.chapters) console.log(`   ${String(ch.i - c.replayFrom).padStart(4)}  ${ch.title.padEnd(28)} ${ch.text.slice(0, 120)}`);
    if (j.note) console.log(`   note: ${j.note}`);
  }
}

if (process.argv[1]?.endsWith("build.ts")) main();
