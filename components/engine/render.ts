import type { Draw, LiveBar, PaneSpec, PaneView, Session, StudyDef, StudyRun, TextOpts, Theme } from "./types";
import { alpha, toneColor } from "./theme";
import { hhmm, minuteOfDay } from "./ta";

/**
 * The painter. Pure canvas, no React: Engine.tsx owns the state and calls
 * paint() whenever the cursor, the view, the hover or the theme changes.
 *
 * Layout (CSS px):  [ panes ......................... | price axis ]
 *                   [ time axis ...................... |            ]
 * The price pane sits on top; the study's own panes stack under it in the
 * order it declares them, each with its own scale, title and axis.
 */

export const AXIS_W = 74;
export const TIME_H = 24;
const SEP = 1;
const FONT_MONO = "var(--font-mono)";

/**
 * The camera. It is independent of the replay cursor: the chart opens on the
 * finished example ("home": every bar of it on stage, one steady scale), and the
 * visitor can move it like a NinjaTrader chart (drag the chart to scroll, drag
 * the time axis to change bar spacing, drag the price axis to scale price,
 * double-click to reset). Replay moves the cursor, never the camera, except
 * that a camera parked at the newest bar keeps riding it (`follow`).
 */
export type View = {
  /** the whole example on stage (the opening view; double-click returns to it) */
  home?: boolean;
  /** right edge of the plot, in bars (fractional; may run past the newest bar) */
  right: number;
  /** px per bar */
  bw: number;
  /** the right edge rides the newest bar (+ the study's runway) */
  follow: boolean;
  /** price scale from what is in view (default); false = the visitor's own range */
  yAuto?: boolean;
  yLo?: number;
  yHi?: number;
};

/** the opening camera's narrowest bar: down to it the whole example opens on stage (a phone
 *  included — a pinch or a drag on the time axis zooms in); below it the camera rides the newest bar */
export const HOME_MIN_BW = 1.6;

export type Hover = { x: number; y: number } | null;

export type PaintState = {
  s: Session;
  def: StudyDef;
  run: StudyRun;
  th: Theme;
  k: number;
  live: LiveBar | null;
  view: View;
  hover: Hover;
  layers: Record<string, boolean>;
  focus: { i: number; price?: number; at: number } | null;
  fonts: { mono: string; sans: string };
  now: number;
  /** the example's moments (numbered pins at the foot of the price pane) */
  marks?: { i: number; tone: string }[];
  /** bar size label, e.g. "1 min" */
  tfLabel?: string;
};

export type Geometry = {
  W: number; H: number; plotRight: number;
  /** the home camera with the whole example on stage */
  stage: boolean;
  /** x of the example's first bar's left edge (nothing is drawn left of it) */
  xStart: number;
  panes: PaneView[];
  i0: number; i1: number; bw: number; right: number;
  x: (i: number) => number;
  iAt: (x: number) => number;
};

function niceStep(range: number, px: number, minPx: number, tick: number) {
  const raw = (range / Math.max(1, px)) * minPx;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  let st = mag;
  for (const m of [1, 2, 2.5, 5, 10]) { st = m * mag; if (st >= raw) break; }
  return Math.max(st, tick);
}

/** px of air right of the newest bar (the study's runway, capped at a third of the plot) */
export function padPx(def: StudyDef, plotRight: number, bw: number) {
  return Math.max(Math.min(5 * bw, 40), Math.min(def.rightMargin ?? 0, plotRight * 0.34), 24);
}
/** bars of air right of the newest bar */
export function padBars(def: StudyDef, plotRight: number, bw: number) {
  return padPx(def, plotRight, bw) / bw;
}

/** right edge (in bars) of a camera following the newest bar: pinned to the first bar until the plot is full */
export function followRight(def: StudyDef, start: number, lastIdx: number, plotRight: number, bw: number) {
  return Math.max(lastIdx + padBars(def, plotRight, bw), start - 1.5 + plotRight / bw);
}

