import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Stage, Wall } from "../design";
import { shown } from "../build";
import type { ReadItem, Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS MACD — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * (a) BULL SETUP: a stretched drop takes MACD-V into the shaded risk band; the
 *     cross out of the low with a growing histogram prints the BULL SETUP (the M
 *     mark at the low), MACD-V goes back through zero (CENTERLINE UP) and the
 *     turn carries on. (b) BEAR SETUP: the mirror at a top.
 *
 * The pattern is written (tools/showcase/design.ts) in multi-bar legs, each one
 * filled with a REAL recorded stretch of consecutive one-minute bars (real
 * overlap, counter-candles, wick clusters), so the tape passes the realism gate
 * (build.ts realism()). Nothing is steered bar by bar: one stage at the low (top)
 * walls price on its side of it for the rest of the example, and the strict
 * judge keeps only seeds on which the tool's own output tells the story with
 * nothing else on stage.
 *
 * Why no divergence example (Tom's standard, no signal that later fails): with
 * the shipped rules a regular divergence needs the deeper pivot beyond ±50, and
 * the cross on the swing between the two extremes then prints a setup that the
 * second extreme fails in nearly every case. On real-looking tape (no bar-by-bar
 * steering) 1 seed in 3000 avoided it, so the second face is the BEAR SETUP.
 *
 * ZERO FLAWS on stage: exactly the setup and its centerline cross — no other
 * setup, no divergence, no other narrated centerline cross — price never back
 * past the extreme, the move carries to the end, no turn against it on the last
 * bars the chart opens on.
 */

const memo = new WeakMap<StudyRun, Map<number, ReadItem[]>>();
const readout = (run: StudyRun, i: number) => { let m = memo.get(run); if (!m) { m = new Map(); memo.set(run, m); } if (!m.has(i)) m.set(i, run.readout?.(i) ?? []); return m.get(i)!; };
const rv = (run: StudyRun, i: number, label: string) => String(readout(run, i).find((x) => x.label === label)?.value ?? "");
const f2 = (x: number) => x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const P = (t: string) => Number(t.replace(/,/g, ""));

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

/** follow-through after bar k: never back beyond `stop`, carrying to the end */
function follow(s: Session, d: 1 | -1, k: number, stop: number) {
  const end = s.n - 1;
  for (let i = k + 1; i <= end; i++) if (d > 0 ? s.l[i] < stop : s.h[i] > stop) return null;
  let best = 0, bestI = k, adverse = 0;
  for (let i = k + 1; i <= end; i++) {
    const f = d * ((d > 0 ? s.h[i] : s.l[i]) - s.c[k]);
    if (f > best) { best = f; bestI = i; }
    adverse = Math.max(adverse, -d * ((d > 0 ? s.l[i] : s.h[i]) - s.c[k]));
  }
  return { fin: d * (s.c[end] - s.c[k]), best, bestI, adverse };
}

/** the panel's headline on the last bars shows no cross or turn against the story (the chart opens on that read) */
const quietEnd = (run: StudyRun, s: Session, bull: boolean) => {
  for (let i = s.n - 3; i < s.n; i++) if (new RegExp(`${bull ? "▼" : "▲"} (TURNED|BULL CROSS|BEAR CROSS)`).test(rv(run, i, "Read"))) return false;
  return true;
};

// ------------------------------------------------------------------ judge (a): the setup out of the risk band
function judgeSetup(d: 1 | -1) {
  const bull = d > 0;
  const SET = bull ? "BULL SETUP" : "BEAR SETUP", CL = bull ? "CENTERLINE UP" : "CENTERLINE DOWN", RISK = bull ? "RISK LOW" : "RISK HIGH";
  return (run: StudyRun, s: Session): Judged | null => {
    const from = s.replayFrom, end = s.n - 1;
    const ev = shown(run, s);
    const sets = ev.filter((e) => /SETUP$/.test(e.title));
    if (sets.length !== 1 || sets[0].title !== SET) return no(sets.length ? "not exactly one setup, the story's" : "no setup");
    const st = sets[0];
    const cls = ev.filter((e) => /CENTERLINE/.test(e.title));
    if (cls.length !== 1 || cls[0].title !== CL || cls[0].i < st.i) return no("not exactly one centerline cross, after the setup");
    const cl = cls[0];
    if (ev.length !== 2) return no("other narration");
    // the setup is at the low: the window's extreme within a few bars before it
    let xi = from;
    for (let i = from; i <= end; i++) if (d * ((bull ? s.l[xi] : s.h[xi]) - (bull ? s.l[i] : s.h[i])) > 0) xi = i;
    if (st.i - xi < 1 || st.i - xi > 7) return no("the setup is not at the low");
    if (xi - from < 25) return no("the low is too early");
    const ft = follow(s, d, st.i, bull ? s.l[xi] : s.h[xi]);
    if (!ft) return no("back to the low after the setup");
    if (ft.fin < 40) return no("not enough follow-through");
    if (end - ft.bestI > 6) return no("the move did not carry to the end");
    if (end - cl.i < 14) return no("centerline at the very end");
    if (!quietEnd(run, s, bull)) return no("a turn against the story on the last bars");
    let sk = -1;
    for (let i = from + 1; i <= xi; i++) if (rv(run, i, "Regime") === RISK && rv(run, i - 1, "Regime") !== RISK) { sk = i; break; }
    if (sk < 0) return no("never in the risk band");
    let deepest = 0;
    for (let i = sk; i <= st.i; i++) deepest = Math.max(deepest, -d * Number(rv(run, i, "MACD-V")));
    const ext = st.text.match(/took MACD-V to (-?\d+)/)?.[1];
    if (!ext) return no("setup text");

    // the stretch: where the ribbon turns RISK, or — when that is too close to the setup — where MACD-V first
    // leaves the ranging band on the way there
    let stretch: Chapter = { i: sk, title: RISK, tone: bull ? "bear" : "bull", price: s.c[sk],
      text: `The ${bull ? "drop" : "rally"} takes MACD-V to ${rv(run, sk, "MACD-V")}, past ${bull ? "-" : "+"}150 into the shaded risk band: the ribbon turns ${RISK}. A leg beyond ${bull ? "-" : "+"}50 is what a later cross needs to count as a setup.` };
    if (st.i - sk < 8) {
      const LEAVE = bull ? "REVERSING" : "RALLYING";
      let lk = -1;
      for (let i = from + 1; i < sk; i++) if (rv(run, i, "Regime") === LEAVE && rv(run, i - 1, "Regime") === "RANGING") lk = i;
      if (lk < 0 || st.i - lk < 8) return no("moments crowded");
      stretch = { i: lk, title: LEAVE, tone: bull ? "bear" : "bull", price: s.c[lk],
        text: `The ${bull ? "drop" : "rally"} takes MACD-V past ${bull ? "-" : "+"}50 (now ${rv(run, lk, "MACD-V")}), out of the ranging band, on its way to ${bull ? "-" : "+"}${Math.round(deepest)} in the shaded risk band. A leg this deep is what a later cross needs to count as a setup.` };
    }
    const chapters: Chapter[] = [
      stretch,
      { i: st.i, title: st.title, tone: st.tone, price: st.price,
        text: `Out of a leg that took MACD-V to ${ext}, the MACD crosses ${bull ? "above" : "below"} its signal and the histogram grows on the next bar: the ${SET}, marked M at the ${bull ? "low" : "high"}.` },
      { i: cl.i, title: cl.title, tone: cl.tone, price: cl.price,
        text: `MACD-V goes back through zero ${bull ? "upward" : "downward"} (now ${rv(run, cl.i, "MACD-V")}): the fast EMA has crossed the slow one, graded by the leg it left, which reached beyond ±50.` },
    ];
    for (let j = 1; j < chapters.length; j++) if (chapters[j].i - chapters[j - 1].i < 8) return no("moments crowded");
    // a fourth moment: the rally's own regime, from the ribbon, when it reaches the RALLYING / REVERSING band
    const MOVE = bull ? "RALLYING" : "REVERSING";
    for (let i = cl.i + 1; i <= end - 4; i++) if (rv(run, i, "Regime") === MOVE && rv(run, i - 1, "Regime") !== MOVE && i - cl.i >= 8) {
      chapters.push({ i, title: MOVE, tone: bull ? "bull" : "bear", price: s.c[i],
        text: `MACD-V passes ${bull ? "+" : "-"}50 (now ${rv(run, i, "MACD-V")}) with the histogram still ${bull ? "above" : "below"} zero: the ribbon reads ${MOVE}.` });
      break;
    }
    for (const c of chapters) if (c.text.length > 240) throw new Error(`moment too long (${c.text.length}): ${c.text}`);
    const score = 0.6 * Math.min(ft.fin, 140) + 0.2 * Math.min(ft.best, 160) - 1.2 * Math.max(0, ft.adverse - 8) + 0.1 * Math.min(150, deepest - 150) + 4 * chapters.length;
    return { score, chapters, note: `fin ${ft.fin.toFixed(1)} best ${ft.best.toFixed(1)} adverse ${ft.adverse.toFixed(1)} deepest ${deepest.toFixed(0)} ext ${ext}` };
  };
}

// ------------------------------------------------------------------ the scenarios
/**
 * Every leg is several bars long, so the composer fills it with a REAL recorded stretch of
 * consecutive one-minute bars that travels the leg's distance (real overlap, counter-candles,
 * wick clusters). There is no bar-by-bar steering: the tape is left to be real, and the
 * strict judge keeps only seeds on which the tool's own output tells the story with nothing
 * else on stage. Stages sit at story points only (the low, the top), to read where price
 * turned and keep it from going back there.
 */
const warmup = (S: number): Beat[] => [
  { to: S + 8, bars: 50, vol: 0.45, size: 0.8 }, { to: S - 6, bars: 55, vol: 0.45, size: 0.8 },
  { to: S + 4, bars: 45, vol: 0.45, size: 0.8 }, { to: S, bars: 40, vol: 0.4, size: 0.8 },
];
const extreme = (dir: 1 | -1, look: Look, a: number, b: number, against = false) => { // low for dir 1 (high when `against`)
  const lo = (dir > 0) !== against;
  let x = lo ? Infinity : -Infinity;
  for (let i = look.from + a; i <= look.from + b && i < look.s.n; i++) x = lo ? Math.min(x, look.s.l[i]) : Math.max(x, look.s.h[i]);
  return x;
};
const hold = (dir: 1 | -1, look: Look, level: number, bars: number): Wall =>
  ({ from: look.at, to: look.at + bars, level: level + dir * 0.75, side: dir > 0 ? "above" : "below", probe: 0 });

/**
 * (a) dir 1: a quiet lead; the stretched drop in two legs with a short pause; at the low a
 * stage walls price above it, and the turn up is a measured climb (in legs with real
 * pullbacks) — the cross out of the low, its growing histogram and the centerline are the
 * tool's. dir -1 is the mirror.
 */
function setupScenario(seed: number, dir: 1 | -1): Script {
  const S = 26420 + (seed % 9) * 13;
  const p = (pts: number) => S + dir * pts;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  const drop = 85 + 30 * r(1);
  const beats: (Beat | Stage)[] = [
    { to: p(3 + 6 * r(2)), bars: 14 + Math.round(6 * r(3)), vol: 0.5, size: 0.85 },                        // quiet lead
    { to: p(-drop), bars: 19 + Math.round(6 * r(5)), vol: 0.55, size: 1.05, shape: "accel" },              // the stretched drop into the low
    (look) => {
      const low = extreme(dir, look, 0, look.at - 1);
      const up = (k: number, lo: number, span: number) => look.last + dir * (lo + span * r(k));
      const a1 = up(10, 20, 8), b1 = a1 - dir * (4 + 4 * r(11)), a2 = b1 + dir * (24 + 8 * r(12)), b2 = a2 - dir * (4 + 4 * r(13)), a3 = b2 + dir * (22 + 10 * r(14));
      return {
        beats: [
          { to: a1, bars: 6 + Math.round(3 * r(15)), vol: 0.55, size: 1.0 },
          { to: b1, bars: 3 + Math.round(2 * r(16)), vol: 0.5, size: 0.9 },
          { to: a2, bars: 9 + Math.round(4 * r(17)), vol: 0.6, size: 1.0 },
          { to: b2, bars: 3 + Math.round(2 * r(18)), vol: 0.5, size: 0.9 },
          { to: a3, bars: 9 + Math.round(5 * r(19)), vol: 0.6, size: 1.0 },
        ],
        walls: [hold(dir, look, low, 80)],
      };
    },
  ];
  return { seed, start: S, clock: 11 * 60 + 5 + Math.round(25 * r(0)), prelude: warmup(S), beats };
}

/**
 * (b) dir 1 (bullish; the published example is the mirror, dir -1): a quiet lead; a steady
 * leg into the first low (MACD-V a little past -50); a bounce; a slower second leg that a
 * stage aims just below the first low; and the turn, a stage walling price above the new low,
 * up through the bounce extreme and through zero.
 */
function divScenario(seed: number, dir: 1 | -1): Script {
  const S = 26420 + (seed % 9) * 13;
  const p = (pts: number) => S + dir * pts;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  const leg1 = 42 + 16 * r(1);
  const L = { low1: NaN, from: 0 };
  const beats: (Beat | Stage)[] = [
    { to: p(3 + 5 * r(2)), bars: 14 + Math.round(5 * r(3)), vol: 0.5, size: 0.85 },                         // quiet lead
    { to: p(-leg1), bars: 15 + Math.round(6 * r(4)), vol: 0.5, size: 0.95, shape: "decel" },                  // a steady leg into the first low
    (look) => {
      L.low1 = extreme(dir, look, 0, look.at - 1); L.from = look.at;
      return { beats: [
        { to: look.last + dir * leg1 * (0.3 + 0.1 * r(5)), bars: 6 + Math.round(3 * r(6)), vol: 0.5, size: 0.95 },  // the bounce
        { to: L.low1 - dir * (5 + 6 * r(7)), bars: 14 + Math.round(6 * r(8)), vol: 0.5, size: 0.9, shape: "decel" }, // the slower second leg
      ] };
    },
    (look) => {
      const low2 = extreme(dir, look, L.from, look.at - 1);
      const top = extreme(dir, look, L.from, look.at - 1, true);
      return {
        beats: [
          { to: look.last + dir * (14 + 6 * r(9)), bars: 6 + Math.round(2 * r(10)), vol: 0.5, size: 1.0 },
          { to: top + dir * (6 + 8 * r(11)), bars: 9 + Math.round(4 * r(12)), vol: 0.55, size: 1.0 },
          { to: top + dir * (2 + 6 * r(13)), bars: 3 + Math.round(2 * r(14)), vol: 0.45, size: 0.9 },
          { to: top + dir * (22 + 12 * r(15)), bars: 10 + Math.round(5 * r(16)), vol: 0.6, size: 1.0 },
        ],
        walls: [hold(dir, look, low2, 80)],
      };
    },
  ];
  return { seed, start: S, clock: 11 * 60 + 5 + Math.round(25 * r(0)), prelude: warmup(S), beats };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Bull setup",
    title: "A stretched drop, the setup out of the low, and the turn up",
    premise: "Watch the drop stretch MACD-V into the shaded risk band. At the low the MACD crosses its signal and the histogram grows: the BULL SETUP prints its M, and MACD-V climbs back through zero as the turn carries on.",
    design: (seed) => setupScenario(seed, 1),
    seeds: 1500,
    judge: judgeSetup(1),
  },
  {
    id: "b",
    tab: "Bear setup",
    title: "A stretched rally, the setup out of the high, and the turn down",
    premise: "The mirror: the rally stretches MACD-V into the upper risk band. At the high the MACD crosses below its signal and the histogram grows: the BEAR SETUP prints its M, and MACD-V falls back through zero as the drop carries on.",
    design: (seed) => setupScenario(seed, -1),
    seeds: 1500,
    judge: judgeSetup(-1),
  },
];
