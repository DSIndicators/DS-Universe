import type { Draw, StudyDef } from "../types";

/**
 * DS Adaptive Price Line — web edition.
 * Source: DSAdaptivePriceLine.cs (Build 2026-10-07), shipped defaults (ApplyDefaults()).
 *
 * WHAT IS PORTED (Calculate.OnPriceChange; everything is drawn from the live price)
 *   · The line sits at the live price (d.live.c while a bar forms, else the last
 *     close) and runs from the right-most candle on screen (ChartBars.ToIndex) to
 *     the price axis — Line reach CandleToAxis.
 *   · Anchor style CandleBead, Dot size 4: bead radius max(1.25, 4 x 0.60) = 2.4 px,
 *     seated at barX + half the painted candle width + r − 0.75, with a lighter core
 *     (r x 0.52, colour = base x 0.45 + 0.55). Drawn only when the chart shows the
 *     live candle (scrolled back, the line starts at the right-most candle without it).
 *   · Premium glow, strength 50: three round-capped passes at 6.5 / 3.6 / 1.9 x the
 *     1.5 px width, alpha 0.34 x 0.5 x (0.35 / 0.60 / 1.00).
 *   · Fade to axis: the core runs from full alpha at the candle to 42 % at the axis.
 *   · Behind bars: the whole indicator paints beneath the candles (under()).
 *   · Countdown chip (Segoe UI 12 semibold, tabular, sized on the "00:00" template):
 *     box height max(14, 12 + 9), side pad max(6, 12 x 0.62), set Countdown gap 14 px
 *     right of the dot; skipped if it would end within 2 px of the axis or leave the
 *     panel. Card (0.10, 0.095, 0.086, 0.96) with the 1.5/2 px shadow, the 3 px accent
 *     edge, the 6 % top hairline and the 60 % accent border. The line and glow are
 *     carved 3 px either side of the chip (Break line at chip).
 *     Digits white; amber from 10 down to 8 s, red from 3 down to 1 s, blinking on
 *     the tool's 250 ms beat. Remaining time = the replay clock: (1 − live.frac) x 60 s
 *     of the forming one-minute bar; between bars (no forming bar yet) it reads 00:00,
 *     exactly as the README says NinjaTrader shows it until the next trade opens a bar.
 *   · Colour source FollowOracle: the tool takes DS Oracle's broadcast candle colour
 *     when a DS Oracle runs on the same instrument and period, otherwise its own Line
 *     stroke colour — warm amber (255, 194, 133). There is no DS Oracle on the replay
 *     chart, so the line wears its own amber, which is what a customer running it alone sees.
 *
 * EVENTS: none. The tool has no state that bars change: with no DS Oracle the colour
 * never flips, and the only thing that changes is the countdown, which runs every
 * minute. Emitting anything would be inventing it.
 *
 * DEVIATIONS
 *   · Countdown clock: NinjaTrader reads the data feed's clock (or Market Replay's);
 *     the web edition reads the replay cursor — the same thing in a replay.
 *   · Fonts: Segoe UI semibold is not a web font; the page's sans at weight 600 is used.
 *   · The shipped colours are not adapted to a light chart by the tool, and are not here
 *     either (the amber line reads more quietly on the light ground, as it does in NT).
 *   · Chip fit: the tool skips the chip when it would end within 2 px of the axis.
 *     The engine leaves 5 bars of air right of the newest bar (~38 px at 7 px bars),
 *     and the chip needs ~70 px past the candle, so with the engine's default margin
 *     the rule hides it — exactly as NinjaTrader does on a narrow right margin. It
 *     shows when the chart has room on the right (engine: per-study right padding).
 *   · DS Oracle colour following is not shown (no DS Oracle on the replay chart; the
 *     tool's documented fallback — its own stroke colour — is what is drawn).
 */

