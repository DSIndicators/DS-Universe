/**
 * DS REPLAY — the chart engine behind every product page's "Run it on real NQ"
 * section (2026-10-09, replaces the 15–30 s screen recordings).
 *
 * THE CONTRACT BETWEEN THE ENGINE AND A STUDY
 *
 *   Session  real NQ 12-26 one-minute bars from the NinjaTrader 8 historical
 *            database, plus the order flow (bid/ask aggressor volume per price)
 *            for the bars the tick database covers. See content/engine.ts for
 *            where they come from and how they were checked.
 *
 *   Study    the web edition of ONE DS tool's rules. `run()` reads the whole
 *            session ONCE and returns everything the tool would have drawn,
 *            each thing stamped with the bar on which the tool would have
 *            drawn it. The engine then shows the chart as it stood at the
 *            replay cursor `k` — nothing a study returns may depend on a bar
 *            after the one it is stamped with. tools/engine-check.ts proves
 *            that for every study by re-running it on truncated sessions and
 *            comparing (a study that fails it repaints, and does not ship).
 *
 * Bar indices are 0-based, oldest first. `k` = the last CLOSED bar. While a
 * bar is forming, `live` carries it (its OHLC so far); tools that run on
 * every price change in NinjaTrader (Calculate.OnPriceChange / OnEachTick)
 * may draw from `live`, everything else draws from closed bars only.
 */

export type Tone = "bull" | "bear" | "neutral" | "gold" | "strongBull" | "strongBear";

export type Session = {
  /** e.g. "2026-09-14" — the trading day replayed */
  day: string;
  sym: string;
  name: string;
  tick: number;
  n: number;
  /** index of the first bar of the replay (the bar ending 09:31 ET) */
  replayFrom: number;
  /** bar CLOSE time, minutes since 2026-01-01 00:00 New York wall clock */
  t: Int32Array;
  o: Float64Array;
  h: Float64Array;
  l: Float64Array;
  c: Float64Array;
  v: Float64Array;
  /** aggressor volume (traded at the ask / at the bid); -1 where no tick data */
  buy: Float64Array;
  sell: Float64Array;
  /** footprint: lowest traded price (in ticks) and per-tick volumes, bottom up */
  fp: { lo: Int32Array; bid: Int32Array[]; ask: Int32Array[] };
  /** intrabar price path in ticks from the open (true trade order where real) */
  path: Int16Array[];
  pathReal: Uint8Array;
  /** any extra feed a study needs (e.g. DS GEX's captured option map) */
  extra?: Record<string, unknown>;
};

export type LiveBar = { i: number; o: number; h: number; l: number; c: number; frac: number };

export type Theme = {
  name: "dark" | "light";
  bg: string;
  grid: string;
  axis: string;
  axisText: string;
  text: string;
  textDim: string;
  crosshair: string;
  up: string;
  down: string;
  neutral: string;
  bull: string;
  bear: string;
  bullStrong: string;
  bearStrong: string;
  gold: string;
  /** a calm panel ground for labels drawn on the chart */
  plate: string;
  plateLine: string;
  sep: string;
};

export type PaneSpec = {
  id: string;
  title: string;
  /** height relative to the price pane (1) */
  weight: number;
  /** fixed scale, or auto from what the study reports */
  range?: [number, number];
  /** horizontal guide values (e.g. 30 / 70) */
  guides?: number[];
  /** decimals on the pane's axis */
  digits?: number;
};

export type LayerSpec = { id: string; label: string; on: boolean; hint?: string };

export type StudyEvent = {
  /** bar on whose close the tool drew / changed it */
  i: number;
  price?: number;
  /** short, set in capitals on the rail — the tool's own word where it has one */
  title: string;
  /** one or two plain sentences: what happened and which rule made it happen */
  text: string;
  tone: Tone;
  /** 1 minor · 2 notable · 3 major (marker size on the rail) */
  weight?: 1 | 2 | 3;
  /** pane the event belongs to (default "price") */
  pane?: string;
};

export type ReadItem = { label: string; value: string; tone?: Tone };

