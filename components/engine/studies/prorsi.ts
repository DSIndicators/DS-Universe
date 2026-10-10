import type { Draw, PaneView, ReadItem, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm, minuteOfDay } from "../ta";

/**
 * DS ProRSI — web edition. Source: DSProRSI.cs (Build 2026-10-07), shipped
 * defaults from ApplyDefaults(): RSI 14, signal 14 SMA, Calculation CloseBar,
 * Overbought 70 / Oversold 30, RSI weighting Volume, Zone depth Standard (15%),
 * Zone spacing 0.35 ATR, Break on Close, Max live zones 6, Broken zones kept 12,
 * Compression band 5, Line width 2, Core line width 2, theme DsSignature.
 *
 * PORTED (line for line from the .cs):
 *  · Relative volume: bar volume / the median of the last 20 bars that closed in
 *    the same clock minute (needs 3), else the median of the last 50 bars (needs
 *    10), else 1.0 — pushed and read in the same order as OnBarUpdate().
 *  · Wilder RSI on close changes, classic and volume-weighted (each change times
 *    its relative volume held to [1/3, 3]), seeded with the plain average of the
 *    first 14 changes; SMA-14 signal; states OVERBOUGHT / OVERSOLD /
 *    COMPRESSION (RSI and signal both within 5 of 50).
 *  · ZoneEngine(): break on a close through the far edge, touch / visit / HELD /
 *    BROKE scoring (2 ATR to leave), then Turn(): cross of the signal one bar
 *    back that still holds on this close, inside an open episode where BOTH RSIs
 *    reached the line; the 60-bar window back to the episode start; the far edge
 *    at the window's extreme, the near edge where 15% of the window's volume is
 *    reached (volume spread evenly over each bar's range, as the .cs does), held
 *    to [0.1, 1.0] ATR; the five strata; reinforce within 0.35 ATR (once per
 *    episode); a later cross in the same episode without a new extreme refused;
 *    FIFO retirement past 6 live zones, 12 broken traces kept.
 *  · The episode bookkeeping after Turn(), so a turn reads the episode as it
 *    stood on the bar before — exactly the .cs order.
 *  · ATR = the .cs's own 14-bar simple average of true range (not NT's ATR()).
 *  · CROSS = SolveCross(): the close at which the next bar's RSI, at normal
 *    volume, would equal its signal; shown within 5 ATR, rounded to the far tick.
 *  · Drawing: DsPrZone (band at 45% of the tier alpha, strata, near hairline,
 *    core line in hue or strong hue by tier, spine doubled once reinforced,
 *    touch notches, the arrow flag RSI nn ▮▮▯ ×n, gray dashed broken trace) and
 *    the panel (OB/OS bands, dashed 50, classic ghost line, amber signal, heat-
 *    coloured RSI with its ground shadow, HEAT ribbon with chevrons / dots, VOL
 *    strip, stems, the value chip and the right-to-left header chips), with the
 *    .cs's own light/dark adaptation (Deepen 0.62 on a light ground, 12% toward
 *    white on a dark one).
 *
 * DEVIATIONS
 *  · History: each session file holds ~3 sessions before the replay day, so the
 *    clock-minute volume yardstick is in force from the replay day's open (it
 *    needs 3 of each minute) and the ZONES HELD / BROKE record counts only the
 *    returns inside the file — on a NinjaTrader chart with more days loaded those
 *    counts are larger and older zones may still be live.
 *  · Zone history (bars) 5000 is a load guard that depends on how many bars the
 *    chart holds when it is opened; here every zone gets its drawing (the same
 *    as a chart opened soon after the zone was born). It never changes the
 *    engine, the plots, or which zones are live.
 *  · Panel scale: NinjaTrader's panel tops out at 109.9 when the panel is 170 px
 *    or taller; the web pane uses that fixed 0–109.9 scale at every height.
 *  · Fonts: the .cs draws Segoe UI / Arial; the web edition uses the site's mono.
 *  · Alerts (off by default) are not part of the replay.
 *  · Price scale: the zones are drawing objects that NinjaTrader's auto scale
 *    leaves out; the replay widens the price range to keep the nearest live
 *    support and resistance in view when they sit close to it.
 *  · Example hygiene (web showcase): a zone born before the first shown bar
 *    (s.replayFrom, the hidden warm-up) is not drawn (band, core, flag, notches
 *    or broken trace), not used for the R / S chips or the price range, and not
 *    counted in the ZONES HELD / BROKE record, so a chart never opens on a zone
 *    or a record the visitor did not see made. The engine (which zones are live,
 *    reinforcement, FIFO retirement, every event) is computed exactly as before.
 * The narration marks zone births (weight 3), reinforcements and breaks
 * (weight 2) and the scored returns HELD (weight 1). Touches and refused crosses
 * are shown as the tool shows them (notches / ribbon dots), not narrated.
 */

// ---------------------------------------------------------------- constants (DSProRSI.cs)
const RSI_N = 14, SIG_M = 14, OB = 70, OS = 30, SQZ_BAND = 5;
const SPACING_ATR = 0.35, MAX_ACTIVE = 6, MAX_BROKEN = 12, DEPTH_SHARE = 0.15;
const ATR_P = 14, RING = 20, RING_MIN = 3, ROLL = 50, ROLL_MIN = 10, SLOTS = 1440;
const W_LO = 1 / 3, W_HI = 3, RV_CAP = 10, WIN_MAX = 60, BINS_MAX = 512, LEAVE = 2.0;
const MIN_T = 0.1, MAX_T = 1.0, TIER_1 = 1.5, TIER_2 = 3.0, STRATA_N = 5, CROSS_ATR = 5.0;
const ST_NEUTRAL = 0, ST_OB = 1, ST_OS = 2, ST_SQZ = 3;
const BAND_A = [0.05, 0.085, 0.12], NEAR_A = [0.26, 0.4, 0.55], CORE_A = [0.6, 0.92, 1.0];
const LEVEL_W = 2, LINE_W = 2, TOUCH_MAX = 24, TAG_GLYPH = 6.4;

// DsSignature + the two fixed colours
type RGB = [number, number, number];
const C_BULL: RGB = [0, 153, 153], C_BEAR: RGB = [163, 61, 255], C_NEUT: RGB = [85, 85, 85];
const C_SBULL: RGB = [0, 255, 255], C_SBEAR: RGB = [255, 0, 255];
const C_SIG: RGB = [240, 163, 92], C_SQZ: RGB = [111, 183, 232];

const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const lerp = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** LitOf(): Deepen(0.62) on a light ground, 12% toward white on a dark one */
const lit = (c: RGB, light: boolean): RGB => light ? [c[0] * 0.62, c[1] * 0.62, c[2] * 0.62] : [c[0] + (255 - c[0]) * 0.12, c[1] + (255 - c[1]) * 0.12, c[2] + (255 - c[2]) * 0.12];

