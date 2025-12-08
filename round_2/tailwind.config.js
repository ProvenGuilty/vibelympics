/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#ffffff',
          dark: '#0f172a',
        },
        card: {
          light: '#f8fafc',
          dark: '#1e293b',
        },
      },
    },
  },
  plugins: [],
}
