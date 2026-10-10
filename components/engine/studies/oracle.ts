import type { Draw, ReadItem, StudyDef, StudyEvent, Theme, Tone } from "../types";
import { DARK } from "../theme";
import { hhmm } from "../ta";
import { computeOracle, P } from "./_oracle-engine";

/**
 * DS Oracle — web edition. Source: DSOracle.cs (Build 2026-09-26), shipped
 * ApplyDefaults() values throughout (ATR 10 · factor 2.0 · K 10 · learning
 * window 1000 · stride 10 · threshold 0.9 · SMA 20 · RSI 20 · signal 10 ·
 * chop 14 · normalizing window 1000 · Minkowski 2 · shape 2 · Fixed reduction ·
 * line period 34 · smoothness 2 · neural shift 0.5 · flip buffer 0.25 ·
 * Spectrum Responsive / base 14 · DsSignature palette · CloseBar).
 *
 * PORTED (calculation in _oracle-engine.ts, line for line):
 *   · the ATR SuperTrend structure and its settled-trend label (direction held
 *     on the bar and the five before it);
 *   · the Dropship AI vote: 12 z-scored features (RSI, SMA deviation, RSI vs
 *     its signal, Choppiness — each at 0 / 10 / 20 bars back) standardised over
 *     1000 bars, projected to the Fixed 4-component blend, Minkowski p=2
 *     distance to the past bars 10, 20 … 1010 back that carry a settled
 *     label, comparability gate (ZWIN_RATIO 0.5), K = 10 nearest, kernel
 *     exp(-d^2 / 2 sigma^2) with sigma = the 6th-nearest distance (index K/2)
 *     floored at 5% of the 10th (SIGMA_REL_FLOOR); vote > 0.9 promotes a flip to a
 *     confirmed trend (on the flip bar or later while the SuperTrend still
 *     points that way); warm-up 220 bars;
 *   · the three card filters: Neural Line agreement, sides alternate, 6 bars
 *     between candidates — BUYERS / SELLERS cards with the TREND REVERSAL
 *     caption, placed beyond the low / high of the 4 bars either side;
 *   · the trend line (SuperTrend, coloured by the confirmed direction, 2 px at
 *     opacity 0.50, drawn only while the confirmation and the SuperTrend both
 *     hold);
 *   · the Neural Line: volume-weighted value (EMA 34), Magnet retest rail and
 *     volume-node pull (120-bar, 64-bucket profile), the online 12-6-1 Neural
 *     Engine shift (xorshift-seeded, RMSprop, audited against the structural
 *     baseline), 2 pre-smoothing poles + 3 EMA poles, 0.25-ATR flip buffer;
 *     Smooth style colour (Chop tint 0.85 toward the chart's ink, colour easing
 *     8, saturation distance 2 ATR, magnet intensity 0.35), 3 px with the edge
 *     lift underlay;
 *   · the Spectrum: four SuperTrends (14/42/70/140, factor 2) voting, efficiency,
 *     momentum and 5-bar participation z, ignition 0.30 / volume floor 0.20,
 *     bright hold 4, cooldown 5, Responsive dwell 2, counter-bar rule, and the
 *     hollow (unbacked) candle — washed body, full outline.
 *
 * DEVIATIONS
 *   1. History length: NinjaTrader runs the engine from the first bar the chart
 *      loads; here it runs from the first bar in the session file (about three
 *      prior sessions). The vote's 1000-bar windows are full either way, but
 *      the Neural Engine (an online network) and the slow EMAs carry state from
 *      bar 0, so the Neural Line can sit slightly differently from a chart that
 *      loaded more days. Unset NinjaTrader Series slots are read as 0 at the
 *      first bars, exactly as the .cs reads them.
 *   2. The .cs computes on every tick but anchors the vote, confirmations,
 *      cards and trend line to the closed bar (CloseBar) — ported as such. The
 *      Neural Line and its bias are judged from closed bars here; NinjaTrader
 *      also draws the line's tip through the forming bar.
 *   3. The forming candle's Spectrum colour is judged live from its OHLC so
 *      far, as NinjaTrader does on each tick; its volume so far is taken as
 *      the bar's volume pro-rated by elapsed fraction (the web replay carries
 *      no intrabar volume clock). Purely visual: no event, status or readout
 *      uses it.
 *   4. The volume-profile step reads completed bars (NinjaTrader's own
 *      no-Tick-Replay history path, which its README documents).
 *   5. Display defaults: NinjaTrader ships with Show reversal cards, Show
 *      reversal caption and Show trend line OFF (candles + Neural Line only).
 *      The replay opens with cards + caption and the trend line ON, as in the
 *      product pictures, because they are what the events narrate; both are
 *      layer toggles. The arrow chips (Show signal arrows) are not drawn.
 *   6. Cards are square-cornered plates (house rule) rather than 3.5 px
 *      rounded; size, placement, rail, leader, colours (SolveSide contrast
 *      solve against the chart ground) and lettering are the .cs's.
 *   7. The Neural Line's along-the-line gradient is drawn as per-bar coloured
 *      segments using the same per-bar stop colours.
 *   8. "Plain SuperTrend flips" is a web-only compare layer (off by default):
 *      it marks every raw flip of the same SuperTrend, the comparison the
 *      README itself draws ("a raw SuperTrend flip is a candidate").
 *   9. Price scale: DS Oracle has no plots, so NinjaTrader's auto scale
 *      ignores the Neural Line; the replay keeps the line in view.
 *  10. Light theme: the replay's light ground uses the engine's deepened
 *      DsSignature tokens; NinjaTrader keeps the same five brush colours on
 *      any ground.
 *  11. Example hygiene (web showcase): the trend line is drawn only for a
 *      confirmation made on or after the first shown bar (s.replayFrom) — a
 *      confirmed trend inherited from the hidden warm-up is not drawn, and the
 *      status / readout do not call it CONFIRMED (the status shows the
 *      SuperTrend's direction alone, the readout's Confirmed trend shows —).
 *      The confirmation itself, the vote and the card filters are computed
 *      exactly as before; cards and events already start at the first shown
 *      bar, and the flip counts start there too.
 *  12. Status order (web showcase): the replay's status strip shows the first
 *      three reads, so they are the three the chart cannot show by itself —
 *      SuperTrend (direction · confirmed or not), Vote, and Flips (raw flips ·
 *      confirmed · cards, counted from the first shown bar; was "Flips
 *      today"). Spectrum and Neural Line follow; the values are unchanged.
 *
 * EVENTS: BUYERS / SELLERS (weight 3) = a card prints; CONFIRMED UP / DOWN
 * (weight 2) = the vote confirmed a flip but a card filter held it back (the
 * text names which); LONG BIAS / SHORT BIAS (weight 2) = the Neural Line side
 * changes. Raw unconfirmed flips are counted in the status and shown by the
 * compare layer rather than narrated (they would double the rail).
 */