type Pal = {
  light: boolean; ground: RGB; ink: RGB;
  bull: RGB; bear: RGB; sig: RGB; sqz: RGB; neutLit: RGB; sbull: RGB; sbear: RGB; neutZone: RGB;
};
const palCache: Record<string, Pal> = {};
function palette(d: Draw): Pal {
  const key = d.th.name;
  if (palCache[key]) return palCache[key];
  const light = d.th.name === "light";
  const ground: RGB = light ? [226, 226, 226] : [0, 0, 0];
  const neutMix: RGB = light ? [C_NEUT[0] * 0.9, C_NEUT[1] * 0.9, C_NEUT[2] * 0.9] : lerp(C_NEUT, [255, 255, 255], 0.25);
  const p: Pal = {
    light, ground,
    ink: light ? [0.16 * 255, 0.18 * 255, 0.22 * 255] : [0.84 * 255, 0.86 * 255, 0.9 * 255],
    bull: lit(C_BULL, light), bear: lit(C_BEAR, light), sig: lit(C_SIG, light), sqz: lit(C_SQZ, light),
    sbull: lit(C_SBULL, light), sbear: lit(C_SBEAR, light),
    neutLit: neutMix, neutZone: neutMix,
  };
  palCache[key] = p;
  return p;
}

// ---------------------------------------------------------------- the engine's objects
type ZoneState = { i: number; rsi: number; tier: number; turns: number; part: number };
type Zone = {
  id: number; sup: boolean; far: number; near: number; birth: number; anchor: number; atr: number;
  strata: number[]; hist: ZoneState[]; touches: number[];
  end: number; endKind: "" | "break" | "retire"; gone: number;
  // live engine state
  rsi: number; part: number; tier: number; turns: number; touchN: number; swept: number; held: number;
  lastEp: number; touching: boolean; armed: boolean; inVisit: boolean;
};

const tierOf = (part: number) => part < TIER_1 ? 0 : part < TIER_2 ? 1 : 2;
const rsiOf = (au: number, ad: number) => ad <= 0 ? 100 : au <= 0 ? 0 : 100 - 100 / (1 + au / ad);
const weightOf = (rv: number) => isNaN(rv) ? 1 : rv < W_LO ? W_LO : rv > W_HI ? W_HI : rv;
function median(a: number[]) {
  const c = a.length;
  if (!c) return NaN;
  const b = a.slice().sort((x, y) => x - y);
  return c & 1 ? b[c >> 1] : 0.5 * (b[c / 2 - 1] + b[c / 2]);
}
/** .NET Math.Round(double) — midpoint to even */
const roundEven = (x: number) => { const r = Math.round(x); return Math.abs(x - Math.trunc(x)) === 0.5 && r % 2 !== 0 ? r - 1 : r; };
/** chart text: NinjaTrader FormatPrice, no thousands separators */
const fpc = (p: number) => p.toFixed(2);
const nf = (p: number, dg = 2) => p.toLocaleString("en-US", { minimumFractionDigits: dg, maximumFractionDigits: dg });

