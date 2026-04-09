/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        doom: {
          bg: '#0D0A06',
          card: '#141009',
          cardHover: '#1C160C',
          border: '#2A200E',
          amber: '#F5A623',
          amberDim: '#C4831A',
          gold: '#E8C87A',
          text: '#F0EBE0',
          muted: '#8A7D68',
          red: '#E05252',
          green: '#4CAF7D',
        },
      },
    },
  },
  plugins: [],
}

