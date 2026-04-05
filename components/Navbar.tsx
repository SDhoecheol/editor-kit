'use client';

import Link from "next/link";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from "next-themes"; // 테마 훅 추가

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string>('');
  
  // 테마 스위치용 상태
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // 에러 방지용 (클라이언트 마운트 확인)
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
        if (profile) {
          setNickname(profile.nickname); 
        } else {
          if (window.location.pathname !== '/welcome') {
            window.location.href = '/welcome';
          }
        }
      }
    };
    checkUserAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) checkUserAndProfile();
      else setNickname('');
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}` } });
  };
  const handleLogout = async () => await supabase.auth.signOut();

  return (
    // ⭐️ 주간: 하얀 종이 / 야간: 매트한 잉크 블랙 (dark:bg-[#1A1A1A])
    <nav className="bg-white dark:bg-[#1A1A1A] border-b border-[#E5E4E0] dark:border-[#333333] sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">design_services</span>
            <Link href="/" className="text-xl font-black text-[#222222] dark:text-[#F5F4F0] tracking-tight hover:text-blue-600 transition-colors">
              EditorKit
            </Link>
          </div>
          
          <div className="flex gap-6 items-center">
            <Link href="/community" className="text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-white font-bold transition-colors">
              커뮤니티
            </Link>
            <Link href="/tools" className="text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-white font-bold transition-colors">
              유틸리티
            </Link>

            {/* ⭐️ ☀️/🌙 테마 토글 버튼 */}
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="ml-4 p-2 rounded-full bg-[#F5F4F0] dark:bg-[#121212] border border-[#E5E4E0] dark:border-[#333333] text-[#222222] dark:text-[#F5F4F0] hover:scale-110 transition-all flex items-center justify-center w-10 h-10 shadow-sm"
                title="테마 변경"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-4 border-l border-[#E5E4E0] dark:border-[#333333] pl-6 ml-2">
                <div className="flex items-center gap-2 bg-[#F5F4F0] dark:bg-[#121212] px-4 py-1.5 rounded-full border border-[#E5E4E0] dark:border-[#333333]">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-bold text-[#222222] dark:text-[#F5F4F0]">
                    {nickname || '로딩중...'}
                  </span>
                </div>
                <button onClick={handleLogout} className="text-sm px-4 py-2 text-[#666666] dark:text-[#A0A0A0] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-bold transition-all">
                  로그아웃
                </button>
              </div>
            ) : (
              <button onClick={handleGoogleLogin} className="text-sm px-5 py-2.5 bg-[#222222] dark:bg-[#F5F4F0] text-white dark:text-[#222222] rounded-xl hover:-translate-y-0.5 font-bold transition-all ml-2 flex items-center gap-2 shadow-md">
                <span className="material-symbols-outlined text-sm">login</span> 시작하기
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}