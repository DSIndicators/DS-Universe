import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Script } from "../design";
import { chapter, shown } from "../build";
import type { Session, StudyRun } from "../../../components/engine/types";

/**
 * DS Chart Price — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * The tool tints its big price readout by how efficiently the last 14 price
 * changes travelled: an up or down tint when they went one way, amber when they
 * went back and forth. Its events are the notable class only: the readout
 * closing three straight minutes in one family (UP TINT / AMBER / DOWN TINT),
 * reported when the family changes.
 *
 * Each example is a run and the stall after it, written in multi-bar legs
 * (tools/showcase/design.ts fills every leg with a REAL recorded stretch of
 * consecutive NQ bars, so the tape has real overlap, counter-candles and chop,
 * and passes build.ts's realism gate). The tool reads the tick stream walked
 * along those real bars' own intrabar paths, exactly as it does live; nothing
 * forces a close anywhere.
 *
 * On real-looking tape the readout's 14-change window (about 3.5 points) is
 * mostly bar-end noise, so a clean three-colour turn (tint, amber, opposite
 * tint) essentially never happens (0 of 4,000 seeds). The story was loosened,
 * not the realism (coordinator, 2026-10-10): one tint for the run, amber for the
 * stall, and NO other colour change in the window — each tint earned by the
 * tape and followed through, the stall staying a stall to the end.
 *
 *  (a) selling, then a stall: DOWN TINT, then AMBER.
 *  (b) buying, then a stall: UP TINT, then AMBER.
 *
 * Honest limit: between the two notable events the live readout still flashes
 * and shifts with the real tape's last few ticks (the tool's own behaviour).
 */

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

type Fam = "U" | "A" | "D";
const famOfTitle = (t: string): Fam => (t === "AMBER" ? "A" : t === "UP TINT" ? "U" : "D");
const famOfStatus = (run: StudyRun, k: number) => {
  const v = (run.status?.(k, null) ?? []).find((r) => r.label === "Tint")?.value ?? "";
  return v.startsWith("AMBER") ? "A" : v.startsWith("UP") ? "U" : v.startsWith("DOWN") ? "D" : "P";
};

// ------------------------------------------------------------------ the scenario
/** where each part of the shown tape begins (shown-bar indices), per seed, for the judge */
const PARTS = new Map<number, { base: number; leg2: number; end: number; dir: 1 | -1 }>();

/**
 * The tape is written in multi-bar legs: each leg is filled with a real recorded stretch of consecutive
 * NQ bars that travels the leg's distance (tools/showcase/design.ts), so the runs carry real overlap,
 * counter-candles and wick clusters. Each run has a pullback inside it; the base is three small legs
 * back and forth. Nothing forces a close anywhere: the tint is read from the real bars' own paths.
 */
function scenario(seed: number, dir: 1 | -1): Script {
  // dir: the FIRST run's direction (-1 = down first)
  let st = (seed * 2654435761) >>> 0 || 1;
  const rand = () => { st ^= st << 13; st >>>= 0; st ^= st >>> 17; st ^= st << 5; st >>>= 0; return st / 4294967296; };
  const v = (a: number, b: number) => a + (b - a) * rand();
  const n = (a: number, b: number) => Math.round(v(a, b));
  const S = 26420 + (seed % 9) * 20;
  const beats: Beat[] = [];
  let i = 0, p = S;
  const go = (dx: number, bars: number, o: Partial<Beat> = {}) => { p += dx; beats.push({ to: p, bars, vol: 0.55, ...o }); i += bars; };
  // the warm-up: quiet, then a run the other way into the start (its tint is never shown)
  const prelude: Beat[] = [
    { to: S + dir * 6, bars: 40, vol: 0.5, size: 0.8 },
    { to: S + dir * 40, bars: 40, vol: 0.5, size: 0.9 },
    { to: S + dir * 26, bars: 12, vol: 0.5 },
    { to: S, bars: 18, vol: 0.55, size: 1.2 },
  ];
  // shown: a few bars of top, the run (with a pullback inside it), the stall
  go(dir * v(-2, 3), n(5, 7), { size: 0.8 });
  const L1 = v(70, 88), f1 = v(0.55, 0.68);
  go(dir * L1 * f1, n(12, 15), { size: 1.4, shape: "accel" });
  go(-dir * v(7, 11), n(4, 6), { size: 0.9 });
  go(dir * (L1 * (1 - f1) + v(7, 11)), n(9, 12), { size: 1.3 });
  const base = i;
  // the stall: four small legs back and forth, a few points wide
  const w = v(6, 10);
  go(-dir * w, n(5, 7), { size: 0.75 });
  go(dir * w * v(0.6, 0.9), n(6, 7), { size: 0.7 });
  go(-dir * w * v(0.5, 0.8), n(6, 7), { size: 0.7 });
  go(dir * w * v(0.2, 0.6), n(6, 8), { size: 0.7 });
  const end = i - 1;
  PARTS.set(seed * dir, { base, leg2: end, end, dir });
  return { seed, start: S, clock: 11 * 60 + 36, prelude, beats };
}

