"use client";

import Link from "next/link";

export default function HomePage() {
  // 기획 3.5: 핵심 4개 게시판 데이터 (샘플)
  const communityPreviews = [
    { 
      id: "공지사항", 
      title: "공지사항", 
      icon: "campaign",
      posts: [
        "커뮤니티 이용 규칙 및 잉크 보상 시스템 안내",
        "에디터킷 v2.2 업데이트 노트",
        "신규 3D 목업 툴 베타 테스터 모집"
      ]
    },
    { 
      id: "자유게시판", 
      title: "자유게시판", 
      icon: "forum",
      posts: [
        "요즘 종이값 정말 장난 아니네요...",
        "인디자인 단축키 꿀팁 공유합니다",
        "신입 디자이너 포트폴리오 봐주실 분?"
      ]
    },
    { 
      id: "포트폴리오", 
      title: "포트폴리오", 
      icon: "photo_library",
      posts: [
        "카페 브랜딩 및 패키지 디자인 작업물",
        "독립출판물 내지 편집 디자인",
        "고급 와인 라벨 디자인 시안"
      ]
    },
    { 
      id: "Q&A", 
      title: "Q&A", 
      icon: "quiz",
      posts: [
        "별색 인쇄 시 오버프린트 설정 질문",
        "PDF 내보내기 시 이미지 깨짐 현상",
        "두꺼운 용지 조판 시 도련 여유 얼마나 주시나요?"
      ]
    }
  ];

  // 핵심 유틸리티 퀵 링크
  const quickTools = [
    { title: "세네카 계산", href: "/tools/seneca", icon: "menu_book" },
    { title: "자동 조판", href: "/tools/harikomi", icon: "grid_on" },
    { title: "용지 수율", href: "/tools/yieldcalc", icon: "calculate" },
    { title: "3D 목업", href: "/tools/mockup3d", icon: "view_in_ar" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-16">
      
      {/* 1. Hero Section: 서비스의 정체성 */}
      <section className="space-y-6">
        <div className="inline-block bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase shadow-[4px_4px_0px_#A0A0A0]">
          The Professional Workspace
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tighter leading-tight">
          인쇄와 디자인을 <br />
          <span className="text-[#4F46E5] dark:text-[#818CF8]">가장 완벽하게</span> 잇다.
        </h1>
        <p className="max-w-2xl text-lg font-bold text-[#666666] dark:text-[#A0A0A0] leading-relaxed">
          실무자를 위한 정교한 계산기부터 3D 가제본 검수, <br />
          전문가들의 실시간 소통까지. 에디터킷은 당신의 실무를 한 단계 높입니다.
        </p>
      </section>

      {/* 2. Quick Utility Cards: 핵심 툴 바로가기 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickTools.map((tool) => (
          <Link 
            key={tool.title} 
            href={tool.href}
            className="group bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] p-6 shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex flex-col items-center justify-center gap-3 text-center"
          >
            <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">
              {tool.icon}
            </span>
            <span className="font-black text-sm">{tool.title}</span>
          </Link>
        ))}
      </section>

      {/* 3. Community Dashboard: 기획 3.5 반영 (2x2 그리드) */}
      <section className="space-y-8">
        <div className="flex justify-between items-end border-b-4 border-[#222222] dark:border-[#444444] pb-4">
          <h2 className="text-3xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            라운지 트렌드
          </h2>
          <Link href="/community" className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA] flex items-center gap-1 transition-colors">
            전체 커뮤니티 보기 <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {communityPreviews.map((board) => (
            <Link 
              key={board.id} 
              href={`/community?cat=${board.id}`}
              className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all overflow-hidden"
            >
              {/* 게시판 제목 바 */}
              <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] border-b-2 border-[#222222] dark:border-[#444444] px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#4F46E5] dark:text-[#818CF8]">
                    {board.icon}
                  </span>
                  <span className="font-black text-sm tracking-tight">{board.title}</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-[#A0A0A0]">add</span>
              </div>
              
              {/* 최신글 목록 3개 (기획대로 5개로 확장 가능) */}
              <ul className="p-5 space-y-3">
                {board.posts.map((post, idx) => (
                  <li key={idx} className="flex items-center gap-2 group/item">
                    <span className="w-1 h-1 bg-[#E5E4E0] dark:bg-[#444444] rounded-full"></span>
                    <span className="text-sm font-bold text-[#666666] dark:text-[#A0A0A0] group-hover/item:text-[#222222] dark:group-hover/item:text-[#EAEAEA] transition-colors truncate">
                      {post}
                    </span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Footer Placeholder */}
      <footer className="pt-20 border-t-2 border-[#E5E4E0] dark:border-[#333333] flex flex-col md:flex-row justify-between gap-8 opacity-50">
        <div className="space-y-2">
          <h3 className="font-black text-xl tracking-tighter">EditorKit</h3>
          <p className="text-xs font-bold">© 2026 EditorKit Project. All rights reserved.</p>
        </div>
        <div className="flex gap-6 text-xs font-bold">
          <span>이용약관</span>
          <span>개인정보처리방침</span>
          <span>제휴문의</span>
        </div>
      </footer>

    </div>
  );
}