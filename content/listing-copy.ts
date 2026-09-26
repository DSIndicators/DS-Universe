/**
 * The listing copy — the same words a buyer reads on Whop, on our own page.
 *
 * GENERATED from the "Whop Listings" tab of "DS Universe - Master Product &
 * Pricing Sheet" (DS LAUNCH 09-20). Do not hand-edit: change the sheet and
 * regenerate, so the store and the site never drift apart. The trailing
 * disclaimer each listing carries is dropped on purpose — the footer renders the
 * full risk, hypothetical performance and trademark disclosures on every page.
 *
 * DS Complete's listing is NOT used on the site: it counts "nine paid tools" and
 * "four flagship indicators", and the lineup has ten paid products and five
 * flagships (the $749.90 it quotes is right — it is the ten). The site describes
 * Complete in its own words, in content/pricing.ts, without counts.
 *
 * One correction applied on the way in (make the same one on Whop):
 *   DS ProMACD  "the price it will happen at first" -> "would happen at, first"
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
    "zones": {
        "hook": "Most zone tools draw a box and leave it. This one tracks what price does to it.",
        "lede": "Swing pivots, volume supply/demand and real order flow merge into one ranked map — and only the strongest few are drawn.",
        "heading": "Every zone is alive",
        "points": [
            "FRESH → APPROACHING → TESTING → DEFENDED / BREAKING, read from the live tape",
            "Order flow inside the zone drives its evolving conviction",
            "A broken zone keeps its identity and dims to a dashed band — it never role-reverses",
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
            "Levels both engines agree on carry a distinct accent border",
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
        "hook": "An RSI cross is a moment on an oscillator. This turns it into a level on your actual chart.",
        "lede": "Every RSI/signal crossover is anchored to the swing that produced it, spaced from its neighbors by ATR, and left on the price panel as a level you can actually trade against.",
        "heading": "How a level behaves",
        "points": [
            "Tinted by how extreme the RSI was the moment it was born",
            "Labeled with the exact RSI reading and a live touch count",
            "Frozen to a thin gray trace the instant price closes through it",
            "The panel's Y-axis locks, so dragging the chart can never distort the read"
        ],
        "close": [
            "Underneath, a full RSI panel: heat ribbon, shaded 30/70 zones, a segment-colored line, and the nearest support and resistance distance in points and percent.",
            "Closed-bar decisions throughout — it does not repaint."
        ]
    },
    "prostochastics": {
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
            "Closed-bar decisions throughout — it does not repaint."
        ]
    },
    "prosqueeze": {
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
            "Closed-bar decisions throughout — it does not repaint."
        ]
    },
    "promacd": {
        "hook": "By the time a MACD cross prints, the bar that made it has already closed. This solves the price it would happen at, first.",
        "lede": "The exact close that crosses the signal line is worked out in closed form from the prior bar alone — fixed for the whole bar, so it cannot repaint — and shown as a rail on your price chart, a header chip and a panel target.",
        "heading": "What makes the panel itself different",
        "points": [
            "MACD-V scale by default — real fixed zones on every instrument, not a self-rescaling axis",
            "A six-state ribbon: RISK, RALLYING, RETRACING, RANGING, REBOUNDING, REVERSING",
            "Four early layers — histogram slope-flip, pre-cross alarm, zero-line cross, ranging suppression",
            "Divergence with a PENDING → CONFIRMED / BROKEN / EXPIRED lifecycle, not a static mark"
        ],
        "close": [
            "The panel's Y-axis locks, so a chart drag can never push the reading off its own scale.",
            "Closed-bar decisions throughout — it does not repaint."
        ]
    },
    "adaptive-priceline": {
        "hook": "NinjaTrader's price line drifts off the candle the moment you scroll, zoom or change your margin.",
        "lede": "This one re-derives its geometry on every render frame — anchored to the live candle, running to the axis marker, exactly where it belongs no matter what you do to the chart.",
        "heading": "The details",
        "points": [
            "A bar-close countdown riding the line, timezone-proof and correct across DST",
            "Counts down on Heiken-Ashi and Volumetric charts too",
            "Glow, rounded caps and an anchor circle, painted behind the bars",
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
        "lede": "29,000 · 29,020 · 29,050 · 29,080 · 29,100 — the 00, 20, 50 and 80 keep doing the work. This lays a line on every one in view, at an opacity you forget until price stops on it.",
        "heading": "Built to disappear",
        "points": [
            "Every 00/20/50/80 level in view, each in its own color",
            "Opacity 7 by default — a whisper, not a wall",
            "De-clutters automatically as you zoom out",
            "Nothing to calculate, nothing to configure"
        ],
        "close": [
            "Add it to an NQ or MNQ chart and the map is simply there."
        ]
    },
    "parallax": {
        "hook": "Four higher timeframes, live, in the corner of the chart you actually trade.",
        "lede": "30m, 1h, 2h and 4h — each with its own axis, candles and countdown to close. You never change your chart's own timeframe.",
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
            "Every drawing tool on your build appears for free, plus DS Chalk — a real drawing tool whose strokes pan, zoom and save with the workspace."
        ]
    }
};

export const listingCopyFor = (slug: string): ListingCopy | undefined => LISTING[slug];
