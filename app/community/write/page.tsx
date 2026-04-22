"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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

function WriteEditorForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const boardName = searchParams?.get("board") || "자유게시판";
  const subCats = SUB_CATEGORIES[boardName] || SUB_CATEGORIES["자유게시판"];

  const [subCategory, setSubCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string>(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미지 업로드 로직 (TiptapEditor에 전달됨)
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
    
    if (!subCategory) return alert("해당 게시판 전용 말머리를 반드시 선택해주세요.");
    
    // Quill은 빈 내용일 때 '<p><br></p>' 를 반환하므로 이를 필터링
    const isEmpty = !content || content === '<p><br></p>';
    if (!title.trim() || isEmpty) return alert("제목과 내용을 모두 입력해주세요.");
    
    setIsSubmitting(true);
    try {
      const finalTitle = subCategory ? `[${subCategory}] ${title}` : title;
      
      const { createPost } = await import("../actions");
      const result = await createPost(
        finalTitle, 
        content, 
        boardName, 
        subCategory,
        false 
      );

      if (!result.success) {
        throw new Error(result.message);
      }
      
      alert(result.message || `[${boardName}] 게시글이 성공적으로 등록되었습니다.`);
      router.refresh(); 
      router.push("/community");
    } catch (error: any) {
      alert(error.message || "글을 등록하는 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false); 
    } 
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-12 lg:py-20 space-y-6 md:space-y-8">
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black tracking-widest uppercase border-2 border-[#222222] dark:border-transparent">
            에디터킷 라운지
          </span>
          <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">새 게시글 작성</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight flex items-center gap-2 md:gap-3 mt-2">
          <span className="text-blue-600 dark:text-blue-400">{boardName}</span>
          <span>글쓰기</span>
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="shrink-0 md:w-48 bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] shadow-[6px_6px_0px_#222222] dark:shadow-[6px_6px_0px_#111111] transition-all relative group focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[4px_4px_0px_#222222] dark:focus-within:shadow-[4px_4px_0px_#111111]">
            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full h-full px-4 py-4 bg-transparent font-black text-[#222222] dark:text-[#EAEAEA] outline-none appearance-none cursor-pointer" required>
              <option value="" disabled hidden>말머리 (필수)</option>
              {subCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#222222] dark:text-[#EAEAEA] font-black group-hover:translate-y-0 transition-transform">expand_more</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] shadow-[6px_6px_0px_#222222] dark:shadow-[6px_6px_0px_#111111] transition-all focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[4px_4px_0px_#222222] dark:focus-within:shadow-[4px_4px_0px_#111111]">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요." className="w-full h-full px-5 py-4 bg-transparent font-black text-lg text-[#222222] dark:text-[#EAEAEA] outline-none placeholder-[#A0A0A0]" required />
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

        <div className="flex items-center justify-between pt-8 border-t-4 border-[#222222] dark:border-[#444444]">
          <Link href="/community" className="px-6 py-3 font-black text-[#666666] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span> 취소
          </Link>
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white border-4 border-[#222222] dark:border-transparent px-6 md:px-10 py-3 md:py-4 font-black shadow-[4px_4px_0px_#222222] md:shadow-[6px_6px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] dark:md:shadow-[6px_6px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#222222] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center justify-center gap-2 text-base md:text-lg disabled:opacity-50">
            {isSubmitting ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">send</span>}
            {isSubmitting ? "등록 중..." : "글 등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CommunityWritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-4xl text-[#A0A0A0]">sync</span></div>}>
      <WriteEditorForm />
    </Suspense>
  );
}