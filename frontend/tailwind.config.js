/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "#E2E8F0",
        background: "#F8FAFC",
        foreground: "#0F172A",
        muted: "#64748B",
        primary: "#2563EB",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
      borderRadius: {
        xl: "16px",
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 23, 42, 0.05)",
      },
    },
  },
  plugins: [],
};
