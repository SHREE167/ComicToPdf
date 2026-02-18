/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#050505',
        'cyber-gray': '#121212',
        'cyber-dark': '#0a0a0a',
        'neon-blue': '#00f3ff',
        'neon-silver': '#e0e0e0',
        'neon-purple': '#bc13fe',
        'neon-green': '#0aff0a',
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00f3ff, 0 0 10px #00f3ff',
        'neon-silver': '0 0 5px #e0e0e0, 0 0 10px #e0e0e0',
        'neon-purple': '0 0 5px #bc13fe, 0 0 10px #bc13fe',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
}