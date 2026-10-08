/**
 * THE FREE VAULT — SEARCH BY WHAT AN INDICATOR COMPUTES (Tom, 2026-10-08:
 * "there should be something users can search like EMA, VWAP, momentum, to
 * get the indicators that uses those features to show").
 *
 * HOW A PRODUCT EARNS A KEY. Every key below is backed, per product, by a
 * line of EVIDENCE: what that product actually does with it, taken from the
 * product's own copy (content/products.ts, generated from the Master sheet)
 * and checked against its NinjaScript in DS Master Folder on 2026-10-08.
 * Nothing is tagged for search reach. Examples of keys deliberately NOT
 * given:
 *   · EMA on DS VWAP — its live VWAP decays by contracts traded (a half-life
 *     in volume), which is not an exponential moving average.
 *   · Mean reversion on DS VWAP — its own copy says it "does not claim that a
 *     stretch reverts". It gets the return odds it actually measures instead.
 *   · Alerts on DS Adaptive Price Line, DS 258 and DS Parallax — none of the
 *     three raises an alert.
 * The evidence is shown on a tile when that key is what matched, so a visitor
 * reads WHY a product came up ("EMA — the fast/slow EMAs under the MACD-V
 * scale"), and can check us.
 *
 * MATCHING (Baymard, on-site search): a query is matched against each key's
 * label and its synonyms and abbreviations (HTF, S/R, TTM, BB…), then against
 * the product's name, category, hooks and copy. Keys combine with AND — a
 * second key narrows — and a key that would leave nothing is disabled rather
 * than allowed to produce an empty page. A query the vault cannot answer
 * says so and names the store products that DO answer it.
 */

import { BY_SLUG, PRODUCTS, VAULT, type Product } from "@/content/products";

export type KeyGroup = "momentum" | "value" | "chart";

export const KEY_GROUPS: { id: KeyGroup; label: string }[] = [
  { id: "momentum", label: "Momentum & signals" },
  { id: "value", label: "Value, levels & time" },
  { id: "chart", label: "On the chart" },
];

export type VaultKey = {
  id: string;
  label: string;
  group: KeyGroup;
  /** Lower-case words and abbreviations that should find this key. */
  syn: string[];
  /** product slug → what that product does with it (shown when it matches). */
  has: Record<string, string>;
};

