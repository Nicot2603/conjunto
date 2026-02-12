/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'conjunto': {
          verde: '#2D9B4E',
          naranja: '#F5A623',
          gris: '#6B7280',
          marron: '#8B4F4F',
          beige: '#E8DCC8',
          azul: '#4A7BA7',
          azulClaro: '#6B9BD1',
          grisBoton: '#C4C4D4'
        },
        'brand': {
          c1: '#d9ceb2',
          c2: '#948c75',
          c3: '#d5ded9',
          c4: '#7a6a53',
          c5: '#99b2b7'
        }
      },
      fontFamily: {
        'impact': ['Impact', 'Haettenschweiler', 'Arial Black', 'sans-serif']
      }
    },
  },
  plugins: [],
}
