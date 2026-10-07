/**
 * The listing copy — the same words a buyer reads on Whop, on our own page.
 *
 * GENERATED from the "Whop Listings" tab of "DS Universe - Master Product &
 * Pricing Sheet" (updated 2026-10-05), split the way every entry is: the "✦"
 * line is the hook, the next paragraph the lede, "◆" the heading, the four "▸"
 * lines the points, and what follows the closing paragraphs. Do not hand-edit:
 * change the sheet and regenerate, so the store and the site never drift apart.
 * The trailing disclaimer each listing carries is dropped on purpose — the
 * footer renders the full risk, hypothetical performance and trademark
 * disclosures on every page.
 *
 * DS ASL has NO Whop listing (it comes free with DS Complete and is not sold
 * on its own), so its words are its shipped README's — its opening line, its
 * "What you're looking at" table and "Good to know" — and its last line is the
 * site's one sentence for a product that comes with the bundle.
 * DS TOOLKIT comes free with DS Complete too (2026-10-05) and its own Whop
 * listing is retired. Its entry keeps the listing's words about what the rail
 * does, and ends on the same sentence as DS ASL's.
 *
 * DS Complete's listing is not used on the site: it prints prices and counts
 * as text. The site describes DS Complete from content/pricing.ts, where every
 * figure is computed and every product named from the catalogue.
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
  /** The closing paragraphs — usually what it does not do. */
  close: string[];
};

