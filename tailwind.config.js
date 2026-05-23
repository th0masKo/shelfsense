/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Target components/ and app/ directories
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#1D9E75',
          amber: '#BA7517',
          red: '#A32D2D',
          blue: '#2F5FA0',
        },
        background: {
          primary: '#FAFAF8',
          secondary: '#F1EFE8',
        },
        text: {
          primary: '#2C2C2A',
          secondary: '#888780',
        },
        border: '#E5E3DC',
      }
    },
  },
  plugins: [],
};
