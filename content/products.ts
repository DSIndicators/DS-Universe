/**
 * The catalogue. GENERATED from "DS Universe - Master Product & Pricing Sheet"
 * (DS LAUNCH 09-20: Product Catalog + Product Details tabs). Do not hand-edit
 * copy here; change the sheet and regenerate, so the site, the Whop listings and
 * the box art keep saying the same thing.
 *
 * THE 09-20 LINEUP. Retired from the site on 2026-09-20 and deliberately absent:
 * DS Sonar, DS Isotropic Lines, DS Screener, DS MarketWatch, DS Time Intervals
 * (second-wave launch). Their pages 404 until they come back.
 *
 * Rules this site follows:
 *  - No product COUNTS are rendered in copy (the lineup changes).
 *  - `purpose` is the one line shown in lists; `hooks` + `helps` appear on the
 *    product page. `description` is retained for future use and NOT rendered.
 *  - Spaced hyphens in the sheet become em dashes, matching the sheet's own.
 *
 * One wording correction is applied on the way in: DS ProMACD's cross price is
 * "the exact price that WOULD cross", not "will" — it is a threshold for the
 * forming bar, not a forecast (the product's own board says so), and NinjaTrader's
 * vendor guidelines read "will" as a promise.
 */

export type Kind = "indicator" | "addon";

/** The four shelves, in the order the storefront runs them. Pricing per series
 *  lives in content/pricing.ts. */
