import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // ⭐️ 이 한 줄을 반드시 추가해야 합니다!
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ... 기존 설정 유지
    },
  },
  plugins: [],
};
export default config;