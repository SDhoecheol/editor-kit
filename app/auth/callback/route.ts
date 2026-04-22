import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (code) {
    // ⭐️ 핵심 해결법: Next.js 15+ 에 맞춰 await를 추가해 비동기로 쿠키를 가져옵니다.
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // 삭제 시 빈 값 처리
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  // 로그인 완료 후 홈으로 리다이렉트
  // ⭐️ Netlify 환경에서 request.nextUrl.origin이 localhost로 잡히는 버그 방지
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;

  const redirectUrl = new URL('/', baseUrl);
  
  return NextResponse.redirect(redirectUrl);
}