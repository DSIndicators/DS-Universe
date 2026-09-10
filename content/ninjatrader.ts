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

/**
 * Tom's NinjaTrader affiliate link (given 2026-09-09). This is the ONLY place
 * it is written down — every NinjaTrader logo, text link and CTA on the site
 * reads it from here. Change it here and it changes everywhere; never paste the
 * URL into a component.
 */
const AFFILIATE = "https://ninjatraderus.pxf.io/c/7730005/3067403/37538";

/**
 * Send a click through the affiliate link but land it on a specific page.
 * Impact's `?u=` deep-link parameter, VERIFIED 2026-09-10 by following one:
 * it arrives at the requested page carrying irpid=7730005, irgwc=1 and afsrc=1,
 * so the click is credited. Without this, every text link in the vendor copy
 * went straight to ninjatrader.com and earned nothing.
 */
const via = (url: string) => `${AFFILIATE}?u=${encodeURIComponent(url)}`;

export const NT_LINKS = {
  /** The bare affiliate link — logos and the platform bar. */
  partner: AFFILIATE,

  /**
   * TEXT-LINK TARGETS. The vendor kit (NinjaTrader_Text_with_Links_2023) names
   * ninjatrader.com/GetStarted and ninjatrader.com/Simulate, and BOTH NOW 404
   * — checked 2026-09-10, they return NinjaTrader's own "Page Not Found".
   * The kit is from 2023 and their site has been restructured since.
   *
   * The anchor text is unchanged and still verbatim from the kit; only the
   * href moves, to the current live page for the same content. Shipping a link
   * that dead-ends is worse than deviating from a stale kit — and it is our
   * page the visitor is on when it happens. Worth telling the vendor rep.
   */
  home: via("https://ninjatrader.com/"),
  /** was /GetStarted — anchor text is "trading platform" */
  getStarted: via("https://ninjatrader.com/trading-platform/"),
  /** was /Simulate — anchor text is "trading simulator" */
  simulator: via("https://ninjatrader.com/trading-platform/trading-simulator/"),

  /** Kinetick targets from Kinetick_Text_with_Links + the vendor email. */
  kinetick: "https://kinetick.com/NinjaTrader",
  kinetickHome: "https://kinetick.com",
};

export const NT_ASSETS = {
  wordmark: "/brand/nt/ninjatrader-wordmark.png", // 2376×300, official color RGB wordmark
  /**
   * NinjaTrader's own desktop render, copied at native size with its
   * transparency intact — 510×531 is small, so it is never shown wider than
   * ~260px and stays sharp on a 2x screen. The old 500×465 asset it replaced
   * was 8-bit indexed and was being blown up past twice its size.
   *
   * An AI-upscaled version of this file was offered and rejected (2026-09-10):
   * the upscaler invented every menu label, DOM row and axis figure. Showing
   * NinjaTrader a fabricated rendition of their own interface is exactly the
   * "material misstatement of fact" their guidelines forbid.
   */
  desktop: "/brand/nt/ninjatrader-desktop.png", // 510×531, official, transparent
  monitor: "/brand/nt/ninjatrader-monitor.png", // 500×465, superseded by `desktop`
  /**
   * The NinjaTrader mobile app, two handsets, from NinjaTrader's own platform
   * page (1400×1133). It replaced the desktop monitor in both places it was
   * shown: that asset is 500px wide and 8-bit indexed, so it was being blown up
   * past twice its size and banding badly. This one is sharp at any size we
   * use, and the site's hero already carries the desktop platform on rotation —
   * so the mobile app is the part a visitor had not been shown.
   */
  mobile: "/brand/nt/ninjatrader-mobile.png", // 1500×1216, official mobile app image, background keyed to transparent
  kinetick: "/brand/nt/kinetick-logo.png", // 400×100, official Kinetick logo
};

/** The bullet list under "Download NinjaTrader" — verbatim from the kit. */
export const NT_FREE_ACCESS = [
  "Real-time futures data",
  "Advanced charting",
  "Trade simulator",
  "Strategy development and backtesting",
];
