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
          DEFAULT: "#0A0A0A",
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
        // Revamp surfaces (Kalshi-dark ladder, neutral black)
        panel: "#121212",
        raised: "#1A1A1A",
        // Direction only: never brand
        up: "#00DD94",
        down: "#FF454D",
        moss: "#00DD94",
        steel: "#6B7280",
        wire: "#383E47",
        // TradeVantage Paper desk brand (marketing pages only, see features/marketing/landing.css)
        tv: {
          paper: "#F4F3EF",
          white: "#FFFFFF",
          stone: "#D9D8D3",
          graphite: "#3A3C40",
          ink: "#111214",
          desk: "#0E0F11",
          signal: "#FFD400",
          panel: "#16171A",
          line: "#26282C",
          soft: "#1D1E22",
          mute: "#6B6D72",
          mutedesk: "#8A8C91",
          up: "#4E9F6E",
          down: "#E06A5E",
          uppaper: "#1F7A4A",
          downpaper: "#B33A30",
          shadow: "#E4E3DE",
        },
      },
      fontFamily: {
        display: ['"Geist"', '"Inter"', "system-ui", "sans-serif"],
        sans: ['"Geist"', '"Inter"', "system-ui", "sans-serif"],
        // Condensed numerals + page titles
        num: ['"Barlow Condensed"', '"Roboto Condensed"', '"Arial Narrow"', "sans-serif"],
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
