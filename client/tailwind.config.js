/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
      extend: {
          colors: {
              "primary": "#256af4",
              "background-light": "#f5f6f8",
              "background-dark": "#101622",
              "surface-light": "#ffffff",
              "surface-dark": "#1e293b",
              "border-light": "#e2e8f0",
              "border-dark": "#334155",
          },
          fontFamily: {
              "display": ["Inter", "sans-serif"]
          },
      },
    },
    plugins: [
        // require('@tailwindcss/forms'), // Install if needed, for now standard styles
    ],
  }
