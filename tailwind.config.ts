import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f8f6f2",
        ink: "#232221",
        line: "#ddd8cf"
      },
      boxShadow: {
        card: "0 2px 14px rgba(38, 34, 29, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
