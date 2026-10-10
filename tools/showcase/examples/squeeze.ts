import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Look, Script, Stage, Wall } from "../design";
import { shown } from "../build";
import type { ReadItem, Session, StudyEvent, StudyRun } from "../../../components/engine/types";

/**
 * DS Squeeze — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * Two faces of the tool:
 *  a  THE FIRE — a move settles into a tight base, compression drops into the
 *     squeeze channel and latches, and the release prints one graded fire that
 *     the tape follows straight through. The run ends as the move rests at its
 *     highs; nothing gives back.
 *  b  REVERSION — no squeeze on, ADX under 30: a rally slams the upper band with
 *     RSI stretched and closes back inside, one REVERSION SHORT sets up with the
 *     dashed MEAN rail, and price walks back to the mean well short of the stop.
 *
 * The pattern is written (tools/showcase/design.ts); every candle is a real
 * recorded one-minute NQ bar. A stage reads the tool's own squeeze count before
 * the release is written, so the release comes only after the squeeze has run
 * its 6-bar minimum. A quiet hidden warm-up feeds the waves, ADX and the frame
 * (never drawn, never narrated).
 *
 * ZERO FLAWS on stage (Tom, 2026-10-09): exactly the story's events and nothing
 * else — no second squeeze, no release without a fire, no counter mark, no
 * reversion against a fire, no stop, no giveback after the signal.
 */

// ------------------------------------------------------------------ reading the study's output
const val = (items: ReadItem[] | undefined, label: string) => String(items?.find((r) => r.label === label)?.value ?? "");
const memo = new WeakMap<StudyRun, { ro: Map<number, ReadItem[] | undefined>; st: Map<number, ReadItem[] | undefined> }>();
const cache = (run: StudyRun) => { let m = memo.get(run); if (!m) { m = { ro: new Map(), st: new Map() }; memo.set(run, m); } return m; };
const readout = (run: StudyRun, i: number) => { const m = cache(run).ro; if (!m.has(i)) m.set(i, run.readout?.(i)); return m.get(i); };
const status = (run: StudyRun, i: number) => { const m = cache(run).st; if (!m.has(i)) m.set(i, run.status?.(i, null)); return m.get(i); };
/** the tool's headline at bar k as the live edge shows it (status line) */
const head = (run: StudyRun, k: number) => String(status(run, k)?.[0]?.value ?? "");
/** the state word at bar i (readout, as a hover shows it) */
const state = (run: StudyRun, i: number) => val(readout(run, i), "State");
const comp = (run: StudyRun, i: number) => parseFloat(val(readout(run, i), "Compression"));
const rsiOf = (run: StudyRun, i: number) => val(readout(run, i), "RSI");
const adxOf = (run: StudyRun, i: number) => val(readout(run, i), "ADX");
const momOf = (run: StudyRun, i: number) => Number(val(readout(run, i), "Momentum"));
const num = (re: RegExp, t: string) => { const m = t.match(re); return m ? m[1] : "?"; };
const ch = (e: StudyEvent, text: string, title = e.title): Chapter => ({ i: e.i, title, text, tone: e.tone, price: e.price });
const isFire = (e: StudyEvent) => e.title.startsWith("FIRED");
const isRev = (e: StudyEvent) => e.title.startsWith("REVERSION");
const isSqz = (e: StudyEvent) => e.title === "SQUEEZE" || e.title === "SQUEEZE DEEP";
const isLife = (e: StudyEvent) => /^(HIT THE MEAN|STOPPED|CANCELED|EXPIRED)$/.test(e.title);
/** mean true range of the 20 bars up to i (the scale a move is judged on) */
const atr = (s: Session, i: number) => {
  let a = 0, k = 0;
  for (let j = Math.max(1, i - 19); j <= i; j++, k++) a += Math.max(s.h[j] - s.l[j], Math.abs(s.h[j] - s.c[j - 1]), Math.abs(s.l[j] - s.c[j - 1]));
  return a / Math.max(1, k);
};

export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };

