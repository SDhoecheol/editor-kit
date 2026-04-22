import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ViewTracker, LikeButton, CommentSection } from "./PostClientComponents"; 
import PostActionButtons from "./PostActionButtons";
import ReactMarkdown from "react-markdown";

const formatDateTime = (dateString: string) => {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

// ⭐️ "use client" 제거, Next.js 15+ 맞춤 Promise 파라미터 적용
export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 1. 게시글 데이터 가져오기 (서버)
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(`*, profiles:author_id (nickname)`)
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return <div className="p-20 text-center font-bold">게시글을 찾을 수 없거나 삭제되었습니다.</div>;
  }

  // 2. 댓글 데이터 가져오기 (서버)
  const { data: comments } = await supabase
    .from("comments")
    .select(`id, content, created_at, author_id, parent_id, profiles:author_id (nickname)`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  // 3. 좋아요 수 가져오기 (서버)
  const { count: likesCount } = await supabase
    .from("likes")
    .select("*", { count: 'exact', head: true })
    .eq("post_id", postId);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-12 lg:py-20 space-y-6 md:space-y-8">
      
      {/* ⭐️ 접속 시 조회수를 올려주는 숨겨진 클라이언트 컴포넌트 */}
      <ViewTracker postId={postId} />

      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between pb-4 border-b-4 border-[#222222] dark:border-[#444444]">
        <h1 className="text-2xl font-black text-[#222222] dark:text-[#EAEAEA] flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">tag</span>
          {post.board_type}
        </h1>
        <Link href="/community" className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">list</span> 목록으로
        </Link>
      </div>

      {/* 게시글 본문 영역 */}
      <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] transition-colors">
        
        <div className="p-4 sm:p-6 border-b-2 border-[#E5E4E0] dark:border-[#333333]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-black px-2 py-0.5 border-2 border-[#222222] dark:border-[#A0A0A0] text-[#222222] dark:text-[#EAEAEA]">
              {post.board_type.replace("게시판", "").substring(0, 2)}
            </span>
          </div>
          <h2 className="text-xl md:text-3xl font-black text-[#222222] dark:text-[#EAEAEA] leading-snug flex items-center gap-2">
            {post.is_resolved && (
              <span className="bg-blue-600 text-white text-sm px-2 py-1 font-black whitespace-nowrap shadow-[2px_2px_0px_#222222] border-2 border-[#222222] dark:border-transparent">
                해결됨
              </span>
            )}
            {post.title}
          </h2>
        </div>

        <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] font-black flex items-center justify-center text-sm">
              {post.profiles?.nickname ? post.profiles.nickname.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] flex items-center gap-1 cursor-pointer hover:underline">
                {post.profiles?.nickname || "익명"} 
                <span className="bg-blue-600 text-white px-1 py-0.5 text-[8px] font-black tracking-widest rounded-sm ml-1">
                  디자이너
                </span>
              </p>
              <p className="text-[11px] font-bold text-[#A0A0A0] dark:text-[#666666]">
                {formatDateTime(post.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-[#A0A0A0] dark:text-[#666666]">
            {/* 서버에서 바로 꽂아준 진짜 조회수와 댓글 수 */}
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">visibility</span> 조회 {post.view_count || 0}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">chat_bubble</span> 댓글 {(comments || []).length}</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 min-h-[200px] md:min-h-[300px] text-[15px] md:text-[16px] leading-relaxed text-[#222222] dark:text-[#EAEAEA] font-medium">
          {/* WYSIWYG 에디터가 생성한 순수 HTML을 그대로 렌더링합니다 */}
          <div 
            className="wysiwyg-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {/* WYSIWYG 스타일 대응 */}
          <style dangerouslySetInnerHTML={{__html: `
            .wysiwyg-content p { margin-bottom: 1.25rem; white-space: pre-wrap; }
            .wysiwyg-content strong { font-weight: 900; }
            .wysiwyg-content em { font-style: italic; }
            .wysiwyg-content u { text-decoration: underline; }
            .wysiwyg-content img { max-width: 100%; border-radius: 0.375rem; border: 2px solid #222222; box-shadow: 4px 4px 0px #222222; margin: 1.5rem 0; }
            .dark .wysiwyg-content img { border-color: #444444; box-shadow: 4px 4px 0px #111111; }
            .wysiwyg-content h1 { font-size: 2.25rem; font-weight: 900; margin-top: 2rem; margin-bottom: 1rem; }
            .wysiwyg-content h2 { font-size: 1.875rem; font-weight: 900; margin-top: 2rem; margin-bottom: 1rem; }
          `}} />
        </div>

        {/* ⭐️ 좋아요 버튼 (클라이언트 컴포넌트) */}
        <LikeButton postId={postId} initialLikes={likesCount || 0} initialUser={user} />
      </div>

      {/* ⭐️ 작성자 전용 액션 (클라이언트 컴포넌트) */}
      {user?.id === post.author_id && (
        <PostActionButtons postId={postId} />
      )}

      {/* ⭐️ 댓글 섹션 (클라이언트 컴포넌트) */}
      <CommentSection 
        postId={postId} 
        initialComments={comments || []} 
        boardType={post.board_type}
        postAuthorId={post.author_id}
        isResolved={post.is_resolved}
        initialUser={user}
      />

    </div>
  );
}