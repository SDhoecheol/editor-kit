"use client";

import { useState } from "react";
import { deleteAnyPost } from "../actions";

export default function PostsAdminClient({ initialPosts }: { initialPosts: any[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length && posts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`정말 ${selectedIds.size}개의 게시물을 강제로 삭제하시겠습니까? (이 작업은 되돌릴 수 없으며 댓글도 함께 삭제됩니다)`)) return;

    setIsDeleting(true);
    const result = await deleteAnyPost(Array.from(selectedIds));
    
    if (result.success) {
      setPosts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      alert("삭제되었습니다.");
    } else {
      alert(`삭제 실패: ${result.error}\n(만약 RLS 제약조건에 걸렸다면 Supabase 대시보드에서 admin/manager의 delete 권한을 허용해 주어야 합니다)`);
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-4">
      {/* 액션 바 */}
      <div className="flex justify-between items-center bg-white dark:bg-[#1E1E1E] p-4 border-4 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleSelectAll}
            className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] underline underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {selectedIds.size === posts.length && posts.length > 0 ? "선택 해제" : "전체 선택"}
          </button>
          <span className="text-[#A0A0A0] dark:text-[#666666] text-sm">
            ({selectedIds.size}개 선택됨)
          </span>
        </div>
        
        <button
          onClick={handleDeleteSelected}
          disabled={isDeleting || selectedIds.size === 0}
          className="bg-red-500 text-white border-2 border-[#222222] dark:border-transparent px-4 py-2 font-black text-sm shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isDeleting ? (
            <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">delete_forever</span>
          )}
          선택 삭제
        </button>
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] overflow-x-auto shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111]">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-[#222222] dark:bg-[#333333] text-[#F5F4F0] dark:text-[#EAEAEA] border-b-4 border-[#222222] dark:border-[#444444]">
            <tr>
              <th className="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === posts.length && posts.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[#222222]"
                />
              </th>
              <th className="p-4 font-black">구분</th>
              <th className="p-4 font-black w-1/2">제목</th>
              <th className="p-4 font-black">작성자</th>
              <th className="p-4 font-black">작성일</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#A0A0A0] dark:text-[#666666] font-bold">
                  게시물이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr 
                  key={post.id} 
                  className="border-b-2 border-[#E5E4E0] dark:border-[#333333] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="w-4 h-4 accent-[#222222]"
                    />
                  </td>
                  <td className="p-4 text-sm font-bold text-[#A0A0A0] dark:text-[#888888]">
                    {post.board_type.replace("게시판", "")}
                  </td>
                  <td className="p-4 font-black text-[#222222] dark:text-[#EAEAEA] truncate max-w-[300px]">
                    <a href={`/community/${post.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {post.title}
                    </a>
                  </td>
                  <td className="p-4 text-sm font-bold text-[#222222] dark:text-[#EAEAEA]">
                    {post.profiles?.nickname || "Unknown"}
                  </td>
                  <td className="p-4 text-sm text-[#A0A0A0] dark:text-[#666666] font-mono">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
