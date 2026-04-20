'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginButton() {
  // 유저 정보를 기억해둘 공간(state)을 만듭니다. 처음엔 아무도 없으니 null 입니다.
  const [user, setUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 화면이 켜질 때 수파베이스에게 "지금 로그인한 사람 있어?" 하고 물어보는 역할입니다.
  useEffect(() => {
    // 1. 현재 로그인된 유저 정보 가져오기 (3초 타임아웃 적용)
    const checkUser = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        );

        const getUserPromise = supabase.auth.getUser();

        // 3초 안에 응답이 오지 않으면 Timeout 에러 발생
        const { data } = (await Promise.race([getUserPromise, timeoutPromise])) as any;

        if (data && data.user) {
          setUser(data.user);
        } else {
          await supabase.auth.signOut({ scope: 'local' });
          setUser(null);
        }
      } catch (error) {
        console.error("유저 정보 로딩 에러 또는 타임아웃:", error);
        // 에러나 타임아웃 시 로컬 세션 청소 후 로그인 버튼 띄우기
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
      } finally {
        setIsChecking(false);
      }
    };
    checkUser();

    // 2. 누군가 로그인을 하거나 로그아웃을 하면 화면을 실시간으로 새로고침 해줍니다.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setIsChecking(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 구글 로그인 함수
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ⭐️ 정보 확인 중 상태 렌더링
  if (isChecking) {
    return (
      <div className="px-4 py-2 font-bold text-gray-500 bg-gray-100 rounded-lg">
        정보 확인 중...
      </div>
    );
  }

  // ⭐️ 만약 유저가 로그인 되어 있다면? (유저 정보가 있다면 이 화면을 보여줍니다)
  if (user) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="px-4 py-2 bg-gray-100 rounded-full border border-gray-300">
          <p className="text-sm text-gray-700">
            환영합니다, <span className="font-bold text-blue-600">{user.email}</span> 님!
          </p>
        </div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // ⭐️ 로그인 되어 있지 않다면? (기존처럼 파란색 로그인 버튼을 보여줍니다)
  return (
    <button 
      onClick={handleGoogleLogin} 
      className="px-4 py-2 font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow-md transition-colors"
    >
      구글로 시작하기
    </button>
  );
}