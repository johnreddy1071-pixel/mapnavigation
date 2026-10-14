import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#bcddff",
          300: "#8ec8ff",
          400: "#59a7ff",
          500: "#3083fe",
          600: "#1764f3",
          700: "#104edb",
          800: "#1340b0",
          900: "#15388b",
          950: "#102354",
        },
        navy: {
          800: "#0b1528",
          900: "#070e1c",
          950: "#040810",
        },
        amber: {
          au: "#ff9900",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
