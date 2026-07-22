/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "hsl(var(--bg-primary))",
          secondary: "hsl(var(--bg-secondary))",
          surface: "hsl(var(--bg-surface))",
          elevated: "hsl(var(--bg-elevated))",
        },
        border: {
          subtle: "hsl(var(--border-subtle))",
          strong: "hsl(var(--border-strong))",
          DEFAULT: "hsl(var(--border-subtle))",
        },
        text: {
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          muted: "hsl(var(--text-muted))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand-primary))",
          hover: "hsl(var(--brand-primary-hover))",
          from: "hsl(var(--brand-gradient-start))",
          to: "hsl(var(--brand-gradient-end))",
        },
        success: "hsl(var(--accent-success))",
        warning: "hsl(var(--accent-warning))",
        danger: "hsl(var(--accent-danger))",
        info: "hsl(var(--accent-info))",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        glow: "0 8px 30px -8px hsl(var(--brand-primary) / 0.45)",
        card: "0 8px 24px -4px rgb(0 0 0 / 0.06)",
        "card-dark": "0 8px 24px -4px rgb(0 0 0 / 0.4)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, hsl(var(--brand-gradient-start)), hsl(var(--brand-gradient-end)))",
        "mesh-glow":
          "radial-gradient(circle at 20% 20%, hsl(var(--brand-gradient-start) / 0.25), transparent 40%), radial-gradient(circle at 80% 0%, hsl(var(--brand-gradient-end) / 0.2), transparent 40%)",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
