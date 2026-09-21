/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8f6',
          100: '#d5efe9',
          200: '#abe0d4',
          300: '#79c9b8',
          400: '#4aab97',
          500: '#2f8f7c',
          600: '#247365',
          700: '#205c52',
          800: '#1d4a43',
          900: '#1a3e39',
          950: '#0c2421',
        },
        ink: {
          50: '#f4f6f7',
          100: '#e3e8ea',
          200: '#c9d3d7',
          300: '#a3b3ba',
          400: '#768d97',
          500: '#5b727c',
          600: '#4e5f69',
          700: '#435057',
          800: '#3b454b',
          900: '#343c41',
          950: '#21272b',
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(33 39 43 / 0.06), 0 8px 24px rgb(33 39 43 / 0.06)',
      },
    },
  },
  plugins: [],
};