export type Series = "flagship" | "pro" | "essentials" | "utility";

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
        "description": "DS Zones runs two structural engines at once — multi-length swing pivots for a full skeleton, and high-volume impulses for institutional supply and demand — then reads the real aggressive buy versus sell volume traded inside every zone from a volume-at-price footprint. Every level carries an intrinsic supply or demand identity that never flips as price crosses it, and a live, tick-driven state machine drives each zone through FRESH, APPROACHING, TESTING, DEFENDED or BREAKING, with conviction rising when a zone is genuinely defended and draining as it is consumed. A broken zone keeps its identity and dims out as a dashed band rather than vanishing without a trace or role-reversing into the opposite kind of level. A merge step fuses everything that lands on the same price into one ranked map and draws only the strongest few, so you get a clean chart instead of forty boxes. Structure is confirmed on closed bars — it does not repaint — while the live read updates with the tape."
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
        "description": "DS Iceberg runs two cooperating engines to confirm a level. The bar engine is a wick-to-body, local-extreme and volume test: a candle qualifies when its rejecting wick is long relative to its body, it sits in the outer quarter of the recent range, it closes on the rejecting side, and its volume is at or above average — a level confirms once enough qualified tests cluster at one price inside the detection window. The order-flow engine independently builds a rolling volume-at-price footprint, refined by the true bid/ask stamped on each trade, and confirms a level only when it is a statistically anomalous high-volume node with correct-side absorption. Levels both engines agree on carry a distinct accent border — your highest-conviction prices, at a glance. Each level is drawn as a self-updating runway zone showing the traded volume and test count behind it, support below price and resistance above, built entirely from closed bars so it does not repaint."
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
        "category": "Momentum & Auto-Levels",
        "purpose": "An RSI panel that turns every crossover into a support or resistance level on your price chart — anchored to the swing that produced it, ATR-spaced, and frozen the moment price closes through.",
        "hooks": [
            "Levels anchored to the actual swing",
            "Frozen the instant price closes through",
            "Heat-tinted by how extreme the RSI was",
            "Locked panel scale, never drifts"
        ],
        "helps": "An RSI reading tells you overbought or oversold and nothing about where price actually turns. DS ProRSI takes every RSI/signal crossover, anchors it to the swing that produced it, and leaves it on your price chart as a level — tinted by how extreme the RSI was, counted for every retest, and frozen the moment price actually closes through it. You get support and resistance built from momentum, not from a pivot script guessing at swing points.",
        "description": "DS ProRSI runs a Wilder RSI and its signal line through a closed-bar crossover engine: a level is born on a midline, extreme, or any RSI/signal cross, anchored to the swing low or high of the last ten bars (or the last opposing candle), and spaced from its neighbors by an ATR gate so levels do not stack on top of each other. Each level is drawn as its own price-panel line — live while unbroken, tinted by the RSI's heat at birth, labeled with the exact RSI reading and a touch count that increments on every retest — and turns to a thin gray dashed trace the instant price closes through it (wick-break optional), with the last six live and forty broken levels kept. The DS panel underneath carries a header readout (RSI value plus state: BULLISH, OVERBOUGHT, OVERSOLD, COMPRESSION, BULL CROSS, BEAR CROSS), the nearest support and resistance distance in points and percent, a compression heat ribbon under the header, shaded 30/70 zones, and a segment-colored RSI line running bull-to-neutral-to-bear over its signal. Compression is its own state — RSI and signal both within five points of the midline — so a genuinely quiet market reads as quiet rather than as a false cross. The panel's Y-axis locks by default, so dragging the chart can never push the reading off its own scale. Closed-bar decisions throughout: it does not repaint."
    },
    {
        "slug": "prostochastics",
        "name": "DS ProStochastics",
        "kind": "indicator",
        "series": "pro",
        "category": "Momentum & Rotation",
        "purpose": "Four stochastics of four speeds in one panel, latching into ROTATION, PRIME and PULLBACK states so a real turn stands out from a lane that only wobbled.",
        "hooks": [
            "Four speeds, one quad latch",
            "ROTATION, PRIME, PULLBACK named",
            "Per-lane divergence, confluence counted",
            "Locked panel scale, never drifts"
        ],
        "helps": "One stochastic lane tells you overbought or oversold on one timescale and leaves you guessing whether that actually means anything. DS ProStochastics runs four stochastics of four different speeds in the same panel and only calls a state when they agree: a quad latch arms when every lane sits at an extreme together, and from there ROTATION, PRIME and PULLBACK name exactly what kind of turn is unfolding — so a real rotation stands apart from a lane that simply wobbled.",
        "description": "DS ProStochastics stacks four stochastic oscillators — fast, standard, slow and long, at 9/3, 14/3, 40/4 and 60/10 — into one panel, each lane heat-colored by its %D value with a quieter %K line underneath and a shared state ribbon above. A quad latch arms only when all four lanes are extreme together, and releases the moment the slowest lane crosses back through fifty. From an armed latch, three named states follow: ROTATION when the fastest lane turns back out of its extreme, PRIME when that rotation carries a same-direction divergence with it (the highest-conviction read, flagged once per arm), and PULLBACK when the slowest lane stays embedded in a trend while the fastest lane dips and turns without ever confirming a genuine reversal. Divergence is tracked independently on every lane from confirmed pivots, with a confluence count showing how many lanes agree at once, marked both on the panel and as a price-panel level. The panel's Y-axis locks by default so a chart drag cannot misalign the four 0-100 lanes against each other. Closed-bar decisions throughout: it does not repaint."
    },
    {
        "slug": "prosqueeze",
        "name": "DS ProSqueeze",
        "kind": "indicator",
        "series": "pro",
        "category": "Squeeze & Reversion",
        "purpose": "A single panel joining TTM-style squeeze compression, momentum and wave context into one read, so a fire is graded by what is backing it, not just flagged.",
        "hooks": [
            "Compression as one live number",
            "Every fire graded, not just fired",
            "Reversion armed only in the quiet",
            "TTM waves read as context"
        ],
        "helps": "A squeeze indicator that only tells you a squeeze is on leaves the two harder questions unanswered: how good is the fire when it comes, and is a reversion trade even on the table right now. DS ProSqueeze reads compression as one continuous number instead of a binary dot, grades every fire against ADX and wave context the moment it happens, and only arms its reversion play when there genuinely is no squeeze and no run to fade.",
        "description": "DS ProSqueeze measures compression as Bollinger Band half-width divided by ATR — a continuous read with the three classic tiers, COILING, SQUEEZE and DEEP, as thresholds on top of it rather than the whole story. A fire triggers on the close that leaves the tightest tier in the direction of momentum, and a run is considered over only after two fading bars, so the panel does not call the end of a move on the first pause. Momentum is TTM's own linear-regression read, normalized by ATR and drawn as a line over a quiet field, with the centerline itself colored by the current compression tier. Every fire is graded, not just flagged: ADX at or below twenty plus the state of the C and B wave horizons produce a grade from PRIME down to BARE, or AGAINST FLOW when the wave context disagrees with the fire's direction — and an EARLY read appears when the fastest wave is already hooking toward the medium and slow waves inside an active squeeze, ahead of the fire itself. A separate reversion engine watches RSI(9) against 65/35 and an ATR-banded 25-period EMA and arms a mean-reversion setup, with a defined target and 1:1 risk, only when neither a squeeze nor a running fire is in effect — so the two playbooks never compete for your attention on the same bar. The panel's Y-axis locks by default so a chart drag cannot distort the compression and momentum reads against each other. Closed-bar decisions throughout: it does not repaint."
    },
    {
        "slug": "promacd",
        "name": "DS ProMACD",
        "kind": "indicator",
        "series": "pro",
        "category": "Momentum & Trend",
        "purpose": "A MACD panel rebuilt on the volatility-normalized MACD-V scale, with the exact price that would cross the signal line solved in closed form before the bar even closes.",
        "hooks": [
            "Cross price solved before it happens",
            "MACD-V gives it real fixed zones",
            "Six-state momentum ribbon",
            "Divergence with a full lifecycle"
        ],
        "helps": "A standard MACD tells you a cross happened only after the bar that made it closes — a beat too late to act on cleanly, and read on a scale that means something different on every instrument. DS ProMACD solves the exact price that would cross the signal line before the bar closes, reads on the same volatility-normalized MACD-V scale on every chart, and grades every divergence through a full lifecycle instead of leaving you to eyeball whether it is still valid.",
        "description": "DS ProMACD keeps the classic fast/slow EMA and signal-line structure but changes what you read and when. The exact close that will cross the signal line on the forming bar is solved in closed form from the prior bar alone — fixed for the whole bar, so it cannot repaint — and shown three ways: a price-panel rail with an axis flag, a header chip, and a panel target dash, alongside the zero-line cross price for the same bar. The default scale is MACD-V (Spiroglou, Charles H. Dow Award), which gives the panel genuine fixed zones and a state ribbon across six regimes — RISK, RALLYING, RETRACING, RANGING, REBOUNDING, REVERSING — instead of an axis that rescales itself on every instrument. All four early-signal layers ship in v1.0: a histogram slope-flip, a pre-cross alarm, a zero-line cross read together with its regime context, and ranging suppression so a flat market does not fire on noise. Divergence runs on Elder's relative-depth and separate-legs gates against the histogram (the form that actually matches his rule; applied to the MACD line directly it rejects most sound patterns), carries a PENDING to CONFIRMED, BROKEN or EXPIRED lifecycle instead of a single static mark, and also catches exaggerated equal-extreme patterns. The panel's Y-axis locks by default so a chart drag cannot push the reading off its own scale. Closed-bar decisions throughout: it does not repaint."
    },
    {
        "slug": "adaptive-priceline",
        "name": "DS Adaptive Price Line",
        "kind": "indicator",
        "series": "essentials",
        "category": "Chart Essentials",
        "purpose": "A self-anchoring replacement for NinjaTrader's native last-price line that re-derives its own geometry on every frame, so it never drifts off the candle no matter how you scroll or zoom.",
        "hooks": [
            "Always anchored to the candle",
            "Bar-close countdown rides the line",
            "Glow, rounded caps, premium finish",
            "Zero per-frame allocations"
        ],
        "helps": "NinjaTrader's own price line starts at a fixed percentage of the panel's width, so it drifts off the candle the moment you scroll, zoom or change your right margin. DS Adaptive Price Line works out its position again on every render frame instead: the left end sits on the most recent candle, the level tracks the live price, and the right end meets NinjaTrader's own axis marker — wherever you leave the chart.",
        "description": "DS Adaptive Price Line replaces the geometry behind NinjaTrader's native price line without replacing what it shows: the level itself still comes from the live price, and the value is still read off NT8's own axis marker. What changes is how the line is drawn — on every render frame, the left end is re-anchored to the exact chart position of the most recent candle (with configurable clearance for long wicks), rather than trusting a fixed percentage of panel width that has no idea where the candles actually are. On top of that base sits a hand-rendered finish: a luminous glow halo, rounded caps, a candle-to-axis opacity fade, and an anchor circle at the candle. A countdown chip rides the line with a monospaced readout to the forming bar's close, timezone-proof (it learns the feed's offset rather than trusting the PC clock) and countable on Heiken-Ashi and Volumetric charts too — and it can run on its own with the line itself switched off. Painted behind the bars by default so it never covers price, and rendered with zero per-frame allocations so it costs nothing to keep on."
    },
    {
        "slug": "chart-price",
        "name": "DS Chart Price",
        "kind": "indicator",
        "series": "essentials",
        "category": "Chart Essentials",
        "purpose": "A large, animated last-price readout you can place in any of nine positions on your price panel — it flashes green on an uptick, red on a downtick, and shifts to amber when the tape turns choppy.",
        "hooks": [
            "Nine placements on the panel",
            "Amber the moment chop starts",
            "Three hands-free price alerts",
            "Real per-indicator volume control"
        ],
        "helps": "On a NinjaTrader chart, price lives in one place: the axis, in small type, at the far right. DS Chart Price puts it front and center instead, in a large readout you can place in any of nine spots on the panel, color-coded so you can read direction and conviction from across the room — and it carries a small price-alert engine with built-in tones so you can step away and still hear when a level you set gets hit.",
        "description": "DS Chart Price renders the current price in large type at any of nine positions on the price panel (top, middle or bottom; left, center or right). Every tick compares the new price to the last and flashes green or red, while choppiness is measured with the Kaufman Efficiency Ratio over a rolling window — low efficiency eases the resting color toward amber, high efficiency holds a strong directional color. The alert engine takes up to three price levels and plays that level's tone whenever price crosses it from either direction, with a re-arm distance in ticks and an optional cooldown so a level cannot repeat-fire while price hovers on it; alerts are realtime-only and never fire on historical bars, chart load or scrolling. Four tones are synthesized in memory with click-free envelopes — Chime, Bell, Pulse and the shared DS Universe tone — so there are no sound files to install, and a 0-100 volume control scales amplitude directly, true per-indicator loudness NinjaTrader's own alert playback cannot offer. Performance is deliberate: purely tick-driven with no forced refresh, zero per-frame allocation."
    },
    {
        "slug": "ds-258",
        "name": "DS 258",
        "kind": "indicator",
        "series": "essentials",
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
        "series": "essentials",
        "category": "Multi-Timeframe Liquidity",
        "purpose": "A multi-timeframe liquidity matrix: up to four live higher-timeframe charts in the corner of your chart, each marking exactly where the resting stops are.",
        "hooks": [
            "Four timeframes, one chart",
            "Buy-side and sell-side pools marked",
            "Touch count sets line weight",
            "Swept levels ghost out"
        ],
        "helps": "You trade one timeframe. The structure that decides whether your trade works lives on others. DS Parallax puts up to four live higher-timeframe charts in the corner of the chart you're executing on — each with its own axis, candles and countdown to close — and marks the one thing that matters most on every one of them: where the resting stops are.",
        "description": "DS Parallax draws up to four live higher-timeframe mini-charts (30m/1h/2h/4h by default) in the corner of your execution chart, each auto-scaled and running its own countdown to close, so the higher-timeframe pattern stays readable at a glance without ever changing your chart's own timeframe. Buy-side liquidity is marked just above unswept swing highs, sell-side just below unswept swing lows, and relative-equal highs and lows are clustered into a single level with a touch count — because more tests of a level means more stops resting beyond it, which is the only strength the engine can honestly claim. A pool is drawn only while it is live — no newer bar has traded through it, so there is no wait-N-bars pivot delay — and once price sweeps a level and closes back inside, it is ghosted with a small x at the sweep bar, because the sweep itself is the pattern worth recognising; a level price closed through and held beyond was a breakout, and it is simply gone. A fold tab collapses the whole matrix for a clean chart without taking the indicator off."
    },
    {
        "slug": "toolkit",
        "name": "DS Toolkit",
        "kind": "addon",
        "series": "essentials",
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
    }
];

export const KIND_LABEL: Record<Kind, { singular: string; plural: string }> = {
  indicator: { singular: "Indicator", plural: "Indicators" },
  addon: { singular: "Add-on", plural: "Add-ons" },
};

export const BY_SLUG: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p]));
export const bySeries = (s: Series) => PRODUCTS.filter((p) => p.series === s);
