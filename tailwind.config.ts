import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Couleurs officielles du club (reprises du site usanizypinon.fr)
        jaune: "#FFCC00",
        "jaune-deep": "#F2B705",
        noir: "#0c0c0d",
        "noir-2": "#161618",
        "noir-3": "#1f1f22",
        cream: "#FAF5E7",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 12px 32px rgba(0,0,0,.28)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { rise: "rise .5s cubic-bezier(.2,.7,.3,1) both" },
    },
  },
  plugins: [],
};

export default config;
