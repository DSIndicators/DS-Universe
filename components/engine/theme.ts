import type { Theme, Tone } from "./types";

/**
 * The two chart grounds. DARK is the NinjaTrader black every DS picture is
 * shot on; LIGHT is the #E2E2E2 template of the light cover shoots. Candles
 * and marks use the DS Universe house palette (DS Oracle DsSignature): bull
 * teal #009999, bear violet #A33DFF, neutral #555555, strong cyan #00FFFF,
 * strong magenta #FF00FF — on the light ground the same hues, deepened just
 * enough to hold against #E2E2E2 (never green/red, by house rule).
 */
export const DARK: Theme = {
  name: "dark",
  bg: "#000000",
  grid: "rgba(255,255,255,0.045)",
  axis: "rgba(255,255,255,0.16)",
  axisText: "#8C929B",
  text: "#D9DEE4",
  textDim: "#7C848D",
  crosshair: "rgba(230,236,240,0.42)",
  up: "#009999",
  down: "#A33DFF",
  neutral: "#555555",
  bull: "#009999",
  bear: "#A33DFF",
  bullStrong: "#00FFFF",
  bearStrong: "#FF00FF",
  gold: "#CDA656",
  plate: "rgba(10,12,15,0.86)",
  plateLine: "rgba(255,255,255,0.14)",
  sep: "rgba(255,255,255,0.10)",
};

export const LIGHT: Theme = {
  name: "light",
  bg: "#E2E2E2",
  grid: "rgba(0,0,0,0.05)",
  axis: "rgba(0,0,0,0.22)",
  axisText: "#4A4F57",
  text: "#14171B",
  textDim: "#5C636C",
  crosshair: "rgba(20,24,28,0.45)",
  up: "#007F7F",
  down: "#8A2BE2",
  neutral: "#7A7A7A",
  bull: "#007F7F",
  bear: "#8A2BE2",
  bullStrong: "#00A9B5",
  bearStrong: "#C800C8",
  gold: "#8E6A1F",
  plate: "rgba(236,236,236,0.92)",
  plateLine: "rgba(0,0,0,0.18)",
  sep: "rgba(0,0,0,0.12)",
};

export const toneColor = (th: Theme, t: Tone | string): string => {
  switch (t) {
    case "bull": return th.bull;
    case "bear": return th.bear;
    case "neutral": return th.neutral;
    case "gold": return th.gold;
    case "strongBull": return th.bullStrong;
    case "strongBear": return th.bearStrong;
    default: return t;
  }
};

/** colour with alpha, for #rgb/#rrggbb/rgba() inputs */
export function alpha(color: string, a: number): string {
  if (color.startsWith("#")) {
    let h = color.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h.slice(0, 6), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((x) => x.trim());
    const base = p.length === 4 ? parseFloat(p[3]) : 1;
    return `rgba(${p[0]},${p[1]},${p[2]},${base * a})`;
  }
  return color;
}
