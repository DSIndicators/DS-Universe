import type { Draw, PaneView, ReadItem, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm } from "../ta";

/**
 * DS Stochastics — web edition. Source: DSStochastics.cs (Build 2026-10-05),
 * shipped defaults from ApplyDefaults(): Calculation CloseBar, Overbought 80 /
 * Oversold 20, lanes 9·3, 14·3, 40·4, 60·10 (%K smoothing 1), divergence on,
 * Pivot left 5 / right 3, span 5..100, Zone gate Extreme, hidden off, anchor
 * Smart, cluster 3 bars, 200 divergences kept, lifetime 80, arm expires after
 * 100 bars, PRIME window 8, price line confluence 2, line widths 2.
 *
 * PORTED (line for line from the .cs):
 *  · Each lane: raw %K = the close's place in the lane's high–low range (a flat
 *    range repeats the previous raw value, or 50), %K = raw (smoothing 1), %D =
 *    SMA of %K, each with the .cs's warm-up (period + smoothing + signal − 2).
 *  · Alignment (+n oversold lanes / −n overbought, 0 when split or incomplete),
 *    the nine panel states and their priority (LiveState()).
 *  · SetupEngine(): %D pivots confirmed 3 bars later (5 left, 3 right), the Smart
 *    price anchor window, regular divergence gated to the extreme zone,
 *    confluence counting across lanes within 3 bars, one price line per swing
 *    once 2 lanes agree, its trigger (the swing between the pivots) and its
 *    lifecycle (confirmed on a close through the trigger, gray dashed when the
 *    pattern breaks, removed after 80 bars unresolved); the quad latch (arm on
 *    the first quad close, release when the 60·10 crosses 50 or after 100 bars),
 *    ROTATION once per arm, PRIME (divergence while armed, or within 8 bars after
 *    the rotation), PULLBACK with the slow lane embedded.
 *  · Drawing: the four stacked lanes laid out in pixels inside one pane exactly
 *    as LayoutLanes() does (header 20 px, STATE ribbon 10 px + 4, lanes 5 px
 *    apart), lane bands / dashed 50, the alignment column, %K ghost, heat-coloured
 *    %D with its ground shadow, the lanes' divergence segments with end dots,
 *    lane names, value chips, ribbon state cells and trigger chevrons (double over
 *    a halo for PRIME), stems, the header (STOCH nn + state, LOW/HIGH n/4, DIV
 *    chip) — and on the price panel the DsStDivLine and DsStMark tools with the
 *    S rune. Panel colours adapt to the ground as the .cs does (Deepen 0.62 on
 *    light, 12% toward white on dark); the price-panel tools use the raw brushes,
 *    as their NinjaTrader Strokes do.
 *
 * DEVIATIONS
 *  · Mark size: NinjaTrader sizes a mark from the chart style's BarWidth
 *    (r = 0.9 × BarWidth, held to 3–6.5 px; the S rune shows from r = 4). The web
 *    edition takes r from the bar spacing (0.55 × spacing, same limits).
 *  · The DS label bus that stacks marks from several DS panels on one bar is not
 *    needed (one tool on the chart), so every mark sits in the first row.
 *  · Div history 5000 bars / Mark history 750 bars are load guards that depend on
 *    how many bars the chart holds when opened; here every line and mark gets its
 *    drawing. They never change the engine or the events.
 *  · Fonts: Segoe UI / Arial in NinjaTrader, the site's mono here.
 *  · Alerts (off by default) are not part of the replay.
 *  · Example hygiene (web showcase): a divergence whose first pivot (on the
 *    lane or on price) sits before the first shown bar (s.replayFrom) is not
 *    drawn — neither its lane segment nor its price line and S rune — not
 *    narrated, and not counted in the DIV chip / status; nor is a ROTATION /
 *    PULLBACK mark stamped before that bar, nor any event stamped before it.
 *    Nor is an arm whose quad closed before that bar: its ARMED state cells and
 *    Latch read fall back to what they read without the arm (EMBEDDED / neutral,
 *    "not armed"), and a ROTATION / PRIME ROTATION it gives is not marked or
 *    narrated — a chart never opens armed by a quad the visitor did not see.
 *    Every divergence, latch, state and signal is computed exactly as before
 *    (a PRIME still counts a divergence the chart does not draw).
 * The narration marks ROTATION / PRIME ROTATION (weight 3), QUAD OVERSOLD /
 * QUAD OVERBOUGHT arming and PULLBACK (weight 2), and each divergence line the
 * tool puts on the price panel (weight 1). Lane-only divergences are drawn, not
 * narrated.
 */

const OB = 80, OS = 20;
const PER = [9, 14, 40, 60], SM = [1, 1, 1, 1], SG = [3, 3, 4, 10];
const LANES = 4, FAST = 0, SLOW = 3;
const WIN = SM.map((s, i) => Math.floor((s + SG[i] + 1) / 2)); // Smart anchor
const NAME = PER.map((p, i) => SM[i] > 1 ? `${p} · ${SM[i]} · ${SG[i]}` : `${p} · ${SG[i]}`);
const PIV_L = 5, PIV_R = 3, MIN_SPAN = 5, MAX_SPAN = 100, CLUSTER = 3, MAX_DIV = 200, LIFE = 80;
const MAX_ARM = 100, PRIME_WIN = 8, CONFLUENCE = 2, LINE_W = 2, DIV_W = 2;
const ST_NEUTRAL = 0, ST_QOS = 1, ST_QOB = 2, ST_ARML = 3, ST_ARMS = 4, ST_EMBB = 5, ST_EMBR = 6, ST_PULL = 7, ST_PULS = 8;
const LF_PENDING = 0, LF_CONFIRMED = 1, LF_INVALID = 2, LF_EXPIRED = 3;
const RIB_H = 10, RIB_GAP = 4, LANE_GAP = 5, GAP = 9, RUNE_MIN_R = 4;