const BASE: [number, number, number] = [255, 194, 133];
const W = 1.5;            // LineStroke width
const GLOW = 50;          // GlowStrength
const NODE = 4;           // NodeSize
const BEAD_SCALE = 0.6, BEAD_MIN_R = 1.25, BEAD_CORE = 0.52, BEAD_SEAT = 0.75;
const CD_GAP = 14;        // CountdownGap
const TIMER_PX = 12;      // TimerFont size
const BOX_OPACITY = 1;    // BoxOpacity 100
const PERIOD = 60;        // one-minute chart

const rgba = (c: readonly number[], a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const C_WHITE = [0.96 * 255, 0.97 * 255, 0.99 * 255];
const C_AMBER = [255, 0.72 * 255, 0.2 * 255];
const C_RED = [255, 0.32 * 255, 0.3 * 255];
const C_CARD = [0.1 * 255, 0.095 * 255, 0.086 * 255];

function countdown(live: { frac: number } | null): { txt: string; col: string } {
  // remain = barCloseTime − now, clamped to [0, period]; total = ceil(remain − 1e-6)
  let remain = live ? (1 - live.frac) * PERIOD : 0;
  if (remain < 0) remain = 0;
  if (remain > PERIOD) remain = PERIOD;
  let total = Math.ceil(remain - 1e-6);
  if (total < 0) total = 0;
  const blink = Math.floor((Date.now() % 1000) / 250) % 2 === 0;
  let col = rgba(C_WHITE, 1);
  if (total >= 1 && total <= 3) col = blink ? rgba(C_RED, 1) : rgba(C_RED, 0.45);
  else if (total >= 8 && total <= 10) col = blink ? rgba(C_AMBER, 1) : rgba(C_AMBER, 0.55);
  const mm = Math.floor((total % 3600) / 60), ss = total % 60;
  return { txt: `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`, col };
}

export const study: StudyDef = {
  slug: "adaptive-priceline", rightMargin: 110,
  name: "DS Adaptive Price Line",
  about: "The last-price line re-anchored to the latest candle on every frame, with its bead, fade and bar-close countdown — at the shipped defaults.",
  layers: [
    { id: "line", label: "Show line", on: true, hint: "The tool's own switch: the line, its glow, the fade and the anchor bead." },
    { id: "countdown", label: "Show countdown", on: true, hint: "The tool's own switch: the bar-close chip. It stays put when the line is off." },
  ],
  run(s) {
    const paint = (d: Draw) => {
      const lineOn = d.on("line"), cdOnSet = d.on("countdown");
      if (!lineOn && !cdOnSet) return;
      const ctx = d.ctx, pv = d.price;
      const lastIdx = d.live ? d.live.i : d.k;
      const price = d.live ? d.live.c : s.c[d.k];
      const y = pv.y(price);
      if (y < pv.top - 1 || y > pv.bottom + 1) return;
      const rightX = d.plotRight;

      // CandleToAxis + CandleBead: the bead sits on the right-most candle on screen
      const nodeR = Math.max(BEAD_MIN_R, NODE * BEAD_SCALE);
      const toIndex = d.i1;
      const barX = d.x(toIndex);
      const bodyW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1)); // the engine's painted body width
      const edgeX = barX + bodyW * 0.5 + nodeR - BEAD_SEAT;
      const onLiveBar = toIndex >= lastIdx;
      let startX = edgeX;
      if (startX < 0) startX = 0;
      if (startX > rightX) startX = rightX;
      if (rightX - startX < 1) return;

      // countdown chip geometry
      let cdOn = cdOnSet;
      let boxL = 0, boxR = 0, boxT = 0, boxB = 0;
      let cd = { txt: "", col: "" };
      if (cdOn) {
        cd = countdown(d.live);
        const bh = Math.max(14, TIMER_PX + 9);
        const padX = Math.max(6, TIMER_PX * 0.62);
        const tw = Math.max(8, d.measure(cd.txt.replace(/[0-9]/g, "0"), { font: "sans", size: TIMER_PX, weight: 600 }), d.measure(cd.txt, { font: "sans", size: TIMER_PX, weight: 600 }));
        boxL = Math.max(startX, edgeX) + nodeR + CD_GAP;
        boxR = boxL + tw + padX * 2;
        boxT = y - bh * 0.5;
        boxB = y + bh * 0.5;
        if (boxR > rightX - 2 || boxT < pv.top || boxB > pv.bottom) cdOn = false;
      }
      const carve = lineOn && cdOn && BOX_OPACITY > 0;
      const cutL = carve ? boxL - 3 : 0, cutR = carve ? boxR + 3 : 0;

      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      const seg = (x1: number, x2: number, width: number, style: string | CanvasGradient) => {
        if (x2 - x1 < 1) return;
        ctx.strokeStyle = style; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      };
      const spans = (width: number, style: string | CanvasGradient) => {
        if (!carve) { seg(startX, rightX, width, style); return; }
        if (cutL - startX >= 1) seg(startX, cutL, width, style);
        if (rightX - cutR >= 1) seg(cutR, rightX, width, style);
      };

      if (lineOn) {
        // premium glow — three stacked passes
        const g = Math.max(0, Math.min(1, GLOW / 100)), aBase = 0.34 * g;
        spans(W * 6.5, rgba(BASE, aBase * 0.35));
        spans(W * 3.6, rgba(BASE, aBase * 0.6));
        spans(W * 1.9, rgba(BASE, aBase * 1.0));
        // core, faded candle → axis (full → 42 %), continuous across the chip's gap
        const grad = ctx.createLinearGradient(startX, y, rightX, y);
        grad.addColorStop(0, rgba(BASE, 1));
        grad.addColorStop(1, rgba(BASE, 0.42));
        spans(W, grad);
        // the bead — live candle only
        if (onLiveBar) {
          const light = BASE.map((c) => Math.min(255, c * 0.45 + 0.55 * 255));
          ctx.fillStyle = rgba(BASE, 1);
          ctx.beginPath(); ctx.arc(startX, y, nodeR, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = rgba(light, 1);
          ctx.beginPath(); ctx.arc(startX, y, nodeR * BEAD_CORE, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();

      if (cdOn) {
        const op = BOX_OPACITY, w = boxR - boxL, h = boxB - boxT;
        d.rect(boxL + 1.5, boxT + 2, boxL + 1.5 + w, boxT + 2 + h, `rgba(0,0,0,${0.34 * op})`, null);
        d.rect(boxL, boxT, boxR, boxB, rgba(C_CARD, 0.96 * op), null);
        d.rect(boxL, boxT, boxL + 3, boxB, rgba(BASE, op), null);
        d.line([[boxL + 3, boxT + 1], [boxR - 1, boxT + 1]], `rgba(255,255,255,${0.06 * op})`, 1);
        ctx.save();
        ctx.strokeStyle = rgba(BASE, 0.6 * op); ctx.lineWidth = 1.2;
        ctx.strokeRect(boxL + 0.5, boxT + 0.5, w - 1, h - 1);
        ctx.restore();
        d.text(cd.txt, boxL + 3 + (w - 3) / 2, (boxT + boxB) / 2 + 0.5, { color: cd.col, size: TIMER_PX, weight: 600, font: "sans", align: "center" });
      }
    };

    return {
      events: [],
      under: paint,
      draw: () => {},
      status: (k, live) => {
        const p = live ? live.c : s.c[k];
        return [
          { label: "Line at", value: p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
          { label: "Reach", value: "Latest candle → axis" },
          { label: "Colour", value: "Own amber · no DS Oracle" },
          { label: "Countdown", value: "On the chip, to the bar's close" },
        ];
      },
      legend: [
        { label: "Price line · fades to the axis", color: rgba(BASE, 1), shape: "line" },
        { label: "Anchor bead", color: rgba(BASE, 1), shape: "dot" },
        { label: "Countdown · amber 10–8 s, red 3–1 s", color: rgba(C_AMBER, 1), shape: "box" },
      ],
    };
  },
};
