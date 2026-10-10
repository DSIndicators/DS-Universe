import type { Draw, PaneView, ReadItem, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm, wall } from "../ta";
import {
  HZ, SZ, NB, runEngine, reach, invReach, latch, rankOf, reported, rankWord, cround, stackAt, tierAt, restingAt,
  RK_MAJOR, RK_SWING, VD_SWEPT, VD_RUN, VD_PENDING, TR_COLD, TR_COOL, TR_WARM, TR_HOT, T_COOL, T_WARM, T_HOT,
  type Pool,
} from "./_proliquidityhunter-engine";

/**
 * DS ProLiquidityHunter — web edition.
 * Source: DSProLiquidityHunter.cs, Build 2026-10-09 (the "Ledger" levels on price),
 * shipped defaults from ApplyDefaults(): Calculation CloseBar, Swing size 3.0,
 * Horizon 60, Verdict on the next close ON, Report major pools only ON, Pool bands /
 * Taken pools / Cold pools / Range shadow ON, Price line width 2, Pool tags / Odds
 * zones / Reach bracket ON, Readout / Context / Track / Heat strips / Strip chevrons
 * ON, Chevrons on price ON (history 750 bars, source letter H), Levels on price 2 per
 * side from LOCAL up, Color theme Moonlight (its dark set on #000, its light set on
 * #E2E2E2, picked by the same luminance test as DsLhInk.Ground()).
 *
 * PORTED (see _proliquidityhunter-engine.ts, line for line from Engine()):
 *  · Pools: a swing extreme becomes a pool when price reverses Swing size x ATR from
 *    it (ATR = the tool's own 2xHorizon average, SMA-seeded then EMA); extremes within
 *    0.25 ATR of a resting pool stack into it (x2, x3 ...). Rank = how long the extreme
 *    had stood when price left it: LOCAL < 1 horizon, SWING 1-6, MAJOR >= 6. 256 max,
 *    the farthest from price dropped.
 *  · Odds: the yardstick (sigma of the next horizon, from the per-bar variance, scaled
 *    by the learned quarter-hour ratio rho), the record (forward excursions in
 *    yardsticks, 41 bins, shrunk to the no-drift prior with N0 = 200), Reach() by
 *    linear interpolation, the latched tiers COLD / COOL 5% / WARM 25% / HOT 60% with
 *    exits at 3 / 18 / 50%, and the TAKEN track record (each bar a pool spent in a
 *    tier, taken within the horizon or not).
 *  · Take = first trade through the level; verdict on the next close: back inside =
 *    SWEPT, beyond = RUN; the top-ranked pool speaks for a bar that takes several.
 *  · Panel: line on close over the range shadow; bands from the extreme's bar, painted
 *    run by run in the tier they held, heavier for higher rank, the stacked "near"
 *    hairline, a stop at the take (bright 2 px for a sweep, quiet for a run), taken
 *    bands from their last approach; ABOVE / BELOW heat strips with chevrons (sweeps)
 *    and dots (runs); reach bracket; header readout (HUNTING / IN REACH / NO POOL IN
 *    REACH / TAKEN ... PENDING / SWEPT / RUN / WARMING UP) with ABOVE, BELOW, REACH and
 *    TAKEN chips and AS OF when scrolled back; "n pools above/below the map". The map
 *    keeps its own scale: visible range plus the reach, fitted on round prices and
 *    held until price leaves it (HoldRange/GridStep/Reserves). Scrolled back, the
 *    panel shows the pools as they stood on the last bar on screen.
 *  · Price panel: the Ledger levels — the top-odds resting pools per side (2, odds >=
 *    5%, 0.12-reach separation), each a line from the wick that left it, every run in
 *    the heat it held (dotted cold, faint cool, solid warm, 2 px hot, a second
 *    hairline for MAJOR), a square at the wick, stubs to stacked extremes, a flag at
 *    the axis; and the chevrons: every reported (MAJOR) sweep, a double chevron beyond
 *    the wick that took it with the letter H and the pool's level as a hairline back
 *    to the bar that left it.
 *
 * DEVIATIONS
 *  1. History: the replay file holds ~3 sessions before the replay day, so the
 *     record, the time-of-day ratio and the track record are learned from those bars
 *     only (the tool learns from whatever the chart loads; the README asks for 5+
 *     days). Odds therefore sit closer to the no-drift prior than on a long chart.
 *  2. Right margin: the study asks DS Replay for 250 px of air right of the newest bar
 *     (Tom's charts carry ~300 px; 250 lets a showcase example fit the whole stage at
 *     ~4 px a bar on a 1,600 px screen while the odds ladder (90 px) still has room;
 *     the engine caps it at a third of the plot). Every
 *     room test is the tool's own: the Ledger's odds scale (mode 1) or scale and
 *     caliper (mode 2), the odds ladder (90 px), the odds zones (40 / 60 px) and the
 *     tag table all switch on and off exactly as the .cs measures them, so a desktop
 *     chart shows the scale, ladder, zone names and tag table, and a phone the narrow
 *     forms.
 *  3. Narrow forms only (where the tool would lay its flag or tag table over the
 *     newest bars): the PRICE goes into the axis as a value tag in the pool's colour.
 *     The Ledger flag then keeps MAJOR and the odds; the panel tags keep the heat
 *     stripe and the odds (no MAJOR word, no x2/x3 stack count). Same pools, same
 *     order (hottest first), same colours.
 *  4. The 256-pool overflow: a dropped pool is shown until the bar that dropped it
 *     (the tool's scrolled-back view forgets it at once — that would repaint here).
 *     The tool caps a pool's tier history at 512 runs; not needed on these sessions.
 *  5. Fonts are the site's mono face; widths follow the tool's own layout formulas.
 *  7. Chart scale: the replay keeps the WARM/HOT Ledger levels and any visible
 *     chevron in the price scale (on NinjaTrader the trader's own scale decides;
 *     the tool's drawing objects do not autoscale).
 *  6. Events are the tool's verdicts (all ranks, as on its strips), its "Pool turns
 *     hot" alert condition, and the birth of SWING and MAJOR pools; LOCAL pools are
 *     drawn but their birth is not narrated (too frequent to read).
 *  8. Example hygiene (web showcase): pools born before the first shown bar
 *     (s.replayFrom) are not drawn (bands, Ledger levels, tags, ladder, chevrons), not
 *     narrated and not quoted: the header, the ABOVE / BELOW chips, the heat strips, the
 *     HUNTING pick and the status read the engine's per-bar odds over the shown pools
 *     only (view G — the tool's own rules, order and tie-breaks), and a verdict or
 *     PENDING of a hidden pool is not shown. The TAKEN track-record chip is not shown,
 *     since it counts the hidden history. The engine's computation is unchanged.
 *  9. Display at showcase widths: the odds ladder skips a name (5 / 25 / 60 / 100%)
 *     that would run into its neighbour, the odds-zone names keep off the ladder's
 *     name row, and the header (readout and chips) keeps clear of the pane title DS
 *     Replay prints at the panel's left — on a phone-width panel the readout then
 *     drops to the status line under the chart.
 */

