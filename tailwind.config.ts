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
          600: "#144931",
          700: "#103b27",
          800: "#0b2a1c",
          900: "#061a11",
        },
        sage: {
          50: "#f4f8f5",
          100: "#dfe7e0", // Soothing Matte Sage Canvas
          200: "#d3ded5",
          300: "#cad7cc",
        },
        steel: {
          card: "#eff4f0", // Warm Stone / Parchment Surface
          canvas: "#dfe7e0", // Soothing Matte Sage Canvas
          muted: "#e5ece6", // Muted Surface
          border: "#cad7cc", // Gentle Natural Sage Border
          text: "#203126", // Deep Forest Slate
          secondary: "#56695e", // Sage Slate Gray
          supporting: "#5b9643",
          destructive: "#d93838",
        },
        navy: {
          950: "#203126",
          900: "#eff4f0",
          850: "#e5ece6",
          800: "#cad7cc",
          700: "#56695e",
          600: "#1a5c3e",
        },
        gold: {
          300: "#fef3c7",
          400: "#fde68a",
          500: "#1a5c3e",
          600: "#144931",
          700: "#103b27",
        },
        paper: {
          50: "#eff4f0",
          100: "#e5ece6",
          200: "#cad7cc",
          300: "#b6c7b9",
          canvas: "#dfe7e0",
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
