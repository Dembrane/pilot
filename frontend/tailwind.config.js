import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: "'Space Grotesk', sans-serif",
      colors: {
        // from mantine primary
        //   [
        // "#e2f6ff",
        // "#cbe9ff",
        // "#99cfff",
        // "#62b5ff",
        // "#369eff",
        // "#1890ff",
        // "#0089ff",
        // "#0076e5",
        // "#0069ce",
        // "#005ab7",
        // ]
        primary: {
          50: "#e2f6ff",
          100: "#cbe9ff",
          200: "#99cfff",
          300: "#62b5ff",
          400: "#369eff",
          500: "#1890ff",
          600: "#0089ff",
          700: "#0076e5",
          800: "#0069ce",
          900: "#005ab7",
        },
      },
    },
  },
  plugins: [typography],
};