export const study: StudyDef = {
  slug: "prorsi", rightMargin: 90,
  name: "DS ProRSI",
  about: "A volume-weighted RSI; its held turns out of an extreme become zones on price, then are reinforced, touched or broken.",
  panes: [{ id: "rsi", title: "DS ProRSI", weight: 0.46, range: [0, 109.9], digits: 0 }],
  layers: [
    { id: "zones", label: "Zones on price", on: true, hint: "Show zones on price — the supports and resistances the turns made." },
    { id: "classic", label: "Classic RSI", on: true, hint: "The faint classic Wilder RSI behind the volume-weighted line." },
  ],
  run(s) {
    const n = s.n, tick = s.tick;
    const rv = new Float64Array(n), rsi = new Float64Array(n).fill(NaN), cls = new Float64Array(n).fill(NaN), sig = new Float64Array(n).fill(NaN);
    const state = new Uint8Array(n), evt = new Int8Array(n), atrA = new Float64Array(n), cross = new Float64Array(n).fill(NaN);
    const supN = new Float64Array(n).fill(NaN), resN = new Float64Array(n).fill(NaN);
    const heldA = new Int32Array(n), brokeA = new Int32Array(n);
    const zones: Zone[] = [];
    const events: StudyEvent[] = [];

    // volume yardsticks
    const ring: number[][] = Array.from({ length: SLOTS }, () => []);
    const ringPos = new Int32Array(SLOTS);
    const roll: number[] = []; let rollPos = 0;
    const push = (v: number, slot: number) => {
      if (!(v >= 0) || !isFinite(v)) v = 0;
      const r = ring[slot];
      if (r.length < RING) r.push(v); else r[ringPos[slot]] = v;
      ringPos[slot] = (ringPos[slot] + 1) % RING;
      if (roll.length < ROLL) roll.push(v); else roll[rollPos] = v;
      rollPos = (rollPos + 1) % ROLL;
    };
    const baseline = (slot: number) => {
      if (ring[slot].length >= RING_MIN) return median(ring[slot]);
      if (roll.length >= ROLL_MIN) return median(roll);
      return NaN;
    };
    // the .cs's own ATR: simple mean of true range over the last 14 bars
    const atrAt = (i: number) => {
      let sum = 0, c = 0;
      for (let j = i; j > i - ATR_P && j >= 0; j--) {
        let hl = s.h[j] - s.l[j];
        if (j > 0) { const pc = s.c[j - 1]; hl = Math.max(hl, Math.abs(s.h[j] - pc), Math.abs(s.l[j] - pc)); }
        sum += hl; c++;
      }
      return c > 0 ? sum / c : 0;
    };

    let prevAu = NaN, prevAd = NaN, prevWu = NaN, prevWd = NaN;
    let curAu = NaN, curAd = NaN, curWu = NaN, curWd = NaN;
    const epOpen = [false, false], epOpenAt = [false, false], epBoth = [false, false], epClassic = [false, false];
    const epFrom = [0, 0], epDepth = [0, 0], epSeq = [0, 0], epLastFar = [NaN, NaN];
    let active: Zone[] = [];
    const broken: Zone[] = [];
    let heldCount = 0, brokeCount = 0, zid = 0;
    // example hygiene (display only): the record and the R / S chips count only zones born on the shown stage
    const onStage = (z: Zone) => z.birth >= s.replayFrom;
    let heldStage = 0, brokeStage = 0;
    const hist = new Float64Array(BINS_MAX);

    const snapshot = (z: Zone, i: number) => {
      const last = z.hist[z.hist.length - 1];
      const st = { i, rsi: z.rsi, tier: z.tier, turns: z.turns, part: z.part };
      if (last && last.i === i) z.hist[z.hist.length - 1] = st; else z.hist.push(st);
    };

    const computeBar = (i: number, baseVol: number) => {
      let r = !isNaN(baseVol) && baseVol > 0 ? s.v[i] / baseVol : 1;
      if (isNaN(r) || !isFinite(r) || r < 0) r = 1;
      rv[i] = r;
      if (i <= 0) { curAu = curAd = curWu = curWd = NaN; return; }
      const ch = s.c[i] - s.c[i - 1];
      const up = ch > 0 ? ch : 0, dn = ch < 0 ? -ch : 0, w = weightOf(r);
      if (i < RSI_N) { curAu = curAd = curWu = curWd = NaN; }
      else if (i === RSI_N || isNaN(prevAu) || isNaN(prevWu)) {
        let su = 0, sd = 0, wu = 0, wd = 0;
        for (let k = 0; k < RSI_N; k++) {
          const dd = s.c[i - k] - s.c[i - k - 1];
          const wk = k === 0 ? w : weightOf(rv[i - k]);
          if (dd > 0) { su += dd; wu += dd * wk; } else { sd -= dd; wd -= dd * wk; }
        }
        curAu = su / RSI_N; curAd = sd / RSI_N; curWu = wu / RSI_N; curWd = wd / RSI_N;
      } else {
        curAu = (prevAu * (RSI_N - 1) + up) / RSI_N;
        curAd = (prevAd * (RSI_N - 1) + dn) / RSI_N;
        curWu = (prevWu * (RSI_N - 1) + up * w) / RSI_N;
        curWd = (prevWd * (RSI_N - 1) + dn * w) / RSI_N;
      }
      let rr = NaN;
      if (!isNaN(curAu)) { cls[i] = rsiOf(curAu, curAd); rr = rsiOf(curWu, curWd); }
      rsi[i] = rr;
      if (!isNaN(rr)) {
        let sum = 0, c = 0;
        for (let k = 0; k < SIG_M && k <= i; k++) { const v = rsi[i - k]; if (isNaN(v)) break; sum += v; c++; }
        if (c === SIG_M) sig[i] = sum / SIG_M;
      }
      let st = ST_NEUTRAL;
      if (!isNaN(rr)) {
        if (rr >= OB) st = ST_OB;
        else if (rr <= OS) st = ST_OS;
        else if (!isNaN(sig[i]) && Math.abs(rr - 50) <= SQZ_BAND && Math.abs(sig[i] - 50) <= SQZ_BAND) st = ST_SQZ;
      }
      state[i] = st;
    };

    const solveCross = (i: number) => {
      const a = curWu, dd = curWd;
      if (isNaN(a) || isNaN(dd)) return NaN;
      let sum = 0, c = 0;
      for (let k = i; k > i - (SIG_M - 1) && k >= 0; k--) { const v = rsi[k]; if (isNaN(v)) break; sum += v; c++; }
      if (c !== SIG_M - 1) return NaN;
      const target = sum / (SIG_M - 1);
      if (isNaN(target) || !(target > 0) || !(target < 100)) return NaN;
      const r = target / (100 - target);
      const x = (RSI_N - 1) * (dd * r - a);
      const p = x >= 0 ? s.c[i] + x : s.c[i] + x / r;
      return isFinite(p) ? p : NaN;
    };

    const turn = (bar: number) => {
      if (bar < 2) return;
      const r0 = rsi[bar], r1 = rsi[bar - 1], r2 = rsi[bar - 2], s0 = sig[bar], s1 = sig[bar - 1], s2 = sig[bar - 2];
      if ([r0, r1, r2, s0, s1, s2].some((v) => isNaN(v))) return;
      const bullX = r2 <= s2 && r1 > s1, bearX = r2 >= s2 && r1 < s1;
      if (!bullX && !bearX) return;
      const sup = bullX, e = sup ? 0 : 1;
      const held = sup ? r0 > s0 : r0 < s0;
      if (!held) { evt[bar] = sup ? 2 : -2; return; }
      if (!epOpenAt[e] || !epBoth[e]) { evt[bar] = sup ? 2 : -2; return; }

      let w0 = epFrom[e];
      if (w0 > bar) w0 = bar;
      if (bar - w0 > WIN_MAX - 1) w0 = bar - (WIN_MAX - 1);
      if (w0 < 0) w0 = 0;
      let ext = sup ? Infinity : -Infinity, anchor = bar, wl = Infinity, wh = -Infinity, vt = 0, pt = 0;
      for (let q = bar; q >= w0; q--) {
        const x = sup ? s.l[q] : s.h[q];
        if (sup ? x < ext : x > ext) { ext = x; anchor = q; }
        if (s.l[q] < wl) wl = s.l[q];
        if (s.h[q] > wh) wh = s.h[q];
        const v = s.v[q] > 0 ? s.v[q] : 0;
        vt += v;
        const rq = isNaN(rv[q]) ? 1 : rv[q];
        pt += rq > RV_CAP ? RV_CAP : rq;
      }
      if (!isFinite(ext)) { evt[bar] = sup ? 2 : -2; return; }
      const span = bar - w0;
      const part = pt / (span + 1);
      const atr = atrAt(bar);
      let nt = Math.round((wh - wl) / tick) + 1;
      if (nt < 1) nt = 1;
      let mstep = Math.floor((nt + BINS_MAX - 1) / BINS_MAX);
      if (mstep < 1) mstep = 1;
      let nb = Math.floor((nt + mstep - 1) / mstep);
      if (nb > BINS_MAX) nb = BINS_MAX;
      let thick: number;
      const haveHist = vt > 0;
      const H = (j: number) => hist[sup ? j : nb - 1 - j];
      if (haveHist) {
        for (let q = 0; q < nb; q++) hist[q] = 0;
        for (let q = bar; q >= w0; q--) {
          const v = s.v[q];
          if (!(v > 0)) continue;
          let i0 = Math.floor(Math.round((s.l[q] - wl) / tick) / mstep);
          let i1 = Math.floor(Math.round((s.h[q] - wl) / tick) / mstep);
          i0 = Math.max(0, Math.min(nb - 1, i0)); i1 = Math.max(0, Math.min(nb - 1, i1));
          const sh = v / (i1 - i0 + 1);
          for (let j = i0; j <= i1; j++) hist[j] += sh;
        }
        const need = DEPTH_SHARE * vt;
        let acc = 0, cnt = 0;
        for (let j = 0; j < nb; j++) { acc += H(j); cnt++; if (acc >= need - 1e-9 * vt) break; }
        thick = cnt * mstep * tick;
      } else {
        thick = Math.abs((sup ? Math.min(s.o[anchor], s.c[anchor]) : Math.max(s.o[anchor], s.c[anchor])) - ext);
      }
      const minT = Math.max(tick, Math.ceil(MIN_T * atr / tick - 1e-9) * tick);
      const maxT = Math.max(minT, Math.floor(MAX_T * atr / tick + 1e-9) * tick);
      thick = Math.round(thick / tick) * tick;
      if (thick < minT) thick = minT; else if (thick > maxT) thick = maxT;
      const near = Math.round((sup ? ext + thick : ext - thick) / tick) * tick;

      const strata: number[] = [];
      {
        let zb = roundEven(thick / (mstep * tick)); // C# Math.Round: ties to even
        if (zb < 1) zb = 1; else if (zb > nb) zb = nb;
        let zv = 0;
        if (haveHist) for (let j = 0; j < zb; j++) zv += H(j);
        for (let k = 1; k <= STRATA_N; k++) {
          let off = thick * k / (STRATA_N + 1);
          if (zv > 0) {
            const want = zv * k / (STRATA_N + 1);
            let acc = 0, idx = zb - 1;
            for (let j = 0; j < zb; j++) { acc += H(j); if (acc >= want - 1e-9 * zv) { idx = j; break; } }
            off = (idx + 0.5) * mstep * tick;
            if (off > thick) off = thick;
          }
          strata.push(off);
        }
      }

      const gap = SPACING_ATR * atr;
      const lf = epLastFar[e];
      const later = !isNaN(lf) && !(sup ? ext < lf : ext > lf);
      let hit: Zone | null = null, sameEp = false;
      {
        const nl = Math.min(ext, near), nh = Math.max(ext, near);
        let bd = Infinity;
        for (const z of active) {
          if (z.sup !== sup) continue;
          const zl = Math.min(z.far, z.near) - gap, zh = Math.max(z.far, z.near) + gap;
          if (nl <= zh && nh >= zl) { const dd = Math.abs(z.far - ext); if (dd < bd) { bd = dd; hit = z; } }
        }
        if (hit && hit.lastEp === epSeq[e]) sameEp = true;
        if (hit && !sameEp) {
          hit.turns++;
          if (part > hit.part) hit.part = part;
          hit.rsi = sup ? Math.min(hit.rsi, epDepth[e]) : Math.max(hit.rsi, epDepth[e]);
          hit.tier = Math.min(2, tierOf(hit.part) + 1);
          hit.lastEp = epSeq[e];
          active = active.filter((z) => z !== hit); active.push(hit);
          snapshot(hit, bar);
        }
      }
      if (sameEp) { evt[bar] = sup ? 2 : -2; return; }
      if (hit) {
        epFrom[e] = bar + 1;
        evt[bar] = sup ? 3 : -3;
        events.push({
          i: bar, price: hit.far, tone: sup ? "bull" : "bear", weight: 2,
          title: sup ? "SUPPORT ZONE REINFORCED" : "RESISTANCE ZONE REINFORCED",
          text: `${hhmm(s, bar)} — the RSI crossed ${sup ? "above" : "below"} its signal at ${hhmm(s, bar - 1)} and held on this close; the turn's zone ${nf(Math.min(ext, near))} – ${nf(Math.max(ext, near))} overlaps the live ${sup ? "support" : "resistance"} zone at ${nf(hit.far)} (its edges widened by 0.35 ATR), so it reinforces it (turn ${hit.turns}) instead of stacking a new zone.`,
        });
        return;
      }
      if (later) { evt[bar] = sup ? 2 : -2; return; }

      const z: Zone = {
        id: zid++, sup, far: ext, near, birth: bar, anchor, atr, strata, hist: [], touches: [],
        end: -1, endKind: "", gone: -1,
        rsi: epDepth[e], part, tier: tierOf(part), turns: 1, touchN: 0, swept: 0, held: 0,
        lastEp: epSeq[e], touching: sup ? s.l[bar] <= near : s.h[bar] >= near, armed: false, inVisit: false,
      };
      snapshot(z, bar);
      zones.push(z);
      active.push(z);
      while (active.length > Math.max(1, MAX_ACTIVE)) { const old = active.shift()!; old.end = bar; old.endKind = "retire"; }
      epLastFar[e] = ext; epFrom[e] = bar + 1;
      evt[bar] = sup ? 1 : -1;
      const pips = z.tier + 1;
      events.push({
        i: bar, price: ext, tone: sup ? "bull" : "bear", weight: 3,
        title: sup ? "BULL TURN · SUPPORT ZONE" : "BEAR TURN · RESISTANCE ZONE",
        text: `${hhmm(s, bar)} — the RSI crossed ${sup ? "above" : "below"} its signal at ${hhmm(s, bar - 1)} and held on this close, inside an ${sup ? "oversold" : "overbought"} episode both RSIs had reached (deepest RSI ${Math.round(z.rsi)}). New ${sup ? "support" : "resistance"} zone ${nf(Math.min(ext, near))} – ${nf(Math.max(ext, near))}, far edge at the turn's ${sup ? "low" : "high"} (${hhmm(s, anchor)}), ${part.toFixed(1)}× normal volume (${pips} pip${pips > 1 ? "s" : ""}).`,
      });
    };

    const zoneEngine = (bar: number) => {
      const close = s.c[bar], high = s.h[bar], low = s.l[bar];
      for (let q = active.length - 1; q >= 0; q--) {
        const z = active[q];
        if (bar <= z.birth) continue;
        const brk = z.sup ? close < z.far : close > z.far;
        if (brk) {
          if (z.inVisit || z.armed) { brokeCount++; if (onStage(z)) brokeStage++; }
          z.inVisit = false;
          active.splice(q, 1);
          z.end = bar; z.endKind = "break";
          broken.push(z);
          while (broken.length > MAX_BROKEN) { const old = broken.shift()!; old.gone = bar; }
          events.push({
            i: bar, price: z.far, tone: z.sup ? "bear" : "bull", weight: 2,
            title: z.sup ? "SUPPORT ZONE BROKEN" : "RESISTANCE ZONE BROKEN",
            text: `${hhmm(s, bar)} — the bar closed at ${nf(close)}, ${z.sup ? "below" : "above"} the far edge ${nf(z.far)} of the ${z.sup ? "support" : "resistance"} zone born at ${hhmm(s, z.birth)}. A close through the far edge breaks it; it stays as a gray dashed trace.`,
          });
          continue;
        }
        const away = z.sup ? high - z.far : z.far - low;
        const touch = z.sup ? low <= z.near && close >= z.far : high >= z.near && close <= z.far;
        if (z.inVisit && away >= LEAVE * z.atr && !touch) {
          z.inVisit = false; z.armed = true; z.held++; heldCount++; if (onStage(z)) heldStage++;
          events.push({
            i: bar, price: z.far, tone: z.sup ? "bull" : "bear", weight: 1,
            title: "ZONE HELD",
            text: `${hhmm(s, bar)} — price came back to the ${z.sup ? "support" : "resistance"} zone at ${nf(z.far)} and has now left it again by two ATRs without breaking it: one more HELD on the chart's record (${heldCount} held, ${brokeCount} broke).`,
          });
        } else if (!z.inVisit && !z.armed && away >= LEAVE * z.atr && !touch) z.armed = true;
        if (touch && !z.touching) {
          z.touchN++;
          if (z.sup ? low < z.far : high > z.far) z.swept++;
          if (z.armed && !z.inVisit) { z.inVisit = true; z.armed = false; }
          z.touches.push(bar);
        }
        z.touching = touch;
      }
      turn(bar);
      const r = rsi[bar], k = cls[bar];
      for (let e = 0; e < 2; e++) {
        const sup = e === 0;
        if (!isNaN(r)) {
          const hitL = sup ? r <= OS : r >= OB;
          if (hitL && !epOpen[e]) { epOpen[e] = true; epFrom[e] = bar; epLastFar[e] = NaN; epDepth[e] = r; epBoth[e] = false; epSeq[e]++; }
          if (epOpen[e] && (sup ? r < epDepth[e] : r > epDepth[e])) epDepth[e] = r;
        }
        if (!isNaN(k)) {
          if (sup ? k <= OS : k >= OB) epClassic[e] = true;
          else if (sup ? k >= 50 : k <= 50) epClassic[e] = false;
        }
        if (epOpen[e] && epClassic[e]) epBoth[e] = true;
        epOpenAt[e] = epOpen[e];
        if (epOpen[e] && !isNaN(r) && (sup ? r >= 50 : r <= 50)) epOpen[e] = false;
      }
    };

    for (let i = 0; i < n; i++) {
      if (i >= 1) push(s.v[i - 1], minuteOfDay(s, i - 1));
      prevAu = curAu; prevAd = curAd; prevWu = curWu; prevWd = curWd;
      const baseVol = baseline(minuteOfDay(s, i));
      atrA[i] = atrAt(i);
      computeBar(i, baseVol);
      if (i === 0) continue;
      zoneEngine(i);
      let sp = NaN, rs = NaN;
      for (const z of active) {
        if (!onStage(z)) continue;
        if (z.sup) { if (isNaN(sp) || z.near > sp) sp = z.near; }
        else if (isNaN(rs) || z.near < rs) rs = z.near;
      }
      supN[i] = sp; resN[i] = rs;
      cross[i] = solveCross(i);
      heldA[i] = heldStage; brokeA[i] = brokeStage;
    }
    events.sort((a, b) => a.i - b.i);

    // ------------------------------------------------------------ helpers for the view
    const stAt = (z: Zone, k: number) => {
      let st = z.hist[0];
      for (const h of z.hist) { if (h.i <= k) st = h; else break; }
      return st;
    };
    // example hygiene (display only): a zone born in the hidden warm-up is never drawn
    const liveAt = (z: Zone, k: number) => onStage(z) && z.birth <= k && (z.end < 0 || z.end > k);
    const traceAt = (z: Zone, k: number) => onStage(z) && z.endKind === "break" && z.end <= k && (z.gone < 0 || z.gone > k);
    const touchesAt = (z: Zone, k: number) => { let c = 0; for (const t of z.touches) { if (t <= k) c++; else break; } return c; };
    const heat = (p: Pal, v: number): RGB => {
      if (v <= OS) return p.bull;
      if (v >= OB) return p.bear;
      if (v < 50) return lerp(p.bull, p.ink, (v - OS) / Math.max(1, 50 - OS));
      return lerp(p.ink, p.bear, (v - 50) / Math.max(1, OB - 50));
    };
    const stateWord = (i: number): { t: string; tone: Tone } => {
      const ev = evt[i], st = state[i], v = rsi[i], sg = sig[i];
      if (ev === 1 || ev === 3) return { t: "▲ BULL TURN", tone: "bull" };
      if (ev === -1 || ev === -3) return { t: "▼ BEAR TURN", tone: "bear" };
      if (st === ST_OB) return { t: "● OVERBOUGHT", tone: "bear" };
      if (st === ST_OS) return { t: "● OVERSOLD", tone: "bull" };
      if (st === ST_SQZ) return { t: "● COMPRESSION", tone: "neutral" };
      if (!isNaN(sg) && v >= sg) return { t: "▲ BULLISH", tone: "neutral" };
      return { t: "▼ BEARISH", tone: "neutral" };
    };
    const crossShown = (i: number) => {
      const cp = cross[i], cl = s.c[i], atr = atrA[i];
      if (isNaN(cp) || !(cp > 0) || !(atr > 0) || Math.abs(cp - cl) > CROSS_ATR * atr) return null;
      const upx = isNaN(sig[i]) || !(rsi[i] > sig[i]);
      return { up: upx, p: upx ? Math.ceil(cp / tick - 1e-9) * tick : Math.floor(cp / tick + 1e-9) * tick };
    };
    const ptsTxt = (d: number, cl: number) => `${nf(Math.abs(d))} pt (${(Math.abs(d) / cl * 100).toFixed(2)}%)`;

    // ------------------------------------------------------------ price panel: DsPrZone
    const zonesUnder = (d: Draw) => {
      if (!d.on("zones")) return;
      const p = palette(d), pv = d.price, k = d.k;
      const ctx = d.ctx;
      const px = 0, pw = d.plotRight, py = pv.top, ph = pv.bottom - pv.top;
      ctx.save(); ctx.beginPath(); ctx.rect(0, pv.top, d.plotRight, pv.bottom - pv.top); ctx.clip();
      for (const z of zones) {
        if (z.birth > k) continue;
        const live = liveAt(z, k);
        if (!live) continue;
        const st = stAt(z, k), tier = st.tier;
        const yF = Math.floor(pv.y(z.far)), yN = pv.y(z.near);
        const zTop = Math.min(yF, yN), zBot = Math.max(yF, yN);
        if (zBot < py - 2 || zTop > py + ph + 2) continue;
        const cTop = Math.max(py, zTop), cBot = Math.min(py + ph - 1, zBot);
        const nearOn = yN >= py && yN <= py + ph - 1;
        let x1 = d.x(z.anchor);
        if (x1 < px) x1 = px;
        if (x1 > px + pw) continue;
        const hue = z.sup ? p.bull : p.bear;
        const x2 = flagGeom(d, z, k).x2;
        const w = x2 - x1;
        if (w <= 0.5) continue;
        if (cBot >= cTop) d.rect(x1, cTop, x1 + w, cBot + 1, rgba(hue, BAND_A[tier] * 0.45));
        if (zBot - zTop >= 6) {
          const sa = 0.1 + 0.16 * (tier + 1) / 3;
          let lastY = NaN;
          for (const off of z.strata) {
            const y = Math.round(pv.y(z.sup ? z.far + off : z.far - off));
            if (y < cTop || y > cBot - 1) continue;
            if (Math.abs(y - yF) < 2 || Math.abs(y - yN) < 2) continue;
            if (!isNaN(lastY) && Math.abs(y - lastY) < 2) continue;
            d.rect(x1, y, x1 + w, y + 1, rgba(hue, sa));
            lastY = y;
          }
        }
        if (nearOn && Math.round(yN) !== yF) { const y = Math.round(yN); d.rect(x1, y, x1 + w, y + 1, rgba(hue, NEAR_A[tier])); }
        // touch notches (the last 24 touches)
        const tn = touchesAt(z, k);
        for (let j = Math.max(0, tn - TOUCH_MAX); j < tn; j++) {
          const tx = d.x(z.touches[j]);
          if (tx < x1 + 6 || tx > x2 - 2 || !nearOn) continue;
          const ny = z.sup ? Math.round(yN) - 4 : Math.round(yN) + 1;
          if (ny < py || ny + 4 > py + ph) continue;
          d.rect(Math.floor(tx), ny, Math.floor(tx) + 1, ny + 4, rgba(hue, 0.9));
        }
      }
      ctx.restore();
    };

    /** where the flag sits and where the band ends (the flag's tip) */
    const flagGeom = (d: Draw, z: Zone, k: number) => {
      const st = stAt(z, k), tn = touchesAt(z, k);
      const label = `RSI ${Math.round(st.rsi)}`;
      const tail = tn > 0 ? `×${tn}` : "";
      const lw = label.length * TAG_GLYPH, tw = tail ? tail.length * TAG_GLYPH : 0; // DsPrZone: text width = chars x 6.4
      const pipsW = 3 * 3 + 2 * 2;
      const bw = 5 + lw + 5 + pipsW + (tail ? 6 + tw : 0) + 5;
      const bx = Math.floor(d.plotRight - 2 - bw) + 0.5;
      const tipX = bx - Math.round(0.4 * 14);
      let x1 = d.x(z.anchor); if (x1 < 0) x1 = 0;
      const show = d.plotRight > 120 && tipX >= x1 + 4;
      return { label, tail, bw, bx, tipX, x2: show ? tipX : d.plotRight - 2, show, lw };
    };

    const zonesOver = (d: Draw) => {
      if (!d.on("zones")) return;
      const p = palette(d), pv = d.price, k = d.k, ctx = d.ctx;
      const py = pv.top, ph = pv.bottom - pv.top;
      ctx.save(); ctx.beginPath(); ctx.rect(0, pv.top, d.plotRight, pv.bottom - pv.top); ctx.clip();
      // broken traces
      for (const z of zones) {
        if (!traceAt(z, k)) continue;
        const yF = Math.floor(pv.y(z.far));
        if (yF < py || yF > py + ph - 1) continue;
        let x1 = d.x(z.anchor); const anchorOn = x1 >= 0; if (x1 < 0) x1 = 0;
        let xe = d.x(z.end); if (xe > d.plotRight) xe = d.plotRight;
        if (xe <= x1 + 1) continue;
        d.line([[x1, yF + 0.5], [xe, yF + 0.5]], rgba(p.neutZone, 0.6), 1, [3, 3]);
        const yN = pv.y(z.near), cTop = Math.max(py, Math.min(yF, yN)), cBot = Math.min(py + ph - 1, Math.max(yF, yN));
        if (anchorOn && cBot >= cTop) d.rect(Math.floor(x1), cTop, Math.floor(x1) + 1, cBot + 1, rgba(p.neutZone, 0.45));
      }
      // live zones: core line, spine, flag
      for (const z of zones) {
        if (!liveAt(z, k)) continue;
        const st = stAt(z, k), tier = st.tier;
        const yF = Math.floor(pv.y(z.far)), yN = pv.y(z.near);
        const zTop = Math.min(yF, yN), zBot = Math.max(yF, yN);
        if (zBot < py - 2 || zTop > py + ph + 2) continue;
        const cTop = Math.max(py, zTop), cBot = Math.min(py + ph - 1, zBot);
        const farOn = yF >= py && yF <= py + ph - 1;
        let x1 = d.x(z.anchor); const anchorOn = x1 >= 0; if (x1 < 0) x1 = 0;
        if (x1 > d.plotRight) continue;
        const core = tier === 2 ? (z.sup ? p.sbull : p.sbear) : (z.sup ? p.bull : p.bear);
        const fg = flagGeom(d, z, k);
        const w = fg.x2 - x1;
        if (w > 0.5) {
          let cw = LEVEL_W; if (tier === 0 && cw > 1) cw--;
          if (farOn) { const cy = Math.max(py, z.sup ? yF - (cw - 1) : yF); d.rect(x1, cy, x1 + w, cy + cw, rgba(core, CORE_A[tier])); }
          if (anchorOn && cBot >= cTop) {
            const sx = Math.floor(x1);
            d.rect(sx - 1, cTop, sx + 1, cBot + 1, rgba(core, CORE_A[tier]));
            if (st.turns >= 2 && w > 12) d.rect(sx + 3, cTop, sx + 5, cBot + 1, rgba(core, CORE_A[tier]));
          }
        }
        if (fg.show) {
          const TAG_H = 14, half = 7;
          let cy = yF + 0.5;
          if (cy - half < py + 1) cy = py + 1 + half; else if (cy + half > py + ph - 1) cy = py + ph - 1 - half;
          const top = Math.floor(cy - half) + 0.5, bot = top + TAG_H, right = fg.bx + fg.bw;
          ctx.beginPath(); ctx.moveTo(fg.tipX, cy); ctx.lineTo(fg.bx, top); ctx.lineTo(right, top); ctx.lineTo(right, bot); ctx.lineTo(fg.bx, bot); ctx.closePath();
          ctx.fillStyle = rgba(p.ground, 0.88); ctx.fill();
          ctx.strokeStyle = rgba(core, tier === 2 ? 0.9 : 0.55); ctx.lineWidth = 1; ctx.stroke();
          let tx = fg.bx + 5;
          d.text(fg.label, tx, cy + 0.5, { color: rgba(core, 1), size: 9.5, weight: 700 });
          tx += fg.lw + 5;
          const pyTop = Math.floor(cy - 3);
          for (let q = 0; q < 3; q++) d.rect(Math.floor(tx) + q * 5, pyTop, Math.floor(tx) + q * 5 + 3, pyTop + 6, rgba(core, q <= tier ? 1 : 0.24));
          tx += 13;
          if (fg.tail) d.text(fg.tail, tx + 6, cy + 0.5, { color: rgba(core, 0.95), size: 9.5, weight: 700 });
        }
      }
      ctx.restore();
    };

    // ------------------------------------------------------------ the DS ProRSI panel
    const RIB_H = 10, RIB_GAP = 4, VOL_H = 5, VOL_GAP = 2;
    const volStep = (r: number) => isNaN(r) || r < 0.67 ? 0 : r < 1.5 ? 1 : r < 3 ? 2 : 3;
    const drawPanel = (d: Draw, pv: PaneView) => {
      const p = palette(d), ctx = d.ctx, k = d.k;
      const py = pv.top, ph = pv.bottom - pv.top;
      const x1 = 2, x2 = d.plotRight - 2, w = x2 - x1;
      ctx.save(); ctx.beginPath(); ctx.rect(0, pv.top, d.plotRight, ph); ctx.clip();
      const Y = (v: number) => pv.y(v);
      const topPad = ph < 96 ? 14 : 20;
      const ribOn = ph >= 60, volOn = ribOn && ph >= 76;
      const ribPx = ribOn ? RIB_H + (volOn ? VOL_GAP + VOL_H : 0) + RIB_GAP : 0;
      const i0 = d.i0, i1 = Math.min(d.i1, k);
      const paintW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));

      // bands, thresholds, dashed 50
      const yTop = Y(100), yOb = Y(OB), yMid = Y(50), yOs = Y(OS), yBot = Y(0);
      if (yOb > yTop + 0.5) d.rect(x1, yTop, x2, yOb, rgba(p.bear, 0.05));
      if (yBot > yOs + 0.5) d.rect(x1, yOs, x2, yBot, rgba(p.bull, 0.05));
      d.rect(x1, Math.round(yOb), x2, Math.round(yOb) + 1, rgba(p.bear, 0.24));
      d.rect(x1, Math.round(yOs), x2, Math.round(yOs) + 1, rgba(p.bull, 0.24));
      d.line([[x1, Math.round(yMid) + 0.5], [x2, Math.round(yMid) + 0.5]], rgba(p.ink, 0.22), 1, [4, 4]);
      if (w > 200 && ph >= 60) {
        for (const [y, t, c] of [[yOb, `OVERBOUGHT ${OB}`, p.bear], [yOs, `OVERSOLD ${OS}`, p.bull], [yMid, "50", p.ink]] as [number, string, RGB][]) {
          if (y < py + 6 || y > py + ph - 6) continue;
          const lw = d.measure(t, { size: 8, weight: 600 }) + 6;
          d.rect(x1 + 2, y - 6, x1 + 2 + lw, y + 6, rgba(p.ground, 0.85));
          d.text(t, x1 + 5, y, { color: rgba(c, 0.62), size: 8, weight: 600 });
        }
      }

      // stems from the ribbon to the line at zone-making bars
      if (ribOn) {
        const yT = py + topPad + ribPx - RIB_GAP;
        for (let i = i0; i <= i1; i++) {
          const e = evt[i];
          if (e !== 1 && e !== -1 && e !== 3 && e !== -3) continue;
          const v = rsi[i]; if (isNaN(v)) continue;
          const yB = Y(v); if (yB <= yT + 1) continue;
          const x = Math.floor(d.x(i));
          d.rect(x, yT, x + 1, yB, rgba(e > 0 ? p.bull : p.bear, 0.16));
        }
      }

      // HEAT ribbon
      if (ribOn) {
        const y = py + topPad;
        d.rect(x1, y, x2, y + RIB_H, rgba(p.neutLit, 0.1));
        for (let i = i0; i <= i1; i++) {
          const st = state[i], v = rsi[i];
          if (st === ST_NEUTRAL || isNaN(v)) continue;
          let dd = st === ST_OB ? (v - OB) / Math.max(1, 100 - OB) : st === ST_OS ? (OS - v) / Math.max(1, OS) : 1 - Math.abs(v - 50) / Math.max(1, SQZ_BAND);
          dd = Math.max(0, Math.min(1, dd));
          const q = Math.floor(dd * 7 + 0.5);
          const c = st === ST_OB ? p.bear : st === ST_OS ? p.bull : p.sqz;
          const xa = d.x(i) - paintW / 2;
          d.rect(xa, y, xa + paintW, y + RIB_H, rgba(c, 0.3 + 0.7 * (q / 7)));
        }
        // event glyphs
        const cy = y + RIB_H * 0.5;
        const r = Math.max(2.6, Math.min(4.2, paintW * 0.5 + 1.6));
        for (let i = i0; i <= i1; i++) {
          const e = evt[i]; if (e === 0) continue;
          const x = d.x(i);
          if (e === 2 || e === -2) {
            ctx.fillStyle = rgba(p.ground, 1); ctx.beginPath(); ctx.arc(x, cy, 2.4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = rgba(p.ink, 0.85); ctx.beginPath(); ctx.arc(x, cy, 1.6, 0, Math.PI * 2); ctx.fill();
            continue;
          }
          const up = e > 0, hue = up ? p.bull : p.bear;
          const reinf = e === 3 || e === -3;
          const ccy = reinf ? (up ? cy - 1.5 : cy + 1.5) : cy;
          chevron(d, x, ccy, r, 3.4, rgba(p.ground, 1), up);
          chevron(d, x, ccy, r, 1.5, rgba(hue, 0.98), up);
          if (reinf) { const by = up ? cy + 3.2 : cy - 4.2; d.rect(x - r, by, x + r, by + 1, rgba(hue, 0.98)); }
        }
        if (w > 200) {
          d.rect(x1, y, x1 + 30, y + RIB_H, rgba(p.ground, 0.88));
          d.text("R", x1 + 3, y + RIB_H / 2, { color: rgba(p.ink, 0.9), size: 8, weight: 600 });
          d.text("HEAT", x1 + 12, y + RIB_H / 2, { color: rgba(p.ink, 0.5), size: 8, weight: 600 });
        }
      }
      // VOL strip
      if (volOn) {
        const y = py + topPad + RIB_H + VOL_GAP;
        d.rect(x1, y, x2, y + VOL_H, rgba(p.neutLit, 0.06));
        for (let i = i0; i <= i1; i++) {
          const q = volStep(rv[i]); if (q === 0) continue;
          const xa = d.x(i) - paintW / 2;
          d.rect(xa, y, xa + paintW, y + VOL_H, rgba(p.ink, q === 1 ? 0.16 : q === 2 ? 0.42 : 0.85));
        }
        if (w > 200) {
          d.rect(x1, y - 1, x1 + 30, y + VOL_H + 1, rgba(p.ground, 0.88));
          d.text("VOL", x1 + 12, y + VOL_H / 2, { color: rgba(p.ink, 0.5), size: 7, weight: 600 });
        }
      }

      // lines: classic ghost, signal, the RSI's ground shadow, the heat-coloured RSI
      if (d.on("classic")) d.series(pv, cls, rgba(p.ink, 0.3), 1);
      d.series(pv, sig, rgba(p.sig, 0.85), Math.max(1, LINE_W * 0.7));
      ctx.save(); ctx.translate(0, 1.7); d.series(pv, rsi, rgba(p.ground, 0.55), LINE_W * 0.85); ctx.restore();
      ctx.save(); ctx.lineCap = "round";
      for (let i = Math.max(1, i0); i <= i1; i++) {
        const a = rsi[i - 1], b = rsi[i];
        if (isNaN(a) || isNaN(b)) continue;
        d.line([[d.x(i - 1), Y(a)], [d.x(i), Y(b)]], rgba(heat(p, (a + b) * 0.5), 0.95), LINE_W);
      }
      ctx.restore();

      // value chip at the right edge
      const hb = Math.min(d.i1, k);
      const vv = rsi[hb];
      if (!isNaN(vv) && ph >= 40) {
        let cy = Y(vv);
        const loY = py + topPad + ribPx + 8, hiY = py + ph - 8;
        cy = Math.max(loY, Math.min(hiY, cy));
        const tx = String(Math.floor(vv + 0.5));
        const cw = 9 + d.measure(tx, { size: 9, weight: 600 });
        d.rect(x2 - cw - 1, cy - 6.5, x2 - 1, cy + 6.5, rgba(heat(p, vv), 0.92));
        d.text(tx, x2 - cw + 3, cy + 0.5, { color: rgba(p.ground, 1), size: 9, weight: 600 });
      }

      // header chips, right to left
      if (w >= 200 && !isNaN(vv)) {
        const sw = stateWord(hb);
        const txt = `RSI ${Math.floor(vv + 0.5)}  ${sw.t}`;
        const col = sw.tone === "bull" ? p.bull : sw.tone === "bear" ? p.bear : (state[hb] === ST_SQZ ? p.sqz : p.ink);
        const rw = 8 + d.measure(txt, { size: 10.5, weight: 700 });
        let right = x2 - 2;
        d.rect(right - rw, py + 1, right, py + 17, rgba(p.ground, 0.78));
        d.text(txt, right - rw + 4, py + 9, { color: rgba(col, 0.95), size: 10.5, weight: 700 });
        right -= rw + 6;
        const left = x1 + 96;
        const newest = hb === k;
        const cl = s.c[hb];
        const chip = (t: string, c: RGB) => {
          const cwid = 10 + d.measure(t, { size: 9, weight: 600 });
          if (right - cwid < left) return false;
          d.rect(right - cwid, py + 2, right, py + 16, rgba(p.ground, 0.78));
          d.rect(right - cwid, py + 2, right - cwid + 2, py + 16, rgba(c, 0.9));
          d.text(t, right - cwid + 6, py + 9, { color: rgba(c, 0.92), size: 9, weight: 600 });
          right -= cwid + 6;
          return true;
        };
        let ok = true;
        if (!isNaN(resN[hb])) ok = chip(`R ${fpc(resN[hb])}  ▲ ${ptsTxt(resN[hb] - cl, cl)}`, p.bear);
        if (ok && !isNaN(supN[hb])) ok = chip(`S ${fpc(supN[hb])}  ▼ ${ptsTxt(cl - supN[hb], cl)}`, p.bull);
        if (ok && newest) { const cx = crossShown(hb); if (cx) ok = chip(`CROSS ${cx.up ? "▲" : "▼"} ${fpc(cx.p)}`, cx.up ? p.bull : p.bear); }
        if (ok && newest && heldA[hb] + brokeA[hb] > 0) ok = chip(`ZONES  HELD ${heldA[hb]}  BROKE ${brokeA[hb]}`, p.ink);
        if (ok && !isNaN(rv[hb])) chip(`VOL ${rv[hb].toFixed(1)}×`, p.ink);
      }
      ctx.restore();
    };

    return {
      events,
      under: zonesUnder,
      draw(d) {
        zonesOver(d);
        const pv = d.pane("rsi");
        if (pv) drawPanel(d, pv);
      },
      priceExtent(i0, i1, k) {
        // keep the nearest live support and resistance in view when they sit close to the visible range
        let lo = Infinity, hi = -Infinity;
        // closed bars only: i1 can be the forming bar, whose final high/low is not known yet
        for (let i = i0; i <= Math.min(i1, k); i++) { if (s.l[i] < lo) lo = s.l[i]; if (s.h[i] > hi) hi = s.h[i]; }
        if (!isFinite(lo)) return null;
        const span = hi - lo, cl = s.c[k];
        let a = lo, b = hi;
        for (const z of zones) {
          if (!liveAt(z, k)) continue;
          const zl = Math.min(z.far, z.near), zh = Math.max(z.far, z.near);
          if (z.sup ? zh > cl : zl < cl) continue;
          if (zh < lo - span * 0.5 || zl > hi + span * 0.5) continue;
          a = Math.min(a, zl); b = Math.max(b, zh);
        }
        return [a, b];
      },
      readout(i): ReadItem[] {
        const sw = stateWord(i);
        const ev = evt[i];
        const out: ReadItem[] = [
          { label: "RSI", value: isNaN(rsi[i]) ? "—" : rsi[i].toFixed(1), tone: sw.tone },
          { label: "Classic RSI", value: isNaN(cls[i]) ? "—" : cls[i].toFixed(1) },
          { label: "Signal", value: isNaN(sig[i]) ? "—" : sig[i].toFixed(1) },
          { label: "State", value: sw.t.slice(2), tone: sw.tone },
          { label: "Volume", value: `${rv[i].toFixed(1)}× normal` },
        ];
        if (ev === 2 || ev === -2) out.push({ label: "Cross", value: "seen, refused" });
        return out;
      },
      status(k): ReadItem[] {
        const sw = stateWord(k), cl = s.c[k];
        const out: ReadItem[] = [{ label: `RSI ${isNaN(rsi[k]) ? "—" : Math.floor(rsi[k] + 0.5)}`, value: sw.t.slice(2), tone: sw.tone }];
        if (!isNaN(resN[k])) out.push({ label: "R", value: `${nf(resN[k])} · ▲ ${nf(resN[k] - cl)} pt`, tone: "bear" });
        if (!isNaN(supN[k])) out.push({ label: "S", value: `${nf(supN[k])} · ▼ ${nf(cl - supN[k])} pt`, tone: "bull" });
        const cx = crossShown(k);
        if (cx) out.push({ label: "CROSS", value: `${cx.up ? "▲" : "▼"} ${nf(cx.p)}`, tone: cx.up ? "bull" : "bear" });
        if (heldA[k] + brokeA[k] > 0) out.push({ label: "ZONES", value: `HELD ${heldA[k]} · BROKE ${brokeA[k]}` });
        out.push({ label: "VOL", value: `${rv[k].toFixed(1)}×` });
        return out;
      },
      legend: [
        { label: "Support zone", color: "#009999", shape: "box" },
        { label: "Resistance zone", color: "#A33DFF", shape: "box" },
        { label: "Heavy-volume zone", color: "#00FFFF", shape: "line" },
        { label: "Broken trace", color: "#808080", shape: "dash" },
        { label: "Signal", color: "rgb(240,163,92)", shape: "line" },
      ],
    };
  },
};

function chevron(d: Draw, cx: number, cy: number, r: number, w: number, col: string, up: boolean) {
  const rise = r * 0.62;
  const yb = up ? cy + rise * 0.5 : cy - rise * 0.5, yt = up ? cy - rise * 0.5 : cy + rise * 0.5;
  const ctx = d.ctx;
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(cx - r, yb); ctx.lineTo(cx, yt); ctx.lineTo(cx + r, yb); ctx.stroke(); ctx.restore();
}