export const VAULT_KEYS: VaultKey[] = [
  // ------------------------------------------------------------ momentum
  {
    id: "momentum",
    label: "Momentum",
    group: "momentum",
    syn: ["momentum", "oscillator", "osc", "impulse"],
    has: {
      macd: "MACD-V momentum, read across six named regimes",
      stochastics: "four stochastic speeds latching into ROTATION, PRIME and PULLBACK",
      squeeze: "TTM linear-regression momentum, normalized by ATR",
    },
  },
  {
    id: "ema",
    label: "EMA",
    group: "momentum",
    syn: ["ema", "exponential moving average", "exponential", "moving average", "ma", "average"],
    has: {
      macd: "the classic fast/slow EMAs and signal line, read on the MACD-V scale",
      squeeze: "an ATR-banded 25-period EMA arms the reversion setup",
    },
  },
  {
    id: "macd",
    label: "MACD",
    group: "momentum",
    syn: ["macd", "macd-v", "macdv", "signal line", "histogram", "crossover", "cross", "zero line"],
    has: {
      macd: "the price that crosses the signal line, solved before the bar closes",
    },
  },
  {
    id: "stochastic",
    label: "Stochastic",
    group: "momentum",
    syn: ["stochastic", "stochastics", "stoch", "%k", "%d", "overbought", "oversold"],
    has: {
      stochastics: "four stochastics — 9/3, 14/3, 40/4, 60/10 — in one panel",
    },
  },
  {
    id: "rsi",
    label: "RSI",
    group: "momentum",
    syn: ["rsi", "relative strength", "overbought", "oversold"],
    has: {
      squeeze: "RSI(9) against 65/35 inside the reversion engine",
    },
  },
  {
    id: "divergence",
    label: "Divergence",
    group: "momentum",
    syn: ["divergence", "divergences", "div", "hidden divergence"],
    has: {
      macd: "Elder-gated divergence with a PENDING → CONFIRMED lifecycle",
      stochastics: "divergence on every lane, with a confluence count",
    },
  },
  {
    id: "squeeze",
    label: "Squeeze",
    group: "momentum",
    syn: ["squeeze", "ttm", "compression", "coiling", "breakout", "fire", "keltner", "bollinger", "bollinger bands", "bb"],
    has: {
      squeeze: "Bollinger half-width over ATR, tiered COILING · SQUEEZE · DEEP",
    },
  },
  {
    id: "volatility",
    label: "Volatility · ATR",
    group: "momentum",
    syn: ["volatility", "atr", "average true range", "true range"],
    has: {
      squeeze: "compression measured in ATRs, the momentum normalized by ATR",
      macd: "MACD-V: the MACD divided by ATR, so its zones mean the same on every chart",
    },
  },
  {
    id: "bands",
    label: "Bands · σ",
    group: "momentum",
    syn: ["bands", "band", "sigma", "standard deviation", "deviation", "std", "envelope", "channel"],
    has: {
      squeeze: "Bollinger Bands measured against a Keltner-style ATR channel",
      vwap: "measured sigma bands holding half and nine in ten closes",
    },
  },
  {
    id: "adx",
    label: "ADX",
    group: "momentum",
    syn: ["adx", "dmi", "trend strength", "directional"],
    has: {
      squeeze: "ADX at or below twenty grades every fire",
    },
  },
  {
    id: "reversion",
    label: "Mean reversion",
    group: "momentum",
    syn: ["mean reversion", "reversion", "revert", "fade", "mean"],
    has: {
      squeeze: "a reversion setup with a defined target, armed only outside a squeeze",
    },
  },
  {
    id: "trend",
    label: "Trend",
    group: "momentum",
    syn: ["trend", "trending", "regime", "pullback"],
    has: {
      macd: "six regimes from RALLYING to REVERSING on the state ribbon",
      stochastics: "PULLBACK: the slow lane holding a trend while the fast lane dips",
    },
  },

  // ------------------------------------------------------- value & levels
  {
    id: "vwap",
    label: "VWAP",
    group: "value",
    syn: ["vwap", "volume weighted", "volume-weighted", "anchored vwap", "anchored", "value", "fair value", "premium", "discount"],
    has: {
      vwap: "a live VWAP and the session VWAP, each inside measured bands",
    },
  },
  {
    id: "levels",
    label: "Key levels",
    group: "value",
    syn: ["levels", "level", "key levels", "support", "resistance", "s/r", "sr", "lines"],
    has: {
      "ds-258": "every 00, 20, 50 and 80 in view, each in its own color",
      "session-levels": "each session's high and low, carried forward until it reopens",
      parallax: "unswept swing highs and lows on four higher timeframes",
    },
  },
  {
    id: "round",
    label: "Round numbers",
    group: "value",
    syn: ["round numbers", "round", "psychological", "quarter", "quarters", "00", "20", "50", "80", "258", "big figure"],
    has: {
      "ds-258": "the Nasdaq's 00/20/50/80 map across the visible chart",
    },
  },
  {
    id: "liquidity",
    label: "Liquidity",
    group: "value",
    syn: ["liquidity", "stops", "stop hunt", "sweep", "sweeps", "buy-side", "sell-side", "bsl", "ssl", "equal highs", "equal lows", "pools", "smc"],
    has: {
      parallax: "buy-side and sell-side pools, ghosted once swept",
    },
  },
  {
    id: "mtf",
    label: "Multi-timeframe",
    group: "value",
    syn: ["multi-timeframe", "multi timeframe", "multitimeframe", "mtf", "htf", "higher timeframe", "timeframes"],
    has: {
      parallax: "up to four live higher-timeframe charts on your chart",
    },
  },
  {
    id: "sessions",
    label: "Sessions",
    group: "value",
    syn: ["session", "sessions", "asia", "london", "new york", "ny", "killzone", "killzones", "ict", "forex", "fx", "opening range"],
    has: {
      "session-levels": "Asia, London and New York, with futures, ICT and forex presets",
    },
  },
  {
    id: "volume",
    label: "Volume",
    group: "value",
    syn: ["volume", "contracts", "participation"],
    has: {
      vwap: "volume-weighted value, with a memory counted in contracts traded",
    },
  },
  {
    id: "odds",
    label: "Probabilities",
    group: "value",
    syn: ["probability", "probabilities", "odds", "statistics", "stats", "percent", "reach"],
    has: {
      vwap: "measured reach contours and return-to-VWAP odds in the margin",
    },
  },

  // ---------------------------------------------------------- on the chart
  {
    id: "price",
    label: "Price line & readout",
    group: "chart",
    syn: ["price line", "last price", "price marker", "current price", "price display", "price", "readout", "big price"],
    has: {
      "adaptive-priceline": "a last-price line anchored to the live candle on every frame",
      "chart-price": "the last price in large type, in any of nine places",
    },
  },
  {
    id: "countdown",
    label: "Bar countdown",
    group: "chart",
    syn: ["countdown", "timer", "candle timer", "bar timer", "time to close", "clock", "bar close"],
    has: {
      "adaptive-priceline": "a countdown to the bar's close riding the line",
      parallax: "each higher-timeframe chart counts down to its own close",
    },
  },
  {
    id: "alerts",
    label: "Alerts",
    group: "chart",
    syn: ["alerts", "alert", "sound", "audio", "notification", "alarm"],
    has: {
      "chart-price": "three price alerts with built-in tones and real volume control",
      "session-levels": "alerts when a close takes a level, or price comes near one",
      macd: "alerts on the cross, the armed cross, zero, the histogram turn and divergence",
      stochastics: "alerts on ROTATION, PRIME, PULLBACK, a quad extreme and divergence",
      squeeze: "alerts on the squeeze, an early entry, the fire and a reversion setup",
      vwap: "alerts on EXTENDED, BACK IN VALUE, AT VWAP and STRETCHED",
    },
  },
  {
    id: "chop",
    label: "Chop filter",
    group: "chart",
    syn: ["chop", "choppy", "chop filter", "efficiency ratio", "kaufman", "ranging", "sideways"],
    has: {
      "chart-price": "Kaufman Efficiency Ratio: the readout eases to amber in chop",
      macd: "ranging suppression, so a flat market does not fire on noise",
    },
  },
];

