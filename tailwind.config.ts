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
        // Legacy (keep for admin panel)
        gold: "#C9A84C",
        "off-white": "#F5F5F0",
        charcoal: "#1A1A1A",
        // Wilourin design system
        "w-bg":      "#E2E2E2",
        "w-surface": "#CECECE",
        "w-graphite":"#787878",
        "w-dark":    "#1A1A1A",
        "w-forest":  "#1B4332",
        "w-emerald": "#2D6A4F",
        "w-ghost":   "#C6C7D0",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "var(--font-cormorant)", "Georgia", "serif"],
        sans:  ["Inter", "var(--font-inter)", "system-ui", "sans-serif"],
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
