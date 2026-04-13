import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import EditClientForm from "./EditClientForm"; 

export default async function CommunityEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. URL 파라미터에서 게시글 ID 추출
  const resolvedParams = await params;
  const postId = resolvedParams.id;

  // 2. 서버에서 현재 로그인한 유저 세션 확인
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // 3. DB에서 수정할 게시글 데이터 가져오기
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  // 4. 예외 처리: 글이 없거나 에러가 난 경우
  if (error || !post) {
    return (
      <div className="p-20 text-center font-black text-[#A0A0A0]">
        게시글을 찾을 수 없거나 이미 삭제되었습니다.
      </div>
    );
  }

  // 5. 🛡️ 강력 보안: 본인 글이 아니면 상세 페이지로 리다이렉트
  if (post.author_id !== user?.id) {
    redirect(`/community/${postId}`);
  }

  // 6. ⭐️ 수정된 부분: postId를 Props로 정확하게 넘겨줍니다!
  return <EditClientForm initialData={post} postId={postId} />;
}