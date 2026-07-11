/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        sidebar: "var(--color-sidebar)",
        surface: "var(--color-surface)",
        "surface-active": "var(--color-surface-active)",
        "surface-hover": "var(--color-surface-hover)",
        line: "var(--color-border)",
        ink: "var(--color-text)",
        "ink-muted": "var(--color-text-muted)",
        income: "var(--color-income)",
        expense: "var(--color-expense)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-soft": "var(--color-primary-soft)",
        link: "var(--color-link)",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        body: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
