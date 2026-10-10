import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Touch, Wall } from "../design";
import { shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS Session Levels — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * One futures night and morning on 5-minute bars from the Asia open (first
 * shown bar closes 18:05 ET): Asia, London and New York each build their high
 * and low ON STAGE, so every carried level is one the viewer watched being
 * made. The pattern is written (tools/showcase/design.ts); stages read the
 * tool's own "ASIA HIGH & LOW" / "LONDON HIGH & LOW" events before writing
 * the next session, so every approach is aimed at the exact level the tool
 * drew. The hidden warm-up is a quiet 16:05–18:00 stretch after the prior
 * cash close: no session runs in it, so nothing of it can be drawn.
 *
 * a — highs taken in sequence: London closes through the Asia high, New York
 *     closes through the London high, each on the first bar to reach the
 *     level, and price never closes back under a taken line.
 * b — highs hold, lows taken: London reaches the Asia high and is capped,
 *     New York reaches the London high and is capped, then New York closes
 *     through the London low and the Asia low.
 *
 * ZERO FLAWS (Tom, 2026-10-09): no level that stands is later taken, no taken
 * level is crossed back, no unplanned touch or take, nothing from the warm-up.
 */

const ASIA_OPEN = 18 * 60 + 5;
const f2 = (p: number) => p.toFixed(2);

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

type Parsed = { e: StudyEvent; sess: "ASIA" | "LONDON" | "NEW YORK"; word: "HIGH" | "LOW"; kind: "AT" | "TAKEN" };
function parse(e: StudyEvent): Parsed | null {
  let m = e.title.match(/^AT THE (ASIA|LONDON|NEW YORK) (HIGH|LOW)$/);
  if (m) return { e, sess: m[1] as Parsed["sess"], word: m[2] as Parsed["word"], kind: "AT" };
  m = e.title.match(/^(ASIA|LONDON|NEW YORK) (HIGH|LOW) TAKEN$/);
  if (m) return { e, sess: m[1] as Parsed["sess"], word: m[2] as Parsed["word"], kind: "TAKEN" };
  return null;
}
/** the final high and low a "<NAME> HIGH & LOW" event states */
const finalOf = (e: StudyEvent) => {
  const m = e.text.match(/HIGH ([\d.]+) and \S+(?: \S+)? LOW ([\d.]+) are final/);
  return m ? { hi: +m[1], lo: +m[2] } : null;
};

const sessionClosed = (e: StudyEvent, name: string): string => {
  const f = finalOf(e), up = name.toUpperCase();
  return f ? `${name} closes: ${up} HIGH ${f2(f.hi)} and ${up} LOW ${f2(f.lo)} are final. They carry forward as dotted lines until ${name} opens again.` : "";
};
const closeMoment = (e: StudyEvent, name: string, extra = ""): Chapter =>
  ({ i: e.i, title: e.title, tone: e.tone, price: e.price, text: (sessionClosed(e, name) + extra).slice(0, 240) });
function takenMoment(p: Parsed, s: Session, extra = ""): Chapter {
  const up = p.word === "HIGH";
  const t = `The first bar to reach the ${p.sess} ${p.word} ${f2(p.e.price!)} closes at ${f2(s.c[p.e.i])}, ${up ? "above" : "below"} it: the level is taken and the rest of its dotted line fades. A wick would not count; it takes a close.${extra}`;
  return { i: p.e.i, title: p.e.title, tone: p.e.tone, price: p.e.price, text: t.slice(0, 240) };
}
function atMoment(p: Parsed, s: Session, extra = ""): Chapter {
  const up = p.word === "HIGH";
  const t = `The bar reaches ${up ? "up" : "down"} to the ${p.sess} ${p.word} ${f2(p.e.price!)} (within 2 ticks) and closes at ${f2(s.c[p.e.i])}, still ${up ? "below" : "above"} it: no close through, so the level stands.${extra}`;
  return { i: p.e.i, title: p.e.title, tone: p.e.tone, price: p.e.price, text: t.slice(0, 240) };
}

// ---------------------------------------------------------------- the judge
type Want = { sess: "ASIA" | "LONDON"; word: "HIGH" | "LOW"; kind: "AT" | "TAKEN"; in: "LONDON" | "NEW YORK" };

function judge(run: StudyRun, s: Session, want: Want[]): Judged | null {
  const f = s.replayFrom, end = s.n - 1;
  if (((s.t[f] % 1440) + 1440) % 1440 !== ASIA_OPEN) return no("does not start at the Asia open");
  const ev = shown(run, s);
  const one = (t: string) => { const a = ev.filter((e) => e.title === t); return a.length === 1 ? a[0] : null; };
  const asiaOpen = one("ASIA SESSION"), asia = one("ASIA HIGH & LOW"), lonOpen = one("LONDON SESSION"), lon = one("LONDON HIGH & LOW"), nyOpen = one("NEW YORK SESSION");
  if (!asiaOpen || !asia || !lonOpen || !lon || !nyOpen) return no("a session is missing");
  if (asiaOpen.i !== f) return no("Asia does not open on the first bar");
  if (ev.some((e) => e.title === "NEW YORK HIGH & LOW")) return no("New York closes on stage");
  const lv = ev.map(parse).filter((x): x is Parsed => !!x);
  // ZERO FLAWS: exactly the designed level events, in the designed order, nothing else
  if (lv.length !== want.length) return no(`level events: ${lv.map((p) => p.e.title).join(", ")}`);
  for (let j = 0; j < want.length; j++) {
    const w = want[j], p = lv[j];
    if (p.sess !== w.sess || p.word !== w.word || p.kind !== w.kind) return no("unplanned level event");
    const inNy = p.e.i >= nyOpen.i;
    if ((w.in === "NEW YORK") !== inNy || p.e.i <= asia.i) return no("level event in the wrong session");
  }
  const levels = { ASIA: finalOf(asia)!, LONDON: finalOf(lon)! };
  // every level the story takes: decisive close, never crossed back by a close or a wick
  let follow = 0;
  for (const p of lv) {
    const dir = p.word === "HIGH" ? 1 : -1, L = p.e.price!;
    if (p.kind === "TAKEN") {
      if (dir * (s.c[p.e.i] - L) < 3) return no("take not decisive");
      for (let i = p.e.i + 1; i <= end; i++) if (dir * ((dir > 0 ? s.l[i] : s.h[i]) - L) < 2.5) return no("price came back to a taken level");
    } else {
      // a level that stands: the touch bar closes well away, and no bar ever trades beyond it
      if (dir * (L - s.c[p.e.i]) < 2) return no("touch closes too near the level");
      for (let i = p.e.i; i <= end; i++) if (dir * ((dir > 0 ? s.h[i] : s.l[i]) - L) > 0) return no("a standing level was traded through");
      let react = 0;
      for (let i = p.e.i; i <= Math.min(end, p.e.i + 12); i++) react = Math.max(react, dir * (L - (dir > 0 ? s.l[i] : s.h[i])));
      if (react < 30) return no("no turn away from a standing level");
    }
  }
  // the levels the story never uses are never approached (no touch within 2 ticks is guaranteed above; keep them clear)
  const last = lv[lv.length - 1], ld = last.word === "HIGH" ? 1 : -1;
  for (let i = last.e.i + 1; i <= end; i++) follow = Math.max(follow, ld * ((ld > 0 ? s.h[i] : s.l[i]) - last.e.price!));
  if (end - last.e.i < 12) return no("too little after the last take");
  if (follow < 60) return no("no follow-through");
  const endHold = ld * (s.c[end] - last.e.price!);
  if (endHold < 0.5 * follow) return no("follow-through given back");
  // the Asia range is a range the session built, not one outsized bar
  let maxR = 0; const rs: number[] = [];
  for (let i = f; i <= asia.i; i++) { const r = s.h[i] - s.l[i]; rs.push(r); maxR = Math.max(maxR, r); }
  const med = rs.slice().sort((a, b) => a - b)[rs.length >> 1];
  if (maxR > 5 * med) return no("an outsized Asia bar");
  if (levels.ASIA.hi - levels.ASIA.lo < 70) return no("Asia range too narrow");

  // ---- moments: the two session closes and every level event, all from the tool's own text
  const chapters: Chapter[] = [closeMoment(asia, "Asia")];
  for (const p of lv) if (p.e.i < lon.i) chapters.push(p.kind === "TAKEN" ? takenMoment(p, s) : atMoment(p, s));
  chapters.push(closeMoment(lon, "London"));
  const nyEv = lv.filter((p) => p.e.i > lon.i);
  for (const p of lv.filter((q) => q.e.i > lon.i)) {
    // the London high New York reaches is the Asia high London reached: say so, from the two events' own prices
    const twin = p.kind === "AT" && p.sess === "LONDON" && lv.some((q) => q.kind === "AT" && q.sess === "ASIA" && q.word === p.word && Math.abs(q.e.price! - p.e.price!) <= 0.5);
    chapters.push(p.kind === "TAKEN" ? takenMoment(p, s) : atMoment(p, s, twin ? ` The same line capped London at the ASIA ${p.word}.` : ""));
  }
  chapters.sort((a, b) => a.i - b.i);
  for (let j = 1; j < chapters.length; j++) if (chapters[j].i - chapters[j - 1].i < 8) return no("moments crowded");
  if (chapters.length < 3 || chapters.length > 6) return no("moment count");

  const score = Math.min(follow, 180) + 0.5 * Math.min(endHold, 150) + (levels.ASIA.hi - levels.ASIA.lo > 100 ? 10 : 0);
  return { score, chapters, note: `follow ${follow.toFixed(1)} · end ${endHold.toFixed(1)} · Asia ${f2(levels.ASIA.lo)}–${f2(levels.ASIA.hi)} · London ${f2(levels.LONDON.lo)}–${f2(levels.LONDON.hi)} · [${lv.map((p) => `${p.e.i - f}:${p.e.title}`).join(", ")}]` };
}

// ---------------------------------------------------------------- the scenarios
/** sequential legs with their shown indices, walls and touches */
class Plan {
  beats: Beat[] = []; walls: Wall[] = []; touches: Touch[] = [];
  constructor(public at: number) {}
  leg(to: number, bars: number, o: Partial<Beat> = {}): [number, number] { const a = this.at; this.beats.push({ to, bars, vol: 0.55, ...o }); this.at += bars; return [a, this.at - 1]; }
  wall(from: number, to: number, level: number, side: "above" | "below") { if (to >= from) this.walls.push({ from, to, level, side, probe: 0 }); }
  out() { return { beats: this.beats, walls: this.walls, touches: this.touches }; }
}
const finalEv = (look: Look, title: string) => { const e = look.run.events.find((x) => x.i >= look.from && x.title === title); return e ? finalOf(e) : null; };

const ASIA_BARS = 108, LON_BARS = 78; // 18:05–03:00 and 03:05–09:30 on 5-minute bars

/** Asia builds its range: a rally, a deeper sell-off, a recovery, a drift (lengths and sizes vary per seed) */
function asia(S: number, r: (k: number) => number): Beat[] {
  const a = 22 + Math.round(8 * r(1)), b = 30 + Math.round(10 * r(2)), c = 24 + Math.round(8 * r(3));
  const d = ASIA_BARS - a - b - c;
  const up = 45 + 25 * r(4), dn = 45 + 25 * r(5);
  return [
    { to: S + up, bars: a, vol: 0.55, shape: "decel" },
    { to: S - dn, bars: b, vol: 0.6 },
    { to: S - dn + (up + dn) * (0.45 + 0.2 * r(6)), bars: c, vol: 0.55 },
    { to: S - dn + (up + dn) * (0.4 + 0.2 * r(7)), bars: d, vol: 0.45, size: 0.8 },
  ];
}
const prelude = (S: number): Beat[] => [{ to: S + 6, bars: 12, vol: 0.4, size: 0.7 }, { to: S, bars: 12, vol: 0.4, size: 0.7 }];

/** a — London closes through the Asia high, New York closes through the London high */
function highsTaken(seed: number): Script {
  const S = 25900 + (seed % 9) * 20;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  return {
    seed, start: S, clock: ASIA_OPEN, tf: 5, prelude: prelude(S),
    beats: [
      ...asia(S, r),
      (look: Look) => {
        const A = finalEv(look, "ASIA HIGH & LOW");
        if (!A || look.at !== ASIA_BARS) return null;
        const p = new Plan(look.at), end = look.at + LON_BARS - 1;
        const mid = (A.hi + A.lo) / 2;
        const dip = Math.max(A.lo + 18, Math.min(look.last - 10, mid - 10 * r(10)));
        const [d0, d1] = p.leg(dip, 8 + Math.round(4 * r(11)), { vol: 0.5 });
        const near = A.hi - 14 - 10 * r(31);
        p.leg(near, 9 + Math.round(4 * r(12)), { vol: 0.55 });
        p.leg(near - 16 - 10 * r(32), 5 + Math.round(3 * r(33)), { vol: 0.5 });
        const [, u1] = p.leg(A.hi - 3, 7 + Math.round(3 * r(34)), { vol: 0.55 });
        p.wall(d0, u1, A.hi - 1, "below");                                  // nothing reaches the Asia high before the take bar
        const [t] = p.leg(A.hi + 12 + 4 * r(13), 1, { size: 1.4, vol: 0.1 }); // the take: first bar to reach it closes well above
        const hi1 = A.hi + 55 + 20 * r(14);
        p.leg(hi1, 10 + Math.round(4 * r(15)), { vol: 0.55, shape: "decel" });
        p.leg(A.hi + 22 + 10 * r(16), 10 + Math.round(4 * r(17)), { vol: 0.55 });
        const fin = hi1 - 12 - 10 * r(18);
        p.leg(fin, end - p.at, { vol: 0.5, size: 0.9 });
        p.leg(fin + 2, 1, { vol: 0.1, size: 0.35 }); // the bar stamped 09:30 is a pre-open bar: keep it quiet
        p.wall(t + 1, end + 80, A.hi + 3, "above");                         // the taken line is never revisited
        p.wall(d0, end, A.lo + 2, "above");
        return p.out();
      },
      (look: Look) => {
        const L = finalEv(look, "LONDON HIGH & LOW"), A = finalEv(look, "ASIA HIGH & LOW");
        if (!L || !A || look.at !== ASIA_BARS + LON_BARS) return null;
        const p = new Plan(look.at);
        const dip = Math.max(A.hi + 30, L.hi - 35 - 15 * r(20));
        const [d0] = p.leg(dip, 6 + Math.round(3 * r(21)), { vol: 0.5 });
        p.wall(d0, d0 + 40, A.hi + 20, "above");
        const [, u1] = p.leg(L.hi - 4, 6 + Math.round(3 * r(22)), { vol: 0.5 });
        p.wall(d0, u1, L.hi - 1, "below");
        const [t] = p.leg(L.hi + 16 + 6 * r(23), 1, { size: 1.3, vol: 0.1 });
        const top = L.hi + 95 + 40 * r(24);
        p.leg(L.hi + 60 + 15 * r(25), 7 + Math.round(3 * r(26)), { vol: 0.55 });
        p.leg(L.hi + 35 + 10 * r(27), 5 + Math.round(2 * r(28)), { vol: 0.5 });
        p.leg(top, 9 + Math.round(4 * r(29)), { vol: 0.55, shape: "decel" });
        p.leg(top - 15 - 10 * r(30), 4, { vol: 0.4 });
        p.wall(t + 1, p.at + 5, L.hi + 4, "above");
        return p.out();
      },
    ],
  };
}

/** b — the Asia high caps London, the London high caps New York, then New York takes the London low and the Asia low */
function highsHold(seed: number): Script {
  const S = 25900 + (seed % 9) * 20;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  return {
    seed, start: S, clock: ASIA_OPEN, tf: 5, prelude: prelude(S),
    beats: [
      ...asia(S, r),
      (look: Look) => {
        const A = finalEv(look, "ASIA HIGH & LOW");
        if (!A || look.at !== ASIA_BARS) return null;
        const p = new Plan(look.at), end = look.at + LON_BARS - 1;
        const rng = A.hi - A.lo;
        const [d0] = p.leg(Math.max(A.lo + rng * 0.5, look.last - 8 - 8 * r(10)), 6 + Math.round(4 * r(11)), { vol: 0.5 });
        const [, u1] = p.leg(A.hi - 2.5, 16 + Math.round(6 * r(12)), { vol: 0.55 });
        p.wall(d0, u1, A.hi - 1, "below");
        // the touch: a wick up to the Asia high (0–2 ticks under it), the bar closes back down
        const [t] = p.leg(A.hi - 7 - 4 * r(13), 1, { vol: 0.1 });
        p.touches.push({ i: t, level: A.hi - 0.5, from: "below", depth: [0, 2] });
        p.wall(t, t, A.hi, "below");
        const low1 = A.lo + rng * (0.4 + 0.1 * r(14));
        p.leg(low1, 14 + Math.round(5 * r(15)), { vol: 0.55, shape: "decel" });
        p.leg(low1 + rng * (0.25 + 0.1 * r(16)), 12 + Math.round(5 * r(17)), { vol: 0.5 });
        const fin = low1 + rng * (0.15 + 0.1 * r(18));
        p.leg(fin, end - p.at, { vol: 0.45, size: 0.9 });
        p.leg(fin - 2, 1, { vol: 0.1, size: 0.35 }); // the bar stamped 09:30 is a pre-open bar: keep it quiet
        p.wall(t + 1, end, A.hi - 3, "below");
        p.wall(d0, end, A.lo + rng * 0.36, "above");
        return p.out();
      },
      (look: Look) => {
        const L = finalEv(look, "LONDON HIGH & LOW"), A = finalEv(look, "ASIA HIGH & LOW");
        if (!L || !A || look.at !== ASIA_BARS + LON_BARS) return null;
        if (L.lo - A.lo < 35) return null;
        const p = new Plan(look.at);
        const [u0, u1] = p.leg(L.hi - 3, 6 + Math.round(3 * r(20)), { vol: 0.5 });
        p.wall(u0, u1, L.hi - 1, "below");
        p.wall(u0, u1 + 1, L.lo + 1, "above");
        const [t1] = p.leg(L.hi - 10 - 5 * r(21), 1, { vol: 0.1 });
        p.touches.push({ i: t1, level: L.hi - 0.5, from: "below", depth: [0, 2] });
        p.wall(t1, t1, L.hi, "below");
        const [, a1] = p.leg(L.lo + 4, 8 + Math.round(3 * r(22)), { vol: 0.55 });
        p.wall(t1 + 1, a1, L.lo + 1, "above");
        const [t2] = p.leg(L.lo - 14 - 5 * r(23), 1, { size: 1.3, vol: 0.1 });
        p.wall(t2, t2, A.lo + 1, "above");
        const [b0, b1] = p.leg(A.lo + 5, 9 + Math.round(3 * r(24)), { vol: 0.55 });
        p.wall(b0, b1, A.lo + 1, "above");
        p.wall(t2 + 1, b1, L.lo - 3, "below");
        const [t3] = p.leg(A.lo - 14 - 5 * r(25), 1, { size: 1.3, vol: 0.1 });
        const bot = A.lo - 70 - 30 * r(26);
        p.leg(A.lo - 40 - 10 * r(27), 5 + Math.round(2 * r(28)), { vol: 0.55 });
        p.leg(A.lo - 25 - 8 * r(29), 4, { vol: 0.5 });
        p.leg(bot, 7 + Math.round(3 * r(30)), { vol: 0.55, shape: "decel" });
        p.leg(bot + 6 + 6 * r(31), 3, { vol: 0.4 });
        p.wall(t1 + 1, p.at + 5, L.hi - 3, "below");
        p.wall(t3 + 1, p.at + 5, A.lo - 4, "below");
        return p.out();
      },
    ],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Highs taken",
    title: "London closes through the Asia high, New York closes through the London high",
    premise: "Asia and London build their highs and lows on the chart, then carry them forward dotted. Watch each high get taken by the first bar that reaches it, on a close: the taken line fades from that bar and price stays above it.",
    design: highsTaken,
    seeds: Number(process.env.SEEDS ?? 160),
    judge: (run, s) => judge(run, s, [
      { sess: "ASIA", word: "HIGH", kind: "TAKEN", in: "LONDON" },
      { sess: "LONDON", word: "HIGH", kind: "TAKEN", in: "NEW YORK" },
    ]),
  },
  {
    id: "b",
    tab: "Highs hold",
    title: "The Asia high caps London, the London high caps New York, then the lows are taken",
    premise: "Asia and London build their highs and lows on the chart, then carry them forward dotted. Watch London reach the Asia high and New York reach the London high without a close through either, then New York close through the London low and the Asia low.",
    design: highsHold,
    seeds: Number(process.env.SEEDS ?? 160),
    judge: (run, s) => judge(run, s, [
      { sess: "ASIA", word: "HIGH", kind: "AT", in: "LONDON" },
      { sess: "LONDON", word: "HIGH", kind: "AT", in: "NEW YORK" },
      { sess: "LONDON", word: "LOW", kind: "TAKEN", in: "NEW YORK" },
      { sess: "ASIA", word: "LOW", kind: "TAKEN", in: "NEW YORK" },
    ]),
  },
];
