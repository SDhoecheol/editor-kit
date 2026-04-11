"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CommunityDetailPage() {
  const params = useParams();
  const postId = params?.id || "1042";

  // 임시 더미 데이터
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(24);
  const [commentInput, setCommentInput] = useState("");

  const handleLikeToggle = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return alert("댓글 내용을 입력해주세요.");
    alert("댓글이 등록되었습니다.");
    setCommentInput("");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-8">
      
      {/* 1. 상단 네비게이션 및 게시판 이름 */}
      <div className="flex items-center justify-between pb-4 border-b-4 border-[#222222] dark:border-[#444444]">
        <h1 className="text-2xl font-black text-[#222222] dark:text-[#EAEAEA] flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">tag</span>
          Q&A 게시판
        </h1>
        <Link href="/community" className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">list</span> 목록으로
        </Link>
      </div>

      {/* 2. 게시글 헤더 (제목 및 메타 정보) */}
      <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] transition-colors">
        
        {/* 제목 영역 */}
        <div className="p-6 border-b-2 border-[#E5E4E0] dark:border-[#333333]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-black px-2 py-0.5 border-2 border-[#222222] dark:border-[#A0A0A0] text-[#222222] dark:text-[#EAEAEA]">
              인쇄
            </span>
            <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 tracking-widest">
              해결됨
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#222222] dark:text-[#EAEAEA] leading-snug">
            인디자인 패키지 저장 시 이미지 누락 현상 해결 방법이 있을까요?
          </h2>
        </div>

        {/* 작성자 및 통계 정보 */}
        <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] font-black flex items-center justify-center text-sm">
              필
            </div>
            <div>
              <p className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] flex items-center gap-1 cursor-pointer hover:underline">
                필터링천재 
                <span className="bg-blue-600 text-white px-1 py-0.5 text-[8px] font-black tracking-widest rounded-sm ml-1">ID</span>
              </p>
              <p className="text-[11px] font-bold text-[#A0A0A0] dark:text-[#666666]">2026.04.11 12:45</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-[#A0A0A0] dark:text-[#666666]">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">visibility</span> 조회 234</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">chat_bubble</span> 댓글 12</span>
          </div>
        </div>

        {/* 3. 본문 내용 영역 */}
        <div className="p-8 min-h-[300px] text-[15px] leading-relaxed text-[#222222] dark:text-[#EAEAEA] font-medium whitespace-pre-wrap">
          안녕하세요, 급하게 외주 작업을 넘겨야 하는데 문제가 생겨서 질문 남깁니다.<br/><br/>
          인디자인에서 작업을 마치고 '패키지(Package)' 기능으로 폴더를 생성했는데, Links 폴더 안에 일부 이미지가 누락되어 있습니다. <br/>
          분명히 작업 창에서는 링크 누락 에러(빨간색 물음표)가 안 뜨고 정상적으로 연결되어 있는데, 왜 패키지로만 뽑으면 특정 PSD 파일들만 빠지는 걸까요?<br/><br/>
          혹시 비슷한 증상 겪어보신 분 계시면 해결책 부탁드립니다. 감사합니다 ㅠㅠ
        </div>

        {/* 4. 추천(좋아요) 버튼 */}
        <div className="flex justify-center py-10 border-t-2 border-dashed border-[#E5E4E0] dark:border-[#333333]">
          <button 
            onClick={handleLikeToggle}
            className={`flex flex-col items-center justify-center w-24 h-24 border-2 transition-all hover:-translate-y-1 ${
              liked 
                ? 'border-blue-600 bg-blue-50 dark:bg-[#1A233A] text-blue-600 dark:text-blue-400 shadow-[4px_4px_0px_#2563eb]' 
                : 'border-[#222222] dark:border-[#EAEAEA] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#EAEAEA]'
            }`}
          >
            <span className={`material-symbols-outlined text-3xl mb-1 ${liked ? 'fill-current' : ''}`}>
              thumb_up
            </span>
            <span className="font-black text-lg">{likesCount}</span>
          </button>
        </div>
      </div>

      {/* 5. 액션 버튼 (수정/삭제) */}
      <div className="flex justify-end gap-2">
        <button className="px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
          수정
        </button>
        <button className="px-4 py-2 border-2 border-red-600 bg-white dark:bg-[#1E1E1E] text-red-600 text-sm font-bold hover:bg-red-50 dark:hover:bg-[#3A1A1A] transition-colors">
          삭제
        </button>
      </div>

      {/* 6. 댓글 영역 (Depth 1) */}
      <div className="pt-8">
        <h3 className="text-lg font-black text-[#222222] dark:text-[#EAEAEA] mb-4 flex items-center gap-2">
          댓글 <span className="text-blue-600 dark:text-blue-400">12</span>
        </h3>

        {/* 댓글 입력 폼 */}
        <form onSubmit={handleCommentSubmit} className="flex flex-col md:flex-row gap-2 mb-8">
          <textarea 
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="상호 존중하는 댓글 문화를 만들어가요."
            className="flex-1 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] p-4 resize-none h-24 outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] transition-shadow placeholder-[#A0A0A0] dark:placeholder-[#666666] font-medium"
          />
          <button type="submit" className="md:w-32 bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] font-black text-sm py-4 md:py-0 hover:opacity-90 transition-opacity">
            등록하기
          </button>
        </form>

        {/* 댓글 리스트 */}
        <div className="border-t-2 border-[#222222] dark:border-[#444444]">
          {/* 본인 댓글 예시 */}
          <div className="py-6 border-b border-[#E5E4E0] dark:border-[#333333]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#222222] dark:text-[#EAEAEA] text-sm">인쇄장인김씨</span>
              </div>
              <span className="text-[11px] font-bold text-[#A0A0A0] dark:text-[#666666]">10분 전</span>
            </div>
            <p className="text-[14px] text-[#222222] dark:text-[#EAEAEA] font-medium leading-relaxed">
              혹시 링크 패널에서 구름 모양 아이콘(클라우드 동기화) 떠있는지 확인해보세요. CC 라이브러리 이미지면 로컬로 다운로드 안 받아져서 패키지 폴더에 안 들어가는 경우가 종종 있습니다.
            </p>
          </div>

          {/* 글 작성자의 대댓글(채택됨) 예시 */}
          <div className="py-6 border-b border-[#E5E4E0] dark:border-[#333333] bg-blue-50/50 dark:bg-[#1A233A]/30 px-4 -mx-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#222222] dark:text-[#EAEAEA] text-sm">필터링천재</span>
                {/* 작성자 강조 뱃지 */}
                <span className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] px-1.5 py-0.5 text-[9px] font-black tracking-widest border border-[#222222] dark:border-[#EAEAEA]">작성자</span>
              </div>
              <span className="text-[11px] font-bold text-[#A0A0A0] dark:text-[#666666]">5분 전</span>
            </div>
            <p className="text-[14px] text-[#222222] dark:text-[#EAEAEA] font-medium leading-relaxed">
              헐 맞네요! 클라우드 문서로 들어가 있어서 그랬나 봅니다 ㅠㅠ 로컬로 임베드 시키고 다시 뽑으니까 정상적으로 다 들어갑니다! 감사합니다 선생님!!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}