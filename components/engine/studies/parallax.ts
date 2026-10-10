import type { Draw, Session, StudyDef, StudyEvent, Tone } from "../types";
import { hhmm } from "../ta";
import { buildHtf, computePools, windowAt, SWING, type Htf, type Pool, type Win } from "./_parallax-engine";

/**
 * DS Parallax — web edition.
 * Source: DSParallax.cs (Build 2026-10-07), shipped defaults (ApplyDefaults() / ApplyLayoutDefaults()).
 *
 * WHAT IS PORTED
 *   · Four live higher-timeframe mini-charts — 15m, 1h, 4h, 1D (Tf1..Tf4) — 30 bars
 *     each, newest on the right, in one row centred along the bottom of the price
 *     panel (Position Bottom center, Arrangement Auto → Single row: 61 % x 20 % of
 *     the panel, 1 % edge margin, 14 px between panels), each with its own scale
 *     (range x 1.12), a header "NQ  ·  15m" and the countdown to that bar's close at
 *     the right end of the header line (amber 10–8 s, red 3–1 s, blinking on the
 *     250 ms beat), the faint frame, the dotted live-price line at the panel's own
 *     scale, and the fold tab on the bottom edge. Body width 66 %, wick ≤ 2 px.
 *   · The series are what NinjaTrader's AddDataSeries() builds on the CME ETH
 *     session: minute bars counted from the 18:00 ET open (so the 4h bars close
 *     22:00 / 02:00 / 06:00 / 10:00 / 14:00 / 17:00, as the product cover's countdowns
 *     show), daily = one bar per session closing 17:00. Index 0 is the developing
 *     bar, built from the closed one-minute bars plus the forming bar (d.live).
 *   · The liquidity-pool engine, line for line (_parallax-engine.ts): swing length 3,
 *     equal-level tolerance 0.25 x the panel's Wilder ATR(14) (never < 1 tick),
 *     candidates that no newer bar has poked past by more than the tolerance,
 *     clusters with a touch count, live only while no newer bar has traded beyond,
 *     max 3 per side (nearest kept + the window's extreme), ghosts for genuine sweeps
 *     only (closed back inside on that bar or the next), 2 per side, most recent first.
 *     Marks: buy-side sky blue #4FC3F7, sell-side amber #FFB74D; line 1 / 1.5 / 2 px
 *     at alpha 0.62 / 0.85 / 1 for 1 / 2 / 3+ touches; band at 14 % between a
 *     cluster's inner and outer level; ghost = 38 % dashed trace to an x (85 %);
 *     ×2 … ×9+ on a dark tag in a rail at the panel's right edge, dropped on a clash.
 *   · Auto label contrast: headers and countdowns are inked by the tool's own WCAG
 *     fit (4.5 : 1 headers, 3 : 1 accents, slate digits on a light chart).
 *   · Calculation: the tool redraws on every price change and re-runs the pools on
 *     each new panel bar and at most every 250 ms. The replay draws the live state
 *     from d.live; events, status and readout come from the state at each closed
 *     one-minute bar only.
 *
 * EVENTS (pool formed / swept), from the closed-minute snapshots:
 *   · BUY-SIDE / SELL-SIDE POOL (×n) — a live pool appears whose newest swing is one
 *     of the last 3 panel bars (a fresh swing, not one that re-entered the 3-per-side
 *     cap); one event per level per panel.
 *   · BUY-SIDE / SELL-SIDE SWEPT — a ghost appears whose sweep bar is the developing
 *     or the just-closed panel bar (the sweep is happening now, not an old ghost
 *     re-entering the 2-per-side list).
 *   The same level on several panels at the same minute is one event naming them all.
 *
 * DEVIATIONS
 *   · History: the replay files hold about three sessions before the replay day, so
 *     the 4h panel shows ~15–22 bars and the 1D panel 3–4 (NinjaTrader loads its own
 *     history and fills all 30). The engine runs on what exists, as the tool does on a
 *     chart that loads fewer days ("a chart that loads fewer days simply shows fewer
 *     candles" — the Panel 4 tooltip). The Wilder ATR seeds from the first panel bar
 *     in the file rather than from NinjaTrader's longer history.
 *   · Candle colours: shipped green #25D725 / red #CC0000. By the DS Universe house
 *     rule (and this site's brief: never green/red) the panels use the chart's house
 *     teal / violet, as on the current DS Parallax product cover.
 *   · Text floor: the tool scales text with the panel down to 6.5 px; the web chart is
 *     smaller than a NinjaTrader chart, so the floor is 9 px here to stay legible.
 *   · Corners: frames, tags and the fold tab are square (house rule: no rounded pills);
 *     the tool rounds them by 2.5–4 px.
 *   · Framing: the price scale keeps extra room below the candles (see Matrix size) so
 *     the matrix sits under price, as in every product shot (NinjaTrader does not move
 *     the scale; the trader frames the chart).
 *   · Fonts: Segoe UI / Arial Bold → the page's sans at 600 / 700.
 *   · Matrix size (web showcase): on a price panel under 900 px tall the matrix uses the tool's own
 *     Matrix width / height overrides at 80 % x 30 % instead of the single row's 61 % x 20 %, so the
 *     four panels stay legible on a stage a third the height of a NinjaTrader chart. Layout, order,
 *     gaps and everything inside the panels are unchanged. The framing room under the candles is
 *     raised to match (0.56 of the candles' range, was 0.26) and, on the whole-example stage, is
 *     sized on the whole example so the scale holds still while it plays.
 *   · Example hygiene (web showcase): an example carries no instrument and no date (its sym and day
 *     are empty), so the panel header reads the timeframe alone ("15m", not "NQ · 15m") and the 1D
 *     bar a pool sentence names is given by its weekday only ("the Tue 1D bar", not "Tue 3 Mar").
 *     The tool's header and date label are unchanged on a dated replay. Display only.
 */

