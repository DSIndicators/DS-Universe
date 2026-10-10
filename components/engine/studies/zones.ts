import type { Draw, ReadItem, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm } from "../ta";
import {
  P, runCore, readLive, distanceDim, stateWord, flowVerdict, formatVol, pctInt, bandProfile, clamp, volClass, rne,
  TIER_WEAK, TIER_MOD, TIER_STRONG, TIER_KEY, LIVE_IDLE, LIVE_APPROACHING, LIVE_TESTING, LIVE_BREAKING,
  type Level, type Snap, type Band, type Action,
} from "./_zones-core";

/**
 * DS Zones — web edition. Source: DSZones.cs (Build 2026-10-03), shipped defaults
 * (ApplyDefaults: Max levels 7, pivots 5/25/50/100, impulse 3 bars × 1.0 volume,
 * zone height ≤ 0.55 ATR(200), 5 zones per type, merge 0.35 ATR, tested after 15
 * bars, break 0.10 ATR with displacement, 6 broken archives for 120 bars,
 * proximity 0.5 ATR, strong imbalance 65%, footprint lookback 600 bars,
 * runway 120 px, caption 9, fill 42 / outline 52 / label 90, distance fade
 * 8 ATR to a 55% floor, DsSignature colours).
 *
 * PORTED (calculation in _zones-core.ts, line for line):
 *  · OnBarUpdate on every closed bar: the four pivot layers (strict 2L+1-bar
 *    swing, volume + score), the impulse engine (3 same-colour bars at ≥ the
 *    20-bar volume average → the last opposite candle within 5 bars is the
 *    origin, height clamped 0.22–0.55 ATR, cooldown search + 2), ScoreZone,
 *    the lifecycle (touch, TESTED-after-15-bars, DEFENDED = closed on its own
 *    side of the far edge → health × 0.94 + 0.30 × rejection quality, consumed
 *    test → health × 0.80, BROKEN = close beyond the far edge by 0.10 ATR on a
 *    displacement bar), overlap removal, 5-per-type cap, the flip archive.
 *  · The order-flow footprint: BandFlow / BandProfile exactly as the .cs builds
 *    them, choosing per bar the real aggressor split (fp) over the 1-minute
 *    tick-rule estimate (AccumulateFlow) when it covers ≥ half the volume.
 *  · The map NinjaTrader rebuilds once per bar (SnapshotStructure → BuildLevels
 *    → UpdateLive): candidate priority, anchor/merge hysteresis memos,
 *    MergeCluster scoring (sources, confluence, imbalance), relative volume by
 *    class, HoldTier, KEY, ReadLive, MarkApproaching (0.5 ATR, 1.25 hold), the
 *    distance-weighted rank, the 2/12-build admission wait, the MaxLevels cap
 *    and the live promotion of a hidden zone price is testing.
 *  · OnRender: context band from the origin bar (wash, solid action edge by
 *    tier, dotted far edge, left post), runway body with its own volume profile
 *    (≤ 48 source rows resampled to 1–2 px rows, 1-2-1 smoothing, buy toward
 *    price / sell against the wall, POC tick + dotted POC line), live slice and
 *    lit far edge, diamonds (filled held / hollow consumed), the caption
 *    (TYPE price STATE / KEY vol ×rel · BUY|SELL % VERDICT / buy|sell rule) with
 *    its three width modes and slot stacking, FitAccent/InkTone label contrast,
 *    the 12–50 px box clamp, DistanceDim, and dotted broken archives fading
 *    over 120 bars.
 *
 * DEVIATIONS
 *  1. Tick-driven live states. NinjaTrader re-reads APPROACHING / TESTING /
 *     BREAKING on every repaint from the last traded price. Here the map, its
 *     memos, the status and the events are evaluated once per CLOSED bar at
 *     its close (the frame NinjaTrader paints right after the bar update);
 *     while a bar is forming, draw() re-reads those states from the forming
 *     price (d.live) exactly as OnRender does, without touching the closed-bar
 *     memos. Intrabar pokes that close back outside a zone therefore show as
 *     the closed-bar lifecycle result (DEFENDED / consumed test) rather than
 *     as a TESTING event.
 *  2. Order flow history. NinjaTrader only computes zone/pivot flow in real
 *     time and on the last historical bars; the replay treats the bar before
 *     09:31 as that moment, then recomputes every bar. Where the session has a
 *     real bid/ask footprint the tool's Tick-Replay path is used (real
 *     aggressor split); where it does not (most history days) the tool's own
 *     fallback is used: the 1-minute series' tick-rule estimate, volume spread
 *     evenly over the bar's range. Ticks are filed as NinjaTrader files them
 *     with Calculate.OnBarClose (a forming bar's ticks under the last closed
 *     bar's slice, the 1-minute estimate one update later).
 *  3. Right margin. NinjaTrader lays the runway (profile body + caption) out
 *     in the chart's right margin (≈ 330 px). The replay chart keeps only five
 *     bars of air, so when that space is too small the runway is laid out
 *     against the plot's right edge with NinjaTrader's own narrowing rules
 *     (body 120 → 64 → 28 px, caption 172 → 64 px compact), profiles beneath
 *     the candles as in NinjaTrader, captions over them with a chart-ground
 *     halo under the glyphs (the tool's own diamond-halo treatment) so both
 *     the caption and the candles stay readable where they cross.
 *  4. Not applicable on the web: "Clear DS Iceberg's runway" (IcebergAware —
 *     no DS Iceberg on this chart, so the runway starts at the last bar as with
 *     the setting off), background-image ink sampling (plain ground), alerts
 *     (narrated as events instead), the live edge's slow pulse (drawn steady).
 *  5. Colours and type: zone hues use the site's DsSignature tokens
 *     (identical to the .cs on the dark ground; the light ground uses the
 *     deepened set); caption ink follows the .cs light-chart ink, InkTone and
 *     FitAccent. Captions are set in the site's sans (Inter Tight) instead of
 *     Segoe UI at the same 9 / 13 px sizes, with a 1.5% width tolerance in the
 *     caption's three-mode width test to absorb the metric difference.
 *  6. Example hygiene (web showcase). A level, zone or broken-archive band
 *     whose origin bar lies before s.replayFrom (the hidden warm-up the tool
 *     needs for ATR(200) and the 100-bar pivot layer) is not drawn, not
 *     narrated as an event, not counted in the status (nearest supply/demand,
 *     Map, Live zones) or the readout, and does not stretch the price scale.
 *     The calculation is identical: those objects stay in the map, keep their
 *     rank and their slots among the seven, merge and can be promoted exactly
 *     as in NinjaTrader — only their display is withheld (the core snapshot
 *     carries nSupplyShown / nDemandShown for the Live zones count).
 *
 * EVENTS (the rail) are the tool's own outputs — NEW SUPPLY/DEMAND ZONE, …
 * DEFENDED (n×), … TESTING (a consumed test, or a close inside a zone too
 * young to count a test), … BREAKING (live state at a close), … ZONE BROKEN —
 * for zones drawn in the map. The raw stream is denser than a rail can carry,
 * so only the notable class is narrated: one DEFENDED per visit (a visit
 * starts after 8 bars without a touch), at most one DEFENDED / TESTING /
 * BREAKING per zone per 15 bars, one NEW ZONE per 20 bars, BROKEN for zones
 * that were tested or outlived the 15-bar test window (simultaneous breaks of
 * one kind merged). APPROACHING is not narrated (it changes too often); it
 * shows on the chart and in the status. Everything still draws as the tool
 * draws it.
 */

