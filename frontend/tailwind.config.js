/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#006d2f",
        "primary-container": "#25d366",
        "surface": "#f6f9ff",
        "on-surface": "#141d24",
        "on-surface-variant": "#3c4a3d",
        "surface-container": "#e6eff9",
        "surface-container-low": "#ebf5ff",
        "surface-container-highest": "#dae3ee",
        "surface-container-lowest": "#ffffff",
        "outline": "#6c7b6b",
        "outline-variant": "#bbcbb9",
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
        'premium': '0 20px 40px rgba(20,29,36,0.06)',
      }
    },
  },
  plugins: [],
}
