import type { Draw, ReadItem, StudyDef, StudyEvent } from "../types";
import { dayNum, hhmm, minuteOfDay } from "../ta";
import { analyse, levelTicksFor, type Analysis } from "./_asl-profile";

/**
 * DS ASL (Advanced Session Levels) — web edition. Source: DSASL.cs (shipped build,
 * DS Complete 2026-10), shipped defaults (ApplyDefaults): FuturesETH preset in New York
 * time — Asia 18:00–03:00 violet, London 03:00–09:30 teal, New York 09:30–16:00 gold
 * (Overnight off); Carry forward NextOpen, After break Fade, Show live ON, Volume
 * profiles ON, Profile days 3, Profile width 15%, Profile opacity 100, Value-area spine
 * ON, POC level ON, HVN / LVN InProfile, Node detail Major, labels + prices at the
 * session end, edge tags ON, Opacity 80, History strength 60, span Solid, carry Dot,
 * serifs ON, drawn behind the candles.
 *
 * PORTED EXACTLY
 *   · DsAslEngine.Feed()/Fold(): a 1-minute bar belongs to a session when its close stamp
 *     is after the start and up to and including the end; a session closes on its end
 *     bar's close (or on the first bar outside it); its high/low are the chart bars' own
 *     extremes; every closed session carries its levels until the same session opens
 *     again (NextOpen), and the first close through a high or low fades the rest of its
 *     line (Fade). The first session on the chart is left out when the data starts
 *     partway through it (ChartPartial).
 *   · DsAslProfile + DsAslAnalysis.Analyse() (see _asl-profile.ts): trades at each price,
 *     each minute's missing volume filled around the bar's typical price, 1-point POC
 *     level (busiest tick inside it), 70% value area grown two levels at a time, Gaussian
 *     smoothing (Major: σ ≥ 2.75% of the span) for HVN / LVN nodes; profile drawn in 2 px
 *     rows (outer 0.30, value area 0.55, POC / HVN levels solid), spine (dotted when > 5%
 *     of the volume is filled in), value-area spine, HVN tips, LVN hairlines with serif,
 *     HVN / LVN captions, the POC as a level carried to the next open and faded once
 *     price trades at it; Profile days 3 newest covered sessions per slot.
 *   · Rendering: brackets with start / end serifs, labels "LONDON HIGH 29420.00" at the
 *     session end (collision shifts), carried dotted lines at 0.65, faded at 0.40, edge
 *     tags "ASIA H / LONDON POC" stacked at the right edge, current sessions at full
 *     strength and older ones at the 60% history strength, colours checked against the
 *     ground (Solve(): mixed toward black/white until a 3:1 contrast).
 *
 * DEVIATIONS
 *   1. Trades: the footprint is the replay's record of the real trades in each minute.
 *      On bars without tick data the tool's own fill (the 1-minute bar spread around its
 *      typical price) is used — exactly what DS ASL does where NinjaTrader's trade history
 *      has a gap — and the spine turns dotted as in the tool.
 *   2. Calculate.OnPriceChange: the forming bar extends the live session's bracket (and
 *      opens a new one on its first tick) as in NinjaTrader; the live profile is drawn
 *      from closed minutes only (the tool adds trades tick by tick). Breaks, POC touches
 *      and events are decided on closed bars.
 *   3. The POC label's placement memory between repaints (LabRel, a UI nicety) is not
 *      kept; the label is placed fresh each paint by the same search (along the line,
 *      clear of candles and profiles).
 *   4. Fonts: the site's mono face at the tool's 9 / 8 px sizes instead of Segoe UI.
 *   5. DS Replay keeps only 5 bars of air right of the newest bar (no chart right margin),
 *      so an edge tag that would sit on a session label falls back to the carried line
 *      running to the edge — the tool's own fallback for a tag with no room.
 *   6. ChartPeriodSec: the live profile's projected width (the session's length in chart bars
 *      x the bar slot, as the .cs counts it with eng.ChartPeriodSec) uses the session's own bar
 *      size, read from its time stamps, instead of assuming one-minute bars. The web showcase
 *      runs DS ASL on a 5-minute chart, where the 60-second count drew a live profile five
 *      times too wide across the candles. Drawing only.
 *   7. Example hygiene (web showcase): a session instance that starts before the first
 *      shown bar (s.replayFrom) — the warm-up session the example reads but never shows —
 *      is not drawn (bracket, profile, POC, labels, tags), narrated or read in the status /
 *      readout, and an OPENS sentence does not quote a previous instance from the warm-up.
 *      The engine still computes every instance (NextOpen, breaks, Profile days) unchanged.
 */

// ------------------------------------------------------------------ shipped constants
const SLOTS = [
  { name: "Asia", up: "ASIA", start: 18 * 3600, end: 3 * 3600, rgb: [163, 61, 255] },
  { name: "London", up: "LONDON", start: 3 * 3600, end: 9 * 3600 + 1800, rgb: [0, 153, 153] },
  { name: "New York", up: "NEW YORK", start: 9 * 3600 + 1800, end: 16 * 3600, rgb: [255, 196, 0] },
] as const;
const OP = 0.80, HIST = 0.60;
const PROJ_A = 0.65, FADE_A = 0.40, TAG_A = 0.90, PRICE_A = 0.85;
const SERIF_PX = 4, MIN_SPAN_SERIF = 8;
const PROFILE_DAYS = 3, PROFILE_WIDTH = 0.15, MIN_REACH = 12, MAX_REACH_SHARE = 0.45, EST_DOT = 0.05, NODE_COL = 3;
const OUTER_A = 0.30, INNER_A = 0.55, STRONG_A = 1.0, BASE_A = 0.22, SPINE_A = 0.75, LVN_A = 0.85, CAPTION_A = 0.80, CAPTION_MIN_REACH = 40;
const NAME_PX = 9, TAG_PX = 8, NAME_H = 12, TAG_H = 11;

