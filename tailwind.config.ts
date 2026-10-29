import type { Config } from "tailwindcss";

/**
 * The white wide-body site. Tailwind supplies the reset only; the design lives
 * in app/globals.css as named tokens and classes, so one place sets the scale.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
