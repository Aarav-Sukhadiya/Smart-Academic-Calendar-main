/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        notion: {
          bg: '#191919',
          sidebar: '#202020',
          border: '#2f2f2f',
          text: '#d4d4d4',
          muted: '#808080',
          hover: '#2c2c2c',
          active: '#333333',
          blue: '#2383e2',
        }
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.2s linear infinite',
      },
    },
  },
  plugins: [],
}
