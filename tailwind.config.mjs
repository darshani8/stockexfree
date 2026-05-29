/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        marquee: "marquee 15s linear infinite", // Add custom animation
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100%)" },   // Start off-screen
          "100%": { transform: "translateX(-100%)" }, // End off-screen
        },
      },
    },
  },
  plugins: [],
};