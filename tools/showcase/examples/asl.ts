import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Touch, Wall } from "../design";
import { shown } from "../build";
import type { Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS ASL — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * One futures night and morning on 5-minute bars from the Asia open (first
 * shown bar closes 18:05 ET): Asia, London and New York each build their
 * bracket and volume profile ON STAGE. Every candle is a real recorded bar
 * with its real footprint, so each profile, POC and value area comes from
 * real bid/ask volume. Stages read the tool's own "ASIA CLOSED" / "LONDON
 * CLOSED" sentences (high, low, POC) before writing the next session, so each
 * return is aimed at the exact POC the tool drew. The hidden warm-up is a
 * quiet 16:05–18:00 stretch after the prior cash close: no session runs in it,
 * so nothing of it can be drawn (study DEVIATIONS 7).
 *
 * a — up from value: London trades back down to the Asia POC, holds above it
 *     and closes through the Asia high; New York does the same with the London
 *     POC and the London high.
 * b — the mirror: London rallies back to the Asia POC, is held under it and
 *     closes through the Asia low; New York does the same with the London POC
 *     and the London low.
 *
 * ZERO FLAWS (Tom, 2026-10-09): exactly the designed events, every POC return
 * holds (price never crosses back over it), every taken line stays taken.
 */

const ASIA_OPEN = 18 * 60 + 5;
export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

const num = (t: string) => parseFloat(t.replace(/,/g, ""));
const P = "([\\d,]+\\.\\d\\d)";
/** high, low and POC from a "<NAME> CLOSED" sentence */
const closedOf = (e: StudyEvent) => {
  const m = new RegExp(`HIGH ${P} and \\S+(?: \\S+)? LOW ${P} are final, with the POC at ${P}`).exec(e.text);
  return m ? { hi: num(m[1]), lo: num(m[2]), poc: num(m[3]) } : null;
};
/** the tool's sentence without its clock stamp; a trailing sentence is dropped if it runs past 240 characters */
function clean(t: string) {
  let u = t.replace(/^\d\d:\d\d — /, "");
  u = u.charAt(0).toUpperCase() + u.slice(1);
  while (u.length > 240) { const cut = u.lastIndexOf(". ", u.length - 2); if (cut < 40) break; u = u.slice(0, cut + 1); }
  return u;
}
const ch = (e: StudyEvent, text?: string): Chapter => ({ i: e.i, title: e.title, text: (text ?? clean(e.text)).slice(0, 240), tone: e.tone, price: e.price });
const fmt = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------------------------------------------------------------- the judge
function judge(run: StudyRun, s: Session, dir: 1 | -1): Judged | null {
  const f = s.replayFrom, end = s.n - 1;
  if (((s.t[f] % 1440) + 1440) % 1440 !== ASIA_OPEN) return no("does not start at the Asia open");
  const ev = shown(run, s);
  const W = dir > 0 ? "HIGH" : "LOW";
  const want = ["ASIA OPENS", "ASIA CLOSED", "LONDON OPENS", "AT THE ASIA POC", `ASIA ${W} TAKEN`, "LONDON CLOSED", "NEW YORK OPENS", "AT THE LONDON POC", `LONDON ${W} TAKEN`];
  // ZERO FLAWS: exactly the designed events, in this order, nothing else
  const got = ev.map((e) => e.title);
  if (got.join("|") !== want.join("|")) return no(`events: ${got.filter((t) => !/OPENS|CLOSED/.test(t)).join(", ")}`);
  const E = (t: string) => ev.find((e) => e.title === t)!;
  const asia = E("ASIA CLOSED"), lon = E("LONDON CLOSED"), asiaOpen = E("ASIA OPENS");
  if (asiaOpen.i !== f) return no("Asia does not open on the first bar");
  const A = closedOf(asia), L = closedOf(lon);
  if (!A || !L) return no("a closed session has no profile");
  // each POC reads on its own line, well inside its bracket
  if (Math.min(A.hi - A.poc, A.poc - A.lo) < 20 || Math.min(L.hi - L.poc, L.poc - L.lo) < 15) return no("a POC hugs its bracket's edge");
  if (A.hi - A.lo < 70) return no("Asia range too narrow");
  // the POC returns: the touch bar closes back on its side, price never crosses back, and the move turns away
  for (const [t, poc] of [[E("AT THE ASIA POC"), A.poc], [E("AT THE LONDON POC"), L.poc]] as [StudyEvent, number][]) {
    if (dir * (s.c[t.i] - poc) < 2) return no("POC touch closes too near it");
    for (let i = t.i + 1; i <= end; i++) if (dir * ((dir > 0 ? s.l[i] : s.h[i]) - poc) < 1) return no("price came back to a POC it held");
    let turn = 0;
    for (let i = t.i; i <= Math.min(end, t.i + 12); i++) turn = Math.max(turn, dir * ((dir > 0 ? s.h[i] : s.l[i]) - poc));
    if (turn < 25) return no("no turn away from the POC");
  }
  // the takes: decisive, never revisited
  let follow = 0;
  for (const [t, lvl] of [[E(`ASIA ${W} TAKEN`), dir > 0 ? A.hi : A.lo], [E(`LONDON ${W} TAKEN`), dir > 0 ? L.hi : L.lo]] as [StudyEvent, number][]) {
    if (dir * (s.c[t.i] - lvl) < 3) return no("take not decisive");
    for (let i = t.i + 1; i <= end; i++) if (dir * ((dir > 0 ? s.l[i] : s.h[i]) - lvl) < 2.5) return no("price came back to a taken level");
  }
  const last = E(`LONDON ${W} TAKEN`), lvl = dir > 0 ? L.hi : L.lo;
  for (let i = last.i + 1; i <= end; i++) follow = Math.max(follow, dir * ((dir > 0 ? s.h[i] : s.l[i]) - lvl));
  if (follow < 60) return no("no follow-through");
  const endHold = dir * (s.c[end] - lvl);
  if (endHold < 0.5 * follow) return no("follow-through given back");
  let maxR = 0; const rs: number[] = [];
  for (let i = f; i <= asia.i; i++) { const r = s.h[i] - s.l[i]; rs.push(r); maxR = Math.max(maxR, r); }
  if (maxR > 5 * rs.slice().sort((a, b) => a - b)[rs.length >> 1]) return no("an outsized Asia bar");

  // ---- moments: from the tool's own sentences
  const chapters: Chapter[] = [
    ch(asia, `Asia closes: ASIA HIGH ${fmt(A.hi)} and ASIA LOW ${fmt(A.lo)} are final, with the POC at ${fmt(A.poc)}, the busiest 1-point level of its profile. The levels carry forward dotted until Asia opens again.`),
    ch(E("AT THE ASIA POC"), `London trades back to the ASIA POC ${fmt(A.poc)} for the first time since Asia closed, and the bar closes back ${dir > 0 ? "above" : "below"} it at ${fmt(s.c[E("AT THE ASIA POC").i])}. Its carried line fades from here.`),
    ch(E(`ASIA ${W} TAKEN`)),
    ch(lon, `London closes: LONDON HIGH ${fmt(L.hi)} and LONDON LOW ${fmt(L.lo)} are final, with the POC at ${fmt(L.poc)}. The levels carry forward dotted until London opens again.`),
    ch(E("AT THE LONDON POC"), `New York trades back to the LONDON POC ${fmt(L.poc)} for the first time since London closed, and the bar closes back ${dir > 0 ? "above" : "below"} it at ${fmt(s.c[E("AT THE LONDON POC").i])}. Its carried line fades from here.`),
    ch(last),
  ];
  for (let j = 1; j < chapters.length; j++) if (chapters[j].i - chapters[j - 1].i < 8) return no("moments crowded");
  const score = Math.min(follow, 180) + 0.5 * Math.min(endHold, 150) + 0.5 * Math.min(Math.min(A.hi - A.poc, A.poc - A.lo), 60);
  return { score, chapters, note: `follow ${follow.toFixed(1)} · Asia ${A.lo}–${A.hi} POC ${A.poc} · London ${L.lo}–${L.hi} POC ${L.poc} · [${ev.map((e) => `${e.i - f}:${e.title}`).join(", ")}]` };
}

// ---------------------------------------------------------------- the scenarios
class Plan {
  beats: Beat[] = []; walls: Wall[] = []; touches: Touch[] = [];
  constructor(public at: number) {}
  leg(to: number, bars: number, o: Partial<Beat> = {}): [number, number] { const a = this.at; this.beats.push({ to, bars, vol: 0.55, ...o }); this.at += bars; return [a, this.at - 1]; }
  /** price stays on `dir`'s side of a level (dir 1: above, -1: below) */
  wall(from: number, to: number, level: number, dir: 1 | -1) { if (to >= from) this.walls.push({ from, to, level, side: dir > 0 ? "above" : "below", probe: 0 }); }
  out() { return { beats: this.beats, walls: this.walls, touches: this.touches }; }
}
const closedEv = (look: Look, title: string) => { const e = look.run.events.find((x) => x.i >= look.from && x.title === title); return e ? closedOf(e) : null; };
const ASIA_BARS = 108, LON_BARS = 78; // 18:05–03:00 and 03:05–09:30 on 5-minute bars

/** Asia builds its range: a move one way, a deeper move the other, a recovery, a drift — ending on `dir`'s side of its middle */
function asia(S: number, dir: 1 | -1, r: (k: number) => number): Beat[] {
  const a = 22 + Math.round(8 * r(1)), b = 30 + Math.round(10 * r(2)), c = 24 + Math.round(8 * r(3));
  const d = ASIA_BARS - a - b - c;
  const up = 45 + 25 * r(4), dn = 45 + 25 * r(5);
  const at = (q: number) => S - dn + (up + dn) * (dir > 0 ? q : 1 - q);
  return [
    { to: dir > 0 ? S + up : S - dn, bars: a, vol: 0.55, shape: "decel" },
    { to: dir > 0 ? S - dn : S + up, bars: b, vol: 0.6 },
    { to: at(0.5 + 0.15 * r(6)), bars: c, vol: 0.55 },
    { to: at(0.62 + 0.12 * r(7)), bars: d, vol: 0.45, size: 0.8 },
  ];
}
const prelude = (S: number): Beat[] => [{ to: S + 6, bars: 12, vol: 0.4, size: 0.7 }, { to: S, bars: 12, vol: 0.4, size: 0.7 }];

/**
 * One session's job: from where the last one closed, move away from the previous
 * session's POC, come back to it (one bar trades at it and closes back), then
 * close through the previous session's high (dir 1) or low (dir -1) on the
 * first bar that reaches it, and carry on.
 */
function fromValue(seed: number, dir: 1 | -1): Script {
  const S = 25900 + (seed % 9) * 20;
  // per-seed variation of the legs (the mirror gets its own rhythm, not a flipped copy of a)
  const r = (k: number) => ((seed * 7919 + k * 104729 + (dir < 0 ? k * k * 3571 : 0)) % 1000) / 1000;
  const session = (title: string, bars: number | null, k0: number) => (look: Look) => {
    const X = closedEv(look, title);
    if (!X) return null;
    if (bars !== null && look.at !== ASIA_BARS) return null;
    if (bars === null && look.at !== ASIA_BARS + LON_BARS) return null;
    const edge = dir > 0 ? X.hi : X.lo, far = dir > 0 ? X.lo : X.hi;
    // the session opens clear of the POC on the story's side
    if (dir * (look.last - X.poc) < 6) return null;
    if (dir * (edge - X.poc) < 30) return null;
    const p = new Plan(look.at), q = (k: number) => r(k0 + k);
    const z = (n: number) => Math.max(3, Math.round(n * (bars !== null ? 1 : 0.65))); // New York's bars are bigger: shorter legs
    const away = X.poc + dir * Math.min(dir * (edge - X.poc) - 10, Math.max(dir * (look.last - X.poc) + 6, 22 + 14 * q(1)));
    const [a0] = p.leg(away, z(7 + 4 * q(2)), { vol: 0.5 });
    const [, b1] = p.leg(X.poc + dir * 3, z(8 + 4 * q(3)), { vol: 0.5 });
    p.wall(a0, b1, X.poc + dir * 0.75, dir);                       // no bar trades at the POC before the touch bar
    p.wall(a0, b1, edge - dir * 1, (-dir) as 1 | -1);              // nor reaches the edge
    const [t] = p.leg(X.poc + dir * (5 + 4 * q(4)), 1, { vol: 0.1 });
    p.touches.push({ i: t, level: X.poc, from: dir > 0 ? "above" : "below", depth: [0, 2] });
    p.wall(t, t, X.poc - dir * 0.5, dir);
    const near = edge - dir * (12 + 8 * q(5));
    p.leg(near, z(7 + 3 * q(6)), { vol: 0.55 });
    p.leg(near - dir * (12 + 8 * q(7)), z(4 + 2 * q(8)), { vol: 0.5 });
    const [, u1] = p.leg(edge - dir * 3, z(5 + 2 * q(9)), { vol: 0.55 });
    p.wall(t + 1, u1, edge - dir * 1, (-dir) as 1 | -1);
    const [tk] = p.leg(edge + dir * (13 + 5 * q(10)), 1, { size: 1.4, vol: 0.1 });
    p.wall(t + 1, tk + 120, X.poc + dir * 3, dir);                 // the POC that held is never crossed back
    p.wall(tk + 1, tk + 120, edge + dir * 4, dir);                 // nor the taken line
    if (bars !== null) {
      // London: run on, rotate, drift — its own POC forms clear of the Asia edge
      const endL = ASIA_BARS + LON_BARS - 1;
      const hi1 = edge + dir * (60 + 20 * q(11));
      p.leg(hi1, 9 + Math.round(4 * q(12)), { vol: 0.55, shape: "decel" });
      if (p.at > endL - 12) return null;
      const mid = edge + dir * (28 + 10 * q(13));
      p.leg(mid, Math.round((endL - p.at + 1) * 0.45), { vol: 0.5 });
      const fin = hi1 - dir * (6 + 8 * q(14));
      p.leg(fin, endL - p.at, { vol: 0.5, size: 0.9 });
      p.leg(fin + dir * 2, 1, { vol: 0.1, size: 0.35 }); // the bar stamped 09:30 is a pre-open bar: keep it quiet
    } else {
      const top = edge + dir * (95 + 40 * q(11));
      p.leg(edge + dir * (55 + 15 * q(12)), 6 + Math.round(3 * q(13)), { vol: 0.55 });
      p.leg(edge + dir * (32 + 10 * q(14)), 5 + Math.round(2 * q(15)), { vol: 0.5 });
      p.leg(top, 8 + Math.round(3 * q(16)), { vol: 0.55, shape: "decel" });
      p.leg(top - dir * (8 + 8 * q(17)), 3, { vol: 0.4 });
    }
    p.wall(a0, tk + 120, far + dir * 2, dir);
    return p.out();
  };
  return {
    seed, start: S, clock: ASIA_OPEN, tf: 5, prelude: prelude(S),
    beats: [...asia(S, dir, r), session("ASIA CLOSED", LON_BARS, 20), session("LONDON CLOSED", null, 40)],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Up from value",
    title: "Each session holds the POC before it, then closes through its high",
    premise: "Asia and London build their brackets and volume profiles on the chart. Watch London trade back to the Asia POC and close above it, then close through the Asia high; New York does the same with the London POC and the London high.",
    design: (seed) => fromValue(seed, 1),
    seeds: Number(process.env.SEEDS ?? 160),
    judge: (run, s) => judge(run, s, 1),
  },
  {
    id: "b",
    tab: "Down from value",
    title: "Each session is held under the POC before it, then closes through its low",
    premise: "Asia and London build their brackets and volume profiles on the chart. Watch London rally back to the Asia POC and close below it, then close through the Asia low; New York does the same with the London POC and the London low.",
    design: (seed) => fromValue(seed, -1),
    seeds: Number(process.env.SEEDS ?? 160),
    judge: (run, s) => judge(run, s, -1),
  },
];
