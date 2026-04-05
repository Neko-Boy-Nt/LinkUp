/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#8A2BE2",
        "primary-light": "#E0D7FF",
        "primary-dark": "#6C4AB6",
        accent: "#BB86FC",
        muted: "#9B59B6",
        background: {
          light: "#F5F3FF",
          dark: "#1A1325",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#2C1F3A",
        },
        text: {
          light: "#1E1E1E",
          dark: "#F5F5F5",
        },
      },
      fontFamily: {
        "poppins-bold": ["PoppinsBold"],
        "inter-regular": ["InterRegular"],
        "roboto-medium": ["RobotoMedium"],
      },
    },
  },
  plugins: [],
};