/** The home price range: every bar of the example and everything the study keeps
 *  in view at any point of it, so the scale never moves while the example plays. */
const homeRange = new WeakMap<StudyRun, Map<string, [number, number]>>();
function homeExtent(st: PaintState): [number, number] {
  const { s, run } = st;
  const key = `${s.replayFrom}:${s.n}`;
  let m = homeRange.get(run); if (!m) { m = new Map(); homeRange.set(run, m); }
  const hit = m.get(key); if (hit) return hit;
  let lo = Infinity, hi = -Infinity;
  for (let i = s.replayFrom; i < s.n; i++) { if (s.h[i] > hi) hi = s.h[i]; if (s.l[i] < lo) lo = s.l[i]; }
  if (run.priceExtent) {
    const stepK = Math.max(1, Math.round((s.n - s.replayFrom) / 60));
    for (let k = s.replayFrom; k < s.n; k += stepK) {
      const ex = run.priceExtent(s.replayFrom, k, k);
      if (ex) { lo = Math.min(lo, ex[0]); hi = Math.max(hi, ex[1]); }
    }
    const ex = run.priceExtent(s.replayFrom, s.n - 1, s.n - 1);
    if (ex) { lo = Math.min(lo, ex[0]); hi = Math.max(hi, ex[1]); }
  }
  const r: [number, number] = [lo, hi];
  m.set(key, r);
  return r;
}

export function geometry(st: PaintState, W: number, H: number): Geometry {
  const { s, def, view, k, live } = st;
  const plotRight = W - AXIS_W;
  const start = s.replayFrom, end = s.n - 1;
  const lastIdx = live ? live.i : k;
  // HOME: the whole example on one stage when every bar can have >= 1.6 px;
  // on a narrow screen it starts at the first bar and rides the newest one.
  let bw: number, right: number, stage = false;
  if (view.home) {
    // a phone gives the study's runway less room, so more of the example fits on stage
    const runway = (b: number) => (plotRight < 520 ? Math.min(padPx(def, plotRight, b), plotRight * 0.22) : padPx(def, plotRight, b));
    const fitBw = (plotRight - runway(6)) / (end - start + 1);
    if (fitBw >= HOME_MIN_BW) { stage = true; bw = fitBw; right = end + runway(bw) / bw; }
    else { bw = view.bw; right = Math.max(start - 0.5 + plotRight / bw, lastIdx + padBars(def, plotRight, bw)); }
  } else {
    bw = view.bw;
    // following the newest bar: while the bars so far do not fill the plot they grow from its left
    // edge (no empty left half during a replay); once they fill it the chart rides the newest bar
    right = view.follow ? followRight(def, start, lastIdx, plotRight, bw) : view.right;
  }
  const count = plotRight / bw;
  const i1 = Math.min(Math.floor(right), lastIdx);
  const i0 = Math.max(start, Math.floor(right - count));
  const x = (i: number) => plotRight - (right - i) * bw - bw / 2;
  const iAt = (px: number) => Math.round(right - (plotRight - px - bw / 2) / bw);
  // panes
  const specs: (PaneSpec | null)[] = [null, ...(def.panes ?? [])];
  const totalW = specs.reduce((a, p) => a + (p ? p.weight : 1), 0);
  const avail = H - TIME_H - SEP * (specs.length - 1);
  let top = 0;
  const panes: PaneView[] = specs.map((p) => {
    const h = Math.round((avail * (p ? p.weight : 1)) / totalW);
    const pv: PaneView = { id: p ? p.id : "price", top, bottom: top + h, lo: 0, hi: 1, y: () => 0, v: () => 0, spec: p ?? undefined };
    top += h + SEP;
    return pv;
  });
  panes[panes.length - 1].bottom = H - TIME_H;

  // scales
  const iEnd = Math.min(i1, lastIdx);
  for (const pv of panes) {
    let lo = Infinity, hi = -Infinity;
    if (pv.id === "price" && view.yAuto === false && view.yLo !== undefined && view.yHi !== undefined && view.yHi > view.yLo) {
      // the visitor's own price range (they dragged the price axis or the chart)
      lo = view.yLo; hi = view.yHi;
    } else if (pv.id === "price") {
      if (stage) {
        // home: one scale for the whole example, so nothing jumps as it plays
        [lo, hi] = homeExtent(st);
      } else {
        for (let i = i0; i <= iEnd; i++) {
          let h = s.h[i], l = s.l[i];
          if (live && i === live.i) { h = live.h; l = live.l; }
          if (h > hi) hi = h;
          if (l < lo) lo = l;
        }
        const ex = st.run.priceExtent?.(i0, iEnd, k);
        if (ex) { lo = Math.min(lo, ex[0]); hi = Math.max(hi, ex[1]); }
      }
      const span = Math.max(hi - lo, s.tick * 20);
      const padY = span * 0.07;
      lo -= padY; hi += padY;
    } else if (pv.spec?.range) {
      [lo, hi] = pv.spec.range;
    } else {
      const ex = st.run.paneExtent?.(pv.id, i0, iEnd, k);
      if (ex) { lo = ex[0]; hi = ex[1]; } else { lo = -1; hi = 1; }
      const span = hi - lo || 1;
      lo -= span * 0.08; hi += span * 0.08;
    }
    if (!isFinite(lo) || !isFinite(hi) || hi <= lo) { lo = 0; hi = 1; }
    pv.lo = lo; pv.hi = hi;
    const t = pv.top + 6, b = pv.bottom - 6;
    pv.y = (v: number) => b - ((v - lo) / (hi - lo)) * (b - t);
    pv.v = (y: number) => lo + ((b - y) / (b - t)) * (hi - lo);
  }
  return { W, H, plotRight, panes, i0, i1, bw, right, x, iAt, stage, xStart: x(start) - bw / 2 };
}

