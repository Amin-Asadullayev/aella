export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        c1: "#1C2321",
        c2: "#7D98A1",
        c3: "#DE6449",
      }
    },
  },
  plugins: [
    require("@tailwindcss/forms")
  ],
}