/**
 * The three DS Universe brochures shown on the Showcase page.
 * Package names mirror the pricing section: Free, Radars, Systems.
 */

export type BrochureId = "crewmates" | "radars" | "systems";

export type ShowcaseBrochure = {
  id: BrochureId;
  /** Suite wordmark, two-tone: bold + muted. */
  word: string;
  wordMuted: string;
  /** Package name (Free / Radars / Systems). */
  tier: string;
  tierNote: string;
  line: string;
  products: string;
  pages: number;
  /** Pixel size of the rasterized page webps in public/brochures/<id>/. */
  pageW: number;
  pageH: number;
  /** Accent used for the active tab + glow. */
  accent: "teal" | "cyan" | "violet";
};

/** Static page images for a brochure: /brochures/<id>/page-01.webp … */
export function pageImages(b: ShowcaseBrochure): string[] {
  return Array.from(
    { length: b.pages },
    (_, i) => `/brochures/${b.id}/page-${String(i + 1).padStart(2, "0")}.webp`,
  );
}

// Systems leads — it's the flagship and the default shown on the Showcase.
export const SHOWCASE: ShowcaseBrochure[] = [
  {
    id: "systems",
    word: "DS",
    wordMuted: "Systems",
    tier: "Systems",
    tierNote: "The full suite",
    line: "Six instruments. One mind. Precision from orbit.",
    products: "Orbit · Stars · Balance · Ember · Council · Pulse",
    pages: 9,
    pageW: 1224,
    pageH: 1584,
    accent: "violet",
  },
  {
    id: "radars",
    word: "DS",
    wordMuted: "Radars",
    tier: "Radars",
    tierNote: "The radar series",
    line: "Three radars. One read. The tape, decoded live.",
    products: "Pilots · Sweeper · Everguard",
    pages: 7,
    pageW: 1224,
    pageH: 1584,
    accent: "cyan",
  },
  {
    id: "crewmates",
    word: "DS",
    wordMuted: "Crewmates",
    tier: "Free",
    tierNote: "Entry crew · with ads",
    line: "Four hand-built chart tools. A beginner's chart that looks like a pro's.",
    products: "BC · CL · TL · SR",
    pages: 8,
    pageW: 1192,
    pageH: 1684,
    accent: "teal",
  },
];
