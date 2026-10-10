"use client";

import type React from "react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LiveBar, ReadItem, Session, StudyDef, StudyRun, Theme, Tone } from "./types";
import { DARK, LIGHT, toneColor } from "./theme";
import { formingAt, loadExample, type ExampleMeta } from "./data";
import { followRight, geometry, padBars, paint, paintRail, type Hover, type View } from "./render";
import { hhmm } from "./ta";

/**
 * DS REPLAY — the interactive chart on every product page (2026-10-09, v3).
 *
 * Each product page shows one or more EXAMPLES: an optimal scenario for the
 * tool, composed from recorded one-minute candles (tools/showcase/design.ts —
 * the pattern is written, every candle is real), with the tool's shipped
 * rules running on it unchanged. No instrument, no date.
 *
 * It opens as a finished chart — the example fully drawn — and behaves like a
 * NinjaTrader chart: drag the chart to scroll back and forth, drag the time
 * axis to change the bar spacing, drag the price axis to scale price (the
 * scale then stays where it was put), double-click the chart to reset the
 * view, double-click the price axis to give it back to auto scale. The wheel
 * scrolls the chart once it is clicked (so the page still scrolls past it),
 * Ctrl + wheel and a pinch zoom. REPLAY plays it again bar by bar with the
 * candle forming, like Market Replay; the side panel walks its MOMENTS — the
 * tool's own events, numbered on the chart and on the rail.
 *
 * Keys (the frame is focusable): Space replay / pause · ←/→ one bar ·
 * Shift+←/→ previous/next moment · Home/End · +/− bar spacing · T theme ·
 * F full screen. Replay pauses while the chart is off screen or the tab is
 * hidden.
 */

export type ExampleRef = { id: string; tab: string; url: string };

type Props = {
  load: () => Promise<{ study: StudyDef }>;
  examples: ExampleRef[];
  productName: string;
};

const SPEEDS = [
  { v: 2, label: "Slow" },
  { v: 4, label: "Normal" },
  { v: 9, label: "Fast" },
];
const THEME_KEY = "ds-replay-theme";