const PANELS: [number, string][] = [[15, "15m"], [60, "1h"], [240, "4h"], [0, "1D"]];
const BUY = [79, 195, 247], SELL = [255, 183, 77], TEXT = [235, 240, 246];
const HEAD = [0.585 * 255, 0.596 * 255, 0.631 * 255];
const AMBER = [255, 0.72 * 255, 0.2 * 255], RED = [255, 0.32 * 255, 0.3 * 255];
const POOL_DARK = [0.03 * 255, 0.035 * 255, 0.05 * 255], POOL_LIGHT = [0.97 * 255, 0.975 * 255, 0.985 * 255], SLATE = [0.086 * 255, 0.125 * 255, 0.18 * 255];
const PANEL_BG = "rgba(128,133,143,0.055)", PANEL_BD = "rgba(133,140,153,0.26)";
const TAG_BG = "rgba(11,13,16,0.80)";
const CHIP_BG = [20, 22, 25], CHIP_BD = [77, 87, 102];
const REF_CELL_W = 365, REF_CELL_H = 279, FONT = 12, MIN_FONT = 9, CD_MUL = 1.18, LANE_K = 1.80952381;
const GAP = 14, W_PCT = 61, H_PCT = 20, W_PCT_SMALL = 80, H_PCT_SMALL = 30, SMALL_PANEL_H = 900, EDGE_PCT = 1, BODY_PCT = 66, BAND = 0.14;
// room under the candles for the matrix, as a share of their range (sized for the 30 % matrix + header)
const ROOM = 0.56;
const TOUCH_TAGS = ["", "", "×2", "×3", "×4", "×5", "×6", "×7", "×8", "×9+"];

