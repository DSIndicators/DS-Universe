/**
 * THE LOUPE — EACH PRODUCT SHOWN BY ITS OWN CHART. Built for the Free Vault
 * first (Tom, 2026-10-08:
 * "the product images are too generic and looks like a fake store front, i
 * want to add our real chart images elegantly displayed, not cheap but
 * unique... you can zoom, crop, etc.").
 *
 * Every picture here is one of Tom's own NinjaTrader 8 screenshots, untouched
 * apart from a crop. The vault shows each one THROUGH A LOUPE: the tile opens
 * magnified on the one place on the chart that proves what the product does
 * (`focus`), and pulls back to the whole chart when it is pointed at or
 * focused — detail first, context on request.
 *
 *   focus.cx, focus.cy  the point to centre on, as fractions of the picture
 *   focus.zw            how much of the picture's WIDTH the magnified view
 *                       shows (0.4 = 40%, i.e. ×2.5)
 *   mark                one place on the chart, named in the chart's own
 *                       words — the label the indicator itself printed there
 *                       (read off the pixels, never paraphrased into a claim)
 *   reading             one line under the plate: what the picture shows
 *
 * THE STORE TOO (Tom, later on 2026-10-08: "i like the chart designs more, so
 * we'll be moving to implement them to the products on the homepage"). The
 * home page's shelves show the paid products the same way (components/
 * BoxCard.tsx `chart`). DS Bulk Replay Downloader has no chart of its own —
 * it is a data utility — so its loupe looks at its own window instead: the
 * real NinjaTrader screenshot inside its product-guide board, magnified on
 * the download list, never on the board's printed headings.
 *
 * Coordinates were measured on the source pixels (2026-10-08). A picture that
 * is re-shot gets a new filename (one-year immutable asset cache), and its
 * focus and mark are measured again.
 *
 * THREE PICTURES ARE CROPPED COPIES (public/vault/*-v1.webp): the DS
 * Stochastics, DS Squeeze and DS MACD screenshots were taken before their
 * 2026-10-05 renames and print "DS ProStochastics", "DS ProSqueeze" and
 * "DS ProMACD" at the top-left of the panel. The copies are cut from the left
 * and top edges at 16:9 so the old name is outside the frame; nothing inside
 * the frame is altered. DS MACD's comes from "DS Media\02 Products\DS MACD\
 * Store Listing\DS ProMACD Raw 1.png" (3840x2160, served at 2560x1440).
 */

export type LoupeShot = {
  src: string;
  w: number;
  h: number;
  focus: { cx: number; cy: number; zw: number };
  /** `below` hangs the label under the point; otherwise it takes the roomier side. */
  mark: { x: number; y: number; text: string; below?: boolean };
  reading: string;
  alt: string;
};

const at = (px: number, of: number) => Math.round((px / of) * 10000) / 10000;