// ------------------------------------------------------------------ a: the fire
function judgeFire(run: StudyRun, s: Session, side: 1 | -1): Judged | null {
  const from = s.replayFrom, end = s.n - 1;
  if (/^(FIRED|REVERSION|SQUEEZE|EARLY)/.test(head(run, from))) return no("warm-up state on the first bar");
  const ev = shown(run, s);
  const sqs = ev.filter(isSqz), fires = ev.filter(isFire);
  if (sqs.length !== 1) return no("not exactly one squeeze");
  if (fires.length !== 1) return no("not exactly one fire");
  const sq = sqs[0], f = fires[0];
  if (!/· (PRIME|GOOD)$/.test(f.title)) return no("fire not PRIME / GOOD");
  const d = f.title.includes("LONG") ? 1 : -1;
  if (d !== side) return no("fire on the other side");
  if (f.i < sq.i) return no("fire before the squeeze");
  if (sq.i - from < 15) return no("squeeze starts too close to the first bar");
  for (let k = sq.i; k < f.i; k++) if (!/^(SQUEEZE|EARLY)/.test(state(run, k))) return no("squeeze broke before the fire");
  const earlies = ev.filter((e) => e.title.startsWith("EARLY"));
  if (earlies.some((e) => e.title !== `EARLY ${d > 0 ? "LONG" : "SHORT"}` || e.i <= sq.i || e.i >= f.i)) return no("an early mark against the fire");
  const early = earlies[0];
  if (ev.some((e) => isRev(e) || isLife(e))) return no("a reversion setup on stage");
  const after = ev.filter((e) => e.i > f.i);
  const runEnd = after.find((e) => /the (long|short) run from the/.test(e.text));
  const known = new Set([sq, f, early, runEnd].filter(Boolean));
  const others = ev.filter((e) => !known.has(e));
  if (others.length) return no(`other narration (${others[0].title})`);
  if (end - f.i < 18) return no("too little after the fire");
  // the early mark is a signal too: nothing after it trades meaningfully against it
  if (early) {
    const Ae = atr(s, early.i);
    for (let i = early.i + 1; i <= end; i++) if (d * ((d > 0 ? s.l[i] : s.h[i]) - s.c[early.i]) < -0.6 * Ae) return no("price traded against the early mark");
  }
  // follow-through from the fire bar's close: no heat, no giveback
  const A = atr(s, f.i), c0 = s.c[f.i];
  let mfe = 0, mfeAt = f.i, adverse = 0;
  for (let i = f.i + 1; i <= end; i++) {
    const fav = d * ((d > 0 ? s.h[i] : s.l[i]) - c0);
    if (fav > mfe) { mfe = fav; mfeAt = i; }
    adverse = Math.max(adverse, d * (c0 - (d > 0 ? s.l[i] : s.h[i])));
  }
  if (adverse > 0.5 * A) return no("price traded back against the fire");
  for (let i = f.i + 1; i <= end; i++) if (d * (s.c[i] - s.c[i - 1]) < -1.6 * A) return no("a hard bar against the move");
  if (mfe < 6 * A) return no("move after the fire under 6 ATR");
  const follow = d * (s.c[end] - c0);
  if (follow < 0.8 * mfe) return no("the move gave back by the window end");
  const inRun = d * (s.c[runEnd ? runEnd.i : end] - c0);
  if (inRun < 0.75 * mfe) return no("most of the move came after the run had ended");
  if (runEnd && end - runEnd.i < 4) return no("run end on the last bars");

  // ---- moments
  const chapters: Chapter[] = [];
  const fit = (i: number) => chapters.every((c) => Math.abs(c.i - i) >= 8);
  let coil = -1;
  for (let k = sq.i - 1; k >= from && state(run, k).startsWith("COILING"); k--) coil = k;
  chapters.push(ch(sq, `Compression fell to ${num(/fell to ([\d.]+)/, sq.text)} ATR, inside the 1.5 ATR squeeze channel${sq.title === "SQUEEZE DEEP" ? " and the 1.0 deep channel" : ""}: the squeeze is on, and the coil appears on the centerline. A release can fire only after 6 squeeze bars.`));
  if (coil >= from + 4 && sq.i - coil >= 8 && fit(coil)) chapters.push({ i: coil, title: "COILING", tone: "neutral", price: s.c[coil],
    text: `Compression ${comp(run, coil).toFixed(2)} ATR, inside the 2.0 ATR outer channel: the range is tightening and the ribbon reads COILING. No squeeze yet.` });
  let deep = -1;
  for (let k = sq.i + 1; k < f.i; k++) if (state(run, k).startsWith("SQUEEZE DEEP")) { deep = k; break; }
  if (deep > 0 && fit(deep) && f.i - deep >= 8) chapters.push({ i: deep, title: "SQUEEZE DEEP", tone: "gold", price: s.c[deep],
    text: `Compression ${comp(run, deep).toFixed(2)} ATR, inside the 1.0 ATR deep channel: the tightest tier, and the coil on the centerline is at its thickest.` });
  if (early && fit(early.i) && f.i - early.i >= 8) chapters.push(ch(early, `${num(/(\d+) bars into/, early.text)} bars into the squeeze the A wave hooks back ${d > 0 ? "up" : "down"} while the B and C waves hold ${d > 0 ? "above" : "below"} zero: the early entry, once per squeeze, on the ribbon before any fire.`));
  {
    const len = num(/the (\d+)-bar squeeze/, f.text), cp = num(/compression ([\d.]+) ATR/, f.text), mo = num(/momentum (-?\d+)/, f.text);
    const grade = f.title.split("· ")[1];
    const adx = num(/ADX (\d+)/, f.text), quiet = /was quiet/.test(f.text), cOn = /C wave is on its side/.test(f.text), bOn = /B wave is on its side/.test(f.text);
    const why = [quiet ? `ADX ${adx} quiet` : `ADX ${adx} not quiet`, cOn ? "C wave on its side" : "C wave flat", bOn ? "B wave on its side" : "B wave not on its side"].join(", ");
    chapters.push(ch(f, `The ${len}-bar squeeze releases: compression ${cp} ATR clears the 1.65 release line with momentum ${mo} growing ${d > 0 ? "up" : "down"}. ${grade} (${why}), so the chevron prints at the ${d > 0 ? "low" : "high"}.`));
  }
  let peak = -1;
  {
    const lim = (runEnd ? runEnd.i : end) - 8;
    for (let k = f.i + 8; k <= lim; k++) if (d * (momOf(run, k) - momOf(run, k - 1)) > 0 && (peak < 0 || d * s.c[k] > d * s.c[peak])) peak = k;
  }
  if (peak > 0 && fit(peak) && /^FIRED/.test(state(run, peak)) && d * (s.c[peak] - s.c[f.i]) >= 2 * A) chapters.push({ i: peak, title: state(run, peak).replace(/\s*[▲▼]$/, ""), tone: d > 0 ? "bull" : "bear", price: s.c[peak],
    text: `The run carries: ${Math.round(Math.abs(s.c[peak] - s.c[f.i]))} pts from the fire bar's close with momentum ${momOf(run, peak)} and still widening. The ribbon still reads FIRED.` });
  if (runEnd && fit(runEnd.i)) {
    const bars = num(/ended after (\d+) bars/, runEnd.text);
    const why = runEnd.text.split(": ").slice(1).join(": ").replace(/\.$/, "");
    chapters.push(ch(runEnd, `The ${d > 0 ? "long" : "short"} run ends after ${bars} bars, ${Math.round(d * (s.c[runEnd.i] - c0))} pts from the fire bar's close: ${why}. The fire chevron stays where it printed.`));
  }
  chapters.sort((a, b) => a.i - b.i);
  if (chapters.length < 3) return no("fewer than three moments");
  for (const c of chapters) if (c.text.length > 240) throw new Error(`moment too long (${c.text.length}): ${c.text}`);

  const sqLen = Number(num(/the (\d+)-bar squeeze/, f.text));
  const score = 6 * Math.min(mfe / A, 12) - 30 * (adverse / A) + (/PRIME/.test(f.title) ? 40 : 0) + 6 * chapters.length
    + Math.min(sqLen, 16) + (runEnd ? 10 : 0) + (early ? 6 : 0) + 20 * (follow / mfe) + (deep > 0 ? 4 : 0);
  return { score, chapters, note: `${f.title} · squeeze ${sqLen} bars · mfe ${mfe.toFixed(2)} (${(mfe / A).toFixed(1)} ATR) · follow ${follow.toFixed(2)} · adverse ${adverse.toFixed(2)} · atr ${A.toFixed(2)}${early ? " · early" : ""}${runEnd ? " · run end" : ""}` };
}

