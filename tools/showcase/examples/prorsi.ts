import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Touch, Wall } from "../design";
import { shown } from "../build";
import type { ReadItem, Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS ProRSI — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * The face of the tool: a sharp drop (rally) takes the RSI into oversold
 * (overbought), the RSI crosses its signal and holds, and the turn draws a
 * zone at the swing. Price leaves the zone, comes back into it, is turned away
 * and is scored HELD — twice — and the move carries on.
 *
 * The pattern is written (tools/showcase/design.ts): a quiet lead, the drop
 * into the extreme, the bounce that makes the turn, and then — after a stage
 * reads the NEW zone the TOOL drew — returns aimed at that exact zone (each
 * return's last bar wicks into it and closes back out, the far edge is never
 * traded through). Every candle is a real recorded one-minute bar with its
 * real volume, so the volume-weighted RSI and the zone's volume depth are
 * the tool's own reading of real bars. A quiet hidden warm-up feeds the RSI,
 * its signal, the ATR and the volume yardstick (never drawn, never narrated —
 * the study's display gate).
 *
 * ZERO FLAWS on stage (Tom, 2026-10-09): exactly one zone, never broken; no
 * zone on the other side; no turn that reinforces a zone the visitor cannot
 * see; both returns scored HELD and followed through.
 */

// ------------------------------------------------------------------ reading the study's output
const memo = new WeakMap<StudyRun, { ro: Map<number, ReadItem[]>; st: Map<number, ReadItem[]> }>();
const cache = (run: StudyRun) => { let m = memo.get(run); if (!m) { m = { ro: new Map(), st: new Map() }; memo.set(run, m); } return m; };
const readout = (run: StudyRun, i: number) => { const m = cache(run).ro; if (!m.has(i)) m.set(i, run.readout?.(i) ?? []); return m.get(i)!; };
const status = (run: StudyRun, i: number) => { const m = cache(run).st; if (!m.has(i)) m.set(i, run.status?.(i, null) ?? []); return m.get(i)!; };
const rsiAt = (run: StudyRun, i: number) => parseFloat(readout(run, i).find((r) => r.label === "RSI")?.value ?? "NaN");
const refusedAt = (run: StudyRun, i: number) => readout(run, i).some((r) => r.label === "Cross");
const record = (run: StudyRun, i: number) => {
  const m = /HELD (\d+) · BROKE (\d+)/.exec(status(run, i).find((r) => r.label === "ZONES")?.value ?? "");
  return m ? { held: +m[1], broke: +m[2] } : { held: 0, broke: 0 };
};
const P = (t: string) => Number(t.replace(/,/g, ""));
const f2 = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** the study's own ATR: 14-bar simple mean of true range */
function atr14(s: Session, i: number) {
  let sum = 0, c = 0;
  for (let j = i; j > i - 14 && j >= 0; j--) {
    let hl = s.h[j] - s.l[j];
    if (j > 0) { const pc = s.c[j - 1]; hl = Math.max(hl, Math.abs(s.h[j] - pc), Math.abs(s.l[j] - pc)); }
    sum += hl; c++;
  }
  return c ? sum / c : 0;
}

/** why seeds were turned down (WHY=1 prints them) */
export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

type Birth = { e: StudyEvent; sup: boolean; far: number; near: number; deep: string; mult: string; pips: string };
function parseBirth(e: StudyEvent): Birth | null {
  const sup = e.title.startsWith("BULL TURN");
  const zr = /zone ([\d,]+\.\d\d) – ([\d,]+\.\d\d)/.exec(e.text);
  const deep = /deepest RSI (\d+)/.exec(e.text)?.[1];
  const mult = /([\d.]+)× normal volume/.exec(e.text)?.[1];
  const pips = /\((\d) pip/.exec(e.text)?.[1];
  if (!zr || !deep || !mult || !pips) return null;
  const lo = P(zr[1]), hi = P(zr[2]);
  return { e, sup, far: e.price!, near: sup ? hi : lo, deep, mult, pips };
}

// ------------------------------------------------------------------ the judge
function judgeOf(sup: boolean) {
  const BIRTH = sup ? "BULL TURN · SUPPORT ZONE" : "BEAR TURN · RESISTANCE ZONE";
  const REINF = sup ? "SUPPORT ZONE REINFORCED" : "RESISTANCE ZONE REINFORCED";
  const word = sup ? "support" : "resistance";
  const ext = sup ? "oversold" : "overbought";
  return (run: StudyRun, s: Session): Judged | null => {
    const from = s.replayFrom, end = s.n - 1;
    const ev = shown(run, s);
    const r0 = rsiAt(run, from);
    if (!(r0 > 38 && r0 < 62)) return no("RSI not neutral on the first bar");
    // ZERO FLAWS: one zone, the story's; nothing broken; reinforcements only of the story zone.
    // (A zone born in the hidden warm-up is never drawn, never counted in the record and never narrated —
    // the study's display gate — so what happens to it is invisible; only a turn that reinforces one would
    // show, as a chevron with no zone, and that is rejected below.)
    const births = ev.filter((e) => e.title.includes("TURN ·"));
    const stageFar = new Set(births.map((e) => e.price));
    if (ev.some((e) => /BROKEN/.test(e.title) && stageFar.has(e.price))) return no("a zone broke");
    // and, to be clean even in the tool's raw event list, nothing at all happens to a hidden zone on stage
    if (ev.some((e) => !stageFar.has(e.price))) return no("an event on a hidden warm-up zone");
    if (births.length !== 1) return no(births.length ? "more than one zone born" : "no zone born");
    if (births[0].title !== BIRTH) return no("the zone is on the wrong side");
    const story = parseBirth(births[0]);
    if (!story) return no("birth text unreadable");
    if (ev.some((e) => /REINFORCED/.test(e.title) && (e.title !== REINF || e.price !== story.far))) return no("a turn reinforced another zone");
    const bi = story.e.i;
    if (bi - from < 16) return no("turn too close to the start");
    const held = ev.filter((e) => e.title === "ZONE HELD" && e.price === story.far);
    if (held.length < 2) return no("fewer than two HELD");
    if (held.length > 3) return no("too many HELD");
    const reinf = ev.filter((e) => e.title === REINF);
    // the touches the flag counts (×n): rising edges of low <= near && close >= far (mirror for resistance)
    const touches: number[] = [];
    {
      let touching = sup ? s.l[bi] <= story.near : s.h[bi] >= story.near;
      for (let i = bi + 1; i <= end; i++) {
        const t = sup ? s.l[i] <= story.near && s.c[i] >= story.far : s.h[i] >= story.near && s.c[i] <= story.far;
        if (t && !touching) touches.push(i);
        touching = t;
      }
    }
    if (touches.length !== held.length) return no("a touch without a HELD");
    // follow-through after the last HELD; the move away from the zone makes the extremes of the window
    const lastHeld = held[held.length - 1];
    const d = sup ? 1 : -1;
    const follow = d * (s.c[end] - s.c[lastHeld.i]);
    if (follow < 8) return no("no follow-through after the last HELD");
    if (end - lastHeld.i < 10) return no("last HELD at the very end");
    let extI = bi;
    for (let i = bi; i <= end; i++) if (d * ((sup ? s.h[i] : s.l[i]) - (sup ? s.h[extI] : s.l[extI])) > 0) extI = i;
    if (end - extI > 8) return no("the move did not carry to the end");
    // the RSI never reaches the opposite extreme on stage (no counter episode)
    let rMax = sup ? 0 : 100;
    for (let i = from; i <= end; i++) { const r = rsiAt(run, i); if (!isNaN(r)) rMax = sup ? Math.max(rMax, r) : Math.min(rMax, r); }
    if (sup ? rMax >= 80 : rMax <= 20) return no("RSI deep into the opposite extreme");
    let refused = 0;
    for (let i = from; i <= end; i++) if (refusedAt(run, i)) refused++;

    // ---- moments
    const chapters: Chapter[] = [];
    const fit = (i: number) => chapters.every((c) => Math.abs(c.i - i) >= 8);
    chapters.push({
      i: bi, title: story.e.title, tone: story.e.tone, price: story.far,
      text: `The RSI crossed ${sup ? "above" : "below"} its signal and held on the close, inside an ${ext} episode (${sup ? "deepest RSI" : "RSI peak"} ${story.deep}). New ${word} zone ${f2(Math.min(story.far, story.near))} – ${f2(Math.max(story.far, story.near))} at the swing ${sup ? "low" : "high"}, ${story.mult}× normal volume (${story.pips} pip${story.pips === "1" ? "" : "s"}).`,
    });
    let prev = bi;
    held.forEach((h, k) => {
      const t = touches.find((x) => x > prev && x < h.i);
      const r = reinf.find((x) => x.i > prev && x.i <= h.i);
      if (k === 0 && t !== undefined && fit(t) && h.i - t >= 8) {
        chapters.push({
          i: t, title: "TOUCH", tone: "neutral", price: sup ? s.l[t] : s.h[t],
          text: `Price comes back into the ${word} zone and the bar closes ${sup ? "above" : "below"} its far edge (${f2(story.far)}): a touch, notched on the zone, and the flag counts ×1.`,
        });
      }
      const rec = record(run, h.i);
      const turnN = r ? /\(turn (\d+)\)/.exec(r.text)?.[1] : undefined;
      // a reinforcement far enough from the HELD is its own moment
      const own = r && fit(r.i) && h.i - r.i >= 8;
      if (own) chapters.push({
        i: r!.i, title: r!.title, tone: r!.tone, price: story.far,
        text: `Back at the zone the RSI dips into ${ext} again, then crosses ${sup ? "above" : "below"} its signal and holds. The turn lands on the live ${word} zone, so it reinforces it (turn ${turnN}) instead of stacking a new one: the spine doubles.`,
      });
      if (fit(h.i)) chapters.push({
        i: h.i, title: "ZONE HELD", tone: h.tone, price: story.far,
        text: `Price has left the ${word} zone again by two ATRs without a close through its far edge (${f2(story.far)}).${r && !own ? ` A fresh ${ext} turn on the zone reinforced it (turn ${turnN}).` : ""} Record: ${rec.held} held, ${rec.broke} broke.`,
      });
      prev = h.i;
    });
    chapters.sort((a, b) => a.i - b.i);
    if (chapters.filter((c) => c.title === "ZONE HELD").length < 2) return no("HELD crowded out");
    for (let j = 1; j < chapters.length; j++) if (chapters[j].i - chapters[j - 1].i < 8) return no("moments crowded");
    for (const c of chapters) if (c.text.length > 240) throw new Error(`moment too long (${c.text.length}): ${c.text}`);

    const deep = +story.deep;
    const depth = sup ? Math.max(0, 30 - deep) : Math.max(0, deep - 70);
    const atr = atr14(s, end) || 1;
    const score = 8 * Math.min(follow / atr, 6) + 2 * depth + 6 * reinf.length - 2.5 * refused + 3 * (+story.pips);
    return { score, chapters, note: `${word} ${f2(Math.min(story.far, story.near))}–${f2(Math.max(story.far, story.near))} · deep ${deep} · held ${held.length} · reinf ${reinf.length} · refused crosses ${refused} · follow ${follow.toFixed(1)} · RSI peak ${rMax.toFixed(1)}` };
  };
}

// ------------------------------------------------------------------ the scenarios
/**
 * A quiet lead, a sharp drop into oversold (dir 1; mirrored for dir -1), a
 * bounce that makes the turn and the zone, then — aimed at the zone the tool
 * drew — two returns whose last bar wicks into the zone and closes back out,
 * each followed by a stepped advance that leaves it by more than two ATRs.
 * The advances climb in steps (small pullbacks inside) so the RSI never runs
 * into the opposite extreme.
 */
const warmup = (S: number): Beat[] => [
  { to: S + 8, bars: 50, vol: 0.45, size: 0.8 }, { to: S - 5, bars: 55, vol: 0.45, size: 0.8 },
  { to: S + 5, bars: 45, vol: 0.45, size: 0.8 }, { to: S, bars: 40, vol: 0.4, size: 0.8 },
];
function scenario(seed: number, dir: 1 | -1): Script {
  const S = 26420 + (seed % 9) * 13;
  const p = (pts: number) => S + dir * pts;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  const drop = 46 + 16 * r(1);
  return {
    seed, start: S, clock: 11 * 60 + 20 + Math.round(20 * r(0)), prelude: warmup(S),
    beats: [
      { to: p(4 + 6 * r(2)), bars: 12 + Math.round(5 * r(3)), vol: 0.55, size: 0.85 },        // quiet lead
      { to: p(-drop * 0.55), bars: 7 + Math.round(3 * r(4)), vol: 0.45, size: 1.3 },          // the drop …
      { to: p(-drop * 0.48), bars: 2, vol: 0.2, size: 0.9 },                                   // … a pause …
      { to: p(-drop), bars: 6 + Math.round(3 * r(5)), vol: 0.35, size: 1.4, shape: "accel" },  // … and the flush
      { to: p(-drop + 9 + 5 * r(6)), bars: 4, vol: 0.25, size: 1.2 },                          // the bounce: the turn
      (look: Look) => {
        const ev = look.run.events.filter((e) => e.i >= look.from);
        const born = ev.find((e) => /TURN ·/.test(e.title));
        const b = born && parseBirth(born);
        if (!b || b.sup !== (dir > 0)) return null;
        const zAtr = atr14(look.s, born!.i);
        const edge = b.near, far = b.far;
        const thickT = Math.round(Math.abs(edge - far) / 0.25);
        const depth = Math.max(3, Math.round(thickT * 0.75)), dmin = Math.max(1, Math.round(thickT * 0.3));
        const at = look.at;
        const lenA = 12 + Math.round(5 * r(7)), lenB = 10 + Math.round(4 * r(8)), lenC = 12 + Math.round(5 * r(9)), lenD = 10 + Math.round(4 * r(10));
        const away = 2.45 * zAtr;
        const top1 = far + dir * Math.max(away + 4 + 6 * r(11), Math.abs(look.last - far) + 8);
        const top2 = top1 + dir * (3 + 7 * r(12));
        const t1 = at + lenA + lenB - 1, t2 = t1 + lenC + lenD;
        const mid = (a: number, b2: number, f: number) => a + (b2 - a) * f;
        const beats: Beat[] = [
          { to: mid(look.last, top1, 0.6), bars: Math.ceil(lenA * 0.55), vol: 0.55, size: 0.95 },
          { to: mid(look.last, top1, 0.45), bars: 2, vol: 0.2, size: 0.8 },
          { to: top1, bars: lenA - Math.ceil(lenA * 0.55) - 2, vol: 0.5, size: 0.95, shape: "decel" },
          { to: edge + dir * 1.5, bars: lenB, vol: 0.5, size: 0.9 },
          { to: mid(edge, top2, 0.55), bars: Math.ceil(lenC * 0.5), vol: 0.55, size: 1.0 },
          { to: mid(edge, top2, 0.42), bars: 2, vol: 0.2, size: 0.8 },
          { to: top2, bars: lenC - Math.ceil(lenC * 0.5) - 2, vol: 0.5, size: 1.0, shape: "decel" },
          { to: edge + dir * 1.5, bars: lenD, vol: 0.5, size: 0.9 },
        ];
        const g = 30 + 14 * r(13);
        // the advance away from the second return: in steps
        beats.push(
          { to: edge + dir * g * 0.45, bars: 7 + Math.round(3 * r(14)), vol: 0.55, size: 1.05 },
          { to: edge + dir * g * 0.33, bars: 3, vol: 0.3, size: 0.85 },
          { to: edge + dir * g * 0.8, bars: 7 + Math.round(3 * r(15)), vol: 0.55, size: 1.05 },
          { to: edge + dir * g * 0.7, bars: 3, vol: 0.3, size: 0.85 },
          { to: edge + dir * g * 1.12, bars: 6 + Math.round(3 * r(16)), vol: 0.5, size: 1.0 },
        );
        const from = dir > 0 ? "above" : "below";
        const touches: Touch[] = [{ i: t1, level: edge, from, depth: [dmin, depth] }, { i: t2, level: edge, from, depth: [dmin, depth] }];
        const side = dir > 0 ? "above" : "below";
        const clear = (a: number, b2: number): Wall => ({ from: a, to: b2, level: edge + dir * 0.5, side, probe: 0 });
        const walls: Wall[] = [clear(at, t1 - 1), clear(t1 + 1, t2 - 1), clear(t2 + 1, t2 + 80), { from: at, to: t2 + 80, level: far, side, probe: 0 }];
        return { beats, walls, touches };
      },
    ],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Support",
    title: "An oversold turn draws a support zone, and price is turned away from it twice",
    premise: "Watch the RSI sink into oversold, then cross its signal and hold: the turn draws a support zone at the swing low. Each time price comes back into it, the zone takes a touch notch and is scored HELD as price leaves again.",
    design: (seed) => scenario(seed, 1),
    seeds: 400,
    judge: judgeOf(true),
  },
  {
    id: "b",
    tab: "Resistance",
    title: "An overbought turn draws a resistance zone, and it caps both rallies back",
    premise: "The mirror: the RSI runs into overbought, turns down through its signal and holds, and a resistance zone is drawn at the swing high. Watch each rally back into it take a touch notch and get scored HELD.",
    design: (seed) => scenario(seed, -1),
    seeds: 400,
    judge: judgeOf(false),
  },
];
