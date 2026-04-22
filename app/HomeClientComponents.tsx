"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export function ProfileWidget({ initialUser, initialProfile }: { initialUser?: any, initialProfile?: any }) {
  const [user, setUser] = useState<any>(initialUser || null);
  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [isChecking, setIsChecking] = useState(false); // 서버에서 데이터를 받았으므로 바로 false로 시작

  // ⭐️ 서버 상태가 변경되면 즉각 동기화
  useEffect(() => {
    setUser(initialUser || null);
    setProfile(initialProfile || null);
  }, [initialUser, initialProfile]);

  useEffect(() => {
    let isMounted = true;

    // 서버가 넘겨준 초기값(initialUser)을 절대적인 진실로 신뢰합니다.
    // (이전에 있던 브라우저 로컬 스토리지 부활 로직은 좀비 세션 버그의 원인이 되므로 삭제)

    // 토큰 갱신 및 로그인 상태 변화 감지
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      setUser(session?.user || null);
      
      if (event === 'SIGNED_OUT') {
        setProfile(null);
      } else if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
          
        if (data && isMounted) {
          setProfile(data);
        } else {
          window.location.href = "/welcome";
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 mb-4 dark:text-[#EAEAEA]">
        My Profile
      </h3>
      <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] md:shadow-[8px_8px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] dark:md:shadow-[8px_8px_0px_#111111] p-4 md:p-5 transition-colors min-h-[220px] flex flex-col justify-center">
        
        {isChecking ? (
          <div className="text-center text-[#A0A0A0] font-bold text-sm flex flex-col items-center justify-center py-6">
            <span className="animate-spin material-symbols-outlined mb-2">sync</span>
            정보 확인 중...
          </div>
        ) : profile ? (
          <>
            <div className="flex gap-4 items-center mb-4">
              <div className="w-12 h-12 bg-[#222222] dark:bg-[#333333] text-[#F5F4F0] dark:text-[#EAEAEA] flex items-center justify-center font-black text-xl">
                {profile.nickname ? profile.nickname.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="font-black dark:text-[#EAEAEA] truncate max-w-[120px]">{profile.nickname}</div>
                <div className="text-xs font-bold text-[#A0A0A0] mt-1">{profile.role_tag || "#디자이너"}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-[#F5F4F0] dark:bg-[#121212] border border-[#E5E4E0] dark:border-[#333333] p-3 mb-4 transition-colors">
              <span className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">보유 잉크</span>
              <span className="font-mono font-black text-lg text-[#222222] dark:text-[#EAEAEA]">
                <span className="text-sm opacity-80">💧</span> {profile.ink?.toLocaleString() || 0}
              </span>
            </div>

            <Link 
              href="/mypage" 
              className="block text-center w-full bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] border-2 border-[#222222] dark:border-[#444444] py-2 font-bold text-sm hover:bg-[#222222] hover:text-white dark:hover:bg-[#333333] dark:hover:text-white transition-colors shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            >
              내 프로필 관리
            </Link>
          </>
        ) : user ? (
          <div className="text-center py-6">
            <p className="text-sm font-bold text-red-500 mb-2">프로필 설정이 필요합니다.</p>
            <button onClick={() => window.location.href = "/welcome"} className="text-xs underline text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA]">
              프로필 설정하러 가기
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666] mb-4">로그인이 필요합니다.</p>
            <Link 
              href="/login" 
              className="flex items-center justify-center gap-2 w-full bg-[#222222] dark:bg-[#EAEAEA] text-white dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] py-2.5 font-black text-sm shadow-[2px_2px_0px_#A0A0A0] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              로그인하러 가기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}