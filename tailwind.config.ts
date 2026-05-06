import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F4F1EA",
        ink: "#1A1A1A",
        clay: "#B23A48",
        ochre: "#C97B2A",
        forest: "#2D5F3F",
        teal: {
          bg: "#D6E6DD",
          border: "#9CC0AC",
          text: "#2D5F3F",
        },
        amber: {
          bg: "#F5E2C2",
          border: "#D4A977",
          text: "#8C5A1F",
        },
        lavender: {
          bg: "#E5E1F1",
          border: "#A89FD4",
          text: "#4A3F7C",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        sans: ['"Inter"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