// ------------------------------------------------------------------ colour maths (the .cs's own)
type C4 = [number, number, number];
const hex = (h: string): C4 => { const n = parseInt(h.slice(1, 7), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const css = (c: C4, a = 1) => {
  const b = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 255);
  return a >= 1 ? `rgb(${b(c[0])},${b(c[1])},${b(c[2])})` : `rgba(${b(c[0])},${b(c[1])},${b(c[2])},${+a.toFixed(3)})`;
};
const cl = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: C4, b: C4, t: number): C4 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lerpP = (a: C4, b: C4, t: number): C4 => {
  t = cl(t, 0, 1);
  return [0, 1, 2].map((j) => Math.sqrt(a[j] * a[j] + (b[j] * b[j] - a[j] * a[j]) * t)) as C4;
};
const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const relLum = (c: C4) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const targetLum = (lref: number, ratio: number, up: boolean) => (up ? ratio * (lref + 0.05) - 0.05 : (lref + 0.05) / ratio - 0.05);
const clamp01 = (c: C4, m: number): C4 => [cl(c[0] * m, 0, 1), cl(c[1] * m, 0, 1), cl(c[2] * m, 0, 1)];
const scaleToLum = (c: C4, want: number): C4 => {
  want = cl(want, 0.0005, 0.9995);
  let lo = 0, hi = 8;
  for (let q = 0; q < 24; q++) { const m = (lo + hi) * 0.5; if (relLum(clamp01(c, m)) < want) lo = m; else hi = m; }
  return clamp01(c, (lo + hi) * 0.5);
};
const tintKeepLum = (neutral: C4, hue: C4, amt: number) => scaleToLum(lerpP(neutral, hue, amt), relLum(neutral));
const WHITE: C4 = [0.96, 0.97, 0.99], INKD: C4 = [0.04, 0.045, 0.055];