export function makeDraw(ctx: CanvasRenderingContext2D, st: PaintState, g: Geometry): Draw {
  const { s, th } = st;
  const digits = s.tick < 1 ? 2 : 0;
  const font = (o?: TextOpts) => `${o?.weight ?? 400} ${o?.size ?? 11}px ${o?.font === "sans" ? st.fonts.sans : st.fonts.mono}`;
  const d: Draw = {
    ctx, th, i0: g.i0, i1: g.i1, k: st.k, live: st.live, x: g.x, bw: g.bw,
    plotLeft: 0, plotRight: g.plotRight, width: g.W,
    price: g.panes[0],
    pane: (id) => g.panes.find((p) => p.id === id),
    on: (id) => st.layers[id] !== false,
    // NinjaTrader prints chart prices without thousands separators (FormatPrice): 30565.25
    fmt: (p) => p.toFixed(digits),
    tick: s.tick, s,
    alpha,
    line(pts, color, width = 1, dash) {
      if (pts.length < 2) return;
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.stroke(); ctx.restore();
    },
    hline(pv, v, x0, x1, color, width = 1, dash) {
      const y = Math.round(pv.y(v)) + (width % 2 ? 0.5 : 0);
      if (y < pv.top || y > pv.bottom) return;
      d.line([[x0, y], [x1, y]], color, width, dash);
    },
    rect(x0, y0, x1, y1, fill, stroke, width = 1) {
      const x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
      if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h)); }
    },
    text(str, x, y, o) {
      ctx.font = font(o); ctx.fillStyle = o?.color ?? th.text; ctx.textAlign = o?.align ?? "left"; ctx.textBaseline = o?.base ?? "middle";
      ctx.fillText(str, x, y);
      return ctx.measureText(str).width;
    },
    measure(str, o) { ctx.font = font(o); return ctx.measureText(str).width; },
    tag(pv, v, text, color, ink) {
      const y = pv.y(v);
      if (y < pv.top - 2 || y > pv.bottom + 2) return;
      tags.push({ pv, y, text, color, ink: ink ?? (th.name === "dark" ? "#000" : "#fff") });
    },
    series(pv, vals, color, width = 1.2, opts) {
      const end = Math.min(g.i1, opts?.withLive ?? st.k);
      ctx.save(); ctx.lineWidth = width; ctx.lineJoin = "round";
      const fixed = typeof color === "string";
      if (fixed) { ctx.strokeStyle = color as string; ctx.beginPath(); }
      let pen = false, px = 0, py = 0;
      for (let i = Math.max(0, g.i0 - 1); i <= end; i++) {
        const v = vals[i];
        if (!isFinite(v)) { pen = false; continue; }
        const x = g.x(i), y = pv.y(v);
        if (fixed) {
          if (!pen) ctx.moveTo(x, y);
          else if (opts?.step) { ctx.lineTo(x, py); ctx.lineTo(x, y); }
          else ctx.lineTo(x, y);
        } else if (pen) {
          ctx.strokeStyle = (color as (i: number) => string)(i);
          ctx.beginPath(); ctx.moveTo(px, py);
          if (opts?.step) { ctx.lineTo(x, py); ctx.lineTo(x, y); } else ctx.lineTo(x, y);
          ctx.stroke();
        }
        pen = true; px = x; py = y;
      }
      if (fixed) ctx.stroke();
      ctx.restore();
    },
    hist(pv, vals, color, base = 0, wf = 0.6) {
      const y0 = pv.y(base), w = Math.max(1, g.bw * wf);
      for (let i = g.i0; i <= Math.min(g.i1, st.k); i++) {
        const v = vals[i];
        if (!isFinite(v)) continue;
        const y = pv.y(v);
        ctx.fillStyle = color(i);
        ctx.fillRect(Math.round(g.x(i) - w / 2), Math.min(y, y0), Math.max(1, Math.round(w)), Math.max(1, Math.abs(y - y0)));
      }
    },
    plate(x, y, lines, o) {
      const pad = o?.pad ?? 5;
      let w = 0, h = 0;
      const sz = lines.map((l) => { const s2 = l.size ?? 10.5; const ww = d.measure(l.t, { size: s2, weight: l.weight }); w = Math.max(w, ww); h += s2 + 3; return s2; });
      w += pad * 2; h += pad * 2 - 3;
      let left = o?.align === "right" ? x - w : o?.align === "center" ? x - w / 2 : x;
      let topY = o?.anchor === "bottom" ? y - h : o?.anchor === "middle" ? y - h / 2 : y;
      left = Math.round(left); topY = Math.round(topY);
      d.rect(left, topY, left + w, topY + h, o?.bg ?? th.plate, o?.border ?? th.plateLine);
      let cy = topY + pad;
      lines.forEach((l, j) => { d.text(l.t, left + pad, cy + sz[j] / 2, { color: l.color ?? th.text, size: sz[j], weight: l.weight }); cy += sz[j] + 3; });
      return { w, h };
    },
  };
  const tags: { pv: PaneView; y: number; text: string; color: string; ink: string }[] = [];
  (d as Draw & { _tags: typeof tags })._tags = tags;
  return d;
}

