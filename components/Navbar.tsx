"use client";

import Link from "next/link";
// ⭐️ 해결책: 전체 주소가 아닌, 현재 활성화된 '메뉴 폴더'만 정확히 추적하는 훅으로 교체!
import { useSelectedLayoutSegment } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // ⭐️ 핵심: 메인 홈이면 null, 커뮤니티면 'community', 유틸리티면 'tools'를 즉각 반환합니다.
  const segment = useSelectedLayoutSegment();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTabStyle = (targetSegment: string | null) => {
    // 현재 폴더(segment)와 타겟 폴더가 일치하면 활성화!
    const isActive = segment === targetSegment;
    
    return isActive
      ? "text-[#222222] dark:text-[#EAEAEA] border-b-2 border-[#222222] dark:border-[#EAEAEA] pb-1 transition-colors"
      : "text-[#A0A0A0] dark:text-[#666666] border-b-2 border-transparent hover:text-[#222222] dark:hover:text-[#EAEAEA] pb-1 transition-colors";
  };

  return (
    <nav className="bg-white dark:bg-[#1E1E1E] border-b-4 border-[#222222] dark:border-[#444444] sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* ==========================================
            로고 및 메인 메뉴
            ========================================== */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 text-[#222222] dark:text-[#EAEAEA]">
            <span className="material-symbols-outlined text-[28px]">layers</span> EditorKit
          </Link>
          
          <div className="hidden md:flex items-center gap-6 font-bold text-sm">
            {/* ⭐️ segment 값을 기준으로 비교합니다. 메인홈은 null, 나머지는 폴더명을 적습니다 */}
            <Link href="/" className={getTabStyle(null)}>홈</Link>
            <Link href="/community" className={getTabStyle("community")}>커뮤니티</Link>
            <Link href="/tools" className={getTabStyle("tools")}>유틸리티</Link>
          </div>
        </div>

        {/* ==========================================
            우측 유저 액션
            ========================================== */}
        <div className="flex items-center gap-4">
          
          {/* 다크모드 토글 버튼 */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 flex items-center justify-center border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#1E1E1E] shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            aria-label="Toggle Dark Mode"
          >
            {mounted && (
              <span className="material-symbols-outlined text-[#222222] dark:text-[#EAEAEA]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            )}
          </button>

          {/* 잉크(Ink) 표시 위젯 */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] border border-[#E5E4E0] dark:border-[#444444] px-3 py-1 font-mono text-sm font-bold transition-colors">
            <span className="text-blue-500">💧</span> 
            <span className="text-[#222222] dark:text-[#EAEAEA]">1,240</span>
          </div>
          
          {/* 글쓰기 버튼 */}
          <Link href="/community/write" className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-4 py-1.5 text-sm font-bold shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#444444] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#222222] dark:hover:shadow-[1px_1px_0px_#444444] transition-all flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">edit</span> 글쓰기
          </Link>

          {/* 유저 프로필 아이콘 */}
          <div className="w-8 h-8 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center font-black cursor-pointer hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors relative">
            <span className="text-[#222222] dark:text-[#EAEAEA]">E</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1E1E1E] rounded-full"></span>
          </div>

        </div>
      </div>
    </nav>
  );
}