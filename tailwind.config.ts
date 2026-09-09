import type { Config } from "tailwindcss";

/**
 * DS Universe — design tokens.
 * White ground, one restrained gold accent, cool greys for type.
 * Everything else on the page is the chart.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#FFFFFF",
        mist: "#F7F7F9",      // section alternation, cards
        wash: "#FBF8F1",      // the warm hero wash (gold at 3%)
        line: "#E7E8EC",
        "line-strong": "#D6D8DE",
        ink: "#14161A",
        slate: "#5C6370",
        mute: "#8A909B",
        gold: { DEFAULT: "#C39B45", deep: "#A8822F", soft: "#F4EBD6", tint: "#FAF5E8" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: { wrap: "1200px" },
      letterSpacing: { tightest: "-0.035em" },
      boxShadow: {
        monitor: "0 40px 80px -30px rgba(20,22,26,0.28), 0 12px 28px -12px rgba(20,22,26,0.18)",
        card: "0 1px 2px rgba(20,22,26,0.04), 0 8px 24px -16px rgba(20,22,26,0.12)",
        lift: "0 2px 4px rgba(20,22,26,0.05), 0 20px 40px -20px rgba(20,22,26,0.18)",
      },
      transitionTimingFunction: { silk: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    },
  },
  plugins: [],
};
export default config;