type C3 = number[];
const rgba = (c: C3, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const lift = (c: C3) => c.map((v) => v + (255 - v) * 0.35);
const hexRgb = (h: string): C3 => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

// ---- DsLegibility (no chart background image on the replay: the ground is the chart colour)
const relLum = (c: C3) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
const lumToSrgb = (l: number) => (l <= 0 ? 0 : l >= 1 ? 1 : l <= 0.0030402 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055);
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
function fitOk(c: C3, t: number, an: number, g: C3, lb: number, labA: number, target: number) {
  const cc = c.map((v) => v + (an - v) * t);
  return ratio(relLum(g.map((v, j) => v + (cc[j] - v) * labA)), lb) >= target;
}
function fit(c: C3, worstLum: number, labA: number, darkInk: boolean, target: number): C3 {
  const v = lumToSrgb(worstLum) * 255;
  const g = [v, v, v], lb = relLum(g), an = darkInk ? 0 : 255;
  if (fitOk(c, 0, an, g, lb, labA, target)) return c;
  let lo = 0, hi = 0.55;
  if (fitOk(c, hi, an, g, lb, labA, target)) for (let it = 0; it < 8; it++) { const m = 0.5 * (lo + hi); if (fitOk(c, m, an, g, lb, labA, target)) hi = m; else lo = m; }
  return c.map((x) => x + (an - x) * hi);
}
function glassOk(a: number, worstLum: number, glass: C3, labA: number, ink: C3, target: number) {
  const v = lumToSrgb(worstLum) * 255;
  const g = [v, v, v].map((x, j) => x + (glass[j] - x) * a);
  const lb = relLum(g);
  return ratio(relLum(g.map((x, j) => x + (ink[j] - x) * labA)), lb) >= target;
}
function solve(worstLum: number, glass: C3, labA: number, ink: C3, target: number, floor = 0, max = 0.85) {
  if (glassOk(floor, worstLum, glass, labA, ink, target)) return floor;
  if (!glassOk(max, worstLum, glass, labA, ink, target)) return max;
  let lo = floor, hi = max;
  for (let it = 0; it < 9; it++) { const m = 0.5 * (lo + hi); if (glassOk(m, worstLum, glass, labA, ink, target)) hi = m; else lo = m; }
  return hi;
}

const fmtP = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dayLabel = (m: number, dated = true) => new Date(Date.UTC(2026, 0, 1) + m * 60000).toLocaleDateString("en-GB", dated ? { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" } : { weekday: "short", timeZone: "UTC" }).replace(",", "");
const clock = (m: number) => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

function countdown(H: Htf, j0: number, nowMin: number): { txt: string; col: C3; a: number; accent: boolean } {
  let remain = (H.tClose[j0] - nowMin) * 60;
  if (H.per >= 86400 && (remain < 0 || remain > H.per)) return { txt: "--:--", col: TEXT, a: 1, accent: false };
  if (remain < 0) remain = 0;
  if (remain > H.per) remain = H.per;
  let total = Math.ceil(remain - 1e-6);
  if (total < 0) total = 0;
  const blink = Math.floor((Date.now() % 1000) / 250) % 2 === 0;
  let col = TEXT, a = 1, accent = false;
  if (total >= 1 && total <= 3) { col = RED; a = blink ? 1 : 0.45; accent = true; }
  else if (total >= 8 && total <= 10) { col = AMBER; a = blink ? 1 : 0.55; accent = true; }
  const dd = Math.floor(total / 86400), hh = Math.floor((total % 86400) / 3600), mm = Math.floor((total % 3600) / 60), ss = total % 60;
  const txt = dd > 0 ? `${dd}d ${hh}h` : hh > 0 ? `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return { txt, col, a, accent };
}

type Snap = { j0: number; pools: Pool[] };

export const study: StudyDef = {
  slug: "parallax", rightMargin: 60,
  name: "DS Parallax",
  about: "Four live higher-timeframe mini-charts — 15m, 1h, 4h, 1D — with the liquidity pools on each: buy-side above unswept highs, sell-side below unswept lows, ghosts where a pool was swept.",
  layers: [
    { id: "liq", label: "Liquidity pools", on: true, hint: "The tool's master switch for the pool engine: lines, bands, labels and ghosts." },
    { id: "labels", label: "Pool labels", on: true, hint: "The ×2, ×3 … touch counts in the rail at each panel's right edge." },
  ],
  run(s: Session) {
    const P = PANELS.map(([m, lb]) => buildHtf(s, m, lb));
    // example hygiene (DEVIATIONS): a showcase example carries no instrument and no date (sym / day empty)
    const sym = s.sym ? s.sym.split(" ")[0] : "";
    const dated = !!s.day;
    const start = Math.max(0, s.replayFrom - 1);

    // ---- closed-minute snapshots
    const snaps: Snap[][] = [];
    const snapAt = (k: number): Snap[] => {
      if (k >= start && snaps[k - start]) return snaps[k - start];
      return P.map((H) => { const { w, j0, atr } = windowAt(H, k, s.c[k], null); return { j0, pools: computePools(w, atr, s.tick) }; });
    };
    for (let k = start; k < s.n; k++) snaps[k - start] = snapAt(k);

    // ---- events
    type Raw = { kind: "F" | "S"; buy: boolean; lvl: number; p: number; pool: Pool; j0: number };
    const events: StudyEvent[] = [];
    const seenF = P.map(() => new Set<string>()), seenS = P.map(() => new Set<string>());
    let lastSweep: { k: number; text: string }[] = [];
    for (let k = start; k < s.n; k++) {
      const raws: Raw[] = [];
      snaps[k - start].forEach((sn, p) => {
        for (const pl of sn.pools) {
          if (pl.swept) {
            const key = `${pl.buy}|${pl.lvl}|${sn.j0 - pl.sweepIdx}`;
            if (seenS[p].has(key)) continue;
            seenS[p].add(key);
            if (pl.sweepIdx <= 1) raws.push({ kind: "S", buy: pl.buy, lvl: pl.lvl, p, pool: pl, j0: sn.j0 });
          } else {
            const key = `${pl.buy}|${pl.lvl}`;
            if (seenF[p].has(key)) continue;
            seenF[p].add(key);
            if (pl.newest <= SWING) raws.push({ kind: "F", buy: pl.buy, lvl: pl.lvl, p, pool: pl, j0: sn.j0 });
          }
        }
      });
      if (k === start) continue; // the state the replay opens on is the baseline
      const groups = new Map<string, Raw[]>();
      for (const r of raws) { const g = `${r.kind}|${r.buy}|${r.lvl}`; groups.set(g, [...(groups.get(g) ?? []), r]); }
      for (const g of groups.values()) {
        const r = g[0], names = g.map((x) => P[x.p].label), panels = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} panels` : `${names[0]} panel`;
        const side = r.buy ? "BUY-SIDE" : "SELL-SIDE";
        const H0 = P[r.p];
        const swingBar = r.j0 - r.pool.idx;
        const since = H0.per >= 86400 ? dayLabel(H0.tClose[swingBar], dated) : clock(H0.tOpen[swingBar]);
        const t = hhmm(s, k), lv = fmtP(r.lvl), hl = r.buy ? "high" : "low";
        const maxT = Math.max(...g.map((x) => x.pool.touches));
        if (r.kind === "S") {
          const heavy = g.some((x) => P[x.p].per >= 3600);
          const text = `${t} — price ran the ${r.buy ? "buy" : "sell"}-side pool at ${lv} on the ${panels} — the ${hl} from the ${since} ${H0.label} bar — and closed back ${r.buy ? "below" : "above"} it, so DS Parallax ghosts the level: a dashed trace ending in an x at the sweep.`;
          events.push({ i: k, price: r.lvl, tone: r.buy ? "bull" : "gold", weight: heavy ? 3 : 2, title: `${side} SWEPT`, text });
          lastSweep.push({ k, text: `${names.join(" · ")} ${r.buy ? "buy" : "sell"} ${lv}` });
        } else {
          const tag = maxT >= 2 ? ` ${TOUCH_TAGS[Math.min(maxT, 9)]}` : "";
          const text = maxT >= 2
            ? `${t} — on the ${panels}, ${maxT} separate swing ${hl}s within 0.25 ATR of each other now count as one ${r.buy ? "buy" : "sell"}-side pool with its outer edge at ${lv}, marked ${tag.trim()} and drawn heavier: each separate test tends to leave another layer of stops ${r.buy ? "above" : "below"} it.`
            : `${t} — the ${H0.label} bar from ${since} left a ${hl} at ${lv} that no bar since has traded ${r.buy ? "above" : "below"}, so DS Parallax marks ${r.buy ? "buy" : "sell"}-side liquidity there on the ${panels}: ${r.buy ? "buy stops rest above an unswept high" : "sell stops rest below an unswept low"}.`;
          events.push({ i: k, price: r.lvl, tone: r.buy ? "bull" : "gold", weight: maxT >= 2 ? 2 : 1, title: `${side} POOL${tag}`, text });
        }
      }
    }
    lastSweep = lastSweep.filter((x) => x.k >= s.replayFrom - 1);

    // ---- drawing
    const drawMatrix = (d: Draw) => {
      const pv = d.price, th = d.th;
      const panelL = 0, panelT = pv.top, panelW = d.plotRight, panelH = pv.bottom - pv.top;
      if (panelW < 80 || panelH < 60) return;
      const nP = 4, cols = 4, rows = 1;
      // Matrix width / height (%): the tool's own override (MatrixWidthPct / MatrixHeightPct, 0 = the
      // arrangement's 61 x 20). On the web stage, a price panel a third the height of a NinjaTrader chart,
      // the showcase sets them to 80 x 30 so the four panels stay readable (see DEVIATIONS).
      const small = panelH < SMALL_PANEL_H;
      let gridW = panelW * ((small ? W_PCT_SMALL : W_PCT) / 100), gridH = panelH * ((small ? H_PCT_SMALL : H_PCT) / 100);
      const edgeM = panelH * (EDGE_PCT / 100);
      const topFloor = panelT + Math.max(edgeM, 22), botCeil = panelT + panelH - 2, leftWall = panelL + 2, rightWall = panelL + panelW - 2;
      if (gridW > rightWall - leftWall) gridW = rightWall - leftWall;
      if (gridH > botCeil - topFloor) gridH = botCeil - topFloor;
      if (gridW <= 20 || gridH <= 20) return;
      const gridL = Math.max(leftWall, Math.min(rightWall - gridW, panelL + (panelW - gridW) * 0.5));
      const gridT = Math.max(topFloor, Math.min(botCeil - gridH, panelT + panelH - edgeM - gridH));
      const cellW = (gridW - (cols - 1) * GAP) / cols, cellH = (gridH - (rows - 1) * GAP) / rows;
      if (cellW < 40 || cellH < 34) return;
      const uiK = Math.min(1, cellW / REF_CELL_W, cellH / REF_CELL_H);
      const fs = Math.round(Math.max(MIN_FONT, Math.min(FONT, FONT * uiK)) * 4) / 4;
      let headH = Math.max(fs * 1.05, fs * CD_MUL) * LANE_K;
      if (headH > cellH * 0.35) headH = cellH * 0.35;

      // the ground the labels sit on (no background image on the replay chart)
      const gl = relLum(hexRgb(th.bg));
      const light = gl > 0.24 ? true : gl < 0.14 ? false : gl > 0.179;
      const tone = light ? POOL_LIGHT : POOL_DARK;
      const nowMin = d.live ? s.t[d.live.i] - 1 + d.live.frac : s.t[d.k];
      const fHead = { font: "sans" as const, size: fs * 1.05, weight: 600 };
      const fTag = { font: "sans" as const, size: fs * 0.88, weight: 700 };
      const fCd = { font: "sans" as const, size: fs * CD_MUL, weight: 700 };
      const glass = (x: number, y: number, w: number, h: number, a: number) => {
        if (a <= 0.004) return;
        const ring = 1 - Math.pow(1 - Math.max(0, Math.min(1, a)), 1 / 6);
        for (let g = 5; g >= 0; g--) d.rect(x - g, y - g, x + w + g, y + h + g, rgba(tone, ring), null);
      };
      const tagWMax = Math.max(...TOUCH_TAGS.map((t) => d.measure(t, fTag)));
      const tagLineH = fs * 0.88 * 1.15;

      for (let p = 0; p < nP; p++) {
        const H = P[p];
        const cx = gridL + p * (cellW + GAP), cy = gridT;
        const { w, j0, atr } = windowAt(H, d.k, s.c[d.k], d.live);
        const pools: Pool[] = !d.on("liq") ? [] : d.live || d.k < start ? computePools(w, atr, s.tick) : snapAt(d.k)[p].pools;
        renderPanel(d, H, w, j0, pools, cx, cy, cellW, cellH, headH, uiK, fs);
      }

      // the fold tab, flat on the bottom edge, centred on the matrix
      const thin = Math.max(10, 13 * uiK), lng = Math.max(34, 54 * uiK);
      const tabX = Math.max(panelL + 1, Math.min(panelL + panelW - 1 - lng, gridL + gridW * 0.5 - lng * 0.5));
      const tabY = panelT + panelH - 1 - thin;
      d.rect(tabX, tabY, tabX + lng, tabY + thin, rgba(CHIP_BG, 0.30), rgba(CHIP_BD, 0.28));
      const cxm = tabX + lng / 2, cym = tabY + thin / 2, a = Math.max(2.4, 3.4 * uiK), lw = Math.max(1, 1.4 * uiK);
      d.line([[cxm - a, cym - a * 0.6], [cxm, cym + a * 0.6], [cxm + a, cym - a * 0.6]], rgba(TEXT, 0.55), lw);

      function renderPanel(d: Draw, H: Htf, w: Win, j0: number, pools: Pool[], cx: number, cy: number, cw: number, ch: number, headH: number, uiK: number, fs: number) {
        const n = w.n;
        const frameT = cy + headH, frameB = cy + ch, frameL = cx, frameR = cx + cw;
        if (frameB - frameT < 20) return;
        const headInk = fit(HEAD, gl, 1, light, 4.5);
        // header line: countdown at the right end, caption centred in what is left
        const cdw = d.measure(H.per >= 86400 ? (d.measure("00:00:00", fCd) > d.measure("00d 00h", fCd) ? "00:00:00" : "00d 00h") : H.per >= 3600 ? "00:00:00" : "00:00", fCd);
        const cd = countdown(H, j0, nowMin);
        const cdInk = cd.accent ? fit(cd.col, gl, cd.a, light, 3) : light ? SLATE : TEXT;
        glass(frameR - cdw, cy, cdw, headH, solve(gl, tone, cd.a, cdInk, cd.accent ? 3 : 4.5));
        d.text(cd.txt, frameR, cy + headH / 2, { ...fCd, color: rgba(cdInk, cd.a), align: "right" });
        const titleW = cw - (cdw + Math.max(4, 7 * uiK));
        let head = sym ? `${sym}  ·  ${H.label}` : H.label;
        let hw = d.measure(head, fHead);
        if (hw > titleW) { head = H.label; hw = d.measure(head, fHead); }
        if (titleW > 12 && hw <= titleW) {
          glass(frameL + (titleW - hw) / 2, cy, hw, headH, solve(gl, tone, 1, headInk, 4.5));
          d.text(head, frameL + titleW / 2, cy + headH / 2, { ...fHead, color: rgba(headInk), align: "center" });
        }
        // frame
        d.rect(frameL, frameT, frameR, frameB, PANEL_BG, PANEL_BD);
        if (n <= 0) return;

        const padX = Math.max(3, 6 * uiK), padY = Math.max(3, 6 * uiK);
        const plotL = frameL + padX, plotT = frameT + padY, plotB = frameB - padY;
        let plotR = frameR - padX;
        let plotW = plotR - plotL;
        const plotH = plotB - plotT;
        if (plotW < 20 || plotH < 16) return;
        const railGap = Math.max(3, 4 * uiK);
        let rail = d.on("labels") && d.on("liq");
        let railW = 0;
        if (rail) {
          railW = railGap + tagWMax + 10 * uiK;
          if (railW > plotW * 0.4 || plotW - railW < 20) { railW = 0; rail = false; }
        }
        plotR -= railW; plotW = plotR - plotL;

        let hi = -Infinity, lo = Infinity;
        for (let k = 0; k < n; k++) { if (w.h[k] > hi) hi = w.h[k]; if (w.l[k] < lo) lo = w.l[k]; }
        const span = hi - lo, dR = span > 0 ? span * 1.12 : s.tick, sB = lo - (dR - span) * 0.5;
        if (dR <= 0) return;
        const Y = (v: number) => plotB - ((v - sB) / dR) * plotH;
        const clampY = (y: number) => Math.max(plotT, Math.min(plotB, y));
        const spacing = plotW / n;
        const X = (k: number) => plotR - (k + 0.5) * spacing;
        const halfBody = Math.max(0.5, Math.min(14, spacing * (BODY_PCT / 100) * 0.5));
        const wickW = Math.max(1, Math.min(2, halfBody * 0.5));

        // pools beneath the candles
        for (const pl of pools) {
          if (pl.idx < 0 || pl.idx >= n) continue;
          const c = pl.buy ? BUY : SELL;
          const y = clampY(Y(pl.lvl));
          const x0 = Math.max(plotL, Math.min(plotR, X(pl.idx) - halfBody));
          if (pl.swept) {
            if (pl.sweepIdx < 0 || pl.sweepIdx >= n) continue;
            const x1 = Math.max(plotL, Math.min(plotR, X(pl.sweepIdx)));
            if (x1 - x0 >= 2) for (let x = x0; x < x1; x += 6) d.rect(x, Math.round(y), Math.min(x + 3, x1), Math.round(y) + 1, rgba(c, 0.38), null);
            const a = Math.max(2.5, 3.5 * uiK), xw = Math.max(1, 1.3 * uiK);
            d.line([[x1 - a, y - a], [x1 + a, y + a]], rgba(c, 0.85), xw);
            d.line([[x1 - a, y + a], [x1 + a, y - a]], rgba(c, 0.85), xw);
            continue;
          }
          if (pl.inner !== pl.lvl && BAND > 0) {
            const yi = clampY(Y(pl.inner));
            const t = Math.min(y, yi), b = Math.max(y, yi);
            if (b - t >= 1) d.rect(x0, t, plotR, b, rgba(c, BAND), null);
          }
          const lw = pl.touches >= 3 ? 2 : pl.touches === 2 ? 1.5 : 1;
          const la = pl.touches >= 3 ? 1 : pl.touches === 2 ? 0.85 : 0.62;
          d.rect(x0, y - lw / 2, plotR, y + lw / 2, rgba(c, la), null);
        }

        // candles
        const up = th.up, dn = th.down;
        for (let k = 0; k < n; k++) {
          const x = X(k);
          const isUp = w.c[k] >= w.o[k];
          const col = isUp ? up : dn;
          const yH = clampY(Y(w.h[k])), yL = clampY(Y(w.l[k])), yO = clampY(Y(w.o[k])), yC = clampY(Y(w.c[k]));
          if (yL - yH >= 1) d.rect(x - wickW / 2, yH, x + wickW / 2, yL, d.alpha(col, 0.95), null);
          let bT = Math.min(yO, yC), bB = Math.max(yO, yC);
          if (bB - bT < 1.5) { const m = (yO + yC) / 2; bT = m - 0.75; bB = m + 0.75; }
          d.rect(x - halfBody, bT, x + halfBody, bB, col, null);
        }

        // the live price, on this panel's own scale
        const ly = Y(w.c[0]);
        if (ly >= plotT && ly <= plotB) for (let x = plotL; x < plotR; x += 5) d.rect(x, Math.round(ly), Math.min(x + 1.5, plotR), Math.round(ly) + 1, rgba(TEXT, 0.42), null);

        // touch-count tags in the rail
        if (rail) {
          const lh = Math.max(tagLineH, fs * 0.88) + Math.max(2, 4 * uiK);
          const placed: [number, number, number, number][] = [];
          for (const pl of pools) {
            if (pl.swept || pl.idx < 0 || pl.idx >= n || pl.touches < 2) continue;
            const tag = TOUCH_TAGS[Math.min(pl.touches, TOUCH_TAGS.length - 1)];
            const c = pl.buy ? BUY : SELL;
            const y = clampY(Y(pl.lvl));
            const tw = d.measure(tag, fTag) + 10 * uiK;
            const lx0 = plotR + railGap;
            if (tw > railW - railGap + 0.5) continue;
            let ok = false, ty = 0;
            for (let attempt = 0; attempt < 3 && !ok; attempt++) {
              if (attempt === 0) ty = y - lh / 2;
              else { const above = (attempt === 1) === pl.buy; ty = above ? y - lh + 1 : y - 1; }
              ty = Math.max(plotT, Math.min(plotB - lh, ty));
              if (y < ty - 0.5 || y > ty + lh + 0.5) continue;
              ok = !placed.some((q) => ty < q[3] && ty + lh > q[1] && lx0 < q[2] && lx0 + tw > q[0]);
            }
            if (!ok) continue;
            placed.push([lx0, ty, lx0 + tw, ty + lh]);
            d.rect(lx0, ty, lx0 + tw, ty + lh, TAG_BG, null);
            d.text(tag, lx0 + tw / 2, ty + lh / 2 + 0.5, { ...fTag, color: rgba(lift(c)), align: "center" });
          }
        }
      }
    };

    const nearest = (k: number) => {
      const sn = snapAt(k), px = s.c[k];
      let nb: { lvl: number; lb: string; t: number } | null = null, ns: { lvl: number; lb: string; t: number } | null = null;
      sn.forEach((x, p) => {
        for (const pl of x.pools) {
          if (pl.swept) continue;
          if (pl.buy && pl.lvl >= px && (!nb || pl.lvl < nb.lvl)) nb = { lvl: pl.lvl, lb: P[p].label, t: pl.touches };
          if (!pl.buy && pl.lvl <= px && (!ns || pl.lvl > ns.lvl)) ns = { lvl: pl.lvl, lb: P[p].label, t: pl.touches };
        }
      });
      return { nb: nb as { lvl: number; lb: string; t: number } | null, ns: ns as { lvl: number; lb: string; t: number } | null };
    };
    const counts = (k: number) => snapAt(k).map((x, p) => `${P[p].label} ${x.pools.filter((q) => !q.swept && q.buy).length}·${x.pools.filter((q) => !q.swept && !q.buy).length}`).join("  ");

    return {
      events,
      draw: drawMatrix,
      priceExtent: (i0, i1) => {
        // framing: room under the candles for the matrix. While the stage shows the example from its first
        // bar (the fit stage), the room is sized on the whole example, as the stage's own scale is, so the
        // scale holds still as the example plays; scrolled on a narrow screen it follows the visible bars.
        const a = i0 <= s.replayFrom ? s.replayFrom : i0, z = i0 <= s.replayFrom ? s.n - 1 : i1;
        let lo = Infinity, hi = -Infinity;
        for (let i = a; i <= z; i++) { if (s.l[i] < lo) lo = s.l[i]; if (s.h[i] > hi) hi = s.h[i]; }
        if (!isFinite(lo)) return null;
        return [lo - (hi - lo) * ROOM, hi];
      },
      status: (k) => {
        const { nb, ns } = nearest(k);
        const sw = lastSweep.filter((x) => x.k <= k).pop();
        const tone = (b: boolean): Tone => (b ? "bull" : "gold");
        return [
          { label: "Nearest buy-side", value: nb ? `${fmtP(nb.lvl)} · ${nb.lb}${nb.t >= 2 ? ` ${TOUCH_TAGS[Math.min(9, nb.t)]}` : ""}` : "none live", tone: nb ? tone(true) : undefined },
          { label: "Nearest sell-side", value: ns ? `${fmtP(ns.lvl)} · ${ns.lb}${ns.t >= 2 ? ` ${TOUCH_TAGS[Math.min(9, ns.t)]}` : ""}` : "none live", tone: ns ? tone(false) : undefined },
          { label: "Live pools (buy·sell)", value: counts(k) },
          { label: "Last sweep", value: sw ? `${sw.text} · ${hhmm(s, sw.k)}` : "none yet" },
        ];
      },
      readout: (i) => [{ label: "Pools at close (buy·sell)", value: counts(i) }],
      legend: [
        { label: "Buy-side liquidity", color: rgba(BUY), shape: "line" },
        { label: "Sell-side liquidity", color: rgba(SELL), shape: "line" },
        { label: "Swept · ghost ending in x", color: rgba(BUY, 0.6), shape: "dash" },
        { label: "Live price on the panel's scale", color: rgba(TEXT, 0.6), shape: "dash" },
      ],
    };
  },
};
