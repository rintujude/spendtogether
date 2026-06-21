/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "#E2E8F0",
        background: "#FCF8FA",
        foreground: "#0F172A",
        muted: "#64748B",
        primary: "#0F172A",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#DC2626",
        surface: "#FFFFFF",
        "surface-muted": "#F6F3F5",
        accent: "#6366F1",
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgb(15 23 42 / 0.05), 0 2px 4px -2px rgb(15 23 42 / 0.05)",
        elevated: "0 16px 40px -20px rgb(15 23 42 / 0.35)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
