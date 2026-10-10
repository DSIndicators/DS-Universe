import type { Draw, LiveBar, Session, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm } from "../ta";

/**
 * DS Chart Price — web edition.
 * Source: DSChartPrice.cs (Build 2026-10-07), shipped defaults (ApplyDefaults()).
 *
 * WHAT IS PORTED (Calculate.OnEachTick)
 *   · One large last-price readout, Anchor TopCenter, Y offset from top 100 px,
 *     Consolas SemiBold 90, format F2 from the tick size (e.g. "29518.75"), no backing.
 *   · Colour engine, exactly as ComputeTargets() / OnRender():
 *       every price change pushes its delta into a 256-deep ring; over the last
 *       Window = 14 changes  ER = |net| / Σ|delta|;  trend = ±ER (sign of net);
 *       chop = (0.35 − ER) / 0.35 when ER < Chop efficiency floor 0.35 and at least
 *       Min activity = 4 changes are in the window, else 0.
 *       base = lerp(idle → up|down, |trend|), then lerp(base → amber, chop);
 *       the shown tint eases toward its target with DirSmoothing 320 ms;
 *       every change restarts the flash (decay 150 ms): disp = lerp(base → up|down
 *       of that change, flash x 0.85), then lerp(→ white, flash x 0.85 x 0.22).
 *     Idle (240, 240, 248) gives way to the chart's text colour on a light chart
 *     (ResolveChart/PickInk: background luma > 0.18 and text contrast ≥ 3 : 1).
 *   · Motion Full, Glow off, Idle breathing off, alerts off — the shipped defaults.
 *
 * THE TICK STREAM. The tool counts price CHANGES. The replay holds each bar's
 * recorded intrabar path (true trade order where the tick database has it, open →
 * high/low → close where it does not) and the engine forms the live candle along it
 * one tick at a time. The web edition feeds the colour engine exactly that stream:
 * the open of each bar against the previous close (one change), then every tick the
 * forming price passes through along the path. State at a bar's close (events,
 * status, readout) uses the stream through that close only; the live readout uses
 * the stream through the forming bar's current price (d.live).
 *
 * EVENTS — the notable class only. The readout changes colour on nearly every tick
 * (the window is 14 changes, about three points on NQ), so its raw output is far
 * denser than a timeline can carry. An event is emitted when the readout has CLOSED
 * three consecutive minutes in the same family, and that family differs from the
 * last one reported: UP TINT / DOWN TINT (no amber, ER ≥ 0.5) or AMBER (chop ≥ 0.5).
 * Closes in between (a pale, near-idle readout) neither start nor break a run.
 *
 * DEVIATIONS
 *   · Colours: the shipped Up / Down brushes are pure green (0, 255, 0) and pure red
 *     (255, 0, 0). By the DS Universe house rule (and this site's brief: never
 *     green/red) the web edition uses the house strong hues instead — cyan #00FFFF /
 *     magenta #FF00FF on dark, their deepened tokens on light. Amber (255, 196, 0) and
 *     idle (240, 240, 248) are as shipped. One constant each below if Tom wants the
 *     shipped green/red back on the page.
 *   · Size: 90 px Consolas on a ~2,500 px NinjaTrader chart; the web chart is smaller,
 *     so the font and the 100 px offset scale with the plot width (plot / 2480,
 *     never below 28 px) to keep the proportions of the real chart.
 *   · Tick stream: the replay's recorded swing path, walked tick by tick, not every
 *     printed trade (see above). Time-based easing (flash, tint) runs on the
 *     viewer's clock while the replay plays; paused or stepped, the readout shows its
 *     settled colour.
 *   · Fonts: Consolas is not a web font; the page's monospace is used.
 *   · Framing (web showcase): the price scale keeps headroom over the candles (0.22 of their
 *     range) so the readout at the top never sits on price, as a trader frames the chart in
 *     every product shot. On the whole-example stage the headroom is sized on the whole example,
 *     so the scale holds still while it plays. NinjaTrader does not move the scale.
 */

