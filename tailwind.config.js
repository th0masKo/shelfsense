const { colors } = require('./constants/colors');
/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Target components/ and app/ directories
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: colors.background.primary,
        paper: colors.background.secondary,
        surface: colors.background.surface,
        ink: colors.text.primary,
        'ink-light': colors.text.secondary,
        hairline: colors.border,
        teal: colors.accent.teal,
        'teal-deep': colors.accent.tealDeep,
        amber: colors.accent.amber,
        red: colors.accent.red,
        blue: colors.accent.blue,
      },
    },
  },
  plugins: [],
};
