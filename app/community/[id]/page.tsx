"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// 날짜 포맷 함수
const formatDateTime = (dateString: string) => {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  // Next.js params.id는 배열일 수 있으므로 문자열로 변환
  const postId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 임시 더미 상태 (추후 좋아요 기능 DB 연동 시 교체)
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // 1. 게시글 및 댓글 데이터 가져오기
  useEffect(() => {
    if (!postId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        // ⭐️ 게시글 가져오기: role_tag 제거
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select(`
            *,
            profiles:author_id (nickname)
          `)
          .eq("id", postId)
          .single();

        if (postError) throw postError;
        setPost(postData);

        // ⭐️ 댓글 가져오기: role_tag 제거
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select(`
            id,
            content,
            created_at,
            author_id,
            profiles:author_id (nickname)
          `)
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (!commentsError && commentsData) {
          setComments(commentsData);
        }
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        alert("게시글을 불러올 수 없습니다.");
        router.replace("/community");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId, router]);

  // 2. 댓글 작성 로직
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }
    if (!commentInput.trim()) return alert("댓글 내용을 입력해주세요.");

    setIsSubmitting(true);
    try {
      // ⭐️ 댓글 등록 후 받아올 때도 role_tag 제거
      const { data: newComment, error } = await supabase
        .from("comments")
        .insert([
          {
            post_id: postId,
            author_id: currentUser.id,
            content: commentInput
          }
        ])
        .select(`
          id,
          content,
          created_at,
          author_id,
          profiles:author_id (nickname)
        `)
        .single();

      if (error) throw error;

      // 작성 성공 시 화면에 즉시 반영
      setComments((prev) => [...prev, newComment]);
      setCommentInput("");
    } catch (error) {
      console.error("댓글 작성 에러:", error);
      alert("댓글 작성 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeToggle = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <span className="animate-spin material-symbols-outlined text-4xl text-[#A0A0A0]">sync</span>
        <p className="font-bold text-[#A0A0A0] text-sm tracking-widest uppercase">게시글 불러오는 중...</p>
      </div>
    );
  }

  if (!post) return null; // 에러 시 빈 화면 후 라우팅

  // 현재 유저가 글 작성자인지 확인
  const isAuthor = currentUser?.id === post.author_id;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-8">
      
      {/* 상단 네비게이션 및 게시판 이름 */}
      <div className="flex items-center justify-between pb-4 border-b-4 border-[#222222] dark:border-[#444444]">
        <h1 className="text-2xl font-black text-[#222222] dark:text-[#EAEAEA] flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">tag</span>
          {post.board_type}
        </h1>
        <Link href="/community" className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">list</span> 목록으로
        </Link>
      </div>

      {/* 게시글 헤더 */}
      <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] transition-colors">
        
        <div className="p-6 border-b-2 border-[#E5E4E0] dark:border-[#333333]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-black px-2 py-0.5 border-2 border-[#222222] dark:border-[#A0A0A0] text-[#222222] dark:text-[#EAEAEA]">
              {post.board_type.replace("게시판", "").substring(0, 2)}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#222222] dark:text-[#EAEAEA] leading-snug">
            {post.title}
          </h2>
        </div>

        {/* 작성자 및 통계 정보 */}
        <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] font-black flex items-center justify-center text-sm">
              {post.profiles?.nickname ? post.profiles.nickname.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] flex items-center gap-1 cursor-pointer hover:underline">
                {post.profiles?.nickname || "익명"} 
                {/* ⭐️ 하드코딩된 디자이너 뱃지 유지 */}
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
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">visibility</span> 조회 0</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">chat_bubble</span> 댓글 {comments.length}</span>
          </div>
        </div>

        {/* 본문 내용 영역 */}
        <div className="p-8 min-h-[300px] text-[15px] leading-relaxed text-[#222222] dark:text-[#EAEAEA] font-medium whitespace-pre-wrap">
          {post.content}
        </div>

        {/* 추천(좋아요) 버튼 */}
        <div className="flex justify-center py-10 border-t-2 border-dashed border-[#E5E4E0] dark:border-[#333333]">
          <button 
            onClick={handleLikeToggle}
            className={`flex flex-col items-center justify-center w-24 h-24 border-2 transition-all hover:-translate-y-1 ${
              liked 
                ? 'border-blue-600 bg-blue-50 dark:bg-[#1A233A] text-blue-600 dark:text-blue-400 shadow-[4px_4px_0px_#2563eb]' 
                : 'border-[#222222] dark:border-[#EAEAEA] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#EAEAEA]'
            }`}
          >
            <span className={`material-symbols-outlined text-3xl mb-1 ${liked ? 'fill-current' : ''}`}>
              thumb_up
            </span>
            <span className="font-black text-lg">{likesCount}</span>
          </button>
        </div>
      </div>

      {/* 액션 버튼 (작성자 본인에게만 노출) */}
      {isAuthor && (
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
            수정
          </button>
          <button 
            onClick={async () => {
              if (confirm("정말 이 글을 삭제하시겠습니까?")) {
                await supabase.from("posts").delete().eq("id", post.id);
                router.push("/community");
              }
            }}
            className="px-4 py-2 border-2 border-red-600 bg-white dark:bg-[#1E1E1E] text-red-600 text-sm font-bold hover:bg-red-50 dark:hover:bg-[#3A1A1A] transition-colors"
          >
            삭제
          </button>
        </div>
      )}

      {/* 댓글 영역 */}
      <div className="pt-8">
        <h3 className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] mb-4 flex items-center gap-2">
          댓글 <span className="text-blue-600 dark:text-blue-400">{comments.length}</span>
        </h3>

        {/* 댓글 입력 폼 */}
        <form onSubmit={handleCommentSubmit} className="flex flex-col md:flex-row gap-2 mb-8">
          <textarea 
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder={currentUser ? "상호 존중하는 댓글 문화를 만들어가요." : "로그인 후 댓글을 작성할 수 있습니다."}
            disabled={!currentUser}
            className="flex-1 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] p-4 resize-none h-24 outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] transition-shadow placeholder-[#A0A0A0] dark:placeholder-[#666666] font-medium disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={isSubmitting || !currentUser}
            className="md:w-32 bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] font-black text-sm py-4 md:py-0 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <span className="animate-spin material-symbols-outlined text-[18px]">sync</span> : null}
            등록
          </button>
        </form>

        {/* 댓글 리스트 */}
        <div className="border-t-2 border-[#222222] dark:border-[#444444]">
          {comments.length === 0 ? (
             <div className="py-12 text-center text-sm font-bold text-[#A0A0A0]">
               아직 작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!
             </div>
          ) : (
            comments.map((comment) => {
              const isCommentAuthor = post.author_id === comment.author_id;
              return (
                <div 
                  key={comment.id} 
                  className={`py-6 border-b border-[#E5E4E0] dark:border-[#333333] ${isCommentAuthor ? 'bg-blue-50/50 dark:bg-[#1A233A]/30 px-4 -mx-4' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#222222] dark:text-[#EAEAEA] text-sm">
                        {comment.profiles?.nickname || "익명"}
                      </span>
                      {isCommentAuthor && (
                        <span className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] px-1.5 py-0.5 text-[9px] font-black tracking-widest border border-[#222222] dark:border-[#EAEAEA]">
                          작성자
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-[#A0A0A0] dark:text-[#666666]">
                      {formatDateTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#222222] dark:text-[#EAEAEA] font-medium leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}