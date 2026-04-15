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
        // Warm near-black ink
        ink: {
          DEFAULT: "#0A0908",
          2: "#14110F",
          3: "#1F1A15",
          4: "#2A231C",
        },
        // Warm cream paper
        paper: {
          DEFAULT: "#F5F1E8",
          2: "#E8E2D0",
          3: "#D4CCB4",
        },
        // Amber — DOMAIN flag color
        amber: {
          DEFAULT: "#F59E0B",
          dim: "#B45309",
          deep: "#7C2D12",
        },
        // Status
        blood: "#991B1B",
        moss: "#65A30D",
        steel: "#6B7280",
        wire: "#1F1A15",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
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