// ------------------------------------------------------------------ the judge (ZERO FLAWS)
let CUR = 0;
function judge(run: StudyRun, s: Session, dir: 1 | -1): Judged | null {
  const parts = PARTS.get(CUR * dir);
  if (!parts) return no("no plan");
  const a = s.replayFrom, z = s.n - 1;
  const ev = shown(run, s);
  const first: Fam = dir > 0 ? "U" : "D";
  const fams = ev.map((e) => famOfTitle(e.title));
  // the story: one tint for the run, amber for the stall, nothing else
  if (fams.join("") !== first + "A") return no(`not the story: ${fams.join("")}`);
  const [e1, eA] = ev;
  const base = a + parts.base;
  if (e1.i - a < 5) return no("tint on the first bars");
  if (e1.i > base - 6) return no("tint too late in the run");
  if (eA.i < base - 2) return no("amber before the stall");
  if (eA.i - e1.i < 8) return no("moments crowded");
  if (z - eA.i < 10) return no("amber too close to the end");
  // the tint is earned: the three closes that earned it ran, and the run carried on
  if (dir * (s.c[e1.i] - s.c[e1.i - 3]) < 4) return no("a tint the tape does not show");
  let ext = 0;
  for (let k = e1.i + 1; k <= base; k++) ext = Math.max(ext, dir * (s.c[k] - s.c[e1.i]));
  if (ext < 35) return no("a tint with no follow-through");
  // amber where price went nowhere, and the stall stays a stall to the end
  let hi = -Infinity, lo = Infinity;
  for (let k = eA.i - 3; k <= eA.i; k++) { hi = Math.max(hi, s.h[k]); lo = Math.min(lo, s.l[k]); }
  if (hi - lo > 16) return no("amber on a moving tape");
  let bh = -Infinity, bl = Infinity;
  for (let k = base; k <= z; k++) { bh = Math.max(bh, s.c[k]); bl = Math.min(bl, s.c[k]); }
  if (bh - bl > 22) return no("the stall is not a stall");
  // the last frames read the stall: amber or pale, never a tint either way
  for (let k = z - 2; k <= z; k++) { const f = famOfStatus(run, k); if (f === "U" || f === "D") return no("the end frame shows a tint"); }
  let wide = 0;
  for (let k = a; k <= z; k++) if (s.h[k] - s.l[k] > 28) wide++;
  if (wide > 2) return no("outsized bars");
  // closes in the run that agree with its tint, ambers in the stall = a cleaner read
  let agreeN = 0, disagreeN = 0, amb = 0;
  for (let k = e1.i; k < base; k++) { const f = famOfStatus(run, k); if (f === first) agreeN++; else if (f !== "P") disagreeN++; }
  for (let k = eA.i; k <= z; k++) if (famOfStatus(run, k) === "A") amb++;
  const leg = dir * (s.c[base] - s.c[a]);
  const score = 2 * agreeN - 4 * disagreeN + amb + 0.3 * Math.min(leg, 90) - 6 * wide;
  const chapters: Chapter[] = ev.map((e) => {
    const c = chapter(e);
    c.text = c.text.replace(/^\d\d:\d\d — /, "");
    c.text = c.text.charAt(0).toUpperCase() + c.text.slice(1);
    return c;
  });
  for (const c of chapters) if (c.text.length > 240) throw new Error(`moment too long (${c.text.length}): ${c.text}`);
  return { score, chapters, note: `run ${leg.toFixed(2)} · stall ${(bh - bl).toFixed(2)} · agree ${agreeN} disagree ${disagreeN} amber ${amb} wide ${wide}` };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Selling, then a stall",
    title: "A down tint on the selling, amber when it stalls",
    premise:
      "Watch the big readout at the top: it takes a down tint while the selling runs one way, and goes amber once the price changes start going back and forth in the stall that follows.",
    design: (seed) => { CUR = seed; return scenario(seed, -1); },
    seeds: 7000,
    judge: (run, s) => judge(run, s, -1),
  },
  {
    id: "b",
    tab: "Buying, then a stall",
    title: "An up tint on the buying, amber when it stalls",
    premise:
      "Watch the big readout at the top: it takes an up tint while the buying runs one way, and goes amber once the price changes start going back and forth in the stall at the top.",
    design: (seed) => { CUR = seed; return scenario(seed, 1); },
    seeds: 7000,
    judge: (run, s) => judge(run, s, 1),
  },
];
