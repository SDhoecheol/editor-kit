"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "../actions";

export default function PostActionButtons({ postId }: { postId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm("정말 이 글을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) {
      startTransition(async () => {
        // 서버 액션 호출: 성공 시 액션 내부에서 redirect가 발생하며,
        // 실패 시에만 에러 객체를 반환합니다.
        const result = await deletePost(postId);
        if (result && !result.success) {
          alert(result.message);
        }
      });
    }
  };

  return (
    <div className="flex justify-end gap-3 mt-6">
      <button 
        onClick={() => router.push(`/community/edit/${postId}`)}
        disabled={isPending}
        className="px-5 py-2.5 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] text-sm font-black shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#222222] dark:hover:shadow-[2px_2px_0px_#111111] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        수정
      </button>
      <button 
        onClick={handleDelete} 
        disabled={isPending}
        className="px-5 py-2.5 border-2 border-[#E11D48] bg-white dark:bg-[#1E1E1E] text-[#E11D48] text-sm font-black shadow-[4px_4px_0px_#E11D48] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E11D48] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        {isPending && <span className="animate-spin material-symbols-outlined text-[16px]">sync</span>}
        {isPending ? "삭제 중..." : "삭제"}
      </button>
    </div>
  );
}