// ------------------------------------------------------------------ b: reversion to the mean
function judgeReversion(run: StudyRun, s: Session, side: 1 | -1): Judged | null {
  const from = s.replayFrom, end = s.n - 1;
  if (/^(FIRED|REVERSION|SQUEEZE|EARLY)/.test(head(run, from))) return no("warm-up state on the first bar");
  const ev = shown(run, s);
  const revs = ev.filter(isRev);
  if (revs.length !== 1) return no("not exactly one reversion setup");
  const r = revs[0];
  const d = r.title.includes("LONG") ? 1 : -1;
  if (d !== side) return no("setup on the other side");
  const life = ev.filter(isLife);
  if (life.length !== 1 || life[0].title !== "HIT THE MEAN" || life[0].i <= r.i) return no("the setup did not hit the mean");
  const hit = life[0];
  const others = ev.filter((e) => e !== r && e !== hit);
  if (others.length) return no(`other narration (${others[0].title})`);
  if (r.i - from < 30) return no("setup too close to the first bar");
  if (hit.i - r.i < 8) return no("hit too soon to watch");
  if (hit.i - r.i > 30) return no("hit took too long");
  if (end - hit.i < 3 || end - hit.i > 10) return no("window end not near the hit");
  const target = Number(num(/Target the mean ([\d,]+\.\d+)/, r.text).replace(/,/g, ""));
  const stop = Number(num(/stop ([\d,]+\.\d+) \(1R\)/, r.text).replace(/,/g, ""));
  const hitMean = Number(num(/the mean ([\d,]+\.\d+)/, hit.text).replace(/,/g, ""));
  const c0 = s.c[r.i], risk = Math.abs(stop - c0), reward = d * (hitMean - c0);
  if (!(target > 0)) return no("unreadable target");
  const A = atr(s, r.i);
  if (reward < 1.0 * A) return no("the mean too close to be worth showing");
  // no heat: price never trades back beyond the setup bar's extreme, and stays far from the stop
  const extreme = d > 0 ? s.l[r.i] : s.h[r.i];
  let heat = 0;
  for (let i = r.i + 1; i <= end; i++) {
    heat = Math.max(heat, d * (c0 - (d > 0 ? s.l[i] : s.h[i])));
    if (d * ((d > 0 ? s.l[i] : s.h[i]) - extreme) < 0) return no("price back through the setup extreme");
  }
  if (heat > 0.3 * risk) return no("heat toward the stop");
  // after the hit, no bounce back toward the setup
  for (let i = hit.i + 1; i <= end; i++) if (d * (c0 + d * 0.5 * reward - s.c[i]) > 0) return no("price bounced back after the hit");

  // ---- moments
  const chapters: Chapter[] = [];
  const fit = (i: number) => chapters.every((c) => Math.abs(c.i - i) >= 8);
  const stretch = d > 0 ? "OVERSOLD" : "OVERBOUGHT";
  let st = -1;
  for (let k = r.i - 1; k >= Math.max(from, r.i - 25) && rsiOf(run, k).includes(stretch); k--) st = k;
  chapters.push(ch(r, (() => {
    const adx = num(/ADX (\d+)/, r.text), rs = num(/RSI (\d+)/, r.text), cl = num(/closed back inside at ([\d,]+\.\d+)/, r.text);
    return `No squeeze on and ADX ${adx}, under 30. RSI ${rs} as price reaches the ${d > 0 ? "lower" : "upper"} band, and the bar closes back inside at ${cl}: REVERSION ${d > 0 ? "LONG" : "SHORT"}. Target the mean ${num(/Target the mean ([\d,]+\.\d+)/, r.text)}, stop ${num(/stop ([\d,]+\.\d+) \(1R\)/, r.text)}.`;
  })()));
  if (st >= from + 4 && r.i - st >= 8) chapters.push({ i: st, title: stretch, tone: "neutral", price: s.c[st],
    text: `RSI ${rsiOf(run, st).replace(/\s*·.*$/, "")} reads ${stretch.toLowerCase()} as the ${d > 0 ? "drop" : "rally"} stretches toward the ${d > 0 ? "lower" : "upper"} band. ADX ${adxOf(run, st).replace(/\s*·.*$/, "")}; no setup until a bar slams the band and closes back inside.` });
  // the quiet range before, as the ribbon reads it
  {
    let q = -1;
    for (let k = from + 6; k <= r.i - 12; k++) if (/^(QUIET|COILING)/.test(state(run, k)) && fit(k)) { q = k; break; }
    if (q > 0) chapters.push({ i: q, title: state(run, q).replace(/\s*[▲▼]$/, ""), tone: "neutral", price: s.c[q],
      text: `No squeeze and ADX ${adxOf(run, q).replace(/\s*·.*$/, "")}: price swings around its mean, the setting where the reversion play looks for a stretch to the band.` });
  }
  for (let k = r.i + 4; k < hit.i - 4; k++) {
    const m = head(run, k).match(/([\d.]+)R to the mean/);
    if (m && fit(k) && hit.i - k >= 8) {
      chapters.push({ i: k, title: `REVERSION ${d > 0 ? "LONG" : "SHORT"}`, tone: d > 0 ? "bull" : "bear", price: s.c[k],
        text: `The setup is live: the dashed MEAN rail marks the target and the headline counts the distance, ${m[1]}R to the mean. The stop has not been touched.` });
      break;
    }
  }
  chapters.push(ch(hit, `Price reaches the mean ${num(/the mean ([\d,]+\.\d+)/, hit.text)}, ${Math.round(reward)} pts from the setup close (the rail follows the EMA), before the 1R stop: HIT THE MEAN, and the rail comes off.`));
  chapters.sort((a, b) => a.i - b.i);
  for (let j = 1; j < chapters.length; j++) if (chapters[j].i - chapters[j - 1].i < 8) return no("moments crowded");
  if (chapters.length < 3) return no("fewer than three moments");
  for (const c of chapters) if (c.text.length > 240) throw new Error(`moment too long (${c.text.length}): ${c.text}`);

  const score = 10 * Math.min(reward / A, 6) - 60 * (heat / risk) + 8 * chapters.length - 0.5 * Math.abs(hit.i - r.i - 16) + (st >= 0 ? 6 : 0);
  return { score, chapters, note: `${r.title} reward ${reward.toFixed(2)} (${(reward / A).toFixed(1)} ATR) risk ${risk.toFixed(2)} heat ${heat.toFixed(2)} bars ${hit.i - r.i}` };
}

