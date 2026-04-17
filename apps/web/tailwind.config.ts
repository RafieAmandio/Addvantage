import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Slate ink — page + surfaces
        ink: {
          DEFAULT: "#202832",
          2: "#383E47",
          3: "#4A5160",
          4: "#5A6273",
        },
        // Paper — light text
        paper: {
          DEFAULT: "#EEEEEE",
          2: "#D6D6D6",
          3: "#B8B8B8",
        },
        // Lime — DOMAIN brand accent (hero CTAs, logo, ALL highlights)
        lime: {
          DEFAULT: "#61C933",
          dim: "#4FA826",
          deep: "#357019",
        },
        // Status
        blood: "#991B1B",
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
        ticker: "ticker 60s linear infinite",
        scan: "scan 6s linear infinite",
        revealUp: "revealUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
