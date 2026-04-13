import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ⭐️ Next.js가 반드시 찾고 있는 핵심 함수 이름입니다. (오타 주의!)
export async function middleware(request: NextRequest) {
  // 1. 1단계에서 만든 유틸리티를 호출하여 세션 업데이트 및 유저 정보 가져오기
  const { supabaseResponse, user } = await updateSession(request);

  const url = request.nextUrl.clone();
  const pathname = request.nextUrl.pathname;

  // 2. [비로그인 유저 접근 금지 구역] 설정
  const protectedRoutes = ['/mypage', '/community/write'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    // 로그인이 안 되어 있다면 로그인 창으로 튕겨냄
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 3. [로그인 유저 접근 금지 구역] 설정
  const authRoutes = ['/login', '/welcome'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && user) {
    // 이미 로그인한 사람이 로그인/가입 페이지에 접근하면 메인 홈으로 튕겨냄
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 4. 아무 문제가 없다면 정상적으로 페이지 접근 허용
  return supabaseResponse;
}

// 5. 미들웨어가 실행될 경로 최적화 (matcher)
export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 요청에만 미들웨어를 실행하여 서버 부하를 막습니다:
     * - _next/static (Next.js 정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - 기타 단순 이미지 파일들 (svg, png, jpg 등)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};