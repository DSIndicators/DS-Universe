import type { Draw, StudyDef, StudyEvent } from "../types";
import { hhmm, isRTH } from "../ta";

/**
 * DS 258 — web edition. Source: DS258.cs (Build 2026-10-07), shipped defaults.
 *
 * The tool calculates nothing from bars: on every repaint it draws each
 * enabled level of the 100-point block inside the visible price range —
 * 00 gold, 20 blue, 50 platinum, 80 rose — full width, behind the candles.
 *   · Opacity 20 on top of each colour's own alpha.
 *   · Declutter 12 px: a block shorter than 12 px hides the 20s and 80s,
 *     shorter than 6 px hides the 50s; under 2 px nothing is drawn.
 *   · On a light ground the shipped colours give way to their deep tones
 *     (190,110,0 · 0,70,190 · 40,48,64 · 184,0,110) when those read better —
 *     the same WCAG contrast test as FamilyColor()/PickTone().
 *
 * The replay's narration is the map being READ, not the tool calculating:
 * a close through a 00 or a 50 (and a rejection at a 00) is marked so the
 * visitor can watch price travel the blocks. The tool itself draws no marks.
 */

const SHIPPED = [[255, 196, 0], [46, 147, 255], [224, 233, 247], [255, 62, 168]];
const DEEP = [[190, 110, 0], [0, 70, 190], [40, 48, 64], [184, 0, 110]];
const OPACITY = 0.2, BLOCK = 100, DECLUTTER = 12, MIN_PX = 2;
const NAMES = ["00", "20", "50", "80"];

const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
function shown(rgb: number[], op: number, bg: number[]) {
  const mix = (j: number) => lin(bg[j] + (rgb[j] - bg[j]) * op);
  const l1 = 0.2126 * mix(0) + 0.7152 * mix(1) + 0.0722 * mix(2);
  const l0 = 0.2126 * lin(bg[0]) + 0.7152 * lin(bg[1]) + 0.0722 * lin(bg[2]);
  return l1 >= l0 ? (l1 + 0.05) / (l0 + 0.05) : (l0 + 0.05) / (l1 + 0.05);
}
function familyColor(f: number, bg: number[], boost = 1) {
  const p = shown(DEEP[f], OPACITY, bg) > shown(SHIPPED[f], OPACITY, bg) ? DEEP[f] : SHIPPED[f];
  return `rgba(${p[0]},${p[1]},${p[2]},${Math.min(1, OPACITY * boost)})`;
}
const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

function levelName(p: number) {
  const r = ((p % BLOCK) + BLOCK) % BLOCK;
  return NAMES[[0, 20, 50, 80].indexOf(Math.round(r))] ?? "";
}

