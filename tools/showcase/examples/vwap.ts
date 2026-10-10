import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Touch, Wall } from "../design";
import { shown } from "../build";
import type { StudyEvent, StudyRun, Session } from "../../../components/engine/types";

/**
 * DS VWAP — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * One-minute bars from the cash open (first shown bar closes 09:31) inside one
 * CME session. The hidden warm-up is that session's quiet overnight from the
 * 18:00 open, which the tool's session anchor, live VWAP and clocks read (never
 * drawn; the HELD / RETURNED chips count from the first shown bar — study
 * DEVIATIONS 6). The session VWAP narrated is the cash-open anchor, which
 * starts on the first shown bar.
 *
 * Both faces tell the cycle the RETURN odds measure, once, cleanly: an opening
 * range while the anchor forms, a drive beyond the session's 90% edge
 * (EXTENDED), a pull back inside the 50% core (BACK IN VALUE), a test of the
 * session VWAP itself (AT VWAP) that holds, and the move resuming in the
 * extension's direction without crossing the VWAP. Stages read the tool's own
 * Session VWAP and sigma before aiming the pull back and the test.
 *
 * ZERO FLAWS: no second extension, no extension the other way, no STRETCHED
 * against the move, no trade through the VWAP after the test.
 */

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

const num = (t: string) => parseFloat(t.replace(/[^0-9.\-]/g, ""));
const read = (run: StudyRun, i: number, label: string) => run.readout?.(i).find((x) => x.label === label)?.value ?? "";
const vwapAt = (run: StudyRun, i: number) => num(read(run, i, "Session VWAP"));
const sigmaAt = (run: StudyRun, i: number) => num(read(run, i, "Sigma").split("·")[0]);
const returnAt = (run: StudyRun, k: number) => run.status?.(k, null).find((x) => x.label === "Return")?.value ?? "";
const clean = (t: string) => { const u = t.replace(/^\d\d:\d\d — /, ""); return u.charAt(0).toUpperCase() + u.slice(1); };
const ch = (e: StudyEvent, text?: string): Chapter => ({ i: e.i, title: e.title, text: (text ?? clean(e.text)).slice(0, 240), tone: e.tone, price: e.price });
const formingText = (e: StudyEvent) => {
  const m = e.text.match(/session VWAP at ([\d,]+\.\d\d)/);
  return `The cash open starts a fresh session VWAP at ${m ? m[1] : "the first bar"}. It raises no state and no event for its first 15 bars while the anchor forms.`;
};
const extText = (e: StudyEvent, run: StudyRun) => {
  const m = e.text.match(/EXTENDED (above|below): a second close beyond the session's 90% edge \(([\d,.]+)\) confirmed it\. The close ([\d,.]+) is ([+\-−][\d,.]+) from the session VWAP ([\d,.]+), ([\d.]+)σ/);
  const ret = returnAt(run, e.i).replace(/ · 60 bars · /, " over 60 bars · ");
  if (!m) return clean(e.text);
  return `A second close beyond the session's 90% edge (${m[2]}) confirms it: ${m[3]} is ${m[4]} from the session VWAP, ${m[6]}σ.${ret ? ` The RETURN chip reads ${ret}.` : ""}`;
};

// ---------------------------------------------------------------- the judge
function judge(run: StudyRun, s: Session, dir: 1 | -1): Judged | null {
  const ev = shown(run, s);
  const f = s.replayFrom, end = s.n - 1;
  const up = dir > 0, strong = up ? "strongBull" : "strongBear";
  const form = ev.find((e) => e.title === "FORMING");
  if (!form || form.i !== f) return no("no FORMING on the first bar");
  const st = ev.filter((e) => e.title !== "STRETCHED" && e.title !== "FORMING");
  // ZERO FLAWS: exactly one cycle, on the story's side
  if (st.map((e) => e.title).join("|") !== "EXTENDED|BACK IN VALUE|AT VWAP") return no(`states: ${st.map((e) => e.title).join(", ")}`);
  const [ext, back, at] = st;
  if (ext.tone !== strong) return no("extension on the wrong side");
  const strs = ev.filter((e) => e.title === "STRETCHED");
  if (strs.some((e) => e.tone !== strong)) return no("STRETCHED against the move");
  if (strs.length > 2) return no("too many STRETCHED");
  if (strs.some((e) => e.i > back.i && e.i < at.i)) return no("STRETCHED during the pull back");
  if (ev.filter((e) => e.title === "FORMING").length !== 1) return no("a second anchor");
  if (ext.i - f < 18) return no("extension crowds the forming bars");
  if (back.i - ext.i < 12 || at.i - back.i < 8) return no("cycle steps crowd each other");
  if (end - at.i < 25) return no("too little after the test");
  // the test holds: no close on the far side of the VWAP after it, the move resumes
  let resume = 0;
  for (let i = at.i; i <= end; i++) {
    const v = vwapAt(run, i);
    if (dir * (s.c[i] - v) < 0) return no("a close through the VWAP after the test");
    if (i > at.i && dir * ((up ? s.l[i] : s.h[i]) - v) < 1) return no("price came back to the VWAP after the test");
    resume = Math.max(resume, dir * ((up ? s.h[i] : s.l[i]) - s.c[at.i]));
  }
  if (resume < 40) return no("the move does not resume");
  let peak = 0;
  for (let i = ext.i; i <= back.i; i++) peak = Math.max(peak, dir * ((up ? s.h[i] : s.l[i]) - vwapAt(run, i)));
  if (peak < 50) return no("a shallow extension");
  const odds = parseInt(returnAt(run, ext.i)) || 0;

  const chapters: Chapter[] = [ch(form, formingText(form)), ch(ext, extText(ext, run)), ch(back), ch(at)];
  const free = strs.find((e) => e.i > ext.i + 8 && e.i < back.i - 8);
  if (free) chapters.push(ch(free));
  chapters.sort((a, b) => a.i - b.i);
  for (let j = 1; j < chapters.length; j++) if (chapters[j].i - chapters[j - 1].i < 8) return no("moments crowded");
  const score = Math.min(peak, 120) + 0.6 * Math.min(resume, 100) + 0.2 * Math.min(odds, 70) - 8 * strs.length;
  return { score, chapters, note: `peak ${peak.toFixed(1)} resume ${resume.toFixed(1)} odds ${odds} stretched ${strs.length} [${ev.map((e) => `${e.i - f}:${e.title}`).join(", ")}]` };
}

// ---------------------------------------------------------------- the scenario
class Plan {
  beats: Beat[] = []; walls: Wall[] = []; touches: Touch[] = [];
  constructor(public at: number) {}
  leg(to: number, bars: number, o: Partial<Beat> = {}): [number, number] { const a = this.at; this.beats.push({ to, bars, vol: 0.55, ...o }); this.at += bars; return [a, this.at - 1]; }
  /** price stays on `toward`'s side of a level (+1: above, -1: below) */
  wall(from: number, to: number, level: number, toward: 1 | -1) { if (to >= from) this.walls.push({ from, to, level, side: toward > 0 ? "above" : "below", probe: 0 }); }
  out() { return { beats: this.beats, walls: this.walls, touches: this.touches }; }
}

function cycle(seed: number, dir: 1 | -1): Script {
  const S = 25900 + (seed % 9) * 20;
  const r = (k: number) => ((seed * 7919 + k * 104729 + (dir < 0 ? k * k * 3571 : 0)) % 1000) / 1000;
  const p = (x: number) => S + dir * x;
  // the overnight: a quiet session from 18:00 (930 bars), ending near S
  const prelude: Beat[] = [
    { to: p(-30 + 20 * r(1)), bars: 240, vol: 0.4 }, { to: p(20 - 20 * r(2)), bars: 300, vol: 0.4 },
    { to: p(-15 + 10 * r(3)), bars: 240, vol: 0.4 }, { to: S, bars: 150, vol: 0.4 },
  ];
  return {
    seed, start: S, clock: 9 * 60 + 31, tf: 1, prelude,
    beats: [
      // 09:31–09:45: an opening range while the anchor forms
      { to: p(-8 - 6 * r(4)), bars: 7, vol: 0.45 }, { to: p(4 + 6 * r(5)), bars: 8, vol: 0.45 },
      // the drive beyond the 90% edge, a pause, the last push to the extreme
      { to: p(75 + 20 * r(6)), bars: 14 + Math.round(4 * r(7)), vol: 0.45, size: 1.2 },
      { to: p(62 + 10 * r(8)), bars: 5, vol: 0.45 },
      { to: p(135 + 30 * r(9)), bars: 11 + Math.round(4 * r(10)), vol: 0.45, shape: "decel" },
      (look: Look) => {
        // the pull back into the core: aimed from the tool's own VWAP and sigma at this bar
        const k = look.s.n - 1, v = vwapAt(look.run, k), sg = sigmaAt(look.run, k);
        if (!(sg > 0) || dir * (look.last - v) < 1.7 * sg || read(look.run, k, "State") !== "EXTENDED") return null;
        const pl = new Plan(look.at);
        const [a0] = pl.leg(v + dir * (0.3 + 0.1 * r(11)) * sg, 11 + Math.round(3 * r(12)), { vol: 0.5 });
        pl.leg(v + dir * (0.85 + 0.15 * r(13)) * sg, 7 + Math.round(2 * r(23)), { vol: 0.45 });
        pl.wall(a0, pl.at - 1, v + dir * 0.18 * sg, dir);
        return pl.out();
      },
      (look: Look) => {
        // the test: the VWAP has drifted toward price; one bar's wick reaches it, the close stays on the story's side
        const k = look.s.n - 1, v = vwapAt(look.run, k), sg = sigmaAt(look.run, k);
        if (!(sg > 0) || dir * (look.last - v) < 3) return null;
        const pl = new Plan(look.at);
        const n1 = 6 + Math.round(3 * r(14));
        const [a0, a1] = pl.leg(v + dir * 4, n1, { vol: 0.4 });
        pl.wall(a0, a1, v + dir * 3, dir);
        const est = v + dir * 0.75; // the VWAP creeps toward price while it holds above (below) it
        const [t] = pl.leg(v + dir * (11 + 4 * r(15)), 1, { vol: 0.1 });
        pl.touches.push({ i: t, level: est, from: dir > 0 ? "above" : "below", depth: [4, 16] });
        // the move resumes, back toward the extreme, never back to the VWAP
        const ext = dir * (look.last - v);
        pl.leg(v + dir * (ext + 25 + 10 * r(16)), 9 + Math.round(3 * r(17)), { vol: 0.5 });
        pl.leg(v + dir * (ext + 12 + 6 * r(18)), 5 + Math.round(2 * r(19)), { vol: 0.45 });
        pl.leg(v + dir * (ext + 45 + 15 * r(20)), 10 + Math.round(3 * r(21)), { vol: 0.5, shape: "decel" });
        pl.leg(v + dir * (ext + 35 + 10 * r(22)), 4, { vol: 0.4 });
        pl.wall(t + 1, pl.at + 5, v + dir * 8, dir);
        return pl.out();
      },
    ],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Return, then up",
    title: "Extended above the session's edge, back to VWAP, and the move resumes",
    premise: "The cash open anchors a fresh session VWAP. Watch price drive beyond its 90% edge (EXTENDED), come back inside the 50% core (BACK IN VALUE), test the VWAP itself (AT VWAP) without closing below it, and turn back up.",
    design: (seed) => cycle(seed, 1),
    seeds: Number(process.env.SEEDS ?? 200),
    judge: (run, s) => judge(run, s, 1),
  },
  {
    id: "b",
    tab: "Return, then down",
    title: "Extended below the session's edge, back to VWAP, and the move resumes",
    premise: "The same cycle on the other side: a drive below the 90% edge (EXTENDED), a rally back inside the 50% core (BACK IN VALUE), a test of the VWAP (AT VWAP) without a close above it, and the selling resumes.",
    design: (seed) => cycle(seed, -1),
    seeds: Number(process.env.SEEDS ?? 200),
    judge: (run, s) => judge(run, s, -1),
  },
];
