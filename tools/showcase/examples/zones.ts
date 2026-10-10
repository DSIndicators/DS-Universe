import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Touch, Wall } from "../design";
import { shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS Zones — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * Each example follows ONE zone the tool draws inside the shown window, from
 * the impulse that creates it to what price does with it: (a) a demand or
 * supply zone that holds on every return and the move carries on, (b) a zone
 * that holds at least once and then gives way on a displacement bar.
 *
 * The pattern is written (tools/showcase/design.ts): a base, an impulse, and
 * returns aimed at the zone the TOOL drew (a stage reads the NEW zone event
 * before writing the pullback). Every candle is a real recorded one-minute
 * bar with its real footprint, so each zone's profile and order-flow read
 * come from real bid/ask volume. A quiet hidden warm-up feeds ATR(200) and
 * the pivots (never drawn, never narrated — the study's display gate).
 *
 * ZERO FLAWS on stage (Tom, 2026-10-09: "why are you showing these flaws to
 * our potential buyers?"): no zone may be created and then broken, nothing
 * may read BREAKING or TESTING, no zone may flicker.
 */

// ---------------------------------------------------------------- reading the tool's own output
const statusOf = (run: StudyRun, k: number) => Object.fromEntries((run.status?.(k, null) ?? []).map((r) => [r.label, r.value]));
const readOf = (run: StudyRun, k: number) => Object.fromEntries((run.readout?.(k) ?? []).map((r) => [r.label, r.value]));
const zonesLine = (run: StudyRun, k: number) => {
  const m = /(\d+) supply · (\d+) demand · (\d+) broken/.exec(statusOf(run, k)["Live zones"] ?? "");
  return m ? { sup: +m[1], dem: +m[2], brk: +m[3] } : { sup: 0, dem: 0, brk: 0 };
};
const atrAt = (run: StudyRun, k: number) => Number(readOf(run, k)["ATR(200)"] ?? NaN);
const P = "(\\d{1,3}(?:,\\d{3})*\\.\\d{2})";
const num = (t: string) => Number(t.replace(/,/g, ""));
const fmt = (p: number) => {
  const t = (Math.round(p / 0.25) * 0.25).toFixed(2), d = t.indexOf(".");
  return t.slice(0, d).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + t.slice(d);
};
const isSup = (e: StudyEvent) => /SUPPLY/.test(e.title);
/** the zone a NEW event drew: [bottom, top] from its own text */
const zoneOf = (e: StudyEvent) => {
  const m = new RegExp(`zone ${P}–${P}`).exec(e.text);
  return m ? { bottom: num(m[1]), top: num(m[2]) } : null;
};
const absorbPct = (e: StudyEvent) => +((/made up (\d+)%/.exec(e.text) ?? [])[1] ?? 0);

/** chapter text, rewritten short — every number taken from the event's own text */
function retell(e: StudyEvent, s: Session, nth?: number): Chapter {
  const base: Chapter = { i: e.i, title: e.title, text: e.text, tone: e.tone, price: e.price };
  const kind = isSup(e) ? "supply" : "demand";
  if (/^NEW /.test(e.title)) {
    const z = zoneOf(e), edge = new RegExp(`action edge is ${P}`).exec(e.text);
    if (z && edge) base.text = `Three ${kind === "supply" ? "bearish" : "bullish"} bars in a row on at least average volume: the tool draws a ${kind} zone ${fmt(z.bottom)}–${fmt(z.top)} on the last ${kind === "supply" ? "bullish" : "bearish"} candle before the move. Action edge ${edge[1]}.`;
  } else if (/DEFENDED/.test(e.title)) {
    const pct = absorbPct(e);
    const far = new RegExp(`far edge ${P}`).exec(e.text);
    const inside = /closed still inside it/.test(e.text);
    const visit = ["", "first", "second", "third", "fourth", "fifth"][nth ?? 1] ?? "next";
    const flow = pct ? ` Aggressive ${kind === "supply" ? "buying" : "selling"} was ${pct}% of the volume inside the zone on this bar.` : "";
    const where = inside ? "closes still inside it" : `closes back ${kind === "supply" ? "below" : "above"} it`;
    base.text = (nth ?? 1) === 1
      ? `Price trades into the ${kind} zone at ${fmt(e.price ?? s.c[e.i])} and ${where}, short of the far edge${far ? ` ${far[1]}` : ""}: a filled diamond, and the zone's conviction rises.${flow}`
      : `The ${visit} return to the ${kind} zone: price ${where}, short of the far edge${far ? ` ${far[1]}` : ""}, and another filled diamond prints.${flow}`;
  } else if (/TESTING/.test(e.title)) {
    const c = new RegExp(`closed at ${P}`).exec(e.text);
    if (c) base.text = `The bar closes at ${c[1]}, inside the young ${kind} zone. It is under 15 bars old, so the caption reads TESTING without counting a test yet.`;
  } else if (/BROKEN/.test(e.title)) {
    const c = new RegExp(`closed at ${P}`).exec(e.text), far = new RegExp(`\\(${P}\\)`).exec(e.text);
    const why = /a body of ([\d.]+) points/.exec(e.text), vr = /volume ([\d.]+)× its 20-bar average/.exec(e.text);
    const disp = why ? ` (a ${why[1]}-point body)` : vr ? ` (volume ${vr[1]}× its 20-bar average)` : "";
    if (c && far) base.text = `Then it gives way: a displacement bar${disp} closes at ${c[1]}, beyond the far edge ${far[1]} by more than the break distance. The tool retires the zone to a dotted archive band.`;
  }
  if (base.text.length > 240) base.text = base.text.slice(0, 237) + "…";
  return base;
}

/** a zone on the other side, broken by the move away from the zone the example follows */
function retellRun(e: StudyEvent, fromSupply: boolean): Chapter {
  const c = new RegExp(`closed at ${P}`).exec(e.text), far = new RegExp(`\\(${P}\\)`).exec(e.text);
  const K = fromSupply ? "demand" : "supply";
  const text = c && far
    ? `The move away from the ${fromSupply ? "supply" : "demand"} zone runs on through the ${K} zone ${fromSupply ? "below" : "above"}: a displacement bar closes at ${c[1]}, beyond its far edge ${far[1]}, and the tool retires it to a dotted archive band.`
    : e.text;
  return { i: e.i, title: e.title, text: text.length > 240 ? text.slice(0, 237) + "…" : text, tone: e.tone, price: e.price };
}

// ---------------------------------------------------------------- the judge
export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

const NEW_Z = /^NEW (SUPPLY|DEMAND) ZONE$/;
/** the zone the tool drew on stage that the script follows (the first NEW zone of that side) */
function storyZone(ev: StudyEvent[], supply: boolean) {
  const born = ev.find((e) => NEW_Z.test(e.title) && isSup(e) === supply);
  const z = born && zoneOf(born);
  return born && z ? { born, ...z } : null;
}

function judge(run: StudyRun, s: Session, supply: boolean, breaks: boolean): Judged | null {
  const end = s.n - 1;
  const ev = shown(run, s);
  const st = storyZone(ev, supply);
  if (!st) return no("no zone drawn");
  const K = supply ? "SUPPLY" : "DEMAND";
  // ZERO FLAWS: nothing breaks except the story zone in example b, nothing reads BREAKING, nothing flickers
  const broken = ev.filter((e) => /BROKEN$/.test(e.title));
  if (/BREAKING/.test(ev.map((e) => e.title).join("|"))) return no("a BREAKING read");
  if (!breaks && broken.length) return no("a zone broke");
  if (breaks && (broken.length !== 1 || !broken[0].title.startsWith(K))) return no("not exactly the story zone broke");
  const born = ev.filter((e) => NEW_Z.test(e.title));
  if (born.length > 2) return no("too many zones born");
  if (ev.some((e) => /TESTING/.test(e.title))) return no("a TESTING read (price lingering inside)");
  const defs = ev.filter((e) => e.title.startsWith(`${K} DEFENDED`) && e.i > st.born.i);
  const brk = breaks ? broken[0] : undefined;
  const held = brk ? defs.filter((d) => d.i < brk.i) : defs;
  if (held.length < (breaks ? 1 : 2)) return no("not enough defenses");
  if (defs.length !== held.length) return no("a defense after the break");
  let maxZones = 0;
  for (let k = st.born.i; k <= end; k++) { const z = zonesLine(run, k); maxZones = Math.max(maxZones, z.sup + z.dem); }
  if (maxZones > 3) return no("too many zones on stage");
  const others = ev.filter((e) => !(e === st.born || held.includes(e) || e === brk));
  if (others.length > 1) return no("other narration");
  const pcts = held.map(absorbPct);

  const chapters: Chapter[] = [retell(st.born, s)];
  held.slice(0, 3).forEach((d, j) => chapters.push(retell(d, s, j + 1)));
  if (brk) chapters.push(retell(brk, s));
  chapters.sort((a, b) => a.i - b.i);
  for (let j = 1; j < chapters.length; j++) if (chapters[j].i - chapters[j - 1].i < 8) return no("moments crowded");
  const atr = atrAt(run, end);
  const side = supply ? -1 : 1;
  const follow = brk ? -side * (s.c[end] - s.c[brk.i]) : side * (s.c[end] - s.c[held[held.length - 1].i]);
  const score = 20 * held.length + 6 * pcts.filter((p) => p >= 65).length + 8 * Math.min(follow / (atr || 1), 6) - 12 * others.length - 6 * Math.max(0, maxZones - 2);
  return { score, chapters, note: `${K.toLowerCase()} ${fmt(st.bottom)}–${fmt(st.top)} · defenses ${held.length} (${pcts.join("/")}%) · others ${others.length} · max zones ${maxZones}` };
}

// ---------------------------------------------------------------- the scenarios
/**
 * A base, an impulse that leaves a zone, then returns aimed at that zone: each
 * return's last bar wicks into the zone and closes back out (a defense), the
 * far edge is never closed through. `dir` 1 = demand below (impulse up),
 * -1 = supply above (impulse down). With `breaks`, the last return keeps going
 * through the zone on a wide bar and the move carries on the other way.
 */
const warmup = (S: number): Beat[] => [
  { to: S + 18, bars: 60, vol: 0.8 }, { to: S - 12, bars: 70, vol: 0.8 },
  { to: S + 10, bars: 60, vol: 0.8 }, { to: S + 2, bars: 50, vol: 0.7 },
];
function scenario(seed: number, dir: 1 | -1, breaks: boolean): Script {
  const S = 26480 + (seed % 7) * 15;
  const p = (pts: number) => S + dir * pts;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000; // per-seed variation of the legs
  return {
    seed, start: S, clock: 12 * 60 + 1, prelude: warmup(S),
    beats: [
      { to: p(-6), bars: 8, vol: 0.5, size: 0.8 },                                   // the base, into the origin candle
      { to: p(62 + 14 * r(1)), bars: 7, shape: "accel", size: 2.0, vol: 0.2 },         // the impulse
      (look: Look) => {
        const ev = look.run.events.filter((e) => e.i >= look.from);
        const born = ev.find((e) => NEW_Z.test(e.title) && isSup(e) === (dir < 0));
        const z = born && zoneOf(born);
        if (!z) return null;
        const edge = dir > 0 ? z.top : z.bottom, far = dir > 0 ? z.bottom : z.top;
        const depth = Math.max(2, Math.round((Math.abs(edge - far) / 0.25) * 0.6));
        const at = look.at;
        const away1 = 9 + Math.round(4 * r(2)), back1 = 12 + Math.round(4 * r(3)), away2 = 10 + Math.round(4 * r(4)), back2 = 12 + Math.round(4 * r(5));
        const t1 = at + away1 + back1 - 1, t2 = t1 + away2 + back2;
        const top1 = look.last + dir * (8 + 8 * r(6));
        const beats: Beat[] = [
          { to: top1, bars: away1, vol: 0.6, size: 0.9 },
          { to: edge + dir * 1.5, bars: back1, vol: 0.55, size: 0.9 },
          { to: top1 + dir * (14 + 10 * r(7)), bars: away2, vol: 0.6, size: 1.1, shape: "decel" },
          { to: edge + dir * 1.5, bars: back2, vol: 0.55, size: 0.9 },
        ];
        const from = dir > 0 ? "above" : "below";
        const touches: Touch[] = [{ i: t1, level: edge, from, depth: [1, depth] }, { i: t2, level: edge, from, depth: [1, depth] }];
        // price stays clear of the zone except on the two touch bars, and never trades through its far edge
        const side = dir > 0 ? "above" : "below";
        const clear = (a: number, b: number): Wall => ({ from: a, to: b, level: edge + dir * 0.5, side, probe: 0 });
        const walls: Wall[] = [clear(at, t1 - 1), clear(t1 + 1, t2 - 1), { from: at, to: t2 + 60, level: far, side, probe: 0 }];
        if (!breaks) walls.push(clear(t2 + 1, t2 + 60));
        else {
          // after the second defense: a weaker bounce, then the return that goes through on wide bars
          walls[2].to = t2 + 12;
          walls.push(clear(t2 + 1, t2 + 12));
          beats.push({ to: edge + dir * (16 + 6 * r(8)), bars: 8, vol: 0.35 },
            { to: edge + dir * 3, bars: 5, vol: 0.3 },
            { to: far - dir * 16, bars: 2, size: 2.6, vol: 0.15 },
            { to: far - dir * (46 + 10 * r(9)), bars: 14, vol: 0.4, size: 1.2 });
        }
        return { beats, walls, touches };
      },
      // the move away after the second defense runs back to the swing high and stops just under it:
      // nothing the tool drew there (a pivot on that high) is run through on stage
      (look: Look) => {
        if (breaks) return { beats: [] };
        let ext = dir > 0 ? -Infinity : Infinity;
        for (let i = look.from; i < look.s.n; i++) ext = dir > 0 ? Math.max(ext, look.s.h[i]) : Math.min(ext, look.s.l[i]);
        const stop = ext - dir * (1.5 + 3 * r(8));
        return {
          beats: [{ to: stop, bars: 16 + Math.round(4 * r(9)), vol: 0.6, size: 1.2, shape: "decel" }],
          walls: [{ from: look.at, to: look.at + 30, level: ext - dir * 0.25, side: dir > 0 ? "below" : "above", probe: 0 }],
        };
      },
    ],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Zone holds",
    title: "An impulse leaves a demand zone, and it holds on every return",
    premise: "Watch the zone the impulse leaves behind. Each time price comes back into it the bar closes back above, a filled diamond prints on the edge, and price climbs back to the high.",
    design: (seed) => scenario(seed, 1, false),
    seeds: 1500,
    judge: (run, s) => judge(run, s, false, false),
  },
  {
    id: "b",
    tab: "Supply holds",
    title: "A drop leaves a supply zone, and it caps every rally",
    premise: "Watch the zone the drop leaves above. Each rally back into it closes back below, a filled diamond prints on the edge, and price sells back to the low.",
    design: (seed) => scenario(seed, -1, false),
    seeds: 1500,
    judge: (run, s) => judge(run, s, true, false),
  },
];
