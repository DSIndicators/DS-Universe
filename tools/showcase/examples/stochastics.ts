import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Script, Stage } from "../design";
import { shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS Stochastics — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * The face of the tool: a drop runs all four lanes into the oversold band
 * together (QUAD OVERSOLD — the panel arms long), the fast lane's turn back out
 * of the zone at the low is the ROTATION (PRIME when a bullish divergence was
 * born in the lanes while armed), and the move carries until the slow 60 · 10
 * lane crosses back through 50 and the latch releases. (b) is the mirror at a top.
 *
 * The pattern is written (tools/showcase/design.ts) in multi-bar legs, each one
 * filled with a REAL recorded stretch of consecutive one-minute bars (real
 * overlap, counter-candles, wick clusters), so the tape passes the realism gate
 * (build.ts realism()). Nothing is steered bar by bar. Two stages sit at story
 * points: at the low (price walled above it from then on) and at the top of the
 * climb (a flag that holds the gains without a new high, so no lane can make a
 * lower peak at a higher price while the latch releases). The strict judge keeps
 * only seeds on which the tool's own output tells the story with nothing else.
 *
 * ZERO FLAWS on stage: one quad, one rotation, any divergence only on the
 * story's side and only at the low (never broken), no pullback signal, no
 * PULLBACK ZONE cells, no re-arm, no lane divergence against the move, and the
 * move holds to the end.
 */

const OS = 20, OB = 80;

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

/** the moment's words: the tool's own event, rewritten short — every number from the event texts, no clock times */
function tell(e: StudyEvent, long: boolean, ctx: { dv?: StudyEvent; late?: StudyEvent; inRot: boolean }): string {
  const lo = long ? "below 20" : "above 80";
  const side = long ? "long" : "short";
  const turn = (t: string) => { const m = /\((\d+)\) and (?:higher|lower) again on this close \((\d+)\)/.exec(t); return m ? [m[1], m[2]] : null; };
  const divBits = (t: string) => {
    const m = /the (\d+ · \d+) %D pivot at [\d:]+ confirmed \((higher|lower) %D (\d+) vs (\d+)\) while price made a (lower low|higher high) \(([\d.]+)\); (\d) lanes/.exec(t);
    const g = /on a close (above|below) ([\d,.]+)\.$/.exec(t);
    return m && g ? { lane: m[1], hl: m[2], v1: m[3], v0: m[4], pm: m[5], px: (+m[6]).toLocaleString("en-US", { minimumFractionDigits: 2 }), cl: m[7], dir: g[1], trig: g[2] } : null;
  };
  if (e.title === "QUAD OVERSOLD" || e.title === "QUAD OVERBOUGHT") {
    const own = (e.title === "QUAD OVERSOLD") === long;
    if (own) return `All four lanes' %D (9 · 3, 14 · 3, 40 · 4, 60 · 10) close at or ${lo} on the same bar. The panel arms ${side} until the 60 · 10 crosses back through 50, or for 100 bars.`;
    return `The move carries all four lanes' %D to ${long ? "80 or above" : "20 or below"} on the same bar: the panel now arms ${long ? "short" : "long"}.`;
  }
  if (e.title.includes("DIVERGENCE")) {
    const b = divBits(e.text); if (!b) return "";
    return `The ${b.lane} %D makes a ${b.hl === "higher" ? "higher low" : "lower high"} (${b.v1} vs ${b.v0}) while price makes a ${b.pm} at ${b.px}; ${b.cl} lanes diverge within 3 bars, so the swing gets its line on price. It confirms on a close ${b.dir} ${b.trig}.`;
  }
  if (e.title === "ROTATION" || e.title === "PRIME ROTATION") {
    const b = ctx.dv ? divBits(ctx.dv.text) : null;
    const back = long ? "back above 20" : "back below 80";
    const again = long ? "rises" : "falls";
    if (ctx.late) {
      const tv = turn(ctx.late.text); const n = e.i - ctx.late.i;
      if (!tv || !b) return "";
      return `Armed ${side}, the 9 · 3 %D closed ${back} (${tv[0]}, then ${tv[1]}): the ROTATION. ${n} bar${n === 1 ? "" : "s"} later the ${b.lane} %D ${b.hl} ${long ? "low" : "high"} confirms against price's ${b.pm} (${b.cl} lanes, line on price), inside the 8-bar window: PRIME.`;
    }
    const tv = turn(e.text); if (!tv) return "";
    const base = `Armed ${side} since the quad, the 9 · 3 %D closes ${back} (${tv[0]}) and ${again} again on this close (${tv[1]}).`;
    if (e.title === "ROTATION") return `${base} One ROTATION per arm.`;
    if (ctx.inRot && b) return `${base} The ${b.lane} %D's ${b.hl} ${long ? "low" : "high"} against price's ${b.pm} (${b.cl} lanes, line on price) came while armed: PRIME.`;
    return `${base} A ${long ? "bullish" : "bearish"} divergence was born in the lanes while the panel was armed, so it is PRIME.`;
  }
  return "";
}

function judgeOf(long: boolean) {
  const QUAD = long ? "QUAD OVERSOLD" : "QUAD OVERBOUGHT";
  const DIV = long ? "BULLISH DIVERGENCE" : "BEARISH DIVERGENCE";
  const d = long ? 1 : -1;
  return (run: StudyRun, s: Session): Judged | null => {
    const from = s.replayFrom, end = s.n - 1;
    const ev = shown(run, s);
    const quads = ev.filter((e) => /^QUAD/.test(e.title));
    if (quads.length !== 1 || quads[0].title !== QUAD) return no(quads.length ? "not exactly one quad, the story's" : "no quad");
    const q = quads[0];
    if (q.i - from < 15) return no("quad too close to the start");
    if (ev.some((e) => e.title === "PULLBACK")) return no("a pullback signal");
    const rots = ev.filter((e) => /ROTATION/.test(e.title));
    if (rots.some((e) => (e.tone === "bull") !== long)) return no("a rotation the other way");
    // one rotation: ROTATION or PRIME on its own bar, or a ROTATION the tool marks PRIME up to 8 bars later
    let r: StudyEvent, late: StudyEvent | undefined;
    if (rots.length === 1) r = rots[0];
    else if (rots.length === 2 && rots[0].title === "ROTATION" && rots[1].title === "PRIME ROTATION" && rots[1].i - rots[0].i <= 8) { late = rots[0]; r = rots[1]; }
    else return no(rots.length ? "not one rotation" : "no rotation");
    const r0 = late ?? r;
    if (r0.i < q.i) return no("rotation before the quad");
    // the extreme of the window, and the rotation comes off it
    let ext = long ? Infinity : -Infinity, xi = from;
    for (let i = from; i <= end; i++) { const v = long ? s.l[i] : s.h[i]; if (long ? v < ext : v > ext) { ext = v; xi = i; } }
    if (r0.i < xi || r0.i - xi > 9) return no("the rotation is not at the low");
    // a divergence line on price is welcome only on the story's side, ending on that low, by the rotation
    const divs = ev.filter((e) => /DIVERGENCE/.test(e.title));
    if (divs.some((e) => !e.title.startsWith(DIV))) return no("a divergence line the other way");
    const pxOf = (e: StudyEvent) => Number(/while price made a (?:lower low|higher high) \(([\d.]+)\)/.exec(e.text)?.[1] ?? NaN);
    if (divs.length > 2) return no("too many divergence lines");
    for (const e of divs) if (Math.abs(pxOf(e) - ext) > 1.5 || e.i > r.i || e.i < xi) return no("a divergence line off the low");
    const dv = divs[0] as StudyEvent | undefined;
    if (late && !dv) return no("a late PRIME with no line");
    if (ev.length !== 1 + divs.length + rots.length) return no("other narration");
    // lane divergences (drawn in the lanes): only the story's side, only at the low (one before it would be
    // broken), all born on one bar (a lane joining 1–3 bars later raises the earlier ones' ×n after the fact, so
    // the DIV chip would read differently scrubbed back than live — DSStochastics BornDiv, reported)
    let firstDiv = -1;
    for (let i = from; i <= end; i++) {
      const it = run.readout?.(i).find((x) => x.label === "Divergence");
      if (!it) continue;
      if ((parseFloat(it.value) > 0) !== long) return no("a lane divergence the other way");
      if (i < xi || i > r.i + 8) return no("a lane divergence off the low");
      if (firstDiv < 0) firstDiv = i; else if (i !== firstDiv && i - firstDiv <= 3) return no("a lane divergence joins a bar or more later");
    }
    const follow = d * (s.c[end] - s.c[r0.i]);
    let best = 0, bestI = r0.i;
    for (let i = r0.i; i <= end; i++) { const f = d * ((long ? s.h[i] : s.l[i]) - s.c[r0.i]); if (f > best) { best = f; bestI = i; } }
    if (follow < 30) return no("not enough follow-through");
    let give = 0;
    for (let i = bestI; i <= end; i++) give = Math.max(give, d * ((long ? s.h[bestI] : s.l[bestI]) - s.c[i]));
    if (give > 0.4 * best) return no("the move gives back too much");
    if (end - r0.i < 14) return no("rotation too close to the end");
    const tv = /\((\d+)\) and (?:higher|lower) again/.exec(r0.text)?.[1];
    if (tv === String(long ? OS : OB)) return no("the rotation's value rounds to the line");
    let pz = 0;
    for (let i = from; i <= end; i++) if (/PULLBACK/.test(run.readout?.(i).find((x) => x.label === "State")?.value ?? "")) pz++;
    if (pz > 0) return no("the ribbon reads PULLBACK ZONE");
    // the latch releases (the 60 · 10 %D back through 50 ends the arm) — a moment when it happens on stage
    const st = (i: number, label: string) => run.status?.(i, null).find((x) => x.label === label)?.value ?? "";
    let rel = -1;
    for (let i = r.i + 1; i <= end - 6; i++) if (st(i, "Latch") === "not armed" && st(i - 1, "Latch") === (long ? "ARMED LONG" : "ARMED SHORT")) { rel = i; break; }
    const inRot = !!dv && Math.abs(r.i - dv.i) < 8 && !late;
    const pick = [q, ...(dv && !inRot && !late ? [dv] : []), r].sort((a, b) => a.i - b.i);
    const chapters: Chapter[] = pick.map((e) => ({ i: e.i, title: e.title, text: tell(e, long, { dv, late, inRot }), tone: e.tone, price: e.price }));
    if (chapters.some((c) => !c.text)) return no("a moment's words could not be read");
    if (rel >= 0 && chapters.every((c) => Math.abs(c.i - rel) >= 8)) chapters.push({ i: rel, title: "LATCH RELEASED", tone: "neutral", price: s.c[rel],
      text: `The slow 60 · 10 %D closes back ${long ? "above" : "below"} 50 (${(run.readout?.(rel).find((x) => x.label === "60 · 10 %D")?.value ?? "").split(" ")[0]}): the ${long ? "long" : "short"} arm is released. The latch reads not armed until the next quad.` });
    chapters.sort((a, b) => a.i - b.i);
    if (chapters.length < 3) return no("fewer than three moments");
    for (let j = 1; j < chapters.length; j++) if (chapters[j].i - chapters[j - 1].i < 8) return no("moments too close");
    for (const c of chapters) if (c.text.length > 240) throw new Error(`moment too long (${c.text.length}): ${c.text}`);
    let adverse = 0;
    for (let i = r0.i + 1; i <= end; i++) adverse = Math.max(adverse, d * (s.c[r0.i] - (long ? s.l[i] : s.h[i])));
    const prime = r.title === "PRIME ROTATION";
    const score = 0.6 * Math.min(follow, 120) + 0.2 * Math.min(best, 140) - 1.2 * Math.max(0, adverse - 6) + 5 * chapters.length + (rel >= 0 ? 10 : 0) + (prime ? 12 : 0) + (dv ? 8 : 0) - (late ? 4 : 0);
    return { score, chapters, note: `follow ${follow.toFixed(1)} best ${best.toFixed(1)} adverse ${adverse.toFixed(1)} ${late ? "ROTATION+late " : ""}${r.title} lines ${divs.length} release ${rel < 0 ? "-" : rel - from}` };
  };
}

// ------------------------------------------------------------------ the scenarios
/**
 * Every leg is several bars long, so the composer fills it with a REAL recorded stretch of
 * consecutive one-minute bars that travels the leg's distance (real overlap, counter-candles,
 * wick clusters). Nothing is steered bar by bar; one stage at the low walls price above it for
 * the rest of the example, and the strict judge keeps only the seeds on which the tool's own
 * output tells the story with nothing else on stage.
 */
const warmup = (S: number): Beat[] => [
  { to: S + 8, bars: 50, vol: 0.45, size: 0.8 }, { to: S - 6, bars: 55, vol: 0.45, size: 0.8 },
  { to: S + 4, bars: 45, vol: 0.45, size: 0.8 }, { to: S, bars: 40, vol: 0.4, size: 0.8 },
];
/**
 * dir 1: a quiet lead; the drop, slowing into the low (the slow lanes reach the zone, the
 * quad arms the panel); at the low a stage walls price above it; the turn — the rotation is
 * the tool's — and the climb in legs with real pullbacks until the slow lane is back through
 * 50, then a pause that holds the gains. dir -1 is the mirror.
 */
function scenario(seed: number, dir: 1 | -1): Script {
  const S = 26420 + (seed % 9) * 13;
  const p = (pts: number) => S + dir * pts;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  const drop = 72 + 26 * r(1);
  const beats: (Beat | Stage)[] = [
    { to: p(3 + 6 * r(2)), bars: 16 + Math.round(6 * r(3)), vol: 0.5, size: 0.85 },                         // quiet lead
    { to: p(-drop), bars: 20 + Math.round(6 * r(5)), vol: 0.55, size: 1.05, shape: "accel" },               // the drop into the low
    (look) => {
      let low = dir > 0 ? Infinity : -Infinity;
      for (let i = look.from; i < look.s.n; i++) low = dir > 0 ? Math.min(low, look.s.l[i]) : Math.max(low, look.s.h[i]);
      const L = look.last, R = drop * (0.66 + 0.14 * r(7));
      return {
        // the turn and one climb off the low (its own real pullbacks inside), long enough for the slow lane
        // to leave the zone before the fast lane can fall back out of the far one
        beats: [{ to: L + dir * R, bars: 14 + Math.round(5 * r(8)), vol: 0.6, size: 1.05 }],
        walls: [{ from: look.at, to: look.at + 90, level: low + dir * 0.75, side: dir > 0 ? "above" : "below", probe: 0 }],
      };
    },
    // then a flag that holds the gains without a new high (no second lane peak at a higher price) while the
    // slow lane comes back through 50 and the latch releases
    (look) => {
      let top = dir > 0 ? -Infinity : Infinity;
      for (let i = look.s.n - 6; i < look.s.n; i++) top = dir > 0 ? Math.max(top, look.s.h[i]) : Math.min(top, look.s.l[i]);
      const span = drop * 0.6;
      return {
        beats: [
          { to: look.last - dir * span * (0.12 + 0.06 * r(9)), bars: 5 + Math.round(3 * r(10)), vol: 0.5, size: 0.9 },
          { to: top - dir * span * (0.04 + 0.06 * r(11)), bars: 7 + Math.round(4 * r(12)), vol: 0.5, size: 0.9 },
        ],
        walls: [
          { from: look.at, to: look.at + 40, level: top - dir * 0.25, side: dir > 0 ? "below" : "above", probe: 0 },
          { from: look.at, to: look.at + 40, level: top - dir * span * 0.45, side: dir > 0 ? "above" : "below", probe: 0 },
        ],
      };
    },
  ];
  return { seed, start: S, clock: 11 * 60 + 5 + Math.round(25 * r(0)), prelude: warmup(S), beats };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Oversold",
    title: "All four lanes reach oversold, and the fast lane rotates out at the low",
    premise: "Watch the four lanes sink into the oversold band together: the panel arms long. The fast lane's turn back out of the zone at the low is the ROTATION, PRIME when a bullish divergence came while the panel was armed, and the move carries until the slow lane releases the latch.",
    design: (seed) => scenario(seed, 1),
    seeds: 4000,
    judge: judgeOf(true),
  },
  {
    id: "b",
    tab: "Overbought",
    title: "All four lanes reach overbought, and the fast lane rotates down at the high",
    premise: "The mirror: the lanes climb into the overbought band together and the panel arms short. The fast lane's turn back down at the high is the ROTATION, PRIME when a bearish divergence came while the panel was armed, and the drop carries until the latch releases.",
    design: (seed) => scenario(seed, -1),
    seeds: 4000,
    judge: judgeOf(false),
  },
];
