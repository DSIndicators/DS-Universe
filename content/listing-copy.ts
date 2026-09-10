/**
 * The listing copy — the same words a buyer reads on Whop, on our own page.
 *
 * GENERATED from the "Whop Listings" tab of the Product Information Sheet.
 * Do not hand-edit: change the sheet and regenerate, so the store and the site
 * never drift apart. The trailing disclaimer each listing carries is dropped
 * here on purpose — the site already renders the full risk, hypothetical
 * performance and trademark disclosures on every page, at body size, and a
 * second abbreviated copy would read as fine print beside them.
 *
 * Three corrections were applied on the way in (2026-09-10) so the copy clears
 * NinjaTrader's vendor guidelines; the same three need making on Whop itself:
 *   DS Iceberg      "highest-conviction" -> "most-confirmed"  (unfavourable word)
 *   DS Bulk Replay  "NinjaTrader has never shipped bulk downloading" -> neutral
 *   DS MarketWatch  "the failure mode a live subscription causes" -> neutral
 */
export type ListingCopy = {
  /** The one-line opener. Set larger than body text. */
  hook: string;
  /** How the thing works, in a sentence or two. */
  lede: string;
  /** The listing's own section heading. */
  heading: string;
  /** Four points, always. */
  points: string[];
  /** The closing note — usually what it does not do. */
  close: string;
};

