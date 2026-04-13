"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    // ⭐️ 미들웨어가 비로그인 유저를 이미 막았으므로, 튕겨내는 로직/로딩 화면을 제거했습니다.
    // 글을 DB에 넣을 때 필요한 작성자 정보(user.id, email)만 조용히 가져옵니다.
    const fetchUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user && isMounted) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("유저 정보 로딩 에러:", error);
      }
    };
    
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      alert("사용자 인증 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.");
      return;
    }

    if (!title.trim()) return alert("제목을 입력해주세요.");
    if (!content.trim()) return alert("내용을 입력해주세요.");
    
    setIsSubmitting(true);

    try {
      const finalTitle = subCategory ? `[${subCategory}] ${title}` : title;

      const { error } = await supabase
        .from("posts")
        .insert([
          {
            title: finalTitle,
            content: content,
            board_type: boardName,
            author_id: user.id,
            author_email: user.email,
          }
        ]);

      if (error) throw error;

      alert(`[${boardName}] 게시글이 성공적으로 등록되었습니다.`);
      
      // ⭐️ 글 등록 후 최신 상태를 반영하기 위해 캐시를 날리고 이동
      router.refresh(); 
      router.push("/community");
      
    } catch (error: any) {
      console.error("글 등록 에러:", error.message);
      alert("글을 등록하는 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false); 
    } 
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-8">
      
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">에디터킷 라운지</span>
          <span className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] tracking-widest">새 게시글 작성</span>
        </div>
        <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight flex items-center gap-3">
          <span className="text-blue-600 dark:text-blue-400">{boardName}</span>
          <span>글쓰기</span>
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
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요." className="w-full h-full px-4 py-3.5 bg-transparent font-black text-[#222222] dark:text-[#EAEAEA] outline-none placeholder-[#A0A0A0] dark:placeholder-[#666666]" required
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] transition-colors flex flex-col">
          <div className="border-b-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#2A2A2A] px-4 py-2 flex flex-wrap items-center gap-2">
            <button type="button" className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#E5E4E0] hover:text-[#222222] rounded-sm"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
            <button type="button" className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#E5E4E0] hover:text-[#222222] rounded-sm"><span className="material-symbols-outlined text-[18px]">image</span></button>
          </div>
          <div className="relative min-h-[400px]">
            <textarea 
              value={content} onChange={(e) => setContent(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 bg-transparent font-medium text-[#222222] dark:text-[#EAEAEA] outline-none resize-none leading-relaxed placeholder-[#A0A0A0]" placeholder="내용을 작성해주세요." required
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t-4 border-[#222222] dark:border-[#444444]">
          <Link href="/community" className="px-6 py-3 font-bold text-[#666666] hover:text-[#222222] transition-colors">취소</Link>
          <button 
            type="submit" disabled={isSubmitting}
            className="bg-[#222222] text-[#F5F4F0] border-2 border-[#222222] px-10 py-3.5 font-black shadow-[4px_4px_0px_#E5E4E0] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <span className="animate-spin material-symbols-outlined">sync</span> : null}
            {isSubmitting ? "등록 중..." : "등록하기"}
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