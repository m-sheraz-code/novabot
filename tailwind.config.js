/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
       primary: {
        50:  '#e8f9f0',
        100: '#c8f1d8',
        200: '#a3e8be',
        300: '#7dde9f',
        400: '#5cd484',
        500: '#3bca69',
        600: '#30b65d',
        700: '#24994f',
        800: '#187c41',
        900: '#0d5f32',
      },

      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};