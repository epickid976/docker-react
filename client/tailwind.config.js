/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
   "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      // Extend with your existing design tokens if needed
      colors: {
        // You can add custom colors here that match your existing theme
      },
      fontFamily: {
        'fredoka': ['Fredoka', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

