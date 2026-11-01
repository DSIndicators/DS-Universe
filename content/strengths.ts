/**
 * WHAT DS UNIVERSE IS GOOD AT, in one place (Tom, 2026-10-31: highlight our strong
 * suits, "Consistently updated for the current market", and the multiple
 * lag-reducing optimization passes each release goes through before it ships).
 * Used on the home page and beside the sign-up form.
 *
 * Every figure is from the v3.1 record (DS Test Lab\_lag 2026-10-29; the v3.1
 * release post): measured on a NinjaTrader chart running the whole suite. Keep it
 * to what was measured - no speed or results promises beyond it.
 */
export const STRENGTHS = [
  {
    key: "current",
    fig: "v3.2",
    figLine: "the current release",
    title: "Consistently updated for the current market",
    short: "Reworked as the market moves, at no extra cost",
    body: "Markets change, so the suite does too. v3.2 put every tool on one label style and one set of plain-worded settings, pinned the DS GEX map to the last session close and added new tools to both vaults. Members get every update and every new tool at no extra cost.",
  },
  {
    key: "speed",
    fig: "0.5x",
    figLine: "DS Flow's draw time against NinjaTrader's own candles, down from 2.4x",
    title: "Optimized for speed before every release",
    short: "Several lag-reducing passes before anything ships",
    body: "Each release goes through several lag-reducing passes before it ships. On our test chart running the whole suite, every DS tool measured below NinjaTrader's own candles in draw time, and labels are now laid out once instead of on every frame.",
  },
  {
    key: "together",
    fig: "1",
    figLine: "shared price-tag column for every tool on the chart",
    title: "Built to share one chart",
    short: "One look, one tag column, one license",
    body: "Load as many as you like: every DS tool reads in the same colors and label style, and their price tags share one column by the axis, stepping aside for each other instead of overlapping. Tick, range, volume and Renko charts draw on exactly the right bars.",
  },
] as const;

/** What v3.2 brought (with v3.1 before it), from the release posts (customer words, no internals). Updated 2026-11-01. */
export const LATEST = {
  version: "v3.2",
  items: [
    "DS Compass and DS Ember are new in the Essentials Vault",
    "The Free Vault is back, in a folder of its own, with DS HTF PO3 new in it",
    "One label style and one Label size across the suite, with a name in front of every value",
    "Every setting explained in plain words in the Properties window, every opacity a simple percent",
    "DS GEX builds its map from the last session close, so it is the same whenever you open NinjaTrader",
    "New guides for every tool, opening with the Properties window exactly as NinjaTrader shows it",
  ],
};
