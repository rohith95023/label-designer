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
        // ── Premium Design System ─────────────────────────────────────
        "primary":                "#6366f1",
        "primary-hover":          "#4f46e5",
        "primary-container":      "#eef2ff",
        "primary-fixed":          "#e0e7ff",
        "primary-fixed-dim":      "#c7d2fe",
        "on-primary":             "#ffffff",
        "on-primary-fixed":       "#312e81",
        "on-primary-fixed-variant":"#4338ca",
        "inverse-primary":        "#a5b4fc",

        // ── Secondary (Violet) ───────────────────────────────────────
        "secondary":              "#8b5cf6",
        "secondary-container":    "#ede9fe",
        "on-secondary":           "#ffffff",
        "on-secondary-container": "#4c1d95",
        "secondary-fixed":        "#ede9fe",
        "secondary-fixed-dim":    "#c4b5fd",
        "on-secondary-fixed":     "#2e1065",
        "on-secondary-fixed-variant":"#6d28d9",

        // ── Accent extras ─────────────────────────────────────────────
        "accent-amber":           "#f59e0b",
        "accent-rose":            "#f43f5e",
        "accent-sky":             "#0ea5e9",
        "accent-emerald":         "#10b981",

        // ── Surfaces ──────────────────────────────────────────────────
        "background":             "#f8fafc",
        "surface":                "#ffffff",
        "surface-bright":         "#ffffff",
        "surface-dim":            "#f1f5f9",
        "surface-variant":        "#f8fafc",
        "surface-container-lowest":"#ffffff",
        "surface-container-low":  "#f8fafc",
        "surface-container":      "#f1f5f9",
        "surface-container-high": "#e2e8f0",
        "surface-container-highest":"#cbd5e1",
        "surface-tint":           "#6366f1",

        // ── Glass Effect Colors ───────────────────────────────────────
        "glass-white":            "rgba(255,255,255,0.6)",
        "glass-border":           "rgba(255,255,255,0.2)",
        "glass-shadow":           "rgba(0,0,0,0.12)",

        // ── On-Surfaces ───────────────────────────────────────────────
        "on-surface":             "#0f172a",
        "on-surface-variant":     "#475569",
        "on-background":          "#0f172a",
        "inverse-surface":        "#1e293b",
        "inverse-on-surface":     "#f8fafc",

        // ── Outline ───────────────────────────────────────────────────
        "outline":                "#94a3b8",
        "outline-variant":        "#e2e8f0",

        // ── Error ─────────────────────────────────────────────────────
        "error":                  "#ef4444",
        "error-container":        "#fef2f2",
        "on-error":               "#ffffff",
        "on-error-container":     "#991b1b",

        // ── Success ───────────────────────────────────────────────────
        "success":                "#10b981",
        "success-container":      "#ecfdf5",
      },

      fontFamily: {
        "headline": ["Inter", "Plus Jakarta Sans", "sans-serif"],
        "body":     ["Inter", "Plus Jakarta Sans", "sans-serif"],
        "label":    ["Inter", "Plus Jakarta Sans", "sans-serif"],
        "inter":    ["Inter", "sans-serif"],
        "display":  ["Inter", "Plus Jakarta Sans", "sans-serif"],
      },

      borderRadius: {
        "sm":      "8px",
        "DEFAULT": "12px",
        "md":      "12px",
        "lg":      "16px",
        "xl":      "20px",
        "2xl":     "24px",
        "3xl":     "32px",
        "full":    "9999px",
      },

      boxShadow: {
        "soft":     "0 8px 30px rgba(0,0,0,0.12)",
        "hover":    "0 12px 40px rgba(0,0,0,0.18)",
        "card":     "0 1px 4px 0 rgba(99,102,241,0.04), 0 4px 16px 0 rgba(99,102,241,0.06)",
        "card-md":  "0 2px 8px 0 rgba(99,102,241,0.06), 0 8px 32px 0 rgba(99,102,241,0.10)",
        "float":    "0 8px 32px 0 rgba(99,102,241,0.14), 0 2px 8px 0 rgba(99,102,241,0.08)",
        "glow":     "0 0 0 3px rgba(99,102,241,0.18), 0 4px 24px 0 rgba(99,102,241,0.22)",
        "glow-sm":  "0 0 0 2px rgba(99,102,241,0.14)",
        "inner-sm": "inset 0 1px 3px 0 rgba(0,0,0,0.06)",
        "glass":    "0 8px 32px 0 rgba(31,38,135,0.15)",
        "glass-hover":"0 12px 40px 0 rgba(31,38,135,0.25)",
        "none":     "none",
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
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-18px)" },
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
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 3px rgba(99,102,241,0.18), 0 4px 24px 0 rgba(99,102,241,0.22)" },
          "50%":      { boxShadow: "0 0 0 5px rgba(99,102,241,0.25), 0 6px 30px 0 rgba(99,102,241,0.30)" },
        },
      },
      animation: {
        "slide-up":    "slideUp 0.45s cubic-bezier(0.19,1,0.22,1) both",
        "slide-down":  "slideDown 0.45s cubic-bezier(0.19,1,0.22,1) both",
        "fade-in":     "fadeIn 0.35s ease both",
        "scale-in":    "scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        "shimmer":     "shimmer 1.6s linear infinite",
        "float":       "floatY 3s ease-in-out infinite",
        "spin-slow":   "spin 3s linear infinite",
        "glow":        "glow 2s ease-in-out infinite",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-premium": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
      },

      backdropBlur: {
        "glass": "20px",
      },
    },
  },
  plugins: [],
}
