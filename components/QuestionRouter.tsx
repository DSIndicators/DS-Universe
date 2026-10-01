"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * THE CHART READER — a small vertical instrument under the hero buttons.
 *
 * History. 2026-09-27: first built as a left-to-right router (question tags →
 * an "NT8 CHART" hub → a circle naming the tool). Tom, 2026-09-28: "too
 * similar [to the reference] ... it sounds way too simple, we need to make our
 * indicators sound better." He asked for it vertical, top to bottom:
 * the question, an empty NT8 chart, "DS Zones — Living Zones", and in place of
 * the circle "a simple holographic living zone".
 *
 * THE STORY, top to bottom, on one spine:
 *   ASK    five questions a trader brings (LEVELS · SIZE · GAMMA · FLOW · TREND)
 *   CHART  the same price on a bare NT8 chart — nothing on it yet
 *   DS     the tool that answers it, with its name for what it draws
 *   READ   that price again, with the tool's drawing projected over it
 * A pulse runs down the spine and lights each stage in turn; then the bottom
 * chart replays bar by bar and the drawing reacts to it.
 *
 * THE READ IS COMPUTED, NOT ANIMATED FOR SHOW. Each drawing is derived from
 * the candles revealed so far, the way the indicator itself would:
 *   Zones   — the zone's state machine (FRESH → APPROACHING → TESTING →
 *             DEFENDED n×, or BREAKING), a diamond on every bar that tests it
 *             and the zone's own buy/sell profile, from the bars it has seen
 *             (its read turns from BALANCED to ABSORBED once sellers hitting
 *             it have been held — illustrative volume, never market data);
 *   Iceberg — a ceiling confirmed at its second rejected test, a fracture
 *             on every test, the count rising as wicks are turned back;
 *   GEX     — the nearest level (Call Wall / Gamma Flip / Put Wall) lights up;
 *   Flow    — the buy/sell profile accumulates bar by bar; the heaviest row
 *             is flagged;
 *   Oracle  — the Neural Line is drawn through price and the side flips from
 *             SHORT to LONG where price crosses it (a Major signal marker).
 * Every name, state and label is the product's own (content/products.ts).
 * The candles are a drawn illustration — labelled so — never market data,
 * and there are no results or outcomes anywhere. The only figures are the
 * ones the products' captions print, computed from the drawn bars: a test
 * count, and (since 2026-10-01) DS Zones' buy/sell share.
 *
 * 2026-10-01 — DS ZONES AND DS ICEBERG REDRAWN to their visual redesign
 * (Build 2026-10-01), read from the builds and their READMEs:
 *   Zones   — a faint band behind the candles: the ACTION EDGE (the side
 *             price meets — a demand zone's roof) solid, the far edge dotted,
 *             a stem at its origin; a diamond on the action edge at every bar
 *             that tested it, FILLED when price was rejected back out, HOLLOW
 *             when the bar closed inside; the zone's own volume profile at its
 *             right end, teal buying toward price and violet selling against
 *             the wall, its heaviest row ticked (the POC). The readout is the
 *             caption: DEMAND, the state word (DEFENDED counts the closed bars
 *             that held), the buy | sell rule with its tick, and the read
 *             (ABSORBED / BALANCED). Cyan while price is approaching or
 *             testing, as in the product; the slice price has eaten glows
 *             while it tests.
 *   Iceberg — was a support RUNWAY drawn in violet; the build now draws
 *             support teal (ICE BID) and resistance violet (ICE OFFER), so the
 *             route is an ICE OFFER, keeping the tabs' teal/violet rhythm. A
 *             level needs two clustered tests, so nothing is drawn until the
 *             second rejection; then: an exact line with a soft tolerance tint
 *             from its first test (a short post), a fracture just past each
 *             wick tip running into the ice, and the keel iceberg on the
 *             waterline in the runway past the last bar. TESTING for six bars
 *             after the latest test: the iceberg and the newest fracture in
 *             the strong colour (magenta), that fracture ringed.
 *
 * HOLOGRAPHIC, WITHOUT GLOW. The projection is made of crisp things only: a
 * scan-line fill, one-pixel edges with a faint offset "ghost" edge in the
 * opposite house colour, corner registration marks, and a slow sheen that
 * passes over the drawing. No blur, no shadow.
 *
 * Wide screens only (lg+): below that the hero stacks and there is no well to
 * fill. With reduced motion the stages are all lit, the read is shown whole,
 * nothing moves or cycles, and the tabs still switch it.
 */

type Kind = "zones" | "iceberg" | "gex" | "flow" | "oracle";

type Route = {
  kind: Kind;
  tag: string;
  question: string;
  product: string;
  slug: string;
  title: string; // the product's name for what it draws
  line: string; // one line, from the product's own copy
  tone: "bull" | "bear";
  closes: number[];
  lows?: Record<number, number>;
  highs?: Record<number, number>;
  /** The price range this chart is scaled to (its candles and its levels). */
  range: [number, number];
};

const ROUTES: Route[] = [
  {
    kind: "zones",
    tag: "LEVELS",
    question: "Is this level holding?",
    product: "DS Zones",
    slug: "zones",
    title: "Living Zones",
    line: "Tracked tick by tick: FRESH to DEFENDED or BREAKING",
    tone: "bull",
    closes: [74, 69, 71, 64, 59, 61, 53, 48, 45, 47, 41, 38, 45, 50, 47, 55, 60, 58],
    range: [28, 79],
  },
  {
    kind: "iceberg",
    tag: "SIZE",
    question: "Where was size hidden?",
    product: "DS Iceberg",
    slug: "iceberg",
    title: "Absorption Runways",
    line: "ICE OFFER above price, ICE BID below, every test marked",
    tone: "bear",
    // A rally turned back three times at one ceiling (the wicks in `highs`),
    // then drifting off it: an ICE OFFER, confirmed at its second test.
    closes: [42, 47, 44, 50, 54, 51, 56, 53, 50, 55, 52, 49, 54, 50, 47, 51, 46, 43],
    highs: { 6: 62.6, 9: 62.0, 12: 62.3 },
    range: [34, 74],
  },
  {
    kind: "gex",
    tag: "GAMMA",
    question: "Where are the options walls?",
    product: "DS GEX",
    slug: "gex",
    title: "Dealer Gamma Map",
    line: "Call and Put Walls, Gamma Flip and the Expected Move",
    tone: "bull",
    closes: [50, 56, 52, 60, 66, 62, 71, 76, 70, 63, 57, 51, 45, 39, 33, 29, 36, 43],
    range: [21, 85],
  },
  {
    kind: "flow",
    tag: "FLOW",
    question: "Who won inside the candle?",
    product: "DS Flow",
    slug: "flow",
    title: "Candle X-Ray",
    line: "Buy vs sell volume at every price, heavy rows flagged",
    tone: "bear",
    closes: [38, 43, 41, 47, 52, 50, 55, 58, 56, 57, 54, 56, 58, 61, 59, 64, 62, 67],
    range: [32, 72],
  },
  {
    kind: "oracle",
    tag: "TREND",
    question: "Which side should I be on?",
    product: "DS Oracle",
    slug: "oracle",
    title: "Neural Line",
    line: "Above the Neural Line, look long; below it, look short",
    tone: "bull",
    closes: [46, 42, 39, 36, 35, 37, 36, 41, 46, 49, 47, 52, 56, 53, 58, 62, 60, 66],
    range: [31, 70],
  },
];

// House palette (tailwind.config.ts / the DsSignature theme).
const TEAL = "#19F2E6";
const ONLINE = "#2EE884"; // status green: the NT8 light reads "online"
const VIOLET = "#B45CFF";
const BULL = "#009999";
const BEAR = "#A33DFF";
const S_BULL = "#00FFFF";
const S_BEAR = "#FF00FF";
const NEUTRAL = "#555555";
const LINE = "#2C3139";
const INK = "#ECEEF1"; // the products' text ink: Zones' diamonds, the rule's tick, the POC tick
const GREY = "#3A4049";

// Timeline, in 120 ms ticks. The stages light at 0/4/8/12; the read replays
// one candle per tick from 12; the route holds, then the next one starts.
const TICK = 120;
const LIT = [0, 4, 8, 12];
const N = 18;
const ROUTE_TICKS = LIT[3] + N + 22; // ≈ 6.2 s a route
const DONE = ROUTE_TICKS;

type Candle = { o: number; h: number; l: number; c: number };

function candlesOf(r: Route): Candle[] {
  return r.closes.map((c, i) => {
    const o = i === 0 ? c + 3 : r.closes[i - 1];
    const w = 1.6 + ((i * 7) % 5) * 0.7;
    const l = r.lows?.[i] ?? Math.min(o, c) - w;
    const h = r.highs?.[i] ?? Math.max(o, c) + w * 0.8;
    return { o, c, h, l };
  });
}

// --- the reads, computed from what has been revealed -----------------------

const ZONE = { lo: 30, hi: 40 };
type ZoneState = "FRESH" | "APPROACHING" | "TESTING" | "DEFENDED" | "BREAKING";
/** The bars that traded into the zone: `held` = rejected back out above the
 *  roof (a filled diamond); otherwise the bar closed inside (a hollow one). */
const zoneTests = (cs: Candle[]) =>
  cs.map((c, i) => ({ i, c, held: c.c > ZONE.hi })).filter(({ c }) => c.l <= ZONE.hi);
function zoneRead(cs: Candle[]): { state: ZoneState; defended: number } {
  // DEFENDED counts closed bars that traded in and still closed on the zone's
  // own side of its far edge — back out of it, or still inside it.
  const defended = zoneTests(cs).filter(({ c }) => c.c >= ZONE.lo).length;
  if (!cs.length) return { state: "FRESH", defended };
  const last = cs[cs.length - 1];
  if (last.c < ZONE.lo) return { state: "BREAKING", defended };
  if (defended && last.c > ZONE.hi + 6) return { state: "DEFENDED", defended };
  if (last.l <= ZONE.hi) return { state: "TESTING", defended };
  if (last.l <= ZONE.hi + 10) return { state: "APPROACHING", defended };
  return { state: "FRESH", defended };
}
/** The zone's own volume profile, one row a point: the volume it was born
 *  with, plus every revealed bar that traded through the row — up bars as
 *  buying, down bars as selling. Illustrative units, never shown. */
const ZONE_BASE = [
  { v: 31.25, buy: 0.5, sell: 0.9 },
  { v: 33.75, buy: 0.9, sell: 1.4 },
  { v: 36.25, buy: 1.2, sell: 1.6 },
  { v: 38.75, buy: 0.7, sell: 1.0 },
];
function zoneProfile(cs: Candle[]) {
  const rows = ZONE_BASE.map((r) => ({ ...r }));
  for (const c of cs)
    for (const r of rows)
      if (c.l <= r.v + 1.25 && Math.min(c.h, ZONE.hi) >= r.v - 1.25) {
        if (c.c >= c.o) r.buy += 1;
        else r.sell += 1;
      }
  return rows;
}

// An ICE OFFER: a ceiling. A test is a bar whose wick reaches the band while
// its body stays well below it — a rejection.
const ICE = { lo: 61.5, hi: 64, level: 62.75 };
const iceHits = (cs: Candle[]) =>
  cs.map((c, i) => ({ c, i })).filter(({ c }) => c.h >= ICE.lo && Math.max(c.o, c.c) < ICE.lo - 4);

const GEX = [
  { v: 82, label: "CALL WALL", color: TEAL },
  { v: 55, label: "GAMMA FLIP", color: "#A3ABB3" },
  { v: 24, label: "PUT WALL", color: VIOLET },
];
const EM = { lo: 31, hi: 75 };

function neural(cs: Candle[]) {
  let e = 47;
  return cs.map((c) => (e = e + 0.28 * (c.c - e)));
}

function spectrum(cs: Candle[], i: number) {
  const s = cs[i].c - cs[Math.max(0, i - 3)].c;
  if (s > 8) return S_BULL;
  if (s > 2) return BULL;
  if (s > -2) return NEUTRAL;
  if (s > -8) return BEAR;
  return S_BEAR;
}

// ---------------------------------------------------------------------------

export function QuestionRouter({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  // One state object, so a tick and a route change can never disagree (and
  // the updater stays pure under React's development double-invoke).
  const [clock, setClock] = useState({ route: 0, tick: 0 });
  const [held, setHeld] = useState(false);
  const [calm, setCalm] = useState(false);
  // Runs only while on screen: the home page carries two instances (one for
  // wide screens, one for phones and tablets) and the hidden one — or one
  // scrolled away — must not tick.
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setCalm(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    if (calm || !seen) return;
    const id = window.setInterval(() => {
      setClock((c) =>
        c.tick < DONE ? { ...c, tick: c.tick + 1 } : held ? c : { route: (c.route + 1) % ROUTES.length, tick: 0 },
      );
    }, TICK);
    return () => window.clearInterval(id);
  }, [calm, held, seen]);

  const pick = (i: number) => {
    setHeld(true);
    setClock((c) => (c.route === i ? c : { route: i, tick: 0 }));
  };

  const { route, tick } = clock;
  const t = calm ? DONE : tick;
  const r = ROUTES[route];
  const tone = r.tone === "bull" ? TEAL : VIOLET;
  const ghost = r.tone === "bull" ? VIOLET : TEAL;
  const lit = LIT.map((at) => t >= at);
  const all = candlesOf(r);
  const shown = all.slice(0, Math.max(0, Math.min(N, t - LIT[3] + 1)));

  return (
    <div
      ref={box}
      className={`rounded-[10px] border border-line bg-[rgba(14,17,21,0.72)] backdrop-blur-[2px] ${className}`}
      onMouseLeave={() => setHeld(false)}
    >
      {/* head */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
          Ask <span className="text-slate">→</span> Chart <span className="text-slate">→</span> Read
        </span>
        {/* The NT8 light: a status-green "online" light, glowing and pulsing.
            (Tom, 2026-09-28: NinjaTrader's orange read as red, i.e. offline —
            "change it to green for online instead".) */}
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping" style={{ background: ONLINE }} />
            <span
              className="relative h-1.5 w-1.5 rounded-full"
              style={{ background: ONLINE, boxShadow: "0 0 6px 1px rgba(46,232,132,0.7), 0 0 14px 2px rgba(46,232,132,0.3)" }}
            />
          </span>
          NT8
        </span>
      </div>

      <div className="grid grid-cols-[9px_minmax(0,1fr)] gap-x-3.5 px-4 pb-4 pt-3.5">
        {/* ------------------------------------------------ 01 ASK */}
        <Spine on={lit[0]} next={lit[1]} tone={tone} />
        <div className="pb-3.5">
          <div className="grid grid-cols-5 gap-1.5" role="tablist" aria-label="Pick a question">
            {ROUTES.map((q, i) => {
              const on = i === route;
              const c = q.tone === "bull" ? TEAL : VIOLET;
              return (
                <button
                  key={q.tag}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onMouseEnter={() => pick(i)}
                  onFocus={() => pick(i)}
                  onClick={() => pick(i)}
                  className="h-6 rounded-[3px] border font-mono text-[8.5px] tracking-[0.06em] min-[400px]:text-[9px] min-[400px]:tracking-[0.12em] transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-slate"
                  style={{
                    borderColor: on ? c : LINE,
                    color: on ? c : "#7C848D",
                    background: on ? `${c}12` : "transparent",
                  }}
                >
                  {q.tag}
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[14px] leading-tight text-ink" aria-live="polite">
            {r.question}
          </p>
        </div>

        {/* ------------------------------------------------ 02 CHART */}
        <Spine on={lit[1]} next={lit[2]} tone={tone} />
        <div className="pb-3.5">
          <div
            className="relative overflow-hidden rounded-[5px] border border-line bg-[#0B0E12] transition-opacity duration-500"
            style={{ opacity: lit[1] ? 1 : 0.45 }}
          >
            <span className="block px-2 pt-1.5 font-mono text-[8.5px] leading-none tracking-[0.14em] text-mute">
              NT8 · EMPTY CHART
            </span>
            <svg viewBox="0 0 360 44" className="block w-full" aria-hidden="true">
              <Grid w={360} h={44} />
              <Candles cs={all} h={44} top={5} bottom={5} x0={14} dx={19.4} color={() => GREY} w={5.5} range={r.range} />
            </svg>
          </div>
        </div>

        {/* ------------------------------------------------ 03 DS */}
        <Spine on={lit[2]} next={lit[3]} tone={tone} />
        <div className="pb-3.5 transition-opacity duration-500" style={{ opacity: lit[2] ? 1 : 0.45 }}>
          {/* Name and title never break inside themselves; on a narrow phone
              the title moves to its own line whole. */}
          <p className="flex min-h-[2.6em] flex-wrap content-start items-baseline gap-x-2 gap-y-0.5 text-[15px] leading-tight min-[360px]:min-h-0">
            <Link
              href={`/products/${r.slug}`}
              className="whitespace-nowrap text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
            >
              {r.product}
            </Link>
            <span className="whitespace-nowrap">
              <span className="text-mute">—</span> <span style={{ color: tone }}>{r.title}</span>
            </span>
          </p>
          {/* Two lines kept for it on a phone so the panel does not jump
              height from one question to the next; one line from 400px. */}
          <p className="mt-1 min-h-[2.6em] text-[12px] leading-[1.3] text-slate text-pretty min-[400px]:min-h-0 min-[400px]:truncate">
            {r.line}
          </p>
        </div>

        {/* ------------------------------------------------ 04 READ */}
        <Spine on={lit[3]} tone={tone} last />
        <div>
          <Holo
            uid={uid}
            r={r}
            cs={shown}
            tone={tone}
            ghost={ghost}
            on={lit[3]}
            calm={calm}
          />
        </div>
      </div>
    </div>
  );
}

// --- pieces ----------------------------------------------------------------

function Spine({ on, next, tone, last }: { on: boolean; next?: boolean; tone: string; last?: boolean }) {
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <span
        className="mt-[8px] h-[9px] w-[9px] shrink-0 rounded-full border transition-colors duration-300"
        style={{ borderColor: on ? tone : LINE, background: on ? tone : "transparent" }}
      />
      {!last && (
        <span
          className={`mt-1.5 w-px flex-1 ${next ? "qr-spine" : ""}`}
          style={next ? ({ "--qr": tone } as CSSProperties) : { background: LINE }}
        />
      )}
    </div>
  );
}

function Grid({ w, h }: { w: number; h: number }) {
  const xs = [w * 0.25, w * 0.5, w * 0.75];
  const ys = [h * 0.33, h * 0.66];
  return (
    <g stroke="#161A1F" strokeWidth="1">
      {xs.map((x) => (
        <line key={`x${x}`} x1={x} x2={x} y1={0} y2={h} />
      ))}
      {ys.map((y) => (
        <line key={`y${y}`} x1={0} x2={w} y1={y} y2={y} />
      ))}
    </g>
  );
}

/** A price → the drawing's height, within the route's range. */
const yOf = (v: number, h: number, top: number, bottom: number, [lo, hi]: [number, number]) =>
  top + (1 - (v - lo) / (hi - lo)) * (h - top - bottom);

function Candles({
  cs,
  h,
  top,
  x0,
  dx,
  w,
  color,
  fill = 1,
  range,
  bottom = 6,
}: {
  range: [number, number];
  bottom?: number;
  cs: Candle[];
  h: number;
  top: number;
  x0: number;
  dx: number;
  w: number;
  color: (i: number, c: Candle) => string;
  fill?: number;
}) {
  return (
    <g>
      {cs.map((c, i) => {
        const x = x0 + i * dx;
        const col = color(i, c);
        const Y = (v: number) => yOf(v, h, top, bottom, range);
        const yo = Y(c.o);
        const yc = Y(c.c);
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={Y(c.h)} y2={Y(c.l)} stroke={col} strokeWidth="1" />
            <rect
              x={x - w / 2}
              y={Math.min(yo, yc)}
              width={w}
              height={Math.max(1, Math.abs(yc - yo))}
              fill={col}
              fillOpacity={fill}
              stroke={col}
              strokeWidth="0.75"
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * DS Iceberg's keel: the classic iceberg pictogram on its level's waterline —
 * a peaked tip above the line (its sunlit face lighter), the long jagged mass
 * below. Drawn at `s` times its unit size (the product scales it with the
 * volume the level has absorbed).
 */
function Keel({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -3.8 0.6 L 3.8 0.6 L 2.4 3.6 L 0.9 7.4 L 0 8.6 L -1.1 6 L -2.6 3.4 Z" fill={c} fillOpacity="0.45" />
      <path d="M -3.4 0 L -1.3 -2.5 L 0 -4.4 L 1.5 -2.2 L 3.4 0 Z" fill={c} />
      <path d="M -3.4 0 L -1.3 -2.5 L 0 -4.4 L -0.4 -1.1 Z" fill={INK} fillOpacity="0.35" />
    </g>
  );
}

/**
 * The projection. Chart area 0..268 wide, readout column 276..352.
 */
function Holo({
  uid,
  r,
  cs,
  tone,
  ghost,
  on,
  calm,
}: {
  uid: string;
  r: Route;
  cs: Candle[];
  tone: string;
  ghost: string;
  on: boolean;
  calm: boolean;
}) {
  const W = 360;
  const H = 104;
  // Type in the projection keeps a readable size on a phone: the drawing
  // scales with the column, so the labels are scaled back up as it narrows.
  const svg = useRef<SVGSVGElement>(null);
  const [fs, setFs] = useState(1);
  useEffect(() => {
    const el = svg.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      if (w > 0) setFs(Math.min(1.4, Math.max(1, 340 / w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const TOP = 20;
  const BOT = 12;
  const X0 = 12;
  const DX = 14.4;
  const y = (v: number) => yOf(v, H, TOP, BOT, r.range);
  const scan = `${uid}-scan`;
  const sheen = `${uid}-sheen`;
  const clip = `${uid}-clip`;
  const bullBear = (_: number, c: Candle) => (c.c >= c.o ? BULL : BEAR);

  // What the sheen passes over: the drawing itself, not the whole box.
  let clipShape: ReactNode = null;
  let drawing: ReactNode = null;
  let readout: ReactNode = null;
  // Marks that sit ON the candles (Zones' diamonds, Iceberg's fractures and
  // its iceberg) are drawn after them.
  let overlay: ReactNode = null;
  let candleColor: (i: number, c: Candle) => string = bullBear;

  if (r.kind === "zones") {
    const { state, defended } = zoneRead(cs);
    const tests = zoneTests(cs);
    const yT = y(ZONE.hi); // the action edge: a demand zone's roof
    const yB = y(ZONE.lo); // the far edge
    const xs = X0 - 6;
    const xe = 268;
    const yR = Math.min(yT, H - 40); // readout anchor, kept inside the frame
    const dim = state === "BREAKING";
    // Cyan while price is approaching or testing it, as the product draws it.
    const edge = state === "APPROACHING" || state === "TESTING" ? S_BULL : tone;
    const last = cs[cs.length - 1];
    // The zone's own profile, right-anchored at its end: teal buying toward
    // price, violet selling against the wall, the heaviest row ticked (POC).
    const rows = zoneProfile(cs);
    const max = Math.max(...rows.map((w) => w.buy + w.sell));
    const PL = 30;
    const rowH = Math.max(1.2, (yB - yT) / rows.length - 1.2);
    const poc = rows.reduce((a, b) => (b.buy + b.sell > a.buy + a.sell ? b : a));
    const buy = rows.reduce((n, w) => n + w.buy, 0);
    const sell = rows.reduce((n, w) => n + w.sell, 0);
    const buyShare = buy / (buy + sell);
    const sellers = buyShare < 0.5;
    // Heavy selling into a demand zone that held is absorption.
    const read = defended > 0 && sellers && 1 - buyShare >= 0.55 ? "ABSORBED" : "BALANCED";
    const word = state === "DEFENDED" && defended > 1 ? `DEFENDED ${defended}×` : state;
    clipShape = <rect x={xs} y={yT} width={xe - xs} height={yB - yT} />;
    drawing = (
      <g opacity={dim ? 0.45 : 1} className={calm ? "" : "qr-breathe"}>
        {/* the band, faint, behind the candles */}
        <rect x={xs} y={yT} width={xe - xs} height={yB - yT} fill={`url(#${scan})`} opacity="0.55" />
        <rect x={xs} y={yT} width={xe - xs} height={yB - yT} fill={tone} fillOpacity="0.05" />
        {/* while price tests it, the slice it has eaten glows */}
        {state === "TESTING" && last && (
          <rect x={xs} y={yT} width={xe - xs} height={Math.max(0, y(Math.max(last.l, ZONE.lo)) - yT)} fill={S_BULL} fillOpacity="0.16" />
        )}
        {/* the action edge solid (with the projection's ghost edge), the far
            edge dotted, the stem where the zone was born */}
        <line x1={xs + 1} x2={xe + 1} y1={yT - 1} y2={yT - 1} stroke={ghost} strokeOpacity="0.3" />
        <line x1={xs} x2={xe} y1={yT} y2={yT} stroke={edge} strokeWidth="1" />
        <line x1={xs} x2={xe} y1={yB} y2={yB} stroke={dim ? S_BULL : tone} strokeOpacity="0.85" strokeDasharray="1 2" />
        <line x1={xs} x2={xs} y1={yT} y2={yB} stroke={tone} strokeWidth="1" />
        {rows.map((w) => {
          const L = ((w.buy + w.sell) / max) * PL;
          const bw = (w.buy / (w.buy + w.sell)) * L;
          const yy = y(w.v) - rowH / 2;
          return (
            <g key={w.v}>
              <rect x={xe - L} y={yy} width={bw} height={rowH} fill={TEAL} fillOpacity="0.7" />
              <rect x={xe - L + bw} y={yy} width={L - bw} height={rowH} fill={VIOLET} fillOpacity="0.7" />
              {w === poc && <rect x={xe - L - 2.5} y={yy} width="1.5" height={rowH} fill={INK} />}
            </g>
          );
        })}
      </g>
    );
    // A diamond on the action edge at every bar that tested the zone: filled
    // when price was rejected back out, hollow when the bar closed inside.
    overlay = (
      <g opacity={dim ? 0.45 : 1}>
        {tests.map(({ i, held }) => {
          const x = X0 + i * DX;
          const d = `M ${x} ${yT - 2.4} L ${x + 2.4} ${yT} L ${x} ${yT + 2.4} L ${x - 2.4} ${yT} Z`;
          return held ? (
            <path key={i} d={d} fill={INK} fillOpacity="0.9" />
          ) : (
            <path key={i} d={d} fill="none" stroke={INK} strokeOpacity="0.85" strokeWidth="0.8" />
          );
        })}
      </g>
    );
    readout = (
      <g>
        <text x="352" y={yR - 12} textAnchor="end" className="font-mono" fontSize={7 * fs} letterSpacing="0.9" fill={tone}>
          DEMAND
        </text>
        <text x="352" y={yR - 1} textAnchor="end" className="font-mono" fontSize={9 * fs} letterSpacing="0.8" fill={edge}>
          {word}
        </text>
        {/* the buy | sell rule, its tick at the split */}
        <rect x={296} y={yR + 5} width={56 * buyShare} height="1.5" fill={TEAL} />
        <rect x={296 + 56 * buyShare} y={yR + 5} width={56 * (1 - buyShare)} height="1.5" fill={VIOLET} />
        <rect x={296 + 56 * buyShare - 0.5} y={yR + 3.5} width="1" height="4.5" fill={INK} />
        <text x="352" y={yR + 15} textAnchor="end" className="font-mono" fontSize={6.5 * fs} letterSpacing="0.9" fill="#7C848D">
          <tspan fill={sellers ? VIOLET : TEAL}>{`${sellers ? "SELL" : "BUY"} ${Math.round((sellers ? 1 - buyShare : buyShare) * 100)}%`}</tspan> {read}
        </text>
      </g>
    );
  }

  if (r.kind === "iceberg") {
    const hits = iceHits(cs);
    const tests = hits.length;
    // A level needs two clustered tests before it is confirmed — nothing is
    // drawn before that, and a caption never reads less than 2×.
    const live = tests >= 2;
    const lastHit = tests ? hits[tests - 1].i : -99;
    // TESTING for six bars after the latest test.
    const testing = live && cs.length - 1 - lastHit <= 6;
    const yL = y(ICE.level);
    const yT = y(ICE.hi);
    const yB = y(ICE.lo);
    const xe = 268;
    const x1 = live ? X0 + hits[0].i * DX : xe;
    const yR = Math.min(yT, H - 40);
    clipShape = live ? <rect x={x1} y={yT} width={xe - x1} height={yB - yT} /> : null;
    drawing = live ? (
      <g>
        {/* the soft tolerance tint either side of the exact line */}
        <rect x={x1} y={yT} width={xe - x1} height={yB - yT} fill={`url(#${scan})`} opacity="0.5" />
        <rect x={x1} y={yT} width={xe - x1} height={yB - yT} fill={tone} fillOpacity="0.06" />
        <line x1={x1 + 1} x2={xe + 1} y1={yL - 1} y2={yL - 1} stroke={ghost} strokeOpacity="0.3" />
        <line x1={x1} x2={xe} y1={yL} y2={yL} stroke={tone} strokeWidth="1" />
        {/* the post: drawn from its first test */}
        <line x1={x1} x2={x1} y1={yT - 1.5} y2={yB + 1.5} stroke={tone} strokeWidth="1" />
      </g>
    ) : null;
    // A fracture on every test, just past the wick tip and running up into the
    // ice, clear of the candle; the newest ringed while the level is testing.
    // Then the iceberg on its waterline in the runway past the last bar.
    overlay = live ? (
      <g>
        {hits.map(({ i, c }, k) => {
          const x = X0 + i * DX;
          const y0 = y(c.h) - 2;
          const newest = k === tests - 1 && testing;
          return (
            <g key={i}>
              <path d={`M ${x} ${y0} l -1.3 -1.7 l 2.4 -1.5 l -1.7 -1.9 l 1.1 -1.5`} fill="none" stroke={newest ? S_BEAR : tone} strokeWidth="1" strokeLinejoin="bevel" />
              {newest && <circle cx={x} cy={y0 - 3.3} r="4.4" fill="none" stroke={S_BEAR} strokeWidth="0.8" />}
            </g>
          );
        })}
        <Keel x={261} y={yL} s={1.25 + 0.1 * (tests - 2)} c={testing ? S_BEAR : tone} />
      </g>
    ) : null;
    readout = (
      <g>
        <text x="352" y={yR - 12} textAnchor="end" className="font-mono" fontSize={7 * fs} letterSpacing="0.9" fill={live ? tone : "#7C848D"}>
          ICE OFFER
        </text>
        <text x="352" y={yR - 1} textAnchor="end" className="font-mono" fontSize={9 * fs} letterSpacing="0.8" fill={live ? tone : "#7C848D"}>
          {live ? (
            <>
              {testing && <tspan fill={S_BEAR}>TESTING </tspan>}
              {`${tests}×`}
            </>
          ) : (
            "—"
          )}
        </text>
        {[0, 1, 2].map((k) => (
          <rect key={k} x={352 - 33 + k * 11.5} y={yR + 5} width="9" height="2.5" fill={k < tests ? tone : LINE} />
        ))}
        <text x="352" y={yR + 15} textAnchor="end" className="font-mono" fontSize={6.5 * fs} letterSpacing="0.9" fill="#7C848D">
          TESTS
        </text>
      </g>
    );
  }

  if (r.kind === "gex") {
    const last = cs[cs.length - 1];
    const near = last
      ? GEX.reduce((a, b) => (Math.abs(b.v - last.c) < Math.abs(a.v - last.c) ? b : a))
      : null;
    const yEt = y(EM.hi);
    const yEb = y(EM.lo);
    clipShape = <rect x={X0 - 6} y={yEt} width={268 - X0} height={yEb - yEt} />;
    drawing = (
      <g>
        <rect x={X0 - 6} y={yEt} width={268 - X0} height={yEb - yEt} fill={`url(#${scan})`} opacity="0.3" />
        {GEX.map((g) => {
          const yy = y(g.v);
          const hot = near === g;
          return (
            <g key={g.label}>
              <line x1={X0 - 5} x2={269} y1={yy - 1} y2={yy - 1} stroke={ghost} strokeOpacity="0.3" />
              <line
                x1={X0 - 6}
                x2={268}
                y1={yy}
                y2={yy}
                stroke={g.color}
                strokeWidth={hot ? 1.5 : 1}
                strokeOpacity={hot ? 1 : 0.55}
                strokeDasharray={g.label === "GAMMA FLIP" ? "4 3" : undefined}
              />
              <text
                x="352"
                y={yy + 3}
                textAnchor="end"
                className="font-mono"
                fontSize={7.5 * fs}
                letterSpacing="0.8"
                fill={hot ? g.color : "#7C848D"}
              >
                {g.label}
              </text>
            </g>
          );
        })}
        <text x={X0} y={yEb - 3} className="font-mono" fontSize={6.5 * fs} letterSpacing="0.9" fill="#7C848D">
          EXPECTED MOVE
        </text>
      </g>
    );
  }

  if (r.kind === "flow") {
    // Profile rows every 4 points; each candle's volume spread over its range,
    // counted as buying on an up candle and selling on a down one.
    const rows: { v: number; buy: number; sell: number }[] = [];
    for (let v = 34; v <= 70; v += 4) rows.push({ v, buy: 0, sell: 0 });
    for (const c of cs) {
      for (const row of rows) {
        if (row.v + 2 >= c.l && row.v - 2 <= c.h) {
          if (c.c >= c.o) row.buy += 1;
          else row.sell += 1;
        }
      }
    }
    const max = Math.max(1, ...rows.map((w) => w.buy + w.sell));
    const heavy = cs.length ? rows.reduce((a, b) => (b.buy + b.sell > a.buy + a.sell ? b : a)) : null;
    const X = 280;
    const L = 64;
    const rowH = Math.abs(y(54) - y(50)) - 1.5;
    clipShape = <rect x={X} y={TOP} width={L + 8} height={H - TOP} />;
    drawing = (
      <g>
        {rows.map((w) => {
          const yy = y(w.v) - rowH / 2;
          const bw = (w.buy / max) * L;
          const sw = (w.sell / max) * L;
          const hot = heavy === w && w.buy + w.sell > 0;
          return (
            <g key={w.v}>
              <rect x={X} y={yy} width={bw} height={rowH} fill={TEAL} fillOpacity="0.55" />
              <rect x={X + bw} y={yy} width={sw} height={rowH} fill={VIOLET} fillOpacity="0.55" />
              {hot && (
                <>
                  <rect x={X - 2} y={yy - 1.5} width={L + 6} height={rowH + 3} fill="none" stroke={TEAL} strokeWidth="1" />
                  <line x1={X0 - 6} x2={X - 4} y1={yy + rowH / 2} y2={yy + rowH / 2} stroke={TEAL} strokeOpacity="0.5" strokeDasharray="2 3" />
                </>
              )}
            </g>
          );
        })}
        <text x={X} y={TOP - 5} className="font-mono" fontSize={7 * fs} letterSpacing="0.9" fill="#7C848D">
          <tspan fill={TEAL}>BUY</tspan> / <tspan fill={VIOLET}>SELL</tspan>
        </text>
        {heavy && heavy.buy + heavy.sell > 0 && (
          <text x={X0 - 4} y={y(heavy.v) - rowH / 2 - 3} className="font-mono" fontSize={6.5 * fs} letterSpacing="0.9" fill={TEAL}>
            HEAVY ROW
          </text>
        )}
      </g>
    );
  }

  if (r.kind === "oracle") {
    const nl = neural(cs);
    const pts = nl.map((v, i) => `${X0 + i * DX},${y(v)}`).join(" ");
    const last = cs[cs.length - 1];
    const side = last ? (last.c >= nl[nl.length - 1] ? "LONG" : "SHORT") : "—";
    const flip = cs.findIndex((c, i) => i > 0 && c.c >= nl[i] && cs[i - 1].c < nl[i - 1]);
    candleColor = (i) => spectrum(cs, i);
    clipShape = <polyline points={pts} fill="none" stroke="#fff" strokeWidth="6" />;
    drawing = cs.length ? (
      <g>
        <polyline points={pts} fill="none" stroke={ghost} strokeOpacity="0.35" strokeWidth="1" transform="translate(1,-1)" />
        <polyline points={pts} fill="none" stroke={side === "LONG" ? TEAL : VIOLET} strokeWidth="1.5" />
        {flip > 0 && (
          <path
            d={`M ${X0 + flip * DX - 4} ${y(cs[flip].l) + 9} L ${X0 + flip * DX} ${y(cs[flip].l) + 3} L ${X0 + flip * DX + 4} ${y(cs[flip].l) + 9} Z`}
            fill={TEAL}
          />
        )}
      </g>
    ) : null;
    readout = (
      <g>
        <text x="352" y={TOP + 12} textAnchor="end" className="font-mono" fontSize={7 * fs} letterSpacing="0.9" fill="#7C848D">
          YOUR SIDE
        </text>
        <text x="352" y={TOP + 24} textAnchor="end" className="font-mono" fontSize={9 * fs} letterSpacing="0.8" fill={side === "LONG" ? TEAL : side === "SHORT" ? VIOLET : "#7C848D"}>
          {side}
        </text>
        {[S_BEAR, BEAR, NEUTRAL, BULL, S_BULL].map((c, k) => (
          <rect key={c} x={352 - 55 + k * 11.5} y={TOP + 32} width="9" height="2.5" fill={c} />
        ))}
        <text x="352" y={TOP + 45} textAnchor="end" className="font-mono" fontSize={6.5 * fs} letterSpacing="0.9" fill="#7C848D">
          SPECTRUM
        </text>
      </g>
    );
  }

  const corner = (x: number, yy: number, sx: number, sy: number) => (
    <path d={`M ${x} ${yy + 8 * sy} L ${x} ${yy} L ${x + 8 * sx} ${yy}`} fill="none" stroke={tone} strokeWidth="1" strokeOpacity={on ? 0.8 : 0.3} />
  );

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full transition-opacity duration-500"
      style={{ opacity: on ? 1 : 0.5 }}
      role="img"
      aria-label={`${r.product} — ${r.title}, drawn on the chart above (illustration)`}
    >
      <defs>
        <pattern id={scan} width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill={tone} fillOpacity="0.32" />
        </pattern>
        <linearGradient id={sheen} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.13" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clip}>{clipShape}</clipPath>
      </defs>

      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="5" fill="#0B0E12" />
      <Grid w={W} h={H} />
      {corner(0.5, 0.5, 1, 1)}
      {corner(W - 0.5, 0.5, -1, 1)}
      {corner(0.5, H - 0.5, 1, -1)}
      {corner(W - 0.5, H - 0.5, -1, -1)}
      <text x="8" y="11" className="font-mono" fontSize={7.5 * fs} letterSpacing="1" fill={tone}>
        {r.product.toUpperCase()} · ON YOUR CHART
      </text>

      {drawing}
      <Candles cs={cs} h={H} top={TOP} bottom={BOT} x0={X0} dx={DX} w={6} color={candleColor} fill={0.55} range={r.range} />
      {overlay}
      {readout}

      {!calm && clipShape && (
        <g clipPath={`url(#${clip})`}>
          <rect x="-80" y="0" width="80" height={H} fill={`url(#${sheen})`}>
            <animate attributeName="x" from="-80" to={W} dur="3.4s" repeatCount="indefinite" />
          </rect>
        </g>
      )}

      <text x="8" y={H - 5} className="font-mono" fontSize={6 * fs} letterSpacing="1" fill="#565D66">
        ILLUSTRATION
      </text>
    </svg>
  );
}
