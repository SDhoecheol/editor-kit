'use client';
import { useState } from 'react';

// 7대 게시판 카테고리
const categories = [
  "공지사항", "자유게시판", "익명게시판", "고민상담", "포토폴리오", "Q&A", "자료실"
];

export default function CommunityPage() {
  const [activeCat, setActiveCat] = useState("전체");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* 좌측: 7개 카테고리 메뉴 (에디토리얼 사이드바) */}
        <aside className="lg:w-56 shrink-0">
          <div className="sticky top-28">
            <h2 className="text-xs font-black tracking-[0.2em] text-[#A0A0A0] mb-8 uppercase">Community</h2>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
              <button 
                onClick={() => setActiveCat("전체")}
                className={`text-left px-4 py-2.5 text-sm font-bold transition-all border-l-2 ${activeCat === "전체" ? 'border-[#222222] dark:border-[#F5F4F0] text-[#222222] dark:text-[#F5F4F0]' : 'border-transparent text-[#A0A0A0] hover:text-[#666666]'}`}
              >
                전체보기
              </button>
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`whitespace-nowrap text-left px-4 py-2.5 text-sm font-bold transition-all border-l-2 ${activeCat === cat ? 'border-[#222222] dark:border-[#F5F4F0] text-[#222222] dark:text-[#F5F4F0]' : 'border-transparent text-[#A0A0A0] hover:text-[#666666]'}`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* 우측: 정통 게시판 리스트 */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-8">
            <h1 className="text-4xl font-black text-[#222222] dark:text-[#F5F4F0] tracking-tight">{activeCat}</h1>
            <button className="px-6 py-2.5 bg-[#222222] dark:bg-[#F5F4F0] text-[#F5F4F0] dark:text-[#222222] font-bold text-sm">
              글쓰기
            </button>
          </div>

          <div className="border-t-2 border-[#222222] dark:border-[#F5F4F0]">
            {/* 게시판 헤더 (PC 전용) */}
            <div className="hidden md:flex border-b border-[#E5E4E0] dark:border-[#333333] py-3 px-4 text-[10px] font-black text-[#A0A0A0] tracking-widest uppercase text-center">
              <div className="w-20">Category</div>
              <div className="flex-1 text-left px-6">Subject</div>
              <div className="w-32">Author</div>
              <div className="w-16">Stats</div>
            </div>

            {/* 리스트 (임시 데이터 3개) */}
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex flex-col md:flex-row md:items-center py-4 px-4 border-b border-[#E5E4E0] dark:border-[#333333] hover:bg-[#F5F4F0] dark:hover:bg-[#121212] transition-colors cursor-pointer group">
                <div className="md:w-20 mb-2 md:mb-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 border border-[#E5E4E0] dark:border-[#333333] text-[#666666] dark:text-[#A0A0A0]">Q&A</span>
                </div>
                <div className="flex-1 md:px-6 mb-2 md:mb-0">
                  <h3 className="text-base font-bold text-[#222222] dark:text-[#F5F4F0] group-hover:underline underline-offset-4 decoration-1">
                    인디자인 패키지 저장 시 이미지 누락 현상 해결 방법이 있을까요?
                  </h3>
                </div>
                <div className="md:w-32 text-xs font-medium text-[#666666] dark:text-[#A0A0A0] md:text-center mb-1 md:mb-0">
                  필터링천재
                </div>
                <div className="md:w-16 text-[11px] text-[#A0A0A0] dark:text-[#666666] md:text-center">
                  12:45
                </div>
              </div>
            ))}
          </div>

          {/* 페이징 (정통 스타일) */}
          <div className="mt-12 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((p) => (
              <button key={p} className={`w-9 h-9 font-bold text-xs border ${p === 1 ? 'border-[#222222] dark:border-[#F5F4F0] bg-[#222222] dark:bg-[#F5F4F0] text-[#F5F4F0] dark:text-[#222222]' : 'border-[#E5E4E0] dark:border-[#333333] text-[#A0A0A0] hover:border-[#222222]'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}