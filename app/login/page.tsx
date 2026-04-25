"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; //

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 이미 로그인된 상태라면 홈으로 튕겨내기
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push("/");
    };
    checkSession();
  }, [router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // ⭐️ 수파베이스 구글 로그인 실행
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ⭐️ 환경변수를 우선 사용하여 배포 환경에서 localhost로 빠지는 버그 방지
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`, 
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("로그인 에러:", error.message);
      alert("로그인 도중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 md:p-6 bg-[#F5F4F0] dark:bg-[#121212] transition-colors">
      
      <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] shadow-[12px_12px_0px_#222222] dark:shadow-[12px_12px_0px_#111111] overflow-hidden relative">
        
        {/* 상단 장식 바 */}
        <div className="h-5 bg-[#222222] dark:bg-[#EAEAEA] border-b-2 border-[#222222] dark:border-[#444444] flex items-center gap-1.5 px-3">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full border border-[#222222] dark:border-[#1E1E1E]"></div>
          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full border border-[#222222] dark:border-[#1E1E1E]"></div>
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full border border-[#222222] dark:border-[#1E1E1E]"></div>
        </div>

        <div className="p-6 sm:p-8 md:p-10 flex flex-col items-center">
          <div className="text-center mb-10 w-full">
            <Link href="/" className="inline-flex items-center gap-2 text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tighter mb-4 hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-[40px]">layers</span> EditorKit
            </Link>
            <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] border-2 border-[#222222] dark:border-[#444444] py-3 px-4 shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111]">
              <p className="text-sm font-black text-[#222222] dark:text-[#EAEAEA] tracking-widest uppercase">
                Member Access
              </p>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] border-4 border-[#222222] dark:border-[#EAEAEA] py-4 font-black shadow-[6px_6px_0px_#222222] dark:shadow-[6px_6px_0px_#EAEAEA] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#222222] dark:hover:shadow-[4px_4px_0px_#EAEAEA] transition-all flex items-center justify-center gap-3 text-lg group disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin material-symbols-outlined">sync</span>
            ) : (
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.806l-4.04 3.124C3.205 21.354 7.277 24 12 24c3.24 0 6.114-1.05 8.163-2.83l-4.123-3.157Z"/>
                <path fill="#4A90E2" d="M19.834 21.17c2.193-2.046 3.62-5.096 3.62-9.17 0-.71-.065-1.402-.182-2.07H12v4.01h7.08c-.3 1.93-1.6 3.55-3.32 4.6l4.074 2.63Z"/>
                <path fill="#FBBC05" d="M1.24 6.65C.446 8.272 0 10.082 0 12c0 1.918.446 3.728 1.24 5.35l4.04-3.124A7.082 7.082 0 0 1 5.01 12c0-1.428.413-2.776 1.144-3.95L2.128 4.93Z"/>
              </svg>
            )}
            Google 계정으로 계속하기
          </button>

          <div className="mt-8 text-center border-t-2 border-dashed border-[#E5E4E0] dark:border-[#333333] pt-6 w-full opacity-60">
            <p className="text-[11px] font-bold text-[#A0A0A0] dark:text-[#666666] tracking-widest uppercase">
              Secure authentication via Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}   