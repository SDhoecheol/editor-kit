"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { deletePost, incrementViewCount, toggleLikeAction } from "../actions"; // ⭐️ 서버 액션 불러오기

// 1. 조회수 증가 트래커 (페이지 접속 시 1회 실행)
export function ViewTracker({ postId }: { postId: string }) {
  const router = useRouter();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    
    const trackView = async () => {
      const viewed = sessionStorage.getItem(`viewed_${postId}`);
      if (!viewed) {
        hasTracked.current = true; // Strict Mode 중복 방지
        // DB 조회수 증가 (서버 액션)
        await incrementViewCount(postId);
        // 중복 카운트 방지 메모
        sessionStorage.setItem(`viewed_${postId}`, "true"); 
        // 클라이언트 라우터 리프레시로 즉각적인 화면 갱신
        router.refresh(); 
      }
    };
    trackView();
  }, [postId, router]);
  return null; 
}

// 3. 추천(좋아요) 버튼
export function LikeButton({ postId, initialLikes, initialUser }: { postId: string, initialLikes: number, initialUser?: any }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [user, setUser] = useState<any>(initialUser || null);
  const [isLiking, setIsLiking] = useState(false);

  // ⭐️ 서버 상태 동기화로 버그 해결
  useEffect(() => {
    setUser(initialUser || null);
  }, [initialUser]);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (initialUser) {
        const { data } = await supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", initialUser.id).maybeSingle();
        if (data) setLiked(true);
      }
    };
    fetchLikeStatus();
  }, [postId, initialUser]);

  const handleToggleLike = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (isLiking) return;
    
    setIsLiking(true);
    // UI 즉각 반영 (낙관적 업데이트)
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);

    try {
      const result = await toggleLikeAction(postId);
      if (!result.success) {
        // 서버 액션 실패 시 롤백
        alert(result.message);
        setLiked(liked);
        setLikesCount(prev => liked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error(error);
      // 통신 오류 시 롤백
      setLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
      router.refresh();
    }
  };

  return (
    <div className="flex justify-center py-6 md:py-10 border-t-2 border-dashed border-[#E5E4E0] dark:border-[#333333]">
      <button onClick={handleToggleLike} className={`flex flex-col items-center justify-center w-24 h-24 border-2 transition-all hover:-translate-y-1 ${liked ? 'border-blue-600 bg-blue-50 dark:bg-[#1A233A] text-blue-600 dark:text-blue-400 shadow-[4px_4px_0px_#2563eb]' : 'border-[#222222] dark:border-[#EAEAEA] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#EAEAEA]'}`}>
        <span className={`material-symbols-outlined text-3xl mb-1 ${liked ? 'fill-current' : ''}`}>thumb_up</span>
        <span className="font-black text-lg">{likesCount}</span>
      </button>
    </div>
  );
}