const WINDOW = 14, CHOP_FLOOR = 0.35, MIN_ACTIVITY = 4, CAP = 256;
const BLINK_INTENSITY = 0.85, BLINK_DECAY_MS = 150, DIR_SMOOTH_MS = 320;
const FONT = 90, Y_OFFSET = 100, REF_W = 2480;
const AMBER: RGB = [255, 196, 0];
const IDLE: RGB = [240, 240, 248];
const WHITE: RGB = [255, 255, 255];
const RUN = 3;
const HEADROOM = 0.22; // web framing: room over the candles for the readout (share of their range)

type RGB = [number, number, number];
type Fam = "U" | "D" | "A" | "P";

const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lerp = (a: RGB, b: RGB, t: number): RGB => { t = Math.max(0, Math.min(1, t)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const lin = (c: number) => { c = Math.max(0, Math.min(1, c / 255)); return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const luma = (c: RGB) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

/** ER targets over the newest `n` (≤ WINDOW) deltas of `d` (chronological). */
function targets(d: number[]): { trend: number; chop: number; er: number; net: number; cnt: number; travel: number } {
  const n = Math.min(WINDOW, d.length);
  if (n < 1) return { trend: 0, chop: 0, er: 0, net: 0, cnt: 0, travel: 0 };
  let sumAbs = 0, net = 0;
  for (let i = 0; i < n; i++) { const v = d[d.length - 1 - i]; sumAbs += Math.abs(v); net += v; }
  let er = sumAbs > 1e-12 ? Math.abs(net) / sumAbs : 0;
  if (er > 1) er = 1;
  const trend = net > 0 ? er : net < 0 ? -er : 0;
  let chop = 0;
  if (n >= MIN_ACTIVITY && sumAbs > 1e-12 && er < CHOP_FLOOR) chop = (CHOP_FLOOR - er) / CHOP_FLOOR;
  return { trend, chop, er, net, cnt: n, travel: sumAbs };
}

const famOf = (t: { trend: number; chop: number; er: number }): Fam => (t.chop >= 0.5 ? "A" : t.er >= 0.5 ? (t.trend > 0 ? "U" : "D") : "P");

/** The ticks a bar's path walks through, as unit deltas (the engine forms the candle the same way). */
function pathSteps(p: Int16Array, frac: number | null, out: number[]) {
  const segs = p.length - 1;
  if (p.length && p[0] !== 0) { const sg = Math.sign(p[0]); for (let t = 0; t !== p[0]; t += sg) out.push(sg); }
  if (segs < 1) return;
  let jEnd = segs, cur = p[segs];
  if (frac !== null) {
    const pos = Math.max(0, Math.min(1, frac)) * segs;
    const j = Math.floor(pos);
    if (j < segs) { jEnd = j; cur = Math.round(p[j] + (p[j + 1] - p[j]) * (pos - j)); }
  }
  for (let q = 1; q <= jEnd; q++) { const a = p[q - 1], b = p[q], sg = Math.sign(b - a); for (let t = a; t !== b; t += sg) out.push(sg); }
  if (jEnd < segs) { const a = p[jEnd], sg = Math.sign(cur - a); for (let t = a; t !== cur; t += sg) out.push(sg); }
}

function build(s: Session) {
  const tk = s.tick;
  const tail = new Int16Array(s.n * WINDOW);
  const cnt = new Uint8Array(s.n);
  const ring: number[] = [];
  const tmp: number[] = [];
  for (let i = 0; i < s.n; i++) {
    tmp.length = 0;
    if (i > 0) { const g = Math.round((s.o[i] - s.c[i - 1]) / tk); if (g) tmp.push(g); }
    pathSteps(s.path[i], null, tmp);
    for (const v of tmp) { ring.push(v); }
    if (ring.length > CAP) ring.splice(0, ring.length - CAP);
    const m = Math.min(WINDOW, ring.length);
    for (let j = 0; j < m; j++) tail[i * WINDOW + j] = ring[ring.length - m + j];
    cnt[i] = m;
  }
  return { tail, cnt };
}

export const study: StudyDef = {
  slug: "chart-price",
  name: "DS Chart Price",
  about: "The large last-price readout at the top of the chart: a flash on every price change over a steady tint read from the last 14 changes, amber when they went nowhere.",
  run(s) {
    const { tail, cnt } = build(s);
    const closeDeltas = (i: number) => Array.from(tail.subarray(i * WINDOW, i * WINDOW + cnt[i]));
    const atClose = (i: number) => targets(closeDeltas(i));
    /** deltas through the forming bar's current price */
    const liveDeltas = (k: number, live: LiveBar) => {
      const d = closeDeltas(k);
      const i = live.i;
      const g = Math.round((s.o[i] - s.c[i - 1]) / s.tick);
      if (g) d.push(g);
      pathSteps(s.path[i], live.frac, d);
      return d;
    };

    // ---- events: the notable class (see header)
    const events: StudyEvent[] = [];
    let prevFam: Fam | "" = "", run = 0, lastEmit: Fam | "" = "";
    const start = Math.max(1, s.replayFrom - 1 - 30);
    for (let i = start; i < s.n; i++) {
      const t = atClose(i), f = famOf(t);
      if (f === "P") continue;
      run = f === prevFam ? run + 1 : 1;
      prevFam = f;
      if (run === RUN && f !== lastEmit) {
        lastEmit = f;
        if (i < s.replayFrom - 1) continue;
        const px = s.c[i].toFixed(2);
        const ticks = Math.round(Math.abs(t.net)), travel = Math.round(t.travel);
        const tone: Tone = f === "A" ? "gold" : f === "U" ? "bull" : "bear";
        const title = f === "A" ? "AMBER" : f === "U" ? "UP TINT" : "DOWN TINT";
        const text = f === "A"
          ? `${hhmm(s, i)} — the readout closed a third straight minute amber at ${px}: its last ${t.cnt} price changes travelled ${travel} ticks for a net ${ticks}, an efficiency of ${t.er.toFixed(2)}, under the 0.35 floor.`
          : `${hhmm(s, i)} — the readout closed a third straight minute with ${f === "U" ? "an up" : "a down"} tint at ${px}: its last ${t.cnt} price changes travelled ${travel} ticks and netted ${ticks} ${f === "U" ? "up" : "down"}, an efficiency of ${t.er.toFixed(2)}.`;
        events.push({ i, price: s.c[i], title, text, tone, weight: f === "A" ? 2 : 1 });
      }
    }

    // ---- the readout's own eased state (visual only — lives on the viewer's clock)
    const vis = { at: 0, key: "", trend: 0, chop: 0, flash: 0, dir: 1 };

    const draw = (d: Draw) => {
      const live = d.live;
      const px = live ? live.c : s.c[d.k];
      const deltas = live ? liveDeltas(d.k, live) : closeDeltas(d.k);
      const tg = targets(deltas);
      const lastDir = deltas.length ? (deltas[deltas.length - 1] > 0 ? 1 : -1) : 1;
      const now = performance.now() / 1000;
      if (!live) {
        // paused or stepped: show the settled colour
        vis.trend = tg.trend; vis.chop = tg.chop; vis.flash = 0; vis.dir = lastDir; vis.at = now; vis.key = `${d.k}:${px}`;
      } else {
        let dt = now - vis.at;
        if (dt < 0) dt = 0;
        if (dt > 0.25) dt = 0.25;
        vis.at = now;
        const tau = Math.max(0.02, BLINK_DECAY_MS / 1000);
        vis.flash *= Math.exp(-dt / tau);
        const key = `${live.i}:${px}`;
        if (key !== vis.key) {
          vis.key = key;
          vis.flash = 1; vis.dir = lastDir;
        }
        if (vis.flash < 0.0008) vis.flash = 0;
        const kt = 1 - Math.exp(-dt / Math.max(0.02, DIR_SMOOTH_MS / 1000));
        vis.trend += (tg.trend - vis.trend) * kt;
        vis.chop += (tg.chop - vis.chop) * kt;
      }

      const up = hex(d.th.bullStrong), dn = hex(d.th.bearStrong);
      const bgL = luma(hex(d.th.bg));
      const lightChart = bgL > 0.18;
      const txt = hex(d.th.text);
      const tl = luma(txt);
      const inkOk = (Math.max(bgL, tl) + 0.05) / (Math.min(bgL, tl) + 0.05) >= 3;
      const idle: RGB = lightChart ? (inkOk ? txt : [27, 29, 33]) : IDLE;

      const tr = Math.max(-1, Math.min(1, vis.trend)), ch = Math.max(0, Math.min(1, vis.chop));
      let base = idle;
      if (tr > 0) base = lerp(idle, up, tr);
      else if (tr < 0) base = lerp(idle, dn, -tr);
      base = lerp(base, AMBER, ch);
      const tick = vis.dir >= 0 ? up : dn;
      const blink = Math.max(0, Math.min(1, vis.flash)) * BLINK_INTENSITY;
      let disp = lerp(base, tick, blink);
      disp = lerp(disp, WHITE, blink * 0.22);

      // placement: TopCenter, scaled from the NinjaTrader chart
      const sc = Math.min(1, d.plotRight / REF_W);
      const size = Math.max(28, Math.round(FONT * sc));
      const text = px.toFixed(2);
      const pv = d.price;
      const boxW = d.measure(text, { size, weight: 600, font: "mono" });
      const lineH = size * 1.17;
      let left = d.plotRight * 0.5 - boxW * 0.5;
      let top = pv.top + Y_OFFSET * Math.max(sc, size / FONT);
      if (top + lineH > pv.bottom) top = pv.bottom - lineH;
      if (top < pv.top) top = pv.top;
      if (left < 0) left = 0;
      d.text(text, left, top, { size, weight: 600, font: "mono", color: css(disp), base: "top" });
    };

    const famWord = (f: Fam) => (f === "A" ? "AMBER" : f === "U" ? "UP" : f === "D" ? "DOWN" : "PALE");
    const famTone = (f: Fam): Tone => (f === "A" ? "gold" : f === "U" ? "strongBull" : f === "D" ? "strongBear" : "neutral");

    return {
      events,
      draw,
      // framing (web showcase): headroom over the candles for the readout, so it never sits on price.
      // On the whole-example stage it is sized on the whole example, as the stage's scale is, so the
      // scale holds still while the example plays; scrolled on a narrow screen it follows the visible bars.
      priceExtent: (i0, i1) => {
        const a = i0 <= s.replayFrom ? s.replayFrom : i0, z = i0 <= s.replayFrom ? s.n - 1 : i1;
        let lo = Infinity, hi = -Infinity;
        for (let i = a; i <= z; i++) { if (s.l[i] < lo) lo = s.l[i]; if (s.h[i] > hi) hi = s.h[i]; }
        if (!isFinite(lo)) return null;
        return [lo, hi + (hi - lo) * HEADROOM];
      },
      status: (k, live) => {
        const t = live ? targets(liveDeltas(k, live)) : atClose(k);
        const f = famOf(t);
        const px = live ? live.c : s.c[k];
        const dd = live ? liveDeltas(k, live) : closeDeltas(k);
        const last = dd.length ? dd[dd.length - 1] : 0;
        return [
          { label: "Readout", value: px.toFixed(2), tone: famTone(f) },
          { label: "Tint", value: `${famWord(f)} · efficiency ${t.er.toFixed(2)}`, tone: famTone(f) },
          { label: "Last 14 changes", value: `net ${t.net > 0 ? "+" : ""}${Math.round(t.net)} ticks` },
          { label: "Amber", value: t.chop > 0 ? `${Math.round(t.chop * 100)}%` : "none" },
          { label: "Last change", value: last > 0 ? "up" : last < 0 ? "down" : "—", tone: last > 0 ? "strongBull" : last < 0 ? "strongBear" : undefined },
        ];
      },
      readout: (i) => {
        const t = atClose(i), f = famOf(t);
        return [
          { label: "Tint at close", value: `${famWord(f)} · ER ${t.er.toFixed(2)}`, tone: famTone(f) },
          { label: "Net of last 14", value: `${t.net > 0 ? "+" : ""}${Math.round(t.net)} ticks` },
        ];
      },
      legend: [
        { label: "Up tint / flash", color: "#00FFFF", shape: "box" },
        { label: "Down tint / flash", color: "#FF00FF", shape: "box" },
        { label: "Amber · changes went nowhere", color: css(AMBER), shape: "box" },
        { label: "Idle · no net direction", color: css(IDLE), shape: "box" },
      ],
    };
  },
};
