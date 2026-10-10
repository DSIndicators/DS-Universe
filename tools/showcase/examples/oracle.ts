import type { Chapter, ExampleDef, Judged } from "../build";
import type { Beat, Script } from "../design";
import { shown } from "../build";
import type { ReadItem, Session, StudyRun } from "../../../components/engine/types";

/**
 * DS Oracle — showcase examples: optimal scenarios, designed, built from real candles.
 *
 * The face of the tool: a SuperTrend that only speaks when the evidence
 * agrees. In each example a move runs into a turning area where the plain
 * SuperTrend flips back and forth while the Dropship AI vote stays under its
 * 90% threshold (no card, no trend line); then the one flip the vote confirms
 * prints the card, the trend line starts, the Neural Line holds the side and
 * the Spectrum brightens as the move runs — with no flip, no card and no
 * held-back confirmation after it.
 *
 * The pattern is written (tools/showcase/design.ts): a hidden prelude of about
 * 1,100 varied bars (trend legs, swings and bases of mixed size and length, so
 * the vote has a full 1,000-bar memory of settled trends to compare against
 * and z-score over), then the shown leg, a turning area of swings wide enough
 * to flip a 2-ATR SuperTrend, and the new trend in shallow steps. Every candle
 * is a real recorded one-minute bar. The study is the shipped one: the vote,
 * the filters and the cards are its own, on these bars (never drawn or
 * narrated from the warm-up — the study's display gate).
 */

