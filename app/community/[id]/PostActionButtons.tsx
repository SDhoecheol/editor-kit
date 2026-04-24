"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost, toggleHidePost } from "../actions";

export default function PostActionButtons({ 
  postId, 
  isHidden, 
  currentUserRole, 
  isAuthor 
}: { 
  postId: string, 
  isHidden: boolean, 
  currentUserRole: string, 
  isAuthor: boolean 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm("정말 이 글을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) {
      startTransition(async () => {
        // 서버 액션 호출 (리턴값으로 성공/실패 여부 판단)
        const result = await deletePost(postId);
        if (result.success) {
          alert(result.message);
          router.push("/community");
          router.refresh();
        } else {
          alert(result.message);
        }
      });
    }
  };

  const handleToggleHide = () => {
    const actionName = isHidden ? "숨김 해제" : "숨기기";
    if (window.confirm(`이 글을 ${actionName} 하시겠습니까?`)) {
      startTransition(async () => {
        const result = await toggleHidePost(postId);
        if (result.success) {
          alert(`게시글이 ${actionName} 되었습니다.`);
        } else {
          alert(result.message);
        }
      });
    }
  };

  return (
    <div className="flex justify-end gap-3 mt-6">
      {(currentUserRole === "admin" || currentUserRole === "manager") && (
        <button 
          onClick={handleToggleHide}
          disabled={isPending}
          className="px-5 py-2.5 border-2 border-[#222222] bg-[#EAEAEA] dark:bg-[#333333] text-[#222222] dark:text-[#EAEAEA] text-sm font-black shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#222222] transition-all disabled:opacity-50"
        >
          {isHidden ? "숨김 해제" : "숨기기"}
        </button>
      )}
      
      {isAuthor && (
        <button 
          onClick={() => router.push(`/community/edit/${postId}`)}
        disabled={isPending}
        className="px-5 py-2.5 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] text-sm font-black shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#222222] dark:hover:shadow-[2px_2px_0px_#111111] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        수정
      </button>
      )}
      
      {(isAuthor || currentUserRole === "admin" || currentUserRole === "manager") && (
        <button 
          onClick={handleDelete} 
          disabled={isPending}
          className="px-5 py-2.5 border-2 border-[#E11D48] bg-white dark:bg-[#1E1E1E] text-[#E11D48] text-sm font-black shadow-[4px_4px_0px_#E11D48] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E11D48] transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {isPending && <span className="animate-spin material-symbols-outlined text-[16px]">sync</span>}
          {isPending ? "삭제 중..." : "삭제"}
        </button>
      )}
    </div>
  );
}
