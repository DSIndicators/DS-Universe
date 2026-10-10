import type { Draw, ReadItem, StudyDef, StudyEvent, StudyRun, Tone } from "../types";
import { hhmm } from "../ta";

/**
 * DS Session Levels — web edition. Source: DSSessionLevels.cs (Build 2026-09-30), shipped
 * defaults (ApplyDefaults): Session preset FuturesETH, Session time zone
 * NewYork, Show live on, Carry forward NextOpen, After a break Fade, Sessions
 * shown 0 (all), Exact levels on, labels on with price at the session end,
 * edge tags on, label size 9, Color theme DsSignature, Opacity 80, line width
 * 1, span Solid, carry Dot, serifs on, History strength 60, no midpoint / range
 * shading / dividers, behind candles, alerts off.
 *
 * WHAT IS PORTED (DsSlEngine.Feed / Fold / CloseInstance / Resolve, OnRender /
 * DrawInstance / Carry / Label / DrawTags, ResolveAdaptive / Solve)
 *  · Sessions in New York time: Asia 18:00–03:00 (violet 163,61,255), London
 *    03:00–09:30 (teal 0,153,153), New York 09:30–16:00 (gold 255,196,0);
 *    Session 4 Overnight 18:00–09:30 (platinum 224,233,247) is off by default
 *    and offered as a layer. A bar belongs to a session when its close time is
 *    after the start and up to and including the end (Window()).
 *  · A session instance starts on its first bar; while it runs its high/low
 *    follow price (a bracket with a start tick only); it closes on the bar
 *    stamped exactly at its end time (or, across a data gap, on the first bar
 *    outside it); then its high and low carry forward as dotted lines until the
 *    same session opens again (NextOpen), and the first CLOSE beyond a level
 *    takes it — the rest of that line is drawn at 40 % (Fade). Wicks don't count.
 *  · The first session on the chart is left out when the history starts
 *    partway through it (ChartPartial).
 *  · On a 1-minute chart the tool needs no extra minute series (Exact levels
 *    resolves to the chart's own bars), so the levels are the bars' own highs
 *    and lows — identical to NinjaTrader.
 *  · Drawing: span lines at Opacity 80 % (x 60 % History strength for sessions no
 *    longer current), 4 px serifs at both ends (start only while live), carry at
 *    65 % with a 1-on/2-off dot, labels "ASIA HIGH 30616.00" above the high /
 *    below the low at the session end (price at 85 %, dropped when the span is
 *    too short, slid to the left edge when the span is off screen, stacked
 *    away from collisions), edge tags "ASIA H" / "LONDON L" at the right edge
 *    for levels still carrying (40 % once taken), de-overlapped vertically.
 *  · Colours checked against the chart ground (Solve, 3:1): on the light ground
 *    teal and gold deepen toward black exactly as in NinjaTrader.
 *  · Events: a session closing (its HIGH & LOW become final), a level taken (the
 *    tool's alert wording: "<NAME> HIGH 30616.00 taken - close … above it"),
 *    and price reaching a level still carrying (the alert's "price at the …",
 *    Touch distance 2 ticks, once per level) — all at bar close. Status/readout
 *    are the tool's Data Box values (each session's high and low).
 *
 * DEVIATIONS
 *  1. The 24-hour-session special case (start = end) is not ported: no default
 *     or preset session uses it.
 *  2. Alerts are off by default in DS Session Levels and real-time only; the
 *     replay uses their wording as narration, evaluated at bar close (the touch
 *     uses the bar's high/low at its close rather than the first tick there).
 *  3. Fonts: the site's sans face stands in for Segoe UI at the same sizes.
 *  4. The tool never moves the price scale, so neither does the replay
 *     (no priceExtent): a level off screen is not pulled into view.
 *  5. Where the recorded session file has a gap (2026-10-08: 19:37 → 00:01 ET
 *     on 10-07/08) the Asia levels come from the bars that exist — the same
 *     bars NinjaTrader on the DS machine has.
 *  6. Example hygiene (web showcase): a session instance that starts before the
 *     first shown bar (s.replayFrom) — the warm-up session the example reads but
 *     never shows — is not drawn, narrated or read in the Data Box, so no level,
 *     label, tag or touch from before the example's start appears on it. The
 *     engine still computes every instance (NextOpen, breaks) unchanged.
 */

