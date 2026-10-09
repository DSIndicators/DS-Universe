/**
 * THE SERIES OF ONE, IN FULL (Tom, 2026-10-09: "Use the product sheet to add
 * information to DS Bulk Market Replay to cover dead space").
 *
 * The data utility is the only series with a single product, so its panel
 * (components/Shelf.tsx, the `solo` branch) has the width of five cards and
 * one cover to fill it. What fills it is the product's own copy, taken from
 * DS Universe - Master Product & Pricing Sheet (updated 2026-10-07):
 *   why    — Whop Listings, the opening line
 *   how    — Product Details, "How It Helps Traders", its second sentence
 *   steps  — Product Details, "Full Description": a run, in the order it goes
 *   specs  — Markets ("Site Note", "What It Reads") and the Full Description
 *   close  — Whop Listings, the closing line
 * Nothing here is new claim: change the sheet first, then this file.
 */
export type SoloDetail = {
  why: string;
  how: string;
  stepsHeading: string;
  steps: string[];
  specs: { label: string; value: string }[];
  close: string;
};

const SOLO: Record<string, SoloDetail> = {
  "bulk-replay-downloader": {
    why: "Building a replay library one instrument and one day at a time is an evening's work for a week of data.",
    how: "Give it a list of instruments and a date range and it fetches all of it unattended — then tells you exactly what it got and what it didn't.",
    stepsHeading: "How a run works",
    steps: [
      "Add instruments from the standard selector and tick the ones this run should include.",
      "Set a begin and an end date, and choose whether to skip weekends and the days you already have.",
      "Start it and leave it. A per-file progress list shows every instrument-and-day as it lands.",
      "A truncated file is treated as missing and fetched again, never silently trusted.",
    ],
    specs: [
      { label: "The data", value: "NinjaTrader's own Market Replay files (.nrd), one per instrument and day." },
      { label: "How far back", value: "About the last 90 days. An earlier begin date is moved forward, with a note in the log." },
      { label: "Where it lands", value: "NinjaTrader's own replay folder, so Playback picks it up with no extra step." },
      { label: "Which markets", value: "Whatever NinjaTrader's replay servers carry. Futures days follow the front-month contract by default." },
    ],
    close: "It supplies no data of its own and bypasses no platform limit — it only automates NinjaTrader's own download, in bulk.",
  },
};

export const soloDetailFor = (slug: string): SoloDetail | undefined => SOLO[slug];
