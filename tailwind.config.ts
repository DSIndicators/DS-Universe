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
          black: "#050505",
          deep: "#0c0a07",
          violet: "#8a6a2e", // deep bronze (legacy name)
          magenta: "#c4922f", // deep gold (legacy name)
          cyan: "#f4cd7a", // champagne-gold (legacy name)
          peach: "#ffd9a0",
          amber: "#ffe7b0",
        },
        accent: {
          teal: "#e3b24f", // signature gold (legacy name)
        },
        gold: {
          light: "#ffe7b0",
          DEFAULT: "#e3b24f",
          deep: "#c4922f",
          bronze: "#8a6a2e",
        },
        ink: {
          white: "#f4f0e6",
          gray: "#9a948a",
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
        glow: "0 0 60px -10px rgba(227, 178, 79, 0.55)",
        "glow-cyan": "0 0 50px -12px rgba(244, 205, 122, 0.45)",
        "glow-teal": "0 0 40px -8px rgba(227, 178, 79, 0.5)",
        glass: "inset 0 1px 0 0 rgba(255, 231, 176, 0.1)",
        gold: "0 0 50px -10px rgba(227, 178, 79, 0.5)",
        lift: "0 30px 70px -32px rgba(0,0,0,0.9)",
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
        // Sweeping gold glint across a surface (premium sheen).
        shimmer: {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "250% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55", filter: "brightness(1)" },
          "50%": { opacity: "1", filter: "brightness(1.25)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        orbit: "orbit 18s linear infinite",
        "pulse-slow": "pulse-slow 6s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        drift: "drift 26s ease-in-out infinite",
        "drift-rev": "drift-rev 32s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        "glow-pulse": "glow-pulse 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
