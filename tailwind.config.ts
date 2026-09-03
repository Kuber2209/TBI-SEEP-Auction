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
        forest: {
          50: "#eef6f2",
          100: "#d7ebdf",
          200: "#b2d8c3",
          300: "#83c09f",
          400: "#4ea479",
          500: "#1a5c3e", // Primary Brand Forest Green
          600: "#154c33",
          700: "#103b27",
          800: "#0b2a1c",
          900: "#061a11",
        },
        sage: {
          50: "#f7faf8",
          100: "#f0f5f1", // Page Background Soft Sage
          200: "#e2ebe4",
          300: "#cdded1",
        },
        steel: {
          card: "#f9f8f6", // Warm Off-White Card/Panel
          canvas: "#f0f5f1", // Soft Sage Page Background
          muted: "#f1f4f7", // Muted Surface (tables, secondary sections)
          border: "#e2e5ea", // Soft Slate Border
          text: "#33404f", // Primary Text Deep Slate
          secondary: "#6b7a8d", // Secondary Text Slate Gray
          supporting: "#69a64e", // Supporting Green
          destructive: "#f04040", // Destructive Red
        },
        navy: {
          950: "#33404f", // Remapped to Deep Slate
          900: "#f9f8f6", // Remapped to Warm Off-White
          850: "#f1f4f7", // Remapped to Muted Surface
          800: "#e2e5ea", // Remapped to Soft Slate Border
          700: "#6b7a8d", // Remapped to Slate Gray
          600: "#1a5c3e", // Remapped to Forest Green
        },
        gold: {
          300: "#fef3c7",
          400: "#fde68a",
          500: "#1a5c3e", // Remapped gold to forest green primary brand
          600: "#154c33",
          700: "#103b27",
        },
        paper: {
          50: "#f9f8f6",
          100: "#f1f4f7",
          200: "#e2e5ea",
          300: "#cbd5e1",
          canvas: "#f0f5f1",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          '"SF Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.05)",
        panel: "0 1px 3px rgba(0, 0, 0, 0.04)",
        subtle: "0 1px 2px rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        "2xl": "12px", // Restrained maximum radius
        xl: "12px",
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