/**
 * QUALITIES EVERY PRODUCT SHARES ARE NOT KEYS (Tom, 2026-10-08: "non-repainting
 * [4] infers that the rest of the indicators re-paint. which is completely
 * false."). A key that only some products carry says the others lack it, so a
 * quality the whole vault has must never be one — not repainting, not the
 * market it runs on. A query that asks about one is answered with EVERY
 * product and one plain line saying why, instead of a short list that implies
 * the rest fail it.
 * Do not add a quality here unless it is true of every product in the vault.
 */
export const UNIVERSALS: { id: string; syn: string[]; note: string }[] = [
  {
    id: "repaint",
    syn: ["repaint", "repaints", "repainting", "no repaint", "non-repainting", "non repainting", "nonrepainting", "redraw", "redraws"],
    note: "Nothing in the vault repaints, so it is not something to filter by — every product is shown.",
  },
  {
    id: "market",
    syn: ["nq", "mnq", "es", "mes", "ym", "mym", "rty", "m2k", "nasdaq", "nasdaq 100", "ndx", "s&p", "spx", "sp500", "futures", "gold", "gc", "mgc", "oil", "cl", "mcl", "instrument", "instruments", "market", "markets"],
    note: "Every product in the vault runs on any instrument NinjaTrader 8 charts, so every product is shown. DS 258's level map is drawn for the Nasdaq's hundred-point blocks.",
  },
];

/** The universal qualities a query asks about (shown as one line above the results). */
export function universalNotes(query: string): string[] {
  const ts = terms(query);
  return UNIVERSALS.filter((u) => ts.some((t) => u.syn.includes(t))).map((u) => u.note);
}
const isUniversal = (t: string) => UNIVERSALS.some((u) => u.syn.includes(t));

export const KEY_BY_ID: Record<string, VaultKey> = Object.fromEntries(VAULT_KEYS.map((k) => [k.id, k]));

/** The keys a product holds, in vocabulary order. */
export const keysFor = (slug: string) => VAULT_KEYS.filter((k) => slug in k.has);

/* ------------------------------------------------------------------ matching */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‐-―]/g, "-")
    .trim();

/** Split a query into terms, keeping known multi-word phrases whole. */
function terms(q: string): string[] {
  const n = norm(q).replace(/[^a-z0-9%/\-& ]+/g, " ");
  if (!n.trim()) return [];
  const phrases = [...VAULT_KEYS.flatMap((k) => k.syn), ...UNIVERSALS.flatMap((u) => u.syn)]
    .filter((s) => s.includes(" "))
    .sort((a, b) => b.length - a.length);
  let rest = ` ${n.replace(/\s+/g, " ")} `;
  const out: string[] = [];
  for (const p of phrases) {
    if (rest.includes(` ${p} `)) {
      out.push(p);
      rest = rest.replace(` ${p} `, " ");
    }
  }
  return out.concat(rest.split(" ").filter((t) => t.length > 0));
}

