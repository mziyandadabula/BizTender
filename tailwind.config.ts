import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        paper: "#FAFAF7",
        slate: {
          DEFAULT: "#475569",
          light: "#94A3B8",
        },
        seal: {
          DEFAULT: "#A9791F",
          light: "#C9A24A",
          dark: "#7A5714",
        },
        signal: {
          green: "#16803C",
          greenBg: "#EAF6EE",
          amber: "#B45309",
          amberBg: "#FDF3E7",
          red: "#B91C1C",
          redBg: "#FCEAEA",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