export const LISTING: Record<string, ListingCopy> = {
    "zones": {
        "hook": "Most zone tools draw a box and leave it. This one tracks what price does to it.",
        "lede": "Swing pivots, volume supply/demand and real order flow merge into one ranked map — and only the strongest few are drawn.",
        "heading": "Every zone is alive",
        "points": [
            "FRESH → APPROACHING → TESTING → DEFENDED / BREAKING, read from the live tape",
            "Order flow inside the zone drives its evolving conviction",
            "A broken zone keeps its identity and dims to a dotted band — it never role-reverses",
            "Everything on one price merges into a single ranked level"
        ],
        "close": [
            "Structure is confirmed on closed bars — it does not repaint — while the live read updates with the tape."
        ]
    },
    "iceberg": {
        "hook": "Price shows you where the market went. This shows you where someone large would not let it go.",
        "lede": "An iceberg order hides its size — a slice shows, gets hit, and re-posts at the same price. Its signature is absorption: heavy volume trades in, aggressors keep hitting it, and price is rejected anyway.",
        "heading": "Two engines, working independently",
        "points": [
            "A wick-rejection and volume test confirmed only when repeated tests cluster at one price",
            "A volume-at-price footprint refined by the true bid/ask on every trade",
            "Levels both engines agree on are drawn in cyan or magenta",
            "Each level shows its traded volume and test count"
        ],
        "close": [
            "Drawn as a self-updating runway zone, built entirely from closed bars — it does not repaint."
        ]
    },
    "oracle": {
        "hook": "A SuperTrend that only speaks when the evidence agrees.",
        "lede": "A plain SuperTrend flips constantly, and most of those flips are noise. Every flip here is matched against the chart's own history and put to a weighted vote before it is promoted to a confirmed signal.",
        "heading": "What sits on the chart",
        "points": [
            "The Neural Line — one decision boundary through price: above it long, below it short",
            "Five-state Spectrum candles, from strong down to strong up",
            "A flip only counts once the vote across similar historical states agrees",
            "An ATR flip buffer, so chop cannot strobe the side back and forth"
        ],
        "close": [
            "The engine never invents a signal of its own — it only filters the SuperTrend's. Default Close Bar anchoring: it does not repaint."
        ]
    },
    "gex": {
        "hook": "The option levels that quietly govern the day — on your chart, with nothing to subscribe to.",
        "lede": "Put it on NQ, ES or gold and it fetches the delayed option chain, works out every level in the background, and draws them.",
        "heading": "On the chart",
        "points": [
            "Call Wall and Put Wall, plus 0DTE walls for today's expiry",
            "Gamma Flip — solved by recomputing gamma across a grid of spot prices, not guessed",
            "HGEX, Max Pain, ranked G+ / G- strikes",
            "An Expected Move band and an ATR grid off the session open"
        ],
        "close": [
            "The map is captured at two fixed times a day and then held still — a manual levels override is included too."
        ]
    },
    "flow": {
        "hook": "A candle tells you where the market went. This tells you where it did business — and who was pressing.",
        "lede": "Each group of candles is x-rayed into a volume-by-price profile: one row per price, split into buy and sell, the longest row the fairest price.",
        "heading": "What the rows tell you",
        "points": [
            "Statistically heavy rows flagged as acceptance shelves — the magnets and reaction zones",
            "Buy% vs Sell% in a summary box for absorption and exhaustion",
            "A glass candle that dims on below-average volume, so a hollow move is obvious",
            "Built from one extra lower-timeframe series — no tick-history download needed"
        ],
        "close": [
            "Detail scales cleanly with zoom, and DS Toolkit can show or hide the whole overlay from the toolbar."
        ]
    },
    "prorsi": {
        "hook": "A classic RSI counts a quiet bar and a heavy bar the same. This one weighs each bar by its volume, and maps where the turns happened.",
        "lede": "Each bar's move is weighted by its volume against what is normal for that minute of the day. When the RSI turns back from an extreme, the turn is left on your price chart as a zone: its far edge at the turn's extreme, its near edge where the nearest volume of the turn traded.",
        "heading": "What a zone tells you",
        "points": [
            "STRATA — five hairlines inside the zone, one at each sixth of its volume",
            "PIPS — one, two or three lit on the flag, by the volume behind the turn against normal",
            "REINFORCED — a later turn on the same ground strengthens the zone instead of stacking another",
            "RECORD — zones HELD and zones BROKE, counted on the chart in front of you"
        ],
        "close": [
            "Underneath, the RSI panel: the weighted line over a faint classic RSI, a heat ribbon, a volume strip, the distance to the nearest zones and the price at which the RSI would cross its signal.",
            "A zone describes where momentum turned and where the volume traded. It is a map and a record, not a forecast.",
            "Closed-bar decisions throughout — it does not repaint."
        ]
    },
    "proliquidityhunter": {
        "hook": "Every liquidity tool draws the highs and lows price left behind. This one also says how likely price is to go back for each — and keeps score.",
        "lede": "Every swing extreme price has not traded back through is mapped as a pool, over a line-on-close view of price, and heated by the measured odds that price reaches it within the horizon — odds read from your own chart's history.",
        "heading": "What the panel reads",
        "points": [
            "POOLS — buy-side over the highs, sell-side under the lows, stacked when they coincide and ranked LOCAL, SWING or MAJOR",
            "ODDS — COOL from 5%, WARM from 25%, HOT from 60%: probabilities, the same on every chart, with nothing to tune",
            "TRACK RECORD — how often each tier was taken within the horizon, measured on the chart in front of you",
            "SWEPT or RUN — the verdict on a taken pool, given on the next close; a swept MAJOR pool is marked on price"
        ],
        "close": [
            "It measures reach — distance and time — and marks a precisely defined event. It does not see resting orders, and it is not a forecast of direction. It reads price only, on any instrument, timeframe and bar type.",
            "Closed-bar decisions throughout — it does not repaint."
        ]
    },
    "proheikinashi": {
        "hook": "A Heikin-Ashi chart shows the trend and hides the price. Its candles are averages, so nothing on it is a price that traded.",
        "lede": "DS ProHeikinAshi leaves your candlestick chart alone and draws the Heikin-Ashi candle in a panel under it, with the one thing a Heikin-Ashi chart cannot show: the price at which its color flips.",
        "heading": "What the panel reads",
        "points": [
            "FLIP LEVEL — the price the next bar's average must finish beyond for the color to change, drawn on your price chart as a rail",
            "CUSHION — how far the close stands clear of it, in the chart's own unit: FLIP PENDING, HOLDING or FIRM",
            "FLIP ODDS — how often a candle with this cushion flipped on the next bar, from a measured table that then learns your chart",
            "Two higher-timeframe candles as lanes, built from the chart's own bars with no second data series"
        ],
        "close": [
            "No length, threshold or sensitivity to tune. A Heikin-Ashi color describes the last few bars — measured, it did not say where price went next, and the panel is not a forecast. What can be measured is when the color ends.",
            "Closed-bar decisions throughout — it does not repaint."
        ]
    },
    "protrendrange": {
        "hook": "Most panels answer one question. A pullback trade asks three: is there a trend, is this a pullback inside it, and has the pullback finished.",
        "lede": "One measurement taken over two lengths, on one statistical scale — a thick TREND line for the tide, a thin SWING line for the wave — with the pullback filled as a pocket and one closed-bar signal, the RESUME, on the bar the pocket closes.",
        "heading": "What the panel reads",
        "points": [
            "TREND latches on at one sigma and stays on until the close crosses its own average — a state, not a line that flickers",
            "PULLBACK fills as a pocket in the trend's own color; RANGING steps the panel back to neutral and draws the range's two rails on price",
            "RESUME — one per leg, confirmed on the next close, graded PRIME, STANDARD or MINOR",
            "Every resume is drawn on price as a shelf at its HOLD level: the pullback's own extreme, the price that says it did not hold"
        ],
        "close": [
            "One sigma is one sigma on every instrument, timeframe and bar type, so there is no threshold to tune. It reads the state of the market and marks a precisely defined event — it is not a forecast. The panel's Y-axis locks, so a chart drag can never push the reading off its own scale.",
            "Closed-bar decisions throughout — it does not repaint."
        ]
    },
    "bulk-replay-downloader": {
        "hook": "Building a replay library one instrument and one day at a time is an evening's work for a week of data.",
        "lede": "This queues the whole job and shows a per-file progress list while it runs.",
        "heading": "How a run works",
        "points": [
            "Add instruments, tick the ones you want, set a start and end date",
            "Files land in NinjaTrader's own replay folder — Playback finds them automatically",
            "Days you already have are skipped; a truncated file is re-fetched, not trusted",
            "An older start date beyond NinjaTrader's ~90-day window is moved forward automatically"
        ],
        "close": [
            "It supplies no data of its own and bypasses no platform limit — it only automates NinjaTrader's own download, in bulk."
        ]
    },
    "asl": {
        "hook": "Every session's high and low, drawn exactly where the session started and finished — and inside each bracket, the volume that built it.",
        "lede": "Everything DS Session Levels draws is here, unchanged. Inside every bracket it draws the session's volume profile — how much traded at each price — and turns the busiest price, the POC, into a level of its own. It sits behind your candles and never touches your price scale.",
        "heading": "On the chart",
        "points": [
            "Thin bars inside the bracket — the session's volume at each price; the longest is the POC, the stronger bars the value area",
            "A line from the longest bar — the POC as a level, dotted forward until the session opens again, faded once price trades at it",
            "A thick bar or a hairline with a serif — an HVN, or the LVN, the thin place between two of them",
            "A dotted spine — more than 5% of that profile was completed from 1-minute bars"
        ],
        "close": [
            "No Tick Replay needed: the trade history is read in the background, and the chart never waits for it.",
            "It comes free with DS Complete and is not sold on its own."
        ]
    },
    "adaptive-priceline": {
        "hook": "NinjaTrader's price line drifts off the candle the moment you scroll, zoom or change your margin.",
        "lede": "This one re-derives its geometry on every render frame — anchored to the live candle, running to the axis marker, exactly where it belongs no matter what you do to the chart.",
        "heading": "The details",
        "points": [
            "A bar-close countdown riding the line, timezone-proof and correct across DST",
            "Counts down on Heiken-Ashi and Volumetric charts too",
            "Glow, rounded caps and an anchor bead seated on the candle, painted behind the bars",
            "Zero per-frame allocations, so it never lags"
        ],
        "close": [
            "The countdown can also run entirely on its own with the line itself switched off."
        ]
    },
    "chart-price": {
        "hook": "Price lives in small type on the far-right axis. Put it where you can see it.",
        "lede": "Upticks flash green, downticks flash red — and the resting color eases to amber as the tape loses efficiency, so you feel chop before you name it.",
        "heading": "Built in",
        "points": [
            "Nine placements on the price panel — top, middle or bottom; left, center or right",
            "Mono color and Reduced motion modes for a calmer readout, with an opacity control",
            "Three price levels, each sounding once per approach with a real volume control",
            "Four tones synthesized in memory — no sound files to install",
            "Realtime only — never fires on history, chart load or while you scroll back"
        ],
        "close": [
            "Tick-driven with no forced repaints, so it adds nothing to the chart you already run."
        ]
    },
    "ds-258": {
        "hook": "The four prices inside every Nasdaq hundred-point block, always on the chart.",
        "lede": "29,000 · 29,020 · 29,050 · 29,080 · 29,100 — the 00, 20, 50 and 80 keep doing the work. This lays a line on every one in view, quietly behind your candles until price stops on it.",
        "heading": "Built to stay out of the way",
        "points": [
            "Every 00/20/50/80 level in view, each in its own color",
            "Quiet by default — clear at a glance, never a wall",
            "De-clutters automatically as you zoom out",
            "Nothing to calculate, nothing to configure"
        ],
        "close": [
            "Add it to an NQ or MNQ chart and the map is simply there."
        ]
    },
    "parallax": {
        "hook": "Four higher timeframes, live, on the chart you actually trade.",
        "lede": "15m, 1h, 4h and 1D — each with its own axis, candles and countdown to close. You never change your chart's own timeframe.",
        "heading": "It marks one thing, properly",
        "points": [
            "BSL — buy stops resting above an unswept swing high",
            "SSL — sell stops resting below an unswept swing low",
            "Line weight is the touch count — more tests, more stops sitting beyond it",
            "Only live pools are drawn, so what you see still exists"
        ],
        "close": [
            "Run a level and close back inside, and the pool ghosts with a small cross at the sweep — the pattern worth seeing."
        ]
    },
    "session-levels": {
        "hook": "Every session's high and low, drawn exactly where the session started and finished.",
        "lede": "Asia, London and New York each leave two prices behind. This draws them for you — each session as a short bracket over its own bars, in its own color, carried forward until it opens again and faded from the bar that closes through it.",
        "heading": "Built on the clock",
        "points": [
            "Exact highs and lows on every intraday chart",
            "Levels carried forward until their session reopens",
            "Futures ETH, ICT killzone and forex presets",
            "Right in any time zone, through every daylight-saving change"
        ],
        "close": [
            "Free — add it to any intraday chart and the sessions are there."
        ]
    },
    "toolkit": {
        "hook": "One rail on the chart: your indicators on top, your drawing tools below, chalk at the bottom.",
        "lede": "Turning an indicator off usually means a dialog, a checkbox and Apply. Here it is one click.",
        "heading": "What the rail does",
        "points": [
            "Lists only the DS indicators actually on that chart",
            "Each switch is a mute, not a preset — your settings survive every toggle",
            "ALL OFF strips the chart to bare candles; the next click restores exactly what was on",
            "Three real opacity looks — Solid genuinely blocks the chart, Frosted and Ghost let it through"
        ],
        "close": [
            "Every drawing tool on your build appears for free, plus DS Chalk — a real drawing tool whose strokes pan, zoom and save with the workspace.",
            "It comes free with DS Complete and is not sold on its own."
        ]
    },
    "stochastics": {
        "hook": "One stochastic lane tells you overbought. Four lanes, latched together, tell you whether that means anything.",
        "lede": "Fast, standard, slow and long stochastics share one panel, and a quad latch only arms when all four sit at an extreme at once.",
        "heading": "From an armed latch",
        "points": [
            "ROTATION — the fastest lane turns back out of its extreme",
            "PRIME — that rotation carries a same-direction divergence with it",
            "PULLBACK — the slow lane holds a trend while the fast lane dips and turns",
            "Confluence count shows how many lanes agree, lane by lane"
        ],
        "close": [
            "Divergence runs independently on every lane from confirmed pivots, marked on the panel and on the price chart. The panel's Y-axis locks, so a chart drag can never misalign the four lanes.",
            "Closed-bar decisions throughout — it does not repaint.",
            "Free — add it to a chart and all four lanes are there."
        ]
    },
    "squeeze": {
        "hook": "Knowing a squeeze is on is the easy part. Knowing whether the fire is worth trusting is the part that matters.",
        "lede": "Compression reads as one continuous number, not a dot — COILING, SQUEEZE and DEEP are thresholds on top of it — and every fire is graded the moment it happens, not just flagged.",
        "heading": "What grades a fire",
        "points": [
            "ADX and two wave horizons produce PRIME down to BARE, or AGAINST FLOW",
            "EARLY marks the fastest wave hooking toward the others before the fire prints",
            "TTM momentum drawn as a line, normalized by ATR, over a tier-colored centerline",
            "A reversion setup arms — with a defined target and 1:1 risk — only when there is no squeeze and no running fire"
        ],
        "close": [
            "Two playbooks that never compete for your attention on the same bar. The panel's Y-axis locks, so a chart drag can never distort the read.",
            "Closed-bar decisions throughout — it does not repaint.",
            "Free — add it to a chart and the squeeze read is there."
        ]
    },
    "macd": {
        "hook": "By the time a MACD cross prints, the bar that made it has already closed. This solves the price it will happen at first.",
        "lede": "The close that crosses the signal line is worked out in closed form from the prior bar — exact on the Classic and PPO scales, within one bar's change in ATR on the default MACD-V scale — and shown as a rail on your price chart, a header chip and a panel target.",
        "heading": "What makes the panel itself different",
        "points": [
            "MACD-V scale by default — real fixed zones on every instrument, not a self-rescaling axis",
            "A six-state ribbon: RISK, RALLYING, RETRACING, RANGING, REBOUNDING, REVERSING",
            "Four early layers — histogram slope-flip, pre-cross alarm, zero-line cross, ranging suppression",
            "Divergence with a PENDING → CONFIRMED / BROKEN / EXPIRED lifecycle, not a static mark"
        ],
        "close": [
            "The panel's Y-axis locks, so a chart drag can never push the reading off its own scale.",
            "Closed-bar decisions throughout — it does not repaint.",
            "Free — add it to a chart and the cross price is there."
        ]
    },
    "vwap": {
        "hook": "Where is value? There are two honest answers, and this panel draws both.",
        "lede": "Value today is the session's VWAP. Value now is what the market has been paying lately. DS VWAP runs price as a line through a live band that follows it, keeps the session VWAP on the map as the anchor, and uses the chart's right-side margin to look forward.",
        "heading": "Measured, not assumed",
        "points": [
            "A live VWAP on a volume clock — it forgets by contracts traded, not by minutes",
            "Bands that hold half and nine in ten closes, learned from your own chart",
            "The session VWAP with its own measured edges, the same line on every intraday chart",
            "Reach contours and return odds in the margin, with the track record on screen"
        ],
        "close": [
            "It measures where price stands and what a move would take. It does not claim that a stretch reverts or that it continues. Closed-bar decisions throughout — it does not repaint.",
            "Free — add it to a chart and both VWAPs are there."
        ]
    }
};

export const listingCopyFor = (slug: string): ListingCopy | undefined => LISTING[slug];