export const study: StudyDef = {
  slug: "ds-258",
  name: "DS 258",
  about: "The 00 / 20 / 50 / 80 map of every 100-point block, at the shipped 20% opacity.",
  layers: [{ id: "emph", label: "Emphasize the map", on: false, hint: "Draws the map at 3x opacity so it reads on a small screen. The shipped default is 20." }],
  run(s) {
    const events: StudyEvent[] = [];
    // narration: closes through 00/50, rejections at 00 — RTH only, one per level per 20 bars
    const last = new Map<number, number>();
    for (let i = Math.max(1, s.replayFrom - 1); i < s.n; i++) {
      if (!isRTH(s, i)) continue;
      const pc = s.c[i - 1], c = s.c[i];
      for (const step of [50]) {
        const lo = Math.min(pc, c), hi = Math.max(pc, c);
        for (let lv = Math.ceil(lo / step) * step; lv <= hi; lv += step) {
          if (lv === pc || (lv - pc) * (lv - c) >= 0) continue; // must be strictly crossed by the closes
          if (i - (last.get(lv) ?? -99) < 20) continue;
          last.set(lv, i);
          const up = c > pc, nm = levelName(lv);
          // the next level of the map in the direction of the close
          const offs = [0, 20, 50, 80, 100];
          const r = ((lv % BLOCK) + BLOCK) % BLOCK, base = lv - r;
          const nextLv = up ? base + offs[offs.indexOf(r) + 1] : r === 0 ? base - 20 : base + offs[offs.indexOf(r) - 1];
          const nextNm = levelName(nextLv);
          events.push({
            i, price: lv, tone: up ? "bull" : "bear", weight: nm === "00" ? 2 : 1,
            title: `${up ? "ABOVE" : "BELOW"} THE ${nm}`,
            text: `${hhmm(s, i)} — the bar closed ${up ? "above" : "below"} ${lv.toLocaleString("en-US")}, the ${nm === "00" ? "gold 00 that starts a new block" : "platinum 50 at the middle of the block"}. Next on the map ${up ? "above" : "below"}: ${nextLv.toLocaleString("en-US")}, the ${nextNm}.`,
          });
        }
      }
      // rejection at a 00: the bar reached it and closed back at least 5 points away
      const h = s.h[i], l = s.l[i];
      for (const lv of [Math.floor(h / 100) * 100, Math.ceil(l / 100) * 100]) {
        const touchedFromBelow = h >= lv && c < lv - 5 && s.o[i] < lv;
        const touchedFromAbove = l <= lv && c > lv + 5 && s.o[i] > lv;
        if ((touchedFromBelow || touchedFromAbove) && i - (last.get(lv + 0.5) ?? -99) >= 20) {
          last.set(lv + 0.5, i);
          events.push({
            i, price: lv, tone: "gold", weight: 2,
            title: "TURNED AT THE 00",
            text: `${hhmm(s, i)} — the bar reached ${lv.toLocaleString("en-US")}, the gold 00, and closed ${touchedFromBelow ? "back below" : "back above"} it. The map shows where a level is; what price does there is the trader's read.`,
          });
        }
      }
    }
    events.sort((a, b) => a.i - b.i);

    const drawMap = (d: Draw) => {
      const pv = d.price;
      const bg = hexRgb(d.th.bg);
      const boost = d.on("emph") ? 3 : 1;
      const pxBlock = Math.abs(pv.y(pv.lo + BLOCK) - pv.y(pv.lo));
      if (pxBlock < MIN_PX) return;
      const show2080 = pxBlock >= DECLUTTER, show50 = pxBlock >= DECLUTTER * 0.5;
      const cols = [0, 1, 2, 3].map((f) => familyColor(f, bg, boost));
      for (let kb = Math.floor(pv.lo / BLOCK); kb <= Math.ceil(pv.hi / BLOCK); kb++) {
        const base = kb * BLOCK;
        d.hline(pv, base, 0, d.plotRight, cols[0]);
        if (show2080) d.hline(pv, base + 20, 0, d.plotRight, cols[1]);
        if (show50) d.hline(pv, base + 50, 0, d.plotRight, cols[2]);
        if (show2080) d.hline(pv, base + 80, 0, d.plotRight, cols[3]);
      }
    };

    return {
      events,
      under: drawMap,
      draw: () => {},
      status: (k, live) => {
        const p = live ? live.c : s.c[k];
        const base = Math.floor(p / BLOCK) * BLOCK;
        const into = p - base;
        const below = [0, 20, 50, 80].filter((o) => o <= into).pop()!;
        const above = [20, 50, 80, 100].find((o) => o > into)!;
        return [
          { label: "Block", value: `${base.toLocaleString("en-US")} – ${(base + 100).toLocaleString("en-US")}` },
          { label: "Into the block", value: `${into.toFixed(2)} pts` },
          { label: "Level below", value: `${(base + below).toLocaleString("en-US")} · ${NAMES[[0, 20, 50, 80].indexOf(below)]}` },
          { label: "Level above", value: `${(base + above).toLocaleString("en-US")} · ${above === 100 ? "00" : NAMES[[0, 20, 50, 80].indexOf(above)]}` },
        ];
      },
      legend: [
        { label: "00", color: "rgb(255,196,0)", shape: "line" },
        { label: "20", color: "rgb(46,147,255)", shape: "line" },
        { label: "50", color: "rgb(224,233,247)", shape: "line" },
        { label: "80", color: "rgb(255,62,168)", shape: "line" },
      ],
    };
  },
};