/** SpectrumRamp: the ordinary up / down candle tone from the anchor colour (contrast 0.65) */
function spectrumRamp(base: C4, neutral: C4, contrast: number) {
  const k = cl(contrast, 0, 1);
  const mx = Math.max(...base), nn = mx > 0.01 ? 1 / mx : 1;
  const full = base.map((x) => Math.min(1, x * nn)) as C4;
  const mn = Math.min(...full), sat = 1 - mn;
  const pull = (0.55 + 0.35 * (1 - sat)) * mn, den = Math.max(1 - pull, 0.15);
  const vivid = full.map((x) => cl((x - pull) / den, 0, 1)) as C4;
  const vsat = Math.max(...vivid) - Math.min(...vivid);
  const lift = (0.04 + 0.2 * k) * Math.min(1, 0.35 + vsat);
  const bright = vivid.map((x) => x + (1 - x) * lift) as C4;
  const mix = 0.22 + 0.38 * k, dim = 0.92 - 0.14 * k;
  const dull = vivid.map((x, j) => (x + (neutral[j] - x) * mix) * dim) as C4;
  return { dull, bright };
}
type Pal = { spec: string[]; dim: string[]; bull: C4; bear: C4; neutral: C4; ink: C4; bg: C4;
  card: { up: Side; dn: Side; cap: C4; shad: number } };
type Side = { panel: C4; panelA: number; text: C4; rail: C4; edge: C4 };

function solveSide(bg: C4, lbg: number, hue: C4, tint: number): Side {
  const up = lbg < 0.18;
  const want = tintKeepLum(scaleToLum([0.6, 0.63, 0.7], targetLum(lbg, up ? 1.5 : 3.6, up)), hue, 0.055);
  let a = 0.9;
  let ir = (want[0] - bg[0] * (1 - a)) / a, ig = (want[1] - bg[1] * (1 - a)) / a, ib = (want[2] - bg[2] * (1 - a)) / a;
  if (ir < 0 || ig < 0 || ib < 0 || ir > 1 || ig > 1 || ib > 1) { ir = want[0]; ig = want[1]; ib = want[2]; a = 1; }
  const lc = relLum(want);
  const tup = lc < 0.18 || targetLum(lc, 4.8, false) < 0;
  const anc = tup ? WHITE : INKD;
  return {
    panel: [ir, ig, ib], panelA: a,
    text: scaleToLum(lerpP(hue, anc, tint), targetLum(lc, 4.8, tup)),
    rail: scaleToLum(lerpP(hue, anc, tint * 0.28), targetLum(lc, 2.85, tup)),
    edge: scaleToLum([0.7, 0.72, 0.76], targetLum(lc, 1.9, tup)),
  };
}

const palCache = new Map<string, Pal>();
function palette(th: Theme): Pal {
  const hit = palCache.get(th.name);
  if (hit) return hit;
  const bull = hex(th.bull), bear = hex(th.bear), neutral = hex(th.neutral.length === 7 ? th.neutral : "#555555");
  const sUp = hex(th.bullStrong), sDn = hex(th.bearStrong);
  const u = spectrumRamp(bull, neutral, 0.65), dn = spectrumRamp(bear, neutral, 0.65);
  let dullUp = u.dull, dullDn = dn.dull;
  // SeparateSides (only bites when the two bright tones are near each other)
  const dsep = (Math.abs(u.bright[0] - dn.bright[0]) + Math.abs(u.bright[1] - dn.bright[1]) + Math.abs(u.bright[2] - dn.bright[2])) / 3;
  if (dsep < 0.16) {
    const need = (0.16 - dsep) / 0.16;
    dullUp = dullUp.map((x) => cl(x * (1 + 0.12 * need), 0, 1)) as C4;
    dullDn = dullDn.map((x) => cl(x * (1 - 0.22 * need), 0, 1)) as C4;
  }
  const bg = hex(th.bg);
  const lbg = relLum(bg);
  const tint = 0.55;
  const cup = lbg < 0.18 || targetLum(lbg, 4.0, false) < 0;
  const p: Pal = {
    spec: [css(sDn), css(dullDn), css(neutral), css(dullUp), css(sUp)],
    dim: [css(lerp(neutral, sDn, 0.16)), css(lerp(neutral, sUp, 0.16))],
    bull, bear, neutral, bg,
    ink: lbg > 0.5 ? [0.16, 0.18, 0.22] : [0.84, 0.86, 0.9],
    card: { up: solveSide(bg, lbg, bull, tint), dn: solveSide(bg, lbg, bear, tint), cap: scaleToLum(cup ? WHITE : INKD, targetLum(lbg, 4.0, cup)), shad: lbg > 0.5 ? 0.12 : 0.3 },
  };
  palCache.set(th.name, p);
  return p;
}