export const LISTING: Record<string, ListingCopy> = {
  "oracle": {
    hook: "A SuperTrend that has to earn the signal before you ever see it.",
    lede: "Every flip is tested first. The bar is encoded across RSI, MA-deviation, signal distance and choppiness on three horizons, then matched against the closest states in your chart's own history. Those matches vote — and only a flip that clears your threshold is promoted to a Major signal.",
    heading: "What sits on the chart",
    points: [
      "The Neural Line — a long/short bias that turns only on a confirmed close past an ATR buffer",
      "A network audited live against a plain baseline, and demoted the moment it stops beating it",
      "Spectrum candles that colour only when four timeframes agree, so chop stays grey",
      "BUYERS / SELLERS reversal cards and confidence-tinted candles",
    ],
    close: "No repaint on engine output, no look-ahead, nothing leaving your machine. It learns in-process on your own bars.",
  },
  "sonar": {
    hook: "Every squeeze tool says a move is coming. This one says when it fires — and when it is spent.",
    lede: "Four channels, each scored 0–100 against its own history, so the same thresholds read the same on MNQ 1-minute or a daily chart.",
    heading: "The four lanes",
    points: [
      "GRAVITY — compression, made continuous instead of an on/off dot",
      "MASS — participation, this bar's volume against what it should be",
      "NOVA — expansion, this bar's range against what it should be",
      "VELOCITY — momentum, and whether it is still building",
    ],
    close: "Ignition needs all four at once, which is why it is rare. One short is a FLARE, and you see it coming. Above the lanes a state ribbon carries the whole cycle — COILING, CRITICAL, FLARE, IGNITION, EXPANDING, COOLING — so a move that is still running never looks like one that is over. Closed-bar: it does not repaint.",
  },
  "zones": {
    hook: "Most zone tools draw a box and forget it. This one watches what price does to every zone.",
    lede: "Pivots, volume supply/demand and real order flow are merged into one ranked map — and only the strongest few are drawn.",
    heading: "Every zone is alive",
    points: [
      "FRESH → APPROACHING → TESTING → DEFENDED / BREAKING, read from the live tape",
      "The edge pulses amber while tested, hot red while breaking",
      "Conviction rises when a zone defends with real absorption behind it, and drains as it is eaten",
      "KEY LEVEL marks a zone that is both strong and heavy against the rest of the map",
    ],
    close: "Each card prints the state, a STRONG / MODERATE / WEAK badge, the BUY / SELL split in words, and net delta. A zone keeps its identity — it never re-labels itself the moment price crosses it. Structure forms on closed bars, so it never repaints.",
  },
  "gex": {
    hook: "The option levels that quietly govern the day — on your chart, with nothing to subscribe to.",
    lede: "Drop it on NQ, ES or gold and the map appears. No pasting, no data fees, no setup.",
    heading: "On the chart",
    points: [
      "Call Wall and Put Wall, plus 0DTE walls for today's most reactive flow",
      "Gamma Flip — above it hedging dampens moves, below it amplifies them",
      "HGEX, Max Pain, ranked G+ / G− strikes",
      "An Expected Move band from the ATM straddle, and an ATR grid off the session open",
    ],
    close: "The flip is solved, not guessed: gamma is recomputed across a grid of hypothetical spot prices and the sign change nearest spot interpolated. Open interest settles once a day, so the map holds still — a level moves only when a rival strike wins decisively and holds that lead. Stacked levels merge into one confluence area.",
  },
  "iceberg": {
    hook: "Price shows you where the market went. This shows you where someone large would not let it go.",
    lede: "An iceberg shows a small tip and re-posts at the same price each time it is hit. Its fingerprint is absorption: heavy volume trades in, aggressors keep hitting, and price is rejected anyway.",
    heading: "Two engines, working independently",
    points: [
      "A wick-rejection and volume test that confirms only when repeated tests cluster at one price",
      "A volume-at-price footprint, refined by the true bid and ask stamped on every trade",
      "Confirmation needs a statistically heavy node absorbing on the correct side",
      "Levels both engines agree on carry a cyan border — your most-confirmed prices, at a glance",
    ],
    close: "Drawn as glass over the candles: an exact-level line with faint edges, never a fill. Built from closed bars, so it never repaints.",
  },
  "flow": {
    hook: "Price is where the market went. This is where it did business — and who was pressing.",
    lede: "Each group of candles is x-rayed into a volume-by-price profile: one row per price, split into buy and sell, longest row the fairest price.",
    heading: "What the rows tell you",
    points: [
      "HVN shelves — the heavy, accepted levels that pull price back and produce reactions",
      "FIGHT nodes — extremely heavy and two-sided, rare by design, and usually resolved by a move",
      "Thin rows — what the market rejected, and slices back through",
      "A glass candle that dims on weak volume, so a hollow move is obvious",
    ],
    close: "A silent second engine marks reversals only when three things land together: a swept level, a flipped delta, and the point of control accepted at the far end of the range. Session mode groups by Asia, London and New York. Profiles build on closed bars.",
  },
  "parallax": {
    hook: "Four higher timeframes, live, in the corner of the one chart you actually trade.",
    lede: "30m, 1h, 2h and 4h — each with its own axis, candles, live price and bar-close countdown, updating tick by tick. You never change your chart's timeframe.",
    heading: "It marks one thing, properly",
    points: [
      "BSL — buy stops resting above an unswept swing high",
      "SSL — sell stops resting below an unswept swing low",
      "Line weight is the touch count: more tests, more stops sitting beyond it",
      "Only live pools are drawn, so what you see still exists",
    ],
    close: "Run a level and close back inside and the pool is ghosted with a small cross at the sweep, because the sweep is the pattern worth seeing. Close through and hold, and it was a breakout — that level is gone. A fold tab clears the whole matrix for a moment and brings it straight back.",
  },
  "isotropic-lines": {
    hook: "An angle on a chart is a lie your monitor tells you. Resize the window and the slope changes.",
    lede: "DS Isotropic Lines normalises log-price by Yang-Zhang volatility, so an angle becomes a property of the market instead of your screen: 45° is roughly one sigma per bar, on any instrument and any timeframe.",
    heading: "How the channel is built",
    points: [
      "Boundaries are a least-squares fit, sigma-clamped so one freak wick cannot define them",
      "The ceiling can never cross the floor",
      "In a true range it says so and goes flat, rather than fitting a trend that is not there",
      "Six scales run in parallel and report how many agree",
    ],
    close: "Five- and six-of-six agreement are the conditions worth an alert, and a breakout-and-retest state machine drives them. Close Bar anchoring: it does not repaint.",
  },
  "adaptive-priceline": {
    hook: "NinjaTrader's price line drifts off the candle the moment you scroll, zoom or change your margin.",
    lede: "This one re-derives its geometry on every render frame — anchored to the live candle, running to the axis marker, exactly where it belongs no matter what you do to the chart.",
    heading: "The details",
    points: [
      "A bar-close countdown riding the line, amber in the last seconds, red at the end",
      "A timezone-proof clock learned from the live feed, not your PC — correct across DST",
      "Counts down on Heiken-Ashi and Volumetric charts too",
      "Glow, rounded caps and an anchor circle, painted behind the bars so it never covers price",
    ],
    close: "Running DS Oracle? The line can mirror Oracle's live trend colour. The link is optional — this runs perfectly alone.",
  },
  "chart-price": {
    hook: "Price lives in eight-point type on the far right of your chart. Put it where you can see it.",
    lede: "Upticks green, downticks red — and the resting colour eases to amber as the tape loses efficiency, so you feel chop before you name it.",
    heading: "Three levels, hands-free",
    points: [
      "Each sounds when price crosses it, from either direction",
      "Fires once per approach and re-arms only after price moves away, so no machine-gunning",
      "Realtime only — never on history, chart load, or while you scroll back",
      "Four tones synthesised in memory: Chime, Bell, Pulse and DSAlert, with a real volume control",
    ],
    close: "Tick-driven with no forced repaints and the alert engine off the render path, so it adds nothing to the chart you already run.",
  },
  "toolkit": {
    hook: "One rail on the chart: your indicators on top, your drawing tools below, chalk at the bottom.",
    lede: "Turning an indicator off usually means Properties, a checkbox and Apply. Here it is one click.",
    heading: "What the rail does",
    points: [
      "Lists only the DS indicators actually on that chart, never a menu of things you do not own",
      "Each switch is a mute, not a preset — your settings and templates survive every toggle",
      "ALL OFF strips the chart to bare candles; the next click restores exactly what was on",
      "Sixteen drawing tools, read live from your build, so third-party tools appear for free",
    ],
    close: "DS Chalk is included — a real drawing tool, so every stroke is a time-and-price anchor that pans, zooms and saves with the workspace. Replaces DS Control Panel and DS ToolBar & Checklist. Remove those first.",
  },
  "screener": {
    hook: "One window instead of a wall of them.",
    lede: "A screening terminal you arrange like a desk: a 1–6 column grid holding a quote board, screeners, live charts, a heat map and a news feed — all on NinjaTrader's own data.",
    heading: "Inside the grid",
    points: [
      "32 screening strategies — price, volume and level tests plus VWAP, RSI, MACD, ADX, SuperTrend and more",
      "Quote board with change, RSI, gap, volume and time-of-day RVOL for everything you pin",
      "SCREENER · NEWS · PAIRS · RACE · ALERTS, with a correlation matrix and cointegration lab",
      "Dark or soft-platinum light theme, one click apart",
    ],
    close: "Every panel, pin and setting saves itself the moment you change it. Futures, stocks, options and forex all stream the same way. It screens the instruments you pin — NinjaTrader exposes no market-wide scan. A live feed is required.",
  },
  "marketwatch": {
    hook: "Your watchlist, on the chart you are already trading. No second window to go and find.",
    lede: "Each tile is a two-colour sparkline plus one readout you choose — net change, percent, last price or the day's range — over your own timeframe window.",
    heading: "Built to stay quiet",
    points: [
      "Group tabs, a draggable panel, and a position that is remembered and always reachable",
      "Follows your NinjaTrader skin, dark or light, and re-tints itself",
      "Identical tiles share one data request, so duplicates cost nothing",
      "Data arrives on a background thread; the panel redraws only when something changed",
    ],
    close: "Market Replay gets its own feed path, so scrubbing the replay date never freezes the chart — which is what otherwise happens when the panel shares the live feed.",
  },
  "time-intervals": {
    hook: "You change timeframe fifty times a day. NinjaTrader makes it a two-step dropdown every time.",
    lede: "One row of buttons sits on the toolbar of every chart. One click and you are on that period.",
    heading: "How it behaves",
    points: [
      "Five favourites you set, shared across every chart you open",
      "The button matching your current period highlights itself, and catches up if you switch elsewhere",
      "A chevron opens the full jump-to list and the editor",
      "Transparent and theme-aware, so it looks like it shipped with the platform",
    ],
    close: "Clicking the interval you are already on does nothing, deliberately — re-applying it would trigger a full reload for no change. Nothing to drag onto a chart, no properties dialog. Compile once and it is simply there.",
  },
  "bulk-replay-downloader": {
    hook: "Building a replay library one instrument and one day at a time is an evening's work for a week of data.",
    lede: "There is no bulk option in the platform itself. This queues the whole job and shows you a per-file progress list while it runs.",
    heading: "How a run works",
    points: [
      "Add instruments, tick the ones you want, set a start and end date, start it",
      "Files land in NinjaTrader's own replay folder, so Playback finds them with no extra step",
      "Days you already have are skipped; a truncated file is re-fetched rather than trusted",
      "Weekends can be skipped — Saturdays only, since Globex opens Sunday evening",
    ],
    close: "It supplies no data of its own and bypasses no platform limit. NinjaTrader serves roughly the last 90 days, so an older start date is moved forward automatically and the change is written to the output window.",
  },
};

export const listingCopyFor = (slug: string): ListingCopy | undefined => LISTING[slug];