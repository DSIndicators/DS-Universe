/**
 * Product copy sourced from the official DS Radars + DS Systems brochures.
 * Nine indicators across two suites. Edit here to update every card on the site.
 *
 * NOTE: PULSE has no dedicated brochure page yet — only the one-line description
 * "hears the order flow". Copy below is a faithful expansion of that line.
 * // TODO: replace PULSE copy once a PULSE brochure page exists.
 */

export type Suite = "radars" | "systems";

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
  glow: "violet" | "cyan" | "teal";
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
  },
  {
    name: "SWEEPER",
    codename: "Hunta",
    suite: "radars",
    tagline: "The trap hunter.",
    description:
      "Watches for the moves that fool everyone else — sweeps, absorption, fake breakouts and weak continuations. A Threat Index and Conviction bar quantify the danger so you see the trap before it springs, and know when strength is really fatigue.",
    icon: "Crosshair",
    glow: "cyan",
  },
  {
    name: "EVERGUARD",
    suite: "radars",
    tagline: "Integrity & conviction.",
    description:
      "Grades trust. Scores Signal Integrity and Candle Conviction in real time, then lines up strength from the 1-minute to the 4-hour so you see whether the whole board agrees. It answers the only question that matters: can I trust this move?",
    icon: "ShieldCheck",
    glow: "violet",
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
    glow: "teal",
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
    suite: "systems",
    tagline: "Order flow.",
    description:
      "Hears the order flow beneath the tape — the live read of pressure feeding the Registry, so every other system speaks from the same heartbeat of the market.",
    icon: "AudioLines",
    glow: "cyan",
  },
];
