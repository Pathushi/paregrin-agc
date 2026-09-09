/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#0284c7", // Matches Paragrine primary blue
      },
    },
  },
  plugins: [],
};
