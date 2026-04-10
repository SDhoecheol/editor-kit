import type { Config } from "tailwindcss";

const config: Config = {
  // ⭐️ 핵심: 다크모드를 'class' 기반으로 수동 제어하겠다는 선언입니다.
  darkMode: "class", 
  
  // Tailwind가 어떤 파일들을 검사해서 CSS를 적용할지 경로를 지정합니다.
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      // 필요한 경우 여기에 커스텀 폰트나 색상을 추가할 수 있습니다.
      // 현재는 인라인 클래스(예: bg-[#1E1E1E])를 사용 중이므로 비워두어도 완벽하게 작동합니다.
    },
  },
  plugins: [],
};

export default config;