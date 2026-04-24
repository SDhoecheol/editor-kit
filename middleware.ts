import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ⭐️ Next.js가 반드시 찾고 있는 핵심 함수 이름입니다. (오타 주의!)
export async function middleware(request: NextRequest) {
  // 1. 1단계에서 만든 유틸리티를 호출하여 세션 업데이트 및 유저 정보 가져오기
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // ⭐️ Netlify 배포 환경에서 request.nextUrl이 localhost를 바라보는 문제 해결
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;

  const url = new URL(request.nextUrl.pathname, baseUrl);
  const pathname = request.nextUrl.pathname;

  // 2. 프로필 유무 확인 로직 (로그인했는데 프로필이 없다면 무조건 /welcome으로 강제 이동)
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('id, role').eq('id', user.id).single();
    
    // 프로필이 없고, 현재 접속하려는 곳이 /welcome이나 로그아웃이 아닐 경우
    if (!profile && pathname !== '/welcome' && !pathname.startsWith('/auth/')) {
      url.pathname = '/welcome';
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    // 이미 프로필이 있는 사람이 /welcome에 접근하면 홈으로 튕겨냄
    if (profile && pathname === '/welcome') {
      url.pathname = '/';
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    // [관리자 구역 접근 제어]
    if (pathname.startsWith('/admin')) {
      if (!profile || profile.role === 'user' || !profile.role) {
        url.pathname = '/';
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }

      if (pathname.startsWith('/admin/users') && profile.role !== 'admin') {
        url.pathname = '/admin/posts';
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }
    }
  }

  // 3. [비로그인 유저 접근 금지 구역] 설정
  const protectedRoutes = ['/mypage', '/community/write', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    // 로그인이 안 되어 있다면 로그인 창으로 튕겨냄
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    
    // ⭐️ 중요: 쿠키 충돌 방지
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });

    return redirectResponse;
  }

  // 4. [로그인 유저 접근 금지 구역] 설정
  const authRoutes = ['/login']; // welcome 제외
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && user) {
    // 이미 로그인한 사람이 로그인 페이지에 접근하면 메인 홈으로 튕겨냄
    url.pathname = '/';
    const redirectResponse = NextResponse.redirect(url);
    
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });

    return redirectResponse;
  }

  // 5. 아무 문제가 없다면 정상적으로 페이지 접근 허용
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