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
    fig: "v3.1",
    figLine: "the current release",
    title: "Consistently updated for the current market",
    short: "Reworked as the market moves, at no extra cost",
    body: "Markets change, so the suite does too. v3.1 rebuilt the labels and colors of every tool, pinned the DS GEX map to the last session close and added two new indicators. Members get every update and every new tool at no extra cost.",
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

/** What v3.1 brought, from the release post (customer words, no internals). */
export const LATEST = {
  version: "v3.1",
  items: [
    "DS Compass and DS Data Candles are new in the Essentials Vault",
    "One label style across the suite, with a name in front of every value",
    "One price-tag column by the axis, shared by every DS tool",
    "DS GEX builds its map from the last session close, so it is the same whenever you open NinjaTrader",
    "DS ASL, DS Iceberg, DS Flow and DS Volume draw on exactly the right bars on tick, range, volume and Renko charts",
    "In the Free Vault: DS VWAP moves onto the price chart and DS Volume is new",
  ],
};
