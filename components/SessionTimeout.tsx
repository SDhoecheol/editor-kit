"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function TimeoutLogic() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. 기존 타이머 제거
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 2. 새 타이머 설정 (1시간 = 3600000ms)
    timeoutRef.current = setTimeout(async () => {
      try {
        // 현재 로그인된 세션이 있는지 확인
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // 3. 타이머가 만료되면 로그아웃 호출 및 강제 이동
          await supabase.auth.signOut();
          alert("장시간 활동이 없어 안전을 위해 자동 로그아웃 되었습니다.");
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("자동 로그아웃 에러:", error);
      }
    }, 3600000);

    // 4. 컴포넌트 언마운트 시 메모리 누수 방지 클린업
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, searchParams]); // 경로(pathname)나 파라미터(searchParams) 변경 시 재실행

  return null; // 화면에 그릴 UI는 없습니다
}

export default function SessionTimeout() {
  return (
    // useSearchParams를 사용하는 클라이언트 컴포넌트는 SSR 에러 방지를 위해 Suspense로 감쌉니다.
    <Suspense fallback={null}>
      <TimeoutLogic />
    </Suspense>
  );
}