// ---------------------------------------------------------------- palette (Moonlight)
type RGB = [number, number, number];
const MOON_DARK = { buy: [84, 132, 232] as RGB, sell: [128, 104, 224] as RGB, warm: [166, 180, 255] as RGB, hot: [156, 236, 255] as RGB, neutral: [116, 124, 144] as RGB };
const MOON_LIGHT = { buy: [58, 112, 206] as RGB, sell: [112, 92, 196] as RGB, warm: [36, 60, 164] as RGB, hot: [12, 18, 64] as RGB, neutral: [70, 78, 96] as RGB };
const INK_DARK: RGB = [214, 219, 230], INK_LIGHT: RGB = [41, 46, 56];
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`;
const hexRgb = (h: string): RGB => { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = (c: RGB) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

type Pal = { light: boolean; ground: RGB; buy: RGB; sell: RGB; warm: RGB; hot: RGB; neutral: RGB; ink: RGB };
function palette(d: Draw): Pal {
  const ground = hexRgb(d.th.bg);
  const light = lum(ground) > 0.45;
  const p = light ? MOON_LIGHT : MOON_DARK;
  return { light, ground, ...p, ink: light ? INK_LIGHT : INK_DARK };
}
const side = (P: Pal, s: number) => (s > 0 ? P.buy : P.sell);
const heatOfTier = (P: Pal, s: number, t: number) => (t >= TR_HOT ? P.hot : t === TR_WARM ? P.warm : side(P, s));
const heatOfPct = (P: Pal, s: number, pct: number) => (pct >= T_HOT * 100 ? P.hot : pct >= T_WARM * 100 ? P.warm : side(P, s));
const roleHue = (P: Pal, s: number, odds: number) => (odds >= 0.6 ? P.hot : odds >= 0.25 ? P.warm : side(P, s));

// ---------------------------------------------------------------- formats
const fmtNT = (p: number, tick: number) => (Number.isFinite(p) ? (Math.round(p / tick) * tick).toFixed(2) : "--"); // FormatPrice(RoundToTickSize)
const fmtUS = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const oddsWord = (od: number) => { let pct = cround(od * 100); if (pct < 1) return "<1%"; if (pct > 99) pct = 99; return `${pct}%`; };
const pctOf = (hits: number, expo: number) => (expo <= 0 ? "--" : `${cround((100 * hits) / expo)}%`);
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const UP = "▲", DN = "▼", DOT = "  · ";

// ---------------------------------------------------------------- panel layout constants (the tool's)
const HEAD_ROW = 15, HEAD_AIR = 3, RIB_H = 6, RIB_GAP = 2, FOOT_AIR = 2;
const HEAD_PX = HEAD_ROW + HEAD_AIR + RIB_H + RIB_GAP, FOOT_PX = RIB_GAP + RIB_H + FOOT_AIR;
const HEAD_T = 0.24, FOOT_T = 0.10, REACH_FIT = 1.0;
const HOLD_MARGIN = 0.06, HOLD_EXTEND = 0.14, HOLD_LOOSE = 0.70, HOLD_STEPS = 24.0;
const DRAW_TAKEN = 400, DRAW_TAKEN_FAR = 220, MAX_LIVE = 256, TAG_MAX = 16, TAG_H = 13;
const MARK_HISTORY = 750;

function gridStep(span: number, tick: number) {
  const raw = span / HOLD_STEPS;
  if (!(raw > 0) || !Number.isFinite(raw)) return tick > 0 ? tick : 1;
  const k = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / k;
  const g = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * k;
  const t = Math.ceil(g / tick - 1e-9);
  return (t < 1 ? 1 : t) * tick;
}

export const study: StudyDef = {
  slug: "proliquidityhunter", rightMargin: 250,
  name: "DS ProLiquidityHunter",
  about: "Every swing high and low price left behind as a pool, heated by the measured odds price reaches it within 60 bars; SWEPT or RUN on the next close after a take.",
  panes: [{ id: "lh", title: "DS ProLiquidityHunter", weight: 0.6, digits: 2 }],
  layers: [
    { id: "levels", label: "Levels on price", on: true, hint: "The two resting pools with the top odds on each side, drawn from the wick that left them in the heat they held, with a flag at the axis." },
    { id: "chev", label: "Chevrons on price", on: true, hint: "A double chevron and the letter H beyond the wick that swept a MAJOR pool, with the pool's level back to the bar that left it." },
    { id: "taken", label: "Taken pools", on: true, hint: "Keep the bands of pools already taken, each ending on a stop: bright for a sweep, quiet for a run." },
  ],
  run(s) {
    const E = runEngine(s);
    const n = s.n, tick = s.tick, W = NB + 1;
    const pools = E.pools;
    const byId = (id: number) => (id >= 0 ? pools[id] : null);
    const fp = (p: number) => fmtNT(p, tick);

    // odds of a resting pool on bar `at` (the tool's TakeIn: the table, the close and the reach of that bar)
    const oddsAt = (p: Pool, at: number) => {
      const dist = p.side > 0 ? p.level - s.c[at] : s.c[at] - p.level;
      const u = E.unit[at];
      return reach(p.side > 0 ? E.survUp : E.survDn, at * W, u > 0 ? dist / u : Number.POSITIVE_INFINITY);
    };

    // ------------------------------------------------------------ example hygiene (DEVIATIONS 8): the shown view
    // Pools born before the first shown bar are not drawn, narrated or quoted. The engine above is untouched;
    // G is its per-bar output re-read over the shown pools only (same rules, same order, same tie-breaks).
    const rf = s.replayFrom;
    const vis = (p: Pool) => p.born >= rf;
    const shownPools = pools.filter(vis);
    const G = {
      oddsUp: new Float64Array(n), oddsDn: new Float64Array(n),
      poolUp: new Float64Array(n).fill(NaN), poolDn: new Float64Array(n).fill(NaN),
      hu: new Int32Array(n).fill(-1), hd: new Int32Array(n).fill(-1),
      ev: Int8Array.from(E.ev), evRank: Int8Array.from(E.evRank), evPx: Float64Array.from(E.evPx), evPool: Int32Array.from(E.evPool),
      pend: Int32Array.from(E.pend),
    };
    for (let b = 0; b < n; b++) {
      const ep = E.evPool[b];
      if (ep >= 0 && !vis(pools[ep])) { G.ev[b] = 0; G.evRank[b] = 0; G.evPx[b] = NaN; G.evPool[b] = -1; }
      if (E.pend[b] >= 0 && !vis(pools[E.pend[b]])) G.pend[b] = -1;
    }
    for (let b = rf; b < n; b++) {
      let bu = 0.0, bd = 0.0, pu = NaN, pd = NaN, du = 0.0, dn = 0.0, hu = -1, hd = -1;
      const cl = s.c[b];
      for (const p of shownPools) {
        if (p.born > b) break;
        if (!restingAt(p, b)) continue;
        const dist = p.side > 0 ? p.level - cl : cl - p.level;
        const od = oddsAt(p, b);
        if (p.side > 0) { if (Number.isNaN(pu) || od > bu || (od === bu && dist < du)) { bu = od; pu = p.level; du = dist; hu = p.id; } }
        else if (Number.isNaN(pd) || od > bd || (od === bd && dist < dn)) { bd = od; pd = p.level; dn = dist; hd = p.id; }
      }
      G.oddsUp[b] = 100.0 * bu; G.oddsDn[b] = 100.0 * bd; G.poolUp[b] = pu; G.poolDn[b] = pd; G.hu[b] = hu; G.hd[b] = hd;
    }

    // ------------------------------------------------------------ events
    const events: StudyEvent[] = [];
    const from = rf;
    const sideWord = (sd: number) => (sd > 0 ? "buy-side" : "sell-side");
    for (const p of shownPools) {
      const rk = p.bornRank;
      if (rk < RK_SWING) continue;
      const od = oddsAt(p, p.born);
      const st = stackAt(p, p.born);
      events.push({
        i: p.born, price: p.level, tone: p.side > 0 ? "bull" : "bear", weight: rk >= RK_MAJOR ? 2 : 1,
        title: `${p.side > 0 ? "BUY-SIDE" : "SELL-SIDE"} POOL · ${rankWord(rk)}`,
        text: `${hhmm(s, p.born)} — price reversed ${SZ} average ranges off the ${hhmm(s, p.anchor)} ${p.side > 0 ? "high" : "low"} at ${fmtUS(p.level)}, so it is mapped as a ${sideWord(p.side)} pool; it ranks ${rankWord(rk)} because ${st.dom > 6 * HZ ? `no bar in the ${6 * HZ} before it traded ${p.side > 0 ? "higher" : "lower"}` : `the extreme had stood ${st.dom} bars`}. Odds of a trade there within ${HZ} bars: ${oddsWord(od)}.`,
      });
    }
    for (let b = from; b < n; b++) {
      const e = G.ev[b];
      if (!e) continue;
      const p = byId(G.evPool[b])!;
      const rk = G.evRank[b];
      const swept = e === 1 || e === -1;
      const bull = e > 0;
      events.push({
        i: b, price: p.level, tone: bull ? "bull" : "bear",
        weight: swept && reported(rk) ? 3 : rk >= RK_SWING ? 2 : 1,
        title: `${swept ? "SWEPT" : "RUN"} ${bull ? UP : DN} · ${rankWord(rk)}`,
        text: `${hhmm(s, b)} — the ${hhmm(s, p.take)} bar traded through the ${rankWord(rk)} ${sideWord(p.side)} pool at ${fmtUS(p.level)} (the ${hhmm(s, p.anchor)} ${p.side > 0 ? "high" : "low"}), and this close is ${swept ? `back ${p.side > 0 ? "below" : "above"} it: SWEPT` : `still ${p.side > 0 ? "above" : "below"} it: RUN`}.${swept && reported(rk) ? " A MAJOR sweep gets the chevron on price." : ""}`,
      });
    }
    for (const h of E.hot) {
      if (h.bar < from || !vis(h.pool)) continue;
      const p = h.pool;
      events.push({
        i: h.bar, price: p.level, tone: p.side > 0 ? "strongBull" : "strongBear", weight: 2,
        title: "POOL TURNS HOT",
        text: `${hhmm(s, h.bar)} — the ${rankWord(rankOf(stackAt(p, h.bar).dom))} ${sideWord(p.side)} pool at ${fmtUS(p.level)} reads ${h.pct}% to be reached within ${HZ} bars: its distance, ${fmtUS(Math.abs(p.level - s.c[h.bar]))} pts, measured in this chart's own one-hour reach of ±${fmtUS(E.unit[h.bar])}.`,
      });
    }
    events.sort((a, b) => a.i - b.i || (b.weight ?? 1) - (a.weight ?? 1));

    // ------------------------------------------------------------ the header read (RenderHeader), for bar `bar` with the cursor at k
    function readoutAt(bar: number, k: number): { txt: string; tone: Tone; pct?: number; side?: number } {
      const ev = G.ev[bar];
      if (ev !== 0) {
        const bull = ev > 0, swept = ev === 1 || ev === -1;
        return { txt: `${swept ? "SWEPT" : "RUN"}  ${bull ? UP : DN} ${fp(G.evPx[bar])}${DOT}${rankWord(G.evRank[bar])}`, tone: bull ? "bull" : "bear" };
      }
      if (bar < 2 * HZ) { const left = 2 * HZ - bar; return { txt: `WARMING UP${DOT}${left}${left === 1 ? " bar to go" : " bars to go"}`, tone: "neutral" }; }
      const pend = byId(G.pend[bar]);
      if (pend) return { txt: `TAKEN  ${pend.side > 0 ? UP : DN} ${fp(pend.level)}${DOT}PENDING`, tone: "neutral" };
      const ou = G.oddsUp[bar], od = G.oddsDn[bar];
      const upSide = ou >= od;
      const m = upSide ? ou : od, lv = upSide ? G.poolUp[bar] : G.poolDn[bar];
      if (m >= T_COOL * 100 && Number.isFinite(lv)) {
        return {
          txt: `${m >= T_WARM * 100 ? "HUNTING" : "IN REACH"}  ${upSide ? UP : DN} ${fp(lv)}${DOT}${cround(Math.min(99, m))}%`,
          tone: m >= T_HOT * 100 ? (upSide ? "strongBull" : "strongBear") : m >= T_WARM * 100 ? (upSide ? "bull" : "bear") : "neutral",
          pct: m, side: upSide ? 1 : -1,
        };
      }
      void k;
      return { txt: "NO POOL IN REACH", tone: "neutral" };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const trackText = (k: number) => {
      let t = "";
      const ex = (tr: number) => E.expo[k * 4 + tr], hi = (tr: number) => E.hits[k * 4 + tr];
      if (ex(TR_HOT) >= 60) t += `  HOT ${pctOf(hi(TR_HOT), ex(TR_HOT))}`;
      if (ex(TR_WARM) >= 60) t += `  WARM ${pctOf(hi(TR_WARM), ex(TR_WARM))}`;
      if (ex(TR_COOL) >= 60) t += `  COOL ${pctOf(hi(TR_COOL), ex(TR_COOL))}`;
      return t;
    };

    // ------------------------------------------------------------ the Ledger picks on bar k (UpdateRails)
    type Pick = { p: Pool; odds: number; tier: number; major: boolean; hunt: boolean };
    const pickCache = new Map<number, Pick[]>();
    function railsAt(k: number): Pick[] {
      const hit = pickCache.get(k);
      if (hit) return hit;
      const want = 2, PICK_K = 24;
      let hunt: Pool | null = null;
      const quiet = k < 2 * HZ || G.pend[k] >= 0 || G.ev[k] !== 0;
      if (!quiet) {
        const upSide = G.oddsUp[k] >= G.oddsDn[k];
        const hp = byId(upSide ? G.hu[k] : G.hd[k]);
        const m = upSide ? G.oddsUp[k] : G.oddsDn[k];
        if (hp && m >= T_WARM * 100) hunt = hp;
      }
      const cu: { p: Pool; o: number }[] = [], cd: { p: Pool; o: number }[] = [];
      const lc = s.c[k];
      for (const p of shownPools) {
        if (!restingAt(p, k)) continue;
        const o = oddsAt(p, k);
        if (o < T_COOL) continue; // SmallestOnPrice = Local
        const cand = p.side > 0 ? cu : cd;
        let at = cand.length;
        while (at > 0 && (o > cand[at - 1].o || (o === cand[at - 1].o && Math.abs(p.level - lc) < Math.abs(cand[at - 1].p.level - lc)))) at--;
        if (at >= PICK_K) continue;
        cand.splice(at, 0, { p, o });
        if (cand.length > PICK_K) cand.pop();
      }
      const sep = 0.12 * E.unit[k];
      const up: { p: Pool; o: number }[] = [], dn: { p: Pool; o: number }[] = [];
      for (const c of cu) { if (up.length >= want) break; if (up.every((q) => Math.abs(q.p.level - c.p.level) >= sep)) up.push(c); }
      for (const c of cd) {
        if (dn.length >= want) break;
        if (dn.every((q) => Math.abs(q.p.level - c.p.level) >= sep) && up.every((q) => Math.abs(q.p.level - c.p.level) >= sep)) dn.push(c);
      }
      const mk = (c: { p: Pool; o: number }): Pick => ({ p: c.p, odds: c.o, tier: Math.max(0, tierAt(c.p, k)), major: rankOf(stackAt(c.p, k).dom) >= RK_MAJOR, hunt: c.p === hunt });
      const out = [...up.map(mk), ...dn.map(mk)];
      out.sort((a, b) => Number(a.hunt) - Number(b.hunt)); // the hunted level is drawn last (on top)
      if (pickCache.size > 4000) pickCache.clear();
      pickCache.set(k, out);
      return out;
    }

    // ------------------------------------------------------------ panel scale (FrameRange + HoldRange + Reserves)
    let holdLo = NaN, holdHi = NaN, lastPh = 200, frLo = NaN, frHi = NaN;
    function frame(i0: number, to: number) {
      let mn = Infinity, mx = -Infinity;
      for (let i = i0; i <= to; i++) { if (s.h[i] > mx) mx = s.h[i]; if (s.l[i] < mn) mn = s.l[i]; }
      if (!(mx >= mn)) return null;
      const u = E.unit[to], c0 = s.c[to];
      if (u > 0) { if (c0 + REACH_FIT * u > mx) mx = c0 + REACH_FIT * u; if (c0 - REACH_FIT * u < mn) mn = c0 - REACH_FIT * u; }
      let span = mx - mn;
      if (!(span > 4 * tick)) { mx += 2 * tick; mn -= 2 * tick; span = mx - mn; }
      const sp = span;
      let have = Number.isFinite(holdLo) && Number.isFinite(holdHi) && holdHi > holdLo;
      if (have && sp >= HOLD_LOOSE * (holdHi - holdLo)) {
        const g = gridStep(holdHi - holdLo, tick), eps = g * 1e-6;
        if (mn < holdLo - eps) holdLo = Math.floor((mn - HOLD_EXTEND * sp) / g) * g;
        if (mx > holdHi + eps) holdHi = Math.ceil((mx + HOLD_EXTEND * sp) / g) * g;
        have = sp >= HOLD_LOOSE * (holdHi - holdLo);
      } else have = false;
      if (!have) {
        const g = gridStep(sp * (1 + 2 * HOLD_MARGIN), tick);
        holdLo = Math.floor((mn - HOLD_MARGIN * sp) / g) * g;
        holdHi = Math.ceil((mx + HOLD_MARGIN * sp) / g) * g;
      }
      return [holdLo, holdHi] as [number, number];
    }
    function reserves(ph: number, span: number) {
      const headT = HEAD_T * HEAD_PX / (HEAD_PX - HEAD_ROW + 15), tot = 1 + headT + FOOT_T;
      const hPx = Math.min(HEAD_PX, (ph * headT) / tot), fPx = Math.min(FOOT_PX, (ph * FOOT_T) / tot);
      const body = ph - hPx - fPx;
      if (!(body > 1)) return { headV: span * headT, footV: span * FOOT_T };
      return { headV: hPx * (span / body), footV: fPx * (span / body) };
    }

    // ------------------------------------------------------------ the panel (OnRender on its own panel)
    function drawPanel(d: Draw) {
      const pv = d.pane("lh");
      if (!pv) return;
      const P = palette(d);
      const at = Math.min(d.i1, d.k), bFrom = d.i0;
      if (at < bFrom || at < 0) return;
      lastPh = Math.max(20, pv.bottom - pv.top - 12);
      if (!Number.isFinite(frLo)) { const f = frame(bFrom, at); if (!f) return; [frLo, frHi] = f; }
      const ctx = d.ctx;
      const x1 = 2, x2 = d.plotRight - 2, slotW = d.bw;
      const paintW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      const X = (i: number) => d.x(i);
      const bodyTop = Math.round(pv.y(frHi)), bodyBot = Math.round(pv.y(frLo));
      const fits = bodyBot - bodyTop >= 24;
      const PYraw = (v: number) => pv.y(v);
      const PY = (v: number) => { const y = pv.y(v); return y > bodyTop ? (y > bodyBot ? bodyBot : y) : bodyTop; };
      const fill = (x: number, y: number, w: number, h: number, c: string) => { if (w > 0 && h > 0) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); } };
      const liveEdge = at >= d.k;
      const c0 = s.c[at], u = E.unit[at];

      // ---- the draw list (CopyPools / TakeIn)
      type DP = { p: Pool; end: number; rest: boolean; odds: number; tier: number; near: number; dom: number; touch: number; verdict: number };
      const list: DP[] = [];
      const resting: Pool[] = [];
      for (const p of shownPools) if (restingAt(p, at)) resting.push(p);
      resting.sort((a, b) => b.born - a.born);
      for (const p of resting.slice(0, MAX_LIVE)) {
        const st = stackAt(p, at), od = oddsAt(p, at), t = tierAt(p, at);
        list.push({ p, end: p.take > at ? p.take : -1, rest: true, odds: od, tier: t >= 0 ? t : latch(TR_COLD, od), near: st.near, dom: st.dom, touch: st.touch, verdict: -1 });
      }
      if (d.on("taken")) {
        const taken = shownPools.filter((p) => p.take >= 0 && p.take <= at && p.take >= bFrom).sort((a, b) => b.deadSeq - a.deadSeq);
        const room = slotW >= 2 ? DRAW_TAKEN : DRAW_TAKEN_FAR;
        for (const p of taken.slice(0, room)) {
          const st = stackAt(p, at);
          const verdict = p.take === at ? VD_PENDING : p.verdictBar >= 0 && p.verdictBar <= at ? p.verdict : VD_PENDING;
          list.push({ p, end: p.take, rest: false, odds: p.odds, tier: Math.max(0, tierAt(p, at)), near: st.near, dom: st.dom, touch: st.touch, verdict });
        }
      }

      // ---- margin (PrepMargin + TagCells)
      const xLast = X(at);
      let margEdge = xLast + slotW * 0.5;
      const margOn = fits && !(margEdge >= x2 - 40);
      if (margEdge < x1) margEdge = x1;
      const inBody = (q: DP) => { const y = PYraw(q.p.level); return y >= bodyTop + 1 && y <= bodyBot - 1; };
      let tagN = 0, tagWd = 0, crowd = false, anyMajor = false, anyTouch = false;
      {
        const cellY: number[] = [];
        let widest = 0;
        for (const q of list) {
          if (!q.rest || !inBody(q)) continue;
          const y = PYraw(q.p.level);
          if (!crowd && cellY.some((cy) => Math.abs(cy - y) < TAG_H + 1)) crowd = true;
          cellY.push(y); tagN++;
          if (rankOf(q.dom) >= RK_MAJOR) anyMajor = true;
          if (q.touch > 1) anyTouch = true;
          widest = Math.max(widest, Math.abs(q.p.level));
        }
        if (tagN > 0) tagWd = 7 + (anyMajor ? 37 : 0) + 23 + 6 + (fp(widest).length * 6.2 + 3) + (anyTouch ? 19 : 0) + 3;
      }
      const tagEdge = xLast + Math.max(6, slotW * 1.5) + 8;
      // the tool's own tag table when it clears the newest bar; otherwise the axis form (DEVIATIONS 3)
      const fullTags = tagN > 0 && x2 - tagWd >= tagEdge;
      let tagColX = tagN > 0 && x2 - tagWd >= x1 ? x2 - tagWd : x2;
      if (tagColX < x2 && crowd) { const xB = tagColX - tagWd - 5; if (xB >= tagEdge && xB >= x1) tagColX = xB; }
      const ladX0 = Math.floor(xLast + Math.max(6, slotW * 1.5)) + 13.5;
      const ladLen = tagColX - 10 - ladX0;
      const ladderOn = margOn && ladLen >= 90;

      if (fits) {
        // ---- odds zones (RenderZones)
        if (margOn && u > 0) {
          const x0 = margEdge, wz = x2 - x0;
          if (wz >= 60) {
            const zu = [T_COOL, T_WARM, T_HOT].map((p) => invReach(E.survUp, at * W, p)), zd = [T_COOL, T_WARM, T_HOT].map((p) => invReach(E.survDn, at * W, p));
            const yC = PY(c0);
            for (let z = 0; z < 3; z++) {
              if (Number.isNaN(zu[z]) || Number.isNaN(zd[z])) continue;
              const yU = PY(c0 + zu[z] * u), yD = PY(c0 - zd[z] * u);
              if (yC > yU) fill(x0, yU, wz, yC - yU, rgba(P.buy, 0.05));
              if (yD > yC) fill(x0, yC, wz, yD - yC, rgba(P.sell, 0.05));
            }
            for (let z = 2; z >= 0; z--) for (const sg of [1, -1]) {
              const zz = sg > 0 ? zu[z] : zd[z];
              if (Number.isNaN(zz)) continue;
              const y = Math.floor(PYraw(c0 + sg * zz * u));
              if (y <= bodyTop + 1 || y >= bodyBot - 1) continue;
              fill(x0, y, wz, 1, rgba(sg > 0 ? P.buy : P.sell, 0.3));
            }
            // the zone names (5% / 25% / 60%), 30 px left of the tag column, 12 px apart per side
            const lx = tagColX - 30;
            let lastUp = NaN, lastDn = NaN;
            for (let z = 2; z >= 0; z--) for (const sg of [1, -1]) {
              const zz = sg > 0 ? zu[z] : zd[z];
              if (Number.isNaN(zz)) continue;
              const y = Math.floor(PYraw(c0 + sg * zz * u));
              if (y <= bodyTop + 1 || y >= bodyBot - 1) continue;
              const ty = sg > 0 ? y - 12 : y + 1, was = sg > 0 ? lastUp : lastDn;
              if (lx > x0 + 4 && ty >= bodyTop + (ladderOn ? 12 : 0) && ty + 12 <= bodyBot && (Number.isNaN(was) || Math.abs(was - ty) >= 12)) {
                d.text(z === 0 ? "5%" : z === 1 ? "25%" : "60%", lx, ty + 6, { size: 8, weight: 600, color: rgba(sg > 0 ? P.buy : P.sell, 0.85) });
                if (sg > 0) lastUp = ty; else lastDn = ty;
              }
            }
            if (yC > bodyTop && yC < bodyBot) fill(x0, yC, wz, 1, rgba(P.ink, 0.35));
          }
        }

        // ---- range shadow (RenderShadow)
        const span = Math.abs(X(at) - X(bFrom));
        const cnt = at - bFrom + 1;
        const stride = span > 1 && cnt > 2 * span ? Math.ceil(cnt / (2 * span)) : 1;
        if (cnt >= 2) {
          ctx.beginPath();
          let open = false;
          for (let k = 0; k < cnt; k += stride) {
            const e = Math.min(cnt - 1, k + stride - 1);
            let hi = -Infinity; for (let q = k; q <= e; q++) hi = Math.max(hi, s.h[bFrom + q]);
            const x = X(bFrom + k), y = PY(hi);
            if (!open) { ctx.moveTo(x, y); open = true; } else ctx.lineTo(x, y);
          }
          for (let k = Math.floor((cnt - 1) / stride) * stride; k >= 0; k -= stride) {
            const e = Math.min(cnt - 1, k + stride - 1);
            let lo = Infinity; for (let q = k; q <= e; q++) lo = Math.min(lo, s.l[bFrom + q]);
            ctx.lineTo(X(bFrom + k), PY(lo));
          }
          ctx.closePath(); ctx.fillStyle = rgba(P.ink, 0.075); ctx.fill();
        }

        // ---- pool bands (RenderBands / PaintPool / BandBox)
        const lastBar = at, half = slotW * 0.5, minSeg = slotW >= 2 ? 1 : 4;
        const sc = (bodyBot - bodyTop) / 220;
        const boxes = list.map((q) => {
          const p = q.p;
          let xs = X(p.anchor);
          let xe = q.end >= 0 && q.end <= lastBar ? X(q.end) : x2;
          if (xs < x1) xs = x1;
          if (xe > x2) xe = x2;
          if (xe - xs < 1) return null;
          const a = PYraw(p.side > 0 ? p.level + p.depth : p.level - p.depth), b = PYraw(q.near), l = PYraw(p.level);
          const yL = Math.floor(l);
          let yT = Math.floor(Math.min(a, b)), yB = Math.floor(Math.max(a, b)) + 1;
          const rk = rankOf(q.dom);
          let minH = rk >= RK_MAJOR ? 18 : rk === RK_SWING ? 13 : 8;
          if (sc < 1) minH = Math.max(3, Math.round(minH * Math.max(0.5, sc)));
          if (yB - yT < minH) { if (p.side > 0) yT = yB - minH; else yB = yT + minH; }
          if (yB <= bodyTop || yT >= bodyBot) return null;
          if (yT < bodyTop) yT = bodyTop;
          if (yB > bodyBot) yB = bodyBot;
          return yB > yT ? { xs, xe, yT, yB, yL } : null;
        });
        for (let pass = 0; pass < 2; pass++) {
          for (let i = list.length - 1; i >= 0; i--) {
            const bx = boxes[i];
            if (!bx) continue;
            const q = list[i], p = q.p, runs = p.runs, nr = runs.length / 2;
            if (nr <= 0) continue;
            let { xs } = bx;
            const { xe, yT, yB, yL } = bx;
            const restingNow = q.end < 0 || q.end > lastBar;
            const rk = rankOf(q.dom);
            const lw = rk >= RK_MAJOR ? 2 : 1;
            const ly = p.side > 0 ? yL - lw + 1 : yL;
            const lineOn = ly >= bodyTop && ly + lw <= bodyBot + 0.5;
            let r0 = 0, stub = false;
            if (!restingNow) {
              for (let r = nr - 1; r >= 0; r--) if (runs[2 * r + 1] === TR_COLD) { r0 = r + 1; break; }
              if (r0 >= nr) { stub = true; r0 = nr - 1; }
              const xa = stub ? xe - Math.max(8, slotW * 3) : r0 > 0 ? X(runs[2 * r0]) - half : xs;
              if (xa > xs) xs = xa;
              if (xe - xs < 1) continue;
              if (slotW < 2 && xe - xs < 3) continue;
            }
            let segX = xs, segTier = stub ? TR_COOL : runs[2 * r0 + 1];
            if (!stub && runs[2 * r0] > lastBar) segTier = q.tier;
            for (let r = r0 + 1; r <= nr; r++) {
              let nx: number, nt = 0;
              if (r < nr) {
                const bar = runs[2 * r]; nt = runs[2 * r + 1];
                if (bar > lastBar) { nx = xe; r = nr; } else nx = X(bar) - half;
                if (nx > xe) nx = xe;
                if (nx < segX) nx = segX;
                if (r < nr && nx <= xs) { segTier = nt; continue; }
                if (r < nr && nx - segX < minSeg) { segTier = nt; continue; }
              } else nx = xe;
              if (nx > segX) {
                const cold = segTier === TR_COLD;
                const show = !cold || restingNow; // ShowColdPools = true
                if (pass === 0) {
                  if (show) {
                    const hue = heatOfTier(P, p.side, segTier);
                    const fa = segTier >= TR_HOT ? 0.62 : segTier === TR_WARM ? 0.42 : segTier === TR_COOL ? 0.2 : 0.07;
                    const hh = yB - yT;
                    if (hh >= 6 && slotW >= 2) {
                      const mid = Math.floor(yT + hh * 0.5), nearLow = p.side > 0;
                      fill(segX, nearLow ? mid : yT, nx - segX, nearLow ? yB - mid : mid - yT, rgba(hue, fa));
                      fill(segX, nearLow ? yT : mid, nx - segX, nearLow ? mid - yT : yB - mid, rgba(hue, fa * 0.45));
                    } else fill(segX, yT, nx - segX, hh, rgba(hue, fa));
                  }
                } else if (lineOn) {
                  const la = segTier === TR_HOT ? 0.98 : segTier === TR_WARM ? 0.8 : segTier === TR_COOL ? 0.52 : restingNow ? 0.3 : 0.15;
                  fill(segX, ly, nx - segX, lw, rgba(heatOfTier(P, p.side, segTier), la));
                }
              }
              segX = nx; segTier = nt;
            }
            if (pass === 0) continue;
            if (q.touch > 1 && (restingNow || q.tier > TR_COLD)) {
              const yN = Math.floor(PYraw(q.near));
              if (yN >= bodyTop && yN <= bodyBot - 1 && Math.abs(yN - yL) >= 2) fill(xs, yN, xe - xs, 1, rgba(side(P, p.side), 0.3));
            }
            if (!restingNow && q.end <= lastBar && xe > xs) {
              const swept = q.verdict === VD_SWEPT, sw = swept ? 2 : 1;
              const t0 = Math.max(bodyTop, yT - 2), t1 = Math.min(bodyBot, yB + 2);
              fill(xe - sw, t0, sw, t1 - t0, rgba(P.ink, swept ? 0.95 : 0.55));
            }
          }
        }

        // ---- the line on close (RenderTrace): ground halo, then ink
        if (cnt >= 2) {
          const w = Math.max(1, 2) * 0.8 + 0.2;
          ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
          ctx.beginPath();
          for (let k = 0; k < cnt; k += stride) {
            if (k + stride > cnt - 1 && k !== cnt - 1) k = cnt - 1;
            const x = X(bFrom + k), y = PY(s.c[bFrom + k]);
            if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = rgba(P.ground, 0.7); ctx.lineWidth = w + 2.2; ctx.stroke();
          ctx.strokeStyle = rgba(P.ink, 0.92); ctx.lineWidth = w; ctx.stroke();
          ctx.restore();
        }

        // ---- reach bracket (RenderReach)
        if (u > 0) {
          const x = Math.floor(xLast + Math.max(6, slotW * 1.5)) + 0.5;
          if (!(x > x2 - 4 || x < x1)) {
            const yA = PY(c0 + u), yB2 = PY(c0 - u), yC = PY(c0);
            if (yB2 - yA >= 6) {
              const c = rgba(P.ink, 0.46);
              fill(x - 0.5, yA, 1, yB2 - yA, c); fill(x - 3.5, yA, 7, 1, c); fill(x - 3.5, yB2 - 1, 7, 1, c);
              fill(x - 1.5, yC, 3, 1, rgba(P.ink, 0.85));
            }
          }
        }

        // ---- odds ladder (RenderLadder): one meter per resting pool, as long as its odds, as heavy as its rank
        if (ladderOn) {
          const bh = bodyBot - bodyTop;
          fill(ladX0, bodyTop, 1, bh, rgba(P.ink, 0.22));
          const ladAt = [0.05, 0.25, 0.6, 1.0], ladName = ["5", "25", "60", "100%"];
          // names left to right; one that would run into the previous is skipped (DEVIATIONS 9)
          const nameX = ladAt.map((a, q) => { const x = Math.floor(ladX0 + ladLen * a); return q === 3 ? x - 25 : x + 3; });
          let nameEnd = -Infinity;
          for (let q = 0; q < 4; q++) {
            const x = Math.floor(ladX0 + ladLen * ladAt[q]);
            fill(x, bodyTop, 1, bh, rgba(P.ink, q === 3 ? 0.06 : 0.1));
            const nw = d.measure(ladName[q], { size: 8, weight: 600 });
            const clash = nameX[q] < nameEnd + 4 || (q === 2 && nameX[q] + nw + 4 > nameX[3]);
            if (bh > 40 && !clash) { d.text(ladName[q], nameX[q], bodyTop + 7, { size: 8, weight: 600, color: rgba(P.ink, 0.55) }); nameEnd = nameX[q] + nw; }
          }
          let sc2 = bh / 220; if (sc2 > 1) sc2 = 1; else if (sc2 < 0.5) sc2 = 0.5;
          for (let pass = 0; pass < 2; pass++) for (const q of list) {
            if (!q.rest) continue;
            const yL = Math.floor(PYraw(q.p.level));
            if (yL < bodyTop + 1 || yL > bodyBot - 1) continue;
            const od = Number.isNaN(q.odds) || q.odds < 0 ? 0 : q.odds > 1 ? 1 : q.odds;
            const hue = heatOfPct(P, q.p.side, od * 100);
            if (pass === 0) { if (tagColX > margEdge) fill(margEdge, yL, tagColX - margEdge, 1, rgba(hue, 0.22)); continue; }
            const rk = rankOf(q.dom);
            const th = Math.max(3, Math.round((rk >= RK_MAJOR ? 11 : rk === RK_SWING ? 8 : 5) * sc2));
            const len = Math.max(2, Math.round(ladLen * od));
            let yT = q.p.side > 0 ? yL - th + 1 : yL, yB = yT + th;
            if (yT < bodyTop) yT = bodyTop;
            if (yB > bodyBot) yB = bodyBot;
            if (yB <= yT) continue;
            const a = od >= T_HOT ? 0.95 : od >= T_WARM ? 0.8 : od >= T_COOL ? 0.5 : 0.28;
            fill(ladX0, yT, len, yB - yT, rgba(hue, a));
          }
        }

        // ---- pool tags (RenderTags, own panel): hottest first; one or two columns when crowded
        if (fullTags && x2 - x1 >= 160) {
          const order: DP[] = [];
          for (const q of list) { if (!q.rest || !inBody(q)) continue; let k = order.length; while (k > 0 && q.odds > order[k - 1].odds) k--; order.splice(k, 0, q); }
          const wRank = anyMajor ? 37 : 0, wOdds = 23, wPx = fp(Math.max(...order.map((q) => Math.abs(q.p.level)))).length * 6.2 + 3;
          const xA = x2 - tagWd, xB = xA - tagWd - 5, two = xB >= tagEdge && xB >= x1;
          const placed: { y: number; col: number }[] = [];
          for (const q of order) {
            if (placed.length >= TAG_MAX) break;
            const cy = Math.floor(PYraw(q.p.level));
            let top = cy - TAG_H * 0.5;
            if (top < bodyTop) top = bodyTop;
            if (top + TAG_H > bodyBot) top = bodyBot - TAG_H;
            let clashA = false, clashB = false;
            for (const t of placed) if (Math.abs(t.y - top) < TAG_H + 1) { if (t.col === 0) clashA = true; else clashB = true; }
            const col = !clashA ? 0 : two && !clashB ? 1 : -1;
            if (col < 0) continue;
            const xT = col === 0 ? xA : xB;
            const od = Number.isNaN(q.odds) ? 0 : q.odds;
            const major = rankOf(q.dom) >= RK_MAJOR, cold = od < T_COOL;
            const hue = heatOfPct(P, q.p.side, od * 100);
            const ink = cold ? rgba(P.ink, 0.55) : rgba(hue, 0.96);
            const ym = top + TAG_H / 2 + 0.5, fo = { size: 9, weight: 600 } as const;
            fill(xT, top, tagWd, TAG_H, rgba(P.ground, 0.84));
            fill(xT, top, major ? 3 : 2, TAG_H, rgba(hue, cold ? 0.45 : 0.95));
            let x = xT + 7;
            if (wRank > 0) { if (major) d.text("MAJOR", x, ym, { ...fo, color: ink }); x += wRank; }
            d.text(oddsWord(od), x + wOdds, ym, { ...fo, align: "right", color: ink });
            x += wOdds + 6;
            d.text(fp(q.p.level), x, ym, { ...fo, color: ink });
            x += wPx;
            if (q.touch > 1) d.text(`x${q.touch}`, x, ym, { ...fo, color: cold ? rgba(P.ink, 0.385) : rgba(hue, 0.672) });
            placed.push({ y: top, col });
          }
        }

        // ---- pool tags, narrow form: hottest first, one row per level; price in the axis (DEVIATIONS 3)
        if (!fullTags && x2 - x1 >= 160) {
          const tags = list.filter((q) => q.rest && PYraw(q.p.level) >= bodyTop + 1 && PYraw(q.p.level) <= bodyBot - 1);
          const order: DP[] = [];
          for (const q of tags) { let k = order.length; while (k > 0 && q.odds > order[k - 1].odds) k--; order.splice(k, 0, q); }
          const placed: number[] = [];
          for (const q of order) {
            if (placed.length >= TAG_MAX) break;
            const cy = Math.floor(PYraw(q.p.level));
            let top = cy - TAG_H * 0.5;
            if (top < bodyTop) top = bodyTop;
            if (top + TAG_H > bodyBot) top = bodyBot - TAG_H;
            if (placed.some((y) => Math.abs(y - top) < 15)) continue;
            placed.push(top);
            const od = Number.isNaN(q.odds) ? 0 : q.odds;
            const cold = od < T_COOL;
            const hue = heatOfPct(P, q.p.side, od * 100);
            const txt = oddsWord(od);
            const tw = d.measure(txt, { size: 9, weight: 600 });
            const w = 7 + Math.max(23, tw) + 3, xT = x2 + 2 - w;
            const major = rankOf(q.dom) >= RK_MAJOR;
            fill(xT, top, w, TAG_H, rgba(P.ground, 0.84));
            fill(xT, top, major ? 3 : 2, TAG_H, rgba(hue, cold ? 0.45 : 0.95));
            d.text(txt, x2 - 1, top + TAG_H / 2 + 0.5, { size: 9, weight: 600, align: "right", color: cold ? rgba(P.ink, 0.55) : rgba(hue, 0.96) });
            const mix = (a: RGB, b: RGB, t: number) => `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
            d.tag(pv, q.p.level, fp(q.p.level), cold ? mix(P.ground, P.ink, 0.3) : rgba(hue, 1), cold ? d.th.text : undefined);
          }
        }

        // ---- pools off the map (RenderOffMap)
        if (x2 - x1 >= 260) {
          let nu = 0, nd = 0, pu = NaN, pd = NaN;
          for (const q of list) {
            if (!q.rest) continue;
            const y = PYraw(q.p.level);
            if (y < bodyTop + 1) { nu++; if (Number.isNaN(pu) || q.p.level < pu) pu = q.p.level; }
            else if (y > bodyBot - 1) { nd++; if (Number.isNaN(pd) || q.p.level > pd) pd = q.p.level; }
          }
          const note = (t: string, y: number, c: RGB) => {
            const w = 8 + t.length * 5.0;
            fill(x1, y, w, 12, rgba(P.ground, 0.8));
            d.text(t, x1 + 4, y + 6.5, { size: 8, weight: 600, color: rgba(c, 0.9) });
          };
          if (nu > 0) note(`${UP} ${nu}${nu === 1 ? " pool above the map" : " pools above the map"}  ·  nearest ${fp(pu)}`, bodyTop, P.buy);
          if (nd > 0) note(`${DN} ${nd}${nd === 1 ? " pool below the map" : " pools below the map"}  ·  nearest ${fp(pd)}`, bodyBot - 12, P.sell);
        }
      }

      // ---- heat strips (RenderStrip / RenderStripEvents)
      const stripsOn = bodyTop - pv.top >= HEAD_PX - 0.5 && pv.bottom - bodyBot >= FOOT_PX - 0.5;
      if (stripsOn) {
        for (const up of [true, false]) {
          const y = up ? bodyTop - RIB_GAP - RIB_H : bodyBot + RIB_GAP, h = RIB_H;
          fill(x1, y, x2 - x1, h, rgba(P.neutral, 0.14));
          const cellW = slotW > paintW ? slotW : paintW;
          const tierOf = (b: number) => { const pct = up ? G.oddsUp[b] : G.oddsDn[b]; return pct >= T_HOT * 100 ? TR_HOT : pct >= T_WARM * 100 ? TR_WARM : pct >= T_COOL * 100 ? TR_COOL : TR_COLD; };
          const stripColor = (t: number) => (t === TR_HOT ? rgba(P.hot, 0.95) : t === TR_WARM ? rgba(P.warm, 0.62) : rgba(side(P, up ? 1 : -1), 0.26));
          let runSt = -1, runA = 0, runB = 0;
          for (let b = bFrom; b <= at + 1; b++) {
            let st = -1, xa = 0, xb = 0;
            if (b <= at) { st = tierOf(b); xa = X(b) - cellW * 0.5; xb = xa + cellW; }
            if (st >= 0 && st === runSt && xa <= runB + 0.51) { runB = xb; continue; }
            if (runSt > 0) { const ra = Math.max(x1, runA), rb = Math.min(x2, runB); if (rb > ra) fill(ra, y, rb - ra, h, stripColor(runSt)); }
            runSt = st; runA = xa; runB = xb;
          }
          // events on the strip: chevron = sweep, dot = run
          const cy = y + h * 0.5;
          const r = Math.max(2.2, Math.min(4.2, Math.min(paintW * 0.5 + 1.6, h * 0.44 + 1.2)));
          for (let b = bFrom; b <= at; b++) {
            const e = G.ev[b];
            if (!e) continue;
            const buySide = e === -1 || e === 2;
            if (buySide !== up) continue;
            const x = X(b), bull = e > 0, q = G.evRank[b];
            const hue = q >= RK_MAJOR ? (bull ? P.buy : P.sell) : P.ink;
            const a = q >= RK_SWING ? 0.98 : 0.66;
            if (e === 2 || e === -2) {
              const rr = Math.max(1.5, r * 0.5);
              ctx.fillStyle = rgba(P.ground, 1); ctx.beginPath(); ctx.arc(x, cy, rr + 1.2, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = rgba(hue, a); ctx.beginPath(); ctx.arc(x, cy, rr, 0, Math.PI * 2); ctx.fill();
              continue;
            }
            const w = q >= RK_MAJOR ? 1.8 : q >= RK_SWING ? 1.5 : 1.0;
            chevron(ctx, x, cy, r, w + 2, rgba(P.ground, 1), bull);
            chevron(ctx, x, cy, r, w, rgba(hue, a), bull);
          }
          // the strip's name at its right end, when the air beyond the last bar allows (the tool's test)
          const lw = up ? 45 : 38;
          if (x2 - x1 > 200 && !(x2 - lw < X(at) + cellW)) {
            fill(x2 - lw, y, lw, h, rgba(P.ground, 0.88));
            let lx = x2 - lw + 3;
            if (up) { d.text("H", lx, y + h / 2, { size: 8, weight: 600, color: rgba(P.ink, 0.9) }); lx += 9; }
            d.text(up ? "ABOVE" : "BELOW", lx, y + h / 2, { size: 8, weight: 600, color: rgba(P.ink, 0.5) });
          }
        }
      }

      // ---- the header (RenderHeader)
      const pw = d.plotRight;
      if (pw >= 200) {
        const py = pv.top, headH = Math.min(HEAD_ROW, Math.max(1, pv.bottom - pv.top - 1));
        const pxLen = fp(c0).length;
        let right = x2 - 2;
        // the header keeps clear of the pane's title, which DS Replay prints at its left (DEVIATIONS 9)
        const hx1 = x1 + d.measure("DS ProLiquidityHunter", { size: 10.5 }) + 14;
        const ro = readoutAt(at, d.k);
        const roCol = ro.pct !== undefined ? heatOfPct(P, ro.side!, ro.pct) : ro.tone === "neutral" ? P.ink : ro.tone === "bull" ? P.buy : P.sell;
        let txt = ro.txt;
        let rw = 8 + Math.max(txt.length, 20 + pxLen) * 7.2;
        if (right - rw < hx1) rw = 8 + txt.length * 7.2;
        if (right - rw < hx1) { const cut = txt.indexOf(DOT); if (cut > 0) { txt = txt.slice(0, cut); rw = 8 + txt.length * 7.2; } }
        if (right - rw >= hx1) {
          fill(right - rw, py + 0.5, rw, headH, rgba(P.ground, 0.78));
          d.text(txt, right - rw + 4, py + 9, { size: 11, weight: 700, color: rgba(roCol, 0.95) });
          right -= rw + 6;
        }
        const chip = (t: string, col: string, stripe: string, minChars: number) => {
          let w = 9 + Math.max(t.length, minChars) * 6.2;
          if (right - w < hx1) w = 9 + t.length * 6.2;
          if (right - w < hx1) return;
          const hh = Math.max(1, Math.min(14, headH - 1));
          fill(right - w, py + 1, w, hh, rgba(P.ground, 0.78));
          fill(right - w, py + 1, 2, hh, stripe);
          d.text(t, right - w + 5, py + 8.5, { size: 9, weight: 600, color: col });
          right -= w + 6;
        };
        if (pw >= 700) {
          const rc = E.unit[at];
          if (rc > 0) chip(`REACH ±${fp(rc)}`, rgba(P.ink, 0.92), rgba(P.ink, 0.9), 7 + Math.max(6, pxLen - 2));
          const ou = G.oddsUp[at], od = G.oddsDn[at], pu = G.poolUp[at], pd = G.poolDn[at];
          const cOf = (sd: number, pct: number, lv: number) => (Number.isNaN(lv) ? rgba(P.ink, 0.55) : pct >= T_COOL * 100 ? rgba(heatOfPct(P, sd, pct), 1) : rgba(P.ink, 1));
          const cb = cOf(-1, od, pd), ca = cOf(1, ou, pu);
          chip(Number.isNaN(pd) ? "BELOW  --" : `BELOW ${cround(Math.min(99, od))}%  ${fp(pd)}`, cb.replace(/,[\d.]+\)$/, ",0.92)"), cb.replace(/,[\d.]+\)$/, ",0.9)"), 11 + pxLen);
          chip(Number.isNaN(pu) ? "ABOVE  --" : `ABOVE ${cround(Math.min(99, ou))}%  ${fp(pu)}`, ca.replace(/,[\d.]+\)$/, ",0.92)"), ca.replace(/,[\d.]+\)$/, ",0.9)"), 11 + pxLen);
        }
        // the TAKEN track record chip is not shown: it is counted over the hidden history (DEVIATIONS 8)
        if (!liveEdge) {
          const w = wall(s, at);
          const hh = w.getUTCHours(), mm = w.getUTCMinutes();
          chip(`AS OF  ${MONTHS[w.getUTCMonth()]} ${w.getUTCDate()}  ${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`, rgba(P.ink, 0.92), rgba(P.ink, 0.9), 0);
        }
        if (!fits && pw > 300) chip("panel too short for the map", rgba(P.ink, 0.92), rgba(P.ink, 0.9), 0);
      }
    }

    function chevron(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, w: number, col: string, up: boolean) {
      const rise = r * 0.62;
      const yb = up ? cy + rise * 0.5 : cy - rise * 0.5, yt = up ? cy - rise * 0.5 : cy + rise * 0.5;
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(cx - r, yb); ctx.lineTo(cx, yt); ctx.lineTo(cx + r, yb); ctx.stroke(); ctx.restore();
    }

    // ------------------------------------------------------------ price panel: chevrons (DsLhMark) and the Ledger (DsLhRail)
    const marks = shownPools.filter((p) => p.verdict === VD_SWEPT && p.verdictBar >= 0 && reported(G.evPool[p.verdictBar] === p.id ? G.evRank[p.verdictBar] : 0));
    function drawMarks(d: Draw, P: Pal) {
      if (!d.on("chev")) return;
      const ctx = d.ctx, pv = d.price;
      const bodyW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      const barW = bodyW * 0.5;
      const r = Math.max(5.5, Math.min(11, barW * 1.25));
      const GAP = 9, w = Math.max(1.3, Math.min(2.2, r * 0.34));
      const rise = r * 0.62, pitch = r * 0.95, span = rise + pitch;
      const fs = Math.floor(Math.max(9, Math.min(20, r * 1.9)) + 0.5);
      for (const p of marks) {
        const vb = p.verdictBar;
        if (vb > d.k || vb < d.k - MARK_HISTORY) continue;
        const take = p.take;
        if (take > d.i1 + 2) continue;
        const up = p.side < 0; // a sell-side pool swept -> the chevron points up under the low
        const hue = up ? P.buy : P.sell;
        const ax = d.x(take), ay = pv.y(up ? s.l[take] : s.h[take]);
        const xFrom = d.x(p.anchor <= take ? p.anchor : take);
        if (ax < -40 || xFrom > d.plotRight + 40) continue;
        // the level back to the bar that left it (shelf): ground underlay, hue at 60%
        const half = Math.max(2, barW + 1.5);
        let xa = Math.min(xFrom, ax - r - 2), xb = ax + Math.max(half, r + 2);
        if (xa < 0) xa = 0;
        if (xb > d.plotRight) xb = d.plotRight;
        const ys = Math.floor(pv.y(p.level)) + 0.5;
        if (xb - xa >= 2 && ys >= pv.top && ys <= pv.bottom) {
          d.line([[xa - 1, ys], [xb + 1, ys]], rgba(P.ground, 1), 3);
          d.line([[xa, ys], [xb, ys]], rgba(hue, 0.6), 1);
        }
        // the double chevron (MAJOR = FORM_PRIME) with its bevel, then the letter H
        const top = up ? ay + GAP : ay - GAP - span;
        ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (const [col, lw] of [[rgba(P.ground, 1), w + 3], [rgba(hue, 1), w]] as [string, number][]) {
          ctx.strokeStyle = col; ctx.lineWidth = lw;
          for (let k = 0; k < 2; k++) {
            const yb = up ? top + rise + k * pitch : top + k * pitch;
            const yt = up ? yb - rise : yb + rise;
            ctx.beginPath(); ctx.moveTo(ax - r, yb); ctx.lineTo(ax, yt); ctx.lineTo(ax + r, yb); ctx.stroke();
          }
        }
        ctx.restore();
        const tail = up ? top + span : top;
        const rh = fs * 1.45, ty = up ? tail + 2 : tail - rh - 2;
        const cyR = ty + rh * 0.5;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) d.text("H", ax + dx, cyR + dy, { size: fs, weight: 700, align: "center", color: rgba(P.ground, 1), font: "sans" });
        d.text("H", ax, cyR, { size: fs, weight: 700, align: "center", color: rgba(hue, 0.92), font: "sans" });
      }
    }

    function drawLedger(d: Draw, P: Pal) {
      if (!d.on("levels")) return;
      const k = d.k, pv = d.price, ctx = d.ctx;
      const picks = railsAt(k);
      const newest = d.live ? d.live.i : k;
      const FLAG_H = 16, FLAG_PAD = 6, RANK_GAP = 5;
      const SCALE_GAP = 12, SCALE_MAX = 150, SCALE_MIN = 60, SCALE_MIN1 = 40, FIG_GAP = 5, CAL_GAP = 14, THREAD_GAP = 14, LONE_GAP = 16, CLEAR = 80, NEAR = 16;
      const fPrice = { size: 10, weight: 400 } as const, fOdds = { size: 11.5, weight: 700 } as const, fRank = { size: 8.5, weight: 700 } as const, fCap = { size: 8, weight: 700 } as const;
      // the rail geometry (DsLhRail.Paint): the flag at the axis, the odds scale and caliper in the air when it is wide enough
      const tagR = d.plotRight - 1, point = Math.round(0.4 * FLAG_H);
      const wRankC = d.measure("MAJOR", fRank) + RANK_GAP;
      const wFigC = d.measure("99%", fOdds);
      const wPriceAll = Math.max(0, ...picks.map((q) => d.measure(fp(q.p.level), fPrice)));
      const xNew = d.x(newest) + d.bw * 0.5;
      const flag2 = Math.ceil(FLAG_PAD + wRankC + wPriceAll + FLAG_PAD);
      const flag1 = Math.ceil(FLAG_PAD + wRankC + wFigC + RANK_GAP + wPriceAll + FLAG_PAD);
      const lc = d.live ? d.live.c : s.c[k];
      for (const pk of picks) {
        const p = pk.p;
        const yd = pv.y(p.level);
        if (yd < pv.top - 2 || yd > pv.bottom + 2) continue;
        const yk = Math.floor(yd), y = yk + 0.5;
        const hue = roleHue(P, p.side, pk.odds);
        const up = p.side > 0, tier = pk.tier, major = pk.major;
        const oddsTxt = oddsWord(pk.odds);
        const oddsOk = Number.isFinite(pk.odds) && pk.odds >= 0;
        let br = Math.floor(tagR - flag2 - point - SCALE_GAP) + 0.5;
        let room = br - (xNew + CLEAR + CAL_GAP + wFigC + FIG_GAP);
        let mode = oddsOk && room >= SCALE_MIN ? 2 : 0;
        let flagW = flag2;
        if (mode === 0) {
          br = Math.floor(tagR - flag1 - point - SCALE_GAP) + 0.5;
          room = br - (xNew + NEAR + LONE_GAP);
          mode = oddsOk && room >= SCALE_MIN1 ? 1 : 0;
          flagW = flag1;
        }
        // mode 0 here is the narrow web form (DEVIATIONS 2): odds in the flag, the price in the axis
        if (mode === 0) flagW = Math.ceil(FLAG_PAD + (major ? wRankC : 0) + d.measure(oddsTxt, fOdds) + FLAG_PAD);
        const sw = mode > 0 ? Math.floor(Math.min(SCALE_MAX, room)) : 0;
        const gl = br - sw;
        const calX = Math.floor(gl - FIG_GAP - wFigC - CAL_GAP) + 0.5;
        const tagL = tagR - flagW, tip = tagL - point;
        const xEnd = mode === 2 ? calX - THREAD_GAP : mode === 1 ? gl - LONE_GAP : tip - 2;
        // the line, run by run, in the heat each run held
        const x0 = d.x(p.anchor);
        const xs0 = Math.max(x0, 0);
        if (xEnd - xs0 >= 1) {
          const runs = p.runs, rn = runs.length / 2;
          const seg = (xa: number, xb: number, t: number) => {
            if (xb <= xa) return;
            if (t <= TR_COLD) d.line([[xa, y], [xb, y]], rgba(hue, 0.4), 1, [1, 3]);
            else if (t === TR_COOL) d.line([[xa, y], [xb, y]], rgba(hue, 0.45), 1);
            else if (t === TR_WARM) d.line([[xa, y], [xb, y]], rgba(hue, 0.9), 1);
            else { const yy = up ? y - 0.5 : y + 0.5; d.line([[xa, yy], [xb, yy]], rgba(hue, 1), 2); }
            if (!major) return;
            const yd2 = up ? y - 4 : y + 4, ad = t <= TR_COOL ? 0.3 : 0.6;
            if (t <= TR_COLD) d.line([[xa, yd2], [xb, yd2]], rgba(hue, ad), 1, [1, 3]);
            else d.line([[xa, yd2], [xb, yd2]], rgba(hue, ad), 1);
          };
          let fromX = xs0;
          let rlast = -1;
          for (let i = 0; i < rn; i++) if (runs[2 * i] <= k) rlast = i;
          const first = d.i0;
          for (let i = 0; i <= rlast; i++) {
            if (i + 1 <= rlast && runs[2 * (i + 1)] < first - 1) continue;
            const t = runs[2 * i + 1];
            const sb = i + 1 <= rlast ? Math.min(xEnd, d.x(runs[2 * (i + 1)])) : xEnd;
            if (fromX >= xEnd) break;
            if (sb - fromX < 1 && i + 1 <= rlast) continue;
            if (sb > fromX) seg(fromX, sb, t);
            fromX = Math.max(fromX, sb);
          }
          if (x0 >= 0 && x0 <= xEnd) { const xi = Math.floor(x0); ctx.fillStyle = rgba(hue, 1); ctx.fillRect(xi - 2, yk - 2, 5, 5); }
          for (let t = 0; t < p.tBar.length; t++) {
            if (p.tAt[t] > k) continue;
            const xt = d.x(p.tBar[t]);
            if (xt < xs0 || xt > xEnd) continue;
            const ytk = Math.floor(pv.y(p.tPx[t]));
            if (Math.abs(ytk - yk) < 2 || ytk < pv.top - 2 || ytk > pv.bottom + 2) continue;
            const xi = Math.floor(xt) + 0.5;
            d.line([[xi, y], [xi, ytk + 0.5]], rgba(hue, 0.55), 1);
            ctx.fillStyle = rgba(hue, 0.9); ctx.fillRect(xi - 1.5, ytk - 1, 3, 3);
          }
        }
        // the odds scale: one baseline every level shares, ticks every 10%, the bar as long as the odds
        if (mode > 0) {
          const L = Math.round(sw * Math.max(0, Math.min(1, pk.odds)));
          const xs = br - L;
          const aT = tier === TR_HOT ? 1 : tier === TR_WARM ? 0.95 : tier === TR_COOL ? 0.55 : 0.4;
          if (xs - gl >= 1) d.line([[gl, y], [xs, y]], rgba(hue, 0.3), 1);
          for (let q = 1; q <= 9; q++) {
            const tx = Math.floor(br - (sw * q) / 10) + 0.5;
            if (tx >= xs - 1) continue;
            const h = q === 5 ? 4 : 2;
            d.line([[tx, yk - h], [tx, yk + h + 1]], rgba(hue, 0.32), 1);
          }
          if (L >= 1) { ctx.fillStyle = rgba(hue, aT); ctx.fillRect(xs, yk - 1, L, 3); }
          d.line([[br, yk - 5], [br, yk + 6]], rgba(hue, aT), 1);
          const xr = Math.floor(xs) + 0.5;
          if (L >= 1) d.line([[xr, yk - 5], [xr, yk + 6]], rgba(hue, aT), 1);
        }
        // the caliper on the hunted level: the distance from the last price, in points
        if (mode === 2 && pk.hunt && Number.isFinite(lc)) {
          const dist = up ? p.level - lc : lc - p.level;
          const ya = pv.y(lc);
          if (dist > 0 && ya >= pv.top && ya <= pv.bottom - 1) {
            const yaa = Math.floor(ya) + 0.5, yb = y;
            if (Math.abs(yaa - yb) >= 6) {
              d.line([[calX, Math.min(yaa, yb)], [calX, Math.max(yaa, yb)]], rgba(hue, 0.85), 1);
              d.line([[calX - 7, yaa], [calX + 7, yaa]], rgba(hue, 0.55), 1);
              d.line([[calX - 7, yb], [calX + 7, yb]], rgba(hue, 0.55), 1);
              const calText = (up ? "+" : "\u2212") + (Math.round(dist / tick) * tick).toFixed(2);
              const two = Math.abs(yaa - yb) >= 34, mid = Math.round((yaa + yb) * 0.5);
              const cw = d.measure(calText, fOdds), cy = two ? mid - 5 : mid;
              ctx.fillStyle = rgba(P.ground, 0.88); ctx.fillRect(calX - 12 - cw, cy - 8, cw + 6, two ? 26 : 16);
              d.line([[calX - 4, yaa + 4], [calX + 4, yaa - 4]], rgba(hue, 1), 1.6);
              d.line([[calX - 4, yb + 4], [calX + 4, yb - 4]], rgba(hue, 1), 1.6);
              d.text(calText, calX - 9 - cw, cy, { ...fOdds, color: rgba(hue, 1) });
              if (two) d.text("PTS", calX - 9 - d.measure("PTS", fCap), mid + 8, { ...fCap, color: rgba(hue, 0.7) });
            }
          }
        }
        // flag
        const topY = Math.floor(y - FLAG_H * 0.5) + 0.5, bot = topY + FLAG_H;
        ctx.save();
        ctx.fillStyle = rgba(P.ground, 0.88);
        ctx.fillRect(tagL, topY, flagW, FLAG_H);
        ctx.beginPath(); ctx.moveTo(tagL, topY); ctx.lineTo(tip, y); ctx.lineTo(tagL, bot); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(hue, 0.92); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tagR, topY); ctx.lineTo(tagL, topY); ctx.lineTo(tip, y); ctx.lineTo(tagL, bot); ctx.lineTo(tagR, bot); ctx.lineTo(tagR, topY); ctx.stroke();
        ctx.restore();
        if (major) d.text("MAJOR", tagL + FLAG_PAD, y + 0.5, { ...fRank, color: rgba(hue, 0.7) });
        if (mode === 0) {
          d.text(oddsTxt, tagR - FLAG_PAD, y + 0.5, { ...fOdds, align: "right", color: rgba(hue, 1) });
          d.tag(pv, p.level, fp(p.level), rgba(hue, 1));
        } else {
          // the tool's wide-margin flag: [MAJOR] [odds when no scale room for it] price
          const pTxt = fp(p.level), wOwn = d.measure(pTxt, fPrice);
          if (mode === 1) d.text(oddsTxt, tagR - FLAG_PAD - wPriceAll - RANK_GAP, y + 0.5, { ...fOdds, align: "right", color: rgba(hue, 1) });
          d.text(pTxt, tagR - FLAG_PAD - wOwn, y + 0.5, { ...fPrice, color: rgba(hue, 0.92) });
          if (mode === 2) d.text(oddsTxt, gl - FIG_GAP, y + 0.5, { ...fOdds, align: "right", color: rgba(hue, 1) });
        }
      }
      void newest;
    }

    // ------------------------------------------------------------ inspector + status
    const readout = (i: number): ReadItem[] => {
      const items: ReadItem[] = [];
      const ro = readoutAt(i, i);
      items.push({ label: "Readout", value: ro.txt.replace(/\s{2,}/g, " "), tone: ro.tone });
      items.push({ label: "Odds above", value: Number.isNaN(G.poolUp[i]) ? "--" : `${cround(Math.min(99, G.oddsUp[i]))}% · ${fmtUS(G.poolUp[i])}`, tone: G.oddsUp[i] >= 60 ? "strongBull" : G.oddsUp[i] >= 25 ? "bull" : undefined });
      items.push({ label: "Odds below", value: Number.isNaN(G.poolDn[i]) ? "--" : `${cround(Math.min(99, G.oddsDn[i]))}% · ${fmtUS(G.poolDn[i])}`, tone: G.oddsDn[i] >= 60 ? "strongBear" : G.oddsDn[i] >= 25 ? "bear" : undefined });
      items.push({ label: "Reach", value: `±${fmtUS(E.unit[i])} pts` });
      items.push({ label: "Event", value: G.ev[i] === 0 ? "0" : `${G.ev[i] > 0 ? "+" : ""}${G.ev[i]} · ${rankWord(G.evRank[i])}` });
      return items;
    };
    const status = (k: number): ReadItem[] => {
      const ro = readoutAt(k, k);
      const out: ReadItem[] = [{ label: "Readout", value: ro.txt.replace(/\s{2,}/g, " "), tone: ro.tone }];
      const ou = G.oddsUp[k], od = G.oddsDn[k];
      out.push({ label: "Above", value: Number.isNaN(G.poolUp[k]) ? "--" : `${cround(Math.min(99, ou))}% · ${fmtUS(G.poolUp[k])}`, tone: ou >= 60 ? "strongBull" : ou >= 25 ? "bull" : "neutral" });
      out.push({ label: "Below", value: Number.isNaN(G.poolDn[k]) ? "--" : `${cround(Math.min(99, od))}% · ${fmtUS(G.poolDn[k])}`, tone: od >= 60 ? "strongBear" : od >= 25 ? "bear" : "neutral" });
      out.push({ label: "Reach", value: `±${fmtUS(E.unit[k])} pts` });
      return out;
    };

    return {
      events,
      // keep the Ledger levels the tool weights heaviest (WARM and HOT, 25%+) in view
      priceExtent: (_i0, _i1, k) => {
        let lo = Infinity, hi = -Infinity;
        for (const pk of railsAt(k)) { if (pk.odds < T_WARM) continue; lo = Math.min(lo, pk.p.level); hi = Math.max(hi, pk.p.level); }
        // and room for a visible chevron + H beyond its wick (about a tenth of the visible range)
        let vlo = Infinity, vhi = -Infinity;
        for (let i = _i0; i <= Math.min(_i1, k); i++) { if (s.h[i] > vhi) vhi = s.h[i]; if (s.l[i] < vlo) vlo = s.l[i]; }
        const room = 0.1 * (vhi - vlo);
        for (const p of marks) {
          if (p.verdictBar > k || p.verdictBar < k - MARK_HISTORY || p.take < _i0 || p.take > _i1) continue;
          if (p.side < 0) lo = Math.min(lo, s.l[p.take] - room); else hi = Math.max(hi, s.h[p.take] + room);
        }
        return Number.isFinite(lo) || Number.isFinite(hi) ? [Number.isFinite(lo) ? lo : hi, Number.isFinite(hi) ? hi : lo] : null;
      },
      paneExtent: (pane, i0, i1, k) => {
        if (pane !== "lh") return null;
        const to = Math.min(i1, k);
        if (to < i0) return null;
        const f = frame(i0, to);
        if (!f) return null;
        [frLo, frHi] = f;
        const { headV, footV } = reserves(lastPh, frHi - frLo);
        const A = frLo - footV, B = frHi + headV;
        const Sp = (B - A) / 1.16; // the engine pads 8% each side: hand it the inner range
        return [A + 0.08 * Sp, B - 0.08 * Sp];
      },
      under: (d) => drawPanel(d),
      draw: (d) => { const P = palette(d); drawMarks(d, P); drawLedger(d, P); },
      readout,
      status: (k) => status(k),
      legend: [
        { label: "Buy-side pool (above)", color: "rgb(84,132,232)", shape: "box" },
        { label: "Sell-side pool (below)", color: "rgb(128,104,224)", shape: "box" },
        { label: "WARM · 25%+", color: "rgb(166,180,255)", shape: "box" },
        { label: "HOT · 60%+", color: "rgb(156,236,255)", shape: "box" },
        { label: "Price, line on close", color: "rgb(214,219,230)", shape: "line" },
      ],
    };
  },
};
