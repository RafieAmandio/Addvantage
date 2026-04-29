import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Orange — DOMAIN brand accent (CTAs, highlights, active states)
        brand: {
          DEFAULT: "#FFD400",
          dim: "#E6C000",
          deep: "#CCAF00",
        },
        // Black — page backgrounds
        black: {
          DEFAULT: "#111111",
          2: "#1A1A1A",
          3: "#222222",
        },
        // Gray — elevated surfaces, cards, inputs
        gray: {
          DEFAULT: "#1F1F1F",
          2: "#2A2A2A",
          3: "#333333",
          4: "#444444",
        },
        // White — primary text
        white: {
          DEFAULT: "#EEEEEE",
          2: "#D6D6D6",
          3: "#B8B8B8",
        },
        // Status colors
        blood: {
          DEFAULT: "#991B1B",
          bright: "#E03C3C",
          text: "#fda4af",
        },
        moss: "#65A30D",
        steel: "#6B7280",
        wire: "#383E47",
      },
      fontFamily: {
        display: ['"Inter"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"Intel One Mono"', "ui-monospace", "monospace"],
        serif: ['"Fraunces"', "Georgia", "serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        widest2: "0.18em",
      },
      borderRadius: {
        none: "0",
        sm: "1px",
        DEFAULT: "2px",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "4%": { opacity: "0.2" },
          "6%": { opacity: "1" },
          "8%": { opacity: "0.4" },
          "9%": { opacity: "1" },
          "50%": { opacity: "1" },
          "52%": { opacity: "0.1" },
          "53%": { opacity: "0.7" },
          "54%": { opacity: "0.2" },
          "55%": { opacity: "1" },
          "80%": { opacity: "1" },
          "81%": { opacity: "0.3" },
          "82%": { opacity: "1" },
        },
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        revealUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        blink: "blink 1.1s steps(1) infinite",
        flicker: "flicker 4s ease-in-out infinite",
        ticker: "ticker 60s linear infinite",
        scan: "scan 6s linear infinite",
        revealUp: "revealUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
