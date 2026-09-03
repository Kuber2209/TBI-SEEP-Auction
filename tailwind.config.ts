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
        navy: {
          950: "#030712", // Deepest void midnight navy from original image
          900: "#070D1E", // Rich midnight card surface
          850: "#0D1838", // Elevated surface
          800: "#13234F", // Midnight border & dividers
          700: "#1E3A8A", // Subtle highlight blue
          600: "#2563EB", // Accent blue
        },
        gold: {
          300: "#FDE68A",
          400: "#FCD34D",
          500: "#F59E0B", // Primary warm saffron gold from original image
          600: "#D97706",
          700: "#B45309",
        },
        paper: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          canvas: "#ECEFF4", // Soft, low-glare light canvas (not blinding white)
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
        card: "0 0 0 1px rgba(19, 35, 79, 0.6), 0 8px 24px -4px rgba(0, 0, 0, 0.5)",
        panel: "0 0 0 1px rgba(19, 35, 79, 0.5), 0 4px 16px -2px rgba(0, 0, 0, 0.4)",
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
