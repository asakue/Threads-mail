/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        vibery: {
          black: '#0D0D0E',
          dark: '#141416',
          surface: '#1D1D1F',
          border: '#2C2C2E',
          slate: '#86868B',
          lightGray: '#F5F5F7',
          blue: '#0071E3',
          accentRed: '#FF453A',
          accentGreen: '#30D158'
        }
      }
    },
  },
  plugins: [],
}
