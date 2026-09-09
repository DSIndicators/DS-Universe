/**
 * The catalogue. GENERATED from "DS Universe - Product Information Sheet"
 * (rebuilt 2026-09-08 from the "[ Official ] First Launch Indicator and Add-ons"
 * folder) - do not hand-edit copy here; regenerate from the sheet.
 *
 * This file holds the FIRST-RELEASE lineup only. Products not in the launch
 * folder (Vision, Engram, Heatmap, AstroVP, CVD) and the two add-ons DS Toolkit
 * retired (Control Panel, ToolBar & Checklist) are deliberately absent.
 *
 * Rules this site follows:
 *  - No product counts are ever rendered (the lineup changes often).
 *  - `purpose` is the one line shown in lists; `hooks` + `helps` appear on the
 *    product page. `description` is retained for future use and is NOT rendered.
 */

export type Kind = "indicator" | "addon";

export type Product = {
  slug: string;
  name: string;
  kind: Kind;
  category: string;
  /** One line. The tagline. */
  purpose: string;
  /** Four cover-page hooks. */
  hooks: string[];
  /** "How it helps traders" - the opening paragraph. */
  helps: string;
  /** Full store description. Retained, not rendered. */
  description: string;
  /** 16:9 still, or null for a typographic tile. */
  cover: string | null;
};

