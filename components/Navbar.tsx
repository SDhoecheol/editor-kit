"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const segment = useSelectedLayoutSegment();

  // ⭐️ 추후 Supabase Auth와 연동될 로그인 상태 (현재는 UI 확인용 토글)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 임시: 로컬스토리지나 쿠키 등에서 로그인 상태를 확인하는 로직이 들어갈 자리
  }, []);

  const getTabStyle = (targetSegment: string | null) => {
    const isActive = segment === targetSegment;
    
    return isActive
      ? "text-[#222222] dark:text-[#EAEAEA] border-b-4 border-[#222222] dark:border-[#EAEAEA] pb-1 transition-colors font-black"
      : "text-[#A0A0A0] dark:text-[#666666] border-b-4 border-transparent hover:text-[#222222] dark:hover:text-[#EAEAEA] pb-1 transition-colors font-bold";
  };

  return (
    <nav className="bg-white dark:bg-[#1E1E1E] border-b-4 border-[#222222] dark:border-[#444444] sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* ==========================================
            로고 및 메인 메뉴
            ========================================== */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 text-[#222222] dark:text-[#EAEAEA] hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-[28px]">layers</span> EditorKit
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm mt-1">
            <Link href="/" className={getTabStyle(null)}>홈</Link>
            <Link href="/community" className={getTabStyle("community")}>커뮤니티</Link>
            {/* 유틸리티는 개별 툴이 많으므로 tools 하위 폴더들을 감지합니다 */}
            <Link href="/tools/harikomi" className={getTabStyle("tools")}>유틸리티</Link>
          </div>
        </div>

        {/* ==========================================
            우측 유저 액션
            ========================================== */}
        <div className="flex items-center gap-3">
          
          {/* 다크모드 토글 버튼 */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 flex items-center justify-center border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#1E1E1E] shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            aria-label="Toggle Dark Mode"
          >
            {mounted && (
              <span className="material-symbols-outlined text-[#222222] dark:text-[#EAEAEA] text-[20px]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-[#E5E4E0] dark:bg-[#444444] mx-1"></div>

          {/* ⭐️ 로그인 상태에 따른 조건부 렌더링 */}
          {isLoggedIn ? (
            <>
              {/* 잉크(Ink) 표시 위젯 */}
              <Link href="/mypage" className="hidden sm:flex items-center gap-1.5 bg-blue-50 dark:bg-[#1A233A] border-2 border-blue-600 dark:border-blue-500 px-3 py-1 font-mono text-sm font-black hover:bg-blue-100 transition-colors">
                <span className="text-blue-600 dark:text-blue-400">💧</span> 
                <span className="text-blue-800 dark:text-blue-300">1,240</span>
              </Link>
              
              {/* 글쓰기 버튼 */}
              <Link href="/community/write" className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-4 py-1.5 text-sm font-black shadow-[2px_2px_0px_#A0A0A0] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">edit</span> 글쓰기
              </Link>

              {/* 유저 프로필 아이콘 (마이페이지 이동) */}
              <Link href="/mypage" className="w-9 h-9 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#EAEAEA] flex items-center justify-center font-black hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors relative ml-1">
                <span className="text-[#222222] dark:text-[#EAEAEA]">필</span>
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#1E1E1E] rounded-full"></span>
              </Link>
            </>
          ) : (
            <>
              {/* 비로그인 상태일 때 보이는 버튼 */}
              <Link href="/login" className="bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#EAEAEA] px-5 py-1.5 text-sm font-black hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
                로그인
              </Link>
              <Link href="/login" className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-5 py-1.5 text-sm font-black shadow-[2px_2px_0px_#A0A0A0] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all hidden sm:block">
                회원가입
              </Link>
              
              {/* 임시 토글 버튼 (개발 확인용) */}
              <button onClick={() => setIsLoggedIn(true)} className="text-[10px] underline ml-2 text-red-500">
                (임시로그인)
              </button>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}