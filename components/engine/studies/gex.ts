import type { Draw, ReadItem, StudyDef, StudyEvent, StudyRun, Tone } from "../types";
import { hhmm, sessionNum } from "../ta";

/**
 * DS GEX — web edition. Source: DSGex.cs (Build 2026-10-09), shipped defaults
 * (ApplyDefaults: Session lock mode, 0DTE walls source VolumeLive, G count 2,
 * Strength lines on, Line opacity 40, Merge confluence on (0.02 x daily ATR),
 * Magnitude strength on, Lines start when drawn on, Level history on,
 * Level captions on, Label position Center, Label size Medium, Auto label
 * contrast on, Draw behind bars on, Include in auto scale off).
 *
 * WHAT IS PORTED
 *  · The levels are not computed here: the web cannot fetch CBOE option chains.
 *    They are read from DS GEX's OWN saved map (Documents\NinjaTrader 8\DSGex\
 *    DSGex_NQ_F.map), converted by tools/gex_map_to_json.py into
 *    tools/fixtures/gex-<day>.json: every row whose validity window overlaps the
 *    session, with its price on the NQ chart, its NDX strike, its gamma
 *    magnitude, its G rank and its .NET UTC valid-from / valid-to ticks.
 *  · Visibility (FamilyVisible): Call/Put Wall, CW/PW 0DTE, Gamma Flip, HGEX,
 *    Max Pain, G+/G- ranks 1..2, EM High/Low. Off by default and offered as a
 *    layer: the EM fractional bands (EM ±50% / ±150%) and the 1D Max/Min.
 *  · Trail flags (MaterializeTrail): flag 1 = live 0DTE wall (shown under
 *    VolumeLive), flag 2 = an OI 0DTE wall a live wall replaced (hidden).
 *  · Confluence merge (RebuildDisplay): strongest-first greedy cluster within
 *    eps = max(2 ticks, 0.02 x daily ATR(14), 0.015% of last price); a cluster
 *    reads "A / B / C +n", is drawn in the Confluence colour (198,255,0), width
 *    ClusterWidth(); single levels keep their family colour/style.
 *  · Widths (MagWidth / FamilyWidth with Strength lines): tier-2 kinds (walls,
 *    0DTE, flip, HGEX) floor 3, tier-1 floor 1, magnitude adds up to
 *    1 + round(3·sqrt(mag / maxMag)). Styles: EM Dash, EM bands / 1D Dot, others
 *    Solid. Lines at 40 % opacity; the start tick at 72 % (TickCol x1.8).
 *  · Lines start when drawn: each line begins at the bar whose time first
 *    reaches the level's valid-from (Bars.GetBar), with a fine vertical tick.
 *    A level whose valid-to has passed becomes a faint dotted ghost (Level
 *    history, TickCol x0.6) ending with ticks at both ends.
 *  · Labels (LayoutLabels / FindSlot / Want): name (Segoe-UI-like semibold 11)
 *    + price (regular, 85 %), centred between the line's start and the right
 *    edge, sliding to the nearest stretch clear of bars (+3 px air) and of
 *    stronger labels (28 px apart), dropping the price before giving up, and
 *    the line opens 6 px either side of its label (CollectGaps/StrokeGapped).
 *  · Captions (LayoutCaptions / CapDetail): "time   NDX strike   [+$gamma share]
 *    [vol n]" right of price, above the line (else below, else above its label),
 *    blocked by any other level's line, bars, labels and captions; shortened to
 *    the time, else dropped. The Gamma Flip caption reads "price above: positive
 *    gamma" / "price below: negative gamma" following price; EM reads
 *    "±pts   %". The time gets a day name when it was drawn on an earlier day.
 *  · Text colours (DsLegibility.Fit): on a dark ground the family colour is
 *    lifted toward white until 4.5:1, on a light ground it starts at 68 % and
 *    is deepened toward black until 4.5:1. On a plain ground that always
 *    passes, so the glass plate (Solve) stays at 0 — as in NinjaTrader.
 *  · Events: the tool's alert vocabulary (CheckAlerts: "crossed above /
 *    crossed below <Label>") evaluated at bar close (close-to-close, >= / <=
 *    rule, 300 s re-arm = 5 bars), for every drawn level; and "AT THE <LABEL>"
 *    when a bar reaches a level and closes back on the side it came from.
 *    Plus the set itself, on the bar its lines start.
 *
 * DEVIATIONS
 *  1. Levels come from the saved map, not a live CBOE fetch (no option chains
 *     on the web). Only days with a captured map have a feed (2026-10-08); on
 *     any other day nothing is drawn and the status says so.
 *  2. The map keeps 36 h of history (TRAIL_KEEP), so the set BEFORE the
 *     2026-10-08 Overnight set is gone: its dotted history segments, and the
 *     "carries on from where it first appeared" chaining (ChainedSince) of a
 *     strike that held through it, cannot be shown. Every 10-08 line starts at
 *     its own capture, 18:00 ET on 10-07.
 *  3. 2026-10-08: the map shows the Overnight set E20261008 (captured 18:00:24
 *     ET 10-07) valid until 00:30 ET 10-09 — no Day set was captured at the
 *     08:30 morning lock and no live 0DTE refresh was recorded, so the
 *     open-interest 0DTE walls stand all session. That is what DS GEX itself
 *     draws when the morning capture does not land ("the last saved set keeps
 *     drawing"); the replay cannot invent the Day set it would have taken.
 *  4. This set was saved by an earlier build that did not store net gamma or
 *     share (net = nan, share = -1), so the captions read "time   NDX strike"
 *     without the "+$gamma   share" part — exactly what the shipped
 *     CapDetail() prints for such a row.
 *  5. Daily ATR(14) for the merge tolerance is built from the trading sessions
 *     in the replay file (3–4 days) instead of NinjaTrader's daily series; it
 *     only sets the confluence tolerance (no 10-08 pair lies near it).
 *  6. Label/caption contrast is solved against the plain chart ground; the
 *     tool's background-picture sampling has no counterpart here.
 *  7. Fonts: the site's sans face stands in for Segoe UI at the same sizes.
 *  8. Alerts are off by default in DS GEX; the replay uses their wording as
 *     narration only, evaluated at bar close rather than on every tick. The
 *     tool alerts per raw level (walls, 0DTE walls, flip); the narration reads
 *     the merged display line, also covers Max Pain / G+ / G- / EM (re-armed
 *     after 15 bars), and adds "AT THE <label>" for a reach-and-reject, which
 *     is narration wording, not a DS GEX alert.
 *  9. Include in auto scale is off in DS GEX, so NinjaTrader's price scale
 *     ignores the levels; the replay widens the range to keep levels within
 *     60% of the visible span in view.
 * 10. Example hygiene (web showcase): on an example session (no trading day —
 *     recorded price with a level map built for the example and locked at the
 *     08:30 Day set, tools/showcase/examples/gex.ts)
 *     the captions leave out the capture time / day name ("Wed 18:00") and
 *     read only the detail ("NDX 29900   +$142M   21%", "±180 pts   0.60%",
 *     the Gamma Flip regime). Display only; layout, levels and events are
 *     unchanged, and recorded sessions keep the time.
 */

