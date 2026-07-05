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
        "primary": "#006d2f",
        "primary-container": "#25d366",
        "surface": "var(--color-surface)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "surface-container": "var(--color-surface-container)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "outline": "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",
        "whatsapp": {
          light: '#25D366',
          DEFAULT: '#128C7E',
          dark: '#075E54',
        }
      },
      fontFamily: {
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      boxShadow: {
        'premium': '0 20px 40px var(--shadow-premium)',
      }
    },
  },
  plugins: [],
}
