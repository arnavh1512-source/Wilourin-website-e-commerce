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
        // Wilourin brand palette
        brand: {
          background:   '#E8E4DC',
          surface:      '#F5F2ED',
          green:        '#2C5F3E',
          'green-light':'#3D7A52',
          dark:         '#1A1A1A',
          gray:         '#6B6B6B',
          beige:        '#C9B99A',
          white:        '#FFFFFF',
        },
        // w-* aliases → new brand values (keeps all existing components working)
        "w-bg":       '#E8E4DC',
        "w-surface":  '#F5F2ED',
        "w-graphite": '#6B6B6B',
        "w-dark":     '#1A1A1A',
        "w-forest":   '#2C5F3E',
        "w-emerald":  '#3D7A52',
        "w-ghost":    '#C9B99A',
        // legacy
        gold:         "#C9A84C",
        "off-white":  "#F5F5F0",
        charcoal:     "#1A1A1A",
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
