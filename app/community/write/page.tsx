"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown"; // ⭐️ 마크다운 변환기 불러오기

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
  
  // ⭐️ 미리보기 모드 상태 추가
  const [isPreview, setIsPreview] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user && isMounted) setUser(session.user);
      } catch (error) {
        console.error("유저 정보 로딩 에러:", error);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return alert("이미지 파일만 업로드할 수 있습니다.");
    }

    setIsUploadingImage(true);

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        throw new Error("유저 인증 정보가 없습니다. 새로고침 후 다시 로그인해주세요.");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("post_images")
        .upload(fileName, file);

      if (uploadError) throw new Error(`스토리지 에러: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from("post_images")
        .getPublicUrl(fileName);

      setContent((prev: string) => prev + `\n![이미지](${publicUrl})\n`);
      
    } catch (error: any) {
      alert(`[업로드 실패] ${error.message}`);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) return alert("사용자 인증 정보를 불러오지 못했습니다.");
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력해주세요.");
    
    setIsSubmitting(true);
    try {
      const finalTitle = subCategory ? `[${subCategory}] ${title}` : title;
      const { error } = await supabase.from("posts").insert([{
        title: finalTitle, content: content, board_type: boardName, author_id: user.id, author_email: user.email,
      }]);
      if (error) throw error;
      
      alert(`[${boardName}] 게시글이 성공적으로 등록되었습니다.`);
      router.refresh(); 
      router.push("/community");
    } catch (error: any) {
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
          <div className="shrink-0 md:w-48 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] transition-colors relative">
            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full h-full px-4 py-3.5 bg-transparent font-bold text-[#222222] dark:text-[#EAEAEA] outline-none appearance-none cursor-pointer">
              <option value="">말머리 (선택)</option>
              {subCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A0A0A0]">expand_more</span>
          </div>
          <div className="flex-1 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] transition-colors">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요." className="w-full h-full px-4 py-3.5 bg-transparent font-black text-[#222222] dark:text-[#EAEAEA] outline-none placeholder-[#A0A0A0]" required />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] transition-colors flex flex-col">
          
          {/* ⭐️ 에디터 / 미리보기 탭 추가 */}
          <div className="flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#2A2A2A] px-4">
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setIsPreview(false)} 
                className={`py-3 text-sm font-black transition-colors ${!isPreview ? "text-blue-600 border-b-2 border-blue-600" : "text-[#A0A0A0] hover:text-[#222222]"}`}
              >
                에디터 (작성)
              </button>
              <button 
                type="button" 
                onClick={() => setIsPreview(true)} 
                className={`py-3 text-sm font-black transition-colors ${isPreview ? "text-blue-600 border-b-2 border-blue-600" : "text-[#A0A0A0] hover:text-[#222222]"}`}
              >
                미리보기
              </button>
            </div>

            {/* 툴바 (에디터 모드일 때만 보임) */}
            {!isPreview && (
              <div className="flex flex-wrap items-center gap-2 py-2">
                <button type="button" className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#E5E4E0] hover:text-[#222222] rounded-sm transition-colors"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage} className="w-8 h-8 flex items-center justify-center text-[#666666] hover:bg-[#E5E4E0] hover:text-[#222222] rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="이미지 첨부">
                  {isUploadingImage ? <span className="animate-spin material-symbols-outlined text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">image</span>}
                </button>
              </div>
            )}
          </div>

          <div className="relative min-h-[400px]">
            {/* ⭐️ 미리보기 모드일 때는 ReactMarkdown 컴포넌트로 렌더링 */}
            {isPreview ? (
              <div className="absolute inset-0 w-full h-full p-6 overflow-y-auto bg-transparent text-[#222222] dark:text-[#EAEAEA] prose prose-sm max-w-none dark:prose-invert prose-img:max-w-full prose-img:rounded-md prose-img:border-2 prose-img:border-[#222222]">
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className="text-[#A0A0A0] italic">미리볼 내용이 없습니다.</p>
                )}
              </div>
            ) : (
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="absolute inset-0 w-full h-full p-6 bg-transparent font-medium text-[#222222] dark:text-[#EAEAEA] outline-none resize-none leading-relaxed placeholder-[#A0A0A0]" 
                placeholder="내용을 작성해주세요. 마크다운(Markdown) 형식을 지원하며, 사진 아이콘을 눌러 이미지를 첨부할 수 있습니다." 
                required 
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t-4 border-[#222222] dark:border-[#444444]">
          <Link href="/community" className="px-6 py-3 font-bold text-[#666666] hover:text-[#222222] transition-colors">취소</Link>
          <button type="submit" disabled={isSubmitting || isUploadingImage} className="bg-[#222222] text-[#F5F4F0] border-2 border-[#222222] px-10 py-3.5 font-black shadow-[4px_4px_0px_#E5E4E0] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
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