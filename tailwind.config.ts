import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sampled directly from the DS Universe emblem + banner.
        space: {
          black: "#050507",
          deep: "#0a0a0f",
          violet: "#7735b0",
          magenta: "#b566d3",
          cyan: "#5fd4e0",
          peach: "#ffb986",
          amber: "#ffd099",
        },
        accent: {
          teal: "#2dd4bf",
        },
        ink: {
          white: "#f2f1f6",
          gray: "#8a8a96",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        label: "0.25em",
        wide2: "0.35em",
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(119, 53, 176, 0.55)",
        "glow-cyan": "0 0 50px -12px rgba(95, 212, 224, 0.45)",
        "glow-teal": "0 0 40px -8px rgba(45, 212, 191, 0.5)",
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        aurora: "var(--aurora)",
        "hero-veil": "var(--hero-veil)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.9" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        // Cinematic, GPU-friendly: only transform/opacity animate.
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(6%, -4%, 0) scale(1.08)" },
        },
        "drift-rev": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1.05)" },
          "50%": { transform: "translate3d(-7%, 5%, 0) scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        orbit: "orbit 18s linear infinite",
        "pulse-slow": "pulse-slow 6s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        drift: "drift 26s ease-in-out infinite",
        "drift-rev": "drift-rev 32s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
