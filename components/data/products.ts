/**
 * Product copy sourced from the official DS Universe brochures + guides.
 * Four suites in one shared card format: DS Systems (6) and DS Radars (3) flagship
 * on-chart suites, plus the DS Carepack (4 finishing tools) and the free DS
 * Crewmates (3). Edit here to update every suite card on the site.
 *
 * NOTE: PULSE has no dedicated brochure page yet — only the one-line description
 * "hears the order flow". Copy below is a faithful expansion of that line.
 * // TODO: replace PULSE copy once a PULSE brochure page exists.
 */

export type Suite = "radars" | "systems" | "carepack" | "crewmates";

export type Product = {
  name: string;
  /** Internal codename / character, where the brochure gives one. */
  codename?: string;
  suite: Suite;
  tagline: string;
  description: string;
  /** lucide-react icon name (resolved in Indicators.tsx). */
  icon: string;
  /** Glow accent for the card. */
  glow: "violet" | "cyan" | "teal" | "ember";
  /** Optional HD product-panel screenshot shown inline under the description. */
  panel?: string;
};

export const SUITES: Record<
  Suite,
  { label: string; title: string; line: string }
> = {
  radars: {
    label: "The DS Radar Series",
    title: "DS Radars",
    line: "Three radars. One read. The tape, decoded live.",
  },
  systems: {
    label: "The DS Systems Suite",
    title: "DS Systems",
    line: "Six instruments. One mind. Precision from orbit.",
  },
  carepack: {
    label: "The DS Carepack",
    title: "DS Carepack",
    line: "Four finishing tools. The part of the trade that's all you.",
  },
  crewmates: {
    label: "The DS Crewmates",
    title: "DS Crewmates",
    line: "Three free chart tools. A beginner's chart that reads like a pro's.",
  },
};

