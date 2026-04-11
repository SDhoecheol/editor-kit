"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// 게시판별 말머리(서브 카테고리) 데이터
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
  
  // URL에서 board 파라미터를 읽어오거나, 없으면 기본값 '자유게시판' 할당
  const boardName = searchParams?.get("board") || "자유게시판";
  const subCats = SUB_CATEGORIES[boardName] || SUB_CATEGORIES["자유게시판"];

  const [subCategory, setSubCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 말머리 검사 제거 (선택사항으로 변경)
    if (!title.trim()) return alert("제목을 입력해주세요.");
    if (!content.trim()) return alert("내용을 입력해주세요.");
    
    // (여기에 Supabase 업로드 및 DB Insert 로직 추가 예정)
    alert(`[${boardName}] 게시글이 등록되었습니다.`);
    router.push("/community");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-8">
      
      {/* 상단 헤더: 현재 게시판 명확하고 크게 표시 */}
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
            에디터킷 라운지
          </span>
          <span className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] tracking-widest">
            새 게시글 작성
          </span>
        </div>
        <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight flex items-center gap-3">
          <span className="text-blue-600 dark:text-blue-400">{boardName}</span>
          <span>글쓰기</span>
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. 말머리 및 제목 입력 영역 */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* 말머리 (선택사항으로 변경) */}
          <div className="shrink-0 md:w-48 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] transition-colors relative">
            <select 
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full h-full px-4 py-3.5 bg-transparent font-bold text-[#222222] dark:text-[#EAEAEA] outline-none appearance-none cursor-pointer"
            >
              <option value="">말머리 (선택)</option>
              {subCats.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A0A0A0]">expand_more</span>
          </div>

          {/* 글 제목 */}
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

        {/* 2. 에디터 영역 (WYSIWYG) */}
        <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] transition-colors flex flex-col">
          
          {/* 에디터 툴바 */}
          <div className="border-b-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#2A2A2A] px-4 py-2 flex flex-wrap items-center gap-2">
            <button type="button" className="w-8 h-8 flex items-center justify-center text-[#666666] dark:text-[#A0A0A0] hover:bg-[#E5E4E0] dark:hover:bg-[#444444] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors border border-transparent rounded-sm" title="굵게">
              <span className="material-symbols-outlined text-[18px]">format_bold</span>
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center text-[#666666] dark:text-[#A0A0A0] hover:bg-[#E5E4E0] dark:hover:bg-[#444444] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors border border-transparent rounded-sm" title="기울임">
              <span className="material-symbols-outlined text-[18px]">format_italic</span>
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center text-[#666666] dark:text-[#A0A0A0] hover:bg-[#E5E4E0] dark:hover:bg-[#444444] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors border border-transparent rounded-sm" title="글머리 기호">
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            </button>
            <div className="w-px h-5 bg-[#A0A0A0] dark:bg-[#666666] mx-1"></div>
            <button type="button" className="w-8 h-8 flex items-center justify-center text-[#666666] dark:text-[#A0A0A0] hover:bg-[#E5E4E0] dark:hover:bg-[#444444] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors border border-transparent rounded-sm" title="링크 삽입">
              <span className="material-symbols-outlined text-[18px]">link</span>
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center text-[#666666] dark:text-[#A0A0A0] hover:bg-[#E5E4E0] dark:hover:bg-[#444444] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors border border-transparent rounded-sm" title="이미지 첨부 (클립보드 지원)">
              <span className="material-symbols-outlined text-[18px]">image</span>
            </button>
          </div>

          {/* 에디터 본문 */}
          <div className="relative min-h-[400px]">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 bg-transparent font-medium text-[#222222] dark:text-[#EAEAEA] outline-none resize-none leading-relaxed placeholder-[#A0A0A0] dark:placeholder-[#666666]"
              placeholder="내용을 작성해주세요. 이미지는 드래그 앤 드롭하거나 클립보드(Ctrl+V)로 바로 붙여넣을 수 있습니다."
              required
            />
          </div>
          
          {/* 포트폴리오 게시판 전용 안내 */}
          {boardName === "포트폴리오" && (
            <div className="bg-blue-50 dark:bg-[#1A233A] border-t-2 border-[#222222] dark:border-[#444444] px-6 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">info</span>
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300">포트폴리오 게시판은 최소 1장 이상의 이미지를 첨부해야 등록이 가능합니다.</span>
            </div>
          )}
        </div>

        {/* 3. 자료실 전용 원본 파일 첨부 영역 */}
        {boardName === "자료실" && (
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-dashed border-[#222222] dark:border-[#444444] p-8 hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer text-center relative group">
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <span className="material-symbols-outlined text-4xl text-[#A0A0A0] dark:text-[#666666] mb-2 group-hover:text-[#222222] dark:group-hover:text-[#EAEAEA] transition-colors">folder_zip</span>
            <h4 className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">실무 원본 파일 첨부 (ZIP, AI, PDF 등)</h4>
            <p className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mt-1">클릭하거나 파일을 이곳에 드래그하세요. (최대 50MB)</p>
          </div>
        )}

        {/* 4. 하단 액션 버튼 */}
        <div className="flex items-center justify-between pt-6 border-t-4 border-[#222222] dark:border-[#444444]">
          <Link 
            href="/community"
            className="px-6 py-3 font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors"
          >
            취소
          </Link>
          
          {/* 깔끔해진 등록하기 버튼 */}
          <button 
            type="submit"
            className="bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] px-10 py-3.5 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center justify-center text-base"
          >
            등록하기
          </button>
        </div>

      </form>
    </div>
  );
}

// Next.js 13+ 에서는 useSearchParams를 사용할 때 Suspense 로 감싸는 것을 권장합니다.
export default function CommunityWritePage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-bold">로딩 중...</div>}>
      <WriteEditorForm />
    </Suspense>
  );
}