// ------------------------------------------------------------------ reading the study's output
const val = (items: { label: string; value: string }[] | undefined, label: string) => items?.find((r) => r.label === label)?.value ?? "";
// the study's readout / status, read once per bar
const memo = new WeakMap<StudyRun, { ro: Map<number, ReadItem[] | undefined>; st: Map<number, ReadItem[] | undefined> }>();
const cache = (run: StudyRun) => { let m = memo.get(run); if (!m) { m = { ro: new Map(), st: new Map() }; memo.set(run, m); } return m; };
const readout = (run: StudyRun, i: number) => { const m = cache(run).ro; if (!m.has(i)) m.set(i, run.readout?.(i)); return m.get(i); };
const status = (run: StudyRun, i: number) => { const m = cache(run).st; if (!m.has(i)) m.set(i, run.status?.(i, null)); return m.get(i); };
const num = (t: string) => Number((t.match(/-?[\d,]+\.\d+/)?.[0] ?? "NaN").replace(/,/g, ""));
const stUp = (run: StudyRun, i: number) => val(readout(run, i), "SuperTrend").startsWith("UP");
const stLine = (run: StudyRun, i: number) => num(val(readout(run, i), "SuperTrend").split("·")[1] ?? "");
const voteShare = (run: StudyRun, i: number, up: boolean) => {
  const m = val(status(run, i), "Vote").match(/(\d+)% up · (\d+)% down/);
  return m ? Number(up ? m[1] : m[2]) : NaN;
};
const flips = (run: StudyRun, i: number) => {
  const m = val(status(run, i), "Flips").match(/(\d+) · confirmed (\d+) · cards (\d+)/);
  return m ? { flips: +m[1], conf: +m[2], cards: +m[3] } : { flips: 0, conf: 0, cards: 0 };
};
const spectrum = (run: StudyRun, i: number) => val(status(run, i), "Spectrum");
const biasOf = (run: StudyRun, i: number) => {
  const v = val(status(run, i), "Neural Line");
  return v.startsWith("LONG") ? 1 : v.startsWith("SHORT") ? -1 : 0;
};
const confirmed = (run: StudyRun, i: number) => {
  const v = val(readout(run, i), "Confirmed trend");
  return v === "UP" ? 1 : v === "DOWN" ? -1 : 0;
};
const f2 = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hhmm = (s: Session, i: number) => { const m = ((s.t[i] % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

// ------------------------------------------------------------------ the judge
export const rejects: Record<string, number> = {};
const no = (why: string): null => { rejects[why] = (rejects[why] ?? 0) + 1; return null; };
function judgeTurn(run: StudyRun, s: Session, side: 1 | -1): Judged | null {
  const from = s.replayFrom, end = s.n - 1;
  const up = side > 0;
  const CARD = up ? "BUYERS" : "SELLERS", BIAS = up ? "LONG BIAS" : "SHORT BIAS", ANTI_BIAS = up ? "SHORT BIAS" : "LONG BIAS";
  const ev = shown(run, s);
  // ZERO FLAWS: exactly one card, on the turn's side; no confirmation a filter held back; nothing against it after it
  const cards = ev.filter((e) => e.title === "BUYERS" || e.title === "SELLERS");
  if (cards.length !== 1) return no(cards.length ? "more than one card" : "no card");
  const card = cards[0];
  if (card.title !== CARD) return no("wrong side");
  if (ev.some((e) => e.title.startsWith("CONFIRMED"))) return no("a held-back confirmation");
  const ci = card.i;
  if (ci - from < 45 || end - ci < 40) return no("card too close to an edge");
  const flipBars: number[] = [];
  for (let i = from + 1; i <= end; i++) if (stUp(run, i) !== stUp(run, i - 1)) flipBars.push(i);
  const ignored = flipBars.filter((i) => i < ci);
  if (ignored.length < 2) return no("fewer than two ignored flips");
  if (flipBars.some((i) => i > ci)) return no("a flip after the card");
  if (stUp(run, ci) !== up) return no("card against the SuperTrend");
  const lastFlip = flipBars.filter((i) => i <= ci).pop()!;
  if (ci - lastFlip > 12) return no("card long after the flip");
  // follow-through after the card (closes), and how far it went against it
  const c0 = s.c[ci];
  const follow = side * (s.c[end] - c0);
  let adverse = 0, best = 0;
  for (let i = ci + 1; i <= end; i++) { adverse = Math.max(adverse, side * (c0 - (up ? s.l[i] : s.h[i]))); best = Math.max(best, side * ((up ? s.h[i] : s.l[i]) - c0)); }
  if (follow < 50) return no("no follow-through");
  if (adverse > 12) return no("heat after the card");
  if (follow < 0.8 * best) return no("the move gave back");
  // the Neural Line takes the side before the card and keeps it
  const biasEv = ev.filter((e) => e.title === BIAS), antiEv = ev.filter((e) => e.title === ANTI_BIAS);
  if (antiEv.some((e) => e.i > ci) || biasEv.some((e) => e.i > ci)) return no("the Neural Line turned after the card");
  for (let i = ci; i <= end; i++) if (biasOf(run, i) !== side) return no("the Neural Line off the side after the card");
  if (biasEv.length + antiEv.length > 4) return no("a restless Neural Line");
  const STRONG = up ? "STRONG UP" : "STRONG DOWN";
  const strong: number[] = [];
  for (let i = ci + 1; i <= end; i++) if (spectrum(run, i).startsWith(STRONG)) strong.push(i);

  // ---- moments
  const want = up ? "up" : "down";
  const chapters: Chapter[] = [];
  const fit = (i: number) => chapters.every((c) => Math.abs(c.i - i) >= 8);
  const towards = ignored.filter((i) => i - from >= 8 && stUp(run, i) === up && ci - i >= 8 && voteShare(run, i, up) < 90 && flips(run, i).conf === 0);
  if (towards.length < 1) return no("no ignored flip toward the turn");
  const flipMoment = (i: number) => {
    const vs = voteShare(run, i, up), fl = flips(run, i);
    chapters.push({
      i, title: "UNCONFIRMED", tone: "neutral", price: stLine(run, i),
      text: `The SuperTrend flips ${want} (line ${f2(stLine(run, i))}), where a plain SuperTrend would signal. ${vs}% of the vote sits in a settled ${up ? "uptrend" : "downtrend"}, under the 90% threshold, so no card prints. Flips ${fl.flips} · confirmed ${fl.conf}.`,
    });
  };
  for (const i of towards.length > 1 ? [towards[0], towards[towards.length - 1]] : [towards[0]]) if (fit(i)) flipMoment(i);
  // the plain SuperTrend flipping straight back: the whipsaw the vote stayed out of
  const backFlip = ignored.find((i) => i > towards[0] && stUp(run, i) !== up && ci - i >= 8);
  if (backFlip !== undefined && fit(backFlip)) {
    const fl = flips(run, backFlip);
    chapters.push({
      i: backFlip, title: "UNCONFIRMED", tone: "neutral", price: stLine(run, backFlip),
      text: `The SuperTrend flips back ${up ? "down" : "up"} (line ${f2(stLine(run, backFlip))}): a plain SuperTrend would have signalled ${want}, then ${up ? "down" : "up"} again. The vote never confirmed the flip ${want}, so no card and no trend line were drawn. Flips ${fl.flips} · confirmed ${fl.conf}.`,
    });
  }
  const bias = biasEv.filter((e) => e.i <= ci).pop();
  if (bias && fit(bias.i) && ci - bias.i >= 8) {
    const m = bias.text.match(/closed at ([\d,.]+), ([\d.]+) pts (above|below) the Neural Line \(([\d,.]+)\)/);
    if (m) chapters.push({
      i: bias.i, title: BIAS, tone: bias.tone, price: bias.price,
      text: `The bar closes ${m[2]} pts ${m[3]} the Neural Line (${m[4]}), clear of its 0.25-ATR flip buffer, so the line's side turns ${up ? "long" : "short"}. The SuperTrend still has to be confirmed.`,
    });
  }
  {
    const sh = card.text.match(/([\d.]+%) of the weighted vote among the (\d+) most similar past states/);
    if (!sh) return no("card unreadable");
    const fl = flips(run, ci);
    if (fl.conf !== 1 || fl.cards !== 1) return no("card counts do not match");
    const onFlip = lastFlip === ci;
    const head = onFlip
      ? `The SuperTrend flips ${want} and ${sh[1]} of the vote among the ${sh[2]} most similar past states sits in a settled ${up ? "uptrend" : "downtrend"}`
      : `The SuperTrend, ${want} since ${hhmm(s, lastFlip)}, now has ${sh[1]} of the vote among the ${sh[2]} most similar past states in a settled ${up ? "uptrend" : "downtrend"}`;
    if (!fit(ci)) chapters.splice(chapters.findIndex((c) => Math.abs(c.i - ci) < 8), 1);
    chapters.push({
      i: ci, title: CARD, tone: card.tone, price: card.price,
      text: `${head} — over the 90% threshold. The Neural Line agrees, so ${CARD} prints: flip ${fl.flips}, the first confirmed.`,
    });
  }
  const sb = strong.find((i) => i - ci >= 10 && fit(i) && !spectrum(run, i - 1).startsWith(STRONG) && confirmed(run, i) === side);
  if (sb !== undefined) chapters.push({
    i: sb, title: STRONG, tone: up ? "strongBull" : "strongBear", price: s.c[sb],
    text: `All four Spectrum SuperTrends point ${want} and the bar ignites, so the candle brightens to ${STRONG.toLowerCase()} (${up ? "cyan" : "magenta"}). The trend line and the Neural Line hold the ${up ? "long" : "short"} side.`,
  });
  chapters.sort((a, b) => a.i - b.i);
  if (chapters.length < 3) return no("fewer than three moments");
  for (const c of chapters) if (c.text.length > 240) return no("moment too long");
  const score = follow - 3 * adverse + 6 * Math.min(ignored.length, 4) + 2 * Math.min(strong.length, 12) + 10 * chapters.length
    - 6 * (biasEv.length + antiEv.length) + 3 * Math.min(8, Math.max(0, parseFloat(card.text.match(/([\d.]+)% of the weighted vote/)?.[1] ?? "90") - 90));
  return { score, chapters, note: `follow ${follow.toFixed(2)} adverse ${adverse.toFixed(2)} flips-before ${ignored.length} events ${ev.length} strong ${strong.length}` };
}

// ------------------------------------------------------------------ the scenarios
/**
 * `dir` 1 = bullish turn (a down leg bases, then turns up), -1 = bearish turn (mirrored).
 * p(x) = S + dir·x: x is height above the turn's low (a) / depth below its high (b).
 */
export function scenario(seed: number, dir: 1 | -1): Script {
  const S = 26480 + (seed % 7) * 15;
  const p = (x: number) => S + dir * x;
  const r = (k: number) => ((seed * 7919 + k * 104729) % 1000) / 1000;
  const sw = (k2: number, lo: number, hi: number) => lo + (hi - lo) * r(k2);
  // hidden prelude: ~1,100 bars of trend legs, swings and bases of mixed size and length
  const pre: Beat[] = [];
  let x = 150, tot = 0, k = 100;
  while (tot < 960) {
    const kind = r(k++);
    let bars: number, move: number;
    if (kind < 0.35) { bars = 25 + Math.round(35 * r(k++)); move = (r(k++) < 0.5 ? -1 : 1) * (40 + 50 * r(k++)); }
    else if (kind < 0.7) { bars = 8 + Math.round(12 * r(k++)); move = (r(k++) < 0.5 ? -1 : 1) * (10 + 20 * r(k++)); }
    else { bars = 15 + Math.round(20 * r(k++)); move = (r(k++) - 0.5) * 12; }
    x += move;
    if (x > 380) x -= 2 * Math.abs(move);
    if (x < 60) x += 2 * Math.abs(move);
    pre.push({ to: p(x), bars, vol: 0.6, size: 0.9 });
    tot += bars;
  }
  // the prelude ends rising into the top the shown leg falls from
  const TOP = 100;
  // the last ~200 hidden bars stay near the story's price, so the slow Neural Line arrives with it
  pre.push({ to: p(sw(37, 70, 85)), bars: 45, vol: 0.6, size: 0.9 }, { to: p(sw(38, 90, 100)), bars: 35, vol: 0.55, size: 0.9 }, { to: p(sw(39, 68, 78)), bars: 30, vol: 0.55, size: 0.9 },
    { to: p(TOP + 20 * r(1)), bars: 40, vol: 0.6, size: 0.95 }, { to: p(TOP - 32 + 10 * r(2)), bars: 22, vol: 0.55 },
    { to: p(sw(3, 0.6, 0.68) * (TOP - 30)), bars: 11 + Math.round(4 * r(4)), vol: 0.55, size: 1.05 });
  const SW0 = 40, SW1 = 46, QUIET = 8, SW2 = 20;
  const beats: Beat[] = [
    // the shown leg into the turning area
    { to: p(sw(5, 0.7, 0.76) * (TOP - 30)), bars: 4, vol: 0.45, size: 0.85 },
    { to: p(sw(6, 2, 6)), bars: 13 + Math.round(4 * r(7)), vol: 0.55, size: 1.1, shape: "accel" },
    // the turning area: swings wide enough to flip a 2-ATR SuperTrend each way, long enough for the Neural Line to come down into it
    { to: p(sw(8, SW0, SW1)), bars: 7 + Math.round(2 * r(9)), vol: 0.5, size: 0.95 },
    { to: p(sw(10, -1, 3)), bars: 8 + Math.round(2 * r(11)), vol: 0.5, size: 0.95 },
    { to: p(sw(12, SW2, SW2 + 5)), bars: 8 + Math.round(2 * r(13)), vol: 0.5, size: 0.95 },
    { to: p(sw(14, 3, 8)), bars: 8 + Math.round(2 * r(15)), vol: 0.5, size: 0.95 },
    { to: p(sw(28, 22, 28)), bars: 6 + Math.round(2 * r(29)), vol: 0.45, size: 0.9 },
    { to: p(sw(30, 10, 15)), bars: 5 + Math.round(2 * r(31)), vol: 0.45, size: 0.9 },
    ...(QUIET ? [{ to: p(sw(32, 17, 22)), bars: QUIET, vol: 0.35, size: 0.8 }, { to: p(sw(33, 10, 14)), bars: QUIET, vol: 0.35, size: 0.8 }] : []),
    // the new trend in shallow steps
    { to: p(sw(16, 38, 44)), bars: 9 + Math.round(3 * r(17)), vol: 0.5, size: 1.05 },
    { to: p(sw(18, 33, 36)), bars: 3, vol: 0.4, size: 0.85 },
    { to: p(sw(19, 62, 70)), bars: 10 + Math.round(3 * r(20)), vol: 0.55, size: 1.1 },
    { to: p(sw(21, 56, 60)), bars: 3, vol: 0.4, size: 0.85 },
    { to: p(sw(22, 88, 96)), bars: 10 + Math.round(3 * r(23)), vol: 0.55, size: 1.1 },
    { to: p(sw(24, 83, 86)), bars: 3, vol: 0.4, size: 0.85 },
    { to: p(sw(25, 116, 128)), bars: 11 + Math.round(3 * r(26)), vol: 0.55, size: 1.1, shape: "decel" },
  ];
  return { seed, start: p(TOP), clock: 11 * 60 + 6 + Math.round(20 * r(27)), prelude: pre, beats };
}

export const examples: ExampleDef[] = [
  {
    id: "a",
    tab: "Bullish turn",
    title: "A down leg bases, and only one flip earns a card",
    premise: "The plain SuperTrend flips back and forth through the base while the vote stays under 90% and nothing prints. Then one flip is confirmed: BUYERS prints, and the trend line and the Neural Line carry the move.",
    design: (seed) => scenario(seed, 1),
    seeds: Number(process.env.SEEDS ?? 300),
    judge: (run, s) => judgeTurn(run, s, 1),
  },
  {
    id: "b",
    tab: "Bearish turn",
    title: "A rally tops out, and the vote waits for the real flip",
    premise: "At the top the plain SuperTrend flips down and back up while the vote stays under 90% and nothing prints. Then one flip is confirmed: SELLERS prints, the trend line starts, and the Spectrum brightens as the drop runs.",
    design: (seed) => scenario(seed, -1),
    seeds: Number(process.env.SEEDS ?? 300),
    judge: (run, s) => judgeTurn(run, s, -1),
  },
];
