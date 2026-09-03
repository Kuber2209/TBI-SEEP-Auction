import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        surface: {
          DEFAULT: "#0F131D",
          subtle: "#141A27",
          elevated: "#1A2234",
          border: "rgba(255, 255, 255, 0.08)",
          "border-hover": "rgba(255, 255, 255, 0.16)",
        },
        navy: {
          950: "#090A0F", // Base deep surface
          900: "#0F131D", // Card background
          850: "#141A27", // Elevated component
          800: "#1D2538", // Border and separators
          700: "#2B3752", // Interactive hover
          600: "#3B82F6", // Clean accent
        },
        amber: {
          400: "#FBBF24",
          500: "#F59E0B", // Primary gold/amber brand
          600: "#D97706",
        },
        gold: {
          300: "#FDE68A",
          400: "#FCD34D",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          '"SF Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255, 255, 255, 0.07), 0 12px 32px -8px rgba(0, 0, 0, 0.5)",
        panel: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 16px -2px rgba(0, 0, 0, 0.4)",
        dropdown: "0 0 0 1px rgba(255, 255, 255, 0.1), 0 16px 36px -4px rgba(0, 0, 0, 0.6)",
      },
      borderRadius: {
        "2xl": "16px",
        xl: "12px",
        lg: "8px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