export const PRODUCTS: Product[] = [
  // ── DS Radars ────────────────────────────────────────────────
  {
    name: "PILOTS",
    codename: "Sammy + Freddy",
    suite: "radars",
    tagline: "Direction & conviction.",
    description:
      "Two co-pilots fly the tape — Sammy cautious, Freddy aggressive — fused into one headline call with a confidence score, a live buyers-vs-sellers pressure gauge, and a regime state machine. A full directional read in one glance, never a lone biased signal.",
    icon: "Navigation",
    glow: "teal",
    panel: "/indicators/panels/pilots.webp",
  },
  {
    name: "SWEEPER",
    suite: "radars",
    tagline: "The trap hunter.",
    description:
      "Watches for the moves that fool everyone else — sweeps, absorption, fake breakouts and weak continuations. A Threat Index and Conviction bar quantify the danger so you see the trap before it springs, and know when strength is really fatigue.",
    icon: "Crosshair",
    glow: "cyan",
    panel: "/indicators/panels/sweeper.webp",
  },
  {
    name: "BEACON",
    suite: "radars",
    tagline: "News & volatility watchtower.",
    description:
      "Your pre-trade early-warning cockpit. Beacon watches the two things that wreck good setups out of nowhere — incoming high-impact news and the VIX. It ranks the three most-upcoming red-flag events by time-until, surfaces the latest breaking headline, and reads the volatility regime live, from Calm to Extreme. A two-stage warning lights the header amber as an event approaches, then full gold when it's imminent — so you size down, stand aside, or trade it on purpose.",
    icon: "Beacon",
    glow: "violet",
    panel: "/indicators/panels/beacon.webp",
  },

  // ── DS Systems ───────────────────────────────────────────────
  {
    name: "ORBIT",
    suite: "systems",
    tagline: "Zones that matter.",
    description:
      "Draws the map — order blocks, support & resistance, volume shelves and all-time-high strength — each one confidence-scored. Untested levels start humble, earn their rating through real interaction, and flip roles the moment they break.",
    icon: "Orbit",
    glow: "violet",
  },
  {
    name: "STARS",
    suite: "systems",
    tagline: "Power movers.",
    description:
      "Marks the dense buyer or seller pockets where market makers are present. Color shows the side leaning in; brightness shows the weight stacked behind it — precision conviction on who controls the tape. No setups, no entry calls.",
    icon: "Sparkles",
    glow: "violet",
  },
  {
    name: "BALANCE",
    suite: "systems",
    tagline: "Premium & discount.",
    description:
      "Answers the only question at the moment of entry: is price rich or cheap? A session-anchored runway maps Premium, Equilibrium and Discount in real time. Buy the discount, fade the premium, never get long at the top by accident.",
    icon: "Scale",
    glow: "cyan",
  },
  {
    name: "EMBER",
    suite: "systems",
    tagline: "The signature heat map.",
    description:
      "Watches the engine of the trend and colors every candle to match. Young trends burn bright and clean; as a move runs out of fuel it cools to a smoky exhaust — the early tell that a trend is about to refuel or turn. Zero repaints.",
    icon: "Flame",
    glow: "ember",
  },
  {
    name: "COUNCIL",
    codename: "Atlas · Sage · Nova",
    suite: "systems",
    tagline: "Multi-timeframe consensus.",
    description:
      "Three voters read the market across five timeframes, from the 1-minute to the hour. Each timeframe needs a two-of-three majority to call a side. One glance tells you whether the whole board is aligned or split — green across the grid is your green light.",
    icon: "Vote",
    glow: "teal",
  },
  {
    name: "PULSE",
    codename: "Free with Systems",
    suite: "systems",
    tagline: "Live order flow.",
    description:
      "Our most powerful read — Pulse hears the true order flow beneath the tape, the live pressure other tools only infer. It runs standalone — no Registry required — and comes free in the Systems package; just enable Tick Replay.",
    icon: "AudioLines",
    glow: "cyan",
  },

  // ── DS Carepack ──────────────────────────────────────────────
  // Four finishing tools — free with DS Systems ($29.99 value).
  {
    name: "CHECKLIST",
    suite: "carepack",
    tagline: "Forces the process.",
    description:
      "Puts your trading plan where your eyes already are — write your own entry rules into a clean panel and tick them off before you ever click. Click a row to toggle it; click the title to wipe the slate for the next setup. No engine, no signals — just the discipline.",
    icon: "Checklist",
    glow: "ember",
  },
  {
    name: "RISK-REWARD",
    suite: "carepack",
    tagline: "The math, as you drag.",
    description:
      "Click your entry, drag to your stop, and it draws the whole trade — a red risk zone below and stacked green rails at 1R, 2R, 3R above, each labelled in points and dollars. Size it by contracts and the numbers update live, so you see exactly what you risk before you commit.",
    icon: "RiskReward",
    glow: "ember",
  },
  {
    name: "PEN",
    suite: "carepack",
    tagline: "Mark it up by hand.",
    description:
      "A smooth freehand drawing tool — sketch a path, circle a level, trace a pattern straight onto price. The stroke is curve-smoothed and frame-rate throttled under the hood, so it stays clean and effortless even on a busy, fast-moving chart.",
    icon: "Pen",
    glow: "cyan",
  },
  {
    name: "P&L",
    codename: "The command centre",
    suite: "carepack",
    tagline: "Your whole edge, on screen.",
    description:
      "Drop a NinjaTrader CSV and it matches your fills into round-trips and computes the P&L for you — no profit column needed. Cumulative net P&L over a living equity curve, drawdown, daily and weekday shape, R-multiple distribution and per-symbol analytics. Re-imports are safe, and everything stays on your computer.",
    icon: "Pnl",
    glow: "ember",
  },

  // ── DS Crewmates ─────────────────────────────────────────────
  // The free Tier-1 set — same engine as the paid suite, scaled to the essentials.
  {
    name: "BC",
    suite: "crewmates",
    tagline: "Structure, in plain sight.",
    description:
      "Reads the chart's skeleton for you — marking BOS when a trend pushes through its last swing, CHoCH the moment momentum flips, and the EQH/EQL liquidity pools price loves to hunt. Bullish events glow green, bearish orange; closed-bar and feather-light.",
    icon: "Bc",
    glow: "teal",
  },
  {
    name: "TL",
    suite: "crewmates",
    tagline: "Always the right line.",
    description:
      "Draws the one trend line that matters right now — green in an uptrend, orange in a downtrend, grey sideways. Each new swing re-anchors it, a retroactive check rejects any line price already pierced, and it deletes itself the instant the trend breaks. Never a stale line again.",
    icon: "Tl",
    glow: "cyan",
  },
  {
    name: "SR",
    suite: "crewmates",
    tagline: "Strength you can read.",
    description:
      "Clusters confirmed swing pivots into touch-weighted zones, ranked by strength — S×1, S×2… for support, R×1, R×2… for resistance. Support glows green, resistance orange, and the chart erases a level the moment price decisively closes through it.",
    icon: "Sr",
    glow: "teal",
  },
];