// ---------------------------------------------------------------- colour helpers (.cs RelLum / FitAccent / InkTone)
type RGB = [number, number, number];
const hexRgb = (h: string): RGB => { const n = parseInt(h.slice(1, 7), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const rgbCss = (c: RGB, a = 1) => `rgba(${Math.round(clamp(c[0], 0, 1) * 255)},${Math.round(clamp(c[1], 0, 1) * 255)},${Math.round(clamp(c[2], 0, 1) * 255)},${clamp(a, 0, 1)})`;
const blend = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const relLum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const lumToSrgb = (l: number) => (l <= 0 ? 0 : l >= 1 ? 1 : l <= 0.0030402 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055);

type Ink = { light: boolean; bgLum: number; ink: RGB; inkMid: RGB; inkLo: RGB; bg: RGB };
function inkFor(bgHex: string): Ink {
  const bg = hexRgb(bgHex);
  const bgLum = relLum(bg[0], bg[1], bg[2]);
  const light = bgLum > 0.179;
  return light
    ? { light, bgLum, bg, ink: [0.086, 0.125, 0.180], inkMid: [0.290, 0.325, 0.380], inkLo: [0.420, 0.451, 0.502] }
    : { light, bgLum, bg, ink: [0.910, 0.878, 1.000], inkMid: [0.604, 0.588, 0.659], inkLo: [0.431, 0.416, 0.478] };
}
const inkTone = (ik: Ink, c: RGB): RGB => (ik.light ? [c[0] * 0.68, c[1] * 0.68, c[2] * 0.68] : c);
function accentOk(c: RGB, t: number, anchor: number, r: number, g: number, b: number, lb: number, labA: number) {
  const cr = c[0] + (anchor - c[0]) * t, cg = c[1] + (anchor - c[1]) * t, cb = c[2] + (anchor - c[2]) * t;
  const lt = relLum(r + (cr - r) * labA, g + (cg - g) * labA, b + (cb - b) * labA);
  return (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05) >= 3.0;
}
function fitAccent(ik: Ink, c: RGB, labA: number): RGB {
  const v = lumToSrgb(ik.bgLum);
  const lb = relLum(v, v, v), tr = ik.light ? 0 : 1;
  if (accentOk(c, 0, tr, v, v, v, lb, labA)) return c;
  let lo = 0, hi = 0.55;
  if (accentOk(c, hi, tr, v, v, v, lb, labA)) for (let it = 0; it < 8; it++) { const m = 0.5 * (lo + hi); if (accentOk(c, m, tr, v, v, v, lb, labA)) hi = m; else lo = m; }
  return [c[0] + (tr - c[0]) * hi, c[1] + (tr - c[1]) * hi, c[2] + (tr - c[2]) * hi];
}

const FLIP: RGB = [0x7e / 255, 0x7e / 255, 0x88 / 255];
const fmtPx = (p: number) => (rne(p / 0.25) * 0.25).toFixed(2);
const fmtC = (p: number) => {
  const t = (Math.round(p / 0.25) * 0.25).toFixed(2), dot = t.indexOf(".");
  return t.slice(0, dot).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + t.slice(dot);
};
const kindOf = (supply: boolean) => (supply ? "SUPPLY" : "DEMAND");

type Pal = { sup: RGB; dem: RGB; sSup: RGB; sDem: RGB };
const palOf = (d: Draw): Pal => ({ sup: hexRgb(d.th.bear), dem: hexRgb(d.th.bull), sSup: hexRgb(d.th.bearStrong), sDem: hexRgb(d.th.bullStrong) });
const tierOf = (lv: Level) => (lv.key ? TIER_KEY : lv.tierV);

/** the tool's map re-read at a price (UpdateLive with liveEdge), without touching the closed-bar memos */
function liveView(sn: Snap, price: number, tick: number): Level[] {
  const shown = sn.shown.map((l) => ({ ...l }));
  if (price === sn.price) return shown;
  const hidden = sn.hidden.map((l) => ({ ...l }));
  for (const lv of shown) readLive(lv, price, sn.atr, tick);
  const cap = Math.max(1, P.MaxLevels);
  for (let i = hidden.length - 1; i >= 0; i--) {
    const lv = hidden[i];
    readLive(lv, price, sn.atr, tick);
    if (lv.live !== LIVE_TESTING && lv.live !== LIVE_BREAKING) continue;
    if (shown.length >= cap) {
      let drop = -1;
      for (let q = 0; q < shown.length; q++) {
        const x = shown[q];
        if (x.live === LIVE_TESTING || x.live === LIVE_BREAKING) continue;
        if (drop < 0 || x.rankKey < shown[drop].rankKey) drop = q;
      }
      if (drop < 0) continue;
      shown.splice(drop, 1);
    }
    hidden.splice(i, 1);
    shown.push(lv);
  }
  shown.sort((a, b) => (b.prox !== a.prox ? b.prox - a.prox : a.id - b.id));
  // MarkApproaching with each level's Near memo as it stood after the close
  const reach = Math.max(P.ProximityAtr * (sn.atr > 0 ? sn.atr : tick * 4), tick);
  let ai = -1, bi = -1, ad = Number.MAX_VALUE, bd = Number.MAX_VALUE;
  shown.forEach((lv, i) => {
    if (!lv.isBand || lv.live === LIVE_TESTING || lv.live === LIVE_BREAKING) return;
    if (lv.bottom > price) { const dd = lv.bottom - price; if (dd < ad) { ad = dd; ai = i; } }
    else if (lv.top < price) { const dd = price - lv.top; if (dd < bd) { bd = dd; bi = i; } }
  });
  shown.forEach((lv, i) => {
    if (!lv.isBand) return;
    let near = false;
    if (i === ai) near = ad <= (lv.nearMemo ? reach * 1.25 : reach);
    else if (i === bi) near = bd <= (lv.nearMemo ? reach * 1.25 : reach);
    if (near) lv.live = LIVE_APPROACHING;
  });
  return shown;
}

export const study: StudyDef = {
  slug: "zones", rightMargin: 330,
  name: "DS Zones",
  about: "Swing pivots and volume-impulse supply/demand fused into the strongest seven levels, each read by its own order-flow profile and a live state.",
  needs: { flow: true },
  layers: [
    { id: "profiles", label: "Volume profiles", on: true, hint: "Each zone's own volume at every price inside it — teal buying, violet selling — with its POC." },
    { id: "captions", label: "Captions", on: true, hint: "Type, action-edge price, live state, volume and the order-flow read." },
    { id: "broken", label: "Broken zones", on: true, hint: "Zones that broke stay as dotted steel bands, cut at the breaking bar, fading over 120 bars." },
  ],
  run(s) {
    const core = runCore(s);
    const { snaps, actions, atr } = core;
    const tick = s.tick;
    const start = core.start;
    const snapAt = (k: number): Snap | undefined => (k >= start && k < s.n ? snaps[k] : undefined);

    // Example hygiene (web showcase): a level, zone or archive band whose origin
    // bar lies before the first replayed bar (the hidden warm-up the tool needs
    // for ATR(200) and the 100-bar pivots) is not drawn, narrated or counted.
    // The calculation is untouched — those objects still exist in the map.
    const bornBar = new Map<number, number>();
    for (let k = 0; k < s.n; k++) for (const a of actions[k] ?? []) if (a.kind === "new") bornBar.set(a.id, a.originBar ?? k);
    const onStage = (bar: number) => bar >= s.replayFrom;
    const zoneOnStage = (id: number) => onStage(bornBar.get(id) ?? -1);
    const stageLv = (lv: Level) => onStage(lv.createdBar);

    // ------------------------------------------------------------ events
    // Throttled so the rail stays readable: one DEFENDED per visit (a visit
    // starts after 8 bars without a touch), at most one TESTING / BREAKING /
    // DEFENDED per zone per 15 bars, one NEW ZONE per 20 bars,
    // BROKEN for drawn zones that were tested or outlived the 15-bar test
    // window (simultaneous breaks of one kind merged). Everything else still
    // draws exactly as the tool draws it.
    const events: StudyEvent[] = [];
    const GAP = 8, HOLD = 15, NEW_HOLD = 20;
    const lastEv = new Map<number, number>();
    const absorbScratch = new Float64Array(4);
    let lastNew = -1e9;
    let prevLive = new Map<number, number>();
    const zoneTone = (supply: boolean, strong = false): Tone => (supply ? (strong ? "strongBear" : "bear") : strong ? "strongBull" : "bull");
    const px = (p: number) => Math.round(p / tick) * tick;
    const quietBefore = (bottom: number, top: number, k: number) => {
      for (let q = k - 1; q >= Math.max(0, k - GAP); q--) if (s.h[q] >= bottom && s.l[q] <= top) return false;
      return true;
    };
    const held = (id: number, k: number) => k - (lastEv.get(id) ?? -1e9) < HOLD;
    for (let k = start; k < s.n; k++) {
      const sn = snaps[k];
      if (!sn) continue;
      const acts: Action[] = actions[k] ?? [];
      const T = hhmm(s, k);
      const shownBand = new Map<number, Level>();
      for (const lv of sn.shown) if (lv.isBand && stageLv(lv)) shownBand.set(lv.zoneId, lv);
      const prevSn = snaps[k - 1];
      const prevShown = new Set<number>();
      if (prevSn) for (const lv of prevSn.shown) if (lv.isBand && stageLv(lv)) prevShown.add(lv.zoneId);
      const brk = P.BreakDistAtr * sn.atr;
      const done = new Set<number>();
      if (k >= s.replayFrom) {
        // confirmed breaks (merged per kind)
        for (const supply of [true, false]) {
          const br = acts.filter((a) => a.kind === "broken" && a.supply === supply && (prevShown.has(a.id) || shownBand.has(a.id)) && (a.count > 0 || a.tests > 0 || a.age >= P.TestedAfterBars));
          if (!br.length) continue;
          const K = kindOf(supply);
          const vr = s.v[k] / Math.max(1, avgVol(k)), body = Math.abs(s.c[k] - s.o[k]);
          const why = body >= 0.5 * sn.atr ? `a body of ${body.toFixed(2)} points, at least half an ATR` : `volume ${vr.toFixed(1)}× its 20-bar average`;
          const fars = br.map((a) => (supply ? a.top : a.bottom));
          const def = br.reduce((m, a) => Math.max(m, a.count), 0);
          events.push({
            i: k, price: px(fars[0]), tone: "neutral", weight: 3,
            title: br.length > 1 ? `${br.length} ${K} ZONES BROKEN` : `${K} ZONE BROKEN`,
            text: `${T} — the bar closed at ${fmtC(s.c[k])}, beyond the far edge${br.length > 1 ? "s" : ""} of ${br.length > 1 ? `${br.length} ${K.toLowerCase()} zones (${fars.map(fmtC).join(", ")})` : `the ${K.toLowerCase()} zone (${fmtC(fars[0])})`} by more than the 0.1-ATR break distance, on a displacement bar (${why}). ${br.length > 1 ? "They keep" : "It keeps"} the ${K} label as a dotted archive band${def > 0 && br.length === 1 ? `, after ${def} defended bar${def > 1 ? "s" : ""}` : ""}.`,
          });
          for (const a of br) done.add(a.id);
        }
        for (const a of acts) {
          if (done.has(a.id)) continue;
          const K = kindOf(a.supply), edge = a.supply ? a.bottom : a.top, far = a.supply ? a.top : a.bottom;
          const lv = shownBand.get(a.id);
          if (!lv) continue;
          if (a.kind === "new") {
            if (k - lastNew < NEW_HOLD) continue;
            lastNew = k;
            const ob = a.originBar ?? k;
            events.push({
              i: k, price: px(edge), tone: zoneTone(a.supply), weight: tierOf(lv) >= TIER_STRONG ? 2 : 1,
              title: `NEW ${K} ZONE`,
              text: `${T} — three ${a.supply ? "bearish" : "bullish"} bars in a row, averaging at least the 20-bar volume, created a ${K.toLowerCase()} zone ${fmtC(a.bottom)}–${fmtC(a.top)}, anchored on the last ${a.supply ? "bullish" : "bearish"} candle before the move (${hhmm(s, ob)}); its action edge is ${fmtC(edge)}.`,
            });
            done.add(a.id);
          } else if (a.kind === "defended") {
            if (!quietBefore(a.bottom, a.top, k) || held(a.id, k)) continue;
            // RejectionQuality reads ONE footprint slice (k-1: this bar's real ticks + the
            // previous bar's 1-minute tick-rule estimate) and uses the real split only when
            // it covers ≥ half the estimate. Narrate the share only when that real split
            // was used — the estimate is the prior bar's all-or-nothing sign, not this bar.
            const absorbReal = (() => {
              core.fp.band(k - 1, rne(a.bottom / tick), rne(a.top / tick), absorbScratch);
              const tr = absorbScratch[2] + absorbScratch[3];
              return tr > 0 && tr >= 0.5 * (absorbScratch[0] + absorbScratch[1]);
            })();
            const flowTxt = a.absorb !== undefined && a.absorb !== 0.5 && absorbReal
              ? ` Aggressive ${a.supply ? "buying" : "selling"} made up ${Math.round(a.absorb * 100)}% of the volume traded inside the zone on this bar.`
              : "";
            const inside = s.c[k] >= a.bottom && s.c[k] <= a.top;
            events.push({
              i: k, price: px(edge), tone: zoneTone(a.supply), weight: 2,
              title: `${K} DEFENDED${a.count > 1 ? ` ${a.count}\u00d7` : ""}`,
              text: `${T} — the bar traded into the ${K.toLowerCase()} zone at ${fmtC(edge)} and closed ${inside ? "still inside it" : `back ${a.supply ? "below" : "above"} it`}, on the zone's own side of its far edge ${fmtC(far)}: a filled diamond, and the zone's conviction rises.${flowTxt}`,
            });
            lastEv.set(a.id, k); done.add(a.id);
          } else if (a.kind === "tested") {
            if (held(a.id, k)) continue;
            const breaking = lv.live === LIVE_BREAKING;
            events.push({
              i: k, price: px(far), tone: zoneTone(a.supply, true), weight: breaking ? 2 : 1,
              title: `${K} ${breaking ? "BREAKING" : "TESTING"}`,
              text: breaking
                ? `${T} — the bar closed at ${fmtC(s.c[k])}, more than the ${brk.toFixed(2)}-point break distance beyond the ${K.toLowerCase()} zone's far edge ${fmtC(far)}, but without displacement (body under half an ATR, volume under 1.3× average): BREAKING, the far edge lit, the break not confirmed. The test consumed the zone: a hollow diamond, and its conviction drains.`
                : `${T} — the bar closed at ${fmtC(s.c[k])}, past the ${K.toLowerCase()} zone's far edge ${fmtC(far)} but by less than the ${brk.toFixed(2)}-point break distance, so the test consumed the zone instead of breaking it: a hollow diamond, and its conviction drains.`,
            });
            lastEv.set(a.id, k); done.add(a.id);
          }
        }
        // live states at the close
        for (const lv of sn.shown) {
          if (!lv.isBand || !stageLv(lv) || done.has(lv.zoneId) || held(lv.zoneId, k)) continue;
          const p = prevLive.get(lv.zoneId) ?? LIVE_IDLE;
          const K = kindOf(lv.supply), far = lv.supply ? lv.top : lv.bottom;
          if (acts.some((a) => a.id === lv.zoneId)) continue;
          if (lv.live === LIVE_BREAKING && p !== LIVE_BREAKING) {
            events.push({
              i: k, price: px(far), tone: zoneTone(lv.supply, true), weight: 2,
              title: `${K} BREAKING`,
              text: `${T} — the bar closed at ${fmtC(s.c[k])}, more than the break distance beyond the ${K.toLowerCase()} zone's far edge ${fmtC(far)}, but without displacement (body under half an ATR, volume under 1.3× average): the far edge lights, and the break is not confirmed.`,
            });
            lastEv.set(lv.zoneId, k);
          } else if (lv.live === LIVE_TESTING && p !== LIVE_TESTING && p !== LIVE_BREAKING) {
            const inside = s.c[k] >= lv.bottom && s.c[k] <= lv.top;
            events.push({
              i: k, price: px(lv.prox), tone: zoneTone(lv.supply, true), weight: 1,
              title: `${K} TESTING`,
              text: `${T} — the bar closed at ${fmtC(s.c[k])}, ${inside ? `inside the ${K.toLowerCase()} zone ${fmtC(lv.bottom)}–${fmtC(lv.top)}` : `just past the ${K.toLowerCase()} zone's far edge ${fmtC(far)}, inside the break distance`}. The zone is younger than 15 bars, so the tool shows TESTING without counting a test yet.`,
            });
            lastEv.set(lv.zoneId, k);
          }
        }
      }
      prevLive = new Map();
      for (const lv of sn.shown) if (lv.isBand) prevLive.set(lv.zoneId, lv.live);
    }
    function avgVol(k: number) { let sm = 0, m = 0; for (let q = Math.max(0, k - 19); q <= k; q++) { sm += s.v[q]; m++; } return sm / Math.max(1, m); }

    // ------------------------------------------------------------ drawing
    const profCache = new WeakMap<Band, { buy: Float64Array; sell: Float64Array } | null>();
    const profOf = (b: Band | null) => {
      if (!b) return null;
      if (!profCache.has(b)) profCache.set(b, bandProfile(core.fp, b, b.b1));
      return profCache.get(b) ?? null;
    };

    type Frame = {
      d: Draw; pal: Pal; ik: Ink; sn: Snap; levels: Level[]; price: number; rb: number; lastI: number;
      bodyL: number; bodyR: number; capW: number; runwayRight: number; overlay: boolean;
    };
    const Sn = (v: number) => Math.floor(v + 0.5 + 1e-4);
    const Y = (d: Draw, p: number) => { const y = d.price.y(p); return Math.max(d.price.top - 4000, Math.min(d.price.bottom + 4000, y)); };
    const fill = (d: Draw, x0: number, y: number, x1: number, h: number, c: RGB, a: number) => {
      if (a <= 0.003) return;
      const l = Sn(x0), r = Sn(x1);
      if (r - l < 0.5) return;
      d.ctx.fillStyle = rgbCss(c, a);
      d.ctx.fillRect(l, Sn(y), r - l, Math.max(1, Sn(h)));
    };
    const vcol = (d: Draw, x: number, y0: number, y1: number, c: RGB, a: number) => {
      if (a <= 0.003) return;
      const t = Sn(y0), b = Sn(y1);
      if (b - t < 0.5) return;
      d.ctx.fillStyle = rgbCss(c, a);
      d.ctx.fillRect(Sn(x), t, 1, b - t);
    };
    const dotted = (d: Draw, x0: number, x1: number, y: number, c: RGB, a: number) => {
      if (a <= 0.01 || x1 - x0 < 1) return;
      const ctx = d.ctx;
      ctx.save(); ctx.strokeStyle = rgbCss(c, a); ctx.lineWidth = 1; ctx.setLineDash([1, 2]);
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
    };
    const box = (d: Draw, top: number, bottom: number, mid: number, anchor: number) => {
      const midY = Y(d, mid);
      let t = Y(d, top), b = Y(d, bottom);
      if (b < t) { const x = t; t = b; b = x; }
      const natural = b - t, minPx = Math.max(4, P.ZoneMinPx), maxPx = Math.max(minPx + 2, P.ZoneMaxPx);
      if (!(natural >= minPx && natural <= maxPx)) {
        const hgt = natural < minPx ? minPx : maxPx;
        if (anchor === 1) t = b - hgt;
        else if (anchor === 2) b = t + hgt;
        else { t = midY - 0.5 * hgt; b = midY + 0.5 * hgt; }
      }
      let T = Sn(t), B = Sn(b);
      if (B < T + 4) B = Sn(T + 4);
      return [T, B] as const;
    };
    const levelBox = (d: Draw, lv: Level) => box(d, lv.top, lv.bottom, lv.mid, lv.isBand ? (lv.supply ? 1 : 2) : 0);
    const proxRow = (lv: Level, top: number, bottom: number) => (!lv.isBand ? Sn((top + bottom) * 0.5) : lv.supply ? bottom - 1 : top);
    const trueDistRow = (d: Draw, lv: Level, top: number, bottom: number) => {
      const bx = lv.supply ? top : bottom - 1;
      if (!lv.isBand) return bx;
      const y = Sn(Y(d, lv.supply ? lv.top : lv.bottom));
      if (lv.supply) return y < bx ? y : bx;
      return y - 1 > bx ? y - 1 : bx;
    };
    const hue = (f: Frame, lv: { supply: boolean }) => (lv.supply ? f.pal.sup : f.pal.dem);
    const strong = (f: Frame, lv: { supply: boolean }) => (lv.supply ? f.pal.sSup : f.pal.sDem);
    const levelLeft = (d: Draw, bar: number) => Sn(Math.floor(Math.max(0, d.x(bar))));
    const dim = (f: Frame, level: number) => distanceDim(level, f.price, f.sn.atr);

    function frameOf(d: Draw): Frame | null {
      const sn = snapAt(d.k);
      if (!sn) return null;
      const price = d.live ? d.live.c : sn.price;
      const levels = liveView(sn, price, tick).filter(stageLv);
      const lastI = d.live ? d.live.i : d.k;
      const rb = d.x(lastI);
      // LaneLayout — in the chart's right margin when there is one, else against the plot's right edge
      let runwayRight = d.plotRight - 8;
      let L = rb + 8;
      let body = Math.max(70, P.RunwayPixels), cap = 172 * (Math.max(7, Math.min(14, P.CaptionSize)) / 9), gap = 12;
      let room = runwayRight - L;
      let overlay = false;
      if (room < body + gap + cap) {
        overlay = true;
        room = Math.min(body + gap + cap, Math.max(132, d.plotRight * 0.34));
        L = runwayRight - room;
      }
      if (body + gap + cap > room) body = Math.max(64, room - gap - cap);
      if (body + gap + cap > room && cap > 0) cap = Math.max(64, room - gap - body);
      if (body + gap + cap > room) body = Math.max(28, room - gap - cap);
      if (body + gap + cap > room) { cap = 0; gap = 0; body = Math.min(body, room); }
      if (body < 20) body = 0;
      return { d, pal: palOf(d), ik: inkFor(d.th.bg), sn, levels, price, rb, lastI, bodyL: Sn(L), bodyR: Sn(L + body), capW: cap, runwayRight, overlay };
    }

    function drawArchive(f: Frame) {
      const { d, sn } = f;
      for (const z of sn.flips) {
        if (!onStage(z.createdBar)) continue;
        const fade = clamp(1 - (sn.k - z.brokenBar) / Math.max(1, P.FlipArchiveBars), 0, 1) * dim(f, z.level);
        if (fade <= 0.03) continue;
        let left = d.x(z.createdBar);
        if (left < 0) left = 0;
        let xb = d.x(Math.max(0, Math.min(z.brokenBar, f.lastI)));
        if (xb > f.rb) xb = f.rb;
        left = Sn(left); xb = Sn(xb);
        if (xb <= left + 2) continue;
        const a = 0.55 * fade;
        if (a <= 0.01) continue;
        const [top, bottom] = box(d, z.top, z.bottom, z.level, 0);
        dotted(d, left, xb, top + 0.5, FLIP, a);
        dotted(d, left, xb, bottom - 0.5, FLIP, a);
        vcol(d, xb, top, bottom, FLIP, clamp(0.75 * fade, 0, 1));
      }
    }

    function drawContext(f: Frame, lv: Level, xEnd: number) {
      const { d } = f;
      const fade = dim(f, lv.mid);
      const left = levelLeft(d, lv.createdBar);
      if (left >= xEnd - 1) return;
      const [top, bottom] = levelBox(d, lv);
      const tr = tierOf(lv);
      const h = hue(f, lv), ec = tr === TIER_KEY ? strong(f, lv) : h;
      const mid = Math.max(left, Math.min(f.rb, xEnd));
      fill(d, left, top, xEnd, bottom - top, h, 0.075 * fade);
      const pa = clamp((tr === TIER_KEY ? 0.95 : tr === TIER_STRONG ? 0.78 : tr === TIER_MOD ? 0.60 : 0.40) * fade, 0, 1);
      const py = proxRow(lv, top, bottom);
      fill(d, left, py, mid, 1, ec, pa);
      fill(d, mid, py, xEnd, 1, ec, pa);
      if (lv.isBand) {
        const dy = trueDistRow(d, lv, top, bottom) + 0.5;
        const da = clamp(0.34 * fade, 0, 1);
        dotted(d, left, mid, dy, h, da);
        if (xEnd > mid + 1) dotted(d, mid, Sn(xEnd), dy, h, da);
        vcol(d, left, top, bottom, h, clamp(0.55 * fade, 0, 1));
      }
    }

    function drawProfile(f: Frame, lv: Level, L0: number, R0: number) {
      const { d } = f;
      const fade = dim(f, lv.mid);
      const [top, bottom] = levelBox(d, lv);
      const tr = tierOf(lv);
      const h = hue(f, lv), st = strong(f, lv);
      fill(d, L0, top, R0, bottom - top, h, clamp(0.06 * fade, 0, 1));
      // RunwayEdges
      const pw = tr >= TIER_STRONG ? 2 : 1;
      const py = !lv.isBand ? proxRow(lv, top, bottom) : lv.supply ? bottom - pw : top;
      const edgeC = tr === TIER_KEY || lv.live === LIVE_APPROACHING || lv.live === LIVE_TESTING ? st : h;
      fill(d, L0, py, R0, pw, edgeC, clamp(fade, 0, 1));
      if (lv.isBand) {
        const breaking = lv.live === LIVE_BREAKING;
        fill(d, L0, trueDistRow(d, lv, top, bottom), R0, 1, breaking ? st : h, breaking ? 1 : clamp(0.45 * fade, 0, 1));
      }
      if (lv.conf) fill(d, L0, lv.supply ? bottom + 2 : top - 3, R0, 1, h, clamp(0.60 * fade, 0, 1));
      vcol(d, R0 - 1, top, bottom, h, clamp(0.60 * fade, 0, 1));

      if (!d.on("profiles")) return;
      const pr = profOf(lv.prof);
      const pb = pr?.buy, ps = pr?.sell;
      const n = pb && ps ? Math.min(pb.length, ps.length) : 0;
      let tot = 0;
      for (let i = 0; i < n; i++) tot += pb![i] + ps![i];
      const inTop = top + 2, inBot = bottom - 2;
      const innerPx = Math.round(inBot - inTop), air = 1, barPx = inBot - inTop >= 26 ? 2 : 1, pitch = barPx + air;
      if (n === 0 || tot <= 0 || innerPx < pitch + barPx) return;
      const nr = Math.max(2, Math.min(128, Math.floor((innerPx + air) / pitch)));
      const stackPx = nr * pitch - air;
      const y0 = Sn(inTop + Math.floor((innerPx - stackPx) * 0.5));
      const row = new Float64Array(nr), rowB = new Float64Array(nr), sm = new Float64Array(nr);
      for (let i = 0; i < n; i++) {
        const v = pb![i] + ps![i];
        if (v <= 0) continue;
        const bf = pb![i] / v, a0 = (i * nr) / n, a1 = ((i + 1) * nr) / n;
        const k0 = Math.floor(a0), k1 = Math.min(nr - 1, Math.ceil(a1) - 1);
        for (let q = k0; q <= k1; q++) {
          const ov = Math.max(0, Math.min(a1, q + 1) - Math.max(a0, q));
          row[q] += v * ov; rowB[q] += v * bf * ov;
        }
      }
      let zmax = 0, poc = 0;
      for (let q = 0; q < nr; q++) {
        sm[q] = nr >= 6 ? (row[Math.max(0, q - 1)] + 2 * row[q] + row[Math.min(nr - 1, q + 1)]) * 0.25 : row[q];
        if (sm[q] > zmax) { zmax = sm[q]; poc = q; }
      }
      if (zmax <= 0) return;
      const W = R0 - L0 - 3;
      const rel = lv.relVol > 0 ? lv.relVol : 1;
      const span = W * (0.55 + 0.45 * clamp(Math.sqrt(rel / 4), 0, 1));
      const tierK = tr === TIER_WEAK ? 0.6 : tr === TIER_MOD ? 0.85 : 1;
      const rowFade = 0.4 + 0.6 * fade;
      const rowBuy = blend(f.pal.dem, f.pal.sDem, 0.30), rowSell = blend(f.pal.sup, f.pal.sSup, 0.15);
      const pocBuy = blend(f.pal.dem, f.pal.sDem, 0.75), pocSell = blend(f.pal.sup, f.pal.sSup, 0.60);
      const xa = R0 - 1;
      for (let q = 0; q < nr; q++) {
        const yb = y0 + (stackPx - (q + 1) * pitch + air);
        const Lk = Sn(span * (sm[q] / zmax));
        if (Lk < 1) continue;
        const bf = row[q] > 0 ? rowB[q] / row[q] : 0.5;
        const xs = xa - Lk, xb = Sn(xs + Lk * bf);
        const isPoc = q === poc;
        const a = clamp((isPoc ? 1 : 0.92) * tierK * rowFade, 0, 1);
        if (xb - xs >= 1) { d.ctx.fillStyle = rgbCss(isPoc ? pocBuy : rowBuy, a); d.ctx.fillRect(xs, yb, xb - xs, barPx); }
        if (xa - xb >= 1) { d.ctx.fillStyle = rgbCss(isPoc ? pocSell : rowSell, a); d.ctx.fillRect(xb, yb, xa - xb, barPx); }
      }
      const yp = y0 + (stackPx - (poc + 1) * pitch + air);
      const xp = Sn(xa - Sn(span * (sm[poc] / zmax)) - 3);
      d.ctx.fillStyle = rgbCss(tr === TIER_KEY ? st : f.ik.ink, clamp(0.9 * fade, 0, 1));
      d.ctx.fillRect(xp, yp - 1, 1, barPx + 2);
      const left = levelLeft(d, lv.createdBar);
      const natural = Math.abs(Y(d, lv.bottom) - Y(d, lv.top));
      const trueScale = natural >= Math.max(4, P.ZoneMinPx) && natural <= Math.max(Math.max(4, P.ZoneMinPx) + 2, P.ZoneMaxPx);
      if (lv.isBand && trueScale && L0 - left > 2 && bottom - top >= 16) {
        const ym = yp + Math.trunc((barPx - air) / 2) + 0.5;
        const pa = clamp(0.28 * fade, 0, 1), xm = Math.max(left, Math.min(L0, f.rb));
        const pc = tr === TIER_KEY ? st : h;
        if (xm > left + 1) dotted(d, left, xm, ym, pc, pa);
        if (L0 > xm + 1) dotted(d, xm, L0, ym, pc, pa);
      }
    }

    function drawLive(f: Frame, lv: Level, L0: number, R0: number) {
      const { d } = f;
      if (!lv.isBand || R0 - L0 < 20) return;
      if (lv.live !== LIVE_TESTING && lv.live !== LIVE_BREAKING) return;
      const [top, bottom] = levelBox(d, lv);
      const st = strong(f, lv);
      const fy = Sn(Y(d, f.price));
      const px = lv.supply ? bottom : top;
      const a0 = Math.max(top, Math.min(px, fy)), a1 = Math.min(bottom, Math.max(px, fy));
      if (a1 > a0) fill(d, L0, a0, R0, a1 - a0, st, 0.22);
      if (fy >= top - 1 && fy <= bottom + 1) fill(d, L0, fy, R0, 1, st, 0.9);
      if (lv.live === LIVE_BREAKING) fill(d, L0, trueDistRow(d, lv, top, bottom), R0, 1, st, 1);
    }

    function drawMarks(f: Frame, lv: Level) {
      const { d } = f;
      const m = lv.marks;
      if (!m || m.length === 0) return;
      const fade = dim(f, lv.mid);
      const [top, bottom] = levelBox(d, lv);
      const y = proxRow(lv, top, bottom) + 0.5;
      const c = tierOf(lv) === TIER_KEY ? strong(f, lv) : hue(f, lv);
      const fillC = blend(c, f.ik.ink, 0.40), lineC = blend(c, f.ik.ink, 0.25);
      const ctx = d.ctx;
      const dia = (x: number, r: number) => { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); };
      for (const mk of m) {
        const held = mk >= 0, bar = held ? mk : -mk - 1;
        if (bar < d.i0 || bar > d.i1) continue;
        const x = Sn(d.x(bar)) + 0.5;
        dia(x, 4.9); ctx.fillStyle = rgbCss(f.ik.bg, 0.9); ctx.fill();
        dia(x, 3.5);
        if (held) { ctx.fillStyle = rgbCss(fillC, clamp(0.98 * fade, 0, 1)); ctx.fill(); }
        else { ctx.strokeStyle = rgbCss(lineC, clamp(0.9 * fade, 0, 1)); ctx.lineWidth = 1; ctx.stroke(); }
      }
    }

    function drawCaptions(f: Frame) {
      const { d, ik } = f;
      const kS = Math.max(7, Math.min(14, P.CaptionSize)) / 9;
      const rox = Sn(f.bodyR + 12);
      const rw = Math.min(f.capW, f.runwayRight - rox);
      if (rw < 60) return;
      const slotT: number[] = [], slotB: number[] = [];
      const claim = (desired: number, height: number) => {
        let t = desired;
        for (let g = 0; g < 12; g++) {
          let moved = false;
          for (let i = 0; i < slotT.length; i++) if (t < slotB[i] + 2 && t + height > slotT[i] - 2) { t = slotB[i] + 3; moved = true; break; }
          if (!moved) break;
        }
        slotT.push(t); slotB.push(t + height);
        return t;
      };
      const small = { size: 9 * kS, weight: 600, font: "sans" as const, base: "alphabetic" as CanvasTextBaseline };
      const big = { size: 13 * kS, weight: 600, font: "sans" as const, base: "alphabetic" as CanvasTextBaseline };
      const tw = (kind: 0 | 1, t: string) => d.measure(t, kind ? big : small);
      const txt = (kind: 0 | 1, t: string, x: number, yb: number, c: RGB, a: number, right: boolean) => {
        if (!t || a <= 0.003) return;
        const w = tw(kind, t); // also leaves the caption font on the context
        const x0 = Sn(right ? x - w : x), y0 = Sn(yb);
        if (f.overlay) {
          // over candles (deviation 3): a chart-ground halo under the glyphs, as the tool haloes its diamonds
          const ctx = d.ctx;
          ctx.save(); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
          ctx.strokeStyle = rgbCss(ik.bg, 0.9); ctx.lineWidth = kind ? 3.5 : 3; ctx.strokeText(t, x0, y0); ctx.restore();
        }
        d.text(t, x0, y0, { ...(kind ? big : small), color: rgbCss(c, a) });
      };
      for (const lv of f.levels) {
        const fade = dim(f, lv.mid);
        const [top, bottom] = levelBox(d, lv);
        const cy0 = (top + bottom) * 0.5, blockH = 34 * kS;
        const t = claim(cy0 - 15 * kS, blockH);
        const cy = t + 15 * kS;
        const labA = (P.LabelOpacity / 100) * (0.75 + 0.25 * fade);
        const tr = tierOf(lv), key = tr === TIER_KEY;
        const H = hue(f, lv), S = strong(f, lv);
        const typeC = fitAccent(ik, inkTone(ik, H), labA);
        const priceC = key ? fitAccent(ik, inkTone(ik, S), labA) : ik.ink;
        const word = stateWord(lv);
        const live = lv.live !== LIVE_IDLE;
        const stateRaw: RGB = live ? inkTone(ik, S) : !lv.isBand ? ik.inkMid : lv.defendCount > 0 ? inkTone(ik, H) : lv.domState === 1 ? ik.inkMid : inkTone(ik, H);
        const stateC = fitAccent(ik, stateRaw, labA);
        const volS = formatVol(lv.dispVol);
        const vc = volClass(lv);
        const suffix = vc === 0 ? " vol" : vc === 1 ? " impulse" : " swing vol";
        const relS = key || lv.relVol >= Math.max(1.05, P.HighVolMultiplier) ? `×${lv.relVol.toFixed(1)}` : null;
        const relC = fitAccent(ik, inkTone(ik, key ? S : H), labA);
        let verS: string | null = null, pctS: string | null = null, verC = ik.inkMid, pctC = ik.inkMid;
        if (lv.flowReady) {
          const buyDom = lv.buyPct >= 0.5;
          pctS = `${buyDom ? "BUY " : "SELL "}${pctInt(Math.max(lv.buyPct, 1 - lv.buyPct))}`;
          pctC = fitAccent(ik, inkTone(ik, buyDom ? f.pal.dem : f.pal.sup), labA);
          verS = flowVerdict(lv);
          if (verS) {
            const vr: RGB = verS === "BALANCED" ? ik.inkMid : verS === "OVERRUN" ? inkTone(ik, S) : inkTone(ik, H);
            verC = fitAccent(ik, vr, labA);
          }
        } else { verS = "NO FOOTPRINT"; verC = ik.inkLo; }

        const yb1 = Sn(cy - 3.5 * kS), yb2 = Sn(cy + 10.5 * kS);
        const priceS = fmtPx(lv.prox);
        const priceW = tw(1, priceS), stateW = tw(0, word) + 8 * kS;
        // NinjaTrader measures Segoe UI; the site face runs ~1.5% wider, so the
        // width test carries that much tolerance (the drawn gap stays ≥ 6 px)
        const fit = rw * 1.015;
        let mode = 0;
        if (46 * kS + priceW + stateW > fit) mode = 1;
        if (mode === 1 && priceW + stateW > fit) mode = 2;
        if (mode === 2) {
          txt(1, priceS, rox, yb1, priceC, labA, false);
          txt(0, word, rox, yb2, stateC, labA, false);
          continue;
        }
        if (mode === 0) { txt(0, kindOf(lv.supply), rox, yb1, typeC, labA, false); txt(1, priceS, rox + 46 * kS, yb1, priceC, labA, false); }
        else txt(1, priceS, rox, yb1, priceC, labA, false);
        txt(0, word, rox + rw, yb1, stateC, labA, true);
        const keyS = key ? "KEY" : null;
        let capL: [string, RGB][] = [], capR: [string, RGB][] = [];
        for (let pass = 0; pass < 3; pass++) {
          const useSuffix = pass === 0, usePct = pass < 2;
          let lw = 0;
          if (keyS) lw += tw(0, keyS) + 5 * kS;
          lw += tw(0, useSuffix ? volS + suffix : volS) + 4 * kS;
          if (relS) lw += tw(0, relS);
          let rwid = 0;
          if (verS) rwid += tw(0, verS);
          if (usePct && pctS) rwid += tw(0, pctS) + (verS ? 7 * kS : 0);
          if (lw + 10 * kS + rwid <= rw || pass === 2) {
            capL = []; capR = [];
            if (keyS) capL.push([keyS, priceC]);
            capL.push([useSuffix ? volS + suffix : volS, ik.inkMid]);
            if (relS) capL.push([relS, relC]);
            if (verS) capR.push([verS, verC]);
            if (usePct && pctS) capR.push([pctS, pctC]);
            break;
          }
        }
        let xL = rox;
        capL.forEach(([str, c], i) => { txt(0, str, xL, yb2, c, labA, false); xL += tw(0, str) + (i === 0 && keyS ? 5 : 4) * kS; });
        let xR = rox + rw;
        for (const [str, c] of capR) { txt(0, str, xR, yb2, c, labA, true); xR -= tw(0, str) + 7 * kS; }
        const ry = Sn(cy + 15 * kS);
        if (lv.flowReady) {
          const split = Sn(rox + rw * lv.buyPct);
          fill(d, rox, ry, split, 2, f.pal.dem, 0.95 * labA);
          fill(d, split, ry, rox + rw, 2, f.pal.sup, 0.95 * labA);
          vcol(d, rox + rw * 0.5, ry - 2, ry + 4, ik.ink, 0.6 * labA);
        } else fill(d, rox, ry, rox + rw, 1, ik.inkLo, 0.45 * labA);
      }
    }

    // one Frame per paint: under() builds it, draw() reuses it
    let lastFrame: Frame | null = null;
    const under = (d: Draw) => {
      const f = frameOf(d);
      lastFrame = f;
      if (!f) return;
      if (d.on("broken")) drawArchive(f);
      const xEnd = Math.min(f.bodyL, d.plotRight);
      for (const lv of f.levels) drawContext(f, lv, xEnd);
      if (f.bodyR - f.bodyL >= 20) for (const lv of f.levels) { drawProfile(f, lv, f.bodyL, f.bodyR); drawLive(f, lv, f.bodyL, f.bodyR); }
      for (const lv of f.levels) drawMarks(f, lv);
      if (!f.overlay && d.on("captions") && f.capW >= 60) drawCaptions(f);
    };
    const draw = (d: Draw) => {
      const f = lastFrame && lastFrame.d === d ? lastFrame : frameOf(d);
      if (!f) return;
      if (f.overlay && d.on("captions") && f.capW >= 60) drawCaptions(f);
    };

    // ------------------------------------------------------------ status / readout
    const nearest = (sn: Snap, supply: boolean) => {
      let best: Level | null = null, bd = Infinity;
      for (const lv of sn.shown) {
        if (!lv.isBand || lv.supply !== supply || !stageLv(lv)) continue;
        const dd = Math.abs(lv.prox - sn.price);
        if (dd < bd) { bd = dd; best = lv; }
      }
      return best;
    };
    const lvTone = (lv: Level): Tone => (lv.live !== LIVE_IDLE ? (lv.supply ? "strongBear" : "strongBull") : lv.supply ? "bear" : "bull");
    const status = (k: number): ReadItem[] => {
      const sn = snapAt(k);
      if (!sn) return [{ label: "Map", value: "building" }];
      const sup = nearest(sn, true), dem = nearest(sn, false);
      const out: ReadItem[] = [];
      out.push(sup ? { label: "Nearest supply", value: `${fmtC(sup.prox)} · ${stateWord(sup)}`, tone: lvTone(sup) } : { label: "Nearest supply", value: "none drawn" });
      out.push(dem ? { label: "Nearest demand", value: `${fmtC(dem.prox)} · ${stateWord(dem)}`, tone: lvTone(dem) } : { label: "Nearest demand", value: "none drawn" });
      const closest = [sup, dem].filter((x): x is Level => !!x).sort((a, b) => Math.abs(a.prox - sn.price) - Math.abs(b.prox - sn.price))[0];
      if (closest) {
        const v = flowVerdict(closest);
        out.push({ label: `Flow at ${fmtC(closest.prox)}`, value: closest.flowReady ? `${closest.buyPct >= 0.5 ? "BUY" : "SELL"} ${pctInt(Math.max(closest.buyPct, 1 - closest.buyPct))} · ${v ?? ""}`.trim() : "NO FOOTPRINT", tone: closest.flowReady && v === "ABSORBED" ? (closest.supply ? "bear" : "bull") : undefined });
      }
      const lvs = sn.shown.filter(stageLv);
      const bands = lvs.filter((l) => l.isBand).length;
      const broken = sn.flips.filter((z) => onStage(z.createdBar)).length;
      out.push({ label: "Map", value: `${lvs.length} levels · ${bands} zone${bands === 1 ? "" : "s"} · ${lvs.length - bands} pivot${lvs.length - bands === 1 ? "" : "s"}` });
      out.push({ label: "Live zones", value: `${sn.nSupplyShown} supply · ${sn.nDemandShown} demand · ${broken} broken` });
      return out;
    };
    const readout = (i: number): ReadItem[] => {
      const out: ReadItem[] = [];
      const acts = (actions[i] ?? []).filter((a) => zoneOnStage(a.id));
      if (acts.length) {
        for (const a of acts.slice(0, 3)) {
          const edge = a.supply ? a.bottom : a.top;
          const word = a.kind === "new" ? "NEW" : a.kind === "defended" ? (a.count > 1 ? `DEFENDED ${a.count}×` : "DEFENDED") : a.kind === "tested" ? "TESTED (consumed)" : "BROKEN";
          out.push({ label: kindOf(a.supply), value: `${fmtC(edge)} · ${word}`, tone: a.kind === "broken" ? "neutral" : a.supply ? "bear" : "bull" });
        }
      } else out.push({ label: "Zone action", value: "none on this bar" });
      const sn = snapAt(i);
      if (sn) {
        const sup = nearest(sn, true), dem = nearest(sn, false);
        if (sup) out.push({ label: "Supply at close", value: `${fmtC(sup.prox)} · ${stateWord(sup)}`, tone: lvTone(sup) });
        if (dem) out.push({ label: "Demand at close", value: `${fmtC(dem.prox)} · ${stateWord(dem)}`, tone: lvTone(dem) });
      } else if (core.counts[i]) {
        out.push({ label: "Live zones", value: `${Math.floor(core.counts[i] / 100)} supply · ${core.counts[i] % 100} demand` });
      }
      if (atr[i] > 0) out.push({ label: "ATR(200)", value: atr[i].toFixed(2) });
      return out;
    };

    return {
      events,
      under,
      draw,
      status: (k) => status(k),
      readout,
      priceExtent: (_i0, _i1, k) => {
        const sn = snapAt(k);
        if (!sn) return null;
        let lo = Infinity, hi = -Infinity;
        const reach = 3 * sn.atr;
        for (const lv of sn.shown) {
          if (!lv.isBand || !stageLv(lv)) continue;
          if (Math.abs(lv.prox - sn.price) > reach) continue;
          lo = Math.min(lo, lv.bottom); hi = Math.max(hi, lv.top);
        }
        return lo < hi ? [lo, hi] : null;
      },
      legend: [
        { label: "Supply zone", color: "#A33DFF", shape: "box" },
        { label: "Demand zone", color: "#009999", shape: "box" },
        { label: "KEY / live supply", color: "#FF00FF", shape: "line" },
        { label: "KEY / live demand", color: "#00FFFF", shape: "line" },
        { label: "Broken (archive)", color: "#7E7E88", shape: "dash" },
      ],
    };
  },
};
