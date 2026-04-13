"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deletePost(postId: string) {
  // 1. 쿠키 스토어 가져오기 (Next.js 15+ 규격 적용)
  const cookieStore = await cookies();

  // 2. 서버 환경용 Supabase 클라이언트 생성 (브라우저 노출 X)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Server Action 내부 제약으로 인한 에러 무시
          }
        },
      },
    }
  );

  // 3. 서버 단에서 접속 유저 검증 (브라우저 조작 불가)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "로그인이 필요하거나 삭제 권한이 없습니다." };
  }

  // 4. 게시글 삭제 실행 (1단계 RLS 정책 + 2단계 작성자 ID 이중 검증)
  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id); // ⭐️ 내가 쓴 글이 아니면 절대 지워지지 않도록 쐐기!

  if (deleteError) {
    console.error("게시글 삭제 실패:", deleteError);
    return { success: false, message: "서버 오류로 게시글을 삭제하지 못했습니다." };
  }

  // 5. ⭐️ 핵심: 캐시 싹 날려버리기! (목록 페이지 즉시 갱신)
  revalidatePath("/community"); // 커뮤니티 목록 새로고침
  revalidatePath("/");          // 메인 홈 최신글 목록 새로고침
  revalidatePath("/mypage");    // 마이페이지 나의 활동 새로고침

  return { success: true, message: "게시글이 성공적으로 삭제되었습니다." };
}