type RGB = [number, number, number];
const SLOTS = [
  { name: "Asia", start: 18 * 60, end: 3 * 60, col: [163, 61, 255] as RGB, tone: "bear" as Tone },
  { name: "London", start: 3 * 60, end: 9 * 60 + 30, col: [0, 153, 153] as RGB, tone: "bull" as Tone },
  { name: "New York", start: 9 * 60 + 30, end: 16 * 60, col: [255, 196, 0] as RGB, tone: "gold" as Tone },
  { name: "Overnight", start: 18 * 60, end: 9 * 60 + 30, col: [224, 233, 247] as RGB, tone: "neutral" as Tone },
];
const OPACITY = 0.8, HIST = 0.6, PROJ_A = 0.65, FADE_A = 0.4, TAG_A = 0.9, PRICE_A = 0.85, SERIF = 4, MIN_SPAN_SERIF = 8, TOUCH_TICKS = 2;
const LBL_SZ = 9, TAG_SZ = 8, LBL_H = 12, TAG_H = 11;

type Inst = {
  slot: number; anchor: number; start: number; end: number; closedAt: number; aliveFrom: number; nextStart: number;
  partial: boolean; hiRun: Float64Array; loRun: Float64Array; high: number; low: number; breakH: number; breakL: number;
};

const fmt = (p: number) => p.toFixed(2); // MasterInstrument.FormatPrice for NQ
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (c: number[]) => 0.2126 * lin(c[0] / 255) + 0.7152 * lin(c[1] / 255) + 0.0722 * lin(c[2] / 255);
const contrast = (a: number[], b: number[]) => { const la = lum(a), lb = lum(b); return la > lb ? (la + 0.05) / (lb + 0.05) : (lb + 0.05) / (la + 0.05); };
function solve(c: RGB, ground: RGB): RGB {
  if (contrast(c, ground) >= 3) return c;
  const to = lum(ground) > 0.45 ? [0, 0, 0] : [255, 255, 255];
  const mix = (m: number) => c.map((v, j) => v + (to[j] - v) * m);
  let lo = 0, hi = 1;
  for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (contrast(mix(m), ground) >= 3) hi = m; else lo = m; }
  return mix(hi).map((v) => Math.round(v)) as RGB;
}
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const hexRgb = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

