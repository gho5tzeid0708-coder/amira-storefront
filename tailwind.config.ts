import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF8F5",
        stone: "#EFECE6",
        charcoal: "#231F20",
        wine: "#6E1E2A",
        hairline: "#E2DDD5"
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Tahoma", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
