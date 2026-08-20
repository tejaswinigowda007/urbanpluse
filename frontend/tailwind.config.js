/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
        brand: {
          blue: '#2563eb',
          'blue-dark': '#1d4ed8',
          orange: '#f97316',
          'orange-dark': '#ea580c',
        }
      }
    },
  },
  plugins: [],
}