// ------------------------------------------------------------------ the scenarios
const rnd = (seed: number) => (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
/** hidden warm-up: swings that drift `dir` over its last stretch (the B and C waves lean that way) */
const warmup = (S: number, dir: number, r: (k: number) => number): Beat[] => {
  // wide, quick swings: compression stays open, momentum keeps flipping, so no squeeze, run or setup is live at the stage
  const out: Beat[] = [{ to: S - dir * 40, bars: 40, vol: 0.8 }];
  for (let k = 0; k < 14; k++) {
    const up = k % 2 === 0;
    out.push({ to: S - dir * (up ? -(14 + 14 * r(60 + k)) : 22 + 14 * r(60 + k)), bars: 12 + Math.round(6 * r(80 + k)), vol: 0.6, size: 0.85 });
  }
  out.push({ to: S - dir * (68 + 12 * r(99)), bars: 16, vol: 0.5, size: 0.9 }, { to: S - dir * 26, bars: 13, vol: 0.5, size: 0.9 },
    { to: S - dir * 33, bars: 3, vol: 0.3, size: 0.8 }, { to: S, bars: 9, vol: 0.5, size: 0.9 });
  return out;
};

/**
 * THE FIRE. A lead-in swing, a tight base that coils into the squeeze, and — once
 * the tool's own squeeze count has passed the 6-bar minimum — the release: a
 * sharp breakout that runs on, then rests at its highs. Walls keep the base
 * tight and keep the run from trading back to the fire bar.
 */
function fireScenario(seed: number, dir: 1 | -1): Script {
  const S = 26420 + (seed % 9) * 13;
  const r = rnd(seed);
  const p = (pts: number) => S + dir * pts;
  const leadUp = 22 + 10 * r(1), leadBack = leadUp - (5 + 4 * r(2));
  const mid = p(leadBack + 2);          // the base sits around here
  const half = 7 + 3 * r(3);            // half the base's height
  // the back edge of the base: once the tool prints an EARLY mark, price never trades back under it by much
  let back = mid - dir * half;
  const early = (look: Look) => {
    const e = look.run.events.find((x) => x.i >= look.from && x.title.startsWith("EARLY"));
    if (e) { const lim = look.s.c[e.i] - dir * 0.3 * atr(look.s, e.i); back = dir > 0 ? Math.max(back, lim) : Math.min(back, lim); }
  };
  const boxWalls = (from: number, to: number): Wall[] => [
    { from, to, level: dir > 0 ? mid + half : back, side: "below", probe: 0 },
    { from, to, level: dir > 0 ? back : mid - half, side: "above", probe: 0 },
  ];
  // the base: small swings inside a tight box, written two or three bars at a time so the box can tighten
  const base: Stage[] = [];
  {
    let left = 24 + Math.round(6 * r(8)), k = 0, sgn = dir;
    while (left > 0) {
      const bars = Math.min(left, 4 + Math.round(3 * r(20 + k)));
      const goal = mid + sgn * half * (0.4 + 0.45 * r(30 + k));
      const h1 = Math.ceil(bars / 2), h2 = bars - h1;
      for (const [nb, frac] of [[h1, 0.6], [h2, 1]] as [number, number][]) {
        if (!nb) continue;
        base.push((look: Look) => {
          early(look);
          const inner = dir > 0 ? [Math.max(back, mid - half) + 1.5, mid + half - 1.5] : [mid - half + 1.5, Math.min(back, mid + half) - 1.5];
          const tgt = Math.max(inner[0], Math.min(inner[1], look.last + (goal - look.last) * frac));
          return { beats: [{ to: tgt, bars: nb, vol: 0.4, size: 0.62 }], walls: look.at >= 3 ? boxWalls(look.at, look.at + nb - 1) : [] };
        });
      }
      left -= bars; sgn = -sgn as 1 | -1; k++;
    }
  }
  return {
    seed, start: S, clock: 11 * 60 + 41 + Math.round(20 * r(4)), prelude: warmup(S, dir, r),
    beats: [
      { to: p(leadUp), bars: 9 + Math.round(3 * r(6)), vol: 0.5, size: 0.85, shape: "decel" },
      { to: p(leadBack), bars: 3 + Math.round(2 * r(7)), vol: 0.45, size: 0.75 },
      ...base,
      (look: Look) => {
        // read the tool's squeeze count; extend the base until it has run 7 bars, then release
        const last = look.from + look.at - 1;
        const m = /^SQUEEZE(?: DEEP)? (\d+)/.exec(head(look.run, last));
        if (!m) return null;
        const nb = +m[1];
        const extra = Math.max(0, 7 + Math.round(3 * r(9)) - nb);
        const beats: Beat[] = [];
        early(look);
        if (extra) beats.push({ to: dir > 0 ? Math.max(mid + dir * half * 0.2, back + 2) : Math.min(mid + dir * half * 0.2, back - 2), bars: extra, vol: 0.3, size: 0.5 });
        const at = look.at + extra;
        const brk = mid + dir * (half + 10 + 6 * r(10));
        beats.push({ to: brk, bars: 3, shape: "accel", size: 1.8, vol: 0.15 });
        const walls: Wall[] = [];
        if (extra) walls.push(...boxWalls(look.at, at - 1));
        else walls.push(...boxWalls(look.at, look.at).map((w) => (w.side === (dir > 0 ? "above" : "below") ? w : { ...w, level: w.level + dir * 40 })));
        return { beats, walls };
      },
      (look: Look) => {
        // not released yet: one or two more breakout bars
        if (look.run.events.some((e) => e.i >= look.from && e.title.startsWith("FIRED"))) return { beats: [] };
        return { beats: [{ to: look.last + dir * (8 + 4 * r(16)), bars: 2, size: 1.5, vol: 0.15 }] };
      },
      (look: Look) => {
        // the fire the tool printed: from here the run never trades back to the fire bar's close
        const f = look.run.events.find((e) => e.i >= look.from && e.title.startsWith("FIRED"));
        if (!f) return null;
        const c0 = look.s.c[f.i], at = look.at;
        const top = look.last + dir * (48 + 24 * r(11));
        const beats: Beat[] = [
          { to: look.last + dir * 0.55 * (top - look.last), bars: 8 + Math.round(3 * r(12)), vol: 0.5, size: 1.2 },
          { to: top, bars: 7 + Math.round(3 * r(13)), vol: 0.5, size: 1.1, shape: "decel" },
          { to: top - dir * (2 + 3 * r(14)), bars: 5 + Math.round(3 * r(15)), vol: 0.4, size: 0.8 },
        ];
        const walls: Wall[] = [{ from: at, to: at + 60, level: c0 - dir * 1.5, side: dir > 0 ? "above" : "below", probe: 0 }];
        return { beats, walls };
      },
    ],
  };
}

/**
 * THE REVERSION. Swings around the mean (no squeeze: the swings are wide enough
 * to keep compression open; ADX low), then a rally that stretches into the band
 * and turns: the slam bar's wick reaches past the band and the bar closes back
 * inside. Price then walks back to the mean, never back above the slam bar.
 */
/** the reversion band the tool draws at bar `last`: EMA 25 of closes and the 25-bar mean true range */
function band(s: Session, last: number) {
  let ema = s.c[0];
  const k = 2 / 26;
  for (let i = 1; i <= last; i++) ema = k * s.c[i] + (1 - k) * ema;
  let a = 0;
  for (let i = last - 24; i <= last; i++) a += Math.max(s.h[i] - s.l[i], Math.abs(s.h[i] - s.c[i - 1]), Math.abs(s.l[i] - s.c[i - 1]));
  return { ema, atr: a / 25, k };
}

function reversionScenario(seed: number, dir: 1 | -1): Script {
  const S = 26440 + (seed % 9) * 12;
  const r = rnd(seed);
  // swings around a drifting mean: quick legs on quiet candles keep compression open and ADX low and stay inside
  // the band; amplitude, length and shape vary leg to leg (some legs pause halfway) so nothing repeats
  const swings = (n: number, k0: number, c0: number): Beat[] => {
    const out: Beat[] = [];
    let c = c0;
    for (let k = 0; k < n; k++) {
      c += (r(k0 + 3 * k) - 0.5) * 6;
      const up = k % 2 === 0, amp = 10 + 8 * r(k0 + 3 * k + 1), bars = 5 + Math.round(5 * r(k0 + 3 * k + 2));
      const to = c + (up ? 1 : -1) * dir * amp;
      if (bars >= 8 && r(k0 + 3 * k + 7) > 0.5) {
        const last = out.length ? out[out.length - 1].to : c0, mid = last + (to - last) * 0.6;
        out.push({ to: mid, bars: bars - 4, vol: 0.45, size: 0.62 }, { to: mid - (to - last) * 0.15, bars: 2, vol: 0.3, size: 0.55 }, { to, bars: 2 + Math.round(r(k0 + 3 * k + 9)), vol: 0.4, size: 0.62 });
      } else out.push({ to, bars, vol: 0.45, size: 0.62 });
    }
    return out;
  };
  const prelude: Beat[] = [{ to: S, bars: 30, vol: 0.6, size: 0.7 }, ...swings(27, 300, S)];
  const shownSwings = swings(5 + Math.round(r(3)), 40, S);
  const side = dir > 0 ? "below" : "above";
  let slamClose = 0;
  return {
    seed, start: S, clock: 11 * 60 + 36 + Math.round(24 * r(2)), prelude,
    beats: [
      ...shownSwings,
      { to: S - dir * (7 + 5 * r(4)), bars: 5 + Math.round(2 * r(5)), vol: 0.45, size: 0.62 },
      (look: Look) => {
        // the rally: up to just inside the band, every high kept under it (no setup before the slam)
        const last = look.from + look.at - 1, b = band(look.s, last);
        const edge = b.ema + dir * 2.5 * b.atr;
        const n = 4 + Math.round(2 * r(9));
        return { beats: [{ to: edge - dir * 3, bars: n, shape: "accel", size: 1.0, vol: 0.2 }],
          walls: [{ from: look.at, to: look.at + n - 1, level: edge - dir * 0.5, side, probe: 0 }] };
      },
      (look: Look) => {
        // the stretch bar closes outside the band; the slam bar closes back inside: the setup
        const last = look.from + look.at - 1, b = band(look.s, last);
        const atr1 = b.atr + 0.5;
        const out = b.ema + dir * (2.5 * atr1 + 3 + 2 * r(10)) / (1 - b.k);
        const ema1 = b.ema + b.k * (out - b.ema);
        const edge2 = ema1 + b.k * 0 + dir * 2.5 * (atr1 + 0.3);
        slamClose = edge2 - dir * (3 + 3 * r(11));
        return { beats: [{ to: out, bars: 1, size: 1.1, vol: 0.05 }, { to: slamClose, bars: 1, size: 1.0, vol: 0.05 }] };
      },
      (look: Look) => {
        const rev = look.run.events.find((e) => e.i >= look.from && e.title.startsWith("REVERSION"));
        if (!rev) return no("stage: no setup after the slam");
        if (rev.i !== look.from + look.at - 1) return no("stage: setup before the slam");
        const c0 = look.last, mean = Number(num(/Target the mean ([\d,]+\.\d+)/, rev.text).replace(/,/g, ""));
        const dist = Math.abs(c0 - mean);
        const beats: Beat[] = [
          { to: c0 - dir * dist * (0.35 + 0.1 * r(13)), bars: 4 + Math.round(r(17)), vol: 0.45, size: 0.8 },
          { to: c0 - dir * dist * 0.27, bars: 2, vol: 0.35, size: 0.7 },
          { to: c0 - dir * dist * (0.95 + 0.1 * r(12)), bars: 4 + Math.round(2 * r(14)), vol: 0.45, size: 0.8 },
        ];
        return { beats, walls: [{ from: look.at, to: look.at + 60, level: slamClose + dir * 3.5, side, probe: 0 }] };
      },
      (look: Look) => {
        // the mean is reached: a few quiet bars under it, and the example ends
        const hit = look.run.events.find((e) => e.i >= look.from && e.title === "HIT THE MEAN");
        if (!hit) return no("stage: no hit");
        const mean = Number(num(/the mean ([\d,]+\.\d+)/, hit.text).replace(/,/g, ""));
        const left = Math.max(0, 4 + Math.round(2 * r(19)) - (look.from + look.at - 1 - hit.i));
        return left ? { beats: [{ to: mean - dir * (2 + 3 * r(20)), bars: left, vol: 0.4, size: 0.7 }] } : { beats: [] };
      },
    ],
  };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Fire long",
    title: "A base coils into a squeeze, and one fire carries the move up",
    premise: "Watch the coil on the centerline as compression drops into the squeeze channel. When it releases with momentum growing up, one graded fire prints at the low, and the move runs on from it.",
    design: (seed) => fireScenario(seed, 1),
    seeds: 400,
    judge: (run, s) => judgeFire(run, s, 1),
  },
  {
    id: "b",
    tab: "Reversion",
    title: "A stretch into the band with no squeeze on, and price walks back to the mean",
    premise: "No squeeze and a quiet ADX: the rally reaches the upper band with RSI stretched and closes back inside. One reversion setup prints with a dashed rail at the mean, and price comes back to it short of the stop.",
    design: (seed) => reversionScenario(seed, 1),
    seeds: 250,
    judge: (run, s) => judgeReversion(run, s, -1),
  },
];