type RGB = [number, number, number];
const C_BULL: RGB = [0, 153, 153], C_BEAR: RGB = [163, 61, 255], C_UP: RGB = [240, 163, 92], C_DN: RGB = [190, 95, 70], C_NEUT: RGB = [128, 136, 148];
const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const lerp = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lit = (c: RGB, light: boolean): RGB => light ? [c[0] * 0.62, c[1] * 0.62, c[2] * 0.62] : [c[0] + (255 - c[0]) * 0.12, c[1] + (255 - c[1]) * 0.12, c[2] + (255 - c[2]) * 0.12];
type Pal = { light: boolean; ground: RGB; ink: RGB; bull: RGB; bear: RGB; up: RGB; dn: RGB };
const pal = (d: Draw): Pal => {
  const light = d.th.name === "light";
  return {
    light, ground: light ? [226, 226, 226] : [0, 0, 0],
    ink: light ? [0.16 * 255, 0.18 * 255, 0.22 * 255] : [0.84 * 255, 0.86 * 255, 0.9 * 255],
    bull: lit(C_BULL, light), bear: lit(C_BEAR, light), up: lit(C_UP, light), dn: lit(C_DN, light),
  };
};

type Div = {
  lane: number; bull: boolean; bar0: number; val0: number; pb0: number; px0: number;
  bar1: number; val1: number; pb1: number; px1: number; confirm: number; cluster: number;
  drawn: boolean; trigger: number; life: number; resolved: number; gone: number;
};