type Inst = {
  id: number; slot: number; anchor: number; start: number; end: number;
  closedAt: number; nextOpen: number; partial: boolean;
  breakH: number; breakL: number;
  runH: Float64Array; runL: Float64Array; // running closed high / low from start
  covered: boolean; prof: Analysis | null; pocTouch: number;
};

// ------------------------------------------------------------------ colour (Solve)
const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const contrast = (a: number[], b: number[]) => { const la = lum(a), lb = lum(b); return la > lb ? (la + 0.05) / (lb + 0.05) : (lb + 0.05) / (la + 0.05); };
function solve(c: readonly number[], bg: number[]) {
  const light = lum(bg) > 0.45;
  if (contrast([...c], bg) >= 3) return [...c];
  const to = light ? [0, 0, 0] : [255, 255, 255];
  const mix = (m: number) => [c[0] + (to[0] - c[0]) * m, c[1] + (to[1] - c[1]) * m, c[2] + (to[2] - c[2]) * m];
  let lo = 0, hi = 1;
  for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (contrast(mix(m), bg) >= 3) hi = m; else lo = m; }
  return mix(hi);
}
const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

const fp = (p: number) => (Number.isFinite(p) ? (Math.round(p / 0.25) * 0.25).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-");
/** chart text: NinjaTrader FormatPrice, no thousands separators */
const fpc = (p: number) => (Number.isFinite(p) ? (Math.round(p / 0.25) * 0.25).toFixed(2) : "-");

export const study: StudyDef = {
  slug: "asl", rightMargin: 170,
  name: "DS ASL",
  about: "Asia, London and New York as brackets over their own bars, each with its volume profile, POC, HVN / LVN — levels carried until the session opens again and faded once taken.",
  layers: [
    { id: "profiles", label: "Volume profiles", on: true, hint: "The profile inside each bracket and the POC as a level (Volume profiles: On). Off draws the session levels alone, as DS Session Levels does." },
    { id: "labels", label: "Labels", on: true, hint: "Names and prices at each session's end, and the tags at the right edge." },
  ],
  run(s) {
    const n = s.n, tk = s.tick;
    const levelTicks = levelTicksFor(s.c[0], tk);
    const firstOpenMin = s.t[0] - 1; // RefFirst: the first bar's open
    // ChartPeriodSec (drawing only, DEVIATIONS 6): the bar size the live profile's projected width is counted in
    const chartPeriodSec = (() => { const d: number[] = []; for (let i = 1; i < Math.min(n, 64); i++) { const g = s.t[i] - s.t[i - 1]; if (g > 0) d.push(g); } d.sort((a, b) => a - b); return Math.max(1, d.length ? d[d.length >> 1] : 1) * 60; })();
    // ---------------------------------------------------------------- DsAslEngine.Feed (closed bars)
    const insts: Inst[] = [];
    const bySlot: Inst[][] = SLOTS.map(() => []);
    const cur: (Inst | null)[] = SLOTS.map(() => null);
    const alive: Inst[][] = SLOTS.map(() => []);
    const hi: number[][] = [], lo: number[][] = [];
    const closeInst = (sl: number, idx: number) => {
      const x = cur[sl]!;
      x.closedAt = idx;
      alive[sl].push(x);
      cur[sl] = null;
    };
    for (let idx = 0; idx < n; idx++) {
      const sec = minuteOfDay(s, idx) * 60, day = dayNum(s, idx);
      for (let sl = 0; sl < SLOTS.length; sl++) {
        const S = SLOTS[sl];
        let inWin: boolean, anchor: number;
        if (S.start < S.end) { inWin = sec > S.start && sec <= S.end; anchor = day; }
        else if (sec > S.start) { inWin = true; anchor = day; }
        else if (sec <= S.end) { inWin = true; anchor = day - 1; }
        else { inWin = false; anchor = day; }
        if (!inWin) { if (cur[sl]) closeInst(sl, idx); continue; }
        const c = cur[sl];
        if (c && c.anchor === anchor) { c.end = idx; continue; }
        if (c) closeInst(sl, idx);
        for (const a of alive[sl]) a.nextOpen = idx; // NextOpen: carried levels end at idx - 1
        alive[sl] = [];
        const x: Inst = {
          id: insts.length, slot: sl, anchor, start: idx, end: idx, closedAt: Infinity, nextOpen: Infinity,
          partial: idx === 0 && s.t[idx] - 1 > anchor * 1440 + S.start / 60,
          breakH: Infinity, breakL: Infinity, runH: new Float64Array(0), runL: new Float64Array(0),
          covered: firstOpenMin <= anchor * 1440 + S.start / 60, prof: null, pocTouch: Infinity,
        };
        insts.push(x); bySlot[sl].push(x); cur[sl] = x;
        hi[x.id] = []; lo[x.id] = [];
      }
      // Fold(): the session's own extremes, then breaks of the carried levels
      for (let sl = 0; sl < SLOTS.length; sl++) {
        const c = cur[sl];
        if (c && idx >= c.start && idx <= c.end) {
          const ph = hi[c.id].length ? hi[c.id][hi[c.id].length - 1] : -Infinity, pl = lo[c.id].length ? lo[c.id][lo[c.id].length - 1] : Infinity;
          hi[c.id].push(Math.max(ph, s.h[idx])); lo[c.id].push(Math.min(pl, s.l[idx]));
        }
        for (const a of alive[sl]) {
          const H = hi[a.id][hi[a.id].length - 1], L = lo[a.id][lo[a.id].length - 1];
          if (a.breakH === Infinity && s.c[idx] > H) a.breakH = idx;
          if (a.breakL === Infinity && s.c[idx] < L) a.breakL = idx;
        }
      }
      // a bar stamped exactly at the session's end closes it on its close
      for (let sl = 0; sl < SLOTS.length; sl++) {
        const c = cur[sl];
        if (c && c.end === idx && sec === SLOTS[sl].end) closeInst(sl, idx);
      }
    }
    for (const x of insts) { x.runH = Float64Array.from(hi[x.id]); x.runL = Float64Array.from(lo[x.id]); }

    // final profiles of closed sessions, and when price first traded back at each POC
    for (const x of insts) {
      if (x.partial || !x.covered || x.closedAt === Infinity) continue;
      x.prof = analyse(s, x.start, x.end, levelTicks, true);
      if (x.prof.empty) { x.prof = null; continue; }
      const poc = x.prof.poc * tk, stop = Math.min(n - 1, x.nextOpen === Infinity ? n - 1 : x.nextOpen - 1);
      for (let i = x.end + 1; i <= stop; i++) if (s.h[i] >= poc && s.l[i] <= poc) { x.pocTouch = i; break; }
    }

    // ---------------------------------------------------------------- views at the cursor
    const live = (x: Inst, k: number) => x.closedAt > k;
    const endAt = (x: Inst, k: number) => Math.min(x.end, k);
    const highAt = (x: Inst, k: number) => x.runH[endAt(x, k) - x.start];
    const lowAt = (x: Inst, k: number) => x.runL[endAt(x, k) - x.start];
    const inAlive = (x: Inst, k: number) => !live(x, k) && x.nextOpen > k;
    const lastOf = (sl: number, k: number) => { const L = bySlot[sl]; let j = L.length - 1; while (j >= 0 && L[j].start > k) j--; return j; };
    const isCurrent = (x: Inst, k: number) => {
      if (live(x, k) || inAlive(x, k)) return true;
      const j = lastOf(x.slot, k);
      const L = bySlot[x.slot];
      return j >= 0 && L[j] === x && !live(L[j], k);
    };
    // Profile days: the 3 newest covered profiles of each slot that exist at k
    const cutoff = (sl: number, k: number) => {
      let cnt = 0, cut = Infinity;
      const L = bySlot[sl];
      for (let j = lastOf(sl, k); j >= 0 && cnt < PROFILE_DAYS; j--) if (L[j].covered) { cut = L[j].anchor; cnt++; }
      return cut;
    };
    const liveCache = new Map<number, Analysis | null>();
    const profileAt = (x: Inst, k: number): Analysis | null => {
      if (x.partial || !x.covered || k < x.start) return null;
      const e = endAt(x, k);
      if (e === x.end && x.prof) return x.prof;
      const key = x.id * 100000 + e;
      if (liveCache.has(key)) return liveCache.get(key)!;
      const a = analyse(s, x.start, e, levelTicks, true);
      const r = a.empty ? null : a;
      if (liveCache.size > 64) liveCache.clear();
      liveCache.set(key, r);
      return r;
    };

    // ---------------------------------------------------------------- events
    const events: StudyEvent[] = [];
    const from = s.replayFrom - 1;
    /** example hygiene (DEVIATIONS 7): an instance from the hidden warm-up */
    const warm = (x: Inst) => x.start < s.replayFrom;
    for (const x of insts) {
      if (x.partial || warm(x)) continue;
      const S = SLOTS[x.slot];
      const H = x.runH[x.runH.length - 1], L = x.runL[x.runL.length - 1];
      if (x.start >= from) {
        const prev = bySlot[x.slot][bySlot[x.slot].indexOf(x) - 1];
        events.push({
          i: x.start, price: s.o[x.start], title: `${S.up} OPENS`, tone: x.slot === 2 ? "gold" : "neutral", weight: 1,
          text: `${hhmm(s, x.start)} — the ${S.name} bracket starts on its first bar (the ${S.name === "New York" ? "09:30" : S.name === "London" ? "03:00" : "18:00"} open); its high, low and profile move with price until it closes.${prev && !prev.partial && !warm(prev) ? ` The previous ${S.up} HIGH ${fp(prev.runH[prev.runH.length - 1])} and LOW ${fp(prev.runL[prev.runL.length - 1])} stop carrying here.` : ""}`,
        });
      }
      if (x.closedAt !== Infinity && x.closedAt >= from) {
        const p = x.prof;
        events.push({
          i: x.closedAt, price: H, title: `${S.up} CLOSED`.slice(0, 28), tone: "neutral", weight: 2,
          text: `${hhmm(s, x.closedAt)} — ${S.name} closes: ${S.up} HIGH ${fp(H)} and ${S.up} LOW ${fp(L)} are final${p ? `, with the POC at ${fp(p.poc * tk)} (value area ${fp(p.vaLo * tk)} – ${fp(p.vaHi * tk)})` : ""}. The levels carry forward dotted until ${S.name} opens again.`,
        });
      }
      for (const [bar, isHigh] of [[x.breakH, true], [x.breakL, false]] as [number, boolean][]) {
        if (bar === Infinity || bar < from) continue;
        const lvl = isHigh ? H : L;
        events.push({
          i: bar, price: lvl, title: `${S.up} ${isHigh ? "HIGH" : "LOW"} TAKEN`, tone: isHigh ? "bull" : "bear", weight: 3,
          text: `${hhmm(s, bar)} — a close at ${fp(s.c[bar])}, ${isHigh ? "above" : "below"} the ${S.up} ${isHigh ? "HIGH" : "LOW"} ${fp(lvl)}. From this bar the rest of its dotted line fades; it stays on the chart until ${S.name} opens again.`,
        });
      }
      if (x.prof && x.pocTouch !== Infinity && x.pocTouch >= from) {
        // drawn only while the session is inside Profile days
        if (x.anchor >= cutoff(x.slot, x.pocTouch)) {
          const poc = x.prof.poc * tk;
          events.push({
            i: x.pocTouch, price: poc, title: `AT THE ${S.up} POC`, tone: "gold", weight: 2,
            text: `${hhmm(s, x.pocTouch)} — price traded at the ${S.up} POC ${fp(poc)}, the busiest 1-point level of ${S.name}'s profile, for the first time since the session closed. Its carried line fades from here.`,
          });
        }
      }
    }
    events.sort((a, b) => a.i - b.i || (b.weight ?? 1) - (a.weight ?? 1));

    // ---------------------------------------------------------------- drawing (all behind the candles)
    const under = (d: Draw) => {
      const ctx = d.ctx, pv = d.price, th = d.th;
      const k = d.k, lv = d.live;
      const bg = hexRgb(th.bg);
      const cols = SLOTS.map((S) => solve(S.rgb, bg));
      const rgba = (sl: number, a: number) => `rgba(${Math.round(cols[sl][0])},${Math.round(cols[sl][1])},${Math.round(cols[sl][2])},${Math.max(0, Math.min(1, a))})`;
      const half = Math.max(0.5, d.bw / 2);
      const panelL = 0, panelR = d.plotRight, panelT = pv.top, panelB = pv.bottom;
      const lastI = lv ? lv.i : k;
      const Y = (v: number) => pv.y(v);
      const snap = (v: number) => Math.round(v) + 0.5;
      const xBefore = (b: number) => d.x(b) - half;
      const xAfter = (b: number) => d.x(b) + half;
      const labels = d.on("labels"), profOn = d.on("profiles");
      const placed: [number, number, number, number][] = [];
      const profRects: [number, number, number, number][] = [];
      const hit = (r: [number, number, number, number][], x: number, y: number, w: number, h: number) => r.some((q) => x < q[0] + q[2] && x + w > q[0] && y < q[1] + q[3] && y + h > q[1]);
      const hline = (x1: number, y: number, x2: number, col: string, dash?: number[]) => {
        if (x2 - x1 < 0.5) return;
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1; if (dash) ctx.setLineDash(dash);
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.restore();
      };
      const DOT = [1, 2];
      type Tag = { y: number; w: number; text: string; col: string; lx: number; ly: number; la: number; lineCol: string };
      const tags: Tag[] = [];
      const addTag = (text: string, y: number, sl: number, a: number, lineA: number) => {
        if (!labels) return 0;
        const w = d.measure(text, { size: TAG_PX, weight: 600 });
        tags.push({ y: y - TAG_H / 2, w, text, col: rgba(sl, a), lx: panelR - 3 - w - 4, ly: y, la: lineA, lineCol: rgba(sl, lineA) });
        return w;
      };
      // the live view of a session: the forming bar extends the one it belongs to (OnPriceChange)
      const view = (x: Inst) => {
        let isLive = live(x, k), e: number, H: number, L: number;
        if (x.start > k) { e = lv ? lv.i : k; H = lv ? lv.h : NaN; L = lv ? lv.l : NaN; } // opened on the forming bar's first tick
        else { e = endAt(x, k); H = highAt(x, k); L = lowAt(x, k); }
        if (lv && x.start < lv.i && lv.i <= x.end && isLive) { e = lv.i; H = Math.max(H, lv.h); L = Math.min(L, lv.l); }
        let projEnd = x.nextOpen <= k ? x.nextOpen - 1 : -1;
        if (lv && x.nextOpen === lv.i) projEnd = lv.i - 1;
        if (lv && x.closedAt === lv.i && x.end < lv.i) isLive = false; // the forming bar is outside it: closed on its first tick
        return { isLive, e, H, L, projEnd, bH: x.breakH <= k ? x.breakH : -1, bL: x.breakL <= k ? x.breakL : -1 };
      };
      const exists = (x: Inst) => x.start <= k || (lv !== null && x.start === lv.i);
      const openedLive = SLOTS.map((_, sl) => (lv ? bySlot[sl].some((q) => q.start === lv.i) : false));
      const current = (x: Inst) => (openedLive[x.slot] ? x.start === lv!.i : isCurrent(x, k));
      const reach = (x: Inst, v: ReturnType<typeof view>) => (v.isLive ? v.e : v.projEnd < 0 ? Infinity : Math.max(v.projEnd, v.e));
      const air = () => {
        const pw = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
        const ah = Math.max(1, pw * 0.5) + 1;
        const iEnd = Math.min(lastI, d.i1), xi0 = d.x(d.i0);
        return (x: number, y: number, w: number, h: number) => {
          if (hit(placed, x, y, w, h) || hit(profRects, x, y, w, h)) return false;
          for (let i = Math.max(d.i0, d.i0 + Math.floor((x - ah - xi0) / d.bw)); i <= iEnd; i++) {
            const cx = d.x(i);
            if (cx + ah < x) continue;
            if (cx - ah > x + w) break;
            const hh = lv && i === lv.i ? lv.h : s.h[i], ll = lv && i === lv.i ? lv.l : s.l[i];
            if (Y(hh) - 1 <= y + h && Y(ll) + 1 >= y) return false;
          }
          return true;
        };
      };
      const clearAir = air();

      // ---- ProfilesPass
      const profDrawn = new Map<number, { x0: number; lsp: number; tips: [number, number][]; lvnY: number[] }>();
      if (profOn) for (let sl = 0; sl < SLOTS.length; sl++) {
        const L = bySlot[sl], cut = cutoff(sl, k);
        for (let j = L.length - 1; j >= 0; j--) {
          const x = L[j];
          if (!exists(x)) continue;
          if (x.end < d.i0 - 1) break;
          if (x.partial || x.anchor < cut || warm(x)) continue;
          const v = view(x);
          const p = profileAt(x, k);
          if (!p) continue;
          const strength = current(x) ? 1 : HIST;
          const xs = xBefore(x.start), xe = v.isLive ? d.x(v.e) + half : xAfter(x.end);
          if (xe <= panelL + 2 || xs >= panelR) continue;
          const x0 = Math.round(Math.max(xs, panelL + 1));
          let full = xe - xs;
          if (v.isLive) { let dur = SLOTS[sl].end - SLOTS[sl].start; if (dur <= 0) dur += 86400; full = Math.max(full, Math.ceil(dur / chartPeriodSec) * 2 * half); }
          let rch = PROFILE_WIDTH * full;
          const cap = MAX_REACH_SHARE * (xs + full - x0);
          if (rch > cap) rch = cap;
          const lsp = Math.floor(rch);
          if (lsp < MIN_REACH || !(p.levelMax > 0)) continue;
          const yHi = Y(p.spanHi * tk), yLo = Y(p.spanLo * tk);
          if (yLo < panelT || yHi > panelB) continue;
          const op = OP * 1.0 * strength;
          const lt = p.levelTicks, lb = p.levelBase, le = p.levelBase + p.levelVol.length - 1;
          const vaA = Math.floor(p.vaLo / lt), vaB = Math.floor(p.vaHi / lt);
          const yPoc = Math.round(Y(p.poc * tk));
          let y0 = Math.ceil(Math.max(yHi, panelT - 2));
          if (((y0 - yPoc) & 1) !== 0) y0++;
          const y1 = Math.floor(Math.min(yLo, panelB + 2));
          if (y1 < y0) continue;
          const rows = Math.floor((y1 - y0) / 2) + 1;
          const hvnLvl = p.hvn.map((h) => Math.floor(h / lt));
          const hvnRow = p.hvn.map((h) => Math.round((Y(h * tk) - 0.5 - y0) / 2));
          const rowLen = new Float32Array(rows);
          const fills: [string, number[]][] = [[rgba(sl, op * OUTER_A), []], [rgba(sl, op * INNER_A), []], [rgba(sl, op * STRONG_A), []]];
          for (let r = 0; r < rows; r++) {
            const y = y0 + 2 * r;
            let kHi = Math.floor(pv.v(y) / tk + 1e-7), kLo = Math.floor(pv.v(y + 2) / tk + 1e-7) + 1;
            if (kLo > kHi) { kLo = Math.round(pv.v(y + 1) / tk); kHi = kLo; }
            if (kLo < p.spanLo) kLo = p.spanLo;
            if (kHi > p.spanHi) kHi = p.spanHi;
            if (kLo > kHi) continue;
            let ja = Math.floor(kLo / lt), jz = Math.floor(kHi / lt);
            if (ja < lb) ja = lb; if (jz > le) jz = le;
            let jBest = NaN, vv = 0;
            for (let jj = ja; jj <= jz; jj++) { const q = p.levelVol[jj - lb]; if (q > vv) { vv = q; jBest = jj; } }
            if (Number.isNaN(jBest)) continue;
            const len = lsp * vv / p.levelMax;
            if (len < 0.5) continue;
            rowLen[r] = len;
            let hvn = jBest !== p.pocLevel && hvnLvl.includes(jBest);
            const strong = jBest === p.pocLevel || hvn;
            if (hvn && !hvnRow.includes(r)) hvn = false;
            const bold = hvn || y === yPoc;
            const bucket = strong ? 2 : jBest >= vaA && jBest <= vaB ? 1 : 0;
            fills[bucket][1].push(y, len, bold ? 2 : 1);
          }
          for (const [col, arr] of fills) {
            if (!arr.length) continue;
            ctx.fillStyle = col;
            for (let q = 0; q < arr.length; q += 3) ctx.fillRect(x0 + 1, arr[q], arr[q + 1], arr[q + 2]);
          }
          profRects.push([x0, Math.max(yHi, panelT) - 1, lsp + NODE_COL + 2, Math.min(yLo, panelB) - Math.max(yHi, panelT) + 2]);
          const xb = x0 + 0.5, by0 = Math.max(yHi, panelT), by1 = Math.min(yLo, panelB);
          const vline = (xx: number, a: number, b: number, col: string, dash?: number[]) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(xx, a); ctx.lineTo(xx, b); ctx.stroke(); ctx.restore(); };
          if (by1 > by0) vline(xb, by0, by1, rgba(sl, op * BASE_A), p.fillShare > EST_DOT ? [1, 2] : undefined);
          const v0 = Math.max(Y(p.vaHi * tk + tk / 2), panelT), v1 = Math.min(Y(p.vaLo * tk - tk / 2), panelB);
          if (v1 > v0) vline(xb, v0, v1, rgba(sl, op * SPINE_A));
          const tips: [number, number][] = [], lvnY: number[] = [];
          for (const h of p.hvn) {
            const r = Math.round((Y(h * tk) - 0.5 - y0) / 2);
            if (r < 0 || r >= rows || rowLen[r] <= 0) continue;
            tips.push([rowLen[r], y0 + 2 * r]);
          }
          for (const l of p.lvn) {
            const yl = Y(l * tk) - 0.5;
            let yr = Math.round(yl);
            if (((yr - y0) & 1) === 0) yr += yl >= yr ? 1 : -1;
            if (yr < y0 - 1 || yr > y1 + 1) continue;
            lvnY.push(yr);
          }
          for (const [tx0, ty] of tips) {
            const tx = Math.round(x0 + 1 + tx0) + 0.5;
            if (tx > panelR || ty < panelT || ty > panelB) continue;
            vline(tx, ty - 2, ty + 4, rgba(sl, op));
          }
          const lx = x0 + lsp + NODE_COL + 0.5;
          for (const yy of lvnY) {
            const ly = yy + 0.5;
            if (ly < panelT || ly > panelB) continue;
            hline(x0 + 1, ly, lx, rgba(sl, op * LVN_A));
            if (lx <= panelR) vline(lx, ly - 2.5, ly + 2.5, rgba(sl, op * LVN_A));
          }
          profDrawn.set(x.id, { x0, lsp, tips, lvnY });
        }
      }

      // ---- DrawInstance: brackets, carried lines, serifs, labels
      const pastProfiles = (x: number, top: number, w: number, h: number, limit: number) => {
        let nx = x;
        for (let it = 0; it < 4; it++) {
          let moved = false;
          for (const r of profRects) if (nx < r[0] + r[2] && nx + w > r[0] && top < r[1] + r[3] && top + h > r[1]) { nx = r[0] + r[2] + 3; moved = true; }
          if (!moved) break;
        }
        return nx + w <= limit - 3 ? nx : x;
      };
      const label = (sl: number, name: string, price: string, xs: number, xe: number, extent: number, xBreak: number, y: number, above: boolean, strength: number) => {
        if (!labels) return;
        const wN = d.measure(name, { size: NAME_PX, weight: 600 }), h = NAME_H;
        let wP = d.measure(price, { size: NAME_PX }), withP = true;
        const gap = 6, spanW = xe - xs;
        let total = wN + gap + wP;
        if (total + 6 > spanW) { withP = false; total = wN; wP = 0; }
        if (total + 6 > spanW) return;
        let xl = xe - 3 - total, a = strength;
        if (xl < panelL + 3 && extent > panelL + 4 + total) {
          xl = pastProfiles(panelL + 4, above ? y - 2 - h : y + 3, total, h, extent);
          if (xl >= xe) { a = strength * PROJ_A; if (xBreak >= 0 && xBreak <= xl) a = strength * FADE_A; }
        }
        if (xl < panelL || xl + total > panelR) return;
        let top = above ? y - 2 - h : y + 3;
        for (let t = 0; t < 4 && hit(placed, xl, top, total, h); t++) top += above ? -(h + 1) : h + 1;
        if (top < panelT || top + h > panelB) return;
        placed.push([xl, top, total, h]);
        d.text(name, xl, top + h / 2, { size: NAME_PX, weight: 600, color: rgba(sl, a) });
        if (withP) d.text(price, xl + wN + gap, top + h / 2, { size: NAME_PX, color: rgba(sl, a * PRICE_A) });
      };
      for (let sl = 0; sl < SLOTS.length; sl++) {
        const L = bySlot[sl];
        for (let j = L.length - 1; j >= 0; j--) {
          const x = L[j];
          if (!exists(x)) continue;
          const v = view(x);
          if (reach(x, v) < d.i0) break;
          if (x.partial || warm(x)) continue;
          const strength = OP * (current(x) ? 1 : HIST);
          const S = SLOTS[sl];
          const xs = xBefore(x.start);
          let xe = v.isLive ? d.x(v.e) + half : xAfter(x.end);
          if (xe < xs) xe = xs;
          const yH = snap(Y(v.H)), yL = snap(Y(v.L));
          const hOn = yH >= panelT && yH <= panelB, lOn = yL >= panelT && yL <= panelB;
          const proj = !v.isLive;
          let xEndH = xe, xEndL = xe, edgeH = false, edgeL = false;
          if (proj) {
            if (v.projEnd < 0) { xEndH = xEndL = panelR; edgeH = edgeL = true; }
            else xEndH = xEndL = xAfter(Math.min(v.projEnd, lastI));
          }
          let twH = 0, twL = 0;
          if (proj) {
            if (edgeH && hOn) twH = addTag(`${S.up} H`, yH, sl, strength * (v.bH >= 0 ? FADE_A : TAG_A), strength * (v.bH >= 0 ? FADE_A : PROJ_A));
            if (edgeL && lOn) twL = addTag(`${S.up} L`, yL, sl, strength * (v.bL >= 0 ? FADE_A : TAG_A), strength * (v.bL >= 0 ? FADE_A : PROJ_A));
          }
          if (twH > 0) xEndH = Math.min(xEndH, panelR - 3 - twH - 4);
          if (twL > 0) xEndL = Math.min(xEndL, panelR - 3 - twL - 4);
          const spanVisible = xe >= panelL && xs <= panelR;
          if (spanVisible) {
            const x1 = Math.max(xs, panelL), x2 = Math.min(xe, panelR);
            if (hOn) hline(x1, yH, x2, rgba(sl, strength));
            if (lOn) hline(x1, yL, x2, rgba(sl, strength));
          }
          const carry = (xTo: number, y: number, bBar: number) => {
            if (xTo <= xe) return;
            let xb = xTo;
            if (bBar >= 0) xb = Math.max(xe, Math.min(xTo, d.x(bBar)));
            const p1 = Math.max(xe, panelL), p2 = Math.min(xb, panelR);
            if (p2 > p1) hline(p1, y, p2, rgba(sl, strength * PROJ_A), DOT);
            if (bBar >= 0) { const q1 = Math.max(xb, panelL), q2 = Math.min(xTo, panelR); if (q2 > q1) hline(q1, y, q2, rgba(sl, strength * FADE_A), DOT); }
          };
          if (proj) { if (hOn) carry(xEndH, yH, v.bH); if (lOn) carry(xEndL, yL, v.bL); }
          if (spanVisible && xe - xs >= MIN_SPAN_SERIF && yL - yH >= SERIF_PX + 2) {
            const xa = snap(xs), xbb = snap(xe) - 1, col = rgba(sl, strength);
            const hTip = Math.min(yH + SERIF_PX, panelB), lTip = Math.max(yL - SERIF_PX, panelT);
            const tick = (xx: number, a: number, b: number) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xx, a); ctx.lineTo(xx, b); ctx.stroke(); ctx.restore(); };
            if (xa >= panelL && xa <= panelR) { if (hOn) tick(xa, yH, hTip); if (lOn) tick(xa, yL, lTip); }
            if (!v.isLive && xbb >= panelL && xbb <= panelR) { if (hOn) tick(xbb, yH, hTip); if (lOn) tick(xbb, yL, lTip); }
          }
          const extH = Math.max(xe, xEndH), extL = Math.max(xe, xEndL);
          const xBH = proj && v.bH >= 0 ? d.x(v.bH) : -1, xBL = proj && v.bL >= 0 ? d.x(v.bL) : -1;
          if (hOn) label(sl, `${S.up} HIGH`, fpc(v.H), xs, xe, extH, xBH, yH, true, strength);
          if (lOn) label(sl, `${S.up} LOW`, fpc(v.L), xs, xe, extL, xBL, yL, false, strength);
        }
      }

      // ---- PocPass: the POC as a level, and the HVN / LVN captions
      if (profOn) for (let sl = 0; sl < SLOTS.length; sl++) {
        const L = bySlot[sl], cut = cutoff(sl, k), S = SLOTS[sl];
        for (let j = L.length - 1; j >= 0; j--) {
          const x = L[j];
          if (!exists(x)) continue;
          if (x.anchor < cut) break;
          if (x.partial || warm(x)) continue;
          const v = view(x);
          const end = v.isLive ? v.e : v.projEnd;
          if (end >= 0 && end < d.i0 - 1) break;
          const strength = OP * (current(x) ? 1 : HIST);
          const p = profileAt(x, k);
          if (!p) continue;
          const pd = profDrawn.get(x.id);
          const price = p.poc * tk, y = snap(Y(price));
          if (y >= panelT && y <= panelB) {
            const xs = xBefore(x.start);
            let xe = v.isLive ? d.x(v.e) + half : xAfter(x.end);
            if (xe < xs) xe = xs;
            const xStart = pd ? pd.x0 + pd.lsp + NODE_COL : xs;
            const proj = !v.isLive;
            const touch = proj && x.pocTouch <= k ? x.pocTouch : -1;
            const taken = proj && touch >= 0;
            let xEnd = xe, edge = false;
            if (proj) { if (end < 0) { xEnd = panelR; edge = true; } else xEnd = xAfter(Math.min(end, lastI)); }
            const spanA = strength;
            if (edge) { const tw = addTag(`${S.up} POC`, y, sl, strength * (taken ? FADE_A : TAG_A), spanA * (taken ? FADE_A : PROJ_A)); if (tw > 0) xEnd = Math.min(xEnd, panelR - 3 - tw - 4); }
            const x1 = Math.max(xStart, panelL), x2 = Math.min(xe, panelR);
            if (x2 > x1) hline(x1, y, x2, rgba(sl, spanA));
            if (proj && xEnd > xe) {
              let xb = xEnd;
              if (taken) xb = Math.max(xe, Math.min(xEnd, d.x(touch)));
              const p1 = Math.max(xe, panelL), p2 = Math.min(xb, panelR);
              if (p2 > p1) hline(p1, y, p2, rgba(sl, spanA * PROJ_A), DOT);
              if (taken) { const q1 = Math.max(xb, panelL), q2 = Math.min(xEnd, panelR); if (q2 > q1) hline(q1, y, q2, rgba(sl, spanA * FADE_A), DOT); }
            }
            // VolumeLabel: along the line, clear of candles, profiles and other labels
            if (labels) {
              const name = `${S.up} POC`, pr = fpc(price), h = NAME_H, gap = 6;
              const wN = d.measure(name, { size: NAME_PX, weight: 600 }), full = wN + gap + d.measure(pr, { size: NAME_PX });
              const xsL = Math.max(xs, xStart), extent = Math.max(xe, xEnd);
              const a0 = Math.max(xsL + 3, panelL + 4), a1 = Math.min(extent, panelR) - 3;
              const tA = y - 2 - h, tB = y + 3;
              let xl = NaN, top = 0, total = full, withP = true;
              const along = (w: number, ta: number, tb: number) => {
                const hiX = a1 - w;
                if (hiX < a0) return false;
                const xn = Math.max(a0, Math.min(hiX, xe - 3 - w));
                const nMax = Math.floor((hiX - a0) / 6) + 2;
                for (let jj = 0; jj <= nMax; jj++) for (let dir = 0; dir < 2; dir++) {
                  if (jj === 0 && dir === 1) continue;
                  const xp = Math.round(xn + (dir === 0 ? -jj : jj) * 6);
                  if (xp < a0 || xp > hiX) continue;
                  for (const tp of [ta, tb]) {
                    if (tp < panelT || tp + h > panelB) continue;
                    if (clearAir(xp, tp, w, h)) { xl = xp; top = tp; return true; }
                  }
                }
                return false;
              };
              for (let pass = 0; pass < 4 && Number.isNaN(xl); pass++) {
                const tw = pass === 3 ? wN : full;
                if (pass === 1) {
                  const xp = Math.round(a1 + 4), tp = Math.round(y - h / 2);
                  if (xp + tw <= panelR - 2 && tp >= panelT && tp + h <= panelB && clearAir(xp, tp, tw, h)) { xl = xp; top = tp; total = tw; }
                  continue;
                }
                if (along(tw, pass === 2 ? tA - h - 1 : tA, pass === 2 ? tB + h + 1 : tB)) { total = tw; withP = pass !== 3; }
              }
              if (!Number.isNaN(xl)) {
                let a = strength;
                if (proj && xl >= xe) { a = strength * PROJ_A; if (taken && d.x(touch) <= xl) a = strength * FADE_A; }
                placed.push([xl, top, total, h]);
                d.text(name, xl, top + h / 2, { size: NAME_PX, weight: 600, color: rgba(sl, a) });
                if (withP) d.text(pr, xl + wN + gap, top + h / 2, { size: NAME_PX, color: rgba(sl, a * PRICE_A) });
              }
            }
          }
          // NodeCaptions
          if (labels && pd && pd.lsp >= CAPTION_MIN_REACH) {
            const a = strength * 1.0 * CAPTION_A, cx = Math.round(pd.x0 + pd.lsp + NODE_COL + 5);
            for (let pass = 0; pass < 2; pass++) {
              const t = pass === 0 ? "HVN" : "LVN", w = d.measure(t, { size: TAG_PX, weight: 600 }), h = TAG_H;
              const ys = pass === 0 ? pd.tips.map((q) => q[1] + 1) : pd.lvnY.map((q) => q + 0.5);
              for (const yc of ys) {
                const top = Math.round(yc - h / 2);
                if (cx < panelL || cx + w > panelR || top < panelT || top + h > panelB) continue;
                if (!clearAir(cx, top, w, h)) continue;
                placed.push([cx, top, w, h]);
                d.text(t, cx, top + h / 2, { size: TAG_PX, weight: 600, color: rgba(sl, a) });
              }
            }
          }
        }
      }

      // ---- DrawTags: the right-edge tags, stacked without overlap
      tags.sort((a, b) => a.y - b.y);
      let prevBottom = -Infinity;
      for (const t of tags) { if (t.y < prevBottom + 1) t.y = prevBottom + 1; if (t.y < panelT) t.y = panelT; prevBottom = t.y + TAG_H; }
      let nextTop = panelB + 1;
      for (let q = tags.length - 1; q >= 0; q--) { const t = tags[q]; if (t.y + TAG_H > nextTop - 1) t.y = nextTop - 1 - TAG_H; nextTop = t.y; }
      for (const t of tags) {
        const x = panelR - 3 - t.w;
        // the tool's own fallback (a tag that has no room becomes the line) also when a session label sits there — DS Replay has no right margin
        if (x < panelL || t.y < panelT || hit(placed, x, t.y, t.w, TAG_H)) { hline(Math.max(t.lx, panelL), t.ly, panelR, t.lineCol, DOT); continue; }
        d.text(t.text, x, Math.round(t.y) + TAG_H / 2, { size: TAG_PX, weight: 600, color: t.col });
      }
    };

    // ---------------------------------------------------------------- status / readout
    const levelRead = (x: Inst, k: number) => {
      const H = highAt(x, k), L = lowAt(x, k);
      const tH = x.breakH <= k ? " taken" : "", tL = x.breakL <= k ? " taken" : "";
      return `H ${fp(H)}${tH} · L ${fp(L)}${tL}`;
    };
    const status = (k: number): ReadItem[] => {
      const out: ReadItem[] = [];
      for (const sl of [2, 1, 0]) {
        const j = lastOf(sl, k);
        if (j < 0) continue;
        const x = bySlot[sl][j];
        if (x.partial || warm(x)) continue;
        const S = SLOTS[sl];
        if (live(x, k)) out.push({ label: S.name, value: `LIVE · H ${fp(highAt(x, k))} · L ${fp(lowAt(x, k))}`, tone: sl === 2 ? "gold" : "neutral" });
        else out.push({ label: S.name, value: levelRead(x, k), tone: x.breakH <= k ? "bull" : x.breakL <= k ? "bear" : "neutral" });
      }
      // the newest closed POCs still carried
      for (const sl of [1, 0, 2]) {
        const L = bySlot[sl];
        for (let j = lastOf(sl, k); j >= 0; j--) {
          const x = L[j];
          if (live(x, k) || !x.prof || !inAlive(x, k) || warm(x)) continue;
          out.push({ label: `${SLOTS[sl].name} POC`, value: `${fp(x.prof.poc * tk)}${x.pocTouch <= k ? " · traded at" : ""}`, tone: x.pocTouch <= k ? "neutral" : "gold" });
          break;
        }
        if (out.length >= 6) break;
      }
      return out.slice(0, 6);
    };
    const readout = (i: number): ReadItem[] => {
      const out: ReadItem[] = [];
      for (let sl = 0; sl < SLOTS.length; sl++) {
        const L = bySlot[sl];
        const j = lastOf(sl, i);
        if (j < 0) continue;
        const x = L[j];
        if (x.partial || warm(x)) continue;
        if (live(x, i)) out.push({ label: `In session`, value: `${SLOTS[sl].up} · H ${fp(highAt(x, i))} · L ${fp(lowAt(x, i))}`, tone: "gold" });
        else if (inAlive(x, i)) out.push({ label: SLOTS[sl].name, value: levelRead(x, i) });
      }
      return out;
    };

    return {
      events,
      under,
      draw: () => {},
      status: (k) => status(k),
      readout,
      legend: [
        { label: "Asia 18:00–03:00", color: "rgb(163,61,255)", shape: "line" },
        { label: "London 03:00–09:30", color: "rgb(0,153,153)", shape: "line" },
        { label: "New York 09:30–16:00", color: "rgb(255,196,0)", shape: "line" },
        { label: "Carried to the next open", color: "rgb(160,160,160)", shape: "dash" },
      ],
    };
  },
};