export const PRODUCTS: Product[] = [
  {
      "slug": "oracle",
      "name": "DS Oracle",
      "kind": "indicator",
      "category": "AI Trend & Signals",
      "purpose": "A machine-learning-confirmed trend engine – every SuperTrend flip validated by AI, with a Neural Line setting which side you are allowed to trade.",
      "hooks": [
          "AI-confirmed signals",
          "Neural Line bias",
          "Four timeframes must agree",
          "Engine never repaints"
      ],
      "helps": "It stops you acting on the trend flips that were always going to fail. Every flip is put to a weighted vote against the most similar states in the market's own history, the Neural Line holds your bias to one side until a confirmed close clears it, and the Spectrum only colours a candle when the timeframes genuinely agree – so chop reads grey instead of tempting.",
      "description": "DS Oracle pairs a classic ATR SuperTrend structure with the Dropship AI machine-learning engine. Every bar is encoded as a multi-horizon feature vector (Wilder RSI, MA-deviation, RSI-signal distance and choppiness across short, medium and long horizons), z-score normalised, then matched against the most similar historical states with a Gaussian-weighted vote – and a flip is promoted to a Major signal only when that vote clears your threshold. The Neural Line is a genuine online neural network (12-6-1, tanh) trained causally, one gradient step per settled bar, bending a volume-weighted value anchor toward the side it expects to hold; its influence is audited live against a transparent baseline and demoted whenever it stops winning. The Spectrum grades every candle into five regime states from the agreement of four SuperTrend lookbacks, and a bright candle can never contradict its own body. Engine output does not repaint, there is no look-ahead, and everything learns in-process on your own chart – no training thread, no files, no network.",
      "cover": "/covers/oracle.webp"
  },
  {
      "slug": "sonar",
      "name": "DS Sonar",
      "kind": "indicator",
      "category": "Squeeze & Volatility Radar",
      "purpose": "A squeeze radar: four channels – compression, volume, range expansion and momentum – each scored 0-100, answering whether a move is loading and igniting now.",
      "hooks": [
          "Four lanes, one 0-100 scale",
          "Ignition needs all four",
          "Same numbers on any chart",
          "It tells you when it is spent"
      ],
      "helps": "Ordinary squeeze tools tell you a squeeze is on and nothing else – no idea whether volume, range and momentum are backing it, and nothing at all once the move starts. DS Sonar ranks each of the four ingredients against its own history, only calls an ignition when all four line up, and then keeps reporting through the move, so you can tell a breakout that is still running from one that is finished.",
      "description": "DS Sonar takes the classic squeeze – Bollinger Bands compressing inside the Keltner Channel – and surrounds it with the three things a real breakout needs. GRAVITY measures compression, MASS participation, NOVA range expansion and VELOCITY momentum; each is a percentile score 0-100 against its own recent history, so the same thresholds read the same on MNQ 1-minute, ES 30-minute or a daily stock with no per-instrument tuning. An ignition is a four-way conjunction of top-quintile events, which is why it is rare by construction; one ping short is a FLARE. A state ribbon carries the whole cycle – DORMANT, COILING, CRITICAL, FLARE, IGNITION, EXPANDING, COOLING – and is published as a plot, so the Data Box, Market Analyzer and any strategy read exactly what the panel draws. Range and volume are compared against the same clock slot on prior sessions, so the open only pings when it is busier than usual, and instruments with no volume feed simply drop the MASS requirement. Closed-bar by default: it does not repaint.",
      "cover": "/covers/sonar.webp"
  },
  {
      "slug": "zones",
      "name": "DS Zones",
      "kind": "indicator",
      "category": "Structure & Levels",
      "purpose": "Structural confluence zones fusing pivots, volume supply/demand and real order flow – and tracking what price does to every zone, live.",
      "hooks": [
          "Watch a zone go live",
          "Order flow inside the band",
          "KEY LEVEL tier",
          "Never repaints"
      ],
      "helps": "Most zone tools draw a box and forget it. This one reads the aggressive buy versus sell volume traded inside every zone, watches it get approached, tested, defended or broken tick by tick, and re-scores its conviction on what actually happened – so the strongest bands on your chart are the ones price is respecting today, not the ones that looked good when they were drawn.",
      "description": "DS Zones runs five cooperating engines. A multi-length pivot engine tracks up to four swing lengths at once for a full multi-horizon skeleton. A supply/demand engine finds the institutional order zones left by high-volume impulses, capped to clean ribbons so one fat candle can never draw a slab. An order-flow engine builds a volume-at-price footprint and reads the real aggressive buy versus sell volume inside each zone. A live state machine drives every zone through FRESH, APPROACHING, TESTING, DEFENDED and BREAKING – pulsing the edge amber while tested and hot red while breaking – with the persistent transitions confirmed on closed bars only. A merge step then fuses nearby levels into one deduplicated map, scores them on one evolving scale and draws only the strongest few. Each card prints the state word, a STRONG / MODERATE / WEAK badge, the BUY / SELL split in words, and the zone's volume and net delta; a level that is both STRONG and heavy relative to the map is promoted to KEY LEVEL. Labels re-derive their contrast from your chart background, so they read on dark and light templates alike.",
      "cover": "/covers/zones.webp"
  },
  {
      "slug": "iceberg",
      "name": "DS Iceberg",
      "kind": "indicator",
      "category": "Liquidity & Absorption",
      "purpose": "An institutional iceberg detector: the hidden refill limit orders that absorb aggression and quietly refuse to let price through.",
      "hooks": [
          "Finds the hidden size",
          "Two engines must agree",
          "Glass over your candles",
          "Closed bars only"
      ],
      "helps": "Price tells you where the market went – DS Iceberg marks where a large participant would not let it go. Confirmed levels become clean runway zones you can lean on, and the ones an independent volume footprint also confirms are flagged separately, so your highest-conviction levels are obvious at a glance.",
      "description": "An iceberg splits large size so only a fraction is ever visible; each fill re-posts another slice at the same price, and its signature is absorption – heavy volume trades into one level, aggressors keep hitting it, and price is rejected anyway. DS Iceberg runs two cooperating engines. The bar engine is a wick-to-body, local-extreme and volume-absorption test detector: a candle qualifies when its rejecting wick is long relative to its body, it sits in the outer quarter of the recent range, it closes on the rejecting side and its volume is at or above average – and a level confirms when enough qualified tests cluster at one price inside the detection window. The order-flow engine independently builds a rolling volume-at-price footprint, refined by the true bid/ask stamped on each trade, and confirms a level only when it is a statistically anomalous high-volume node with correct-side absorption. Levels both engines confirm carry a cyan accent border. Support rests below price in violet, resistance above in ice blue, each drawn as glass over the candles with the solid band and labels in an offset runway.",
      "cover": "/covers/iceberg.webp"
  },
  {
      "slug": "flow",
      "name": "DS Flow",
      "kind": "indicator",
      "category": "Order Flow & Volume Profile",
      "purpose": "A volume-flow footprint that x-rays groups of candles into a volume-by-price profile – where the market did business, and who was pressing.",
      "hooks": [
          "Buy vs sell at every price",
          "HVN and FIGHT nodes",
          "Volume-backed reversals",
          "Session profile mode"
      ],
      "helps": "Price tells you where the market went; DS Flow tells you where it traded and who won each level. You get hidden support and resistance from the high-volume nodes, absorption and exhaustion from the buy/sell split, and a silent signal engine that marks reversal candidates with a complete trade plan already attached.",
      "description": "DS Flow groups candles and builds a volume-by-price profile for each group: every horizontal bar is one price row, its length the total volume traded there, with buy and sell volume split and printed beside it. The longest bar is the group's point of control. Statistically heavy rows are outlined as HVN acceptance shelves – the magnets and reaction zones – while the rarer, stricter FIGHT nodes mark the two-sided levels where both sides committed and something has to give. A glass grouped candle dims on below-average volume so a hollow move is obvious, and a summary box gives total volume with buy and sell percentages. The developing group is exact – every trade registered at its traded price and classified against the real inside bid/ask – while closed groups are approximated from a lower-timeframe series. Session mode groups by Asia, London and New York instead of a candle count, and a second engine marks reversal candidates with a clean arrow only when a liquidity sweep, a delta flip and POC acceptance all line up on the same close.",
      "cover": "/covers/flow.webp"
  },
  {
      "slug": "gex",
      "name": "DS GEX",
      "kind": "indicator",
      "category": "Options & Key Levels",
      "purpose": "Dealer gamma exposure levels computed straight from the live option chain and plotted as bold horizontal lines – no subscription, no pasting, no setup.",
      "hooks": [
          "Live option-chain levels",
          "Call and put walls",
          "Gamma flip and max pain",
          "Zero setup, zero data fees"
      ],
      "helps": "It puts the levels that actually govern intraday movement on your chart automatically: call and put walls, 0DTE walls, the gamma flip, HGEX, max pain and the day's expected move. Drop it on NQ, ES or gold and the map appears – and the sturdiness engine stops it re-ranking every few minutes on feed jitter.",
      "description": "DS Gex computes dealer gamma exposure directly from CBOE's free delayed option chain – NDX for NQ, SPX for ES and SPX, GLD for gold – on a background thread, scales every level to the chart via the basis, and holds it as a stable session-anchored map. Per-strike net GEX follows the standard convention, giving the Call Wall and Put Wall, 0DTE walls restricted to the current session's expiry, HGEX (the dominant hedging magnet), Max Pain and ranked G+/G- strikes. The Gamma Flip is solved by recomputing Black-Scholes gamma across a grid of hypothetical spot prices and interpolating the sign change – above it hedging is mean-reverting, below it hedging amplifies moves. An Expected Move band from the at-the-money straddle and an ATR grid anchored to the session open complete the map. Because open interest settles once a day, the sturdiness engine anchors the map on the first fetch of each options day and migrates a level only when a rival strike wins decisively and holds that lead across refreshes. Levels stacking on one price coalesce into a single neon confluence area listing everything converging there.",
      "cover": "/covers/gex.webp"
  },
  {
      "slug": "parallax",
      "name": "DS Parallax",
      "kind": "indicator",
      "category": "Multi-Timeframe Liquidity",
      "purpose": "A multi-timeframe liquidity matrix: four live higher-timeframe charts in the corner of your chart, each marking exactly where the stops are resting.",
      "hooks": [
          "Four timeframes, one chart",
          "Buy and sell-side pools",
          "Line weight = touch count",
          "Swept levels ghost out"
      ],
      "helps": "An execution trader cannot hold four charts in their head. This gives you the 30m / 1h / 2h / 4h structure – and the live liquidity on each – updating tick by tick without ever changing timeframe. Only unswept pools are drawn, so what you are looking at is always liquidity that still exists.",
      "description": "DS Parallax puts up to four live higher-timeframe charts in the corner of the one chart you trade, each with its own price axis, candles, live-price line and bar-close countdown, and marks the footprint that matters most on every one: where the liquidity lies. Buy-side pools (BSL) are the buy stops resting above an unswept swing high; sell-side pools (SSL) are the sell stops below an unswept swing low; relative-equal highs and lows carry a touch count, and line weight is that count – because more tests of a level means more stops resting beyond it, and that is the only strength the engine can honestly claim. A pool is drawn only while it is live: an unswept high is by definition one no newer bar has exceeded, so there is no wait-N-bars pivot delay, and a fresh level from two bars ago is already a valid pool. When price runs a level and closes back inside, the pool is ghosted with a dashed trace ending in an x at the sweep bar, because the sweep itself is the pattern worth recognising; a level price closed through and held beyond was a breakout and is simply gone. A fold tab collapses the whole matrix for a clean chart without taking the indicator off.",
      "cover": "/covers/parallax.webp"
  },
  {
      "slug": "isotropic-lines",
      "name": "DS Isotropic Lines",
      "kind": "indicator",
      "category": "Trend Channels",
      "purpose": "Sigma-normalised structural trend channels – a trend angle that is a property of the market rather than of your monitor.",
      "hooks": [
          "45 degrees means 1 sigma",
          "Six scales vote",
          "Sigma-clamped channels",
          "No repaint"
      ],
      "helps": "Resize a normal chart and every trend angle changes, which makes the word 'steep' meaningless. DS Isotropic Lines normalises log-price by Yang-Zhang volatility so 45 degrees means roughly one sigma per bar on any instrument and any timeframe, then runs six scales in parallel and tells you how many of them agree.",
      "description": "DS Isotropic Lines normalises log-price by Yang-Zhang volatility, creating a coordinate system in which a trend angle becomes an intrinsic property of the market. From it the engine builds blocks from geometric-mean log-midpoints, finds the longest monotonic segment to set direction, and fits a channel that is a least-squares regression over the segment's highs and lows, sigma-clamped around the geometric-mean trend slope and enveloped so the ceiling can never cross the floor – which is what decouples the channel from a single extreme wick. In a genuine range, where the measured angle sits inside your range threshold, it says so and draws the boundaries flat at the segment's high and low rather than regressing against a trend that is not there. Up to six prime block periods run in parallel and report cross-scale consensus out of the number that actually voted, with five- and six-of-six agreement the conditions worth alerting on. A breakout and retest state machine drives alerts and optional markers, and Close Bar anchoring means the structure does not repaint.",
      "cover": "/covers/isotropic-lines.webp"
  },
  {
      "slug": "adaptive-priceline",
      "name": "DS Adaptive PriceLine",
      "kind": "indicator",
      "category": "Chart Essentials",
      "purpose": "A self-anchoring replacement for NinjaTrader's native price line that re-derives its geometry every frame, from the live candle to the price axis.",
      "hooks": [
          "Always on the candle",
          "Bar-close countdown",
          "Timezone-proof clock",
          "Follows Oracle's colour"
      ],
      "helps": "The native line starts at a fixed percentage of panel width, so it drifts off the candle the moment you scroll, zoom or change your right margin. This one anchors to the actual candle on every render frame, adds a premium glow and anchor circle, and carries a live bar-close countdown that rides the line.",
      "description": "DS Adaptive Price Line draws a single horizontal line at the live last price, but instead of starting at a fixed percentage of panel width it re-derives its geometry on every render frame: the left end anchors to the exact chart position of the most recent candle – hugging its edge, with configurable clearance for long wicks – the level tracks the live price, and the right end meets NinjaTrader's own axis price marker. On that base sits a hand-rendered premium look: a luminous glow halo, rounded caps, a candle-to-axis opacity fade and an anchor circle at the candle. A signal-card chip rides the line with a monospaced countdown to the forming bar's close, blinking amber in the final seconds and red at the very end; it is timezone-proof, learning the display frame's offset from the live feed rather than trusting the PC clock, and it counts down correctly on Heiken-Ashi and Volumetric charts. By default it paints behind the bars so it never covers price action, and it can follow DS Oracle's live trend colour process-wide – bound by reflection, so it has no dependency on Oracle and runs perfectly alone.",
      "cover": "/covers/adaptive-priceline.webp"
  },
  {
      "slug": "chart-price",
      "name": "DS Chart Price",
      "kind": "indicator",
      "category": "Chart Essentials",
      "purpose": "A large animated last-price readout that blinks green on upticks and red on downticks, turns amber when the tape goes choppy, and carries a three-level alert engine.",
      "hooks": [
          "Price you cannot miss",
          "Chop turns it amber",
          "Three sound alerts",
          "Zero chart lag"
      ],
      "helps": "Price normally lives only on the far-right axis. This puts it front and centre, colour-codes the character of the tape so you feel chop before you name it, and lets you arm up to three price alerts with soft built-in tones and a real volume control – so you can watch a level hands-free.",
      "description": "DS Chart Price puts the current price front and centre in a large, colour-coded readout. Every tick compares the new price to the last and colours green or red, while choppiness is measured with the Kaufman Efficiency Ratio over a rolling window – low efficiency ramps the resting colour toward amber, high efficiency holds a strong directional colour. The alert engine takes up to three price levels and plays that level's tone whenever price crosses it from either direction, with a re-arm distance in ticks and an optional cooldown so a level cannot repeat-fire while price hovers on it; alerts are realtime-only and never fire on historical bars, chart load or scrolling. The three tones are synthesized in memory with click-free envelopes, so there are no sound files to install or lose, and the 0-100 volume control scales amplitude directly – true per-indicator loudness, which NinjaTrader's own alert playback cannot offer. Performance is deliberate: purely tick-driven with no forced refresh out of the box, zero per-frame allocation, and the entire alert engine off the render path.",
      "cover": "/covers/chart-price.webp"
  },
  {
      "slug": "toolkit",
      "name": "DS Toolkit",
      "kind": "addon",
      "category": "Workflow & Control",
      "purpose": "One translucent rail on your chart: every DS indicator as an on/off row, your drawing tools underneath, and freehand chalk at the bottom.",
      "hooks": [
          "One rail, whole chart",
          "ALL OFF, then exactly back",
          "Chalk that pans and zooms",
          "Every drawing tool, one click"
      ],
      "helps": "It removes the two things that break your rhythm mid-session: hunting through Properties to turn an indicator off, and hunting the toolbar for the right drawing tool. One click per indicator, one click per tool, and a chalk pen for marking up a chart while you think – all from a rail that fades out of the way when you are not using it.",
      "description": "DS Toolkit is the all-in-one chart add-on for the DS Universe suite, and it supersedes both DS Control Panel and DS ToolBar & Checklist. The indicator deck lists one row for each DS indicator actually loaded on that chart – nothing else is ever listed – and every switch is bound to a render-live master, so the overlay clears on the very next frame while the engine keeps computing and re-enabling is instant. The switch is a mute, not a preset: turning an indicator off closes its master and nothing else, so your own settings and templates survive every toggle. Indicators drawing in their own panel are grouped under a hairline and marked by shape rather than colour, read live from the chart rather than from a declared default. ALL OFF strips the chart to bare candles for a screenshot and the next click restores exactly what was on. The drawing deck reflects over every drawing tool present on your build – asking each for its own name and icon and activating it through NinjaTrader's own call, so third-party tools work for free – and DS Chalk is a real drawing tool whose every point is a genuine time-and-price anchor, so your freehand marks pan, zoom and save with the workspace.",
      "cover": "/covers/toolkit.webp"
  },
  {
      "slug": "screener",
      "name": "DS Screener",
      "kind": "addon",
      "category": "Screening & Dashboard",
      "purpose": "A real-time market screening dashboard – futures, stocks, options and forex – that you arrange like a trading hub.",
      "hooks": [
          "32 screening strategies",
          "Every market, one window",
          "Saves itself instantly",
          "Dark and light themes"
      ],
      "helps": "One window replaces a wall of them: a quote board for every instrument you pin, 32 screening strategies, live mini charts, a market heatmap, a built-in news and economic-calendar terminal, plus correlation and cointegration tools. Drag any panel anywhere, and every customisation saves itself the moment you make it.",
      "description": "DS Screener turns one window into a complete trading hub. A configurable 1-6 column grid holds five element types: the Quote Board (Last, Chg%, RSI, day high/low, prior settle, Gap%, volume and time-of-day RVOL for every pinned instrument), 32 screening strategies spanning price, volume and level tests plus full technicals (VWAP, EMA/SMA, Bollinger, RSI, MACD, ADX, SuperTrend, Donchian and more), live mini charts from 10 seconds to 4 hours, a Market Hub heatmap, and DS News – an economic-calendar and headlines terminal built in. A SCREENER / NEWS / PAIRS / RACE / ALERTS tab bar sits over the top, with PAIRS merging the correlation matrix and the cointegration spread lab into one master-detail view, and the SCREENER home carrying view presets that swap the whole column set over the same instruments. Everything runs on NinjaTrader's supported public API with no external data. Panels drag, resize across columns and rows and persist automatically, front-month contracts roll on real CME last-trade dates, and the entire dashboard runs in your choice of a dark or a soft-platinum light theme.",
      "cover": "/covers/screener.webp"
  },
  {
      "slug": "marketwatch",
      "name": "DS MarketWatch",
      "kind": "addon",
      "category": "Screening & Dashboard",
      "purpose": "A floating, draggable market-watch panel of live mini charts on every chart – the on-chart alternative to a second window.",
      "hooks": [
          "Watchlist on your chart",
          "Live sparkline tiles",
          "Market Replay safe",
          "Follows your NinjaTrader skin"
      ],
      "helps": "Keep the instruments you care about in view without leaving the chart you are trading. Each tile is a two-colour baseline sparkline plus one readout you choose – net change, percent change, last price or day range – and a single toolbar chip toggles the whole panel.",
      "description": "DS MarketWatch mounts a floating, draggable market-watch panel over every NinjaTrader 8 chart, toggled from a chip on the chart's top toolbar. Each tile shows a two-colour baseline sparkline plus one readout across a timeframe window you choose, and tiles are organised into group tabs. The panel is theme-aware, following your live NinjaTrader skin dark or light and coordinating its accent and up/down colours with the shared DS Universe colour themes. Under the hood each tile issues one intraday request for the sparkline shape plus a small daily request for the readouts, with identical tiles sharing a single ref-counted request so duplicates cost nothing; callbacks arrive on a background thread and only write into a locked snapshot, which the UI polls and redraws only when it changed, so fast markets never stutter the panel. Market Replay is handled by a purpose-built one-shot feed path that refreshes immediately when you navigate the replay date and otherwise on a slow cadence – a root-cause fix for the freeze a persistent subscription causes – and a stalled request is abandoned and re-issued rather than leaving a tile showing a confidently wrong price.",
      "cover": "/covers/marketwatch.webp"
  },
  {
      "slug": "time-intervals",
      "name": "DS Time Intervals",
      "kind": "addon",
      "category": "Workflow & Control",
      "purpose": "A one-click timeframe bar on the top toolbar of every chart, so you switch periods without opening the native dropdown.",
      "hooks": [
          "Timeframes in one click",
          "Five editable favourites",
          "Highlights your current",
          "Theme-aware"
      ],
      "helps": "Changing timeframe is one of the most repeated actions in a trading day and NinjaTrader makes it a two-step dropdown. This makes it one click, with five editable favourites shared across every chart and a chevron for the full jump-to list.",
      "description": "DS Time Intervals injects a small row of clickable interval buttons onto the top toolbar of every NinjaTrader 8 chart window. The bar is transparent, sits directly on the toolbar with no box, and is theme-aware: text, highlight, dividers and dropdown follow your active NinjaTrader skin and re-tint automatically when you change it. The five favourites are fully editable and shared across every chart, and the chevron opens a larger jump-to list plus the favourites editor. NinjaTrader exposes no public API for setting a chart's period, so the add-on drives the chart window's own interval selector, triggering exactly the same reload the native dropdown does; a timer highlights whichever favourite matches the current period, catching up within about half a second even if you change timeframe by other means, while idle charts do near-zero work. Clicking the interval you are already on does nothing, deliberately, because re-applying it would trigger a full historical reload for no change – and every helper type it declares is DS-prefixed so it can never collide with another vendor's script.",
      "cover": "/covers/time-intervals.webp"
  },
  {
      "slug": "bulk-replay-downloader",
      "name": "DS Bulk Replay Downloader",
      "kind": "addon",
      "category": "Data Utility",
      "purpose": "Bulk Market Replay downloading – many instruments across a full date range in one queued run, instead of one instrument and one day at a time.",
      "hooks": [
          "Bulk replay downloads",
          "Whole date ranges",
          "Skips what you have",
          "Playback-ready files"
      ],
      "helps": "Building a replay library by hand is an evening's work for a week of data. Queue every instrument and every date you want, start it, and watch a per-file progress list fill in – the files land in NinjaTrader's own folder, so Playback picks them up with no extra step.",
      "description": "DS Bulk Replay Downloader automates NinjaTrader's own Get Market Replay Data download for every instrument-and-day pair you queue, showing a per-file progress list as it works. Files land in the standard location, so Playback picks them up automatically. It supplies no external data and bypasses no NinjaTrader limit – it only orchestrates the same download the platform already performs, in bulk, because NinjaTrader has never shipped bulk replay downloading. You add instruments from the standard selector, tick the ones this run should include, set a begin and end date, and choose whether to skip weekends and days already saved; a begin date older than the roughly 90-day serving window is moved forward automatically with a note, and a truncated file is treated as missing and re-fetched rather than silently trusted. Because the underlying mechanism is undocumented and can move between NinjaTrader builds, the add-on auto-detects it and ships a Diagnostics button plus a manual override, so a platform update can never leave you without a path forward.",
      "cover": "/covers/bulk-replay-downloader.webp"
  },
];

export const KIND_LABEL: Record<Kind, { singular: string; plural: string; blurb: string }> = {
  indicator: {
    singular: "Indicator",
    plural: "Indicators",
    blurb: "Drawn on the chart itself. Each one answers a single question about the market in front of you.",
  },
  addon: {
    singular: "Add-on",
    plural: "Add-ons",
    blurb: "Mounted on the platform, not the chart. Workflow, screening and data utilities that make NinjaTrader quicker to live in.",
  },
};

export const byKind = (kind: Kind) => PRODUCTS.filter((p) => p.kind === kind);
export const BY_SLUG: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p]));
