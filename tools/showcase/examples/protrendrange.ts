import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Stage, Touch, Wall } from "../design";
import { shown } from "../build";
import type { ReadItem, Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS ProTrendRange — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * Two faces of the tool:
 *  a  TREND, PULLBACK, RESUME — out of a quiet stretch the TREND reading latches
 *     a trend on; each pullback fills the pocket, the RESUME is stamped on the
 *     bar that confirms it is over (shelf at its HOLD, the T), and each time the
 *     leg goes on to a new extreme with the HOLD far below.
 *  b  RANGE, THEN TREND — the up trend ends, the tool says RANGING and draws the
 *     RANGE HIGH / RANGE LOW rails; price holds and works just above RANGE LOW
 *     without moving either rail, the bar that breaks through it is the bar the
 *     new (down) trend latches on, and its RESUME carries to a new extreme.
 *
 * The pattern is written (tools/showcase/design.ts); every candle is a real
 * recorded one-minute NQ bar. Stages read the tool's own output before writing
 * what comes next: each run on to a new extreme is written only after the
 * RESUME is stamped, with price kept clear of its HOLD; the drop that ends the
 * trend stops on the bar the tool calls RANGING; the range is worked inside the
 * rails the tool drew, steered by its own TREND reading (the 50-bar reading is a
 * t-statistic of the closes, so a range must be worked slowly or it latches a
 * trend); the breakout bar is sized from that same measurement so the trend
 * latches on the bar that leaves the range.
 * A quiet hidden warm-up settles the 50-bar reading (never drawn, never narrated).
 *
 * ZERO FLAWS on stage (Tom, 2026-10-09): no FAILED / TREND LOST / EXPIRED, no
 * MINOR resume, no trend against the story, no rail that moves.
 */

// ------------------------------------------------------------------ reading the study's output
const val = (items: ReadItem[] | undefined, label: string) => String(items?.find((r) => r.label === label)?.value ?? "");
const memo = new WeakMap<StudyRun, Map<number, ReadItem[] | undefined>>();
const readout = (run: StudyRun, i: number) => { let m = memo.get(run); if (!m) { m = new Map(); memo.set(run, m); } if (!m.has(i)) m.set(i, run.readout?.(i)); return m.get(i); };
const stateOf = (run: StudyRun, i: number) => val(readout(run, i), "State");
const rails = (run: StudyRun, i: number) => {
  const v = val(readout(run, i), "Range rails");
  const m = v.split(" – ").map((x) => Number(x.replace(/,/g, "")));
  return m.length === 2 && m.every((x) => x > 0) ? { lo: m[0], hi: m[1] } : null;
};
const atr = (s: Session, i: number) => {
  let a = 0, k = 0;
  for (let j = Math.max(1, i - 19); j <= i; j++, k++) a += Math.max(s.h[j] - s.l[j], Math.abs(s.h[j] - s.c[j - 1]), Math.abs(s.l[j] - s.c[j - 1]));
  return a / Math.max(1, k);
};
const isStart = (e: StudyEvent) => /^TREND (UP|DOWN) STARTED$/.test(e.title);
const isEndT = (e: StudyEvent) => /^TREND (UP|DOWN) ENDED$/.test(e.title);
const isResume = (e: StudyEvent) => /^RESUME (LONG|SHORT)( · PRIME)?$/.test(e.title);
const isMinor = (e: StudyEvent) => /^RESUME (LONG|SHORT) · MINOR$/.test(e.title);
const isLife = (e: StudyEvent) => /^RESUME (LONG|SHORT) · (NEW HIGH|NEW LOW|FAILED|TREND LOST|EXPIRED)$/.test(e.title);

/** the tool's own sentence, without its clock times */
function moment(e: StudyEvent, title = e.title): Chapter {
  let text = e.text.replace(/^\d{1,2}:\d{2} — /, "").replace(/the \d{1,2}:\d{2} resume/, "the resume");
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (isResume(e)) {
    const up = e.title.includes("LONG"), prime = e.title.endsWith("PRIME");
    const hold = (e.text.match(/HOLD ([0-9,]+\.[0-9]{2})/) ?? [])[1];
    text = `The pullback is over: SWING crossed back through 50 and this close held ${up ? "at or above" : "at or below"} the one before. ${prime ? "PRIME: the trend reads one sigma or better and the leg reached two sigma." : "STANDARD: the trend reads one sigma or better."} HOLD ${hold}, the pullback's ${up ? "low" : "high"}.`;
  }
  text = text.replace(" The trend is latched on until the reading crosses back through 50.", " The trend stays on until the reading crosses back through 50.");
  return { i: e.i, title, text, tone: e.tone, price: e.price === undefined ? undefined : Math.round(e.price * 4) / 4 };
}

/** how cleanly price left the HOLD after a resume, and what the move did */
function resumeQuality(s: Session, res: StudyEvent, to: number, dir: 1 | -1) {
  const hold = res.price!;
  let room = Infinity, best = -Infinity;
  for (let i = res.i + 1; i <= to; i++) {
    room = Math.min(room, dir > 0 ? s.l[i] - hold : hold - s.h[i]);
    best = Math.max(best, dir * ((dir > 0 ? s.h[i] : s.l[i]) - s.c[res.i]));
  }
  return { room, best };
}

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

/** drop moments closer than 8 bars to a more important one (lower rank = keep) */
function spaced(list: { c: Chapter; rank: number }[]): Chapter[] {
  const keep: { c: Chapter; rank: number }[] = [];
  for (const x of [...list].sort((a, b) => a.rank - b.rank)) if (keep.every((k) => Math.abs(k.c.i - x.c.i) >= 8)) keep.push(x);
  return keep.map((k) => k.c).sort((a, b) => a.i - b.i);
}

/** the TREND / SWING measurement as the study takes it (close-to-close, EMA 50 / 10), at bar `last` */
function meas(s: Session, last: number) {
  let mf = 0, vf = 0, ms = 0, vs = 0;
  for (let b = 1; b <= last; b++) {
    const d = s.c[b] - s.c[b - 1], dd = d * d;
    if (b <= 10) { mf += (d - mf) / b; vf += (dd - vf) / b; } else { const a = 2 / 11; mf += a * (d - mf); vf += a * (dd - vf); }
    if (b <= 50) { ms += (d - ms) / b; vs += (dd - vs) / b; } else { const a = 2 / 51; ms += a * (d - ms); vs += a * (dd - vs); }
  }
  return { ms, vs, zs: vs > 0 ? (Math.sqrt(50) * ms) / Math.sqrt(vs) : 0 };
}
/** TREND z after one more close `d` points from the last */
const zNext = (m: { ms: number; vs: number }, d: number) => {
  const a = 2 / 51, ms = m.ms + a * (d - m.ms), vs = m.vs + a * (d * d - m.vs);
  return vs > 0 ? (Math.sqrt(50) * ms) / Math.sqrt(vs) : 0;
};
const evFrom = (look: Look) => look.run.events.filter((e) => e.i >= look.from);
const holdOf = (e: StudyEvent) => Number(((e.text.match(/HOLD ([0-9,]+\.[0-9]{2})/) ?? [])[1] ?? "NaN").replace(/,/g, ""));

// ------------------------------------------------------------------ the judges
/** everything on stage must be one of these, in a trend on `side` */
function clean(ev: StudyEvent[], up: boolean): string | null {
  for (const e of ev) {
    if (isMinor(e)) return "a MINOR resume";
    if (isResume(e) && e.title.includes(up ? "SHORT" : "LONG")) return "a resume against the trend";
    if (isLife(e) && e.title !== `RESUME ${up ? "LONG · NEW HIGH" : "SHORT · NEW LOW"}`) return `a resume ended ${e.title.split("· ")[1]}`;
    if (isStart(e) && !e.title.includes(up ? "UP" : "DOWN")) return "a trend against the story";
  }
  return null;
}

/** every reported resume made its new extreme, and price never came near its HOLD */
function resumesClean(s: Session, ev: StudyEvent[], d: 1 | -1, end: number) {
  const res = ev.filter(isResume), lives = ev.filter(isLife);
  if (lives.length !== res.length) return { why: "a resume still live at the end" };
  for (let j = 0; j < res.length; j++) if (!(lives[j].i > res[j].i && (j + 1 >= res.length || lives[j].i < res[j + 1].i))) return { why: "resume order" };
  const A = atr(s, res[0]?.i ?? end);
  const q = res.map((r, j) => resumeQuality(s, r, j + 1 < res.length ? res[j + 1].i : end, d));
  if (q.some((x) => x.room < 0.6 * A)) return { why: "price came back toward a HOLD" };
  return { res, lives, q, A };
}

function judgeTrend(run: StudyRun, s: Session, side: 1 | -1): Judged | null {
  const from = s.replayFrom, end = s.n - 1;
  if (/^PULLBACK/.test(stateOf(run, end))) return no("ends on a fresh pullback");
  if (!/^RANGING/.test(stateOf(run, from))) return no("a trend already on at the first bar");
  const ev = shown(run, s);
  const up = side > 0;
  const bad = clean(ev, up);
  if (bad) return no(bad);
  const starts = ev.filter(isStart);
  if (starts.length !== 1) return no("not exactly one trend start");
  if (ev.some(isEndT)) return no("the trend ended");
  const st = starts[0];
  if (st.i - from < 12) return no("trend starts too close to the first bar");
  const rc = resumesClean(s, ev, side, end);
  if (!rc.res) return no(rc.why!);
  const { res, lives, q, A } = rc;
  if (res.length < 2) return no("fewer than two resumes");
  if (res.length > 3) return no("more than three resumes");
  if (res[0].i < st.i) return no("resume before the start");
  // the start is a signal too: nothing after it trades back under where it latched
  for (let i = st.i + 1; i <= end; i++) if (side * ((up ? s.l[i] : s.h[i]) - s.c[st.i]) < -0.5 * A) return no("price traded back under the trend start");
  const lastNew = lives[lives.length - 1];
  if (end - lastNew.i < 5) return no("window ends on the new extreme");
  if (end - lastNew.i > 26) return no("window runs on long after the last new extreme");
  const ext = up ? Math.max(...Array.from(s.h.subarray(st.i, end + 1))) : Math.min(...Array.from(s.l.subarray(st.i, end + 1)));
  const move = side * (ext - s.c[st.i]);
  const follow = side * (s.c[end] - s.c[st.i]);
  if (follow < 0.85 * move) return no("window end gave back the move");

  const list: { c: Chapter; rank: number }[] = [
    { c: moment(st), rank: 1 },
    ...res.map((r, j) => ({ c: moment(r), rank: j === 0 ? 0 : 2 })),
    ...lives.map((e, j) => ({ c: moment(e), rank: j === 0 ? 3 : 4 })),
  ];
  res.forEach((r, j) => {
    const lo = j ? res[j - 1].i + 1 : st.i + 1;
    let k = r.i - 1;
    while (k > lo && stateOf(run, k).startsWith("PULLBACK")) k--;
    const pb = k + 1;
    if (pb >= r.i || !stateOf(run, pb).startsWith("PULLBACK")) return;
    const tr = val(readout(run, pb), "Trend").split(" · ")[0], sw = val(readout(run, pb), "Swing").split(" · ")[0];
    list.push({ c: { i: pb, title: `PULLBACK ${up ? "▲" : "▼"}`, tone: "neutral", price: s.c[pb],
      text: `SWING (10 bars) turns against the trend, ${Math.round(Number(sw))} on the 0–100 scale, and the pocket starts to fill. TREND (50 bars) still reads ${Math.round(Number(tr))}, so the trend stays on.` }, rank: 5 + j });
  });
  for (let k = st.i + 1, n = 0; k <= lastNew.i && n < 1; k++) {
    if (!stateOf(run, k).startsWith("STRONG") || stateOf(run, k - 1).startsWith("STRONG")) continue;
    const [tv, tz] = val(readout(run, k), "Trend").split(" · ");
    list.push({ c: { i: k, title: `STRONG ${up ? "▲" : "▼"}`, tone: up ? "strongBull" : "strongBear", price: s.c[k],
      text: `TREND (50 bars) reads ${tv} (${tz}), past two sigma: the state turns STRONG and the TREND line takes the strong colour. A resume from this leg can grade PRIME.` }, rank: 7 + n });
    n++;
  }
  const chapters = spaced(list).slice(0, 6);
  if (chapters.length < 3) return no("fewer than three moments");
  if (!chapters.some((c) => c.i === res[0].i) || !chapters.some((c) => c.i === res[1].i)) return no("a resume crowded out of the moments");
  for (const c of chapters) if (c.text.length > 240) throw new Error(`moment too long (${c.text.length}): ${c.text}`);
  const prime = res.filter((r) => r.title.endsWith("PRIME")).length;
  const score = 6 * Math.min(move / A, 14) + 8 * Math.min(...q.map((x) => Math.min(x.room / A, 4))) + 12 * prime + 10 * Math.min(res.length, 2)
    + 10 * chapters.length + 10 * (follow / move);
  return { score, chapters, note: `${st.title} · ${res.map((r) => r.title).join(", ")} · move ${move.toFixed(2)} (${(move / A).toFixed(1)} ATR) · rooms ${q.map((x) => (x.room / A).toFixed(1)).join("/")} ATR` };
}

function judgeRange(run: StudyRun, s: Session, side: 1 | -1): Judged | null {
  const from = s.replayFrom, end = s.n - 1;
  if (/^PULLBACK/.test(stateOf(run, end))) return no("ends on a fresh pullback");
  const ev = shown(run, s);
  const up = side > 0;
  const bad = clean(ev, up);
  if (bad) return no(bad);
  const ends = ev.filter(isEndT), starts = ev.filter(isStart);
  if (ends.length !== 1 || starts.length !== 1) return no("not one trend end then one start");
  const en = ends[0], st = starts[0];
  if (st.i < en.i) return no("start before the end");
  if (!en.title.includes(up ? "DOWN" : "UP") && !en.title.includes(up ? "UP" : "DOWN")) return no("end side");
  if (en.i - from < 10) return no("range starts too close to the first bar");
  if (ev.some((e) => (isResume(e) || isLife(e)) && e.i < st.i)) return no("a shelf before the new trend");
  // the rails: drawn from the trend end, never moved, and still the same on the bar before the breakout
  const r0 = rails(run, en.i);
  if (!r0) return no("rails not drawn");
  for (let k = en.i + 1; k < st.i; k++) { const r = rails(run, k); if (!r || r.lo !== r0.lo || r.hi !== r0.hi) return no("a rail moved"); }
  if (st.i - en.i < 24) return no("range too short to read");
  if (st.i - en.i > 70) return no("range too long");
  const A = atr(s, st.i), width = r0.hi - r0.lo;
  if (width < 1.6 * A || width > 10 * A) return no("range width off");
  // price works the rail it will break: at least two bars come to it and turn back inside
  let tags = 0;
  for (let k = en.i; k < st.i; k++) if (up ? s.h[k] >= r0.hi - 0.6 * A : s.l[k] <= r0.lo + 0.6 * A) tags++;
  if (tags < 2) return no("price did not work the range");
  const tHi = up ? tags : 0, tLo = up ? 0 : tags;
  // the break: the latch bar leaves the range, and price never closes back inside it
  const edge = up ? r0.hi : r0.lo;
  if (side * (s.c[st.i] - edge) <= 0) return no("trend latched inside the range");
  for (let k = st.i; k <= end; k++) if (side * (s.c[k] - edge) <= 0 || (k > st.i && side * ((up ? s.l[k] : s.h[k]) - edge) < -0.25 * A)) return no("price back into the range");
  const rc = resumesClean(s, ev, side, end);
  if (!rc.res) return no(rc.why!);
  const { res, lives, q } = rc;
  if (res.length < 1 || res.length > 2) return no("not one or two resumes");
  const lastNew = lives[lives.length - 1];
  if (end - lastNew.i < 5) return no("window ends on the new extreme");
  if (end - lastNew.i > 26) return no("window runs on long after the new extreme");
  const move = side * (s.c[end] - edge);
  if (move < 4 * A) return no("little follow-through beyond the range");

  const fmt = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const list: { c: Chapter; rank: number }[] = [
    { c: moment(en, "RANGING"), rank: 1 },
    { c: { ...moment(st), text: `The bar that closes ${up ? "above RANGE HIGH" : "below RANGE LOW"} ${fmt(edge)} takes the TREND reading (50 bars) past one sigma ${up ? "up" : "down"}: it reads ${(st.text.match(/it reads (\d+)/) ?? [])[1]} on the 0–100 scale. The rails come off, and the trend stays on until the reading crosses back through 50.` }, rank: 2 },
    ...res.map((r, j) => ({ c: moment(r), rank: j === 0 ? 0 : 5 })),
    ...lives.map((e, j) => ({ c: moment(e), rank: j === 0 ? 3 : 6 })),
  ];
  const tagAt = (() => {
    for (let k = en.i + 8; k < st.i - 8; k++) if (up ? s.h[k] >= r0.hi - 0.6 * A : s.l[k] <= r0.lo + 0.6 * A) return k;
    return -1;
  })();
  if (tagAt > 0) {
    const atHi = up;
    list.push({ c: { i: tagAt, title: "RANGING", tone: "neutral", price: atHi ? r0.hi : r0.lo,
      text: `Price works inside the RANGE rails, ${fmt(r0.lo)} to ${fmt(r0.hi)}, comes back to the range ${atHi ? "high" : "low"} and turns inside again. No trend is on, so no resume can be stamped.` }, rank: 4 });
  }
  const chapters = spaced(list).slice(0, 6);
  for (const c of chapters) if (c.text.length > 240) c.text = c.text.slice(0, 237) + "…";
  if (chapters.length < 4) return no("fewer than four moments");
  if (!chapters.some((c) => c.i === res[0].i)) return no("the resume crowded out of the moments");
  const score = 8 * Math.min(move / A, 10) + 6 * Math.min(...q.map((x) => Math.min(x.room / A, 4))) + 3 * Math.min(tHi + tLo, 8)
    + (res[0].title.endsWith("PRIME") ? 10 : 0) + 4 * chapters.length + (res.length === 2 ? 6 : 0);
  return { score, chapters, note: `${en.title} -> ${st.title} · rails ${r0.lo}-${r0.hi} (${(width / A).toFixed(1)} ATR) · touches ${tHi}/${tLo} · ${res.map((r) => r.title).join(", ")} · move ${(move / A).toFixed(1)} ATR` };
}

// ------------------------------------------------------------------ the scenarios
const rnd = (seed: number) => (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
/** quiet two-way trade: legs that alternate around a level, so the 50-bar reading sits near 50 */
function chop(c0: number, n: number, amp: number, r: (k: number) => number, k0: number): Beat[] {
  const out: Beat[] = [];
  for (let k = 0; k < n; k++) out.push({ to: c0 + (k % 2 === 0 ? 1 : -1) * amp * (0.5 + 0.6 * r(k0 + k)), bars: 6 + Math.round(6 * r(k0 + 50 + k)), vol: 0.5, size: 0.75 });
  return out;
}

/**
 * A pullback in the trend and the run on to a new extreme, aimed by the tool:
 * the pullback (and the recovery that closes it) is written first; once the
 * RESUME is stamped the run goes past the leg's extreme with every bar kept
 * well clear of the HOLD.
 */
function pullbackAndRun(dir: 1 | -1, r: (k: number) => number, k0: number, legFrom: () => number, last: boolean): Stage[] {
  let mark = 0;
  return [
    (look: Look) => {
      const top = look.last, depth = Math.abs(top - legFrom()) * (0.27 + 0.1 * r(k0));
      mark = look.from + look.at;
      const nb = 4 + Math.round(2 * r(k0 + 1)), nr = 5 + Math.round(2 * r(k0 + 2));
      return { beats: [
        { to: top - dir * depth, bars: nb, vol: 0.45, size: 0.8 },
        { to: top - dir * depth * (0.1 + 0.15 * r(k0 + 3)), bars: nr, vol: 0.45, size: 0.85 },
      ] };
    },
    (look: Look) => {
      const rs = evFrom(look).filter((e) => e.i >= mark && isResume(e));
      if (rs.length !== 1) return no("stage: no resume from the pullback");
      if (evFrom(look).some((e) => e.i >= mark && (isMinor(e) || (isLife(e) && !/NEW (HIGH|LOW)$/.test(e.title))))) return no("stage: minor or failed");
      const hold = holdOf(rs[0]);
      const ext = dir > 0 ? Math.max(...Array.from(look.s.h.subarray(look.from, look.from + look.at))) : Math.min(...Array.from(look.s.l.subarray(look.from, look.from + look.at)));
      const A = atr(look.s, look.from + look.at - 1);
      const go = ext + dir * (22 + 18 * r(k0 + 4));
      const beats: Beat[] = [
        { to: go, bars: 9 + Math.round(4 * r(k0 + 5)), vol: 0.5, size: 1.0, shape: last ? "decel" : "linear" },
      ];
      if (last) beats.push({ to: go + dir * (3 + 5 * r(k0 + 6)), bars: 6 + Math.round(4 * r(k0 + 7)), vol: 0.4, size: 0.75 });
      const walls: Wall[] = [{ from: look.at, to: look.at + 40, level: hold + dir * 1.2 * A, side: dir > 0 ? "above" : "below", probe: 0 }];
      return { beats, walls };
    },
  ];
}

/** a: out of the quiet stretch, an impulse latches the trend on; two pullbacks, two resumes, two new extremes */
function trendScenario(seed: number, dir: 1 | -1): Script {
  const S = 26420 + (seed % 9) * 13;
  const r = rnd(seed);
  const p = (pts: number) => S + dir * pts;
  let legStart = S, leg2 = S;
  return {
    seed, start: S, clock: 11 * 60 + 31 + Math.round(20 * r(1)), prelude: [{ to: S, bars: 40, vol: 0.7 }, ...chop(S, 20, 14, r, 200), { to: S, bars: 6, vol: 0.5, size: 0.7 }],
    beats: [
      ...chop(S, 2 + Math.round(r(2)), 9, r, 10),
      { to: p(-4 - 4 * r(3)), bars: 4, vol: 0.4, size: 0.7 },
      (look: Look) => { legStart = look.last; return { beats: [
        { to: p(30 + 10 * r(4)), bars: 7 + Math.round(2 * r(5)), vol: 0.4, size: 1.2, shape: "accel" },
        { to: p(58 + 16 * r(6)), bars: 10 + Math.round(3 * r(7)), vol: 0.5, size: 1.0 },
      ] }; },
      ...pullbackAndRun(dir, r, 20, () => legStart, false),
      (look: Look) => {
        // the second pullback is measured from the first resume's HOLD
        const h = evFrom(look).filter(isResume).map(holdOf).pop();
        leg2 = h ?? look.last - dir * 40;
        return { beats: [] };
      },
      ...pullbackAndRun(dir, r, 40, () => leg2, true),
    ],
  };
}

/**
 * b: the end of a trend leg (latched in the warm-up), a drop that turns the
 * reading off, a range: the tool draws RANGE HIGH at the old leg's extreme and
 * RANGE LOW at the drop's, price holds and works just inside the near rail
 * (steered by the tool's own TREND reading so no trend latches inside the range
 * and neither rail moves), and the breakout bar through that rail is sized so
 * the new trend — the other way — latches on it; then one pullback and resume.
 * `dir` is the NEW trend's direction; the old trend ran the other way.
 */
function rangeScenario(seed: number, dir: 1 | -1): Script {
  const od = -dir as 1 | -1;
  const S = 26420 + (seed % 9) * 13;
  const r = rnd(seed);
  let rail = { lo: 0, hi: 0 }, legStart = 0;
  const edgeOf = () => (dir > 0 ? rail.hi : rail.lo);
  const stepOff: Stage = (look: Look) => {
    // the drop off the old leg's extreme, a bar or two at a time, until the tool calls the trend off
    if (evFrom(look).some(isEndT)) return { beats: [] };
    return { beats: [{ to: look.last + dir * (2 + 2 * r(look.at)), bars: 1, vol: 0.2, size: 0.85 }] };
  };
  const inside = (from: number, n: number): Wall[] => [
    { from, to: from + n - 1, level: rail.hi, side: "below", probe: -1 },
    { from, to: from + n - 1, level: rail.lo, side: "above", probe: -1 },
  ];
  return {
    seed, start: S - od * 100, clock: 11 * 60 + 31 + Math.round(20 * r(1)),
    prelude: [{ to: S - od * 100, bars: 40, vol: 0.7 }, ...chop(S - od * 100, 18, 14, r, 200),
      { to: S - od * 78, bars: 16, vol: 0.8, size: 0.85 }, { to: S - od * 84, bars: 6, vol: 0.6, size: 0.8 },
      { to: S - od * 56, bars: 18, vol: 0.8, size: 0.85 }, { to: S - od * 61, bars: 5, vol: 0.6, size: 0.8 },
      { to: S - od * 50, bars: 6, vol: 0.6, size: 0.85 }],
    beats: [
      // the last stretch of the old trend leg, its extreme, and the drop that turns the reading off
      { to: S - od * (22 + 6 * r(2)), bars: 12 + Math.round(3 * r(5)), vol: 0.5, size: 0.85 },
      { to: S, bars: 13 + Math.round(4 * r(3)), vol: 0.5, size: 0.85, shape: "decel" },
      { to: S + dir * (8 + 4 * r(4)), bars: 3, vol: 0.25, size: 0.85 },
      ...Array.from({ length: 22 }, () => stepOff),
      (look: Look) => {
        if (!evFrom(look).some(isEndT)) return no("stage: the trend did not end");
        const rr = rails(look.run, look.from + look.at - 1);
        if (!rr) return no("stage: no rails");
        rail = rr;
        // price holds just inside the near rail: a bounce, a second test of the rail, a bounce
        const at = look.at, w = rr.hi - rr.lo, edge = edgeOf();
        const n1 = 5 + Math.round(3 * r(10)), n2 = 5 + Math.round(3 * r(11)), n3 = 4 + Math.round(2 * r(12));
        const beats: Beat[] = [
          { to: edge - dir * (0.32 + 0.1 * r(13)) * w, bars: n1, vol: 0.55, size: 0.8 },
          { to: edge - dir * (1.5 + 1.5 * r(14)), bars: n2, vol: 0.55, size: 0.8 },
          { to: edge - dir * (0.2 + 0.1 * r(15)) * w, bars: n3, vol: 0.5, size: 0.8 },
        ];
        const touches: Touch[] = [{ i: at + n1 + n2 - 1, level: edge - dir * 0.75, from: dir > 0 ? "below" : "above", depth: [0, 2] }];
        return { beats, walls: inside(at, n1 + n2 + n3), touches };
      },
      // then it leans on the rail, three bars at a time, steered by the tool's TREND reading so it sits just
      // inside one sigma — no trend latches inside the range, and neither rail moves
      ...Array.from({ length: 4 }, (_, j): Stage => (look: Look) => {
        if (evFrom(look).some(isStart)) return no("stage: the trend latched inside the range");
        const z = dir * meas(look.s, look.from + look.at - 1).zs, edge = edgeOf();
        const room = dir * (edge - look.last) - 3;            // how far price may still lean toward the rail
        const step = z > 0.7 ? -(2 + 2 * r(60 + j)) : Math.max(-3, Math.min(room, 3 + 4 * r(80 + j)));
        return { beats: [{ to: look.last + dir * step, bars: 3, vol: 0.5, size: 0.8 }], walls: inside(look.at, 3) };
      }),
      (look: Look) => {
        // the breakout bar: sized from the tool's own TREND measurement so this one bar takes it past one sigma
        if (evFrom(look).some(isStart)) return no("stage: the trend latched inside the range");
        const k = look.from + look.at - 1, m = meas(look.s, k);
        const edge = edgeOf();
        let d = Math.max(dir * (edge - look.last) + 4, 6);
        while (d < 40 && zNext(m, dir * d) * dir < 1.08) d += 0.5;
        if (d >= 40) return no("stage: no breakout bar big enough");
        legStart = edge;
        const beats: Beat[] = [
          { to: look.last + dir * d, bars: 1, vol: 0.02, size: 1.6 },
          { to: look.last + dir * (d + 26 + 14 * r(32)), bars: 9 + Math.round(3 * r(33)), vol: 0.45, size: 1.0 },
        ];
        // the broken rail stays behind once price has left
        const walls: Wall[] = [{ from: look.at + 1, to: look.at + 80, level: edge + dir * 2, side: dir > 0 ? "above" : "below", probe: 0 }];
        return { beats, walls };
      },
      ...pullbackAndRun(dir, r, 60, () => legStart, true),
    ],
  };
}

const all: ExampleDef[] = [
  {
    id: "a",
    tab: "Trend, pullback, resume",
    title: "A trend latches on, and each pullback's RESUME carries to a new extreme",
    premise: "Watch the TREND line reach one sigma and latch the trend on, the pocket fill while price pulls back, then the RESUME stamped on the bar that confirms the pullback is over: a shelf at its HOLD with the T, and the leg going on past its extreme.",
    design: (seed) => trendScenario(seed, 1),
    seeds: 250,
    judge: (run, s) => judgeTrend(run, s, 1),
  },
  {
    id: "b",
    tab: "Range, then trend",
    title: "The trend ends into a range, and the breakout starts the next trend",
    premise: "When the trend ends the tool says RANGING and draws the RANGE HIGH and RANGE LOW rails. Watch price work inside them, the bar that breaks out latch a new trend on, and its RESUME carry it to a new extreme.",
    design: (seed) => rangeScenario(seed, -1),
    seeds: 250,
    judge: (run, s) => judgeRange(run, s, -1),
  },
];

export const examples: ExampleDef[] = all;
