/**
 * The catalogue. GENERATED from "DS Universe - Master Product & Pricing Sheet"
 * (Product Catalog + Product Details tabs, updated 2026-10-05). Do not hand-edit
 * copy here; change the sheet and regenerate, so the site, the Whop listings and
 * the box art keep saying the same thing.
 *
 * THE LINEUP OF 2026-10-05 — PAID AND FREE ARE KEPT APART (Tom: "The goal is to
 * disassociate Paid from free. PAID bundle will no longer include all free
 * products. free products will be managed individually while paid will be
 * grouped together").
 *   flagship   DS Zones, DS Iceberg, DS Oracle, DS GEX, DS Flow
 *   pro        DS ProRSI, DS ProLiquidityHunter (new), DS ProHeikinAshi (new),
 *              DS ProTrendRange
 *   utility    DS Bulk Replay Downloader
 *   exclusive  FREE WITH DS COMPLETE — DS ASL (Advanced Session Levels; was
 *              DS Pro Session Levels) and DS Toolkit. Neither is sold or offered
 *              on its own: each comes free with DS Complete.
 *   vault      THE FREE VAULT — DS Adaptive Price Line, DS Chart Price, DS 258,
 *              DS Parallax, DS Session Levels, DS Stochastics (was
 *              DS ProStochastics, paid), DS Squeeze (was DS ProSqueeze, paid),
 *              DS MACD (was DS ProMACD; off the store 2026-10-04) and DS VWAP
 *              (new). Each is its own free download; none is part of DS Complete.
 * DS TOOLKIT LEFT THE FREE VAULT the same day (Tom: "DS Toolkit will come FREE
 * with the purchase of DS Complete Bundle only, same as DS ASL"). Its entry
 * below keeps the sheet's product copy word for word; only its series changed
 * (vault -> exclusive), and it sits beside DS ASL.
 * The series keys follow the sheet's own section bars. "essentials" and
 * "sessions" (the 09-20 and 09-30 keys) are retired: nothing reads them.
 *
 * WHERE A PRODUCT LIVES ON THE SITE: a vault product's page is
 * /free-vault/<slug>, every other product's is /products/<slug> — always
 * through productHref() in content/release.ts, never typed. The old addresses
 * forward permanently (next.config.mjs).
 *
 * Rules this site follows:
 *  - No product COUNTS are rendered in copy (the lineup changes).
 *  - `purpose` is the one line shown in lists; `hooks` + `helps` appear on the
 *    product page. `description` is retained for future use and NOT rendered.
 *  - Spaced hyphens in the sheet become em dashes, matching the sheet's own.
 *
 * Retired from the site on 2026-09-20 and still absent: DS Sonar, DS Isotropic
 * Lines, DS Screener, DS MarketWatch, DS Time Intervals.
 */

export type Kind = "indicator" | "addon";

/** The series, by the sheet's section bars. Copy and prices per series live in
 *  content/pricing.ts; which of them the STORE shelves, which DS Complete holds
 *  and which is the Free Vault is content/release.ts. */
export type Series = "flagship" | "pro" | "utility" | "exclusive" | "vault";

/** The Free Vault's series key — one name to grep for. */
export const VAULT: Series = "vault";

