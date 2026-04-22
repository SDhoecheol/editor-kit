"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 유틸: 공통 Supabase 클라이언트 생성 로직
async function getSupabase() {
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
  return supabase;
}

// ⭐️ 내부 유틸: 잉크 증감 안전 처리 로직 (RPC 시도 후 실패 시 fallback)
async function adjustInk(supabase: any, userId: string, amount: number) {
  if (amount === 0) return true;
  const { error: rpcError } = await supabase.rpc('adjust_ink', { p_user_id: userId, p_amount: amount });
  if (!rpcError) return true;
  
  // RPC 에러 시 (함수가 아직 안 만들어진 경우) Node.js단에서 수동 업데이트 시도
  console.warn("RPC adjust_ink failed or not found, falling back to JS query:", rpcError.message);
  
  const { data: profile } = await supabase.from('profiles').select('ink').eq('id', userId).single();
  if (!profile) return false; // 프로필이 없으면 실패
  
  const { error: updateError } = await supabase.from('profiles').update({ ink: (profile.ink || 0) + amount }).eq('id', userId);
  return !updateError;
}

// --- ⭐️ 글 작성 서버 액션 (+30 잉크) ---
export async function createPost(
  title: string,
  content: string,
  boardType: string,
  prefix: string,
  isAnonymous: boolean
) {
  const supabase = await getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  // 1. 게시글 삽입
  const { data: post, error: insertError } = await supabase.from("posts").insert([{
    title,
    content,
    board_type: boardType,
    prefix,
    is_anonymous: isAnonymous,
    is_resolved: false,
    author_id: user.id,
    author_email: user.email,
  }]).select().single();

  if (insertError || !post) {
    console.error("게시글 등록 실패:", insertError);
    return { success: false, message: "서버 오류로 게시글을 등록하지 못했습니다." };
  }

  // 2. 잉크 보상 처리 (트랜잭션 에러 방지용 롤백 처리)
  const inkSuccess = await adjustInk(supabase, user.id, 30);
  if (!inkSuccess) {
    // 잉크 적립 실패 시 작성된 글 롤백(삭제)
    await supabase.from("posts").delete().eq("id", post.id);
    return { success: false, message: "잉크 보상 시스템 오류로 게시글 작성이 취소되었습니다. (DB 스키마를 확인하세요)" };
  }

  revalidatePath("/community");
  revalidatePath("/");
  
  return { success: true, message: "게시글이 등록되고 30 Ink가 지급되었습니다.", postId: post.id };
}

// --- ⭐️ 댓글 작성 서버 액션 (+5 잉크) ---
export async function createComment(postId: string, content: string, parentId?: string) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  // 1. 댓글 삽입
  const payload: any = {
    post_id: postId,
    content,
    author_id: user.id,
  };
  if (parentId) payload.parent_id = parentId;

  const { data: comment, error: insertError } = await supabase.from("comments").insert([payload]).select(`id, content, created_at, author_id, parent_id, profiles:author_id (nickname)`).single();

  if (insertError || !comment) {
    console.error("댓글 등록 실패:", insertError);
    return { success: false, message: "서버 오류로 댓글을 등록하지 못했습니다." };
  }

  // 2. 잉크 보상 처리
  const inkSuccess = await adjustInk(supabase, user.id, 5);
  if (!inkSuccess) {
    await supabase.from("comments").delete().eq("id", comment.id);
    return { success: false, message: "잉크 보상 오류로 댓글 작성이 취소되었습니다." };
  }

  revalidatePath(`/community/${postId}`);
  
  return { success: true, message: "댓글이 등록되고 5 Ink가 지급되었습니다.", comment };
}

// --- ⭐️ 게시글 삭제 서버 액션 (-30 잉크 회수) ---
export async function deletePost(postId: string) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { data: deletedRows, error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id)
    .select();

  if (deleteError || !deletedRows || deletedRows.length === 0) {
    console.error("게시글 삭제 실패:", deleteError || "0 rows deleted (RLS or mismatch)");
    return { success: false, message: "게시글 삭제에 실패했습니다." };
  }

  // ⭐️ 삭제 완료 시 잉크 회수
  await adjustInk(supabase, user.id, -30);

  revalidatePath("/community");
  revalidatePath("/");
  revalidatePath("/mypage");

  return { success: true, message: "게시글이 삭제되고 30 Ink가 회수되었습니다." };
}

