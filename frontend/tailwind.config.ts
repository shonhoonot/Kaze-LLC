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
        // single accent — a muted Japanese vermilion
        accent: {
          DEFAULT: "#D9482F",
          dark: "#B83A24",
          light: "#F6E7E3",
        },
        ink: "#1A1A1A",
        muted: "#6B6B6B",
        line: "#EAEAEA",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        app: "1100px",
      },
    },
  },
  plugins: [],
};

export default config;