type Feed = {
  levels?: {
    kind: number; label: string; price: number; strike: number | null; mag: number; net: number | null;
    share: number | null; vol: number | null; rank: number; flag: number; sinceMin: number; untilMin: number | null;
    set: string; setName: string;
  }[];
};

const K_RES = 0, K_SUP = 1, K_RES0 = 2, K_SUP0 = 3, K_FLIP = 4, K_EMH = 5, K_EML = 6, K_EMB = 7,
  K_IVH = 8, K_IVL = 9, K_MPAIN = 10, K_GPOS = 11, K_GNEG = 12, K_HGEX = 13;
const G_COUNT = 2, LINE_OPACITY = 0.4, MERGE_ATR = 0.02, ATR_P = 14, REARM = 5, TOUCH_REARM = 15, NARRATE_REARM = 15;
type RGB = [number, number, number];
const COL: Record<number, RGB> = {
  [K_RES]: [0, 208, 132], [K_SUP]: [255, 59, 48], [K_RES0]: [0, 200, 255], [K_SUP0]: [255, 128, 150],
  [K_FLIP]: [255, 196, 0], [K_HGEX]: [255, 40, 130], [K_MPAIN]: [163, 61, 255], [K_GPOS]: [25, 217, 196],
  [K_GNEG]: [255, 122, 61], [K_EMH]: [140, 150, 168], [K_EML]: [140, 150, 168], [K_EMB]: [90, 100, 120],
  [K_IVH]: [124, 134, 152], [K_IVL]: [124, 134, 152],
};
const CONFLUENCE: RGB = [198, 255, 0];
type Style = "solid" | "dash" | "dot";
const STYLE: Record<number, Style> = { [K_EMH]: "dash", [K_EML]: "dash", [K_EMB]: "dot", [K_IVH]: "dot", [K_IVL]: "dot" };
const rankOf = (k: number) =>
  k === K_RES || k === K_SUP ? 1 : k === K_FLIP ? 2 : k === K_RES0 || k === K_SUP0 ? 3 : k === K_HGEX ? 4 : k === K_MPAIN ? 5
    : k === K_EMH || k === K_EML ? 6 : k === K_GPOS || k === K_GNEG ? 7 : 8;
const tier = (k: number) => (k <= K_FLIP || k === K_HGEX ? 2 : k === K_MPAIN || k === K_GPOS || k === K_GNEG || k === K_EMH || k === K_EML ? 1 : 0);
const visible = (k: number, bands: boolean) => (k === K_EMB || k === K_IVH || k === K_IVL ? bands : true);
const MEANING: Record<number, string> = {
  [K_RES]: "the strike with the largest positive net gamma across expiries",
  [K_SUP]: "the strike with the most negative net gamma",
  [K_RES0]: "today's expiry's call wall",
  [K_SUP0]: "today's expiry's put wall",
  [K_FLIP]: "the net-gamma sign change nearest spot",
  [K_MPAIN]: "the strike where the nearest expiry's options pay out the least",
  [K_GPOS]: "a next-strongest positive-gamma strike",
  [K_GNEG]: "a next-strongest negative-gamma strike",
  [K_EMH]: "the top of the move the options market prices for the day",
  [K_EML]: "the bottom of the move the options market prices for the day",
  [K_HGEX]: "the strike with the largest net gamma either way",
};