/** WaveStopColor at the shipped Smooth style (Contested fade 0, Chop tint 0.85) */
function waveColor(p: Pal, w: number, bias: number): C4 {
  w = cl(w, 0, 1);
  const conv = Math.abs(w - 0.5) * 2, tint = 0.85;
  const side = bias > 0 ? p.bull : bias < 0 ? p.bear : w >= 0.5 ? p.bull : p.bear;
  const hue = lerpP(p.bear, p.bull, w);
  let col = lerpP(side, hue, tint);
  col = lerpP(p.ink, col, 1 - tint * (1 - conv));
  return col;
}

const SPEC_NAME = ["STRONG DOWN", "DOWN", "CHOP", "UP", "STRONG UP"];
const SPEC_TONE: Tone[] = ["strongBear", "bear", "neutral", "bull", "strongBull"];
const f2 = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (x: number) => `${Math.round(x * 100)}%`;

export const study: StudyDef = {
  slug: "oracle",
  name: "DS Oracle",
  about: "Spectrum candles, the Neural Line, the SuperTrend trend line and the BUYERS / SELLERS cards the Dropship AI vote confirms — shipped settings, closed-bar engine.",
  layers: [
    { id: "cards", label: "Reversal cards", on: true, hint: "BUYERS / SELLERS cards with the TREND REVERSAL caption on the flips the vote confirmed and the three filters let through. Off by default in NinjaTrader (Show reversal cards)." },
    { id: "trend", label: "Trend line", on: true, hint: "The SuperTrend itself, coloured by the last confirmed direction. Off by default in NinjaTrader (Show trend line)." },
    { id: "plain", label: "Plain SuperTrend flips", on: false, hint: "Marks every raw flip of the same SuperTrend — what a plain SuperTrend would have signalled — so you can see how many the vote left unconfirmed." },
  ],
  run(s) {
    const o = computeOracle(s);
    const n = s.n;
    const from = s.replayFrom;

    // ---- running counts from the RTH open
    const cumFlip = new Int32Array(n), cumConf = new Int32Array(n), cumCard = new Int32Array(n);
    for (let i = 1; i < n; i++) {
      const inDay = i >= from;
      cumFlip[i] = cumFlip[i - 1] + (inDay && i > 2 && o.stDir[i] !== o.stDir[i - 1] ? 1 : 0);
      cumConf[i] = cumConf[i - 1] + (inDay && o.trendConf[i] !== o.trendConf[i - 1] ? 1 : 0);
      cumCard[i] = cumCard[i - 1] + (inDay && o.sig[i] !== 0 ? 1 : 0);
    }
    // since when the SuperTrend has pointed its current way / the bias held
    const stSince = new Int32Array(n), biasSince = new Int32Array(n), lastCard = new Int32Array(n).fill(-1);
    /** bar on which the confirmation in force was made (example hygiene: the trend line starts there) */
    const confAt = new Int32Array(n).fill(-1);
    for (let i = 1; i < n; i++) {
      confAt[i] = o.trendConf[i] !== o.trendConf[i - 1] ? i : confAt[i - 1];
      stSince[i] = o.stDir[i] !== o.stDir[i - 1] ? i : stSince[i - 1];
      biasSince[i] = o.bias[i] !== o.bias[i - 1] ? i : biasSince[i - 1];
      lastCard[i] = o.sig[i] !== 0 ? i : lastCard[i - 1];
    }

    // ---- events
    const events: StudyEvent[] = [];
    const flipText = (i: number, up: boolean) => {
      const at = stSince[i];
      return at === i
        ? `the SuperTrend flipped ${up ? "up" : "down"} on this bar (line ${f2(o.stLine[i])}) and`
        : `the SuperTrend has pointed ${up ? "up" : "down"} since ${hhmm(s, at)} (line ${f2(o.stLine[i])}) and now`;
    };
    // the vote share as printed: whole percent, one decimal where rounding would read as the threshold itself
    const share = (x: number) => {
      if (Math.round(x * 100) > Math.round(P.thr * 100)) return pct(x);
      for (let dg = 1; dg <= 4; dg++) { const m = Math.pow(10, dg), v = Math.floor(x * 100 * m) / m; if (v > P.thr * 100) return `${v.toFixed(dg)}%`; }
      return `${(x * 100).toFixed(5)}%`;
    };
    for (let i = from; i < n; i++) {
      const tc = o.trendConf[i], tp = o.trendConf[i - 1];
      if (tc !== tp && tc !== 0) {
        const up = tc > 0, sh = up ? o.probUp[i] : o.probDn[i];
        const voteTxt = `${share(sh)} of the weighted vote among the ${o.kEff} most similar past states sat in a settled ${up ? "uptrend" : "downtrend"} — above the ${pct(P.thr)} threshold`;
        if (o.sig[i] !== 0) {
          const prevCard = lastCard[i - 1], prevCand = o.sigAt[i - 1];
          events.push({
            i, price: s.c[i], tone: up ? "bull" : "bear", weight: 3, title: up ? "BUYERS" : "SELLERS",
            text: `${hhmm(s, i)} — ${flipText(i, up)} ${voteTxt}. The Neural Line holds a ${up ? "long" : "short"} bias${prevCard >= 0 ? `, the last card was ${o.sig[prevCard] > 0 ? "BUYERS" : "SELLERS"}` : ""} and ${prevCand >= 0 ? `the previous candidate came ${i - prevCand} bars earlier (${hhmm(s, prevCand)}), at least the 6-bar minimum` : "there is no earlier candidate"}, so the ${up ? "BUYERS" : "SELLERS"} card prints.`,
          });
        } else {
          // which filter held it back (the .cs order: line agreement, alternation, dwell)
          const b = o.bias[i];
          let why: string;
          if ((up && b < 0) || (!up && b > 0)) why = `the Neural Line holds a ${b > 0 ? "long" : "short"} bias, so no card prints (Require Neural Line agreement)`;
          else if (o.sigSide[i - 1] === (up ? 1 : -1)) why = `the last card was already ${up ? "BUYERS" : "SELLERS"} and sides must alternate, so no card prints`;
          else {
            const lastAt = o.sigAt[i - 1];
            why = `the previous candidate came only ${i - lastAt} bar${i - lastAt === 1 ? "" : "s"} earlier (${hhmm(s, lastAt)}) — under the 6-bar minimum — so no card prints`;
          }
          events.push({
            i, price: s.c[i], tone: up ? "bull" : "bear", weight: 2, title: up ? "CONFIRMED UP" : "CONFIRMED DOWN",
            text: `${hhmm(s, i)} — ${flipText(i, up)} ${voteTxt}, so the trend is confirmed; ${why}.`,
          });
        }
      }
      if (o.bias[i] !== o.bias[i - 1] && o.bias[i] !== 0) {
        const up = o.bias[i] > 0, lv = o.nl[i], buf = P.flipBuf * o.atr[i];
        events.push({
          i, price: lv, tone: up ? "bull" : "bear", weight: 2, title: up ? "LONG BIAS" : "SHORT BIAS",
          text: `${hhmm(s, i)} — the bar closed at ${f2(s.c[i])}, ${Math.abs(s.c[i] - lv).toFixed(2)} pts ${up ? "above" : "below"} the Neural Line (${f2(lv)}) and clear of its 0.25-ATR flip buffer (${buf.toFixed(2)} pts), so the side turns ${up ? "long" : "short"}.`,
        });
      }
    }
    events.sort((a, b) => a.i - b.i);

    // ---- what draw() needs
    let kRef = -1, liveRef: { i: number; o: number; h: number; l: number; c: number; frac: number } | null = null;
    let pal = palette(DARK);
    const liveSpec = () => {
      if (!liveRef || liveRef.i <= kRef || liveRef.i >= n) return null;
      return o.specLive(liveRef.i, liveRef.o, liveRef.h, liveRef.l, liveRef.c, s.v[liveRef.i] * cl(liveRef.frac, 0, 1));
    };

    const candle = (i: number): string | null => {
      if (i < 0 || i >= n) return null;
      if (liveRef && i === liveRef.i && i > kRef) {
        const r = liveSpec();
        if (!r) return null;
        return r.hollow ? pal.dim[r.hollow > 0 ? 1 : 0] : pal.spec[r.state + 2];
      }
      if (!o.specValid[i]) return null;
      const hol = o.specHollow[i];
      return hol ? pal.dim[hol > 0 ? 1 : 0] : pal.spec[o.specState[i] + 2];
    };

    const bodyRect = (d: Draw, i: number, op: number, cl0: number) => {
      const pv = d.price;
      const bodyW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      const x = Math.round(d.x(i));
      const yo = pv.y(op), yc = pv.y(cl0);
      const top = Math.round(Math.min(yo, yc)), bh = Math.max(1, Math.round(Math.abs(yc - yo)));
      const left = bodyW <= 2 ? x - Math.floor(bodyW / 2) : Math.round(x - bodyW / 2 + 0.5);
      return { x, left, top, w: Math.max(1, Math.round(bodyW)), h: bh };
    };
    const drawHollow = (d: Draw, i: number, hol: number, op: number, hi: number, lo: number, c: number) => {
      const edge = pal.spec[hol > 0 ? 4 : 0];
      const r = bodyRect(d, i, op, c);
      const ctx = d.ctx;
      ctx.fillStyle = edge;
      const yh = Math.round(d.price.y(hi)), yl = Math.round(d.price.y(lo));
      ctx.fillRect(r.x, yh, 1, Math.max(0, r.top - yh));
      ctx.fillRect(r.x, r.top + r.h, 1, Math.max(0, yl - (r.top + r.h)));
      if (r.w >= 3) { ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.strokeRect(r.left + 0.5, r.top + 0.5, r.w - 1, Math.max(1, r.h - 1)); }
    };

    const localExt = (b: number, to: number, low: boolean) => {
      let m = low ? Infinity : -Infinity;
      for (let q = Math.max(0, b - 4); q <= Math.min(to, b + 4); q++) m = low ? Math.min(m, s.l[q]) : Math.max(m, s.h[q]);
      return m;
    };

    const drawNeuralLine = (d: Draw) => {
      const pv = d.price, ctx = d.ctx;
      const a = Math.max(d.i0 - 1, 3), b = Math.min(d.i1, d.k);
      if (b - a < 1) return;
      const tw = 3;
      // edge lift: the chart ground under the line, 1.7 px down, 85% width, 0.55 alpha
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = css(pal.bg, 0.55); ctx.lineWidth = tw * 0.85;
      ctx.beginPath();
      for (let i = a; i <= b; i++) { const x = d.x(i), y = pv.y(o.nl[i]) + 1.7; if (i === a) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.lineWidth = tw;
      let px = d.x(a), py = pv.y(o.nl[a]);
      for (let i = a + 1; i <= b; i++) {
        const x = d.x(i), y = pv.y(o.nl[i]);
        const c0 = waveColor(pal, o.wS[i - 1], o.bias[i - 1]), c1 = waveColor(pal, o.wS[i], o.bias[i]);
        ctx.strokeStyle = css(lerp(c0, c1, 0.5));
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        px = x; py = y;
      }
      ctx.restore();
    };

    const drawTrend = (d: Draw) => {
      // DrawTrendLine: a segment b-1 -> b only while the confirmation and the SuperTrend
      // both hold; consecutive segments are stroked as one path so the 0.50 opacity
      // does not double up at the joints
      const pv = d.price, ctx = d.ctx;
      const to = Math.min(d.i1, d.k);
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 2;
      let run = 0, last = -2;
      const flush = () => { if (run) ctx.stroke(); run = 0; };
      for (let bb = Math.max(d.i0, 1); bb <= to; bb++) {
        const tc = o.trendConf[bb];
        const ok = o.heavy[bb] && tc !== 0 && tc === o.trendConf[bb - 1] && o.stDir[bb] === o.stDir[bb - 1] && confAt[bb] >= from;
        if (!ok) { flush(); continue; }
        if (run !== tc || last !== bb - 1) {
          flush();
          ctx.strokeStyle = css(tc > 0 ? pal.bull : pal.bear, 0.5);
          ctx.beginPath(); ctx.moveTo(d.x(bb - 1), pv.y(o.stLine[bb - 1]));
          run = tc;
        }
        ctx.lineTo(d.x(bb), pv.y(o.stLine[bb]));
        last = bb;
      }
      flush();
      ctx.restore();
    };

    const drawPlain = (d: Draw) => {
      const pv = d.price;
      const to = Math.min(d.i1, d.k);
      for (let i = Math.max(d.i0, 3); i <= to; i++) {
        if (o.stDir[i] === o.stDir[i - 1]) continue;
        const up = o.stDir[i] < 0;
        const col = d.alpha(up ? d.th.bull : d.th.bear, 0.85);
        const x = Math.round(d.x(i)) + 0.5;
        // the raw flip: a ghost tick from the bar's extreme out to a hollow square
        const yb = up ? pv.y(s.l[i]) + 6 : pv.y(s.h[i]) - 6;
        const ye = up ? yb + 9 : yb - 9;
        d.line([[x, yb], [x, ye]], col, 1);
        d.rect(x - 3, (up ? ye : ye - 6), x + 3, (up ? ye + 6 : ye), null, col, 1);
      }
    };

    const drawCards = (d: Draw) => {
      const pv = d.price, ctx = d.ctx;
      const to = Math.min(d.i1, d.k);
      const op = 1;
      for (let bb = Math.max(d.i0, 1); bb <= to; bb++) {
        const ev = o.sig[bb];
        if (!ev) continue;
        const bull = ev > 0;
        const x = d.x(bb);
        const ext = localExt(bb, to, bull);
        const yExt = pv.y(ext);
        const side = bull ? pal.card.up : pal.card.dn;
        const chW = bull ? 60 : 68, chH = 18, lead = 16;
        const cx = Math.round(x - chW / 2), cy = Math.round(bull ? yExt + lead : yExt - lead - chH);
        // leader + dot
        const lyEnd = bull ? cy : cy + chH, lyStart = bull ? yExt + 3 : yExt - 3;
        d.line([[Math.round(x) + 0.5, lyStart], [Math.round(x) + 0.5, lyEnd]], css(side.rail, 0.3 * op), 1);
        ctx.fillStyle = css(side.rail, 0.55 * op); ctx.beginPath(); ctx.arc(x, lyEnd, 1.5, 0, Math.PI * 2); ctx.fill();
        // shadow, panel, rail, edge
        d.rect(cx + 1.25, cy + 1.75, cx + 1.25 + chW, cy + 1.75 + chH, `rgba(0,0,0,${pal.card.shad * op})`, null);
        d.rect(cx, cy, cx + chW, cy + chH, css(side.panel, side.panelA * op), null);
        d.rect(cx + 1.5, cy + 2.5, cx + 4, cy + chH - 2.5, css(side.rail, 0.9 * op), null);
        d.rect(cx, cy, cx + chW - 1, cy + chH - 1, null, css(side.edge, 0.55 * op), 1);
        d.text(bull ? "BUYERS" : "SELLERS", cx + 5 + (chW - 5) / 2, cy + chH / 2 + 0.5, { color: css(side.text, op), size: 9.5, weight: 700, align: "center", font: "mono" });
        // TREND REVERSAL caption (beyond the card)
        const capH = 14;
        const ty = bull ? yExt + lead + chH + 4 : yExt - lead - chH - 4 - capH;
        d.text("TREND REVERSAL", x, ty + capH / 2, { color: css(pal.card.cap, 0.95 * op), size: 8.5, weight: 700, align: "center", font: "sans" });
      }
    };

    const stName = (i: number) => (o.stDir[i] < 0 ? "UP" : "DOWN");

    return {
      events,
      candle,
      priceExtent: (i0, i1, k) => {
        let lo = Infinity, hi = -Infinity;
        for (let i = Math.max(i0, 3); i <= Math.min(i1, k); i++) { const v = o.nl[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
        return isFinite(lo) ? [lo, hi] : null;
      },
      under: (d) => {
        kRef = d.k; liveRef = d.live; pal = palette(d.th);
      },
      draw: (d) => {
        kRef = d.k; liveRef = d.live; pal = palette(d.th);
        // hollow (unbacked) candles: full outline over the washed body
        for (let i = d.i0; i <= Math.min(d.i1, d.k); i++) {
          const hol = o.specHollow[i];
          if (hol && o.specValid[i]) drawHollow(d, i, hol, s.o[i], s.h[i], s.l[i], s.c[i]);
        }
        if (d.live && d.live.i <= d.i1) {
          const r = liveSpec();
          if (r && r.hollow) drawHollow(d, d.live.i, r.hollow, d.live.o, d.live.h, d.live.l, d.live.c);
        }
        if (d.on("plain")) drawPlain(d);
        if (d.on("trend")) drawTrend(d);
        drawNeuralLine(d);
        if (d.on("cards")) drawCards(d);
        const k = d.k;
        if (k >= 3 && isFinite(o.nl[k])) d.tag(d.price, o.nl[k], d.fmt(o.nl[k]), css(waveColor(pal, o.wS[k], o.bias[k])));
      },
      status: (k) => {
        const st = o.specValid[k] ? o.specState[k] : 0;
        const hol = o.specHollow[k];
        const items: ReadItem[] = [
          { label: "SuperTrend", value: o.heavy[k] && o.trendConf[k] === -o.stDir[k] ? (confAt[k] >= from ? `${stName(k)} · CONFIRMED` : stName(k)) : `${stName(k)} · UNCONFIRMED`, tone: o.stDir[k] < 0 ? "bull" : "bear" },
          { label: "Vote", value: o.heavy[k] && o.voteK[k] ? `${pct(o.probUp[k])} up · ${pct(o.probDn[k])} down` : "warming up" },
          { label: "Flips", value: k >= from ? `${cumFlip[k]} · confirmed ${cumConf[k]} · cards ${cumCard[k]}` : "—" },
          { label: "Spectrum", value: o.specValid[k] ? `${SPEC_NAME[st + 2]}${hol ? " · HOLLOW" : ""}` : "warming up", tone: SPEC_TONE[st + 2] },
          { label: "Neural Line", value: `${o.bias[k] > 0 ? "LONG" : o.bias[k] < 0 ? "SHORT" : "NO"} BIAS · ${f2(o.nl[k])}`, tone: o.bias[k] > 0 ? "bull" : o.bias[k] < 0 ? "bear" : "neutral" },
        ];
        return items;
      },
      readout: (i) => {
        const st = o.specValid[i] ? o.specState[i] : 0;
        const r: ReadItem[] = [
          { label: "Spectrum", value: o.specValid[i] ? `${SPEC_NAME[st + 2]}${o.specHollow[i] ? " · HOLLOW" : ""}` : "—", tone: SPEC_TONE[st + 2] },
          { label: "SuperTrend", value: `${stName(i)} · ${f2(o.stLine[i])}`, tone: o.stDir[i] < 0 ? "bull" : "bear" },
          { label: "Vote", value: o.heavy[i] && o.voteK[i] ? `${pct(o.probUp[i])} up · ${pct(o.probDn[i])} down` : "—" },
          { label: "Confirmed trend", value: confAt[i] < from ? "—" : o.trendConf[i] > 0 ? "UP" : o.trendConf[i] < 0 ? "DOWN" : "—", tone: confAt[i] < from ? undefined : o.trendConf[i] > 0 ? "bull" : o.trendConf[i] < 0 ? "bear" : undefined },
          { label: "Neural Line", value: `${f2(o.nl[i])} · ${o.bias[i] > 0 ? "long" : o.bias[i] < 0 ? "short" : "no"} bias`, tone: o.bias[i] > 0 ? "bull" : o.bias[i] < 0 ? "bear" : undefined },
        ];
        if (o.sig[i]) r.push({ label: "Card", value: o.sig[i] > 0 ? "BUYERS" : "SELLERS", tone: o.sig[i] > 0 ? "bull" : "bear" });
        return r;
      },
      legend: [
        { label: "Strong up", color: "#00FFFF", shape: "box" },
        { label: "Up", color: css(spectrumRamp(hex("#009999"), hex("#555555"), 0.65).dull), shape: "box" },
        { label: "Chop", color: "#555555", shape: "box" },
        { label: "Down", color: css(spectrumRamp(hex("#A33DFF"), hex("#555555"), 0.65).dull), shape: "box" },
        { label: "Strong down", color: "#FF00FF", shape: "box" },
        { label: "Neural Line", color: "#D6DBE5", shape: "line" },
        { label: "Trend line", color: "rgba(0,153,153,0.5)", shape: "line" },
      ],
    };
  },
};
