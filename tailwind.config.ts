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
          950: "#040817", // Main deepest background
          900: "#0A1128", // Surface & card background
          850: "#0D1838", // Elevated cards / modals
          800: "#001F54", // Borders & subtle highlights
          700: "#034078", // Interactive hover & secondary buttons
          600: "#1282A2", // Accent cyan-blue
        },
        gold: {
          300: "#FFE8A3",
          400: "#FFD166", // Highlight label
          500: "#FFB703", // Primary action gold
          600: "#FB8500", // Accent winning gold
          700: "#D46B08",
        },
        seep: {
          sky: "#8ECAE6",
          blue: "#219EBC",
          darkblue: "#023047",
          amber: "#FFB703",
          orange: "#FB8500",
        },
        status: {
          upcoming: "#64748B",
          presenting: "#3A86FF",
          bidding: "#06D6A0",
          paused: "#FFD166",
          sold: "#FFB703",
          unsold: "#EF476F",
          error: "#E63946",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 25px -5px rgba(255, 183, 3, 0.35)",
        "gold-lg": "0 0 40px -10px rgba(255, 183, 3, 0.55)",
        blue: "0 0 25px -5px rgba(58, 134, 255, 0.35)",
        card: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-gold": "glowGold 2s ease-in-out infinite alternate",
        "glow-green": "glowGreen 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glowGold: {
          "0%": { boxShadow: "0 0 10px rgba(255, 183, 3, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(255, 183, 3, 0.7)" },
        },
        glowGreen: {
          "0%": { boxShadow: "0 0 10px rgba(6, 214, 160, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(6, 214, 160, 0.7)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
