/**
 * The NinjaTrader Ecosystem page (/ninjatrader).
 *
 * The section copy on that page is VERBATIM from the NinjaTrader vendor kit
 * ("Landing-Page-Text-Images", NinjaTrader_Text_with_Links + Landing-Page-Sample-Layout)
 * and must not be reworded — NinjaTrader supplies it and reviews vendor sites
 * against it. Only the link targets and assets live here.
 *
 * Per the vendor kit email:
 *  - the NinjaTrader logo links to the partner URL below
 *  - the Kinetick logo links to kinetick.com/NinjaTrader
 * Text links inside the copy use the targets from the "Text_with_Links" docs.
 */

export const NT_LINKS = {
  /** NinjaTrader-issued partner link — use for the NinjaTrader logo and the main CTA. */
  partner: "https://ninjatraderus.pxf.io/L0yA73",
  /** Text-link targets from NinjaTrader_Text_with_Links. */
  home: "https://ninjatrader.com",
  getStarted: "https://ninjatrader.com/GetStarted",
  simulator: "https://ninjatrader.com/Simulate",
  /** Kinetick targets from Kinetick_Text_with_Links + the vendor email. */
  kinetick: "https://kinetick.com/NinjaTrader",
  kinetickHome: "https://kinetick.com",
};

export const NT_ASSETS = {
  wordmark: "/brand/nt/ninjatrader-wordmark.png", // 2376×300, official color RGB wordmark
  monitor: "/brand/nt/ninjatrader-monitor.png", // 500×465, official platform monitor image
  kinetick: "/brand/nt/kinetick-logo.png", // 400×100, official Kinetick logo
};

/** The bullet list under "Download NinjaTrader" — verbatim from the kit. */
export const NT_FREE_ACCESS = [
  "Real-time futures data",
  "Advanced charting",
  "Trade simulator",
  "Strategy development and backtesting",
];