export type PaneView = {
  id: string;
  top: number;
  bottom: number;
  lo: number;
  hi: number;
  y: (v: number) => number;
  v: (y: number) => number;
  spec?: PaneSpec;
};

export type TextOpts = {
  color?: string;
  size?: number;
  align?: CanvasTextAlign;
  base?: CanvasTextBaseline;
  weight?: number;
  font?: "mono" | "sans";
};

export interface Draw {
  ctx: CanvasRenderingContext2D;
  th: Theme;
  /** visible bars (inclusive) */
  i0: number;
  i1: number;
  /** last closed bar */
  k: number;
  live: LiveBar | null;
  /** bar centre x */
  x: (i: number) => number;
  /** bar spacing in px */
  bw: number;
  plotLeft: number;
  plotRight: number;
  width: number;
  price: PaneView;
  pane: (id: string) => PaneView | undefined;
  on: (layer: string) => boolean;
  /** price formatted to the instrument's tick */
  fmt: (p: number) => string;
  tick: number;
  s: Session;

  // drawing kit
  line: (pts: [number, number][], color: string, width?: number, dash?: number[]) => void;
  hline: (pv: PaneView, v: number, x0: number, x1: number, color: string, width?: number, dash?: number[]) => void;
  rect: (x0: number, y0: number, x1: number, y1: number, fill?: string | null, stroke?: string | null, width?: number) => void;
  text: (s: string, x: number, y: number, o?: TextOpts) => number;
  measure: (s: string, o?: TextOpts) => number;
  /** a value tag in a pane's right axis */
  tag: (pv: PaneView, v: number, text: string, color: string, ink?: string) => void;
  /** a series as a polyline (NaN = gap), only bars <= k (or <= live.i when `withLive`) */
  series: (pv: PaneView, vals: ArrayLike<number>, color: string | ((i: number) => string), width?: number, opts?: { step?: boolean; withLive?: number }) => void;
  /** a histogram about `base` */
  hist: (pv: PaneView, vals: ArrayLike<number>, color: (i: number) => string, base?: number, widthFrac?: number) => void;
  /** a quiet label plate with hairline border (no rounded pills, by house rule) */
  plate: (x: number, y: number, lines: { t: string; color?: string; size?: number; weight?: number }[], o?: { align?: "left" | "right" | "center"; anchor?: "top" | "middle" | "bottom"; border?: string; pad?: number; bg?: string }) => { w: number; h: number };
  alpha: (color: string, a: number) => string;
}

export type StudyRun = {
  /** candle colour override (e.g. DS Oracle Spectrum): a Tone (themed) or a
   *  literal colour; null keeps the chart's own up/down colour */
  candle?: (i: number) => Tone | string | null;
  /** extra price range to keep in view (levels near price) */
  priceExtent?: (i0: number, i1: number, k: number) => [number, number] | null;
  paneExtent?: (pane: string, i0: number, i1: number, k: number) => [number, number] | null;
  /** what the tool paints BENEATH the candles (zone fills, profiles, bands) */
  under?: (d: Draw) => void;
  /** what it paints over them (lines, labels, marks), as of d.k / d.live */
  draw: (d: Draw) => void;
  events: StudyEvent[];
  /** inspector at a hovered bar (always <= k) */
  readout?: (i: number) => ReadItem[];
  /** the tool's live read at the cursor */
  status?: (k: number, live: LiveBar | null) => ReadItem[];
  /** marks key */
  legend?: { label: string; color: string; shape?: "line" | "box" | "dot" | "dash" }[];
};

export type StudyDef = {
  slug: string;
  name: string;
  /** one line under the chart: what is being drawn */
  about: string;
  panes?: PaneSpec[];
  layers?: LayerSpec[];
  needs?: { flow?: boolean; extra?: string };
  /** px of open chart right of the newest bar while following it — the
   *  runway a NinjaTrader chart keeps in its right margin. Capped at a third
   *  of the plot, so a phone keeps its candles; studies read the room they
   *  actually got (d.plotRight - d.x(newest)) and lay out to it. */
  rightMargin?: number;
  run: (s: Session) => StudyRun;
};