export const study: StudyDef = {
  slug: "stochastics",
  name: "DS Stochastics",
  about: "Four stochastics in four lanes: a quad latch arms at a shared extreme, the fast lane's turn back out is the ROTATION.",
  panes: [{ id: "stoch", title: "DS Stochastics", weight: 0.85, range: [0, 100], digits: 0 }],
  layers: [
    { id: "divs", label: "Divergence", on: true, hint: "Divergence segments on the lanes and the confluence lines on price." },
    { id: "k", label: "%K lines", on: true, hint: "The thin %K beside each lane's %D (Show %K line)." },
  ],
  run(s) {
    const n = s.n;
    const K = Array.from({ length: LANES }, () => new Float64Array(n).fill(NaN));
    const D = Array.from({ length: LANES }, () => new Float64Array(n).fill(NaN));
    const raw = Array.from({ length: LANES }, () => new Float64Array(n).fill(NaN));
    const align = new Int8Array(n), state = new Uint8Array(n), evt = new Int8Array(n), divNet = new Int8Array(n);
    const armA = new Int8Array(n); // +1 armed long, -1 armed short
    // example hygiene (display only): the bar of the quad that started the arm in force / that a rotation belongs to
    const armFrom = new Int32Array(n).fill(-1), evArm = new Int32Array(n).fill(-1);
    const divs: Div[] = [];
    let events: StudyEvent[] = [];
    const divEvent = new Map<Div, number>();
    // example hygiene (DEVIATIONS): nothing anchored before the first shown bar is drawn, narrated or counted
    const R0 = s.replayFrom;
    const shownDiv = (dv: Div) => Math.min(dv.bar0, dv.pb0) >= R0;

    const alignmentAt = (i: number) => {
      let nOS = 0, nOB = 0;
      for (let l = 0; l < LANES; l++) {
        const d = D[l][i];
        if (isNaN(d)) return 0;
        if (d <= OS) nOS++; else if (d >= OB) nOB++;
      }
      if (nOS > 0 && nOB === 0) return nOS;
      if (nOB > 0 && nOS === 0) return -nOB;
      return 0;
    };
    let armLong = false, armShort = false, lastQuadOS = false, lastQuadOB = false, lastArmLong = false;
    let armStart = -1, rotBar = -1, divBar = -1, primed = false;
    const liveState = (i: number) => {
      const al = alignmentAt(i);
      if (al >= LANES) return ST_QOS;
      if (-al >= LANES) return ST_QOB;
      const fD = D[FAST][i], sD = D[SLOW][i];
      if (isNaN(fD) || isNaN(sD)) return ST_NEUTRAL;
      if (sD >= OB && fD <= OS) return ST_PULL;
      if (sD <= OS && fD >= OB) return ST_PULS;
      if (armLong) return ST_ARML;
      if (armShort) return ST_ARMS;
      if (sD >= OB) return ST_EMBB;
      if (sD <= OS) return ST_EMBR;
      return ST_NEUTRAL;
    };

    const pvLowBar = [-1, -1, -1, -1], pvHighBar = [-1, -1, -1, -1];
    const pvLowVal = [0, 0, 0, 0], pvHighVal = [0, 0, 0, 0], pvLowPBar = [0, 0, 0, 0], pvHighPBar = [0, 0, 0, 0];
    const pvLowPx = [0, 0, 0, 0], pvHighPx = [0, 0, 0, 0];
    let lastLineBull = -1, lastLineBear = -1;
    let liveDiv: Div[] = [];

    const pivotKind = (l: number, p: number) => {
      if (p - PIV_L < 0) return 0;
      const v = D[l][p];
      if (isNaN(v)) return 0;
      let lo = true, hi = true;
      for (let k = 1; k <= PIV_L && (lo || hi); k++) {
        const u = D[l][p - k];
        if (isNaN(u)) return 0;
        if (!(v < u)) lo = false;
        if (!(v > u)) hi = false;
      }
      for (let k = 1; k <= PIV_R && (lo || hi); k++) {
        const u = D[l][p + k];
        if (isNaN(u)) return 0;
        if (!(v <= u)) lo = false;
        if (!(v >= u)) hi = false;
      }
      return (lo ? 1 : 0) | (hi ? 2 : 0);
    };
    const priceExtreme = (low: boolean, p: number, bar: number, win: number) => {
      const from = win > 0 ? bar : p, to = Math.max(0, p - win);
      let best = p, ext = low ? Infinity : -Infinity;
      for (let j = from; j >= to; j--) {
        const v = low ? s.l[j] : s.h[j];
        if (low ? v < ext : v > ext) { ext = v; best = j; }
      }
      return { pb: best, px: ext };
    };
    const bornDiv = (lane: number, bull: boolean, bar0: number, v0: number, pb0: number, px0: number, bar1: number, v1: number, pb1: number, px1: number, confirm: number) => {
      const d: Div = { lane, bull, bar0, val0: v0, pb0, px0, bar1, val1: v1, pb1, px1, confirm, cluster: 1, drawn: false, trigger: NaN, life: LF_PENDING, resolved: -1, gone: -1 };
      let mask = 1 << lane;
      const kept = divs.filter((x) => x.gone < 0);
      for (let k = kept.length - 1; k >= 0; k--) { const e = kept[k]; if (confirm - e.confirm > CLUSTER) break; if (e.bull === bull) mask |= 1 << e.lane; }
      let cl = 0;
      for (let b = 0; b < LANES; b++) if (mask & (1 << b)) cl++;
      d.cluster = cl;
      for (let k = kept.length - 1; k >= 0; k--) { const e = kept[k]; if (confirm - e.confirm > CLUSTER) break; if (e.bull === bull && e.cluster < cl) e.cluster = cl; }
      divs.push(d);
      let keptN = kept.length + 1;
      for (let j = 0; keptN > MAX_DIV && j < divs.length; j++) {
        const old = divs[j];
        if (old.gone >= 0) continue;
        old.gone = confirm; keptN--;
        liveDiv = liveDiv.filter((x) => x !== old);
      }
      const last = bull ? lastLineBull : lastLineBear;
      if (cl >= CONFLUENCE && (last < 0 || confirm - last > CLUSTER)) {
        d.drawn = true; d.life = LF_PENDING;
        if (bull) lastLineBull = confirm; else lastLineBear = confirm;
        let sw = bull ? -Infinity : Infinity;
        for (let b = bar0; b <= bar1; b++) { const v = bull ? s.h[b] : s.l[b]; if (bull ? v > sw : v < sw) sw = v; }
        d.trigger = sw;
        liveDiv.push(d);
        divEvent.set(d, events.length);
        events.push({
          i: confirm, price: px1, tone: bull ? "bull" : "bear", weight: 1, pane: "price",
          title: `${bull ? "BULLISH" : "BEARISH"} DIVERGENCE ×${cl}`,
          text: `${hhmm(s, confirm)} — the ${NAME[lane]} %D pivot at ${hhmm(s, bar1)} confirmed (${bull ? "higher" : "lower"} %D ${v1.toFixed(0)} vs ${v0.toFixed(0)}) while price made a ${bull ? "lower low" : "higher high"} (${s.tick < 1 ? px1.toFixed(2) : px1}); ${cl} lanes diverged within 3 bars, so the swing gets its line on price. It confirms on a close ${bull ? "above" : "below"} ${trig(sw)}.`,
        });
      }
      return cl;
    };
    const trig = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const lifecycle = (bar: number) => {
      const hi = s.h[bar], lo = s.l[bar], cl = s.c[bar];
      for (let q = liveDiv.length - 1; q >= 0; q--) {
        const d = liveDiv[q];
        const src = D[d.lane][bar];
        let life = LF_PENDING;
        if (d.bull) {
          if (lo < d.px1 && !isNaN(src) && src < d.val1) life = LF_INVALID;
          else if (cl > d.trigger) life = LF_CONFIRMED;
        } else {
          if (hi > d.px1 && !isNaN(src) && src > d.val1) life = LF_INVALID;
          else if (cl < d.trigger) life = LF_CONFIRMED;
        }
        if (life === LF_PENDING && LIFE > 0 && bar - d.confirm > LIFE) life = LF_EXPIRED;
        if (life === LF_PENDING) continue;
        d.life = life; d.resolved = bar;
        liveDiv.splice(q, 1);
      }
    };

    const setupEngine = (bar: number) => {
      let bullN = 0, bearN = 0;
      const p = bar - PIV_R;
      for (let l = 0; l < LANES; l++) {
        if (p < 0) break;
        const kind = pivotKind(l, p);
        if (kind === 0) continue;
        const dv = D[l][p];
        if (kind & 1) {
          const { pb, px } = priceExtreme(true, p, bar, WIN[l]);
          if (pvLowBar[l] >= 0) {
            const span = p - pvLowBar[l];
            if (span >= MIN_SPAN && span <= MAX_SPAN && px < pvLowPx[l] && dv > pvLowVal[l] && Math.min(dv, pvLowVal[l]) <= OS) {
              bornDiv(l, true, pvLowBar[l], pvLowVal[l], pvLowPBar[l], pvLowPx[l], p, dv, pb, px, bar);
              bullN++;
            }
          }
          pvLowBar[l] = p; pvLowVal[l] = dv; pvLowPBar[l] = pb; pvLowPx[l] = px;
        }
        if (kind & 2) {
          const { pb, px } = priceExtreme(false, p, bar, WIN[l]);
          if (pvHighBar[l] >= 0) {
            const span = p - pvHighBar[l];
            if (span >= MIN_SPAN && span <= MAX_SPAN && px > pvHighPx[l] && dv < pvHighVal[l] && Math.max(dv, pvHighVal[l]) >= OB) {
              bornDiv(l, false, pvHighBar[l], pvHighVal[l], pvHighPBar[l], pvHighPx[l], p, dv, pb, px, bar);
              bearN++;
            }
          }
          pvHighBar[l] = p; pvHighVal[l] = dv; pvHighPBar[l] = pb; pvHighPx[l] = px;
        }
      }
      divNet[bar] = bullN - bearN;
      lifecycle(bar);

      const al = alignmentAt(bar);
      const quadOS = al >= LANES, quadOB = -al >= LANES;
      const fD = D[FAST][bar], fD1 = D[FAST][bar - 1], sD = D[SLOW][bar];
      if (isNaN(fD) || isNaN(sD)) { state[bar] = ST_NEUTRAL; return; }
      const enterOS = quadOS && !lastQuadOS, enterOB = quadOB && !lastQuadOB;
      lastQuadOS = quadOS; lastQuadOB = quadOB;
      const rearm = (enterOS && armLong) || (enterOB && armShort);
      if (enterOS) { armLong = true; armShort = false; armStart = bar; rotBar = -1; divBar = -1; primed = false; lastArmLong = true; }
      else if (enterOB) { armShort = true; armLong = false; armStart = bar; rotBar = -1; divBar = -1; primed = false; lastArmLong = false; }
      if (armLong && (sD > 50 || bar - armStart > MAX_ARM)) armLong = false;
      if (armShort && (sD < 50 || bar - armStart > MAX_ARM)) armShort = false;
      if (enterOS || enterOB) {
        const up = enterOS;
        events.push({
          i: bar, price: up ? s.l[bar] : s.h[bar], tone: up ? "bull" : "bear", weight: rearm ? 1 : 2, pane: "stoch",
          title: up ? "QUAD OVERSOLD" : "QUAD OVERBOUGHT",
          text: rearm
            ? `${hhmm(s, bar)} — every lane's %D is back at or ${up ? "below" : "above"} ${up ? OS : OB} after at least one had left the zone: a fresh quad re-arms the ${up ? "long" : "short"} latch, so one more ROTATION can be given.`
            : `${hhmm(s, bar)} — all four lanes' %D (${NAME.join(", ")}) closed at or ${up ? "below" : "above"} ${up ? OS : OB} on the same bar. The panel arms ${up ? "long" : "short"} until the 60 · 10 crosses back through 50 or the arm is 100 bars old.`,
        });
      }
      if (armLong && bullN > 0) divBar = bar;
      if (armShort && bearN > 0) divBar = bar;

      let ev = 0;
      let primeLate = false;
      const fD2 = bar >= 2 ? D[FAST][bar - 2] : NaN;
      if (!isNaN(fD1) && !isNaN(fD2)) {
        const xUp = fD2 <= OS && fD1 > OS && fD > fD1;
        const xDn = fD2 >= OB && fD1 < OB && fD < fD1;
        if (xUp) {
          if (armLong) { if (rotBar < armStart) { rotBar = bar; ev = 1; if (divBar >= armStart && !primed) { ev = 2; primed = true; } } }
          else if (sD >= OB) ev = 3;
        } else if (xDn) {
          if (armShort) { if (rotBar < armStart) { rotBar = bar; ev = -1; if (divBar >= armStart && !primed) { ev = -2; primed = true; } } }
          else if (sD <= OS) ev = -3;
        }
        if (ev === 0 && !primed) {
          if (rotBar >= armStart && bar - rotBar <= PRIME_WIN) {
            if (bullN > 0 && lastArmLong) { ev = 2; primed = true; primeLate = true; }
            if (bearN > 0 && !lastArmLong) { ev = -2; primed = true; primeLate = true; }
          }
        }
      }
      evt[bar] = ev;
      if (ev === 1 || ev === -1 || ev === 2 || ev === -2) evArm[bar] = armStart;
      state[bar] = liveState(bar);
      if (ev !== 0) {
        const bull = ev > 0, kind = Math.abs(ev);
        const t = hhmm(s, bar), tp = hhmm(s, bar - 1);
        const turnTxt = `the 9 · 3 %D closed back ${bull ? "above " + OS : "below " + OB} at ${tp} (${fD1.toFixed(0)}) and ${bull ? "higher" : "lower"} again on this close (${fD.toFixed(0)})`;
        let title = "", text = "";
        if (kind === 1) { title = "ROTATION"; text = `${t} — armed ${bull ? "long" : "short"} since the quad at ${hhmm(s, armStart)}, ${turnTxt}. One ROTATION per arm.`; }
        else if (kind === 2 && !primeLate) { title = "PRIME ROTATION"; text = `${t} — armed ${bull ? "long" : "short"} since the quad at ${hhmm(s, armStart)}, ${turnTxt}, and a ${bull ? "bullish" : "bearish"} divergence was born while the panel was armed.`; }
        else if (kind === 2) { title = "PRIME ROTATION"; text = `${t} — a ${bull ? "bullish" : "bearish"} divergence confirmed ${bar - rotBar} bar${bar - rotBar === 1 ? "" : "s"} after the ROTATION at ${hhmm(s, rotBar)}, inside the 8-bar PRIME window, so the rotation is marked PRIME here, on the divergence's bar.`; }
        else { title = "PULLBACK"; text = `${t} — the 60 · 10 is embedded ${bull ? "above " + OB : "below " + OS} (${sD.toFixed(0)}) and ${turnTxt}: a turn with the slow lane's trend.`; }
        events.push({ i: bar, price: bull ? s.l[bar] : s.h[bar], tone: kind === 3 ? "gold" : bull ? "bull" : "bear", weight: kind === 3 ? 2 : 3, title, text });
      }
    };

    for (let i = 0; i < n; i++) {
      for (let l = 0; l < LANES; l++) {
        const per = PER[l], sm = SM[l], sg = SG[l];
        let k = NaN;
        if (i >= per - 1) {
          let hh = -Infinity, ll = Infinity;
          for (let j = i - per + 1; j <= i; j++) { if (s.h[j] > hh) hh = s.h[j]; if (s.l[j] < ll) ll = s.l[j]; }
          const den = hh - ll;
          let r0 = NaN;
          if (den > 0) { const v = 100 * (s.c[i] - ll) / den; r0 = v < 0 ? 0 : v > 100 ? 100 : v; }
          if (isNaN(r0)) { const pv = i >= 1 ? raw[l][i - 1] : NaN; r0 = isNaN(pv) ? 50 : pv; }
          raw[l][i] = r0;
          if (i >= per - 1 + sm - 1) {
            let sum = r0, ok = true;
            for (let j = 1; j < sm; j++) { const r = raw[l][i - j]; if (isNaN(r)) { ok = false; break; } sum += r; }
            if (ok) k = sum / sm;
          }
        }
        K[l][i] = k;
        if (!isNaN(k) && i >= per - 1 + sm - 1 + sg - 1) {
          let sum = 0, c = 0;
          for (let j = 0; j < sg && j <= i; j++) { const v = K[l][i - j]; if (isNaN(v)) break; sum += v; c++; }
          if (c === sg) D[l][i] = sum / sg;
        }
      }
      align[i] = alignmentAt(i);
      state[i] = liveState(i);
      if (i > 0) setupEngine(i);
      armA[i] = armLong ? 1 : armShort ? -1 : 0;
      armFrom[i] = armLong || armShort ? armStart : -1;
    }
    {
      const hidden = new Set<StudyEvent>();
      for (const [dv, j] of divEvent) if (!shownDiv(dv)) hidden.add(events[j]);
      // an arm whose quad closed before the first shown bar: its ARMED state, its Latch and its ROTATION are
      // not shown (the state falls back to what it reads without the arm, exactly as liveState() orders it)
      const hiddenRot = new Set<number>();
      for (let i = R0; i < n; i++) {
        if (armA[i] !== 0 && armFrom[i] < R0) {
          armA[i] = 0;
          if (state[i] === ST_ARML || state[i] === ST_ARMS) { const sD = D[SLOW][i]; state[i] = sD >= OB ? ST_EMBB : sD <= OS ? ST_EMBR : ST_NEUTRAL; }
        }
        const e = evt[i];
        if ((e === 1 || e === -1 || e === 2 || e === -2) && evArm[i] < R0) { evt[i] = 0; hiddenRot.add(i); }
      }
      for (const e of events) if (hiddenRot.has(e.i) && /ROTATION/.test(e.title)) hidden.add(e);
      events = events.filter((e) => e.i >= R0 && !hidden.has(e));
      // the readout's divergence count, of the divergences the chart draws
      divNet.fill(0);
      for (const dv of divs) if (shownDiv(dv)) divNet[dv.confirm] += dv.bull ? 1 : -1;
    }
    events.sort((a, b) => a.i - b.i);

    // ------------------------------------------------------------ helpers
    const lastDivAt = (k: number) => {
      for (let j = divs.length - 1; j >= 0; j--) if (divs[j].confirm <= k && shownDiv(divs[j])) return divs[j];
      return null;
    };
    const stateWord = (i: number): { t: string; tone: Tone; key: "bull" | "bear" | "up" | "dn" | "ink" } => {
      const ev = evt[i], st = state[i];
      if (ev === 2) return { t: "▲ PRIME ROTATION", tone: "bull", key: "bull" };
      if (ev === -2) return { t: "▼ PRIME ROTATION", tone: "bear", key: "bear" };
      if (ev === 1) return { t: "▲ ROTATION", tone: "bull", key: "bull" };
      if (ev === -1) return { t: "▼ ROTATION", tone: "bear", key: "bear" };
      if (ev === 3) return { t: "▲ PULLBACK", tone: "gold", key: "up" };
      if (ev === -3) return { t: "▼ PULLBACK", tone: "gold", key: "dn" };
      if (st === ST_QOS) return { t: "● QUAD OVERSOLD", tone: "bull", key: "bull" };
      if (st === ST_QOB) return { t: "● QUAD OVERBOUGHT", tone: "bear", key: "bear" };
      if (st === ST_PULL) return { t: "▲ PULLBACK ZONE", tone: "gold", key: "up" };
      if (st === ST_PULS) return { t: "▼ PULLBACK ZONE", tone: "gold", key: "dn" };
      if (st === ST_ARML) return { t: "▲ ARMED", tone: "bull", key: "bull" };
      if (st === ST_ARMS) return { t: "▼ ARMED", tone: "bear", key: "bear" };
      if (st === ST_EMBB) return { t: "▲ EMBEDDED", tone: "gold", key: "up" };
      if (st === ST_EMBR) return { t: "▼ EMBEDDED", tone: "gold", key: "dn" };
      const fK = K[FAST][i], fD = D[FAST][i];
      if (!isNaN(fK) && fK >= fD) return { t: "▲ BULLISH", tone: "neutral", key: "ink" };
      return { t: "▼ BEARISH", tone: "neutral", key: "ink" };
    };
    const heat = (p: Pal, v: number): RGB => {
      if (v <= OS) return p.bull;
      if (v >= OB) return p.bear;
      if (v < 50) return lerp(p.bull, p.ink, (v - OS) / Math.max(1, 50 - OS));
      return lerp(p.ink, p.bear, (v - 50) / Math.max(1, OB - 50));
    };
    const markR = (d: Draw) => Math.max(3, Math.min(6.5, d.bw * 0.55));
    const runeFs = (r: number) => { let fs = r * 1.9; fs = Math.max(9, Math.min(20, fs)); return Math.floor(Math.max(7, Math.min(30, fs)) + 0.5); };
    const drawRune = (d: Draw, hue: string, ground: string, cx: number, ty: number, fs: number) => {
      const h = fs * 1.45, cy = ty + h / 2;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) d.text("S", cx + dx, cy + dy, { color: ground, size: fs, weight: 700, align: "center" });
      d.text("S", cx, cy, { color: hue, size: fs, weight: 700, align: "center" });
    };

    // ------------------------------------------------------------ price panel: lines + marks
    const drawPrice = (d: Draw) => {
      const pv = d.price, k = d.k, ctx = d.ctx;
      const ground = d.th.name === "light" ? "rgb(226,226,226)" : "rgb(0,0,0)";
      ctx.save(); ctx.beginPath(); ctx.rect(0, pv.top, d.plotRight, pv.bottom - pv.top); ctx.clip();
      const r = markR(d), fs = runeFs(r), wantRune = r >= RUNE_MIN_R;
      const markRune = new Set<string>();
      // marks
      for (let i = Math.max(1, R0, d.i0 - 2); i <= Math.min(d.i1, k); i++) {
        const ev = evt[i]; if (ev === 0) continue;
        const up = ev > 0, kind = Math.abs(ev);
        const hue = kind === 3 ? (up ? C_UP : C_DN) : (up ? C_BULL : C_BEAR);
        const ax = d.x(i), ay = pv.y(up ? s.l[i] : s.h[i]);
        const w = Math.max(1.3, Math.min(2.2, r * 0.34)), rise = r * 0.62;
        const nn = kind === 2 ? 2 : 1, pitch = r * 0.95, span = rise + (nn - 1) * pitch;
        const top = up ? ay + GAP : ay - GAP - span;
        if (kind === 2) {
          const hr = Math.min(r * 2.1, GAP + span * 0.5 - 1);
          if (hr > 0.5) { ctx.fillStyle = rgba(hue, 41 / 255); ctx.beginPath(); ctx.arc(ax, top + span * 0.5, hr, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.save(); ctx.strokeStyle = rgba(hue, 1); ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (let q = 0; q < nn; q++) {
          const yb = up ? top + rise + q * pitch : top + q * pitch, yt = up ? yb - rise : yb + rise;
          ctx.beginPath(); ctx.moveTo(ax - r, yb); ctx.lineTo(ax, yt); ctx.lineTo(ax + r, yb); ctx.stroke();
        }
        ctx.restore();
        if (wantRune) {
          const tail = up ? top + span : top;
          drawRune(d, rgba(hue, 0.92), ground, ax, up ? tail + 2 : tail - fs * 1.45 - 2, fs);
          markRune.add(`${i}|${up ? 1 : 0}`);
        }
      }
      // divergence lines
      if (d.on("divs")) for (const dv of divs) {
        if (!dv.drawn || dv.confirm > k || !shownDiv(dv)) continue;
        if (dv.gone >= 0 && dv.gone <= k) continue;
        const resolved = dv.resolved >= 0 && dv.resolved <= k;
        if (resolved && dv.life === LF_EXPIRED) continue;
        if (dv.pb1 < d.i0 - 400 || dv.pb0 > d.i1) continue;
        let col = rgba(dv.bull ? C_BULL : C_BEAR, 0.9), wdt = DIV_W, dash: number[] | undefined;
        if (resolved && dv.life === LF_CONFIRMED) col = rgba(dv.bull ? C_BULL : C_BEAR, 1);
        if (resolved && dv.life === LF_INVALID) { col = rgba(C_NEUT, 0.42); wdt = 1; dash = [4, 3]; }
        const x0 = d.x(dv.pb0), y0 = pv.y(dv.px0), x1 = d.x(dv.pb1), y1 = pv.y(dv.px1);
        ctx.save(); ctx.lineCap = "round"; d.line([[x0, y0], [x1, y1]], col, wdt, dash); ctx.restore();
        if (!markRune.has(`${dv.pb1}|${dv.bull ? 1 : 0}`)) {
          const atEnd = x1 >= x0, fsl = runeFs(5);
          drawRune(d, col, ground, (atEnd ? x1 : x0) + 9, (atEnd ? y1 : y0) - fsl * 1.45 * 0.5, fsl);
        }
      }
      ctx.restore();
    };

    // ------------------------------------------------------------ the DS Stochastics panel
    const drawPanel = (d: Draw, pv: PaneView) => {
      const p = pal(d), ctx = d.ctx, k = d.k;
      const py = pv.top, ph = pv.bottom - pv.top;
      const x1 = 2, x2 = d.plotRight - 2, w = x2 - x1;
      ctx.save(); ctx.beginPath(); ctx.rect(0, py, d.plotRight, ph); ctx.clip();
      const topPad = ph < 96 ? 14 : 20, ribOn = ph >= 60;
      const lanesTop = py + topPad + (ribOn ? RIB_H + RIB_GAP : 0), lanesBot = py + ph - 2;
      const lh = (lanesBot - lanesTop - LANE_GAP * (LANES - 1)) / LANES;
      const fit = lh >= 10;
      const lt: number[] = [], lb: number[] = [];
      for (let l = 0, y = lanesTop; l < LANES; l++, y += lh + LANE_GAP) { lt.push(Math.floor(y) + 2); lb.push(Math.floor(y + lh) - 2); }
      const LY = (l: number, v: number) => lb[l] - (v / 100) * (lb[l] - lt[l]);
      const i0 = d.i0, i1 = Math.min(d.i1, k);
      const paintW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));

      if (fit) {
        // lane bands
        for (let l = 0; l < LANES; l++) {
          const yTop = LY(l, 100), yOb = LY(l, OB), yMid = LY(l, 50), yOs = LY(l, OS), yBot = LY(l, 0);
          if (yOb > yTop + 0.5) d.rect(x1, yTop, x2, yOb, rgba(p.bear, 0.05));
          if (yBot > yOs + 0.5) d.rect(x1, yOs, x2, yBot, rgba(p.bull, 0.05));
          d.rect(x1, Math.round(yOb), x2, Math.round(yOb) + 1, rgba(p.bear, 0.24));
          d.rect(x1, Math.round(yOs), x2, Math.round(yOs) + 1, rgba(p.bull, 0.24));
          if (lb[l] - lt[l] >= 30) d.line([[x1, Math.round(yMid) + 0.5], [x2, Math.round(yMid) + 0.5]], rgba(p.ink, 0.14), 1, [4, 4]);
        }
        // alignment column
        for (let i = i0; i <= i1; i++) {
          const v = align[i], a = Math.abs(v);
          if (a < 2) continue;
          const alpha = a >= LANES ? 0.12 : a === 2 ? 0.035 : 0.07;
          const xa = d.x(i) - paintW / 2;
          d.rect(xa, lanesTop, xa + paintW, lanesBot, rgba(v > 0 ? p.bull : p.bear, alpha));
        }
        // stems
        if (ribOn) {
          const yT = py + topPad + RIB_H;
          for (let i = i0; i <= i1; i++) {
            const e = evt[i]; if (e === 0) continue;
            const v = D[FAST][i]; if (isNaN(v)) continue;
            const yB = LY(FAST, v); if (yB <= yT + 1) continue;
            const x = Math.floor(d.x(i));
            d.rect(x, yT, x + 1, yB, rgba(eventHue(p, e), 0.16));
          }
        }
      }
      // STATE ribbon
      if (ribOn) {
        const y = py + topPad;
        d.rect(x1, y, x2, y + RIB_H, rgba(C_NEUT, 0.1));
        for (let i = i0; i <= i1; i++) {
          const st = state[i]; if (st === 0) continue;
          const xa = d.x(i) - paintW / 2;
          d.rect(xa, y, xa + paintW, y + RIB_H, stateColor(p, st));
        }
        const cy = y + RIB_H * 0.5, r = Math.max(2.6, Math.min(4.2, paintW * 0.5 + 1.6));
        for (let i = i0; i <= i1; i++) {
          const e = evt[i]; if (e === 0) continue;
          const x = d.x(i), up = e > 0, hue = eventHue(p, e);
          if (Math.abs(e) === 2) {
            ctx.fillStyle = rgba(hue, 0.22); ctx.beginPath(); ctx.arc(x, cy, r * 1.9, 0, Math.PI * 2); ctx.fill();
            const pitch = r * 0.62;
            const ya = up ? cy + pitch * 0.5 : cy - pitch * 0.5, yb = up ? cy - pitch * 0.5 : cy + pitch * 0.5;
            chevron(d, x, ya, r, 3.2, rgba(p.ground, 1), up); chevron(d, x, yb, r, 3.2, rgba(p.ground, 1), up);
            chevron(d, x, ya, r, 1.5, rgba(hue, 0.98), up); chevron(d, x, yb, r, 1.5, rgba(hue, 0.98), up);
          } else {
            chevron(d, x, cy, r, 3.4, rgba(p.ground, 1), up);
            chevron(d, x, cy, r, 1.5, rgba(hue, 0.98), up);
          }
        }
        if (w > 200) {
          d.rect(x1, y, x1 + 36, y + RIB_H, rgba(p.ground, 0.88));
          d.text("S", x1 + 3, y + RIB_H / 2, { color: rgba(p.ink, 0.9), size: 8, weight: 600 });
          d.text("STATE", x1 + 12, y + RIB_H / 2, { color: rgba(p.ink, 0.5), size: 7, weight: 600 });
        }
      }
      if (fit) {
        // lanes
        for (let l = 0; l < LANES; l++) {
          ctx.save(); ctx.beginPath(); ctx.rect(0, lt[l] - 3, d.plotRight, lb[l] - lt[l] + 6); ctx.clip();
          const Kl = K[l], Dl = D[l];
          const path = (vals: Float64Array, col: string, wd: number, dy: number) => {
            ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.beginPath();
            let pen = false;
            for (let i = Math.max(0, i0 - 1); i <= i1; i++) {
              const v = vals[i]; if (isNaN(v)) { pen = false; continue; }
              const x = d.x(i), yy = LY(l, v) + dy;
              if (pen) ctx.lineTo(x, yy); else ctx.moveTo(x, yy);
              pen = true;
            }
            ctx.stroke();
          };
          if (d.on("k")) path(Kl, rgba(p.ink, 0.38), 1, 0);
          path(Dl, rgba(p.ground, 0.55), LINE_W * 0.85, 1.7);
          ctx.lineCap = "round";
          for (let i = Math.max(1, i0); i <= i1; i++) {
            const a = Dl[i - 1], b = Dl[i];
            if (isNaN(a) || isNaN(b)) continue;
            d.line([[d.x(i - 1), LY(l, a)], [d.x(i), LY(l, b)]], rgba(heat(p, (a + b) * 0.5), 0.95), LINE_W);
          }
          ctx.restore();
        }
        // lane divergence segments
        if (d.on("divs")) {
          for (const dv of divs) {
            if (dv.confirm > k || (dv.gone >= 0 && dv.gone <= k) || !shownDiv(dv)) continue;
            if (dv.bar1 < i0 || dv.bar0 > i1) continue;
            const hue = dv.bull ? p.bull : p.bear;
            const xa = d.x(dv.bar0), xb = d.x(dv.bar1), ya = LY(dv.lane, dv.val0), yb = LY(dv.lane, dv.val1);
            ctx.save(); ctx.lineCap = "round"; d.line([[xa, ya], [xb, yb]], rgba(hue, 0.85), DIV_W * 0.8); ctx.restore();
            ctx.fillStyle = rgba(hue, 0.95);
            ctx.beginPath(); ctx.arc(xa, ya, 2.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(xb, yb, 2.2, 0, Math.PI * 2); ctx.fill();
          }
        }
        // lane labels
        if (w >= 200) for (let l = 0; l < LANES; l++) {
          if (lb[l] - lt[l] < 12) continue;
          const lw = d.measure(NAME[l], { size: 8, weight: 600 }) + 6, y = lt[l] + 1;
          d.rect(x1 + 2, y, x1 + 2 + lw, y + 12, rgba(p.ground, 0.85));
          d.text(NAME[l], x1 + 5, y + 6, { color: rgba(p.ink, 0.62), size: 8, weight: 600 });
        }
        // value chips
        const hb = Math.min(d.i1, k);
        for (let l = 0; l < LANES; l++) {
          if (lb[l] - lt[l] < 14) continue;
          const v = D[l][hb]; if (isNaN(v)) continue;
          let cy = LY(l, v);
          cy = Math.max(lt[l] + 6.5, Math.min(lb[l] - 6.5, cy));
          const tx = String(Math.floor(v + 0.5)), cw = 9 + d.measure(tx, { size: 9, weight: 600 });
          d.rect(x2 - cw - 1, cy - 6.5, x2 - 1, cy + 6.5, rgba(heat(p, v), 0.92));
          d.text(tx, x2 - cw + 3, cy + 0.5, { color: rgba(p.ground, 1), size: 9, weight: 600 });
        }
      }
      // header
      const hb = Math.min(d.i1, k);
      const fD = D[FAST][hb];
      if (w >= 200 && !isNaN(fD)) {
        const sw = stateWord(hb);
        const col = sw.key === "bull" ? p.bull : sw.key === "bear" ? p.bear : sw.key === "up" ? p.up : sw.key === "dn" ? p.dn : p.ink;
        const txt = `STOCH ${Math.floor(fD + 0.5)}  ${sw.t}`;
        const rw = 8 + d.measure(txt, { size: 10.5, weight: 700 });
        let right = x2 - 2;
        d.rect(right - rw, py + 1, right, py + 17, rgba(p.ground, 0.78));
        d.text(txt, right - rw + 4, py + 9, { color: rgba(col, 0.95), size: 10.5, weight: 700 });
        right -= rw + 6;
        const chip = (t: string, c: RGB) => {
          const cw = 10 + d.measure(t, { size: 9, weight: 600 });
          d.rect(right - cw, py + 2, right, py + 16, rgba(p.ground, 0.78));
          d.rect(right - cw, py + 2, right - cw + 2, py + 16, rgba(c, 0.9));
          d.text(t, right - cw + 6, py + 9, { color: rgba(c, 0.92), size: 9, weight: 600 });
          right -= cw + 6;
        };
        if (d.width >= 760) {
          const al = align[hb];
          if (al !== 0) chip(`${al > 0 ? "LOW" : "HIGH"} ${Math.abs(al)}/${LANES}`, al > 0 ? p.bull : p.bear);
          const ld = lastDivAt(hb);
          if (ld) { const age = hb - ld.confirm; if (age >= 0 && age <= 60) chip(divChip(ld, age), ld.bull ? p.bull : p.bear); }
        }
      }
      ctx.restore();
    };
    const divChip = (dv: Div, age: number) => `DIV ${dv.bull ? "▲" : "▼"}${dv.cluster > 1 ? `  ×${dv.cluster}` : ""}  · ${age === 0 ? "now" : `${age} ${age === 1 ? "bar ago" : "bars ago"}`}`;

    return {
      events,
      draw(d) {
        drawPrice(d);
        const pv = d.pane("stoch");
        if (pv) drawPanel(d, pv);
      },
      priceExtent(_i0, _i1, k) {
        // keep a live divergence line's far end in view
        let a = Infinity, b = -Infinity;
        for (const dv of divs) {
          if (!dv.drawn || dv.confirm > k || dv.confirm < k - LIFE || !shownDiv(dv)) continue;
          if (dv.pb0 < _i0) continue;
          a = Math.min(a, dv.px0, dv.px1); b = Math.max(b, dv.px0, dv.px1);
        }
        return isFinite(a) ? [a, b] : null;
      },
      readout(i): ReadItem[] {
        const sw = stateWord(i);
        const out: ReadItem[] = [{ label: "State", value: sw.t.slice(2), tone: sw.tone }];
        for (let l = 0; l < LANES; l++) out.push({ label: `${NAME[l]} %D`, value: isNaN(D[l][i]) ? "—" : `${D[l][i].toFixed(1)}  (%K ${isNaN(K[l][i]) ? "—" : K[l][i].toFixed(1)})`, tone: D[l][i] <= OS ? "bull" : D[l][i] >= OB ? "bear" : undefined });
        if (divNet[i] !== 0) out.push({ label: "Divergence", value: `${divNet[i] > 0 ? "+" : ""}${divNet[i]}`, tone: divNet[i] > 0 ? "bull" : "bear" });
        return out;
      },
      status(k): ReadItem[] {
        const sw = stateWord(k);
        const out: ReadItem[] = [{ label: `STOCH ${isNaN(D[FAST][k]) ? "—" : Math.floor(D[FAST][k] + 0.5)}`, value: sw.t.slice(2), tone: sw.tone }];
        const al = align[k];
        out.push({ label: "Lanes in a zone", value: al === 0 ? "split / none" : `${al > 0 ? "LOW" : "HIGH"} ${Math.abs(al)}/${LANES}`, tone: al > 0 ? "bull" : al < 0 ? "bear" : undefined });
        out.push({ label: "Latch", value: armA[k] > 0 ? "ARMED LONG" : armA[k] < 0 ? "ARMED SHORT" : "not armed", tone: armA[k] > 0 ? "bull" : armA[k] < 0 ? "bear" : undefined });
        out.push({ label: "60 · 10 %D", value: isNaN(D[SLOW][k]) ? "—" : D[SLOW][k].toFixed(0), tone: D[SLOW][k] >= OB ? "bear" : D[SLOW][k] <= OS ? "bull" : undefined });
        const ld = lastDivAt(k);
        if (ld && k - ld.confirm <= 60) out.push({ label: "DIV", value: divChip(ld, k - ld.confirm).slice(4), tone: ld.bull ? "bull" : "bear" });
        return out;
      },
      legend: [
        { label: "Oversold / bull", color: "#009999", shape: "line" },
        { label: "Overbought / bear", color: "#A33DFF", shape: "line" },
        { label: "Pullback (trend)", color: "rgb(240,163,92)", shape: "dot" },
        { label: "Broken divergence", color: "rgb(128,136,148)", shape: "dash" },
      ],
    };
  },
};

function eventHue(p: Pal, e: number): RGB {
  if (Math.abs(e) === 3) return e > 0 ? p.up : p.dn;
  return e > 0 ? p.bull : p.bear;
}
function stateColor(p: Pal, st: number) {
  switch (st) {
    case ST_QOS: return rgba(p.bull, 0.9);
    case ST_QOB: return rgba(p.bear, 0.9);
    case ST_ARML: return rgba(p.bull, 0.38);
    case ST_ARMS: return rgba(p.bear, 0.38);
    case ST_PULL: return rgba(p.up, 0.7);
    case ST_PULS: return rgba(p.dn, 0.7);
    case ST_EMBB: return rgba(p.up, 0.3);
    case ST_EMBR: return rgba(p.dn, 0.3);
  }
  return "rgba(0,0,0,0)";
}
function chevron(d: Draw, cx: number, cy: number, r: number, w: number, col: string, up: boolean) {
  const rise = r * 0.62;
  const yb = up ? cy + rise * 0.5 : cy - rise * 0.5, yt = up ? cy - rise * 0.5 : cy + rise * 0.5;
  const ctx = d.ctx;
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(cx - r, yb); ctx.lineTo(cx, yt); ctx.lineTo(cx + r, yb); ctx.stroke(); ctx.restore();
}