export const SHOTS: Record<string, LoupeShot> = {
  /* ------------------------------------------------- THE FREE VAULT */
  "adaptive-priceline": {
    src: "/charts/adaptive-priceline-2-v2.webp",
    w: 2559,
    h: 1440,
    focus: { cx: at(2090, 2559), cy: at(380, 1440), zw: 0.37 },
    mark: { x: at(1882, 2559), y: at(362, 1440), text: "00:28 to the close", below: true },
    reading: "The line from the live candle to 29145.50 at the axis, the countdown riding on it.",
    alt: "DS Adaptive Price Line on a dark NinjaTrader chart: a teal line from the last candle to the price on the axis, with a 00:28 countdown on the line.",
  },
  "chart-price": {
    src: "/charts/chart-price-3.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(1240, 2560), cy: at(420, 1440), zw: 0.5 },
    mark: { x: at(1235, 2560), y: at(206, 1440), text: "Amber: the tape turning choppy", below: true },
    reading: "28557.25 in large type, in amber as the tape loses efficiency.",
    alt: "DS Chart Price: the last price, 28557.25, in large amber digits at the top of a dark NinjaTrader chart.",
  },
  "ds-258": {
    src: "/charts/ds-258-2.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(2200, 2560), cy: at(300, 1440), zw: 0.27 },
    mark: { x: at(2300, 2560), y: at(318, 1440), text: "29800 — the 00" },
    reading: "29850, 29820, 29800 and 29780 — the 50, 20, 00 and 80 — faint behind price.",
    alt: "DS 258 on a dark NinjaTrader chart: faint horizontal lines at 29850, 29820, 29800 and 29780 behind the candles.",
  },
  parallax: {
    src: "/charts/parallax-2-v2.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(1240, 2560), cy: at(1250, 1440), zw: 0.44 },
    mark: { x: at(1203, 2560), y: at(1160, 1440), text: "×2 — one pool, touched twice" },
    reading: "NQ 15m, 1h, 4h and 1D under the chart, each marking where its stops rest.",
    alt: "DS Parallax: four live higher-timeframe mini-charts of NQ — 15 minute, 1 hour, 4 hour and daily — along the bottom of a dark chart, with liquidity lines and ×2 tags.",
  },
  "session-levels": {
    src: "/charts/session-levels-1.webp",
    w: 1920,
    h: 1080,
    focus: { cx: at(1300, 1920), cy: at(430, 1080), zw: 0.58 },
    mark: { x: at(1290, 1920), y: at(308, 1080), text: "NEW YORK HIGH 30725.50" },
    reading: "New York's high and low carried forward while the next Asia session forms.",
    alt: "DS Session Levels: the New York high and low and the London levels drawn over their sessions on a dark chart, with ASIA HIGH and ASIA LOW forming at the right.",
  },
  stochastics: {
    src: "/vault/stochastics-v1.webp",
    w: 2370,
    h: 1333,
    focus: { cx: at(1650, 2370), cy: at(1000, 1333), zw: 0.53 },
    mark: { x: at(2195, 2370), y: at(729, 1333), text: "STOCH 59 ▲ ARMED" },
    reading: "Four stochastic speeds stacked in one panel, the latch reading ARMED.",
    alt: "DS Stochastics: four stochastic lanes of different speeds stacked in one panel under a dark price chart, with divergence lines drawn on price.",
  },
  squeeze: {
    src: "/vault/squeeze-v1.webp",
    w: 2350,
    h: 1322,
    focus: { cx: at(1520, 2350), cy: at(1080, 1322), zw: 0.46 },
    mark: { x: at(1373, 2350), y: at(817, 1322), text: "REVERSION ▲ HIT THE MEAN" },
    reading: "The momentum wave in teal and violet, its last reversion named in the header.",
    alt: "DS Squeeze: a momentum wave alternating teal above and violet below the zero line in a panel under a rising dark price chart.",
  },
  macd: {
    src: "/vault/macd-v1.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(1960, 2560), cy: at(1150, 1440), zw: 0.53 },
    mark: { x: at(2340, 2560), y: at(930, 1440), text: "MACD-V −55 ▼ REVERSING" },
    reading: "MACD-V at −55, the line through its signal and the ribbon reading REVERSING.",
    alt: "DS MACD: MACD and signal lines with a teal and violet histogram on the MACD-V scale, in a panel under a dark price chart.",
  },
  vwap: {
    src: "/charts/vwap-1.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(2080, 2560), cy: at(1050, 1440), zw: 0.36 },
    mark: { x: at(2230, 2560), y: at(1017, 1440), text: "Reach: 60 · 25 · 5%" },
    reading: "The forward view in the margin: how far price traveled 60, 25 and 5% of the time.",
    alt: "DS VWAP: a panel of measured VWAP bands in teal and violet, opening into a fan of reach contours in the right margin.",
  },
  /* ------------------------------------------------------- THE STORE */
  zones: {
    src: "/charts/zones-1-v2.webp",
    w: 1920,
    h: 1080,
    focus: { cx: at(1330, 1920), cy: at(560, 1080), zw: 0.52 },
    mark: { x: at(1515, 1920), y: at(790, 1080), text: "DEMAND 30170.50 · DEFENDED 6×" },
    reading: "Supply at 30231.00 lit as price comes up to it, demand at 30170.50 defended six times.",
    alt: "DS Zones on a dark NinjaTrader chart: a supply zone above price and a demand zone below it, each with its own volume profile and state caption.",
  },
  iceberg: {
    src: "/charts/iceberg-1-v2.webp",
    w: 1920,
    h: 1080,
    focus: { cx: at(1300, 1920), cy: at(520, 1080), zw: 0.52 },
    mark: { x: at(1635, 1920), y: at(340, 1080), text: "ICE OFFER 30069.75 · 8×" },
    reading: "An ICE OFFER tested eight times above the range, an ICE BID under it.",
    alt: "DS Iceberg on a dark chart: a violet iceberg level above a sideways range and a teal one below it, each with its price and test count.",
  },
  oracle: {
    src: "/charts/oracle-2.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(1500, 2560), cy: at(520, 1440), zw: 0.5 },
    mark: { x: at(1400, 2560), y: at(369, 1440), text: "Neural Line" },
    reading: "The Neural Line through price, the candles colored by the five-state Spectrum.",
    alt: "DS Oracle on a dark chart: a smooth line through price turning from teal to violet as price rolls over, with candles in five shades.",
  },
  gex: {
    src: "/charts/gex-2.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(2050, 2560), cy: at(760, 1440), zw: 0.38 },
    mark: { x: at(2330, 2560), y: at(530, 1440), text: "Call Wall 28049.51" },
    reading: "Call Wall, Max Pain, the 0DTE put wall and the Gamma Flip, each label riding its line.",
    alt: "DS GEX on a dark chart: horizontal dealer-gamma levels labeled Call Wall, Max Pain / EM Low, PW 0DTE and Gamma Flip at the right edge.",
  },
  flow: {
    src: "/charts/flow-2.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(1850, 2560), cy: at(800, 1440), zw: 0.42 },
    mark: { x: at(2093, 2560), y: at(812, 1440), text: "NEW YORK" },
    reading: "Session mode: Asia, London and New York, each with its own profile and totals.",
    alt: "DS Flow on a dark chart: a volume profile for each Asia, London and New York session, with buy and sell totals under each.",
  },
  prorsi: {
    src: "/charts/prorsi-2-v2.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(1880, 2560), cy: at(480, 1440), zw: 0.5 },
    mark: { x: at(2365, 2560), y: at(775, 1440), text: "RSI 21 ×3" },
    reading: "Supply tagged RSI 78 over price, demand tagged RSI 21 and RSI 14 below it.",
    alt: "DS ProRSI on a dark chart: RSI zones drawn on price — a violet supply zone above and teal demand zones below — with the RSI panel underneath.",
  },
  proliquidityhunter: {
    src: "/charts/proliquidityhunter-1.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(1950, 2560), cy: at(1230, 1440), zw: 0.38 },
    mark: { x: at(2294, 2560), y: at(1190, 1440), text: "MAJOR 53% 30759.75" },
    reading: "The pool map under price, the header reading TAKEN ▲ 30669.00 · PENDING.",
    alt: "DS ProLiquidityHunter: a panel under the price chart mapping liquidity pools as horizontal bands, with price drawn as a line through them.",
  },
  proheikinashi: {
    src: "/charts/proheikinashi-1.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(1650, 2560), cy: at(1080, 1440), zw: 0.45 },
    mark: { x: at(2145, 2560), y: at(846, 1440), text: "UP ▲ · 11 bars · HOLDING" },
    reading: "3 OF 3 UP, the header reading UP ▲ · 11 bars · HOLDING, the chart's flip at 29016.75.",
    alt: "DS ProHeikinAshi: a panel of teal and violet bars under the price chart, with a FLIP level at its right edge.",
  },
  protrendrange: {
    src: "/charts/protrendrange-1.webp",
    w: 2560,
    h: 1440,
    focus: { cx: at(1480, 2560), cy: at(1230, 1440), zw: 0.46 },
    mark: { x: at(2283, 2560), y: at(1133, 1440), text: "TREND ▲ · 152 bars" },
    reading: "An uptrend 152 bars old, each pullback filled as a pocket below the center line.",
    alt: "DS ProTrendRange: a teal trend line in a panel under a rising price chart, with pullback pockets filled beneath it.",
  },
  "bulk-replay-downloader": {
    src: "/shots/0920/bulk-replay-downloader-1.webp",
    w: 2560,
    h: 1900,
    focus: { cx: at(900, 2560), cy: at(960, 1900), zw: 0.5 },
    mark: { x: at(929, 2560), y: at(832, 1900), text: "Downloading 11.8 MB" },
    reading: "Instruments queued, then every file with its own progress: done, downloading, queued, already saved.",
    alt: "The DS Bulk Replay Downloader window in NinjaTrader: a list of instruments on the left and a list of replay files with progress bars on the right.",
  },
};

