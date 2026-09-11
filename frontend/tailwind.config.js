/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "nav-command": "#0B1220",
        "bg-canvas": "#F6F8FB",
        "surface-main": "#FFFFFF",
        "deep-navy": "#111827",
        "primary": "#004ac6",
        "primary-container": "#2563eb",
        "secondary": "#0058be",
        "secondary-container": "#2170e4",
        "status-success": "#16A34A",
        "status-warning": "#F59E0B",
        "status-critical": "#DC2626",
        "ai-intelligence": "#7C3AED",
        "status-info": "#0EA5E9",
        "text-secondary": "#64748B",
        "text-muted": "#94A3B8",
        "border-subtle": "#E2E8F0",
        "surface-container": "#e9edff",
        "surface-container-low": "#f1f3ff",
        "surface-container-high": "#e1e8fd",
        "error-container": "#ffdad6",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
