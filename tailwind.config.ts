import type { Config } from "tailwindcss";

/**
 * DS Universe — design tokens. DARK (2026-09-20).
 *
 * Tom: every screenshot, box and product guide we ship is a dark chart, so the
 * site now sits on the same dark the charts do. The token NAMES are unchanged
 * (ink = primary text, mist = the alternate section, line = hairlines...) so
 * the skeleton did not move; only their values flipped.
 *
 * How the palette was set (checked, not eyeballed — WCAG 2.2 contrast):
 *  · Ground is a cool graphite, NOT pure black. Pure black against light type
 *    "vibrates" and flattens every layer; the product-guide boards are #111516
 *    and the NinjaTrader chart ~#1C1D1F, so the page sits just under them.
 *  · Depth is shown by LIGHTER surfaces (ground < mist < surface < raised),
 *    the way Material's dark theme does it — shadows barely read on dark, so
 *    they are deepened and only ever support a surface change.
 *  · Type is never pure white: ink #ECEEF1 (16.7:1 on ground), slate #A6ADB8
 *    (8.6:1), mute #7F8793 (5.4:1 on ground, 4.6:1 on raised) — every text
 *    colour clears AA 4.5:1 on every surface it is used on.
 *  · Gold is lifted slightly for dark (#CDA656, 8.5:1). `gold.deep` is the
 *    gold used AS TEXT, so on dark it is the LIGHTER one (#DDBA6E, 10.5:1).
 *    Chips sit on `gold.soft`, a deep bronze, not a pale cream.
 * Everything else on the page is the chart.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#0B0D10", // the page
        mist: "#111417", //   alternate sections, one step up
        wash: "#0F1114", //   the warm sections (a gold glow is added in CSS)
        surface: "#15181C", // cards, chips, list rows
        raised: "#1B1F24", // hover on a surface
        line: "#23272D", //   hairlines
        "line-strong": "#343941",
        ink: "#ECEEF1", //    primary text
        slate: "#A6ADB8", //  secondary text
        mute: "#7F8793", //   tertiary text
        ivory: "#F1EEE7", //  the primary button — light on dark, never pure white
        gold: { DEFAULT: "#CDA656", deep: "#DDBA6E", soft: "#2B2416", tint: "#16130D" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: { wrap: "1200px" },
      letterSpacing: { tightest: "-0.035em" },
      boxShadow: {
        // On dark a shadow is a deepening, not a grey smudge: black, larger,
        // with a hairline of light on the top edge so a surface reads as lifted.
        monitor: "0 50px 100px -30px rgba(0,0,0,0.85), 0 16px 36px -14px rgba(0,0,0,0.7)",
        card: "inset 0 1px 0 rgba(255,255,255,0.035), 0 12px 32px -18px rgba(0,0,0,0.8)",
        lift: "inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 48px -22px rgba(0,0,0,0.9)",
      },
      transitionTimingFunction: { silk: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    },
  },
  plugins: [],
};
export default config;
