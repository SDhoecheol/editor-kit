import { createBrowserClient } from '@supabase/ssr';

// ⭐️ 브라우저(클라이언트) 전용 최신 클라이언트로 교체하여 쿠키 세션을 정상적으로 읽어옵니다.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);