// --- ⭐️ 댓글 삭제 서버 액션 (-5 잉크 회수) ---
export async function deleteComment(commentId: string, postId: string) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { error: deleteError } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (deleteError) {
    return { success: false, message: "댓글 삭제에 실패했습니다." };
  }

  await adjustInk(supabase, user.id, -5);
  revalidatePath(`/community/${postId}`);

  return { success: true, message: "댓글이 삭제되고 5 Ink가 회수되었습니다." };
}

// --- 게시글 수정 서버 액션 ---
export async function updatePost(
  postId: string, 
  title: string, 
  content: string, 
  boardType: string,
  prefix: string,
  isAnonymous: boolean
) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "로그인이 필요하거나 수정 권한이 없습니다." };

  const { error: updateError } = await supabase
    .from("posts")
    .update({ 
      title, 
      content, 
      board_type: boardType,
      prefix,
      is_anonymous: isAnonymous
    })
    .eq("id", postId)
    .eq("author_id", user.id); 

  if (updateError) {
    console.error("게시글 수정 실패:", updateError);
    return { success: false, message: "서버 오류로 수정하지 못했습니다." };
  }

  revalidatePath("/community");           
  revalidatePath(`/community/${postId}`); 
  revalidatePath("/");                    
  revalidatePath("/mypage");              

  return { success: true, message: "게시글이 성공적으로 수정되었습니다." };
}

// --- ⭐️ 질문 채택(해결) 서버 액션 (+100 잉크) ---
export async function resolvePost(postId: string, questionerId: string, answererId: string) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== questionerId) {
    return { success: false, message: "질문 작성자만 채택할 수 있습니다." };
  }

  // 1. 게시글 상태 업데이트
  const { error: updateError } = await supabase
    .from("posts")
    .update({ is_resolved: true })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (updateError) {
    console.error("게시글 채택 실패:", updateError);
    return { success: false, message: "채택 상태를 업데이트하지 못했습니다." };
  }

  // 2. 질문자 및 답변자에게 각각 100 잉크 지급
  await adjustInk(supabase, questionerId, 100);
  if (questionerId !== answererId) { // 본인 답변 채택이 아닐 경우만
    await adjustInk(supabase, answererId, 100);
  }

  revalidatePath(`/community/${postId}`);
  revalidatePath("/community");
  revalidatePath("/mypage");

  return { success: true, message: "답변이 채택되었습니다! 질문자와 답변자에게 각각 100 Ink가 지급되었습니다." };
}

// --- ⭐️ 프로필 수정 서버 액션 ---
export async function updateProfile(nickname: string, roleTag: string) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("profiles")
    .update({ nickname, role_tag: roleTag })
    .eq("id", user.id);

  if (error) {
    console.error("프로필 수정 실패:", error);
    return { success: false, message: "프로필 수정에 실패했습니다." };
  }

  revalidatePath("/mypage");
  revalidatePath("/");
  return { success: true, message: "프로필이 성공적으로 수정되었습니다." };
}

// --- ⭐️ 조회수 증가 서버 액션 ---
export async function incrementViewCount(postId: string) {
  const supabase = await getSupabase();
  
  // 1. RPC 호출 (가장 권장되는 방법 - RLS 우회 가능)
  const { error: rpcError } = await supabase.rpc('increment_view_count', { p_id: postId });
  if (!rpcError) {
    revalidatePath(`/community/${postId}`);
    return { success: true };
  }
  
  // 파라미터명 오류(post_id) 대응
  const { error: rpcError2 } = await supabase.rpc('increment_view_count', { post_id: postId });
  if (!rpcError2) {
    revalidatePath(`/community/${postId}`);
    return { success: true };
  }

  console.warn("RPC increment_view_count failed, falling back to JS query:", rpcError.message);
  
  // 2. 수동 업데이트 Fallback (RLS 설정에 따라 막힐 수 있음)
  const { data: post } = await supabase.from('posts').select('view_count').eq('id', postId).single();
  if (post) {
    await supabase.from('posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', postId);
  }
  
  revalidatePath(`/community/${postId}`);
  revalidatePath("/community");
  return { success: true };
}

// --- ⭐️ 추천(좋아요) 토글 서버 액션 ---
export async function toggleLikeAction(postId: string) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { data: existingLike } = await supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();

  if (existingLike) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("likes").insert([{ post_id: postId, user_id: user.id }]);
  }

  // 좋아요가 변경되었으므로 즉각적으로 캐시를 비워서 추천수가 반영되게 함
  revalidatePath(`/community/${postId}`);
  revalidatePath("/community");
  
  return { success: true, liked: !existingLike };
}