export const shotFor = (slug: string): LoupeShot | undefined => SHOTS[slug];

/**
 * THE LOUPE, as numbers. For a frame of aspect `a` (width / height) showing a
 * picture with `object-fit: cover`, the transform that centres the picture's
 * focus point at the requested magnification — clamped so the picture always
 * fills the frame (no ground ever shows at an edge).
 *
 * Units are FRAME units (1 = the frame's width for x, its height for y), so
 * the result is a CSS `translate(%) scale()` that holds at any size. The mark
 * is returned in the same units, already moved by the transform, so a label
 * can be pinned to it.
 */
export function loupe(shot: LoupeShot, a: number) {
  const r = shot.w / shot.h;
  const iw = Math.max(1, r / a); // picture width in frame widths
  const ih = Math.max(1, a / r); // picture height in frame heights
  const tx = 0.5 + (shot.focus.cx - 0.5) * iw;
  const ty = 0.5 + (shot.focus.cy - 0.5) * ih;
  const z = Math.max(1, 1 / (shot.focus.zw * iw));
  const clamp = (v: number, size: number) => {
    const lim = (z * size) / 2 - 0.5;
    return Math.min(lim, Math.max(-lim, v));
  };
  const dx = clamp(-z * (tx - 0.5), iw);
  const dy = clamp(-z * (ty - 0.5), ih);
  const mx0 = 0.5 + (shot.mark.x - 0.5) * iw;
  const my0 = 0.5 + (shot.mark.y - 0.5) * ih;
  const mx = 0.5 + z * (mx0 - 0.5) + dx;
  const my = 0.5 + z * (my0 - 0.5) + dy;
  const round = (v: number) => Math.round(v * 10000) / 10000;
  return {
    z: round(z),
    /** The picture's own box, in % of the frame: the WHOLE picture, centred,
     *  overflowing the frame on its long side. (object-fit: cover would paint
     *  only the part inside the frame, and a magnified focus near an edge
     *  would then pull ground into view.) */
    box: { w: round(iw * 100), h: round(ih * 100), l: round(((1 - iw) / 2) * 100), t: round(((1 - ih) / 2) * 100) },
    /** Picture widths per frame width — for `sizes`. */
    iw: round(iw),
    // translate() is a % of the element it moves — the picture's box — so the
    // frame-unit offsets are divided by the box's size.
    transform: `translate(${round((dx / iw) * 100)}%, ${round((dy / ih) * 100)}%) scale(${round(z)})`,
    /** The mark in the magnified view, in frame fractions. */
    mark: { x: round(mx), y: round(my), visible: mx > 0.04 && mx < 0.96 && my > 0.06 && my < 0.94 },
    /** The mark in the whole picture (after the pull-back), in frame fractions. */
    markFull: { x: round(mx0), y: round(my0) },
  };
}
