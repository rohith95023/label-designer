/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Primary (Indigo-Blue) ─────────────────────────────────────
        "primary":                "#2563EB",
        "primary-hover":          "#1D4ED8",
        "primary-container":      "#1976d2",
        "primary-fixed":          "#DBEAFE",
        "primary-fixed-dim":      "#BFDBFE",
        "on-primary":             "#ffffff",
        "on-primary-fixed":       "#1E3A8A",
        "on-primary-fixed-variant":"#1E40AF",
        "inverse-primary":        "#93C5FD",

        // ── Secondary (Emerald) ───────────────────────────────────────
        "secondary":              "#059669",
        "secondary-container":    "#A7F3D0",
        "on-secondary":           "#ffffff",
        "on-secondary-container": "#064E3B",
        "secondary-fixed":        "#A7F3D0",
        "secondary-fixed-dim":    "#6EE7B7",
        "on-secondary-fixed":     "#022C22",
        "on-secondary-fixed-variant":"#047857",

        // ── Tertiary (Violet) ─────────────────────────────────────────
        "tertiary":               "#7C3AED",
        "tertiary-container":     "#DDD6FE",
        "on-tertiary":            "#ffffff",
        "on-tertiary-container":  "#4C1D95",
        "tertiary-fixed":         "#EDE9FE",
        "tertiary-fixed-dim":     "#C4B5FD",
        "on-tertiary-fixed":      "#2E1065",
        "on-tertiary-fixed-variant":"#5B21B6",

        // ── Accent extras ─────────────────────────────────────────────
        "accent-amber":           "#F59E0B",
        "accent-rose":            "#F43F5E",
        "accent-sky":             "#0EA5E9",

        // ── Surfaces ──────────────────────────────────────────────────
        "background":             "#F1F5FF",
        "surface":                "#F5F7FF",
        "surface-bright":         "#FAFBFF",
        "surface-dim":            "#DDE1F0",
        "surface-variant":        "#E4E8F5",
        "surface-container-lowest":"#ffffff",
        "surface-container-low":  "#EEF1FB",
        "surface-container":      "#E8ECF8",
        "surface-container-high": "#E1E6F4",
        "surface-container-highest":"#DAE0EF",
        "surface-tint":           "#2563EB",

        // ── On-Surfaces ───────────────────────────────────────────────
        "on-surface":             "#1A1D2E",
        "on-surface-variant":     "#44475E",
        "on-background":          "#1A1D2E",
        "inverse-surface":        "#2E3047",
        "inverse-on-surface":     "#EEF0FF",

        // ── Outline ───────────────────────────────────────────────────
        "outline":                "#757897",
        "outline-variant":        "#C4C7E0",

        // ── Error ─────────────────────────────────────────────────────
        "error":                  "#DC2626",
        "error-container":        "#FEE2E2",
        "on-error":               "#ffffff",
        "on-error-container":     "#7F1D1D",
      },

      fontFamily: {
        "headline": ["Inter", "sans-serif"],
        "body":     ["Inter", "sans-serif"],
        "label":    ["Inter", "sans-serif"],
        "inter":    ["Inter", "sans-serif"],
        "display":  ["Inter", "sans-serif"],
      },

      borderRadius: {
        "sm":      "6px",
        "DEFAULT": "10px",
        "md":      "12px",
        "lg":      "16px",
        "xl":      "20px",
        "2xl":     "24px",
        "3xl":     "32px",
        "full":    "9999px",
      },

      boxShadow: {
        "card":    "0 1px 4px 0 rgba(37,99,235,0.04), 0 4px 16px 0 rgba(37,99,235,0.06)",
        "card-md": "0 2px 8px 0 rgba(37,99,235,0.06), 0 8px 32px 0 rgba(37,99,235,0.10)",
        "float":   "0 8px 32px 0 rgba(37,99,235,0.14), 0 2px 8px 0 rgba(37,99,235,0.08)",
        "glow":    "0 0 0 3px rgba(37,99,235,0.18), 0 4px 24px 0 rgba(37,99,235,0.22)",
        "glow-sm": "0 0 0 2px rgba(37,99,235,0.14)",
        "inner-sm":"inset 0 1px 3px 0 rgba(0,0,0,0.06)",
        "none":    "none",
      },

      transitionTimingFunction: {
        "spring":     "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth":     "cubic-bezier(0.4, 0, 0.2, 1)",
        "swift":      "cubic-bezier(0.55, 0, 0.1, 1)",
        "out-expo":   "cubic-bezier(0.19, 1, 0.22, 1)",
      },

      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
        "600": "600ms",
      },

      keyframes: {
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        spin: {
          "from": { transform: "rotate(0deg)" },
          "to":   { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "slide-up":    "slideUp 0.45s cubic-bezier(0.19,1,0.22,1) both",
        "fade-in":     "fadeIn 0.35s ease both",
        "scale-in":    "scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        "shimmer":     "shimmer 1.6s linear infinite",
        "float":       "floatY 3s ease-in-out infinite",
        "spin-slow":   "spin 3s linear infinite",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
}