export const study: StudyDef = {
  slug: "session-levels", rightMargin: 120,
  name: "DS Session Levels",
  about: "The Asia, London and New York highs and lows — each drawn over exactly its own bars, then carried forward until that session opens again, fading where a close takes it.",
  layers: [
    { id: "overnight", label: "Overnight session", on: false, hint: "Session 4 — the whole 18:00–09:30 overnight range New York opens into. Off by default in DS Session Levels." },
  ],
  run(s): StudyRun {
    const n = s.n, tick = s.tick;
    // ---- DsSlEngine over closed 1-minute bars
    const insts: Inst[][] = [[], [], [], []];
    const cur: (Inst | null)[] = [null, null, null, null];
    const close = (sl: number, at: number, exact: boolean) => {
      const x = cur[sl]!;
      x.closedAt = at; x.aliveFrom = exact ? at + 1 : at;
      cur[sl] = null;
    };
    for (let idx = 0; idx < n; idx++) {
      const m = ((s.t[idx] % 1440) + 1440) % 1440, day = Math.floor(s.t[idx] / 1440);
      for (let sl = 0; sl < 4; sl++) {
        const S = SLOTS[sl];
        let inWin: boolean, anchor: number;
        if (S.start < S.end) { inWin = m > S.start && m <= S.end; anchor = day; }
        else if (m > S.start) { inWin = true; anchor = day; }
        else if (m <= S.end) { inWin = true; anchor = day - 1; }
        else { inWin = false; anchor = day; }
        if (!inWin) { if (cur[sl]) close(sl, idx, false); continue; }
        if (cur[sl] && cur[sl]!.anchor === anchor) { cur[sl]!.end = idx; continue; }
        if (cur[sl]) close(sl, idx, false);
        // NextOpen: every carrying instance of this slot stops on the bar before
        for (const a of insts[sl]) if (a.nextStart === Infinity && a !== cur[sl]) a.nextStart = idx;
        const partial = idx === 0 && s.t[idx] - 1 > anchor * 1440 + S.start;
        const x: Inst = { slot: sl, anchor, start: idx, end: idx, closedAt: Infinity, aliveFrom: Infinity, nextStart: Infinity, partial,
          hiRun: new Float64Array(0), loRun: new Float64Array(0), high: NaN, low: NaN, breakH: -1, breakL: -1 };
        insts[sl].push(x); cur[sl] = x;
      }
      // closed bar: a session whose end time is this bar's stamp closes on it
      for (let sl = 0; sl < 4; sl++) if (cur[sl] && cur[sl]!.end === idx && m === SLOTS[sl].end) close(sl, idx, true);
    }
    for (const list of insts) for (const x of list) {
      const len = x.end - x.start + 1;
      x.hiRun = new Float64Array(len); x.loRun = new Float64Array(len);
      let h = -Infinity, l = Infinity;
      for (let j = 0; j < len; j++) { if (s.h[x.start + j] > h) h = s.h[x.start + j]; if (s.l[x.start + j] < l) l = s.l[x.start + j]; x.hiRun[j] = h; x.loRun[j] = l; }
      x.high = h; x.low = l;
      if (x.closedAt < Infinity) {
        const to = Math.min(n - 1, x.nextStart - 1);
        for (let b = x.aliveFrom; b <= to; b++) {
          if (x.breakH < 0 && s.c[b] > x.high) x.breakH = b;
          if (x.breakL < 0 && s.c[b] < x.low) x.breakL = b;
          if (x.breakH >= 0 && x.breakL >= 0) break;
        }
      }
    }

    // ---- state of an instance as of bar k
    const live = (x: Inst, k: number) => k < x.closedAt;
    const endAt = (x: Inst, k: number) => (live(x, k) ? Math.min(k, x.end) : x.end);
    const hiAt = (x: Inst, k: number) => x.hiRun[endAt(x, k) - x.start];
    const loAt = (x: Inst, k: number) => x.loRun[endAt(x, k) - x.start];
    const projEnd = (x: Inst, k: number) => (x.nextStart <= k ? x.nextStart - 1 : -1);
    const brk = (b: number, k: number) => (b >= 0 && b <= k ? b : -1);
    const current = (x: Inst, k: number) => live(x, k) || x.nextStart > k;
    /** Latest(s) — the Data Box value: the running or most recent instance, unless partial */
    const latest = (sl: number, k: number) => {
      const list = insts[sl];
      let lo = 0, hi = list.length - 1, a = -1;
      while (lo <= hi) { const m = (lo + hi) >> 1; if (list[m].start <= k) { a = m; lo = m + 1; } else hi = m - 1; }
      if (a < 0 || list[a].partial || list[a].start < s.replayFrom) return null; // example hygiene (DEVIATIONS 6)
      return list[a];
    };

    // ---- events (the three default sessions)
    const events: StudyEvent[] = [];
    for (let sl = 0; sl < 3; sl++) {
      const S = SLOTS[sl], NM = S.name.toUpperCase();
      for (const x of insts[sl]) {
        if (x.partial || x.start < s.replayFrom) continue; // example hygiene (DEVIATIONS 6)
        events.push({
          i: x.start, tone: S.tone, weight: 1, title: `${NM} SESSION`, price: s.o[x.start],
          text: `${hhmm(s, x.start)} — ${S.name} (${hm(S.start)}–${hm(S.end)} ET) is in progress: its bracket starts with a tick on this bar, and its high and low follow price until ${hm(S.end)}, when they become final.`,
        });
        if (x.closedAt === Infinity) continue;
        const reopen = hm(S.start);
        events.push({
          i: x.closedAt, tone: S.tone, weight: 2, title: `${NM} HIGH & LOW`, price: x.high,
          text: `${hhmm(s, x.closedAt)} — ${S.name} (${hm(S.start)}–${hm(S.end)} ET) has closed: ${NM} HIGH ${fmt(x.high)} and ${NM} LOW ${fmt(x.low)} are final. They carry forward as dotted lines until ${S.name} opens again at ${reopen}, fading from the first bar that closes through them.`,
        });
        const to = Math.min(n - 1, x.nextStart - 1);
        for (const side of [1, -1]) {
          const lvl = side > 0 ? x.high : x.low, b = side > 0 ? x.breakH : x.breakL, word = side > 0 ? "HIGH" : "LOW";
          // price at the level (2 ticks), once, while it still stands
          for (let q = x.aliveFrom; q <= Math.min(to, b < 0 ? n - 1 : b - 1); q++) {
            if (side > 0 ? s.h[q] >= lvl - TOUCH_TICKS * tick : s.l[q] <= lvl + TOUCH_TICKS * tick) {
              events.push({
                i: q, tone: S.tone, weight: 1, title: `AT THE ${NM} ${word}`, price: lvl,
                text: `${hhmm(s, q)} — the bar ${side > 0 ? "reached up" : "reached down"} to the ${NM} ${word} ${fmt(lvl)} (within ${TOUCH_TICKS} ticks) and closed at ${fmt(s.c[q])}, still ${side > 0 ? "below" : "above"} it — the level stands.`,
              });
              break;
            }
          }
          if (b >= 0) {
            events.push({
              i: b, tone: S.tone, weight: 3, title: `${NM} ${word} TAKEN`, price: lvl,
              text: `${hhmm(s, b)} — the bar closed at ${fmt(s.c[b])}, ${side > 0 ? "above" : "below"} the ${NM} ${word} ${fmt(lvl)}: the level is taken and the rest of its dotted line fades. A wick through does not count — it takes a close.`,
            });
          }
        }
      }
    }
    events.sort((a, b) => a.i - b.i);

    // ---- Data Box reads
    const reads = (k: number, on4: boolean): ReadItem[] => {
      const out: ReadItem[] = [];
      for (let sl = 0; sl < (on4 ? 4 : 3); sl++) {
        const x = latest(sl, k);
        const S = SLOTS[sl];
        if (!x) { out.push({ label: `${S.name}`, value: "—" }); continue; }
        const st = (b: number) => (live(x, k) ? "live" : brk(b, k) >= 0 ? "taken" : current(x, k) ? "carrying" : "ended");
        const sh = st(x.breakH), sL = st(x.breakL);
        out.push({ label: `${S.name} high`, value: `${fmt(hiAt(x, k))} · ${sh}`, tone: sh === "taken" || sh === "ended" ? "neutral" : S.tone });
        out.push({ label: `${S.name} low`, value: `${fmt(loAt(x, k))} · ${sL}`, tone: sL === "taken" || sL === "ended" ? "neutral" : S.tone });
      }
      return out;
    };

    // ---- painting (behind the candles)
    const under = (d: Draw) => {
      const k = d.k, pv = d.price;
      const ground = hexRgb(d.th.bg);
      const cols = SLOTS.map((S) => solve(S.col, ground));
      const panelL = 0, panelR = d.plotRight, panelT = pv.top, panelB = pv.bottom;
      const half = d.bw / 2;
      const last = d.live ? d.live.i : k;
      const placed: [number, number, number, number][] = [];
      const tags: { y: number; h: number; w: number; t: string; c: RGB; a: number; lx: number; ly: number; la: number }[] = [];
      const ctx = d.ctx;
      const sans = (sz: number, wt: number) => ({ size: sz, weight: wt, font: "sans" as const });
      const line = (x1: number, y: number, x2: number, c: RGB, a: number, dot: boolean) => {
        if (x2 - x1 < 0.5) return;
        ctx.save(); ctx.strokeStyle = rgba(c, a); ctx.lineWidth = 1; ctx.lineCap = "butt";
        if (dot) ctx.setLineDash([1, 2]);
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.restore();
      };
      const collides = (x: number, y: number, w: number, h: number) => placed.some((r) => x < r[0] + r[2] && x + w > r[0] && y < r[1] + r[3] && y + h > r[1]);
      const xAfter = (b: number) => d.x(b) + half;
      const xBefore = (b: number) => d.x(b) - half;

      const label = (name: string, px: string | null, xs: number, xe: number, extent: number, xBreak: number, y: number, above: boolean, c: RGB, strength: number) => {
        const wN = d.measure(name, sans(LBL_SZ, 600)), wP = px ? d.measure(px, sans(LBL_SZ, 400)) : 0, gap = 6;
        const spanW = xe - xs;
        let total = wN + (px ? gap + wP : 0);
        if (total + 6 > spanW && px) { px = null; total = wN; }
        if (total + 6 > spanW) return;
        let xl = xe - 3 - total, a = strength;
        if (xl < panelL + 3 && extent > panelL + 4 + total) {
          xl = panelL + 4;
          if (xl >= xe) { a = strength * PROJ_A; if (xBreak >= 0 && xBreak <= xl) a = strength * FADE_A; }
        }
        if (xl < panelL || xl + total > panelR) return;
        let top = above ? y - 2 - LBL_H : y + 3;
        for (let t = 0; t < 4 && collides(xl, top, total, LBL_H); t++) top += above ? -(LBL_H + 1) : LBL_H + 1;
        if (top < panelT || top + LBL_H > panelB) return;
        placed.push([xl, top, total, LBL_H]);
        d.text(name, xl, top + LBL_H / 2, { ...sans(LBL_SZ, 600), color: rgba(c, a) });
        if (px) d.text(px, xl + wN + gap, top + LBL_H / 2, { ...sans(LBL_SZ, 400), color: rgba(c, a * PRICE_A) });
      };

      for (let sl = 0; sl < 4; sl++) {
        if (sl === 3 && !d.on("overnight")) continue;
        const S = SLOTS[sl], col = cols[sl], NM = S.name.toUpperCase();
        const list = insts[sl];
        let hiI = -1;
        { let lo = 0, hi = list.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (list[m].start <= Math.min(d.i1, k)) { hiI = m; lo = m + 1; } else hi = m - 1; } }
        for (let j = hiI; j >= 0; j--) {
          const x = list[j];
          const lv = live(x, k), pe = projEnd(x, k), bH = brk(x.breakH, k), bL = brk(x.breakL, k);
          const end = endAt(x, k);
          const reach = lv ? end : pe < 0 ? Infinity : Math.max(pe, end);
          if (reach < d.i0) break;
          if (x.partial || x.start < s.replayFrom) continue; // example hygiene (DEVIATIONS 6)
          const high = hiAt(x, k), low = loAt(x, k);
          const strength = OPACITY * (current(x, k) ? 1 : HIST);
          const xs = xBefore(x.start);
          let xe = lv ? d.x(end) + half : xAfter(end);
          if (xe < xs) xe = xs;
          const yH = Math.round(pv.y(high)) + 0.5, yL = Math.round(pv.y(low)) + 0.5;
          const hOn = yH >= panelT && yH <= panelB, lOn = yL >= panelT && yL <= panelB;
          const proj = !lv;
          let xEndH = xe, xEndL = xe, edgeH = false, edgeL = false;
          const projX = (pend: number, b: number): [number, boolean] => {
            if (pend < 0) return [panelR, true];
            const p = Math.min(pend, last);
            if (b >= 0 && p === b) return [d.x(p), false];
            return [xAfter(p), false];
          };
          if (proj) { [xEndH, edgeH] = projX(pe, bH); [xEndL, edgeL] = projX(pe, bL); }
          // edge tags
          const addTag = (t: string, y: number, a: number, la: number) => {
            const w = d.measure(t, sans(TAG_SZ, 600));
            tags.push({ y: y - TAG_H / 2, h: TAG_H, w, t, c: col, a, lx: panelR - 3 - w - 4, ly: y, la });
            return w;
          };
          let tH = 0, tL = 0;
          if (proj) {
            if (edgeH && hOn) tH = addTag(`${NM} H`, yH, strength * (bH >= 0 ? FADE_A : TAG_A), strength * (bH >= 0 ? FADE_A : PROJ_A));
            if (edgeL && lOn) tL = addTag(`${NM} L`, yL, strength * (bL >= 0 ? FADE_A : TAG_A), strength * (bL >= 0 ? FADE_A : PROJ_A));
          }
          if (tH > 0) xEndH = Math.min(xEndH, panelR - 3 - tH - 4);
          if (tL > 0) xEndL = Math.min(xEndL, panelR - 3 - tL - 4);
          const spanVis = xe >= panelL && xs <= panelR;
          if (spanVis) {
            const x1 = Math.max(xs, panelL), x2 = Math.min(xe, panelR);
            if (hOn) line(x1, yH, x2, col, strength, false);
            if (lOn) line(x1, yL, x2, col, strength, false);
          }
          const carry = (xTo: number, y: number, b: number) => {
            if (xTo <= xe) return;
            let xb = xTo;
            if (b >= 0) xb = Math.min(xTo, Math.max(xe, d.x(b)));
            const p1 = Math.max(xe, panelL), p2 = Math.min(xb, panelR);
            if (p2 > p1) line(p1, y, p2, col, strength * PROJ_A, true);
            if (b >= 0) { const q1 = Math.max(xb, panelL), q2 = Math.min(xTo, panelR); if (q2 > q1) line(q1, y, q2, col, strength * FADE_A, true); }
          };
          if (proj) { if (hOn) carry(xEndH, yH, bH); if (lOn) carry(xEndL, yL, bL); }
          // serifs
          if (spanVis && xe - xs >= MIN_SPAN_SERIF && yL - yH >= SERIF + 2) {
            const xa = Math.round(xs) + 0.5, xb = Math.round(xe) + 0.5 - 1, c = rgba(col, strength);
            const hTip = Math.min(yH + SERIF, panelB), lTip = Math.max(yL - SERIF, panelT);
            if (xa >= panelL && xa <= panelR) { if (hOn) d.line([[xa, yH], [xa, hTip]], c, 1); if (lOn) d.line([[xa, yL], [xa, lTip]], c, 1); }
            if (!lv && xb >= panelL && xb <= panelR) { if (hOn) d.line([[xb, yH], [xb, hTip]], c, 1); if (lOn) d.line([[xb, yL], [xb, lTip]], c, 1); }
          }
          // labels
          const extH = Math.max(xe, xEndH), extL = Math.max(xe, xEndL);
          const xbH = proj && bH >= 0 ? d.x(bH) : -1, xbL = proj && bL >= 0 ? d.x(bL) : -1;
          if (hOn) label(`${NM} HIGH`, fmt(high), xs, xe, extH, xbH, yH, true, col, strength);
          if (lOn) label(`${NM} LOW`, fmt(low), xs, xe, extL, xbL, yL, false, col, strength);
        }
      }
      // DrawTags: sorted by y, pushed apart, kept inside the panel
      tags.sort((a, b) => a.y - b.y);
      let prevBottom = -Infinity;
      for (const t of tags) { if (t.y < prevBottom + 1) t.y = prevBottom + 1; if (t.y < panelT) t.y = panelT; prevBottom = t.y + t.h; }
      let nextTop = panelB + 1;
      for (let i = tags.length - 1; i >= 0; i--) { const t = tags[i]; if (t.y + t.h > nextTop - 1) t.y = nextTop - 1 - t.h; nextTop = t.y; }
      for (const t of tags) {
        const x = panelR - 3 - t.w;
        if (x < panelL || t.y < panelT) { line(Math.max(t.lx, panelL), t.ly, panelR, t.c, t.la, true); continue; }
        d.text(t.t, x, Math.round(t.y) + t.h / 2, { ...sans(TAG_SZ, 600), color: rgba(t.c, t.a) });
      }
    };

    return {
      events,
      under,
      draw: () => {},
      status: (k) => reads(k, false),
      readout: (i) => reads(i, false),
      legend: [
        { label: "Asia 18:00–03:00", color: "rgb(163,61,255)", shape: "line" },
        { label: "London 03:00–09:30", color: "rgb(0,153,153)", shape: "line" },
        { label: "New York 09:30–16:00", color: "rgb(255,196,0)", shape: "line" },
        { label: "Carried forward", color: "rgb(150,150,150)", shape: "dot" },
      ],
    };
  },
};
