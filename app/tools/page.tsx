"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 클라이언트 렌더링 확인 (다크모드 깜빡임 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // 마운트 되기 전에는 아무것도 렌더링하지 않음
  if (!mounted) return null;

  return (
    // 전체 배경 (다크모드 시 bg-[#121212])
    <div className="bg-[#F5F4F0] text-[#222222] dark:bg-[#121212] dark:text-[#EAEAEA] min-h-screen flex flex-col transition-colors duration-300">
      
      {/* ==========================================
          1. GNB (Global Navigation Bar)
          ========================================== */}
      <nav className="bg-white dark:bg-[#1E1E1E] border-b-4 border-[#222222] dark:border-[#444444] sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 dark:text-[#EAEAEA]">
              <span className="material-symbols-outlined text-[28px]">layers</span> EditorKit
            </Link>
            <div className="hidden md:flex items-center gap-6 font-bold text-sm">
              <Link href="/" className="text-[#222222] dark:text-[#EAEAEA] border-b-2 border-[#222222] dark:border-[#EAEAEA] pb-1 transition-colors">홈</Link>
              <Link href="/community" className="text-[#A0A0A0] dark:text-[#666666] hover:text-[#222222] dark:hover:text-[#EAEAEA] pb-1 border-b-2 border-transparent transition-colors">커뮤니티</Link>
              <Link href="/tools" className="text-[#A0A0A0] dark:text-[#666666] hover:text-[#222222] dark:hover:text-[#EAEAEA] pb-1 border-b-2 border-transparent transition-colors">유틸리티</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* ⭐️ 진짜로 작동하는 다크모드 토글 버튼 */}
            <button onClick={toggleDarkMode} className="w-10 h-10 flex items-center justify-center border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#1E1E1E] shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              <span className="material-symbols-outlined text-[#222222] dark:text-[#EAEAEA]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 bg-[#F5F4F0] dark:bg-[#2A2A2A] border border-[#E5E4E0] dark:border-[#444444] px-3 py-1 font-mono text-sm font-bold transition-colors">
              <span className="text-blue-500">💧</span> <span className="dark:text-[#EAEAEA]">1,240</span>
            </div>
            
            <Link href="/community/write" className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-4 py-1.5 text-sm font-bold shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#444444] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#222222] dark:hover:shadow-[1px_1px_0px_#444444] transition-all flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">edit</span> 글쓰기
            </Link>

            <div className="w-8 h-8 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center font-black cursor-pointer hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors relative">
              <span className="dark:text-[#EAEAEA]">E</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1E1E1E] rounded-full"></span>
            </div>
          </div>
        </div>
      </nav>

      {/* ==========================================
          2. Main Content Area
          ========================================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8 transition-colors duration-300">
        
        {/* [Left/Center] 메인 대시보드 영역 (col-span-3) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* 1. 히어로 배너 (Hero Banner) - 레퍼런스의 카드 스타일 적용 */}
          <div className="bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-8 relative overflow-hidden transition-colors">
            <div className="relative z-10 w-2/3">
              <span className="inline-block bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] font-black text-[10px] uppercase tracking-widest px-2 py-0.5 mb-4">
                Notice
              </span>
              <h2 className="text-3xl font-black mb-3 leading-tight">
                에디터킷 V2.0 업데이트<br />
                3D 패키징 목업 기능 추가!
              </h2>
              <p className="text-sm text-[#666666] dark:text-[#A0A0A0] mb-6">
                번거로운 포토샵 합성 없이, 단 3초 만에 PDF를 입체적인 책자로 변환하세요.
              </p>
              <Link 
                href="/tools/mockup3d" 
                className="inline-block bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-6 py-2 font-bold text-sm hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#444444] hover:shadow-[2px_2px_0px_#222222] dark:hover:shadow-[2px_2px_0px_#444444] transition-all"
              >
                자세히 보기
              </Link>
            </div>
            <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[180px] text-[#222222]/5 dark:text-[#EAEAEA]/5 rotate-[-15deg] pointer-events-none">
              view_in_ar
            </span>
          </div>

          {/* 2. 커뮤니티 2x2 그리드 미리보기 */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 transition-colors">
              <h3 className="text-xl font-black dark:text-[#EAEAEA] flex items-center gap-2">
                <span className="material-symbols-outlined">forum</span> 실시간 커뮤니티
              </h3>
              <Link href="/community" className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] flex items-center gap-1 transition-colors">
                전체보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 위젯: 공지사항 */}
              {/* ⭐️ 레퍼런스 스타일: bg-[#1E1E1E] / shadow-[#111111] */}
              <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
                <div className="border-b-2 border-[#222222] dark:border-[#444444] p-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                  <span className="dark:text-[#EAEAEA]">공지사항</span> 
                  <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] dark:text-[#666666]">campaign</span>
                </div>
                <ul className="divide-y border-[#E5E4E0] dark:divide-[#333333]">
                  <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                    <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[80%]">에디터킷 커뮤니티 이용 규칙 안내</span>
                    <span className="font-mono text-xs text-[#A0A0A0] dark:text-[#666666]">04.09</span>
                  </li>
                  <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                    <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[80%]">잉크(Ink) 보상 시스템 정책 변경 안내</span>
                    <span className="font-mono text-xs text-[#A0A0A0] dark:text-[#666666]">04.01</span>
                  </li>
                </ul>
              </div>

              {/* 위젯: 자유게시판 */}
              <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
                <div className="border-b-2 border-[#222222] dark:border-[#444444] p-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                  <span className="dark:text-[#EAEAEA]">자유게시판</span> 
                  <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] dark:text-[#666666]">coffee</span>
                </div>
                <ul className="divide-y border-[#E5E4E0] dark:divide-[#333333]">
                  <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                    <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[70%]">오늘 출력소 빌런 썰 푼다 ㅋㅋㅋ</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-black text-blue-600 dark:text-blue-400">[12]</span> 
                      <span className="material-symbols-outlined text-[14px] text-red-500 dark:text-red-400">new_releases</span>
                    </div>
                  </li>
                  <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                    <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[80%]">
                      <span className="text-[#A0A0A0] dark:text-[#666666] text-xs mr-1 font-normal">[정보]</span>인디자인 버그 해결법
                    </span>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-xs">[3]</span>
                  </li>
                </ul>
              </div>

              {/* 위젯: Q&A */}
              <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
                <div className="border-b-2 border-[#222222] dark:border-[#444444] p-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                  <span className="dark:text-[#EAEAEA]">Q&A</span> 
                  <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] dark:text-[#666666]">help</span>
                </div>
                <ul className="divide-y border-[#E5E4E0] dark:divide-[#333333]">
                  <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                    <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[70%]">
                      <span className="text-red-600 dark:text-red-400 text-xs mr-1 font-bold">[해결]</span>스노우지 250g 세네카 질문
                    </span>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-xs">[2]</span>
                  </li>
                  <li className="p-3 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition-colors flex justify-between items-center text-sm">
                    <span className="font-bold text-[#222222] dark:text-[#EAEAEA] truncate max-w-[80%]">일러스트 CMYK 변환 시 색상 문의</span>
                    <span className="font-bold text-[#A0A0A0] dark:text-[#666666] text-xs">0</span>
                  </li>
                </ul>
              </div>

              {/* 위젯: 포트폴리오 */}
              <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] transition-colors shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
                <div className="border-b-2 border-[#222222] dark:border-[#444444] p-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] font-black text-sm flex justify-between items-center transition-colors">
                  <span className="dark:text-[#EAEAEA]">포트폴리오</span> 
                  <span className="material-symbols-outlined text-[16px] text-[#A0A0A0] dark:text-[#666666]">image</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  <div className="aspect-square bg-[#F5F4F0] dark:bg-[#333333] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer">
                    <span className="material-symbols-outlined text-[#A0A0A0] dark:text-[#666666]">image</span>
                  </div>
                  <div className="aspect-square bg-[#F5F4F0] dark:bg-[#333333] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer relative">
                    <span className="material-symbols-outlined text-[#A0A0A0] dark:text-[#666666]">image</span>
                    <span className="absolute top-1 right-1 material-symbols-outlined text-[12px] text-red-600 dark:text-red-400">favorite</span>
                  </div>
                  <div className="aspect-square bg-[#F5F4F0] dark:bg-[#333333] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer">
                    <span className="material-symbols-outlined text-[#A0A0A0] dark:text-[#666666]">image</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ==========================================
            [Right] 우측 사이드바 영역 (col-span-1)
            ========================================== */}
        <aside className="hidden lg:flex flex-col gap-6">
          
          {/* 1. 내 프로필 및 잉크 현황 */}
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 mb-4 dark:text-[#EAEAEA]">
              My Profile
            </h3>
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-5 transition-colors">
              <div className="flex gap-4 items-center mb-4">
                <div className="w-12 h-12 bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] flex items-center justify-center font-black text-xl">
                  E
                </div>
                <div>
                  <div className="font-black dark:text-[#EAEAEA]">마감에쫓기는 스포이드</div>
                  <div className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mt-1">#웹디자이너 #프리랜서</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-[#F5F4F0] dark:bg-[#2A2A2A] border border-[#E5E4E0] dark:border-[#444444] p-3 mb-4 transition-colors">
                <span className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">보유 잉크</span>
                <span className="font-mono font-black text-lg text-[#222222] dark:text-[#EAEAEA]">
                  <span className="text-blue-500 text-sm">💧</span> 1,240
                </span>
              </div>

              <Link 
                href="/welcome" 
                className="block text-center w-full bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#444444] py-2 font-bold text-sm hover:bg-[#222222] hover:text-white dark:hover:bg-[#2A2A2A] transition-colors"
              >
                내 프로필 관리
              </Link>
            </div>
          </div>

          {/* 2. 유틸리티 퀵 링크 위젯 */}
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 mb-4 dark:text-[#EAEAEA]">
              Quick Tools
            </h3>
            <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] p-5 transition-colors">
              <ul className="space-y-4">
                <li>
                  <Link href="/tools/seneca" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group">
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">menu_book</span> 세네카 계산기
                  </Link>
                </li>
                <li>
                  <Link href="/tools/harikomi" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group">
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">view_module</span> 하리꼬미 조판
                  </Link>
                </li>
                <li>
                  <Link href="/tools/qrcode" className="flex items-center gap-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors group">
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">qr_code_2</span> 고화질 QR 생성기
                  </Link>
                </li>
                <li className="border-t border-[#E5E4E0] dark:border-[#444444] pt-4 mt-2">
                  <Link href="/tools/mockup3d" className="flex items-center gap-2 text-sm font-black text-[#222222] dark:text-[#EAEAEA] hover:opacity-70 transition-colors group">
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform text-blue-600 dark:text-blue-400">view_in_ar</span> 3D 패키징 목업 (PRO)
                  </Link>
                </li>
              </ul>
            </div>
          </div>

        </aside>

      </main>
    </div>
  );
}