"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// 1. 조회수 증가 트래커 (페이지 접속 시 1회 실행)
export function ViewTracker({ postId }: { postId: string }) {
  const router = useRouter(); // ⭐️ 라우터 추가

  useEffect(() => {
    const trackView = async () => {
      const viewed = sessionStorage.getItem(`viewed_${postId}`);
      if (!viewed) {
        // DB 조회수 증가
        await supabase.rpc("increment_view_count", { p_id: postId });
        // 중복 카운트 방지 메모
        sessionStorage.setItem(`viewed_${postId}`, "true"); 
        // ⭐️ 추가: DB에 조회수가 올랐으니, 서버 컴포넌트에게 최신 데이터를 가져오라고 찌름 (즉시 반영)
        router.refresh(); 
      }
    };
    trackView();
  }, [postId, router]);
  return null; 
}

// 2. 작성자 전용 액션 (수정/삭제)
export function PostActions({ postId, authorId }: { postId: string, authorId: string }) {
  const router = useRouter();
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    const checkAuthor = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id === authorId) setIsAuthor(true);
    };
    checkAuthor();
  }, [authorId]);

  if (!isAuthor) return null;

  const handleDelete = async () => {
    if (confirm("정말 이 글을 삭제하시겠습니까?")) {
      await supabase.from("posts").delete().eq("id", postId);
      router.push("/community");
      router.refresh();
    }
  };

  return (
    <div className="flex justify-end gap-2 mt-6">
      <button className="px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
        수정
      </button>
      <button onClick={handleDelete} className="px-4 py-2 border-2 border-red-600 bg-white dark:bg-[#1E1E1E] text-red-600 text-sm font-bold hover:bg-red-50 dark:hover:bg-[#3A1A1A] transition-colors">
        삭제
      </button>
    </div>
  );
}

// 3. 추천(좋아요) 버튼
export function LikeButton({ postId, initialLikes }: { postId: string, initialLikes: number }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", session.user.id).single();
        if (data) setLiked(true);
      }
    };
    fetchLikeStatus();
  }, [postId]);

  const handleToggleLike = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    
    if (liked) {
      setLiked(false);
      setLikesCount((prev) => prev - 1);
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);
      await supabase.from("likes").insert([{ post_id: postId, user_id: user.id }]);
    }
  };

  return (
    <div className="flex justify-center py-10 border-t-2 border-dashed border-[#E5E4E0] dark:border-[#333333]">
      <button onClick={handleToggleLike} className={`flex flex-col items-center justify-center w-24 h-24 border-2 transition-all hover:-translate-y-1 ${liked ? 'border-blue-600 bg-blue-50 dark:bg-[#1A233A] text-blue-600 dark:text-blue-400 shadow-[4px_4px_0px_#2563eb]' : 'border-[#222222] dark:border-[#EAEAEA] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#EAEAEA]'}`}>
        <span className={`material-symbols-outlined text-3xl mb-1 ${liked ? 'fill-current' : ''}`}>thumb_up</span>
        <span className="font-black text-lg">{likesCount}</span>
      </button>
    </div>
  );
}

// 4. 댓글 섹션 (폼 + 리스트)
export function CommentSection({ postId, initialComments }: { postId: string, initialComments: any[] }) {
  const [comments, setComments] = useState(initialComments);
  const [commentInput, setCommentInput] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("로그인 후 댓글을 작성할 수 있습니다.");
    if (!commentInput.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: newComment, error } = await supabase.from("comments").insert([{ post_id: postId, author_id: user.id, content: commentInput }]).select(`id, content, created_at, author_id, profiles:author_id (nickname)`).single();
      if (error) throw error;
      setComments([...comments, newComment]);
      setCommentInput("");
    } catch (error) {
      alert("댓글 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-8">
      <h3 className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] mb-4 flex items-center gap-2">
        댓글 <span className="text-blue-600 dark:text-blue-400">{comments.length}</span>
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 mb-8">
        <textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder={user ? "상호 존중하는 댓글 문화를 만들어가요." : "로그인 후 댓글을 작성할 수 있습니다."} disabled={!user} className="flex-1 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] p-4 resize-none h-24 outline-none disabled:opacity-50 font-medium" />
        <button type="submit" disabled={isSubmitting || !user} className="md:w-32 bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] font-black text-sm py-4 md:py-0 disabled:opacity-50">등록</button>
      </form>
      <div className="border-t-2 border-[#222222] dark:border-[#444444]">
        {comments.map((comment) => (
          <div key={comment.id} className="py-6 border-b border-[#E5E4E0] dark:border-[#333333]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#222222] dark:text-[#EAEAEA] text-sm">{comment.profiles?.nickname || "익명"}</span>
              </div>
              <span className="text-[11px] font-bold text-[#A0A0A0]">
                {new Date(comment.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-[14px] text-[#222222] dark:text-[#EAEAEA] font-medium whitespace-pre-wrap">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}