export type Product = {
  slug: string;
  name: string;
  kind: Kind;
  series: Series;
  category: string;
  /** One line. The tagline. */
  purpose: string;
  /** Four cover-page hooks. */
  hooks: string[];
  /** "How it helps traders" — the opening paragraph. */
  helps: string;
  /** Full store description. Retained, not rendered. */
  description: string;
};
export const PRODUCTS: Product[] = [
    {
        "slug": "zones",
        "name": "DS Zones",
        "kind": "indicator",
        "series": "flagship",
        "category": "Structure & Levels",
        "purpose": "Support and resistance that tells you whether it's holding right now — built from swing pivots, volume supply/demand and real order flow, with a live state machine tracking every zone tick by tick.",
        "hooks": [
            "Tracks FRESH to DEFENDED / BREAKING",
            "Order flow inside every zone",
            "Only the strongest few drawn",
            "A broken zone keeps its identity"
        ],
        "helps": "Most zone tools draw a box and leave it. DS Zones draws the box, reads the actual order flow inside it, then tracks what price does to it tick by tick — approached, tested, defended, broken — so the zones on your chart are the ones price is respecting today, not the ones that looked good when they were drawn.",
        "description": "DS Zones runs two structural engines at once — multi-length swing pivots for a full skeleton, and high-volume impulses for institutional supply and demand — then reads the real aggressive buy versus sell volume traded inside every zone from a volume-at-price footprint. Every level carries an intrinsic supply or demand identity that never flips as price crosses it, and a live, tick-driven state machine drives each zone through FRESH, APPROACHING, TESTING, DEFENDED or BREAKING, with conviction rising when a zone is genuinely defended and draining as it is consumed. A broken zone keeps its identity and dims out as a dotted band rather than vanishing without a trace or role-reversing into the opposite kind of level. A merge step fuses everything that lands on the same price into one ranked map and draws only the strongest few, so you get a clean chart instead of forty boxes. Structure is confirmed on closed bars — it does not repaint — while the live read updates with the tape."
    },
    {
        "slug": "iceberg",
        "name": "DS Iceberg",
        "kind": "indicator",
        "series": "flagship",
        "category": "Liquidity & Absorption",
        "purpose": "Finds prices that were tested and rejected repeatedly on closed bars — the footprint passive orders leave when they absorb aggressive flow — and draws them as self-updating runway zones.",
        "hooks": [
            "Finds where size was hidden",
            "Order-flow confirmed, not guessed",
            "Volume and test count shown",
            "Closed-bar accurate, never repaints"
        ],
        "helps": "An iceberg order hides its size — only a small piece shows in the book, and every time it's hit, another slice re-posts at the same price. From the outside it looks like a level that just keeps absorbing: heavy volume trades into it, aggressive buyers or sellers keep hitting it, and price is rejected anyway. Price tells you where the market went; DS Iceberg tells you where somebody large stopped it.",
        "description": "DS Iceberg runs two cooperating engines to confirm a level. The bar engine is a wick-to-body, local-extreme and volume test: a candle qualifies when its rejecting wick is long relative to its body, it sits in the outer quarter of the recent range, it closes on the rejecting side, and its volume is at or above average — a level confirms once enough qualified tests cluster at one price inside the detection window. The order-flow engine independently builds a rolling volume-at-price footprint, refined by the true bid/ask stamped on each trade, and confirms a level only when it is a statistically anomalous high-volume node with correct-side absorption. Levels both engines agree on are drawn in cyan or magenta — your highest-conviction prices, at a glance. Each level is drawn as a self-updating runway zone showing the traded volume and test count behind it, support below price and resistance above, built entirely from closed bars so it does not repaint."
    },
    {
        "slug": "oracle",
        "name": "DS Oracle",
        "kind": "indicator",
        "series": "flagship",
        "category": "AI Trend & Signals",
        "purpose": "A SuperTrend that only speaks when the evidence agrees — every flip is matched against the chart's own history and put to a weighted vote before it is promoted to a confirmed signal.",
        "hooks": [
            "AI-confirmed signals only",
            "Neural Line sets your side",
            "Five-state Spectrum candles",
            "Engine output never repaints"
        ],
        "helps": "A plain SuperTrend flips constantly, and most of those flips are noise. DS Oracle keeps the SuperTrend as the underlying structure, but on every flip asks a second question: has this market been in a state like this before, and what happened next? It measures the current conditions, finds the most similar moments in the chart's own history, and takes a weighted vote among them — only a flip the vote finds convincing gets promoted to a confirmed signal. The engine never invents a signal of its own; it only filters the SuperTrend's.",
        "description": "DS Oracle pairs a classic ATR SuperTrend structure with the Dropship AI matching engine. Every bar is encoded as a feature vector and matched against the most similar historical states on the chart's own history, with a weighted vote deciding whether a SuperTrend flip is promoted to a Major, confirmed signal — a flip the vote does not find convincing stays a Minor one. The Neural Line draws a single long/short decision boundary through price: above it, look long; below it, look short; an ATR flip buffer keeps chop from strobing the side back and forth. The Spectrum paints every candle into one of five regime states — strong down, down, chop, up, strong up — from how far four timeframes on your own chart agree with each other, so a bright candle can never contradict its own body. Default Close Bar anchoring means the engine's output does not repaint, and everything runs in-process on your own chart — no training thread, no files, no network call."
    },
    {
        "slug": "gex",
        "name": "DS GEX",
        "kind": "indicator",
        "series": "flagship",
        "category": "Options & Key Levels",
        "purpose": "Dealer gamma exposure levels computed straight from the live option chain and drawn on your chart automatically — Call/Put Walls, Gamma Flip, Expected Move, Max Pain and more, with no subscription and no setup.",
        "hooks": [
            "Live option-chain levels, zero setup",
            "Call/Put Walls and Gamma Flip",
            "Expected Move and Max Pain",
            "Captured twice daily, held still"
        ],
        "helps": "The levels that quietly govern a session's movement — dealer hedging walls, the flip point where hedging behavior reverses, the strike price pulls toward — are widely watched and usually cost a subscription to see. DS GEX computes them itself: put it on a chart and it fetches the delayed option chain for that market in the background, converts every level to your chart's own prices, and draws them — no subscription, no pasting numbers in, no setup.",
        "description": "DS GEX computes dealer gamma exposure directly from CBOE's free delayed option chain (NDX for NQ, SPX for ES, GLD for gold) on a background thread, scales every level to the chart via the basis, and holds it as a stable, session-anchored map instead of re-ranking on every feed refresh. Per-strike net GEX gives the Call Wall and Put Wall, 0DTE walls restricted to the current session's expiry, HGEX (the dominant hedging magnet), Max Pain and ranked G+/G- strikes. The Gamma Flip is solved, not guessed — Black-Scholes gamma is recomputed across a grid of hypothetical spot prices and the sign change nearest spot is interpolated — and an Expected Move band from the at-the-money straddle plus an ATR-scaled grid off the session open completes the map. The map is captured at two fixed times a day and then frozen, so the lines you planned your session around are the lines still on the chart after a reload. A manual levels-string override is included for when you want to paste your own numbers instead."
    },
    {
        "slug": "flow",
        "name": "DS Flow",
        "kind": "indicator",
        "series": "flagship",
        "category": "Order Flow & Volume Profile",
        "purpose": "X-rays each group of candles into a live volume-by-price footprint, splitting what traded at every price into buying and selling and flagging the levels that actually mattered.",
        "hooks": [
            "Buy vs sell volume at every price",
            "Heavy nodes flagged automatically",
            "One lower-timeframe series, no ticks",
            "Low-conviction moves dim on sight"
        ],
        "helps": "A candle tells you where the market went. It doesn't tell you where inside that range the volume traded, or whether buyers or sellers were doing the pressing. DS Flow x-rays groups of candles into a volume-by-price profile — a horizontal bar at every price level, split into buying and selling, with the heavy, statistically significant levels marked — so you get hidden support and resistance, absorption and exhaustion, and value migration across groups, not just a shape.",
        "description": "DS Flow groups candles and builds a volume-by-price profile for each group: every horizontal row is one price, its length the total volume traded there, split into buy and sell volume printed beside it. The longest row is the group's point of control. Statistically heavy rows are flagged as high-volume acceptance shelves — the magnets and reaction zones — while a glass-rendered candle dims on below-average volume so a hollow move is obvious at a glance, and a summary box gives total volume with buy and sell percentages. Profiles build from one extra lower-timeframe series of the same instrument (1-minute by default), so no tick-history download is needed. Detail scales cleanly with zoom, and DS Toolkit can show or hide the whole overlay from the chart's own toolbar."
    },
    {
        "slug": "prorsi",
        "name": "DS ProRSI",
        "kind": "indicator",
        "series": "pro",
        "category": "Momentum & Volume Zones",
        "purpose": "A volume-weighted RSI panel that leaves each turn out of an extreme on your price chart as a zone — sized by where the turn's volume traded, graded by the volume behind it, and scored on your own chart as HELD or BROKE.",
        "hooks": [
            "RSI weighted by relative volume",
            "Zones sized by where volume traded",
            "Volume pips on every flag",
            "A HELD / BROKE record on your chart"
        ],
        "helps": "An RSI reading tells you overbought or oversold and treats every bar the same, whether ten contracts traded or ten thousand. DS ProRSI weighs each bar's move by its volume against what is normal for that minute of the day, and when the RSI turns back from an extreme it leaves the turn on your price chart as a zone — as deep as the range where the turn's nearest volume traded, graded in three steps by the volume behind it, and reinforced when a later turn lands on it again. The panel keeps the chart's own count of zones that HELD and zones that BROKE, so you read what these zones have done on your market instead of taking a strength rating on trust.",
        "description": "DS ProRSI runs two Wilder RSIs side by side: the classic, and one in which each bar's change is multiplied by its relative volume — the bar's volume against the median of the last twenty bars that closed in the same clock minute, held between one third and three. The weighted line is the one in force; the classic stays behind it as a faint line, and RSI weighting can be set to None. An episode opens when the RSI reaches Oversold or Overbought and closes when it is back at 50. Inside an episode, a cross of the signal line that holds on the next close is a turn, and the turn becomes a zone on the price panel: the far edge at the turn's extreme, the near edge where the nearest 15% of the turn's volume traded (10% Slim, 25% Wide), never thinner than a tenth of an average true range and never thicker than one. Five strata lines mark each sixth of the zone's volume. The flag gives the RSI at the turn, three volume pips — one lit under 1.5 times normal volume, two from 1.5, three from 3 — and a count of the times price has come back into the zone and held. A turn from a later episode that lands on a live zone reinforces it: one more pip and a doubled mark at its start, instead of a second zone. A zone lives until a bar closes through its far edge (wick-break optional), then stays as a dashed gray trace, with the last six live and twelve broken zones kept. Once price has moved two average ranges away, a return is scored: HELD when price leaves by two ranges again, BROKE when the zone breaks; the header keeps both counts for the chart you are looking at. The panel carries the readout, the distance to the nearest support and resistance zone, the price at which the RSI would cross its signal on the next bar, a heat ribbon with a mark for every new, reinforced and refused turn, and a relative-volume strip. Eleven values are published for strategies and the Market Analyzer. On a market that reports no volume it runs as a classic RSI and sizes a zone from the turn's wick. A zone describes where momentum turned and where the volume traded; measured on five futures markets, heavier volume at a turn did not make a zone more likely to hold, so the panel states facts and a record and no odds. It is not a forecast. The panel's Y-axis locks by default, so dragging the chart can never push the reading off its own scale. Closed-bar decisions throughout: it does not repaint."
    },
    {
        "slug": "proliquidityhunter",
        "name": "DS ProLiquidityHunter",
        "kind": "indicator",
        "series": "pro",
        "category": "Liquidity & Reach Odds",
        "purpose": "A liquidity map with a track record — every swing high and low price has left behind drawn as a pool, heated by the measured odds that price reaches it within the horizon, and scored against what happened next on your own chart.",
        "hooks": [
            "Every resting pool, mapped and ranked",
            "Reach odds from your chart's history",
            "A live track record for every tier",
            "SWEPT or RUN, on the next close"
        ],
        "helps": "Every liquidity tool draws the same thing — the highs and lows price left behind — and most stop there. DS ProLiquidityHunter adds how likely price is to go back for each one: every pool carries the measured odds that price trades to it within the horizon, read from your own chart's history and adjusted for the time of day, and the panel scores those odds against what happened next, in its header. When a pool is taken, the next close says whether it was SWEPT or RUN. You see where the liquidity is and what it would take to get there.",
        "description": "DS ProLiquidityHunter maps every swing extreme that price has moved away from and not traded back through as a pool of resting liquidity: buy-side over the highs, sell-side under the lows. A swing is confirmed by a reversal of Swing size times the average true range — a size, not a bar count — so it means the same thing on every instrument, timeframe and bar type, Renko included. Extremes within a quarter of an average range of each other are one stacked pool, and each pool is ranked LOCAL, SWING or MAJOR by how long its extreme had stood, counted in horizons. The panel draws price as a line on close over those pools and heats each one by the odds that price trades to it within the horizon, 60 bars by default. The odds are a measurement: a yardstick of one sigma of the next horizon, in points, adjusted for each quarter-hour of the day, and a record of how far price went in the horizon after every bar on the chart. Until the chart has built that record, the odds are the textbook ones for a market with no drift. The four tiers — COLD, COOL from 5%, WARM from 25%, HOT from 60% — are probabilities, so there is no threshold to tune, and each is latched so a band does not flicker on a line. A track record in the header reports how often the pools of each tier were taken within the horizon, on the chart you are looking at. When price trades through a pool it is taken, and the next close gives the verdict: back inside the level is SWEPT, still beyond it is RUN. In the margin an odds ladder, three odds zones and a reach bracket describe the present; scroll back and the panel shows the pools as they stood on that bar. On the price chart the pools with the top odds on each side are drawn as dashed levels with a flag at the axis, and a swept MAJOR pool gets a chevron beyond the wick that took it. Two color themes, Moonlight and Heatmap, each with a set for dark and for light charts. Nine values are published for strategies and the Market Analyzer. It reads price only and needs nothing but the chart's own bars. It measures how likely price is to reach a level and marks a precisely defined event; it does not see resting orders, and it is not a forecast of direction. Closed-bar decisions throughout: it does not repaint."
    },
    {
        "slug": "proheikinashi",
        "name": "DS ProHeikinAshi",
        "kind": "indicator",
        "series": "pro",
        "category": "Heikin-Ashi & Flip Levels",
        "purpose": "A Heikin-Ashi panel under your candlestick chart — every candle standing on its own open, the price at which its color flips drawn back on the price chart, and the measured odds that it flips on the next bar.",
        "hooks": [
            "Heikin-Ashi under real candles",
            "The flip level, as a real price",
            "Flip odds, learned on your chart",
            "Locked panel scale, never drifts"
        ],
        "helps": "A Heikin-Ashi chart shows the trend and hides the price: its candles are averages, so no open, high, low or close on it is a price that traded. DS ProHeikinAshi leaves the candlestick chart as it is and draws the Heikin-Ashi candle in a panel under it, each candle standing on its own open so color and strength read at a glance. The level that decides the next candle's color is drawn back on the price chart as a real price, with the measured odds that the color flips on the next bar, and two higher-timeframe candles ride above as lanes — three Heikin-Ashi timeframes read without leaving the chart.",
        "description": "DS ProHeikinAshi builds the classic Heikin-Ashi candle from the chart's own bars — close is the bar's average price, (O + H + L + C) / 4, open is the middle of the candle before it — and never rounds it to a tick, so a bar is built the same way in history and in real time. Each candle is drawn standing on its own open, the dashed line of the panel, on a scale counted in units and fixed at five either side. The next candle opens at the middle of this one's body, so it is the other color exactly when the next bar's average finishes beyond that price: the flip level. It is known the moment a bar closes and is drawn on the price chart as a dashed rail with a flag at the axis. The cushion is how far the real close stands clear of the flip level, in units — one unit is the distance a bar's average ordinarily finishes from the close before it, measured on the chart and never less than one tick — so the same number means the same thing on every instrument and timeframe, and there is no length, threshold or sensitivity to tune. Three tiers follow: FLIP PENDING, the close already through the level, drawn hollow; HOLDING, clear of it by less than two units; FIRM, two units or more clear, in the strong color. The flip odds are the share of past bars with this cushion whose color flipped on the very next bar, read from a book that starts from a table measured on five futures markets and three timeframes and then learns the chart, each reading stated first and scored one bar later; a FLIP RATE chip shows the chart's own record of the three tiers. Two slower Heikin-Ashi candles, five and fifteen times the chart's bar by default, are built from the same bars with no second data series and read as of every bar: two lanes above the candles, the slow one's body as a tide behind them, their own flip rails on price, and a chevron on the bar that closes the slow candle in a new color. Twenty-one values are published for strategies and the Market Analyzer. It reads price only and needs nothing but the chart's own bars. A Heikin-Ashi color describes the last few bars; measured, it did not say where price went next, and a tier speaks for the next bar only — it is not a forecast. The panel's Y-axis locks by default so a chart drag cannot push the candles off their own scale. Closed-bar decisions throughout: it does not repaint."
    },
    {
        "slug": "protrendrange",
        "name": "DS ProTrendRange",
        "kind": "indicator",
        "series": "pro",
        "category": "Trend & Pullback",
        "purpose": "A trend, pullback and range panel on one statistical scale — a latched trend state, the pullback filled as a pocket in the trend's own color, and one closed-bar RESUME signal that carries the price where it is wrong.",
        "hooks": [
            "Trend, pullback and range, named",
            "One RESUME per leg, with its HOLD",
            "No threshold to tune, on any chart",
            "Locked panel scale, never drifts"
        ],
        "helps": "A pullback trade needs three answers in a row — is there a trend, is this a pullback inside it or the end of it, and has the pullback finished — and most panels give one of them. DS ProTrendRange gives all three on one scale: a thick TREND line for the tide, a thin SWING line for the wave, a filled pocket while the wave runs against the tide, and one signal, the RESUME, on the bar the pocket closes. When there is no tide to trade with, it says RANGING and draws the range the market is working instead.",
        "description": "DS ProTrendRange takes one measurement — signed efficiency, how much of the distance price traveled was progress — over two lengths, and scales each by the square root of its length so a 10-bar and a 50-bar reading sit on one statistical scale: 50 is no drift, 84 and 16 are one sigma of it, 97.7 and 2.3 are two. Those levels are constants on every instrument, timeframe and bar type, Renko included, so there is no threshold to tune, and one bar, however large, cannot move a reading as far as one and a half sigma — a single spike is never read as a strong trend. A trend latches ON when the Trend-length reading reaches one sigma and stays on until it crosses back through the center — the same event as the close crossing its own Trend-length average — so the state cannot flicker along a line; past two sigma it is STRONG, and with no trend latched the market is RANGING. While a trend is on, the Swing-length reading crossing the center against it is a PULLBACK, filled in the panel as a pocket in the trend's own color. The one signal is the RESUME: the swing closes back through the center and the next close holds it, given once per leg and graded PRIME, STANDARD or MINOR by the trend it resumes. On the price chart each resume is drawn as a shelf — a level line at the HOLD price, the pullback's own extreme, from the bar that made it to the bar that confirmed the resume — and while it is live a HOLD rail carries that price to the axis, until the trend makes a new extreme or price trades through it. In a range, two rails mark the extreme the last trend left behind and the reaction against it, and a range row along the foot of the panel shows where the close sits in the Trend-length high-low window. Thirteen values are published for strategies and the Market Analyzer. It reads price only and needs nothing but the chart's own bars. It reads the state of the market and marks a precisely defined event; it is not a forecast. The panel's Y-axis locks by default so a chart drag cannot push the reading off its own scale. Closed-bar decisions throughout: it does not repaint."
    },
    {
        "slug": "bulk-replay-downloader",
        "name": "DS Bulk Replay Downloader",
        "kind": "addon",
        "series": "utility",
        "category": "Data Utility",
        "purpose": "Bulk downloader for NinjaTrader's own Market Replay data — queue every instrument and date you want and it fetches the lot unattended, instead of one instrument and one day at a time.",
        "hooks": [
            "Whole date ranges, one queued run",
            "Per-file progress as it works",
            "Skips days you already have",
            "Files land where Playback expects"
        ],
        "helps": "NinjaTrader's built-in replay download is one instrument, one day, one click — building a useful replay library that way is an evening of clicking for a week of data. DS Bulk Replay Downloader takes a list of instruments and a date range and fetches all of it unattended, showing a per-file progress list and telling you exactly what it got and what it didn't.",
        "description": "DS Bulk Replay Downloader automates NinjaTrader's own Market Replay (.nrd) download for every instrument-and-day pair you queue. You add instruments from the standard selector, tick the ones this run should include, set a begin and end date, and choose whether to skip weekends and days you already have; a begin date older than NinjaTrader's roughly 90-day serving window is moved forward automatically with a note in the log, and a truncated file is treated as missing and re-fetched rather than silently trusted. Files land in NinjaTrader's own replay folder, so Playback picks them up automatically with no extra step. It supplies no data of its own and bypasses no platform limit — it only orchestrates the same download NinjaTrader already performs, in bulk, because NinjaTrader has never shipped bulk replay downloading itself."
    },
    {
        "slug": "asl",
        "name": "DS ASL",
        "kind": "indicator",
        "series": "exclusive",
        "category": "Session Levels & Volume Profile",
        "purpose": "DS Session Levels with the volume added: each session's volume profile inside its bracket, its POC carried forward as a level, HVNs and LVNs marked — built from real trades, completed from 1-minute bars.",
        "hooks": [
            "A volume profile in every session",
            "Each POC carried forward as a level",
            "HVN and LVN found, no knobs",
            "Real trades, gaps filled from bars"
        ],
        "helps": "A session's high and low show where it traded; they don't show where it did its business. DS ASL adds that: inside every session's bracket, the volume it traded at each price, with the busiest price — the POC — carried forward as a level beside the high and low, so the last session's accepted prices are on the chart when price comes back to them.",
        "description": "DS ASL — Advanced Session Levels — is DS Session Levels with each session's volume profile built in. Everything DS Session Levels draws is here unchanged — exact session highs and lows, carry-forward, fades, edge tags, presets and alerts — and inside every bracket the session's volume at each price is drawn as thin bars against its first bar, the value area stronger and the POC's bar the longest. The POC becomes a level of its own, labeled where no candle covers it and carried forward until the session opens again; high- and low-volume nodes are found from each session's own trading, with no sensitivity setting, and can be marked in the profile or carried forward as levels. Profiles are built from real trades wherever NinjaTrader's trade history has them, read in the background a day at a time, and completed from the chart's 1-minute bars wherever the history has gaps — so every profile is whole the moment the chart loads and sharpens as the trades arrive, with memory that stays flat however many days are loaded. It comes free with DS Complete and is not sold on its own."
    },
    {
        "slug": "toolkit",
        "name": "DS Toolkit",
        "kind": "addon",
        "series": "exclusive",
        "category": "Workflow & Control",
        "purpose": "One translucent rail on your chart: every DS indicator as an on/off row, your drawing tools underneath, and freehand chalk at the bottom.",
        "hooks": [
            "One click per indicator or tool",
            "Mute is a mute, not a preset",
            "Three real opacity looks",
            "Chalk that pans, zooms, saves"
        ],
        "helps": "Turning an indicator off usually means the Indicators dialog, a checkbox and Apply; finding the drawing tool you use forty times a day means hunting the toolbar. DS Toolkit puts both in one translucent rail: your DS indicators along the top as simple on/off rows, your drawing tools underneath, and freehand chalk at the bottom — so neither one breaks your rhythm mid-session.",
        "description": "DS Toolkit is the all-in-one chart rail for the DS Universe suite. The indicator deck lists one row for each DS indicator actually loaded on that chart — nothing else is ever listed — and every switch is a genuine mute, not a preset: turning an indicator off closes its render master and nothing else, so your own settings and templates survive every toggle, and a rebuild (theme change, tab switch, added indicator) never silently loses the arrangement. ALL OFF strips the chart to bare candles for a screenshot and the next click restores exactly what was on, including multi-family products like DS 258. The drawing deck reflects over every drawing tool actually present on your build — asking each for its own name and icon through NinjaTrader's own call, so third-party tools work for free and a helper tool an indicator owns for its own use never shows up as pickable — with a REFRESH button to re-scan after installing something new. DS Chalk is a real drawing tool included with it: every stroke is a genuine time-and-price anchor, so freehand marks pan, zoom and save with the workspace, and Ctrl+Z only ever undoes a chalk stroke while chalk itself is the armed tool. Three panel looks — Solid, Frosted and Ghost — set the rail's own background opacity (100%, 82%, 51%) independently of its idle fade, so Solid genuinely blocks the chart behind it and text and icons stay fully legible in all three."
    },
    {
        "slug": "adaptive-priceline",
        "name": "DS Adaptive Price Line",
        "kind": "indicator",
        "series": "vault",
        "category": "Chart Essentials",
        "purpose": "A self-anchoring replacement for NinjaTrader's native last-price line that re-derives its own geometry on every frame, so it never drifts off the candle no matter how you scroll or zoom.",
        "hooks": [
            "Always anchored to the candle",
            "Bar-close countdown rides the line",
            "Glow, rounded caps, premium finish",
            "Zero per-frame allocations"
        ],
        "helps": "NinjaTrader's own price line starts at a fixed percentage of the panel's width, so it drifts off the candle the moment you scroll, zoom or change your right margin. DS Adaptive Price Line works out its position again on every render frame instead: the left end sits on the most recent candle, the level tracks the live price, and the right end meets NinjaTrader's own axis marker — wherever you leave the chart.",
        "description": "DS Adaptive Price Line replaces the geometry behind NinjaTrader's native price line without replacing what it shows: the level itself still comes from the live price, and the value is still read off NT8's own axis marker. What changes is how the line is drawn — on every render frame, the left end is re-anchored to the exact chart position of the most recent candle, rather than trusting a fixed percentage of panel width that has no idea where the candles actually are. On top of that base sits a hand-rendered finish: a luminous glow halo, rounded caps, a candle-to-axis opacity fade, and a small anchor bead seated on the candle at its close, so the line is visibly connected to the candle it belongs to (a floating circle clear of the candle is one setting away). A countdown chip rides the line with a steady readout to the forming bar's close, timezone-proof (it keeps time from the data feed rather than the PC clock) and countable on Heiken-Ashi and Volumetric charts too — and it can run on its own with the line itself switched off. Painted behind the bars by default so it never covers price, and rendered with zero per-frame allocations so it costs nothing to keep on."
    },
    {
        "slug": "chart-price",
        "name": "DS Chart Price",
        "kind": "indicator",
        "series": "vault",
        "category": "Chart Essentials",
        "purpose": "A large, animated last-price readout you can place in any of nine positions on your price panel — it flashes green on an uptick, red on a downtick, and shifts to amber when the tape turns choppy.",
        "hooks": [
            "Nine placements on the panel",
            "Amber the moment chop starts",
            "Three hands-free price alerts",
            "Real per-indicator volume control"
        ],
        "helps": "On a NinjaTrader chart, price lives in one place: the axis, in small type, at the far right. DS Chart Price puts it front and center instead, in a large readout you can place in any of nine spots on the panel, color-coded so you can read direction and conviction from across the room — and it carries a small price-alert engine with built-in tones so you can step away and still hear when a level you set gets hit.",
        "description": "DS Chart Price renders the current price in large type at any of nine positions on the price panel (top, middle or bottom; left, center or right). Every tick compares the new price to the last and flashes green or red, while choppiness is measured with the Kaufman Efficiency Ratio over a rolling window — low efficiency eases the resting color toward amber, high efficiency holds a strong directional color. The alert engine takes up to three price levels and plays that level's tone whenever price crosses it from either direction, with a re-arm distance in ticks and an optional cooldown so a level cannot repeat-fire while price hovers on it; alerts are realtime-only and never fire on historical bars, chart load or scrolling. Four tones are synthesized in memory with click-free envelopes — Chime, Bell, Pulse and the shared DS Universe tone — so there are no sound files to install, and a 0-100 volume control scales amplitude directly, true per-indicator loudness NinjaTrader's own alert playback cannot offer. Two modes make it calmer: Mono draws the readout in a single color and shows direction as a small change in strength instead of hue, and Reduced motion paces the digits, pulses only the ones that changed and slows the tint; an opacity control lets the bars show through the digits. Performance is deliberate: tick-driven with no forced refresh at its default settings, zero per-frame allocation."
    },
    {
        "slug": "ds-258",
        "name": "DS 258",
        "kind": "indicator",
        "series": "vault",
        "category": "Key Levels",
        "purpose": "A whisper-quiet map of the Nasdaq's 00/20/50/80 price levels, drawn across the whole visible chart so the levels NQ keeps reacting to are never in the way.",
        "hooks": [
            "Every 00/20/50/80 in view",
            "Opacity 7, a whisper not a wall",
            "Nothing to calculate or configure",
            "Its own color per level"
        ],
        "helps": "Nasdaq futures move in hundred-point blocks, and the same four prices inside every block keep doing the work: the 00, the 20, the 50 and the 80. Drawing them by hand gets old fast. DS 258 lays a whisper-quiet line on every one of them across the visible chart, in its own color, at an opacity low enough to forget it's there — until price stops on one.",
        "description": "DS 258 is a pure render-only overlay: on every frame it reads the chart's own price scale and lays a line across the full width of the price panel at every 00, 20, 50 and 80 level currently in view — no calculation, no lookback, nothing to configure beyond which families to show. Each of the four levels carries its own DS Universe color (gold for 00, blue for 20, platinum for 50, rose for 80) at a default opacity of 7, deliberately low enough that the map recedes into the chart until price actually reacts to one. Lines draw behind the candles by default and de-clutter automatically as you zoom out — the 20 and 80 families fade first, then the 50, so the chart never turns into a ladder of lines at wide zoom. Support in DS Toolkit covers all four level families from one row, including the mute and restore behavior the rest of the suite uses."
    },
    {
        "slug": "parallax",
        "name": "DS Parallax",
        "kind": "indicator",
        "series": "vault",
        "category": "Multi-Timeframe Liquidity",
        "purpose": "A multi-timeframe liquidity matrix: up to four live higher-timeframe charts in the corner of your chart, each marking exactly where the resting stops are.",
        "hooks": [
            "Four timeframes, one chart",
            "Buy-side and sell-side pools marked",
            "Touch count sets line weight",
            "Swept levels ghost out"
        ],
        "helps": "You trade one timeframe. The structure that decides whether your trade works lives on others. DS Parallax puts up to four live higher-timeframe charts in the corner of the chart you're executing on — each with its own axis, candles and countdown to close — and marks the one thing that matters most on every one of them: where the resting stops are.",
        "description": "DS Parallax draws up to four live higher-timeframe mini-charts (30m/1h/2h/4h by default) in the corner of your execution chart, each auto-scaled and running its own countdown to close, so the higher-timeframe pattern stays readable at a glance without ever changing your chart's own timeframe. Buy-side liquidity is marked just above unswept swing highs, sell-side just below unswept swing lows, and relative-equal highs and lows are clustered into a single level with a touch count — because more tests of a level means more stops resting beyond it, which is the only strength the engine can honestly claim. A pool is drawn only while it is live — no newer bar has traded through it, so there is no wait-N-bars pivot delay — and once price sweeps a level and closes back inside, it is ghosted with a small x at the sweep bar, because the sweep itself is the pattern worth recognizing; a level price closed through and held beyond was a breakout, and it is simply gone. A fold tab collapses the whole matrix for a clean chart without taking the indicator off."
    },
    {
        "slug": "session-levels",
        "name": "DS Session Levels",
        "kind": "indicator",
        "series": "vault",
        "category": "Session Levels",
        "purpose": "The Asia, London and New York highs and lows, drawn exactly where each session started and finished, and carried forward until that session opens again — free for everyone.",
        "hooks": [
            "Every session's high and low, exact",
            "Carried forward until it reopens",
            "Taken levels fade where closed",
            "Futures, ICT and forex presets"
        ],
        "helps": "Every trading session leaves two prices behind — its high and its low — and many traders read each session against the one before it: does London hold inside the Asia range, and which of London's levels does New York test first? Marking them by hand every day is slow, and easy to get wrong across time zones. DS Session Levels draws them for you, exactly, on every intraday chart.",
        "description": "DS Session Levels draws the high and low of every trading session as a short bracket over exactly the bars of that session — Asia, London and New York on the futures clock by default, each in its own DS Universe color (violet, teal, gold). After a session closes, its levels carry forward as dotted lines until that session opens again and fade from the bar that closes through them, so the levels still in play are named by small tags at the right edge. Sessions are clock times in New York time, converted with the Windows time-zone rules, so they land correctly on any PC and through every daylight-saving change. The highs and lows are always real traded prices from inside the session: on range, Renko, tick, Heiken Ashi and 60-minute charts a 1-minute series supplies them. Presets for the futures ETH split, the ICT killzones and the classic forex sessions; every name, time and color editable; eight Data Box values for the Market Analyzer and strategies; alerts on a close through a level or price nearing one. It draws behind the candles and never touches the price scale. Free for everyone."
    },
    {
        "slug": "stochastics",
        "name": "DS Stochastics",
        "kind": "indicator",
        "series": "vault",
        "category": "Momentum & Rotation",
        "purpose": "Four stochastics of four speeds in one panel, latching into ROTATION, PRIME and PULLBACK states so a real turn stands out from a lane that only wobbled.",
        "hooks": [
            "Four speeds, one quad latch",
            "ROTATION, PRIME, PULLBACK named",
            "Per-lane divergence, confluence counted",
            "Locked panel scale, never drifts"
        ],
        "helps": "One stochastic lane tells you overbought or oversold on one timescale and leaves you guessing whether that actually means anything. DS Stochastics runs four stochastics of four different speeds in the same panel and only calls a state when they agree: a quad latch arms when every lane sits at an extreme together, and from there ROTATION, PRIME and PULLBACK name exactly what kind of turn is unfolding — so a real rotation stands apart from a lane that simply wobbled.",
        "description": "DS Stochastics stacks four stochastic oscillators — fast, standard, slow and long, at 9/3, 14/3, 40/4 and 60/10 — into one panel, each lane heat-colored by its %D value with a quieter %K line underneath and a shared state ribbon above. A quad latch arms only when all four lanes are extreme together, and releases the moment the slowest lane crosses back through fifty. From an armed latch, three named states follow: ROTATION when the fastest lane turns back out of its extreme, PRIME when that rotation carries a same-direction divergence with it (the highest-conviction read, flagged once per arm), and PULLBACK when the slowest lane stays embedded in a trend while the fastest lane dips and turns without ever confirming a genuine reversal. Divergence is tracked independently on every lane from confirmed pivots, with a confluence count showing how many lanes agree at once, marked both on the panel and as a price-panel level. The panel's Y-axis locks by default so a chart drag cannot misalign the four 0-100 lanes against each other. Closed-bar decisions throughout: it does not repaint. Free for everyone."
    },
    {
        "slug": "squeeze",
        "name": "DS Squeeze",
        "kind": "indicator",
        "series": "vault",
        "category": "Squeeze & Reversion",
        "purpose": "A single panel joining TTM-style squeeze compression, momentum and wave context into one read, so a fire is graded by what is backing it, not just flagged.",
        "hooks": [
            "Compression as one live number",
            "Every fire graded, not just fired",
            "Reversion armed only in the quiet",
            "TTM waves read as context"
        ],
        "helps": "A squeeze indicator that only tells you a squeeze is on leaves the two harder questions unanswered: how good is the fire when it comes, and is a reversion trade even on the table right now. DS Squeeze reads compression as one continuous number instead of a binary dot, grades every fire against ADX and wave context the moment it happens, and only arms its reversion play when there genuinely is no squeeze and no run to fade.",
        "description": "DS Squeeze measures compression as Bollinger Band half-width divided by ATR — a continuous read with the three classic tiers, COILING, SQUEEZE and DEEP, as thresholds on top of it rather than the whole story. A fire triggers on the close that leaves the tightest tier in the direction of momentum, and a run is considered over only after two fading bars, so the panel does not call the end of a move on the first pause. Momentum is TTM's own linear-regression read, normalized by ATR and drawn as a line over a quiet field, with the centerline itself colored by the current compression tier. Every fire is graded, not just flagged: ADX at or below twenty plus the state of the C and B wave horizons produce a grade from PRIME down to BARE, or AGAINST FLOW when the wave context disagrees with the fire's direction — and an EARLY read appears when the fastest wave is already hooking toward the medium and slow waves inside an active squeeze, ahead of the fire itself. A separate reversion engine watches RSI(9) against 65/35 and an ATR-banded 25-period EMA and arms a mean-reversion setup, with a defined target and 1:1 risk, only when neither a squeeze nor a running fire is in effect — so the two playbooks never compete for your attention on the same bar. The panel's Y-axis locks by default so a chart drag cannot distort the compression and momentum reads against each other. Closed-bar decisions throughout: it does not repaint. Free for everyone."
    },
    {
        "slug": "macd",
        "name": "DS MACD",
        "kind": "indicator",
        "series": "vault",
        "category": "Momentum & Trend",
        "purpose": "A MACD panel rebuilt on the volatility-normalized MACD-V scale, with the price that will cross the signal line solved in closed form before the bar even closes.",
        "hooks": [
            "Cross price solved before it happens",
            "MACD-V gives it real fixed zones",
            "Six-state momentum ribbon",
            "Divergence with a full lifecycle"
        ],
        "helps": "A standard MACD tells you a cross happened only after the bar that made it closes — a beat too late to act on cleanly, and read on a scale that means something different on every instrument. DS MACD solves the price that will cross the signal line before the bar closes, reads on the same volatility-normalized MACD-V scale on every chart, and grades every divergence through a full lifecycle instead of leaving you to eyeball whether it is still valid.",
        "description": "DS MACD keeps the classic fast/slow EMA and signal-line structure but changes what you read and when. The close that will cross the signal line on the forming bar is solved in closed form from the prior bar — exact on the Classic and PPO scales, and within that one bar's change in ATR on the default MACD-V scale — and shown three ways: a price-panel rail with an axis flag, a header chip, and a panel target dash, alongside the zero-line cross price for the same bar. The default scale is MACD-V (Spiroglou, Charles H. Dow Award), which gives the panel genuine fixed zones and a state ribbon across six regimes — RISK, RALLYING, RETRACING, RANGING, REBOUNDING, REVERSING — instead of an axis that rescales itself on every instrument. Four early-signal layers are built in: a histogram slope-flip, a pre-cross alarm, a zero-line cross read together with its regime context, and ranging suppression so a flat market does not fire on noise. Divergence runs on Elder's relative-depth and separate-legs gates against the histogram (the form that actually matches his rule; applied to the MACD line directly it rejects most sound patterns), carries a PENDING to CONFIRMED, BROKEN or EXPIRED lifecycle instead of a single static mark, and also catches exaggerated equal-extreme patterns. The panel's Y-axis locks by default so a chart drag cannot push the reading off its own scale. Closed-bar decisions throughout: it does not repaint. Free for everyone."
    },
    {
        "slug": "vwap",
        "name": "DS VWAP",
        "kind": "indicator",
        "series": "vault",
        "category": "VWAP & Value",
        "purpose": "A VWAP panel on two clocks — a live VWAP that follows price and the session VWAP as the anchor, each inside bands measured on your own chart to hold half and nine in ten closes, with a forward view in the margin — free for everyone.",
        "hooks": [
            "Two VWAPs: value now, value today",
            "Bands that hold 50% and 90%, measured",
            "Reach and return odds, in the margin",
            "The same line on every chart"
        ],
        "helps": "A VWAP answers one question — where is value? — and there are two honest answers. Value today is the session's VWAP; value now is what the market has been willing to pay lately. On a day that travels, the session VWAP ends up a long way from price with nothing in between, and the usual bands are sigma multiples chosen in advance, not a measured share of closes. DS VWAP draws both values, puts measured lines around each, and uses the chart's right-side margin to show how far price has tended to travel within the next horizon of bars.",
        "description": "DS VWAP draws value on two clocks. The live VWAP keeps a volume clock: its memory is a half-life counted in contracts traded, so heavy trade ages old prices faster and a quiet hour forgets almost nothing, and it never resets. Around it stand nine lines a side, each holding one more tenth of the closes — the core holds half, the edge nine in ten — with the number of sigmas that takes learned from the chart's own closes instead of assumed. Price runs through that band as a line on close: premium ground above the live VWAP, discount ground below, and the line in the strong color with the gap filled whenever the close stands beyond the edge. The session VWAP is the anchor, started at the session's open and again at the cash open by default (Session, Week and Month are the other anchors), with its own measured edges, and it is named at the border with an arrow when the day has left it outside the frame. Both VWAPs are built on one-minute bars the indicator adds itself, so a five-minute, a tick and a Renko chart of the same instrument show the same lines. The session has one latched state — EXTENDED, on a close beyond its edge confirmed by the next close — ending BACK IN VALUE or AT VWAP. The chart's right-side margin looks forward: three reach contours for how far price traveled within the horizon 60%, 25% and 5% of the time, the path of the live band if price holds, an odds ruler, and the measured odds of a return to the session VWAP in four fixed tiers. Two track records, HELD and RETURNED, keep the lines' and the odds' own score on screen. Nineteen values are published for strategies and the Market Analyzer. It measures where price stands and what a move would take; it does not claim that a stretch reverts or that it continues. Closed-bar decisions throughout: it does not repaint. Free for everyone."
    }
];

export const KIND_LABEL: Record<Kind, { singular: string; plural: string }> = {
  indicator: { singular: "Indicator", plural: "Indicators" },
  addon: { singular: "Add-on", plural: "Add-ons" },
};

export const BY_SLUG: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p]));
export const bySeries = (s: Series) => PRODUCTS.filter((p) => p.series === s);
/** Is this product in the Free Vault? */
export const isVault = (slug: string) => BY_SLUG[slug]?.series === VAULT;
