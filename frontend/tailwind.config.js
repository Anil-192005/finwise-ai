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
        navy: {
          950: '#070a13',
          900: '#0b0f19',
          850: '#0f1626',
          800: '#141d33',
          700: '#1e2942',
          600: '#2b3a5c',
        },
        fintech: {
          card: '#111726',
          cardHover: '#161f33',
          border: '#1f293d',
          accent: '#3b82f6',
          income: '#10b981',
          expense: '#f43f5e',
          warning: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
