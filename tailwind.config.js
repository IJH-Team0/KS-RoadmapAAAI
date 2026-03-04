/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ijsselheem-donkerblauw': '#25377f',
        'ijsselheem-lichtblauw': '#cbe9fb',
        'ijsselheem-accentblauw': '#a1d9f7',
        'ijsselheem-olijfgroen': '#beb022',
        'ijsselheem-pastelgroen': '#f5f4de',
        'ijsselheem-middenblauw': '#908ebc',
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'Calibri', 'sans-serif'],
      },
      borderRadius: {
        'ijsselheem': '20px',
        'ijsselheem-button': '16px',
      },
    },
  },
  plugins: [],
}
