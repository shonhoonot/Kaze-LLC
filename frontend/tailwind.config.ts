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
        accent: {
          DEFAULT: "#7C3AED",
          dark: "#4C1D95",
          light: "#F5EDFF",
        },
        ink: "#1C1C1E",
        muted: "#6C6C76",
        line: "#DED7C8",
        paper: {
          50: "#FAF8F3",
          100: "#F4F1EA",
          200: "#ECE7DC",
          300: "#DED7C8",
        },
        violet: {
          50: "#F5EDFF",
          100: "#EADBFF",
          300: "#C9A6FF",
          500: "#A259FF",
          600: "#8B3DF0",
          700: "#7C3AED",
          900: "#4C1D95",
        },
        cyan: {
          100: "#D6F6F9",
          500: "#2CD4E1",
          600: "#12AEBC",
          700: "#0C8A95",
        },
        charcoal: {
          700: "#2F2F35",
          800: "#242428",
          900: "#1C1C1E",
        },
      },
      fontFamily: {
        sans: ["Noto Sans", "Noto Sans JP", "system-ui", "sans-serif"],
        head: ["Noto Sans JP", "Noto Sans", "system-ui", "sans-serif"],
        jp:   ["Noto Sans JP", "sans-serif"],
      },
      maxWidth: {
        app: "1120px",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
      },
    },
  },
  plugins: [],
};

export default config;
