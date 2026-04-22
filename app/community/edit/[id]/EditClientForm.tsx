"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updatePost } from "../../actions";
import { supabase } from "@/lib/supabase";
import TiptapEditor from "@/components/TiptapEditor";

const SUB_CATEGORIES: Record<string, string[]> = {
  "공지사항": ["안내", "업데이트", "이벤트"],
  "자유게시판": ["일반", "정보/팁", "질문", "한탄"],
  "익명게시판": ["일반", "정보/팁", "질문", "한탄"],
  "고민상담": ["일반", "이직/취업", "연봉", "인간관계"],
  "포트폴리오": ["패키지", "편집", "브랜딩", "웹/앱"],
  "Q&A": ["인쇄", "디자인", "기획", "기타"],
  "자료실": ["템플릿", "목업", "플러그인/액션", "기타"],
};

export default function EditClientForm({ initialData, postId }: { initialData: any, postId: string }) {
  const router = useRouter();
  const boardName = initialData.board_type || "자유게시판";
  const subCats = SUB_CATEGORIES[boardName] || SUB_CATEGORIES["자유게시판"];

  let defaultTitle = initialData.title || "";
  let defaultSubCat = "";
  const match = defaultTitle.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    defaultSubCat = match[1];
    defaultTitle = match[2]; 
  }

  const [subCategory, setSubCategory] = useState(defaultSubCat);
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState<string>(initialData.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미지 업로드 로직
  const handleImageUpload = async (file: File): Promise<string> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("로그인이 필요합니다.");

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("post_images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("post_images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmpty = !content || content === '<p><br></p>';
    if (!title.trim() || isEmpty) return alert("제목과 내용을 모두 입력해주세요.");
    
    setIsSubmitting(true);
    
    const finalTitle = subCategory ? `[${subCategory}] ${title}` : title;
    
    try {
      const result = await updatePost(postId, finalTitle, content, boardName, subCategory, false);
      if (result.success) {
        alert(result.message);
        router.push(`/community/${postId}`); 
        router.refresh();
      } else {
        alert(result.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("수정 중 에러 발생:", error);
      alert("글을 수정하는 중 예기치 못한 문제가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-8">
      
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
            수정 모드
          </span>
          <span className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] tracking-widest">
            게시글 수정 중
          </span>
        </div>
        <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight flex items-center gap-3">
          <span className="text-[#222222] dark:text-[#EAEAEA]">{boardName}</span>
          <span className="text-blue-600 dark:text-blue-400">수정하기</span>
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="shrink-0 md:w-48 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] transition-colors relative">
            <select 
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full h-full px-4 py-3.5 bg-transparent font-bold text-[#222222] dark:text-[#EAEAEA] outline-none appearance-none cursor-pointer"
            >
              <option value="">말머리 (선택)</option>
              {subCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A0A0A0]">expand_more</span>
          </div>

          <div className="flex-1 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] transition-colors">
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요." 
              className="w-full h-full px-4 py-3.5 bg-transparent font-black text-[#222222] dark:text-[#EAEAEA] outline-none placeholder-[#A0A0A0] dark:placeholder-[#666666]" 
              required
            />
          </div>
        </div>

        {/* WYSIWYG 에디터 적용 */}
        <div className="shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] transition-colors">
          <TiptapEditor 
            value={content}
            onChange={setContent}
            onImageUpload={handleImageUpload}
          />
        </div>

        <div className="flex items-center justify-between pt-6 border-t-4 border-[#222222] dark:border-[#444444]">
          <Link href={`/community/${postId}`} className="px-6 py-3 font-bold text-[#666666] hover:text-[#222222] transition-colors">
            수정 취소
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-[#222222] text-[#F5F4F0] border-2 border-[#222222] px-10 py-3.5 font-black shadow-[4px_4px_0px_#E5E4E0] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined text-[18px]">edit_document</span>}
            {isSubmitting ? "수정 중..." : "수정 완료"}
          </button>
        </div>
      </form>
    </div>
  );
}