/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent:  "#618751",  // single green — buttons, active states, logo
        surface: "#F5F5F5",  // off-white — sidebar bg, hover states, card surfaces
        line:    "#E5E5E5",  // neutral gray — all borders / dividers
        ink:     "#1A1A1A",  // near-black — body text
      },
      fontFamily: {
        display: ['"Comfortaa"', "system-ui", "sans-serif"],
        body:    ['"Comfortaa"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        blob: "1.25rem",
      },
    },
  },
  plugins: [],
};