export function Engine({ load, examples, productName }: Props) {
  const [def, setDef] = useState<StudyDef | null>(null);
  const [exId, setExId] = useState(examples[0]?.id);
  const [s, setS] = useState<Session | null>(null);
  const [meta, setMeta] = useState<ExampleMeta | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [themeName, setThemeName] = useState<"dark" | "light">("dark");
  const th: Theme = themeName === "dark" ? DARK : LIGHT;
  const [layers, setLayers] = useState<Record<string, boolean>>({});
  const [speed, setSpeed] = useState(4);
  /** the visitor asked it to play (Replay / Play); it only runs while on screen */
  const [wantPlay, setWantPlay] = useState(false);
  const [k, setK] = useState(0);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  /** the side panel: the example's overview (finished chart) or the moment reached */
  const [story, setStory] = useState<"overview" | "live">("overview");
  const [hoverI, setHoverI] = useState<number | null>(null);
  const [railHover, setRailHover] = useState<{ i: number; x: number; m: number | null } | null>(null);
  const [full, setFull] = useState(false);
  const [canFull, setCanFull] = useState(false);
  /** the camera is off its opening view (shows the reset control) */
  const [moved, setMoved] = useState(false);
  const [cursor, setCursor] = useState("crosshair");

  const frame = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const rail = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const railBox = useRef<HTMLDivElement>(null);
  const st = useRef({
    k: 0, frac: 0,
    view: { home: true, right: 0, bw: 7, follow: true, yAuto: true } as View,
    hover: null as Hover,
    focus: null as { i: number; price?: number; at: number } | null,
    size: { w: 0, h: 0, rw: 0, rh: 0 },
  });
  const fonts = useRef({ mono: "monospace", sans: "sans-serif" });
  const playing = wantPlay && onScreen && tabVisible;

  // ---- study + example
  useEffect(() => {
    let live = true;
    load().then((m) => { if (live) { setDef(m.study); setLayers(Object.fromEntries((m.study.layers ?? []).map((l) => [l.id, l.on]))); } }).catch((e) => setErr(String(e)));
    return () => { live = false; };
  }, [load]);

  useEffect(() => {
    let live = true;
    const ref = examples.find((x) => x.id === exId) ?? examples[0];
    setS(null); setMeta(null);
    loadExample(ref.url).then(({ session, meta: m }) => { if (live) { setS(session); setMeta(m); } }).catch((e) => live && setErr(String(e)));
    return () => { live = false; };
  }, [exId, examples]);

  const run: StudyRun | null = useMemo(() => {
    if (!def || !s) return null;
    try { return def.run(s); } catch (e) { console.error(e); setErr(String(e)); return null; }
  }, [def, s]);

  const marks = useMemo(() => (meta?.chapters ?? []).map((c) => ({ i: c.i, tone: c.tone as string })), [meta]);

  // a new example opens finished, on its home view
  useEffect(() => {
    if (!s || !run) return;
    const cur = st.current;
    cur.k = s.n - 1; cur.frac = 0; cur.focus = null;
    cur.view = { home: true, right: 0, bw: cur.size.w > 900 ? 7 : 5, follow: true, yAuto: true };
    setK(s.n - 1); setWantPlay(false); setStory("overview"); setMoved(false);
  }, [s, run]);

  useEffect(() => {
    try { const v = localStorage.getItem(THEME_KEY); if (v === "light" || v === "dark") setThemeName(v); } catch { /* storage blocked */ }
    const css = getComputedStyle(document.documentElement);
    const mono = css.getPropertyValue("--font-mono").trim(), sans = css.getPropertyValue("--font-sans").trim();
    fonts.current = { mono: mono || "ui-monospace, monospace", sans: sans || "system-ui, sans-serif" };
    setCanFull(!!document.fullscreenEnabled);
    const on = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const setTheme = (t: "dark" | "light") => { setThemeName(t); try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ } };
  const toggleFull = () => {
    const el = frame.current; if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  // ---- visibility: replay pauses off screen and in a hidden tab
  useEffect(() => {
    const el = frame.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting && e.intersectionRatio >= 0.2), { threshold: [0, 0.2, 0.6] });
    io.observe(el);
    const vis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);

  // ---- painting
  const liveBar = useCallback((): LiveBar | null => {
    if (!s) return null;
    const { k: kk, frac } = st.current;
    if (frac <= 0 || kk + 1 >= s.n) return null;
    return { i: kk + 1, ...formingAt(s, kk + 1, frac), frac };
  }, [s]);

  const tfLabel = meta ? (meta.tf >= 60 ? `${meta.tf / 60} hour` : `${meta.tf} min`) : "1 min";
  const paintState = useCallback((now: number) => ({ s: s!, def: def!, run: run!, th, k: st.current.k, live: liveBar(), view: st.current.view, hover: st.current.hover, layers, focus: st.current.focus, fonts: fonts.current, now, marks, tfLabel }), [s, def, run, th, liveBar, layers, marks, tfLabel]);
  const geo = useCallback(() => geometry(paintState(0), st.current.size.w, st.current.size.h), [paintState]);

  const repaint = useCallback(() => {
    const c = cv.current, r = rail.current;
    if (!c || !s || !run || !def) return;
    const { w, h, rw, rh } = st.current.size;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(ctx, paintState(performance.now()), w, h);
    if (r && rw) {
      const rc = r.getContext("2d")!;
      rc.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintRail(rc, { s, th: DARK, k: st.current.k, frac: st.current.frac, hoverI: railHover?.i ?? null, marks }, rw, rh);
    }
  }, [s, run, def, paintState, railHover, marks]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const b = box.current, rb = railBox.current, c = cv.current, r = rail.current;
      if (!b || !c) return;
      const w = Math.round(b.clientWidth), h = Math.round(b.clientHeight);
      if (w !== st.current.size.w || h !== st.current.size.h) {
        c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`;
        st.current.size.w = w; st.current.size.h = h;
        if (st.current.view.home) st.current.view.bw = w > 900 ? 7 : 5;
      }
      if (rb && r) {
        const rw = Math.round(rb.clientWidth), rh = Math.round(rb.clientHeight);
        if (rw !== st.current.size.rw || rh !== st.current.size.rh) {
          r.width = rw * dpr; r.height = rh * dpr; r.style.width = `${rw}px`; r.style.height = `${rh}px`;
          st.current.size.rw = rw; st.current.size.rh = rh;
        }
      }
      repaint();
    });
    if (box.current) ro.observe(box.current);
    if (railBox.current) ro.observe(railBox.current);
    return () => ro.disconnect();
  }, [repaint]);

  useEffect(() => { repaint(); }, [repaint, k]);

  // ---- the clock (Market Replay: the bar forms along its recorded path, then closes)
  useEffect(() => {
    if (!playing || !s) return;
    let raf = 0, prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - prev) / 1000); prev = now;
      const cur = st.current;
      cur.frac += dt * speed;
      let stepped = false;
      while (cur.frac >= 1) {
        cur.frac -= 1; cur.k += 1; stepped = true;
        if (cur.k >= s.n - 1) { cur.k = s.n - 1; cur.frac = 0; break; }
      }
      if (stepped) setK(cur.k);
      repaint();
      if (cur.k >= s.n - 1) { setWantPlay(false); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, s, repaint]);

  useEffect(() => {
    const f = st.current.focus; if (!f || playing) return;
    let raf = 0;
    const loop = () => { repaint(); if (performance.now() - f.at < 2300) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  // ---- the replay cursor
  const chapters = meta?.chapters ?? [];
  const seek = useCallback((to: number, focus?: { i: number; price?: number }) => {
    if (!s) return;
    const kk = Math.max(s.replayFrom, Math.min(s.n - 1, to));
    st.current.k = kk; st.current.frac = 0;
    st.current.focus = focus ? { i: focus.i, price: focus.price, at: performance.now() } : null;
    setK(kk);
    repaint();
  }, [s, repaint]);
  const pause = () => setWantPlay(false);
  /** the camera shows bar i: a moment off screen brings the view to it */
  const reveal = (i: number) => {
    const v = st.current.view;
    if (v.home) return;
    stopMotion();
    const g = geo();
    if (i < g.i0 + 2 || i > g.right - padBars(def!, g.plotRight, g.bw) - 1) {
      v.follow = false;
      v.right = i + (g.plotRight / g.bw) * 0.5;
    }
  };
  const goMoment = (j: number) => { const c = chapters[j]; if (c) { pause(); setStory("live"); reveal(c.i); seek(c.i, c); } };
  const nextMoment = () => { const j = chapters.findIndex((c) => c.i > st.current.k); if (j >= 0) goMoment(j); };
  const prevMoment = () => { let j = -1; chapters.forEach((c, x) => { if (c.i < st.current.k) j = x; }); if (j >= 0) goMoment(j); };
  const replay = () => {
    if (!s) return;
    const v = st.current.view;
    if (!v.home) v.follow = true;
    setStory("live");
    seek(s.replayFrom);
    setWantPlay(true);
  };
  const toggle = () => {
    if (!s) return;
    if (wantPlay) { pause(); return; }
    if (st.current.k >= s.n - 1) { replay(); return; }
    setStory("live");
    setWantPlay(true);
  };
  const step = (d: number) => { pause(); setStory("live"); seek(st.current.k + d); };
  const toEnd = () => { pause(); setStory("overview"); seek(1e9); };

  // ---- the camera (NinjaTrader conventions)
  const syncMoved = () => { const v = st.current.view; setMoved(!v.home || v.yAuto === false); };
  /** leave the home view: freeze its geometry as the visitor's own camera */
  const own = () => {
    const v = st.current.view;
    if (!v.home) return;
    const g = geo();
    v.home = false; v.bw = g.bw; v.right = g.right;
    const last = liveBar()?.i ?? st.current.k;
    v.follow = g.right >= followRight(def!, s!.replayFrom, last, g.plotRight, g.bw) - 0.5;
  };
  // ---- camera motion: how a real chart moves under the hand
  //  · the bars track the finger / mouse exactly while dragging (1:1, every frame);
  //  · past either end the chart gives with rising resistance (rubber band, never a dead stop);
  //  · on release it keeps the hand's speed and glides to rest (exponential friction, ~325 ms
  //    time constant — the deceleration curve phones use), or springs back to the end it overran;
  //  · resting at the newest bar re-arms "follow", so a replay keeps riding the edge;
  //  · a mouse-wheel notch eases to its target instead of jumping; trackpads stay 1:1.
  const motion = useRef({ raf: 0, vel: 0, target: NaN, samples: [] as { t: number; r: number }[], spring: null as null | { from: number; to: number; t0: number } });
  const paintRaf = useRef(0);
  /** coalesce repaints to one per frame (pointer events can fire several times a frame) */
  const requestPaint = () => { if (!paintRaf.current) paintRaf.current = requestAnimationFrame(() => { paintRaf.current = 0; repaint(); }); };
  const bounds = () => {
    const g = geo(), v = st.current.view;
    const count = g.plotRight / v.bw;
    const last = liveBar()?.i ?? st.current.k;
    // right: the newest bar plus the tool's runway (or, while the bars do not fill the plot, the first bar at
    // the left edge); left: the first bar may travel no further than 65% across
    const hi = followRight(def!, s!.replayFrom, last, g.plotRight, v.bw);
    const lo = Math.min(s!.replayFrom - 0.5 + count * 0.35, hi);
    return { lo, hi, count };
  };
  /** rubber band: beyond an end the chart moves less and less, up to 12% of the view */
  const rubber = (r: number) => {
    const { lo, hi, count } = bounds();
    const lim = Math.max(2, count * 0.12);
    const give = (e: number) => lim * (1 - 1 / (1 + (e * 0.55) / lim));
    return r < lo ? lo - give(lo - r) : r > hi ? hi + give(r - hi) : r;
  };
  const clampRight = (right: number) => {
    if (!s || !def) return right;
    const { lo, hi } = bounds();
    const r = Math.max(lo, Math.min(hi, right));
    st.current.view.follow = r >= hi - 0.5;
    return r;
  };
  const stopMotion = () => { const m = motion.current; if (m.raf) cancelAnimationFrame(m.raf); m.raf = 0; m.vel = 0; m.spring = null; m.target = NaN; };
  /** glide / spring / ease, one frame at a time, until the camera rests */
  const runMotion = () => {
    const m = motion.current;
    if (m.raf) return;
    let prev = performance.now();
    const frameFn = (now: number) => {
      const dt = Math.min(32, now - prev); prev = now;
      const v = st.current.view;
      const { lo, hi } = bounds();
      let alive = false;
      if (m.spring) {
        const k = Math.min(1, (now - m.spring.t0) / 280), e = 1 - Math.pow(1 - k, 3);
        v.right = m.spring.from + (m.spring.to - m.spring.from) * e;
        if (k < 1) alive = true; else m.spring = null;
      } else if (isFinite(m.target)) {
        const d = m.target - v.right;
        v.right += d * (1 - Math.exp(-dt / 70));
        if (Math.abs(d) > 0.02) alive = true; else { v.right = m.target; m.target = NaN; }
      } else if (Math.abs(m.vel) > 0.0004) {
        const out = v.right < lo || v.right > hi;
        v.right += m.vel * dt;
        // friction: a free glide decays over ~325 ms; past an end it is braked hard
        m.vel *= Math.exp(-dt / (out ? 45 : 325));
        alive = true;
      } else {
        m.vel = 0;
        if (v.right < lo - 0.01 || v.right > hi + 0.01) { m.spring = { from: v.right, to: v.right < lo ? lo : hi, t0: now }; alive = true; }
      }
      if (!alive) {
        m.raf = 0;
        v.follow = v.right >= hi - 0.5;
        if (v.follow) v.right = hi;
        repaint();
        return;
      }
      repaint();
      m.raf = requestAnimationFrame(frameFn);
    };
    m.raf = requestAnimationFrame(frameFn);
  };
  const scrollBars = (bars: number, smooth = false) => {
    own();
    const v = st.current.view, g = geo(), m = motion.current;
    const base = v.follow ? g.right : v.right;
    v.follow = false;
    if (smooth) {
      const { lo, hi } = bounds();
      m.vel = 0; m.spring = null;
      m.target = Math.max(lo, Math.min(hi, (isFinite(m.target) ? m.target : base) + bars));
      if (!isFinite(v.right) || v.right === 0) v.right = base;
      runMotion();
    } else { stopMotion(); v.right = clampRight(base + bars); requestPaint(); }
    syncMoved();
  };
  const zoomAt = (factor: number, px?: number) => {
    own(); stopMotion();
    const v = st.current.view, g = geo();
    const anchor = px ?? g.plotRight; // NinjaTrader keeps the right edge; a pinch or Ctrl+wheel keeps the point under the hand
    const iAnchor = g.right - (g.plotRight - anchor) / g.bw;
    const bw = Math.max(1.2, Math.min(48, g.bw * factor));
    v.bw = bw;
    v.right = clampRight(iAnchor + (g.plotRight - anchor) / bw);
    syncMoved(); requestPaint();
  };
  const resetView = () => {
    stopMotion();
    const v = st.current.view;
    st.current.view = { home: true, right: 0, bw: st.current.size.w > 900 ? 7 : 5, follow: true, yAuto: true };
    void v; setMoved(false); repaint();
  };
  const autoPrice = () => { const v = st.current.view; v.yAuto = true; v.yLo = v.yHi = undefined; syncMoved(); repaint(); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === " ") { e.preventDefault(); toggle(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); if (e.shiftKey) nextMoment(); else step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (e.shiftKey) prevMoment(); else step(-1); }
    else if (e.key === "Home") { e.preventDefault(); step(-1e9); }
    else if (e.key === "End") { e.preventDefault(); toEnd(); }
    else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomAt(1.25); }
    else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomAt(0.8); }
    else if (e.key.toLowerCase() === "t") setTheme(themeName === "dark" ? "light" : "dark");
    else if (e.key.toLowerCase() === "f") toggleFull();
  };

  // ---- pointer on the chart
  type Drag =
    | { kind: "plot"; x: number; y: number; right: number; lo: number; hi: number; moved: boolean }
    | { kind: "time"; x: number; bw: number; right: number }
    | { kind: "price"; y: number; lo: number; hi: number };
  const drag = useRef<Drag | null>(null);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; bw: number; mid: number } | null>(null);
  const zoneAt = (x: number, y: number, g: ReturnType<typeof geo>) => {
    const pricePane = g.panes[0];
    if (y >= st.current.size.h - 24) return "time" as const;
    if (x >= g.plotRight) return y <= pricePane.bottom ? ("price" as const) : ("axis" as const);
    return "plot" as const;
  };
  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!s || !run || !def) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const g = geo();
    const v = st.current.view;
    const zone = zoneAt(x, y, g);

    if (e.type === "pointerdown") {
      frame.current?.focus({ preventScroll: true });
      e.currentTarget.setPointerCapture(e.pointerId);
      pts.current.set(e.pointerId, { x, y });
      stopMotion();
      if (pts.current.size === 2) {
        const [a, b] = [...pts.current.values()];
        own();
        pinch.current = { d: Math.max(20, Math.abs(a.x - b.x)), bw: st.current.view.bw, mid: (a.x + b.x) / 2 };
        drag.current = null;
      } else if (zone === "plot") {
        drag.current = { kind: "plot", x, y, right: g.right, lo: g.panes[0].lo, hi: g.panes[0].hi, moved: false };
        motion.current.samples = [{ t: e.timeStamp, r: g.right }];
      } else if (zone === "time") {
        drag.current = { kind: "time", x, bw: g.bw, right: g.right };
      } else if (zone === "price") {
        drag.current = { kind: "price", y, lo: g.panes[0].lo, hi: g.panes[0].hi };
      }
    } else if (e.type === "pointermove" && pts.current.has(e.pointerId)) {
      pts.current.set(e.pointerId, { x, y });
      const p = pinch.current;
      if (p && pts.current.size >= 2) {
        const [a, b] = [...pts.current.values()];
        const d = Math.max(20, Math.abs(a.x - b.x));
        const bw = Math.max(1.2, Math.min(48, p.bw * (d / p.d)));
        zoomAt(bw / st.current.view.bw, p.mid);
        return;
      }
      const dr = drag.current;
      if (dr?.kind === "plot") {
        if (!dr.moved && Math.abs(x - dr.x) < 3 && Math.abs(y - dr.y) < 3) { /* a click, not a drag yet */ }
        else {
          if (!dr.moved) { own(); dr.moved = true; setCursor("grabbing"); st.current.hover = null; setHoverI(null); }
          const bw = st.current.view.bw;
          // 1:1 with the hand, a rubber band past either end; the raw position feeds the release speed
          const raw = dr.right - (x - dr.x) / bw;
          v.follow = false;
          v.right = rubber(raw);
          const smp = motion.current.samples;
          smp.push({ t: e.timeStamp, r: raw });
          while (smp.length > 2 && e.timeStamp - smp[0].t > 100) smp.shift();
          if (v.yAuto === false) {
            // a fixed price scale scrolls with the hand, as in NinjaTrader
            const pp = g.panes[0], per = (dr.hi - dr.lo) / Math.max(1, pp.bottom - pp.top - 12);
            v.yLo = dr.lo + (y - dr.y) * per; v.yHi = dr.hi + (y - dr.y) * per;
          }
          syncMoved();
        }
      } else if (dr?.kind === "time") {
        own();
        const bw = Math.max(1.2, Math.min(48, dr.bw * Math.exp((dr.x - x) * 0.008))); // drag left = wider bars, right = more bars (Tom, 2026-10-10)
        st.current.view.bw = bw;
        st.current.view.right = clampRight(dr.right);
        syncMoved();
      } else if (dr?.kind === "price") {
        const f = Math.exp((y - dr.y) * 0.006), mid = (dr.lo + dr.hi) / 2, half = ((dr.hi - dr.lo) / 2) * f;
        v.yAuto = false; v.yLo = mid - half; v.yHi = mid + half;
        syncMoved();
      }
    } else if (e.type === "pointerup" || e.type === "pointercancel") {
      pts.current.delete(e.pointerId);
      if (pts.current.size < 2) pinch.current = null;
      const dr = drag.current;
      if (dr?.kind === "plot" && dr.moved) {
        // release: keep the hand's speed (last ~100 ms) and glide, or spring back from an overrun
        const smp = motion.current.samples, a = smp[0], z = smp[smp.length - 1];
        const dt = z && a ? z.t - a.t : 0;
        const fresh = z ? e.timeStamp - z.t < 60 : false;
        motion.current.vel = dt > 8 && fresh && e.type === "pointerup" ? Math.max(-1.2, Math.min(1.2, (z.r - a.r) / dt)) * (st.current.view.right === z.r ? 1 : 0.4) : 0;
        runMotion();
      }
      drag.current = null;
      setCursor(zone === "price" ? "ns-resize" : zone === "time" ? "ew-resize" : "crosshair");
    }

    if (e.type === "pointermove" && !drag.current) setCursor(zone === "price" ? "ns-resize" : zone === "time" ? "ew-resize" : "crosshair");
    const dragging = !!drag.current && drag.current.kind !== "plot" ? true : drag.current?.kind === "plot" && drag.current.moved;
    st.current.hover = e.type === "pointerleave" || e.pointerType === "touch" || dragging ? null : { x, y };
    if (!st.current.hover || zone !== "plot") setHoverI(null);
    else { const g2 = geo(); setHoverI(Math.max(g2.i0, Math.min(g2.iAt(x), st.current.k))); }
    requestPaint();
  };
  const onDouble = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!s) return;
    const r = e.currentTarget.getBoundingClientRect();
    const zone = zoneAt(e.clientX - r.left, e.clientY - r.top, geo());
    if (zone === "price") autoPrice(); else resetView();
  };

  // the wheel: horizontal wheels and trackpads always scroll the chart; a plain
  // vertical wheel only once the chart is active (clicked / focused), so the page
  // keeps scrolling past it; Ctrl + wheel changes the bar spacing.
  const wheelRef = useRef<(e: WheelEvent) => void>(() => {});
  wheelRef.current = (e: WheelEvent) => {
    if (!s || !def) return;
    const active = !!frame.current && frame.current.contains(document.activeElement);
    const r = cv.current!.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - r.left); return; }
    const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (!horiz && !active) return;
    e.preventDefault();
    const delta = horiz ? e.deltaX : e.deltaY;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const px = delta * unit;
    // a mouse-wheel notch (line/page mode, or a big pixel step) eases to its target; a trackpad's stream stays 1:1
    const notch = e.deltaMode !== 0 || (!horiz && Math.abs(px) >= 40 && Number.isInteger(px));
    scrollBars(px / Math.max(1, st.current.view.bw) * (notch ? 0.9 : 1), notch);
  };
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const h = (e: WheelEvent) => wheelRef.current(e);
    c.addEventListener("wheel", h, { passive: false });
    return () => c.removeEventListener("wheel", h);
  }, []);

  // ---- rail: scrub the replay cursor
  const railDrag = useRef(false);
  const onRail = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!s) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, W = r.width;
    const a = s.replayFrom, b = s.n - 1;
    const i = Math.max(a, Math.min(b, Math.round(a + ((x - 8) / (W - 16)) * (b - a))));
    let near: number | null = null, best = 9;
    chapters.forEach((c, j) => { const cx = 8 + ((c.i - a) / Math.max(1, b - a)) * (W - 16); const d = Math.abs(cx - x); if (d < best) { best = d; near = j; } });
    if (e.type === "pointerdown") { railDrag.current = true; e.currentTarget.setPointerCapture(e.pointerId); pause(); setStory("live"); if (near !== null) goMoment(near); else { reveal(i); seek(i); } }
    else if (e.type === "pointermove" && railDrag.current && (e.buttons & 1)) { reveal(i); seek(i); }
    else if (e.type === "pointerup" || e.type === "pointercancel") railDrag.current = false;
    setRailHover(e.type === "pointerleave" ? null : { i: near !== null ? chapters[near].i : i, x, m: near });
  };

  // ---- derived
  const atK = Math.min(k, (s?.n ?? 1) - 1);
  const status: ReadItem[] = useMemo(() => (run && s ? (run.status?.(atK, null) ?? []).slice(0, 3) : []), [run, s, atK]);
  const reached = chapters.filter((c) => c.i <= atK).length;
  const now = story === "live" && reached > 0 ? chapters[reached - 1] : null;
  const read: ReadItem[] = useMemo(() => {
    if (!s || hoverI === null) return [];
    const i = hoverI;
    return [
      { label: "Bar", value: `${hhmm(s, i)}` },
      { label: "O H L C", value: `${s.o[i].toFixed(2)}  ${s.h[i].toFixed(2)}  ${s.l[i].toFixed(2)}  ${s.c[i].toFixed(2)}` },
      ...(run?.readout?.(i) ?? []).slice(0, 5),
    ];
  }, [s, run, hoverI]);
  const exIdx = Math.max(0, examples.findIndex((x) => x.id === exId));
  const ready = !!(s && run && def && meta);
  const atEnd = !!s && atK >= s.n - 1;

  return (
    <div
      ref={frame}
      className="ds-replay overflow-hidden rounded-[12px] border border-line bg-[#05070A] shadow-monitor outline-none focus-visible:ring-1 focus-visible:ring-gold/60 [&:fullscreen]:overflow-auto"
      tabIndex={0}
      role="region"
      aria-roledescription="interactive chart"
      aria-label={`${productName}, an interactive chart example`}
      onKeyDown={onKey}
    >
      {/* ------------------------------------------------------------ strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-4 py-3 sm:px-5">
        <p className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.18em] text-gold">
          DS Replay <span className="ml-2 text-mute">· Illustrative example</span>
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          {examples.length > 1 && (
            <div className="flex border border-line-strong" role="tablist" aria-label="Examples">
              {examples.map((x, j) => (
                <button key={x.id} type="button" role="tab" aria-selected={x.id === exId} onClick={() => setExId(x.id)}
                  className={`h-8 whitespace-nowrap border-l border-line-strong px-3 text-[length:calc(12.5px*var(--type))] transition-colors first:border-l-0 ${x.id === exId ? "bg-white/[0.07] text-ink shadow-[inset_0_-1px_0_#CDA656]" : "text-mute hover:text-ink"}`}>
                  <span className="mr-2 font-mono text-[length:calc(10px*var(--type))] text-mute">{String(j + 1).padStart(2, "0")}</span>
                  {x.tab}
                </button>
              ))}
            </div>
          )}
          <div className="flex border border-line-strong" role="group" aria-label="Chart ground">
            {(["dark", "light"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={themeName === t} onClick={() => setTheme(t)}
                className={`h-8 border-l border-line-strong px-3 font-mono text-[length:calc(11px*var(--type))] capitalize first:border-l-0 ${themeName === t ? "bg-white/[0.07] text-ink shadow-[inset_0_-1px_0_#CDA656]" : "text-mute hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </div>
          {canFull && (
            <button type="button" onClick={toggleFull} aria-label={full ? "Leave full screen (F)" : "Full screen (F)"} title={full ? "Leave full screen (F)" : "Full screen (F)"} className="inline-flex h-8 w-8 items-center justify-center border border-line-strong text-slate transition-colors hover:text-ink">
              {full ? <I d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" /> : <I d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* --------------------------------------------------------- the chart */}
        <div className="min-w-0 xl:border-r xl:border-line">
          <div ref={box} className="relative h-[420px] sm:h-[480px] lg:h-[540px] 2xl:h-[600px]" style={{ background: th.bg, ...(full ? { height: "calc(100svh - 190px)" } : {}) }}>
            <canvas ref={cv} className="absolute inset-0 block touch-pan-y select-none" style={{ cursor }}
              onPointerMove={onPointer} onPointerDown={onPointer} onPointerUp={onPointer} onPointerCancel={onPointer} onPointerLeave={onPointer} onDoubleClick={onDouble}
              aria-hidden="true" />
            {!ready && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="font-mono text-[length:calc(11px*var(--type))] uppercase tracking-[0.16em] text-mute">{err ? "The example could not load." : "Loading the example…"}</span>
              </div>
            )}
            {read.length > 0 && (
              <div className="pointer-events-none absolute left-3 top-8 max-w-[min(340px,70%)] border px-3 py-2 font-mono text-[length:calc(10.5px*var(--type))] leading-[1.6]"
                style={themeName === "light" ? { background: "rgba(236,236,236,0.95)", color: "#14171B", borderColor: "rgba(0,0,0,0.15)" } : { background: "rgba(0,0,0,0.82)", color: "#D9DEE4", borderColor: "rgba(255,255,255,0.1)" }}>
                {read.map((r, j) => (
                  <div key={`${j}-${r.label}`} className="flex gap-3">
                    <span className="w-[80px] shrink-0 opacity-55">{r.label}</span>
                    <span style={r.tone ? { color: toneColor(th, r.tone) } : undefined}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --------------------------------------------- the tool's read, then the transport */}
          {status.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-line px-4 py-2.5 sm:px-5" aria-live="off">
              {status.map((r, j) => (
                <span key={`${j}-${r.label}`} className="whitespace-nowrap text-[length:calc(12px*var(--type))]">
                  <span className="text-mute">{r.label}</span>
                  <span className="ml-2 font-mono tabular-nums text-ink" style={r.tone ? { color: toneColor(DARK, r.tone) } : undefined}>{r.value}</span>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-3 py-2.5 sm:px-4">
            <div className="flex items-center">
              <Ctl label="Back to the first bar (Home)" onClick={() => step(-1e9)}><IconStart /></Ctl>
              <Ctl label="Previous moment (Shift + ←)" onClick={prevMoment}><IconPrevEv /></Ctl>
              <Ctl label="One bar back (←)" onClick={() => step(-1)}><IconStepB /></Ctl>
              <button type="button" onClick={toggle} className="mx-1 inline-flex h-9 min-w-[104px] items-center justify-center gap-2 border border-line-strong bg-white/[0.03] px-3 font-mono text-[length:calc(11.5px*var(--type))] uppercase tracking-[0.12em] text-ink transition-colors hover:border-gold/70"
                aria-label={wantPlay ? "Pause (Space)" : atEnd ? "Replay the example (Space)" : "Play (Space)"}>
                {wantPlay ? <IconPause /> : atEnd ? <IconReplay /> : <IconPlay />}
                {wantPlay ? "Pause" : atEnd ? "Replay" : "Play"}
              </button>
              <Ctl label="One bar forward (→)" onClick={() => step(1)}><IconStepF /></Ctl>
              <Ctl label="Next moment (Shift + →)" onClick={nextMoment}><IconNextEv /></Ctl>
              <Ctl label="To the last bar (End)" onClick={toEnd}><IconEnd /></Ctl>
            </div>
            <span className="font-mono text-[length:calc(12px*var(--type))] tabular-nums text-ink">{s ? hhmm(s, atK) : "--:--"}</span>
            {moved && (
              <button type="button" onClick={resetView} title="Reset the view (double-click the chart)" className="h-8 border border-line-strong px-2.5 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.1em] text-mute transition-colors hover:text-ink">
                Reset view
              </button>
            )}
            <div className="ml-auto flex border border-line-strong" role="group" aria-label="Replay speed">
              {SPEEDS.map((x) => (
                <button key={x.v} type="button" aria-pressed={speed === x.v} onClick={() => setSpeed(x.v)}
                  className={`h-8 border-l border-line-strong px-2.5 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.1em] first:border-l-0 ${speed === x.v ? "bg-white/[0.07] text-ink shadow-[inset_0_-1px_0_#CDA656]" : "text-mute hover:text-ink"}`}>
                  {x.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---------------------------------------------------------- rail */}
          <div className="relative border-t border-line px-3 pb-3 pt-2.5 sm:px-4">
            <div ref={railBox} className="relative h-[50px] cursor-pointer">
              <canvas ref={rail} className="absolute inset-0 block touch-none" onPointerDown={onRail} onPointerMove={onRail} onPointerUp={onRail} onPointerCancel={onRail} onPointerLeave={onRail} aria-label="The example, first bar to last — the numbered marks are its moments" />
              {railHover && s && (
                <div className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 whitespace-nowrap border border-line-strong bg-[#0B0E12] px-2.5 py-1.5 font-mono text-[length:calc(10.5px*var(--type))] text-ink" style={{ left: Math.max(70, Math.min(railHover.x, (st.current.size.rw || 300) - 70)) }}>
                  <span className="text-mute">{hhmm(s, railHover.i)}</span>
                  {railHover.m !== null && <span className="ml-2" style={{ color: toneColor(DARK, chapters[railHover.m].tone) }}>{String(railHover.m + 1).padStart(2, "0")} · {chapters[railHover.m].title}</span>}
                </div>
              )}
            </div>
            <p className="mt-2 hidden font-mono text-[length:calc(10px*var(--type))] tracking-[0.04em] text-mute sm:block">
              Drag the chart to scroll · drag the price or time axis to scale · double-click to reset
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------- the story */}
        <aside className="flex min-h-0 flex-col border-t border-line xl:border-t-0" aria-label={`What ${productName} does in this example`}>
          <div className="px-6 pb-6 pt-6">
            <p className="font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.18em] text-mute">
              Example {String(exIdx + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2.5 font-display text-[length:calc(19px*var(--type))] font-normal leading-snug tracking-[-0.01em] text-ink text-balance">{meta?.title ?? " "}</h3>
            <p className="mt-2.5 text-[length:calc(13.5px*var(--type))] leading-[1.6] text-slate text-pretty">{meta?.premise ?? ""}</p>
          </div>

          <div className="border-t border-line px-6 py-5" aria-live="polite">
            {now && s ? (
              <>
                <p className="flex items-center gap-3 font-mono text-[length:calc(11px*var(--type))] uppercase tracking-[0.12em]">
                  <Num n={reached} tone={now.tone} on />
                  <span style={{ color: toneColor(DARK, now.tone) }}>{now.title}</span>
                  <span className="ml-auto tabular-nums text-mute">{hhmm(s, now.i)}</span>
                </p>
                <p className="mt-3 text-[length:calc(14px*var(--type))] leading-[1.62] text-ink text-pretty">{now.text}</p>
              </>
            ) : (
              <p className="text-[length:calc(13.5px*var(--type))] leading-relaxed text-slate">
                {story === "live" && chapters.length
                  ? `${chapters.length} moments to watch for. Each one is marked on the chart as it happens.`
                  : chapters.length
                    ? `${chapters.length} moments, numbered on the chart. Replay plays it bar by bar; pick a moment to see the chart as it stood then.`
                    : def?.about ?? ""}
              </p>
            )}
          </div>

          <ol className="border-t border-line px-3 py-3">
            {chapters.map((c, j) => {
              const done = c.i <= atK, cur = story === "live" && done && j === reached - 1;
              return (
                <li key={`${c.i}-${j}`}>
                  <button type="button" onClick={() => goMoment(j)} className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/[0.03] ${cur ? "bg-white/[0.035]" : ""}`}>
                    <Num n={j + 1} tone={c.tone} on={done} />
                    <span className={`min-w-0 flex-1 truncate font-mono text-[length:calc(11px*var(--type))] uppercase tracking-[0.08em] ${done ? "" : "text-mute"}`} style={done ? { color: toneColor(DARK, c.tone) } : undefined}>{c.title}</span>
                    <span className="font-mono text-[length:calc(10.5px*var(--type))] tabular-nums text-mute">{s ? hhmm(s, c.i) : ""}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {(def?.layers?.length || run?.legend?.length) ? (
            <div className="mt-auto border-t border-line px-6 py-4">
              {run?.legend?.length ? (
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {run.legend.map((l) => (
                    <li key={l.label} className="inline-flex items-center gap-2 font-mono text-[length:calc(10.5px*var(--type))] text-slate">
                      <Swatch color={l.color} shape={l.shape} />
                      {l.label}
                    </li>
                  ))}
                </ul>
              ) : null}
              {def?.layers?.length ? (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {def.layers.map((l) => (
                    <label key={l.id} className="inline-flex cursor-pointer items-center gap-2 text-[length:calc(12px*var(--type))] text-mute hover:text-ink" title={l.hint}>
                      <input type="checkbox" className="h-3 w-3 accent-[#CDA656]" checked={layers[l.id] !== false} onChange={(e) => { setLayers((x) => ({ ...x, [l.id]: e.target.checked })); }} />
                      {l.label}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Num({ n, tone, on }: { n: number; tone: Tone | string; on: boolean }) {
  const c = toneColor(DARK, tone);
  return (
    <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center border font-mono text-[9.5px] font-semibold tabular-nums"
      style={on ? { borderColor: c, color: c } : { borderColor: "#2C3139", color: "#7C848D" }}>
      {n}
    </span>
  );
}
function Ctl({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="inline-flex h-9 w-9 items-center justify-center text-slate transition-colors hover:text-ink">
      {children}
    </button>
  );
}
function Swatch({ color, shape }: { color: string; shape?: string }) {
  if (shape === "box") return <span className="inline-block h-2.5 w-3.5 border" style={{ background: color, borderColor: color }} />;
  if (shape === "dot") return <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />;
  if (shape === "dash") return <span className="inline-block h-0 w-4 border-t border-dashed" style={{ borderColor: color }} />;
  return <span className="inline-block h-[2px] w-4" style={{ background: color }} />;
}
const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const IconPlay = () => <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>;
const IconPause = () => <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" /></svg>;
const IconStepF = () => <I d="M5 3.5l5 4.5-5 4.5" />;
const IconStepB = () => <I d="M11 3.5L6 8l5 4.5" />;
const IconNextEv = () => <I d="M3 3.5l5 4.5-5 4.5M9 3.5l5 4.5-5 4.5" />;
const IconPrevEv = () => <I d="M13 3.5L8 8l5 4.5M7 3.5L2 8l5 4.5" />;
const IconStart = () => <I d="M3.5 3v10M12.5 3.5L7 8l5.5 4.5" />;
const IconEnd = () => <I d="M12.5 3v10M3.5 3.5L9 8l-5.5 4.5" />;
const IconReplay = () => <I d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.8h2.8" />;
