import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // 1. 기본 응답(Response) 객체 생성
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. 미들웨어 전용 Supabase 클라이언트 생성 (Edge 환경에서 쿠키 제어 권한 부여)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 토큰이 갱신될 때 브라우저 쿠키도 함께 업데이트 해주는 핵심 로직
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. 서버에서 안전하게 현재 유저 정보를 가져옴 
  // (이 함수를 호출하는 순간, 만료가 임박한 세션 토큰이 자동으로 갱신됩니다)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. 미들웨어에서 라우팅 검사를 할 수 있도록 응답 객체와 유저 정보, supabase 클라이언트를 반환
  return { supabaseResponse, user, supabase };
}