/**
 * The DS Universe Showcase guides. Each entry is a self-contained interactive
 * HTML guide served from /public/guides/<id>.html and opened in an in-site
 * immersive overlay. Replaces the old static brochure-image scroller (PDF→HTML).
 */

export type GuideId = "systems" | "radars" | "crewmates" | "carepack";

export type ShowcaseGuide = {
  id: GuideId;
  /** Suite wordmark, two-tone: bold + muted. */
  word: string;
  wordMuted: string;
  /** Short badge (Premium / Radars / Free / Exclusive). */
  tier: string;
  tierNote: string;
  /** One-line teaser pulled from the guide. */
  line: string;
  products: string;
  /** Accent used for the card border, glow and active text. */
  accent: "violet" | "cyan" | "teal" | "amber";
  /** The standalone HTML guide to load in the overlay. */
  href: string;
  /** Flags the Carepack as the exclusive, included-free guide. */
  exclusive?: boolean;
};

// Systems leads — it's the flagship and the default shown on the Showcase.
export const GUIDES: ShowcaseGuide[] = [
  {
    id: "systems",
    word: "DS",
    wordMuted: "Systems",
    tier: "Premium",
    tierNote: "The full suite",
    line: "Six instruments. One mind. Precision from orbit.",
    products: "Orbit · Stars · Balance · Ember · Council · Pulse",
    accent: "violet",
    href: "/guides/systems.html",
  },
  {
    id: "radars",
    word: "DS",
    wordMuted: "Radars",
    tier: "Radars",
    tierNote: "The radar series",
    line: "Three radars. One read. The tape, decoded live.",
    products: "Pilots · Sweeper · Everguard",
    accent: "cyan",
    href: "/guides/radars.html",
  },
  {
    id: "crewmates",
    word: "DS",
    wordMuted: "Crewmates",
    tier: "Free",
    tierNote: "Tier 1 · free for everyone",
    line: "Three hand-built chart tools. A beginner's chart that reads like a pro's.",
    products: "BC · TL · SR",
    accent: "teal",
    href: "/guides/crewmates.html",
  },
  {
    id: "carepack",
    word: "DS",
    wordMuted: "Carepack",
    tier: "Exclusive",
    tierNote: "Free with DS Systems · $29.99 value",
    line: "Four finishing tools — the discipline, the math, the markup, and the exclusive DS P&L.",
    products: "Checklist · Risk-Reward · Pen · P&L",
    accent: "amber",
    href: "/guides/carepack.html",
    exclusive: true,
  },
];
