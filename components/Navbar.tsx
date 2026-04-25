"use client";

import Link from "next/link";
import { useSelectedLayoutSegment, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import NotificationBell from "./NotificationBell";

export default function Navbar({ initialUser, initialProfile }: { initialUser?: any, initialProfile?: any }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const segment = useSelectedLayoutSegment();
  const router = useRouter();

  // ⭐️ 초기 렌더링 시 서버에서 가져온 데이터를 바로 할당하여 깜빡임 방지
  const [user, setUser] = useState<any>(initialUser || null);
  const [profile, setProfile] = useState<any>(initialProfile || null);

  // 서버의 상태가 갱신될 때마다 클라이언트 상태도 동기화
  useEffect(() => {
    setUser(initialUser || null);
    setProfile(initialProfile || null);
  }, [initialUser, initialProfile]);

  useEffect(() => {
    setMounted(true);

    const fetchUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        // ⭐️ users가 아니라 profiles 테이블에서 가져오기!
        const { data, error } = await supabase
          .from("profiles")
          .select("nickname, ink")
          .eq("id", session.user.id)
          .single();
        
        if (!error && data) setProfile(data);
      }
    };

    fetchUserAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        // ⭐️ 여기도 profiles로 수정!
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    // ⭐️ 즉시 UI를 비로그인 상태로 변경 (네비게이션 바 즉각 동기화)
    setUser(null);
    setProfile(null);

    try {
      // 서버 통신이 무한 대기에 빠지는 것을 막기 위해 타임아웃(0.8초) 추가
      await Promise.race([
        Promise.all([
          fetch('/auth/logout', { method: 'POST' }),
          supabase.auth.signOut()
        ]),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      // ⭐️ 무조건 홈으로 이동하며 물리적 새로고침 발생
      window.location.href = "/";
    }
  };

  const getTabStyle = (targetSegment: string | null) => {
    const isActive = segment === targetSegment;
    return isActive
      ? "text-[#222222] dark:text-[#EAEAEA] border-b-4 border-[#222222] dark:border-[#EAEAEA] pb-1 transition-colors font-black"
      : "text-[#A0A0A0] dark:text-[#666666] border-b-4 border-transparent hover:text-[#222222] dark:hover:text-[#EAEAEA] pb-1 transition-colors font-bold";
  };

  return (
    <nav className="bg-white dark:bg-[#1E1E1E] border-b-4 border-[#222222] dark:border-[#444444] sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
        
        {/* 상단: 로고 및 우측 액션 (모바일 1열 / PC 전체) */}
        <div className="flex items-center justify-between w-full md:w-auto flex-1">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-1 md:gap-2 text-[#222222] dark:text-[#EAEAEA] hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-[24px] md:text-[28px]">layers</span> 
              <span className="hidden sm:inline md:inline">EditorKit</span>
              <span className="sm:hidden">EK</span>
            </Link>
            
            {/* PC 전용 네비게이션 */}
            <div className="hidden md:flex items-center gap-6 text-sm mt-1">
              <Link href="/" className={getTabStyle(null)}>홈</Link>
              <Link href="/community" className={getTabStyle("community")}>라운지</Link>
              <Link href="/tools" className={getTabStyle("tools")}>유틸리티</Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 ml-auto md:ml-0">
            
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#1E1E1E] shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              {mounted && (
                <span className="material-symbols-outlined text-[#222222] dark:text-[#EAEAEA] text-[16px] md:text-[20px]">
                  {theme === "dark" ? "light_mode" : "dark_mode"}
                </span>
              )}
            </button>

            <div className="w-px h-4 md:h-6 bg-[#E5E4E0] dark:bg-[#444444] mx-0.5 md:mx-1"></div>

            {user ? (
              <>
                {profile && (
                  <Link href="/mypage" className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] px-2 md:px-3 py-0.5 md:py-1 font-mono text-xs md:text-sm font-black hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
                    <span className="text-[#222222] dark:text-[#EAEAEA]">💧</span> 
                    <span className="text-[#222222] dark:text-[#EAEAEA]">{profile.ink?.toLocaleString() || 0}</span>
                  </Link>
                )}
                
                {/* 🔔 알림 벨 */}
                {user && <NotificationBell userId={user.id} />}

                <Link href="/community/write" className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-2 md:px-4 py-1.5 md:py-1.5 text-xs md:text-sm font-black shadow-[2px_2px_0px_#A0A0A0] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] md:text-[16px]">edit</span> 
                  <span className="hidden sm:inline">글쓰기</span>
                </Link>

                <Link href="/mypage" className="w-8 h-8 md:w-9 md:h-9 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#EAEAEA] flex items-center justify-center font-black text-sm md:text-base hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors relative shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
                  <span className="text-[#222222] dark:text-[#EAEAEA]">
                    {profile?.nickname ? profile.nickname.charAt(0).toUpperCase() : "U"}
                  </span>
                </Link>

                <button onClick={handleLogout} className="hidden sm:block text-xs font-bold text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] ml-1 md:ml-2 underline underline-offset-2">
                  로그아웃
                </button>
                {/* 모바일용 로그아웃 아이콘 */}
                <button onClick={handleLogout} className="sm:hidden text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] ml-1 flex items-center">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-3 md:px-5 py-1.5 md:py-1.5 text-xs md:text-sm font-black shadow-[2px_2px_0px_#A0A0A0] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                로그인
              </Link>
            )}
          </div>
        </div>

        {/* 하단: 모바일 전용 네비게이션 (PC에서는 숨김) */}
        <div className="flex md:hidden items-center justify-center gap-8 text-sm pt-2 pb-1 border-t-2 border-[#E5E4E0] dark:border-[#333333] w-full mt-2">
          <Link href="/" className={getTabStyle(null)}>홈</Link>
          <Link href="/community" className={getTabStyle("community")}>라운지</Link>
          <Link href="/tools" className={getTabStyle("tools")}>유틸리티</Link>
        </div>

      </div>
    </nav>
  );
}