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
          950: "#030712", // Deepest void background
          900: "#080E21", // Surface & dark card background
          850: "#0D1838", // Elevated cards / modals
          800: "#13234F", // Borders & subtle highlights
          700: "#1E3A8A", // Interactive hover & secondary buttons
          600: "#2563EB", // Accent blue
        },
        gold: {
          300: "#FDE68A",
          400: "#FCD34D", // Highlight label
          500: "#F59E0B", // Primary action gold
          600: "#D97706", // Accent winning gold
          700: "#B45309",
        },
        seep: {
          sky: "#38BDF8",
          blue: "#0284C7",
          darkblue: "#0369A1",
          amber: "#F59E0B",
          orange: "#EA580C",
        },
        status: {
          upcoming: "#64748B",
          presenting: "#38BDF8",
          bidding: "#10B981",
          paused: "#FBBF24",
          sold: "#F59E0B",
          unsold: "#F43F5E",
          error: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        gold: "0 0 25px -3px rgba(245, 158, 11, 0.4)",
        "gold-lg": "0 0 45px -5px rgba(245, 158, 11, 0.6)",
        emerald: "0 0 25px -3px rgba(16, 185, 129, 0.4)",
        "emerald-lg": "0 0 45px -5px rgba(16, 185, 129, 0.6)",
        blue: "0 0 30px -5px rgba(56, 189, 248, 0.4)",
        card: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-gold": "glowGold 2s ease-in-out infinite alternate",
        "glow-emerald": "glowEmerald 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2.5s infinite linear",
        "float": "float 4s ease-in-out infinite",
      },
      keyframes: {
        glowGold: {
          "0%": { boxShadow: "0 0 15px rgba(245, 158, 11, 0.25)" },
          "100%": { boxShadow: "0 0 35px rgba(245, 158, 11, 0.75)" },
        },
        glowEmerald: {
          "0%": { boxShadow: "0 0 15px rgba(16, 185, 129, 0.25)" },
          "100%": { boxShadow: "0 0 35px rgba(16, 185, 129, 0.75)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