const fmtPx = (v: number) => v.toFixed(2); // FormatPx: tick 0.25 -> 2 decimals, invariant, no grouping
const fmtStrike = (v: number) => (Math.abs(v - Math.round(v)) < 1e-6 || v >= 1000 ? Math.round(v).toFixed(0) : v.toFixed(v >= 100 ? 1 : 2));
const fmtPts = (v: number) => v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2);
function fmtUsd(v: number) {
  const a = Math.abs(v), sg = v < 0 ? "−" : "+";
  const n = a >= 1e9 ? (a / 1e9).toFixed(a >= 1e11 ? 0 : 1) + "B" : a >= 1e6 ? (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + "M" : a >= 1e3 ? (a / 1e3).toFixed(0) + "K" : a.toFixed(0);
  return `${sg}$${n}`;
}
const fmtCount = (v: number) => (v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e4 ? (v / 1e3).toFixed(0) + "K" : v >= 1e3 ? (v / 1e3).toFixed(1) + "K" : v.toFixed(0));

// ---- DsLegibility (WCAG luminance, Fit toward white/black until 4.5:1)
const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const relLum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
function fit(c: RGB, bg: RGB, labA: number, light: boolean): RGB {
  const [r, g, b] = bg.map((x) => x / 255);
  const lb = relLum(r, g, b), an = light ? 0 : 1;
  const cc = c.map((x) => x / 255);
  const ok = (t: number) => {
    const m = cc.map((x) => x + (an - x) * t);
    const lt = relLum(r + (m[0] - r) * labA, g + (m[1] - g) * labA, b + (m[2] - b) * labA);
    return (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05) >= 4.5;
  };
  if (ok(0)) return c;
  let lo = 0, hi = 0.55;
  if (ok(hi)) for (let it = 0; it < 8; it++) { const m = 0.5 * (lo + hi); if (ok(m)) hi = m; else lo = m; }
  return cc.map((x) => Math.round((x + (an - x) * hi) * 255)) as RGB;
}
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const hexRgb = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

type Lv = {
  kind: number; label: string; price: number; strike: number; mag: number; net: number; share: number; vol: number;
  rank: number; flag: number; b0: number; e: number; sinceMin: number; set: string; setName: string;
};
type Disp = {
  key: string; price: number; name: string; col: RGB; w: number; style: Style; pri: number; kinds: number[];
  b0: number; members: Lv[];
  capA: string | null; capB: string; capB2: string; capKind: number; capPx: number;
};

const NAME_SZ = 11, CAP_SZ = 9, NAME_H = 15, CAP_H = 12, LBL_H = 2 * Math.ceil((NAME_H + 2) / 2);
const LBL_GAP = 6, LBL_PXGAP = 6, LBL_EDGE = 8, LBL_APART = 28, BAR_AIR = 3, CAP_GAP = 7, CAP_APART = 12, CAP_LGAP = 4, CAP_DETAIL_A = 0.8;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const study: StudyDef = {
  slug: "gex", rightMargin: 150,
  name: "DS GEX",
  about: "DS GEX's own captured option map for the session — walls, 0DTE walls, Gamma Flip, Max Pain, G+/G-, Expected Move — drawn as the shipped tool draws it.",
  needs: { extra: "gex" },
  layers: [
    { id: "captions", label: "Level captions", on: true, hint: "When each level was drawn and the NDX strike behind it, in the open space right of price." },
    { id: "bands", label: "EM bands + 1D range", on: false, hint: "Off by default in DS GEX: the Expected Move ±50% / ±150% bands and the 1D Max/Min." },
  ],
  run(s): StudyRun {
    const feed = (s.extra ?? {}) as Feed;
    // an example session (web showcase) has no trading day: no capture time / day name in the captions
    const showTime = !!s.day;
    const raw = Array.isArray(feed.levels) ? feed.levels : [];
    const n = s.n;
    // bar on which a level appears / is replaced: first bar whose close time reaches the instant (Bars.GetBar)
    const barAt = (min: number) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (s.t[m] >= min) hi = m; else lo = m + 1; } return lo; };
    const lv: Lv[] = [];
    for (const r of raw) {
      if (r.flag === 2) continue; // VolumeLive hides OI 0DTE walls a live wall replaced
      if ((r.kind === K_GPOS || r.kind === K_GNEG) && r.rank > G_COUNT) continue;
      const b0 = barAt(r.sinceMin);
      if (b0 >= n) continue;
      const e = r.untilMin == null ? Infinity : barAt(r.untilMin);
      lv.push({ kind: r.kind, label: r.label, price: r.price, strike: r.strike ?? 0, mag: r.mag, net: r.net ?? NaN,
        share: r.share ?? -1, vol: r.vol ?? -1, rank: r.rank, flag: r.flag, b0, e, sinceMin: r.sinceMin, set: r.set, setName: r.setName });
    }

    if (lv.length === 0) {
      const none: ReadItem[] = [{ label: "DS GEX", value: "No captured option map for this session" }];
      return { events: [], draw: () => {}, status: () => none, readout: () => none, legend: [] };
    }

    // ---- daily ATR(14) from completed trading sessions (FoldDailyAtr), as of each session
    const sn = new Int32Array(n);
    for (let i = 0; i < n; i++) sn[i] = sessionNum(s, i);
    const atrBySess = new Map<number, number>();
    {
      let atr = 0, cnt = 0, prevC = NaN, hi = -Infinity, lo = Infinity, cl = NaN, cur = sn[0];
      const fold = () => {
        const tr = isNaN(prevC) ? hi - lo : Math.max(hi - lo, Math.abs(hi - prevC), Math.abs(lo - prevC));
        if (cnt < ATR_P) { cnt++; atr = (atr * (cnt - 1) + tr) / cnt; } else atr = (atr * (ATR_P - 1) + tr) / ATR_P;
        prevC = cl;
      };
      atrBySess.set(cur, 0);
      for (let i = 0; i < n; i++) {
        if (sn[i] !== cur) { fold(); cur = sn[i]; atrBySess.set(cur, atr); hi = -Infinity; lo = Infinity; }
        if (s.h[i] > hi) hi = s.h[i];
        if (s.l[i] < lo) lo = s.l[i];
        cl = s.c[i];
      }
    }
    const tick = s.tick;
    const mergeEps = (k: number) => Math.max(tick * 2, (atrBySess.get(sn[k]) ?? 0) * MERGE_ATR, s.c[k] * 0.00015);

    // ---- display list as of bar k (RebuildDisplay), cached
    const cache = new Map<string, { disp: Disp[]; ghosts: Lv[]; em: [number, number] }>();
    const display = (k: number, bands: boolean) => {
      const key = `${k}|${bands ? 1 : 0}`;
      const hit = cache.get(key);
      if (hit) return hit;
      const cur = lv.filter((L) => L.b0 <= k && k < L.e);
      const ghosts = lv.filter((L) => L.e <= k && visible(L.kind, bands));
      // ScanRanges
      let eh = 0, el = 0, ih = 0, il = 0;
      for (const L of cur) { if (L.kind === K_EMH) eh = L.price; else if (L.kind === K_EML) el = L.price; else if (L.kind === K_IVH) ih = L.price; else if (L.kind === K_IVL) il = L.price; }
      const emHalf = eh > el && el > 0 ? (eh - el) * 0.5 : 0, emMid = (eh + el) * 0.5;
      const ivHalf = ih > il && il > 0 ? (ih - il) * 0.5 : 0, ivMid = (ih + il) * 0.5;
      const tmp = cur.filter((L) => visible(L.kind, bands));
      let maxNet = 0;
      for (const L of tmp) if (L.mag > maxNet) maxNet = L.mag;
      const famW = (kd: number) => (tier(kd) === 2 ? 3 : 1);
      const magW = (kd: number, mag: number) => {
        const base = famW(kd);
        if (mag <= 0 || maxNet <= 0) return base;
        const r = Math.min(1, Math.max(0, mag / maxNet));
        const w = 1 + Math.round(3 * Math.sqrt(r));
        return Math.max(w, tier(kd) === 2 ? 3 : 1);
      };
      const weaker = (a: Lv, b: Lv) => { const ra = rankOf(a.kind), rb = rankOf(b.kind); return ra !== rb ? ra > rb : a.mag < b.mag; };
      const eps = mergeEps(k);
      const used = new Array(tmp.length).fill(false);
      const disp: Disp[] = [];
      for (;;) {
        let a = -1, aRank = 1e9, aMag = -1;
        for (let i = 0; i < tmp.length; i++) {
          if (used[i]) continue;
          const r = rankOf(tmp[i].kind);
          if (r < aRank || (r === aRank && tmp[i].mag > aMag)) { aRank = r; aMag = tmp[i].mag; a = i; }
        }
        if (a < 0) break;
        const ap = tmp[a].price;
        const mem: Lv[] = [tmp[a]]; used[a] = true;
        for (let i = 0; i < tmp.length; i++) if (!used[i] && Math.abs(tmp[i].price - ap) <= eps) { mem.push(tmp[i]); used[i] = true; }
        for (let x = 1; x < mem.length; x++) { const mi = mem[x]; let y = x - 1; while (y >= 0 && weaker(mem[y], mi)) { mem[y + 1] = mem[y]; y--; } mem[y + 1] = mi; }
        let name: string, col: RGB, w: number, style: Style;
        if (mem.length === 1) {
          name = mem[0].label; col = COL[mem[0].kind] ?? [140, 147, 168]; w = magW(mem[0].kind, mem[0].mag); style = STYLE[mem[0].kind] ?? "solid";
        } else {
          const labels: string[] = [];
          for (const m of mem) if (!labels.includes(m.label)) labels.push(m.label);
          name = labels.slice(0, 3).join(" / ") + (labels.length > 3 ? ` +${labels.length - 3}` : "");
          col = CONFLUENCE; style = "solid";
          let wmax = 1, strong = false;
          for (const m of mem) { const wi = magW(m.kind, m.mag); if (wi > wmax) wmax = wi; if (tier(m.kind) === 2) strong = true; }
          w = wmax + (mem.length - 1); if (strong && w < 3) w = 3; if (w > 6) w = 6;
        }
        // Provenance: line start = earliest member start (all members known); caption from the strongest member
        const b0 = Math.min(...mem.map((m) => m.b0));
        const A = mem[0];
        let capB = "", capB2 = "", capKind = 1;
        if (A.kind === K_EMH || A.kind === K_EML || A.kind === K_IVH || A.kind === K_IVL) {
          const half = A.kind <= K_EML ? emHalf : ivHalf, mid = A.kind <= K_EML ? emMid : ivMid;
          if (half > 0 && mid > 0) capB = `±${fmtPts(half)} pts   ${((half / mid) * 100).toFixed(2)}%`;
        } else if (A.kind !== K_EMB) {
          let sb = A.strike > 0 ? `NDX ${fmtStrike(A.strike)}` : "";
          if (A.kind === K_FLIP) {
            capKind = 2;
            capB = (sb ? sb + "   " : "") + "price above: positive gamma";
            capB2 = (sb ? sb + "   " : "") + "price below: negative gamma";
          } else {
            if (!isNaN(A.net) && A.net !== 0) {
              sb += (sb ? "   " : "") + fmtUsd(A.net);
              if (A.share >= 0) sb += "   " + (A.share >= 0.01 ? (A.share * 100).toFixed(0) + "%" : "<1%");
            }
            if (A.vol > 0 && A.flag === 1) sb += (sb ? "   " : "") + "vol " + fmtCount(A.vol);
            capB = sb;
          }
        }
        disp.push({ key: `${name}@${ap.toFixed(4)}`, price: ap, name, col, w, style, pri: rankOf(A.kind), kinds: mem.map((m) => m.kind), b0, members: mem,
          capA: null, capB, capB2, capKind, capPx: A.price });
      }
      const out = { disp, ghosts, em: [emHalf, emMid] as [number, number] };
      cache.set(key, out);
      if (cache.size > 600) cache.delete(cache.keys().next().value as string);
      return out;
    };

    // ---- events (bar close)
    const events: StudyEvent[] = [];
    const firstBar = Math.min(...lv.map((L) => L.b0));
    {
      // the set(s): on the bar its lines start
      const sets = new Map<string, Lv[]>();
      for (const L of lv) if (L.flag !== 1) { const a = sets.get(L.set) ?? []; a.push(L); sets.set(L.set, a); }
      for (const [, ls] of sets) {
        const b = Math.min(...ls.map((L) => L.b0));
        const d0 = display(b, false).disp;
        const pick = (kd: number) => d0.find((D) => D.kinds[0] === kd || (D.kinds.includes(kd) && D.members.length > 1));
        const parts: string[] = [];
        for (const kd of [K_RES, K_FLIP, K_SUP0, K_MPAIN]) { const D = pick(kd); if (D && !parts.some((p) => p.startsWith(D.name))) parts.push(`${D.name} ${fmtPx(D.price)}`); }
        const name = ls[0].setName;
        const t = new Date(Date.UTC(2026, 0, 1) + ls[0].sinceMin * 60000);
        events.push({
          i: b, price: undefined, tone: "gold", weight: 3, title: name.startsWith("Day") ? "DAY SET" : "OVERNIGHT SET",
          text: `${hhmm(s, b)} — DS GEX locked the ${name}, captured at ${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")} ET and held from here: ${parts.join(", ")}. Each line starts on this bar.`,
        });
      }
    }
    const lastCross = new Map<string, number>(), lastTouch = new Map<string, number>();
    for (let k = Math.max(1, firstBar + 1); k < n; k++) {
      if (s.t[k] - s.t[k - 1] > 60) continue; // no comparison across the daily break / data gaps
      const prev = display(k - 1, false).disp, now = display(k, false).disp;
      const pc = s.c[k - 1], c = s.c[k];
      for (const D of now) {
        if (!prev.some((P) => P.key === D.key)) continue;
        const P = D.price, nm = D.name, up = pc < P && c >= P, dn = pc > P && c <= P;
        const A = D.members[0], strong = tier(A.kind) === 2;
        const head = nm.split(" / ")[0];
        const what = MEANING[A.kind] ?? "a DS GEX level";
        const also = D.members.length > 1 ? ` (merged with ${D.members.slice(1).map((m) => m.label).join(", ")} into one confluence line)` : "";
        // the tool's alert id is per level (kind + price) and re-arms after 300 s; levels the tool
        // does not alert on (Max Pain, G+/G-, EM) are narrated at most once per 15 bars
        const armed = A.kind <= K_FLIP;
        if (up || dn) {
          if (k - (lastCross.get(D.key) ?? -99) < (armed ? REARM : NARRATE_REARM)) continue;
          lastCross.set(D.key, k);
          lastTouch.set(D.key, k);
          events.push({
            i: k, price: P, tone: up ? "bull" : "bear", weight: strong ? 3 : 2,
            title: `CROSSED ${up ? "ABOVE" : "BELOW"} ${head.toUpperCase()}`.slice(0, 28),
            text: `${hhmm(s, k)} — the bar closed at ${fmtPx(c)}, ${up ? "above" : "below"} ${head} ${fmtPx(P)}${also}, after the previous close at ${fmtPx(pc)} on the other side. ${head} is ${what}${A.strike > 0 && A.kind !== K_EMH && A.kind !== K_EML ? ` (NDX ${fmtStrike(A.strike)})` : ""}.`,
          });
          continue;
        }
        // reached the level and closed back on the side it came from
        const fromBelow = pc < P && c < P && s.h[k] >= P;
        const fromAbove = pc > P && c > P && s.l[k] <= P;
        if ((fromBelow || fromAbove) && k - (lastTouch.get(D.key) ?? -99) >= TOUCH_REARM && (armed || k - (lastCross.get(D.key) ?? -99) >= NARRATE_REARM)) {
          if (!armed) lastCross.set(D.key, k);
          lastTouch.set(D.key, k);
          events.push({
            i: k, price: P, tone: "gold", weight: strong ? 2 : 1,
            title: `AT THE ${head.toUpperCase()}`.slice(0, 28),
            text: `${hhmm(s, k)} — the bar ${fromBelow ? "rose" : "fell"} to ${head} ${fmtPx(P)}${also} and closed back ${fromBelow ? "below" : "above"} it at ${fmtPx(c)}. ${head} is ${what}; the level marks where hedging concentrates, the reaction is the market's.`,
          });
        }
      }
    }
    events.sort((a, b) => a.i - b.i);

    // ---- reads
    const nearest = (k: number, p: number) => {
      const d = display(k, false).disp;
      let ab: Disp | null = null, be: Disp | null = null;
      for (const D of d) {
        if (D.price > p && (!ab || D.price < ab.price)) ab = D;
        if (D.price <= p && (!be || D.price > be.price)) be = D;
      }
      return { ab, be, d };
    };
    const regime = (k: number, p: number): ReadItem | null => {
      const f = display(k, false).disp.find((D) => D.kinds.includes(K_FLIP));
      if (!f) return { label: "Gamma Flip", value: "none on this set" };
      const below = p < f.price;
      return { label: "Gamma Flip", value: below ? "price below: negative gamma" : "price above: positive gamma", tone: (below ? "bear" : "bull") as Tone };
    };
    const status = (k: number): ReadItem[] => {
      if (k < firstBar) return [{ label: "DS GEX", value: "No set drawn yet on this bar" }];
      const p = s.c[k];
      const { ab, be, d } = nearest(k, p);
      const out: ReadItem[] = [{ label: "Set", value: d[0]?.members[0].setName ?? "—" }];
      const r = regime(k, p); if (r) out.push(r);
      out.push({ label: "Level above", value: ab ? `${ab.name} ${fmtPx(ab.price)}` : "—" });
      out.push({ label: "Level below", value: be ? `${be.name} ${fmtPx(be.price)}` : "—" });
      const em = display(k, false).em;
      if (em[0] > 0) out.push({ label: "Expected move", value: `±${fmtPts(em[0])} pts · ${((em[0] / em[1]) * 100).toFixed(2)}%` });
      return out;
    };
    const readout = (i: number): ReadItem[] => {
      if (i < firstBar) return [{ label: "DS GEX", value: "No set drawn yet on this bar" }];
      const p = s.c[i];
      const { ab, be } = nearest(i, p);
      const out: ReadItem[] = [{ label: "Close", value: fmtPx(p) }];
      out.push({ label: "Above", value: ab ? `${ab.name} ${fmtPx(ab.price)} (+${(ab.price - p).toFixed(2)})` : "—" });
      out.push({ label: "Below", value: be ? `${be.name} ${fmtPx(be.price)} (−${(p - be.price).toFixed(2)})` : "—" });
      const r = regime(i, p); if (r) out.push(r);
      return out;
    };

    // ---- painting (DrawBehindBars: everything under the candles)
    const under = (d: Draw) => {
      const k = d.k;
      if (k < firstBar) return;
      const bands = d.on("bands"), caps = d.on("captions");
      const { disp, ghosts } = display(k, bands);
      const pv = d.price, ctx = d.ctx;
      const light = d.th.name === "light";
      const bg = hexRgb(d.th.bg);
      const xl = 0, xr = d.plotRight, yt = pv.top, yb = pv.bottom;
      const lastIdx = d.live ? d.live.i : k;
      const lastPrice = d.live ? d.live.c : s.c[k];
      const refDay = Math.floor(s.t[lastIdx] / 1440);
      const bodyW = Math.max(1, Math.min(d.bw * 0.66, d.bw - 1));
      const sans = (sz: number, wt: number) => ({ size: sz, weight: wt, font: "sans" as const });
      const lineX0 = (D: Disp) => d.x(D.b0);
      const yOf = (D: Disp) => pv.y(D.price);

      // bar columns (BuildBarColumns): high/low per pixel column with 3 px air
      const px0 = Math.ceil(xl), cols = Math.floor(xr) - px0;
      const colHi = new Float64Array(cols).fill(-Infinity), colLo = new Float64Array(cols).fill(Infinity);
      const halfW = Math.max(1, Math.floor(bodyW / 2)) + BAR_AIR;
      for (let i = d.i0; i <= Math.min(d.i1, lastIdx); i++) {
        const cx = Math.round(d.x(i)) - px0;
        let a = cx - halfW, b = cx + halfW;
        if (b < 0 || a >= cols) continue;
        a = Math.max(0, a); b = Math.min(cols - 1, b);
        const h = d.live && i === d.live.i ? d.live.h : s.h[i], l = d.live && i === d.live.i ? d.live.l : s.l[i];
        for (let x = a; x <= b; x++) { if (h > colHi[x]) colHi[x] = h; if (l < colLo[x]) colLo[x] = l; }
      }
      const blk = new Uint8Array(cols + 1);
      const block = (a: number, b: number) => { a = Math.max(0, a); b = Math.min(cols, b); for (let x = a; x < b; x++) blk[x] = 1; };
      const blockBars = (top: number, bot: number) => {
        const pA = pv.v(top - 1), pB = pv.v(bot + 1), pHi = Math.max(pA, pB), pLo = Math.min(pA, pB);
        for (let x = 0; x < cols; x++) if (colHi[x] >= pLo && colLo[x] <= pHi) blk[x] = 1;
      };
      const findSlot = (lo: number, hi: number, w: number, want: number) => {
        if (w <= 0 || hi - lo < w) return -1;
        let best = -1, bestCost = 1e9, st = -1;
        for (let x = lo; x <= hi; x++) {
          if (x < hi && blk[x] === 0) { if (st < 0) st = x; continue; }
          if (st >= 0 && x - st >= w) {
            const c = want < st ? st : want > x - w ? x - w : want;
            const cost = Math.abs(c - want);
            if (cost < bestCost) { bestCost = cost; best = c; }
          }
          st = -1;
        }
        return best;
      };

      // LayoutLabels
      type Tag = { D: Disp; yy: number; x0: number; lx: number; lw: number; lt: number; lb: number; showPx: boolean; nameW: number; pxW: number; placed: boolean;
        cx: number; cw: number; ct: number; cb: number; capPlaced: boolean; capAlt: boolean; capFull: boolean; capA: string | null };
      const tags: Tag[] = [];
      for (const D of disp) {
        const y = yOf(D);
        const x0 = lineX0(D);
        if (y < yt || y > yb || x0 > xr) continue;
        const yy = D.w % 2 === 1 ? Math.round(y) + 0.5 : Math.round(y);
        tags.push({ D, yy, x0, lx: 0, lw: 0, lt: 0, lb: 0, showPx: false, nameW: d.measure(D.name, sans(NAME_SZ, 600)), pxW: d.measure(fmtPx(D.price), sans(NAME_SZ, 400)), placed: false,
          cx: 0, cw: 0, ct: 0, cb: 0, capPlaced: false, capAlt: false, capFull: false, capA: null });
      }
      for (let i = 1; i < tags.length; i++) { const L = tags[i]; let j = i - 1; while (j >= 0 && (tags[j].D.pri > L.D.pri || (tags[j].D.pri === L.D.pri && tags[j].D.w < L.D.w))) { tags[j + 1] = tags[j]; j--; } tags[j + 1] = L; }
      const lo = LBL_EDGE, hi = cols - LBL_EDGE;
      if (hi - lo >= 16) {
        for (let i = 0; i < tags.length; i++) {
          const L = tags[i];
          let top = Math.floor(L.yy - LBL_H * 0.5);
          if (top < yt) top = Math.ceil(yt);
          if (top + LBL_H > yb) top = Math.floor(yb - LBL_H);
          if (top < yt) continue;
          const bot = top + LBL_H;
          const wName = Math.ceil(L.nameW), wFull = Math.ceil(L.nameW + LBL_PXGAP + L.pxW);
          const loL = Math.max(lo, Math.ceil(L.x0) - px0 + LBL_GAP);
          if (hi - loL < 16) continue;
          const want = (w: number) => loL + Math.floor((hi - loL - w) / 2);
          let slot = -1, wUse = 0, withPx = false;
          for (let pass = 0; pass < 2 && slot < 0; pass++) {
            blk.fill(0);
            if (pass === 0) blockBars(top, bot);
            for (let j = 0; j < i; j++) { const P = tags[j]; if (!P.placed || P.lb + 1 <= top || P.lt - 1 >= bot) continue; block(P.lx - px0 - LBL_APART, P.lx - px0 + P.lw + LBL_APART); }
            slot = findSlot(loL, hi, wFull, want(wFull));
            if (slot >= 0) { wUse = wFull; withPx = true; }
            else { slot = findSlot(loL, hi, wName, want(wName)); if (slot >= 0) wUse = wName; }
          }
          if (slot < 0) continue;
          Object.assign(L, { lx: px0 + slot, lw: wUse, lt: top, lb: bot, showPx: withPx, placed: true });
        }
      }

      // LayoutCaptions
      if (caps) {
        const fwdX = d.i1 >= lastIdx ? d.x(lastIdx) + Math.max(1, Math.floor(bodyW / 2)) + 10 : xr + 1;
        const fw = Math.ceil(fwdX) - px0;
        const lo0 = LBL_EDGE, chi = cols - LBL_EDGE;
        if (chi - lo0 >= 24) for (let i = 0; i < tags.length; i++) {
          const L = tags[i], D = L.D;
          if (D.capKind === 0) continue;
          const sinceT = new Date(Date.UTC(2026, 0, 1) + D.members[0].sinceMin * 60000);
          const hm = `${String(sinceT.getUTCHours()).padStart(2, "0")}:${String(sinceT.getUTCMinutes()).padStart(2, "0")}`;
          // Example hygiene (web showcase): an example session carries no date, so the capture time is not printed
          const capA = !showTime ? "" : Math.floor(D.members[0].sinceMin / 1440) !== refDay ? `${DAYS[sinceT.getUTCDay()]} ${hm}` : hm;
          const alt = D.capKind === 2 && lastPrice > 0 && lastPrice < D.capPx;
          const bTxt = alt ? D.capB2 : D.capB;
          const aW = capA ? d.measure(capA, sans(CAP_SZ, 600)) : 0, bW = bTxt ? d.measure(bTxt, sans(CAP_SZ, 400)) : 0;
          const wFull = Math.ceil(aW + (bTxt && capA ? CAP_GAP : 0) + bW), wShort = Math.ceil(aW);
          if (wFull <= 0) continue;
          const half = D.w * 0.5, h = CAP_H;
          const loC = Math.max(lo0, Math.ceil(L.x0) - px0 + 4);
          if (chi - loC < wShort) continue;
          let slot = -1, wUse = 0, top = 0;
          for (let f = 0; f < 2 && slot < 0; f++) {
            const w = f === 0 ? wFull : wShort;
            if (f === 1 && wShort === wFull) break;
            const want = fw + w <= chi ? Math.max(fw, loC) : chi - w;
            for (let side = 0; side < 3 && slot < 0; side++) {
              if (side === 2 && !L.placed) break;
              top = side === 0 ? Math.floor(L.yy - half - 1 - h) : side === 1 ? Math.ceil(L.yy + half + 1) : Math.floor(L.lt - 1 - h);
              if (top < yt || top + h > yb) continue;
              const bot = top + h;
              blk.fill(0);
              for (const O of disp) {
                if (O === D) continue;
                const y = yOf(O);
                if (y < yt || y > yb) continue;
                const oy = O.w % 2 === 1 ? Math.round(y) + 0.5 : Math.round(y), hw = O.w * 0.5 + 2;
                if (oy + hw < top || oy - hw > bot) continue;
                block(Math.floor(Math.max(lineX0(O), px0)) - px0 - CAP_APART, cols);
              }
              blockBars(top, bot);
              for (let j = 0; j < tags.length; j++) {
                const P = tags[j];
                if (P.placed && !(side === 2 && j === i) && !(P.lb + 1 <= top || P.lt - 1 >= bot)) block(P.lx - px0 - CAP_APART, P.lx - px0 + P.lw + CAP_APART);
                if (j !== i && P.capPlaced && !(P.cb + 1 <= top || P.ct - 1 >= bot)) block(P.cx - px0 - CAP_APART, P.cx - px0 + P.cw + CAP_APART);
              }
              slot = findSlot(loC, chi, w, want);
              if (slot >= 0) wUse = w;
            }
          }
          if (slot < 0) continue;
          Object.assign(L, { cx: px0 + slot, cw: wUse, ct: top, cb: top + h, capPlaced: true, capAlt: alt, capFull: wUse === wFull, capA });
        }
      }

      const gapsFor = (yy: number, halfW2: number, self: Tag | null) => {
        const g: [number, number][] = [];
        for (const T of tags) {
          if (T.placed && !(yy + halfW2 < T.lt - 1 || yy - halfW2 > T.lb + 1)) g.push([T.lx - LBL_GAP, T.lx + T.lw + LBL_GAP]);
          if (T.capPlaced && T !== self && !(yy + halfW2 < T.ct - 1 || yy - halfW2 > T.cb + 1)) g.push([T.cx - CAP_LGAP, T.cx + T.cw + CAP_LGAP]);
        }
        return g.sort((a, b) => a[0] - b[0]);
      };
      const stroke = (x: number, x1: number, yy: number, w: number, color: string, style: Style, gaps: [number, number][]) => {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = style === "dot" ? "square" : "butt";
        if (style === "dash") ctx.setLineDash([2 * w, 2 * w]);
        else if (style === "dot") { ctx.setLineDash([0.001, 3 * w]); ctx.lineDashOffset = 1.5 * w; }
        ctx.beginPath();
        for (let q = 0; q <= gaps.length; q++) {
          const xe = q < gaps.length ? Math.min(gaps[q][0], x1) : x1;
          if (xe - x >= 3) { ctx.moveTo(x, yy); ctx.lineTo(xe, yy); }
          if (q < gaps.length && gaps[q][1] > x) x = gaps[q][1];
        }
        ctx.stroke(); ctx.restore();
      };

      // DrawGhosts (level history)
      for (const G of ghosts) {
        const y = pv.y(G.price);
        if (y < yt || y > yb || G.e < d.i0) continue;
        const x0 = G.b0 < d.i0 ? xl : d.x(G.b0), x1 = d.x(G.e);
        if (x1 <= xl || x0 >= xr) continue;
        const a = Math.max(xl, x0), b = Math.min(xr, x1);
        if (b - a < 2) continue;
        const yy = Math.round(y) + 0.5, c = COL[G.kind] ?? [140, 147, 168];
        stroke(a, b, yy, 1, rgba(c, Math.max(0.05, LINE_OPACITY * 0.6)), "dot", gapsFor(yy, 0.5, null));
        const tc = rgba(c, Math.min(1, LINE_OPACITY * 1.1));
        if (x0 > xl + 0.5) d.line([[Math.round(x0) + 0.5, yy - 3], [Math.round(x0) + 0.5, yy + 3]], tc, 1);
        if (x1 < xr - 0.5) d.line([[Math.round(x1) + 0.5, yy - 3], [Math.round(x1) + 0.5, yy + 3]], tc, 1);
      }
      // DrawDisplay: lines (opened around labels) + the start tick
      for (const T of tags) {
        const D = T.D, x0 = Math.max(xl, T.x0);
        if (x0 >= xr - 1) continue;
        stroke(x0, xr, T.yy, D.w, rgba(D.col, LINE_OPACITY), D.style, gapsFor(T.yy, D.w * 0.5, T));
        if (T.x0 > xl + 0.5) {
          const tx = Math.round(T.x0) + 0.5, th = D.w * 0.5 + 3;
          d.line([[tx, Math.floor(T.yy - th)], [tx, Math.ceil(T.yy + th)]], rgba(D.col, Math.min(1, LINE_OPACITY * 1.8)), 1);
        }
      }
      // DrawLabels
      for (const T of tags) {
        if (!T.placed) continue;
        const base: RGB = light ? (T.D.col.map((v) => Math.round(v * 0.68)) as RGB) : T.D.col;
        const tc = fit(base, bg, 1, light), pc = fit(base, bg, 0.85, light);
        const cy = T.lt + LBL_H / 2;
        d.text(T.D.name, T.lx, cy, { ...sans(NAME_SZ, 600), color: rgba(tc, 1) });
        if (T.showPx) d.text(fmtPx(T.D.price), T.lx + T.nameW + LBL_PXGAP, cy, { ...sans(NAME_SZ, 400), color: rgba(pc, 0.85) });
      }
      // DrawCaptions
      for (const T of tags) {
        if (!T.capPlaced || T.capA === null) continue;
        const base: RGB = light ? (T.D.col.map((v) => Math.round(v * 0.68)) as RGB) : T.D.col;
        const tc = fit(base, bg, 1, light), dc = fit(base, bg, CAP_DETAIL_A, light);
        const cy = T.ct + CAP_H / 2;
        const aW = T.capA ? d.text(T.capA, T.cx, cy, { ...sans(CAP_SZ, 600), color: rgba(tc, 1) }) : 0;
        const bTxt = T.capAlt ? T.D.capB2 : T.D.capB;
        if (T.capFull && bTxt) d.text(bTxt, T.cx + (T.capA ? aW + CAP_GAP : 0), cy, { ...sans(CAP_SZ, 400), color: rgba(dc, CAP_DETAIL_A) });
      }
    };

    return {
      events,
      under,
      draw: () => {},
      status: (k) => status(k),
      readout,
      priceExtent: (i0, i1, k) => {
        if (k < firstBar) return null;
        let lo = Infinity, hi = -Infinity;
        for (let i = i0; i <= Math.min(i1, k); i++) { if (s.h[i] > hi) hi = s.h[i]; if (s.l[i] < lo) lo = s.l[i]; }
        if (!isFinite(lo)) return null;
        const span = Math.max(hi - lo, 40);
        let a = Infinity, b = -Infinity;
        for (const D of display(k, false).disp) {
          if (D.price > hi && D.price - hi <= span * 0.6) b = Math.max(b, D.price);
          if (D.price < lo && lo - D.price <= span * 0.6) a = Math.min(a, D.price);
        }
        return [isFinite(a) ? a : lo, isFinite(b) ? b : hi];
      },
      legend: [
        { label: "Call Wall", color: "rgb(0,208,132)", shape: "line" },
        { label: "Put Wall", color: "rgb(255,59,48)", shape: "line" },
        { label: "CW 0DTE", color: "rgb(0,200,255)", shape: "line" },
        { label: "PW 0DTE", color: "rgb(255,128,150)", shape: "line" },
        { label: "Gamma Flip", color: "rgb(255,196,0)", shape: "line" },
        { label: "Max Pain", color: "rgb(163,61,255)", shape: "line" },
        { label: "G+ / G-", color: "rgb(25,217,196)", shape: "line" },
        { label: "Expected Move", color: "rgb(140,150,168)", shape: "dash" },
        { label: "Confluence", color: "rgb(198,255,0)", shape: "line" },
      ],
    };
  },
};
