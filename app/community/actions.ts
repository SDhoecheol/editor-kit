"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// --- 기존 deletePost 함수 ---
export async function deletePost(postId: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {}
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "로그인이 필요하거나 삭제 권한이 없습니다." };
  }

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id); 

  if (deleteError) {
    console.error("게시글 삭제 실패:", deleteError);
    return { success: false, message: "서버 오류로 게시글을 삭제하지 못했습니다." };
  }

  revalidatePath("/community");
  revalidatePath("/");
  revalidatePath("/mypage");

  return { success: true, message: "게시글이 성공적으로 삭제되었습니다." };
}

// --- ⭐️ 새롭게 추가된 updatePost 함수 ---
export async function updatePost(
  postId: string, 
  title: string, 
  content: string, 
  boardType: string
) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {}
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "로그인이 필요하거나 수정 권한이 없습니다." };
  }

  // ⭐️ 수정 로직: 게시글 ID와 작성자 ID가 모두 일치해야만 업데이트 실행
  const { error: updateError } = await supabase
    .from("posts")
    .update({ 
      title, 
      content, 
      board_type: boardType,
      updated_at: new Date().toISOString() 
    })
    .eq("id", postId)
    .eq("author_id", user.id); 

  if (updateError) {
    console.error("게시글 수정 실패:", updateError);
    return { success: false, message: "서버 오류로 게시글을 수정하지 못했습니다." };
  }

  // ⭐️ 핵심: 수정한 데이터가 즉시 보이도록 관련 모든 경로의 캐시를 무력화
  revalidatePath("/community");           // 목록 페이지
  revalidatePath(`/community/${postId}`); // 현재 상세 페이지
  revalidatePath("/");                    // 메인 홈
  revalidatePath("/mypage");              // 마이페이지

  return { success: true, message: "게시글이 성공적으로 수정되었습니다." };
}