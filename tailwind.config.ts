import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f5f1e8",
        "paper-light": "#fdfbf6",
        "paper-mid": "#ede8da",
        "paper-dark": "#e3ddd0",
        ink: "#142033",
        "ink-muted": "#3d4a5c",
        "ledger-green": "#1f3b2d",
        "green-muted": "#dce7dd",
        rust: "#a33b20",
        "rust-light": "#f8eee5",
        "rust-mid": "#f0ddd4",
        rule: "#d8d1c4",
        muted: "#687071",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "'SF Mono'", "Menlo", "monospace"],
      },
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "18": "4.5rem",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};

export default config;