export function paint(ctx: CanvasRenderingContext2D, st: PaintState, W: number, H: number): Geometry {
  const { s, th, run, k, live } = st;
  const g = geometry(st, W, H);
  const d = makeDraw(ctx, st, g) as Draw & { _tags: { pv: PaneView; y: number; text: string; color: string; ink: string }[] };

  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);

  // No grid: the DS chart template runs without one (every product picture is
  // shot that way), so a level a tool draws is never confused with a grid line.
  // (No session hairlines: an example is one clean stage from its first bar.)
  const clipL = Math.max(0, Math.floor(g.xStart));

  // ---- price pane: candles (under the study's own drawing where it fills, over where it lines)
  const pv = g.panes[0];
  ctx.save(); ctx.beginPath(); ctx.rect(clipL, 0, g.plotRight - clipL, H - TIME_H); ctx.clip();
  const bodyW = Math.max(1, Math.min(g.bw * 0.66, g.bw - 1));
  const drawCandle = (i: number, o: number, h: number, l: number, c: number) => {
    const over = run.candle?.(i) ?? null;
    const col = over ? toneColor(th, over) : c > o ? th.up : c < o ? th.down : th.neutral;
    const x = Math.round(g.x(i));
    const yh = pv.y(h), yl = pv.y(l), yo = pv.y(o), yc = pv.y(c);
    ctx.fillStyle = col;
    ctx.fillRect(x, Math.round(yh), 1, Math.max(1, Math.round(yl - yh)));
    const top = Math.round(Math.min(yo, yc)), bh = Math.max(1, Math.round(Math.abs(yc - yo)));
    if (bodyW <= 2) ctx.fillRect(x - Math.floor(bodyW / 2), top, Math.max(1, Math.round(bodyW)), bh);
    else ctx.fillRect(Math.round(x - bodyW / 2 + 0.5), top, Math.round(bodyW), bh);
  };
  if (run.under) { try { run.under(d); } catch (e) { console.error(`[DS Replay] ${st.def.slug} under`, e); } }
  for (let i = g.i0; i <= Math.min(g.i1, k); i++) drawCandle(i, s.o[i], s.h[i], s.l[i], s.c[i]);
  if (live && live.i >= g.i0 && live.i <= g.i1) drawCandle(live.i, live.o, live.h, live.l, live.c);
  ctx.restore();

  // ---- the study
  ctx.save(); ctx.beginPath(); ctx.rect(clipL, 0, g.plotRight + 0.5 - clipL, H - TIME_H); ctx.clip();
  try { run.draw(d); } catch (e) { console.error(`[DS Replay] ${st.def.slug} draw`, e); }
  ctx.restore();

  // ---- the example's moments: numbered pins at the foot of the price pane, once reached
  (st.marks ?? []).forEach((m, j) => {
    if (m.i > k || m.i < g.i0 || m.i > g.i1) return;
    const sz = 13, x = Math.max(Math.ceil(clipL + sz / 2 + 1), Math.round(g.x(m.i))), yb = pv.bottom - 2;
    const col = toneColor(th, m.tone);
    d.rect(x - sz / 2, yb - sz, x + sz / 2, yb, th.bg, col);
    d.text(String(j + 1), x + 0.5, yb - sz / 2 + 0.5, { color: col, size: 9, align: "center", weight: 600 });
  });

  // ---- focus ring (after a jump to an event)
  if (st.focus) {
    const age = (st.now - st.focus.at) / 1000;
    if (age < 2.2 && st.focus.i >= g.i0 && st.focus.i <= g.i1) {
      const a = Math.max(0, 1 - age / 2.2);
      const x = g.x(st.focus.i);
      d.line([[Math.round(x) + 0.5, 0], [Math.round(x) + 0.5, H - TIME_H]], alpha(th.gold, 0.55 * a), 1);
      if (st.focus.price !== undefined) {
        const y = pv.y(st.focus.price);
        ctx.strokeStyle = alpha(th.gold, a); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 9 + age * 6, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  // ---- pane frames, titles
  for (const p of g.panes) {
    if (p.id !== "price") d.line([[0, p.top - 0.5], [W, p.top - 0.5]], th.axis, 1);
    if (p.id !== "price") d.text(p.spec?.title ?? p.id, 8, p.top + 11, { color: th.textDim, size: 10.5 });
  }
  const nm = d.text(st.def.name, 8, pv.top + 11, { color: th.text, size: 10.5 });
  d.text(st.tfLabel ?? "1 min", 8 + nm + 10, pv.top + 11, { color: th.textDim, size: 10.5 });

  // ---- axes
  ctx.fillStyle = th.bg; ctx.fillRect(g.plotRight, 0, AXIS_W, H); ctx.fillRect(0, H - TIME_H, W, TIME_H);
  d.line([[g.plotRight + 0.5, 0], [g.plotRight + 0.5, H - TIME_H]], th.axis, 1);
  d.line([[0, H - TIME_H + 0.5], [W, H - TIME_H + 0.5]], th.axis, 1);
  // time labels
  const minPx = 78;
  const steps = [1, 5, 10, 15, 30, 60, 120, 240, 360];
  const per = steps.find((m) => m * g.bw >= minPx) ?? 720;
  let lastX = -1e9;
  for (let i = g.i0; i <= g.i1; i++) {
    const m = minuteOfDay(s, i);
    if (m % per !== 0) continue;
    const x = g.x(i);
    if (x - lastX < minPx * 0.8 || x > g.plotRight - 20) continue;
    lastX = x;
    d.line([[Math.round(x) + 0.5, H - TIME_H], [Math.round(x) + 0.5, H - TIME_H + 4]], th.axis, 1);
    d.text(hhmm(s, i), x, H - TIME_H / 2 + 1, { color: th.axisText, size: 10, align: "center" });
  }

  // ---- tags in the axis (study tags, then the last price on top)
  const lastC = live ? live.c : s.c[k];
  const lastUp = live ? live.c >= live.o : s.c[k] >= s.o[k];
  d._tags.unshift({ pv, y: pv.y(lastC), text: d.fmt(lastC), color: lastUp ? th.up : th.down, ink: "#fff" });
  const TAG_H = 15, placed: { top: number; y: number }[] = [];
  for (const t of d._tags) {
    const lo = t.pv.top + TAG_H / 2, hi = t.pv.bottom - TAG_H / 2;
    const want = Math.max(lo, Math.min(hi, t.y));
    const free = (y: number) => placed.every((q) => q.top !== t.pv.top || Math.abs(q.y - y) >= TAG_H + 1);
    let y = want;
    if (!free(y)) {
      y = NaN;
      for (let dy = 1; dy < 240; dy++) {
        if (want + dy <= hi && free(want + dy)) { y = want + dy; break; }
        if (want - dy >= lo && free(want - dy)) { y = want - dy; break; }
      }
      if (!isFinite(y)) continue; // no room: the level still shows on the chart
    }
    y = Math.round(y);
    placed.push({ top: t.pv.top, y });
    d.rect(g.plotRight + 1, y - TAG_H / 2, W, y + TAG_H / 2, t.color, null);
    ctx.save(); ctx.beginPath(); ctx.rect(g.plotRight + 1, 0, AXIS_W - 1, H); ctx.clip();
    d.text(t.text, g.plotRight + 7, y + 0.5, { color: t.ink, size: 10, weight: 500 });
    ctx.restore();
  }

  // ---- price labels in the axis, where no value tag sits
  for (const p of g.panes) {
    const isPrice = p.id === "price";
    const step = niceStep(p.hi - p.lo, p.bottom - p.top, 46, isPrice ? s.tick : 1e-6);
    const dg = isPrice ? (s.tick < 1 ? 2 : 0) : p.spec?.digits ?? (step < 1 ? 2 : 0);
    for (let v = Math.ceil(p.lo / step) * step; v <= p.hi; v += step) {
      const y = p.y(v);
      if (y < p.top + 8 || y > p.bottom - 6) continue;
      if (placed.some((q) => q.top === p.top && Math.abs(q.y - y) < TAG_H / 2 + 6)) continue; // a value tag sits there
      const vv = Math.abs(v) < step * 1e-6 ? 0 : v;
      d.text(vv.toFixed(dg), g.plotRight + 8, y, { color: th.axisText, size: 10 });
    }
    for (const gv of p.spec?.guides ?? []) d.hline(p, gv, 0, g.plotRight, alpha(th.textDim, 0.45), 1, [3, 3]);
  }

  // ---- crosshair
  if (st.hover && st.hover.x < g.plotRight && st.hover.y < H - TIME_H) {
    const hi = Math.max(g.i0, Math.min(g.iAt(st.hover.x), live ? live.i : k));
    const x = Math.round(g.x(hi)) + 0.5, y = Math.round(st.hover.y) + 0.5;
    d.line([[x, 0], [x, H - TIME_H]], th.crosshair, 1, [3, 3]);
    d.line([[0, y], [g.plotRight, y]], th.crosshair, 1, [3, 3]);
    const p = g.panes.find((pp) => st.hover!.y >= pp.top && st.hover!.y <= pp.bottom);
    if (p) {
      const v = p.v(st.hover.y);
      const isPrice = p.id === "price";
      const txt = isPrice ? d.fmt(Math.round(v / s.tick) * s.tick) : v.toFixed(p.spec?.digits ?? 2);
      d.rect(g.plotRight + 1, y - 7.5, W, y + 7.5, th.name === "dark" ? "#E7ECEF" : "#14171B", null);
      d.text(txt, g.plotRight + 7, y + 0.5, { color: th.name === "dark" ? "#000" : "#fff", size: 10, weight: 500 });
    }
    const lbl = hhmm(s, hi);
    const tw = d.measure(lbl, { size: 10 }) + 12;
    d.rect(x - tw / 2, H - TIME_H + 1, x + tw / 2, H - 1, th.name === "dark" ? "#E7ECEF" : "#14171B", null);
    d.text(lbl, x, H - TIME_H / 2 + 0.5, { color: th.name === "dark" ? "#000" : "#fff", size: 10, align: "center", weight: 500 });
  }
  return g;
}

/** The example on the rail under the chart: its closes, the played part, and its numbered moments. */
export function paintRail(ctx: CanvasRenderingContext2D, st: { s: Session; th: Theme; k: number; frac: number; hoverI: number | null; marks: { i: number; tone: string }[] }, W: number, H: number) {
  const { s, th, k } = st;
  const a = s.replayFrom, b = s.n - 1;
  const xOf = (i: number) => 8 + ((i - a) / Math.max(1, b - a)) * (W - 16);
  let lo = Infinity, hi = -Infinity;
  for (let i = a; i <= b; i++) { if (s.l[i] < lo) lo = s.l[i]; if (s.h[i] > hi) hi = s.h[i]; }
  const top = 20, bot = H - 6;
  const yOf = (p: number) => bot - ((p - lo) / (hi - lo || 1)) * (bot - top);
  ctx.clearRect(0, 0, W, H);
  const px = xOf(Math.max(a, Math.min(b, k + st.frac)));
  for (const [from, to, col, w] of [[a, b, alpha(th.textDim, 0.35), 1], [a, Math.min(k, b), th.text, 1.25]] as [number, number, string, number][]) {
    if (to < from) continue;
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
    for (let i = from; i <= to; i++) { const x = xOf(i), y = yOf(s.c[i]); if (i === from) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.font = `600 9px var(--font-mono), monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  st.marks.forEach((m, j) => {
    const x = Math.round(xOf(m.i)), reached = m.i <= k;
    const col = toneColor(th, m.tone);
    ctx.strokeStyle = reached ? col : alpha(col, 0.45); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 0.5, 14); ctx.lineTo(x + 0.5, H - 4); ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = th.bg; ctx.fillRect(x - 6, 1, 12, 12);
    ctx.strokeRect(x - 5.5, 1.5, 11, 11);
    ctx.fillStyle = reached ? col : alpha(col, 0.55); ctx.fillText(String(j + 1), x + 0.5, 7.5);
  });
  if (st.hoverI !== null) {
    const x = Math.round(xOf(st.hoverI)) + 0.5;
    ctx.strokeStyle = th.crosshair; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, H); ctx.stroke();
  }
  ctx.fillStyle = th.gold;
  ctx.fillRect(Math.round(px) - 1, 14, 2, H - 14);
  return { xOf, iAt: (x: number) => Math.round(a + ((x - 8) / (W - 16)) * (b - a)) };
}

export { FONT_MONO };
