import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Wilourin v3 — cream luxury palette
        brand: {
          background:    '#f4f1ec',
          surface:       '#fafaf7',
          green:         '#115511',
          'green-light': '#1a7a1a',
          dark:          '#0d2818',
          gray:          '#8a8880',
          beige:         '#e8e4d8',
          white:         '#e8e4d8',
          ink:           '#15140f',
        },
        // w-* aliases
        "w-bg":       '#f4f1ec',
        "w-surface":  '#fafaf7',
        "w-graphite": '#8a8880',
        "w-dark":     '#0d2818',
        "w-forest":   '#0d2818',
        "w-emerald":  '#1f4a30',
        "w-ghost":    '#d4d1ca',
        // legacy
        gold:         "#C9A84C",
        "off-white":  "#e8e4d8",
        charcoal:     "#15140f",
      },
      fontFamily: {
        serif:   ["Prata", "var(--font-prata)", "Georgia", "serif"],
        sans:    ["Raleway", "var(--font-raleway)", "system-ui", "sans-serif"],
        prata:   ["Prata", "var(--font-prata)", "Georgia", "serif"],
        raleway: ["Raleway", "var(--font-raleway)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":       "fadeIn 0.3s ease-in-out",
        "slide-up":      "slideUp 0.4s ease-out",
        "slide-right":   "slideRight 0.35s ease-out",
        "slide-left":    "slideLeft 0.35s ease-out",
        "slide-in-left": "slideInLeft 0.5s ease-out",
        shimmer:         "shimmer 1.5s infinite",
        "bounce-once":   "bounceOnce 0.5s ease-out",
        ticker:          "ticker 20s linear infinite",
        "scale-in":      "scaleIn 0.4s ease-out",
        "letter-in":     "letterIn 0.5s ease-out forwards",
        "scroll-down":   "scrollDown 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:      { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:     { from: { transform: "translateY(20px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        slideRight:  { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        slideLeft:   { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        slideInLeft: { from: { transform: "translateX(-100%)", opacity: "0" }, to: { transform: "translateX(0)", opacity: "1" } },
        shimmer:     { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        bounceOnce:  { "0%": { transform: "scale(1)" }, "50%": { transform: "scale(1.3)" }, "100%": { transform: "scale(1)" } },
        ticker:      { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        scaleIn:     { from: { transform: "scale(0.95)", opacity: "0" }, to: { transform: "scale(1)", opacity: "1" } },
        letterIn:    { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scrollDown:  { "0%, 100%": { transform: "translateY(0)", opacity: "1" }, "50%": { transform: "translateY(8px)", opacity: "0.3" } },
      },
      screens: { xs: "375px" },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