// 4. 댓글 섹션 (폼 + 리스트)
export function CommentSection({ 
  postId, 
  initialComments,
  boardType,
  postAuthorId,
  isResolved,
  initialUser,
  currentUserRole
}: { 
  postId: string, 
  initialComments: any[],
  boardType?: string,
  postAuthorId?: string,
  isResolved?: boolean,
  initialUser?: any,
  currentUserRole?: string
}) {
  const [comments, setComments] = useState(initialComments);
  const [commentInput, setCommentInput] = useState("");
  const [replyInput, setReplyInput] = useState("");
  const [user, setUser] = useState<any>(initialUser || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const router = useRouter();

  // ⭐️ 서버 상태 동기화로 버그 해결
  useEffect(() => {
    setUser(initialUser || null);
  }, [initialUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("로그인 후 댓글을 작성할 수 있습니다.");
    if (!commentInput.trim()) return;

    setIsSubmitting(true);
    try {
      const { createComment } = await import("../actions");
      const result = await createComment(postId, commentInput);
      
      if (!result.success) throw new Error(result.message);
      
      setComments([...comments, result.comment]);
      setCommentInput("");
    } catch (error: any) {
      alert(error.message || "댓글 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!user) return alert("로그인 후 답글을 작성할 수 있습니다.");
    if (!replyInput.trim()) return;

    setIsSubmitting(true);
    try {
      const { createComment } = await import("../actions");
      const result = await createComment(postId, replyInput, parentId);
      
      if (!result.success) throw new Error(result.message);
      
      setComments([...comments, result.comment]);
      setReplyInput("");
      setReplyingTo(null);
    } catch (error: any) {
      alert(error.message || "답글 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (commentAuthorId: string) => {
    if (confirm("이 답변을 채택하시겠습니까? (채택 후 취소할 수 없습니다)")) {
      try {
        const { resolvePost } = await import("../actions");
        const result = await resolvePost(postId, postAuthorId!, commentAuthorId);
        if (result.success) {
          alert(result.message);
          router.refresh(); // Next.js App Router에 맞게 서버 컴포넌트 갱신
        } else {
          alert(result.message);
        }
      } catch (error: any) {
        alert(error.message || "채택 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleToggleHideComment = async (commentId: string, currentHidden: boolean) => {
    const actionName = currentHidden ? "숨김 해제" : "숨기기";
    if (confirm(`이 댓글을 ${actionName} 하시겠습니까?`)) {
      try {
        const { toggleHideComment } = await import("../actions");
        const result = await toggleHideComment(commentId, postId);
        if (result.success) {
          setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_hidden: result.isHidden } : c));
          alert(`댓글이 ${actionName} 되었습니다.`);
        } else {
          alert(result.message);
        }
      } catch (error: any) {
        alert("오류가 발생했습니다.");
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("이 댓글을 영구적으로 삭제하시겠습니까?")) {
      try {
        const { deleteComment } = await import("../actions");
        const result = await deleteComment(commentId, postId);
        if (result.success) {
          setComments(prev => prev.filter(c => c.id !== commentId));
          alert(result.message);
        } else {
          alert(result.message);
        }
      } catch (error: any) {
        alert("오류가 발생했습니다.");
      }
    }
  };

  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="pt-8">
      <h3 className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] mb-4 flex items-center gap-2">
        댓글 <span className="text-blue-600 dark:text-blue-400">{comments.length}</span>
      </h3>
      
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 mb-6 md:mb-8">
        <textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder={user ? "상호 존중하는 댓글 문화를 만들어가요." : "로그인 후 댓글을 작성할 수 있습니다."} disabled={!user} className="flex-1 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] p-4 resize-none h-24 outline-none disabled:opacity-50 font-medium" />
        <button type="submit" disabled={isSubmitting || !user} className="md:w-32 bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] font-black text-sm py-4 md:py-0 disabled:opacity-50">등록</button>
      </form>
      
      <div className="border-t-2 border-[#222222] dark:border-[#444444]">
        {rootComments.map((comment) => (
          <div key={comment.id} className="py-6 border-b border-[#E5E4E0] dark:border-[#333333]">
            
            {/* 부모 댓글 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#222222] dark:text-[#EAEAEA] text-sm">{comment.profiles?.nickname || "익명"}</span>
                {boardType === "Q&A" && user?.id === postAuthorId && !isResolved && (
                  <button 
                    onClick={() => handleResolve(comment.author_id)}
                    className="ml-2 px-2 py-0.5 text-[10px] font-black bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] text-[#222222] dark:text-[#EAEAEA] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#EAEAEA] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    채택하기
                  </button>
                )}
              </div>
              <span className="text-[11px] font-bold text-[#A0A0A0]">
                {new Date(comment.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {comment.is_hidden && currentUserRole !== 'admin' && currentUserRole !== 'manager' ? (
              <p className="text-[14px] text-[#A0A0A0] font-bold italic mb-3">🚫 숨김 처리된 댓글입니다.</p>
            ) : (
              <>
                {comment.is_hidden && (
                  <span className="text-xs text-red-500 font-bold mb-1 block">[숨김 처리됨]</span>
                )}
                <p className="text-[14px] text-[#222222] dark:text-[#EAEAEA] font-medium whitespace-pre-wrap mb-3">{comment.content}</p>
              </>
            )}

            {/* 하단 버튼 (답글 달기 및 관리자 액션) */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                  setReplyInput("");
                }}
                className="text-[12px] font-bold text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">reply</span> 답글 달기
              </button>
              {(currentUserRole === "admin" || currentUserRole === "manager" || user?.id === comment.author_id) && (
                <button 
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-[12px] font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  삭제
                </button>
              )}
              {(currentUserRole === "admin" || currentUserRole === "manager") && (
                <button 
                  onClick={() => handleToggleHideComment(comment.id, comment.is_hidden)}
                  className="text-[12px] font-bold text-orange-500 hover:text-orange-700 transition-colors"
                >
                  {comment.is_hidden ? "숨김 해제" : "숨기기"}
                </button>
              )}
            </div>

            {/* 대댓글(답글) 리스트 */}
            {getReplies(comment.id).length > 0 && (
              <div className="mt-4 pl-4 md:pl-8 border-l-2 border-[#E5E4E0] dark:border-[#333333] space-y-4">
                {getReplies(comment.id).map(reply => (
                  <div key={reply.id} className="pt-4 border-t border-[#E5E4E0] dark:border-[#333333] first:border-0 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#222222] dark:text-[#EAEAEA] text-[13px]">{reply.profiles?.nickname || "익명"}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-[#A0A0A0]">
                          {new Date(reply.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {(currentUserRole === "admin" || currentUserRole === "manager" || user?.id === reply.author_id) && (
                          <button onClick={() => handleDeleteComment(reply.id)} className="text-[10px] text-red-500 hover:underline">삭제</button>
                        )}
                        {(currentUserRole === "admin" || currentUserRole === "manager") && (
                          <button onClick={() => handleToggleHideComment(reply.id, reply.is_hidden)} className="text-[10px] text-orange-500 hover:underline">{reply.is_hidden ? "해제" : "숨김"}</button>
                        )}
                      </div>
                    </div>
                    {reply.is_hidden && currentUserRole !== 'admin' && currentUserRole !== 'manager' ? (
                      <p className="text-[13px] text-[#A0A0A0] font-bold italic">🚫 숨김 처리됨</p>
                    ) : (
                      <>
                        {reply.is_hidden && <span className="text-[10px] text-red-500 font-bold block">[숨김]</span>}
                        <p className="text-[13px] text-[#222222] dark:text-[#EAEAEA] font-medium whitespace-pre-wrap">{reply.content}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 대댓글 입력 폼 */}
            {replyingTo === comment.id && (
              <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-4 pl-4 md:pl-8 border-l-2 border-[#E5E4E0] dark:border-[#333333] flex flex-col md:flex-row gap-2 transition-all">
                <textarea value={replyInput} onChange={(e) => setReplyInput(e.target.value)} placeholder="답글을 작성해보세요." disabled={!user} className="flex-1 border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#1A1A1A] text-[#222222] dark:text-[#EAEAEA] p-3 text-[13px] resize-none h-16 outline-none disabled:opacity-50 font-medium" />
                <button type="submit" disabled={isSubmitting || !user} className="md:w-20 bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] font-black text-[12px] py-2 disabled:opacity-50">등록</button>
              </form>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}