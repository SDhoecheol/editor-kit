"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  // 폼 입력 상태 관리
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 임시 처리 로직 (이후 Supabase Auth 연동 예정)
    if (isLogin) {
      if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요.");
      // 로그인 성공 가정
      router.push("/");
    } else {
      if (!email || !password || !confirmPassword) return alert("모든 항목을 입력해주세요.");
      if (password !== confirmPassword) return alert("비밀번호가 일치하지 않습니다.");
      // 회원가입 성공 가정
      alert("환영합니다! 에디터킷 회원가입이 완료되었습니다.");
      setIsLogin(true); // 가입 후 로그인 화면으로 전환
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-[#F5F4F0] dark:bg-[#121212] transition-colors">
      
      <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] shadow-[12px_12px_0px_#222222] dark:shadow-[12px_12px_0px_#111111] overflow-hidden transition-colors relative">
        
        {/* 상단 장식 바 */}
        <div className="h-4 bg-[#222222] dark:bg-[#EAEAEA] border-b-2 border-[#222222] dark:border-[#444444] flex items-center gap-1.5 px-3">
          <div className="w-2 h-2 bg-red-500 rounded-full border border-[#222222] dark:border-[#1E1E1E]"></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full border border-[#222222] dark:border-[#1E1E1E]"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full border border-[#222222] dark:border-[#1E1E1E]"></div>
        </div>

        <div className="p-8 sm:p-10">
          
          {/* 타이틀 영역 */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-3xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tighter mb-2">
              <span className="material-symbols-outlined text-[32px]">layers</span> EditorKit
            </Link>
            <p className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              인쇄/디자인 실무자들의 비밀기지
            </p>
          </div>

          {/* 로그인 / 회원가입 탭 스위치 */}
          <div className="flex border-2 border-[#222222] dark:border-[#444444] mb-8 bg-[#F5F4F0] dark:bg-[#2A2A2A]">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-black transition-colors ${
                isLogin 
                  ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' 
                  : 'text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA]'
              }`}
            >
              로그인
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-black transition-colors border-l-2 border-[#222222] dark:border-[#444444] ${
                !isLogin 
                  ? 'bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212]' 
                  : 'text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA]'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#222222] dark:text-[#EAEAEA] uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-[20px]">
                  mail
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@editorkit.com"
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] text-[#222222] dark:text-[#EAEAEA] font-bold outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all placeholder-[#A0A0A0] dark:placeholder-[#666666]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black text-[#222222] dark:text-[#EAEAEA] uppercase tracking-widest">
                  Password
                </label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline underline-offset-2">
                    비밀번호를 잊으셨나요?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-[20px]">
                  lock
                </span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] text-[#222222] dark:text-[#EAEAEA] font-bold outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all placeholder-[#A0A0A0] dark:placeholder-[#666666]"
                />
              </div>
            </div>

            {/* 회원가입 시에만 보이는 비밀번호 확인칸 */}
            {!isLogin && (
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-black text-[#222222] dark:text-[#EAEAEA] uppercase tracking-widest">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-[20px]">
                    check_circle
                  </span>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 한 번 더 입력하세요"
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] text-[#222222] dark:text-[#EAEAEA] font-bold outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all placeholder-[#A0A0A0] dark:placeholder-[#666666]"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] py-4 mt-4 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center justify-center gap-2 text-lg"
            >
              {isLogin ? "로그인" : "회원가입 시작하기"}
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>

          </form>

          {/* 소셜 로그인 (추후 연동) */}
          <div className="mt-10 pt-8 border-t-2 border-dashed border-[#E5E4E0] dark:border-[#333333]">
            <p className="text-center text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-4 tracking-widest">
              또는 소셜 계정으로 빠르게 시작하기
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="flex items-center justify-center gap-2 py-3 border-2 border-[#E5E4E0] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] font-bold text-sm hover:border-[#222222] dark:hover:border-[#EAEAEA] transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.806l-4.04 3.124C3.205 21.354 7.277 24 12 24c3.24 0 6.114-1.05 8.163-2.83l-4.123-3.157Z"/>
                  <path fill="#4A90E2" d="M19.834 21.17c2.193-2.046 3.62-5.096 3.62-9.17 0-.71-.065-1.402-.182-2.07H12v4.01h7.08c-.3 1.93-1.6 3.55-3.32 4.6l4.074 2.63Z"/>
                  <path fill="#FBBC05" d="M1.24 6.65C.446 8.272 0 10.082 0 12c0 1.918.446 3.728 1.24 5.35l4.04-3.124A7.082 7.082 0 0 1 5.01 12c0-1.428.413-2.776 1.144-3.95L2.128 4.93Z"/>
                </svg>
                Google
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-3 border-2 border-[#E5E4E0] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] font-bold text-sm hover:border-[#222222] dark:hover:border-[#EAEAEA] transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
                </svg>
                GitHub
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}