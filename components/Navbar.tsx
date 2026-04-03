'use client';

import Link from "next/link";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // 수파베이스 파이프라인 가져오기

export default function Navbar() {
  // 유저 정보 저장소
  const [user, setUser] = useState<any>(null);

  // 로그인 상태 감지기
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 로그인 & 로그아웃 함수
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* 로고 영역 */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              EditorKit
            </Link>
          </div>
          
          {/* 메뉴 영역 */}
          <div className="flex gap-6 items-center">
            <Link href="/community" className="text-gray-600 hover:text-blue-600 font-medium">
              커뮤니티
            </Link>
            <Link href="/tools" className="text-gray-600 hover:text-blue-600 font-medium">
              유틸리티
            </Link>

            {/* ⭐️ 마법이 일어나는 부분: 로그인 상태에 따라 버튼이 바뀝니다 */}
            {user ? (
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm text-gray-700">
                  {/* 이메일 앞자리만 잘라서 보여줍니다 (예: sdhoecheol님) */}
                  <span className="font-bold text-blue-600">{user.email?.split('@')[0]}</span> 님
                </span>
                <button 
                  onClick={handleLogout} 
                  className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors border border-gray-200"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleLogin} 
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors ml-4"
              >
                구글 로그인
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}