/** Keys a single term points at: exact synonym, or a prefix of 2+ letters. */
function keysForTerm(t: string): VaultKey[] {
  const exact = VAULT_KEYS.filter((k) => k.syn.includes(t) || norm(k.label) === t);
  if (exact.length) return exact;
  if (t.length < 2) return [];
  return VAULT_KEYS.filter((k) => k.syn.some((s) => s.startsWith(t)) || norm(k.label).startsWith(t));
}

const haystack = (p: Product) => norm([p.name, p.category, p.purpose, ...p.hooks, p.helps].join(" "));
const deepHaystack = (p: Product) => norm(p.description);

export type Hit = {
  slug: string;
  /** The keys that matched, with this product's evidence — shown on the tile. */
  why: { key: VaultKey; note: string }[];
  /** Matched in the product's own words rather than through a key. */
  text: boolean;
  score: number;
};

/**
 * Search a set of products. Every term must be satisfied (AND), by a key the
 * product holds, its name, category, hooks or copy. `picked` keys must all be
 * held. Returns hits in a stable, relevance-first order.
 */
export function searchProducts(products: Product[], query: string, picked: string[] = [], useKeys = true): Hit[] {
  const ts = terms(query);
  const hits: Hit[] = [];
  for (const p of products) {
    if (!picked.every((id) => KEY_BY_ID[id] && p.slug in KEY_BY_ID[id].has)) continue;
    const why = new Map<string, { key: VaultKey; note: string }>();
    for (const id of picked) why.set(id, { key: KEY_BY_ID[id], note: KEY_BY_ID[id].has[p.slug] });
    let ok = true;
    let text = false;
    let score = picked.length * 10;
    const hay = haystack(p);
    const deep = deepHaystack(p);
    for (const t of ts) {
      // A quality every product shares (UNIVERSALS) holds for all of them.
      if (useKeys && isUniversal(t)) continue;
      // A term that names a key is answered by the key alone: the keys are the
      // checked list, and the copy would mislead ("volume" is in DS Chart
      // Price's copy — as its alert-sound volume).
      const named = useKeys ? keysForTerm(t) : [];
      if (named.length) {
        const ks = named.filter((k) => p.slug in k.has);
        if (!ks.length) {
          ok = false;
          break;
        }
        for (const k of ks) why.set(k.id, { key: k, note: k.has[p.slug] });
        score += 10;
        continue;
      }
      // Otherwise the product's own words: a whole word under four letters,
      // the start of a word from four up ("ex" must not find "exact").
      // A plural or a -y word still finds its other form ("strategy" finds
      // "strategies"): from five letters, the last letter is let go.
      const stem = t.length >= 5 ? t.slice(0, -1) : t;
      const esc = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(^|[^a-z0-9])${esc}${t.length < 4 ? "($|[^a-z0-9])" : ""}`);
      if (re.test(norm(p.name))) {
        score += 20;
        text = true;
      } else if (re.test(hay)) {
        score += 4;
        text = true;
      } else if (t.length >= 3 && re.test(deep)) {
        score += 1;
        text = true;
      } else {
        ok = false;
        break;
      }
    }
    if (ok) hits.push({ slug: p.slug, why: [...why.values()], text, score });
  }
  const order = new Map(products.map((p, i) => [p.slug, i]));
  return hits.sort((a, b) => b.score - a.score || (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

/** Suggestions for the typeahead: keys whose label or synonyms begin with the
 *  last word typed (Baymard: at most ~8, the predictive part emphasised). */
export function suggest(query: string, products: Product[], picked: string[], max = 6): VaultKey[] {
  const n = norm(query);
  if (n.length < 1) return [];
  const last = n.split(/\s+/).pop() ?? "";
  if (!last) return [];
  const slugs = new Set(products.map((p) => p.slug));
  return VAULT_KEYS.filter(
    (k) =>
      !picked.includes(k.id) &&
      Object.keys(k.has).some((s) => slugs.has(s)) &&
      (norm(k.label).startsWith(n) || norm(k.label).startsWith(last) || k.syn.some((s) => s.startsWith(n) || s.startsWith(last))),
  ).slice(0, max);
}

/** The store's products, for "not in the vault — in the store" answers. */
export const STORE_SIDE: Product[] = PRODUCTS.filter((p) => p.series !== VAULT);

/** Typed so a slug typo in `has` fails the build rather than a search. */
const _check: string[] = VAULT_KEYS.flatMap((k) => Object.keys(k.has)).filter((s) => !BY_SLUG[s] || BY_SLUG[s].series !== VAULT);
if (_check.length) throw new Error(`vault-search: keys name products outside the vault: ${_check.join(", ")}`);
