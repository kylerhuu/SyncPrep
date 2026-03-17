import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "schedule-dark": {
          bg: "#0f1115",
          card: "#151821",
          accent: "#ff7a18",
          "accent-soft": "rgba(255, 122, 24, 0.15)",
        },
      },
      boxShadow: {
        "orange-glow": "0 0 20px rgba(255, 122, 24, 0.4)",
        "orange-glow-lg": "0 0 32px rgba(255, 122, 24, 0.5)",
      },
      keyframes: {
        "hero-glow-shift": {
          "0%, 100%": { opacity: "0.9" },
          "50%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "hero-glow": "hero-glow-shift 8s ease-in-out infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
