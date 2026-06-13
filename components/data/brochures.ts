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
  file: string;
  pages: number;
  /** Accent used for the active tab + glow. */
  accent: "teal" | "cyan" | "violet";
};

export const SHOWCASE: ShowcaseBrochure[] = [
  {
    id: "crewmates",
    word: "DS",
    wordMuted: "Crewmates",
    tier: "Free",
    tierNote: "Entry crew · with ads",
    line: "Four hand-built chart tools. A beginner's chart that looks like a pro's.",
    products: "BC · CL · TL · SR",
    file: "/brochures/DS_Crewmate_Series_Brochure.pdf",
    pages: 8,
    accent: "teal",
  },
  {
    id: "radars",
    word: "DS",
    wordMuted: "Radars",
    tier: "Radars",
    tierNote: "The radar series",
    line: "Three radars. One read. The tape, decoded live.",
    products: "Pilots · Sweeper · Everguard",
    file: "/brochures/DS_Radars_Brochure.pdf",
    pages: 7,
    accent: "cyan",
  },
  {
    id: "systems",
    word: "DS",
    wordMuted: "Systems",
    tier: "Systems",
    tierNote: "The full suite",
    line: "Six instruments. One mind. Precision from orbit.",
    products: "Orbit · Stars · Balance · Ember · Council · Pulse",
    file: "/brochures/DS_Systems_Brochure.pdf",
    pages: 9,
    accent: "violet",
  },
];
