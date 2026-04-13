"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export function ProfileWidget() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) setUser(session?.user || null);

        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
            
          if (data) {
            if (isMounted) setProfile(data);
          } else {
            // 프로필이 감지되지 않으면 웰컴 페이지로 강제 이동
            window.location.href = "/welcome";
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    fetchUser();

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
      <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-5 transition-colors min-h-[220px] flex flex-col justify-center">
        
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
                <span className="text-sm opacity-80">💧</span> {profile.ink_balance?.toLocaleString() || 0}
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